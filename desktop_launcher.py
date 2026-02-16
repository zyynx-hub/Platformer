import os
import sys
import json
import traceback
from datetime import datetime
import ctypes
import tempfile
import threading
import subprocess
import time
import hashlib
import urllib.request
import urllib.error
import urllib.parse
import ssl
import webbrowser
import webview

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
USER_LOG_DIR = os.path.join(os.environ.get("LOCALAPPDATA", tempfile.gettempdir()), "AnimePlatformer")
LOG_PATH = os.path.join(USER_LOG_DIR, "runtime-debug.log")
USER_UPDATER_LOG_PATH = os.path.join(USER_LOG_DIR, "updater.log")
UPDATE_STATE_PATH = os.path.join(USER_LOG_DIR, "update_state.json")
SETTINGS_PATH = os.path.join(USER_LOG_DIR, "settings.json")
_WINDOW_STYLE_STATE = {"saved": False, "style": 0, "exstyle": 0, "rect": None}

# Win32 constants
GWL_STYLE = -16
GWL_EXSTYLE = -20
WS_OVERLAPPEDWINDOW = 0x00CF0000
WS_POPUP = 0x80000000
SWP_NOZORDER = 0x0004
SWP_NOACTIVATE = 0x0010
SWP_FRAMECHANGED = 0x0020
SW_RESTORE = 9
FIXED_FULLSCREEN_W = 1960
FIXED_FULLSCREEN_H = 1080
FIXED_WINDOWED_W = 1377
FIXED_WINDOWED_H = 727


class RECT(ctypes.Structure):
    _fields_ = [
        ("left", ctypes.c_long),
        ("top", ctypes.c_long),
        ("right", ctypes.c_long),
        ("bottom", ctypes.c_long),
    ]


class MONITORINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", ctypes.c_ulong),
        ("rcMonitor", RECT),
        ("rcWork", RECT),
        ("dwFlags", ctypes.c_ulong),
    ]


def host_log(level, source, message):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [{level}] {source}: {message}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass
    # Best-effort mirror beside launcher script for local dev visibility.
    try:
        side_log = os.path.join(ROOT_DIR, "runtime-debug.log")
        with open(side_log, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def get_game_root_dir():
    try:
        if getattr(sys, "frozen", False):
            return os.path.dirname(os.path.abspath(sys.executable))
    except Exception:
        pass
    return ROOT_DIR


def get_updater_log_path(target_exe=None):
    try:
        if target_exe:
            return os.path.join(os.path.dirname(os.path.abspath(target_exe)), "updater.log")
    except Exception:
        pass
    return os.path.join(get_game_root_dir(), "updater.log")


def ensure_user_log_dir():
    try:
        os.makedirs(USER_LOG_DIR, exist_ok=True)
    except Exception:
        pass


def read_update_state():
    try:
        if not os.path.exists(UPDATE_STATE_PATH):
            return {}
        with open(UPDATE_STATE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def write_update_state(data: dict):
    try:
        with open(UPDATE_STATE_PATH, "w", encoding="utf-8") as f:
            json.dump(data or {}, f)
    except Exception as e:
        host_log("WARN", "Updater.state", f"Failed to write state: {e}")


def clear_update_state():
    try:
        if os.path.exists(UPDATE_STATE_PATH):
            os.remove(UPDATE_STATE_PATH)
    except Exception:
        pass


def set_dpi_awareness():
    try:
        # Windows 10+: per-monitor v2 awareness for crisp rendering.
        ctypes.windll.user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
        host_log("INFO", "Launcher", "DPI awareness: Per-Monitor V2")
        return
    except Exception:
        pass
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
        host_log("INFO", "Launcher", "DPI awareness: Per-Monitor")
        return
    except Exception:
        pass
    try:
        ctypes.windll.user32.SetProcessDPIAware()
        host_log("INFO", "Launcher", "DPI awareness: System")
    except Exception as e:
        host_log("WARN", "Launcher", f"Failed to set DPI awareness: {e}")


def get_primary_monitor_resolution():
    try:
        user32 = ctypes.windll.user32
        width = int(user32.GetSystemMetrics(0))
        height = int(user32.GetSystemMetrics(1))
        if width >= 800 and height >= 600:
            return width, height
    except Exception as e:
        host_log("WARN", "Launcher", f"Resolution probe failed: {e}")
    return 1920, 1080


def _find_main_window_handle():
    try:
        hwnd = ctypes.windll.user32.FindWindowW(None, "Anime Platformer")
        if hwnd:
            return hwnd
    except Exception:
        pass
    return 0


def _save_window_style_state(hwnd):
    global _WINDOW_STYLE_STATE
    if not hwnd or _WINDOW_STYLE_STATE["saved"]:
        return
    rect = RECT()
    ctypes.windll.user32.GetWindowRect(hwnd, ctypes.byref(rect))
    _WINDOW_STYLE_STATE = {
        "saved": True,
        "style": int(ctypes.windll.user32.GetWindowLongW(hwnd, GWL_STYLE)),
        "exstyle": int(ctypes.windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)),
        "rect": (int(rect.left), int(rect.top), int(rect.right), int(rect.bottom)),
    }


def _get_monitor_rect(hwnd, use_work_area=False):
    monitor = ctypes.windll.user32.MonitorFromWindow(hwnd, 2)  # MONITOR_DEFAULTTONEAREST
    mi = MONITORINFO()
    mi.cbSize = ctypes.sizeof(MONITORINFO)
    ctypes.windll.user32.GetMonitorInfoW(monitor, ctypes.byref(mi))
    r = mi.rcWork if use_work_area else mi.rcMonitor
    return int(r.left), int(r.top), int(r.right), int(r.bottom)


def _center_rect_in_monitor(hwnd, width, height):
    left, top, right, bottom = _get_monitor_rect(hwnd, use_work_area=True)
    mon_w = max(800, right - left)
    mon_h = max(600, bottom - top)
    w = min(max(800, int(width)), mon_w)
    h = min(max(600, int(height)), mon_h)
    x = left + max(0, (mon_w - w) // 2)
    y = top + max(0, (mon_h - h) // 2)
    return x, y, w, h


def _sanitize_resolution(width, height, fallback_w, fallback_h):
    try:
        w = int(width)
        h = int(height)
    except Exception:
        return int(fallback_w), int(fallback_h)
    if w < 800 or h < 600:
        return int(fallback_w), int(fallback_h)
    # Clamp max to 4K target for selectable presets.
    return min(w, 3840), min(h, 2160)


def _apply_window_mode_native(mode, target_width=None, target_height=None):
    hwnd = _find_main_window_handle()
    if not hwnd:
        return {"ok": False, "message": "Game window handle not found."}
    _save_window_style_state(hwnd)

    user32 = ctypes.windll.user32
    mode = str(mode or "fullscreen").strip().lower()
    if mode not in ("windowed", "borderless", "fullscreen"):
        mode = "fullscreen"
    target_w, target_h = _sanitize_resolution(
        target_width, target_height, FIXED_FULLSCREEN_W, FIXED_FULLSCREEN_H
    )

    if mode == "windowed":
        user32.SetWindowLongW(hwnd, GWL_STYLE, WS_OVERLAPPEDWINDOW)
        user32.SetWindowLongW(hwnd, GWL_EXSTYLE, 0)
        fallback_w, fallback_h = FIXED_WINDOWED_W, FIXED_WINDOWED_H
        req_w, req_h = _sanitize_resolution(target_w, target_h, fallback_w, fallback_h)
        x, y, width, height = _center_rect_in_monitor(hwnd, req_w, req_h)
        user32.SetWindowPos(hwnd, 0, x, y, width, height, SWP_NOZORDER | SWP_FRAMECHANGED | SWP_NOACTIVATE)
        user32.ShowWindow(hwnd, SW_RESTORE)
        return {"ok": True, "mode": "windowed", "fullscreen": False, "width": width, "height": height}

    if mode == "fullscreen":
        style = int(user32.GetWindowLongW(hwnd, GWL_STYLE))
        style = (style & ~WS_OVERLAPPEDWINDOW) | WS_POPUP
        user32.SetWindowLongW(hwnd, GWL_STYLE, style)
        user32.SetWindowLongW(hwnd, GWL_EXSTYLE, 0)
        x, y, width, height = _center_rect_in_monitor(hwnd, target_w, target_h)
        user32.SetWindowPos(hwnd, 0, x, y, width, height, SWP_NOZORDER | SWP_FRAMECHANGED | SWP_NOACTIVATE)
        user32.ShowWindow(hwnd, SW_RESTORE)
        return {"ok": True, "mode": "fullscreen", "fullscreen": True, "width": width, "height": height}

    # "borderless" per user preference: keep borders while applying chosen resolution.
    user32.SetWindowLongW(hwnd, GWL_STYLE, WS_OVERLAPPEDWINDOW)
    user32.SetWindowLongW(hwnd, GWL_EXSTYLE, 0)
    x, y, width, height = _center_rect_in_monitor(hwnd, target_w, target_h)
    user32.SetWindowPos(hwnd, 0, x, y, width, height, SWP_NOZORDER | SWP_FRAMECHANGED | SWP_NOACTIVATE)
    user32.ShowWindow(hwnd, SW_RESTORE)
    return {"ok": True, "mode": "borderless", "fullscreen": False, "width": width, "height": height}


def maybe_restore_failed_update():
    state = read_update_state()
    if not state or not state.get("pending"):
        return

    crash_count = int(state.get("crashCount", 0)) + 1
    state["crashCount"] = crash_count
    write_update_state(state)
    host_log("WARN", "Updater.health", f"Pending update health check count={crash_count}")

    if crash_count < 3:
        return

    target = str(state.get("targetExe") or "")
    backup = str(state.get("backupExe") or "")
    if target and backup and os.path.exists(backup):
        try:
            subprocess.run(["cmd", "/c", "copy", "/Y", backup, target], check=False, capture_output=True)
            host_log("WARN", "Updater.health", "Rollback applied from backup after repeated startup failures.")
        except Exception as e:
            host_log("ERROR", "Updater.health", f"Rollback failed: {e}")
    clear_update_state()


def mark_update_healthy_later():
    def _mark():
        state = read_update_state()
        if state and state.get("pending"):
            host_log("INFO", "Updater.health", "Startup healthy; clearing pending update marker.")
            clear_update_state()
    t = threading.Timer(20.0, _mark)
    t.daemon = True
    t.start()


class Api:
    def __init__(self):
        self._update_lock = threading.Lock()
        self._update_state = {
            "stage": "idle",
            "progress": 0.0,
            "message": "Idle",
            "downloadedPath": "",
            "url": "",
        }
        self._download_thread = None
        self._direct_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    def exit_app(self):
        webview.windows[0].destroy()

    def set_fullscreen(self, enabled):
        try:
            target = "fullscreen" if bool(enabled) else "windowed"
            native = _apply_window_mode_native(target)
            if native.get("ok"):
                win = webview.windows[0]
                try:
                    if target == "windowed" and bool(win.fullscreen):
                        win.toggle_fullscreen()
                    if target != "windowed" and not bool(win.fullscreen):
                        win.toggle_fullscreen()
                except Exception:
                    pass
                try:
                    win.evaluate_js(
                        "(function(){"
                        "const fire=()=>window.dispatchEvent(new Event('resize'));"
                        "fire();"
                        "setTimeout(fire,80);"
                        "setTimeout(fire,220);"
                        "setTimeout(fire,420);"
                        "})();"
                    )
                except Exception:
                    pass
                return native
            # fallback
            win = webview.windows[0]
            if bool(win.fullscreen) != bool(enabled):
                win.toggle_fullscreen()
            try:
                win.evaluate_js(
                    "(function(){"
                    "const fire=()=>window.dispatchEvent(new Event('resize'));"
                    "fire();"
                    "setTimeout(fire,80);"
                    "setTimeout(fire,220);"
                    "setTimeout(fire,420);"
                    "})();"
                )
            except Exception:
                pass
            return {"ok": True, "fullscreen": bool(win.fullscreen)}
        except Exception as e:
            return {"ok": False, "message": str(e)}

    def set_window_mode(self, mode, width=None, height=None):
        try:
            result = _apply_window_mode_native(mode, width, height)
            if result.get("ok"):
                try:
                    win = webview.windows[0]
                    want_full = str(mode).lower() == "fullscreen"
                    if bool(win.fullscreen) != want_full:
                        win.toggle_fullscreen()
                except Exception:
                    pass
                try:
                    webview.windows[0].evaluate_js(
                        "(function(){"
                        "const fire=()=>window.dispatchEvent(new Event('resize'));"
                        "fire(); setTimeout(fire,80); setTimeout(fire,220); setTimeout(fire,420);"
                        "})();"
                    )
                except Exception:
                    pass
                host_log("INFO", "WindowMode", f"Applied mode={result.get('mode')}")
            return result
        except Exception as e:
            return {"ok": False, "message": str(e)}

    def get_window_size(self):
        try:
            win = webview.windows[0]
            return {"ok": True, "width": int(win.width), "height": int(win.height), "fullscreen": bool(win.fullscreen)}
        except Exception as e:
            return {"ok": False, "message": str(e)}

    def open_url(self, url):
        try:
            if not url:
                return {"ok": False, "message": "URL is empty."}
            parsed = urllib.parse.urlparse(str(url))
            if parsed.scheme != "https" or parsed.netloc.lower() != "github.com":
                return {"ok": False, "message": "Blocked URL: only https://github.com is allowed."}
            webbrowser.open(url)
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "message": str(e)}

    def log_event(self, level, source, message):
        lvl = str(level or "INFO").upper()
        src = str(source or "runtime")
        msg = str(message or "")
        host_log(lvl, src, msg)
        return {"ok": True}

    def read_settings_blob(self):
        try:
            if not os.path.exists(SETTINGS_PATH):
                return {"ok": True, "data": ""}
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                data = f.read()
            return {"ok": True, "data": data}
        except Exception as e:
            host_log("WARN", "Settings.read", f"{type(e).__name__}: {e}")
            return {"ok": False, "message": str(e), "data": ""}

    def write_settings_blob(self, data):
        try:
            raw = str(data or "")
            if len(raw) > 200_000:
                return {"ok": False, "message": "Settings payload too large."}
            parsed = json.loads(raw)
            if not isinstance(parsed, dict):
                return {"ok": False, "message": "Settings payload must be a JSON object."}
            with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
                f.write(raw)
            return {"ok": True}
        except Exception as e:
            host_log("WARN", "Settings.write", f"{type(e).__name__}: {e}")
            return {"ok": False, "message": str(e)}

    def check_update(self, manifest_url, current_version):
        return {"ok": False, "message": "Legacy update endpoint disabled. Use GitHub Releases updater."}

    def check_update_github(self, repo, current_version, channel="stable"):
        repo = str(repo or "").strip()
        if not repo or "/" not in repo:
            return {"ok": False, "message": "Updates not configured by developer."}
        try:
            payload = self._fetch_github_release(repo, channel)
            latest = str(payload.get("tag_name") or payload.get("name") or current_version or "0.0.0").strip()
            download_url, checksum_sha256 = self._choose_release_assets(payload)
            has_update = self._compare_versions(latest, current_version or "0.0.0") > 0
            return {
                "ok": True,
                "hasUpdate": has_update,
                "latestVersion": latest,
                "downloadUrl": download_url,
                "checksumSha256": checksum_sha256,
                "releaseNotes": str(payload.get("body", "")),
                "releasePublishedAt": str(payload.get("published_at", "")),
                "message": f"Update found ({latest})." if has_update else "You're up to date.",
            }
        except urllib.error.HTTPError as e:
            if e.code == 403:
                return {"ok": False, "message": "Update server busy, try later."}
            if e.code == 404:
                return {"ok": False, "message": "No public release found yet."}
            return {"ok": False, "message": f"Can't reach update server (HTTP {e.code})."}
        except Exception as e:
            host_log("ERROR", "Updater.check_update_github", f"{type(e).__name__}: {e}")
            return {"ok": False, "message": f"Can't reach update server: {e}"}

    def start_update_download(self, download_url, checksum_sha256=""):
        with self._update_lock:
            if self._download_thread and self._download_thread.is_alive():
                return {"ok": False, "message": "Update download already in progress."}
            if not download_url:
                return {"ok": False, "message": "Download URL is empty."}

            self._update_state = {
                "stage": "downloading",
                "progress": 0.0,
                "message": "Starting download...",
                "downloadedPath": "",
                "url": str(download_url),
                "checksumSha256": str(checksum_sha256 or "").strip().lower(),
            }

            self._download_thread = threading.Thread(
                target=self._download_update_worker,
                args=(str(download_url), str(checksum_sha256 or "").strip().lower()),
                daemon=True,
            )
            self._download_thread.start()
            host_log("INFO", "Updater", f"Download started: {download_url}")
            return {"ok": True, "message": "Download started."}

    def get_update_progress(self):
        with self._update_lock:
            return {
                "ok": True,
                "stage": self._update_state.get("stage", "idle"),
                "progress": float(self._update_state.get("progress", 0.0)),
                "message": self._update_state.get("message", ""),
                "downloadedPath": self._update_state.get("downloadedPath", ""),
            }

    def apply_downloaded_update(self):
        with self._update_lock:
            stage = self._update_state.get("stage", "idle")
            downloaded_path = self._update_state.get("downloadedPath", "")

        if stage != "downloaded" or not downloaded_path or not os.path.exists(downloaded_path):
            return {"ok": False, "message": "No downloaded update available to apply."}

        target_exe = self._get_target_exe_path()
        if not target_exe:
            return {"ok": False, "message": "Cannot determine current executable path."}

        backup_exe = f"{target_exe}.bak"
        updater_log_path = get_updater_log_path(target_exe)
        updater_bat = self._write_updater_script(
            target_exe,
            downloaded_path,
            backup_exe,
            os.getpid(),
            updater_log_path,
        )
        if not updater_bat:
            return {"ok": False, "message": "Failed to create updater helper script."}

        try:
            write_update_state({
                "pending": True,
                "crashCount": 0,
                "targetExe": target_exe,
                "backupExe": backup_exe,
                "downloadedExe": downloaded_path,
                "updatedAt": datetime.utcnow().isoformat() + "Z",
            })
            host_log("INFO", "Updater", f"Helper log expected at: {updater_log_path}")
            host_log("INFO", "Updater", f"Launching helper: {updater_bat}")
            # small delay to ensure the script file is fully committed to disk
            try:
                time.sleep(0.2)
            except Exception:
                pass
            launched = False
            # Keep launch flags minimal to avoid WinError 87 / fallback shell window.
            detached_flags = (
                getattr(subprocess, "DETACHED_PROCESS", 0x00000008)
                | getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0x00000200)
                | getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
            )
            # Try a few launch styles; prefer `start` which creates a detached process reliably.
            launch_attempts = [
                ["cmd", "/c", "start", "", updater_bat],
                ["cmd", "/c", updater_bat],
            ]
            for cmd in launch_attempts:
                try:
                    host_log("INFO", "Updater", f"Helper launch attempt: {' '.join(cmd)}")
                    proc = subprocess.Popen(cmd, creationflags=detached_flags, close_fds=True)
                    if getattr(proc, "pid", 0):
                        launched = True
                        host_log("INFO", "Updater", f"Helper launch ok: {' '.join(cmd)} pid={proc.pid}")
                        break
                except OSError as e:
                    if getattr(e, "winerror", None) == 87:
                        host_log("WARN", "Updater", f"WinError 87 launching helper: {' '.join(cmd)}")
                        continue
                    host_log("WARN", "Updater", f"OSError launching helper ({' '.join(cmd)}): {e}")
                except Exception as e:
                    host_log("WARN", "Updater", f"Exception launching helper ({' '.join(cmd)}): {e}")

            if not launched:
                return {"ok": False, "message": f"Failed to launch updater helper. Check {LOG_PATH}"}
            with self._update_lock:
                self._update_state["stage"] = "applying"
                self._update_state["progress"] = 100.0
                self._update_state["message"] = "Applying update and restarting..."
            # Close now; helper explicitly waits on current PID before replacing.
            # Some webview runtimes keep background loops alive after destroy(), so we
            # schedule a hard process exit to guarantee helper handoff.
            try:
                webview.windows[0].destroy()
            except Exception as e:
                host_log("WARN", "Updater", f"window destroy failed: {e}")
            host_log("INFO", "Updater", "Scheduling hard exit for updater handoff.")
            t = threading.Timer(0.45, lambda: os._exit(0))
            t.daemon = True
            t.start()
            return {"ok": True, "message": "Applying update and restarting."}
        except Exception as e:
            host_log("ERROR", "Updater", f"Failed to launch updater helper: {e}")
            return {"ok": False, "message": str(e)}

    def _set_update_state(self, **kwargs):
        with self._update_lock:
            self._update_state.update(kwargs)

    def _download_update_worker(self, download_url, expected_sha256=""):
        tmp_path = ""
        try:
            req = urllib.request.Request(
                download_url,
                headers={"User-Agent": "AnimePlatformerUpdater/1.0"}
            )
            with self._urlopen(req, timeout=30) as resp:
                total = int(resp.headers.get("Content-Length") or 0)
                fd, tmp_path = tempfile.mkstemp(prefix="anime_platformer_update_", suffix=".exe")
                os.close(fd)

                read_so_far = 0
                chunk_size = 64 * 1024
                with open(tmp_path, "wb") as out:
                    while True:
                        chunk = resp.read(chunk_size)
                        if not chunk:
                            break
                        out.write(chunk)
                        read_so_far += len(chunk)
                        if total > 0:
                            pct = max(0.0, min(100.0, (read_so_far / total) * 100.0))
                            self._set_update_state(
                                stage="downloading",
                                progress=pct,
                                message=f"Downloading... {pct:.1f}% ({read_so_far}/{total} bytes)",
                            )
                        else:
                            self._set_update_state(
                                stage="downloading",
                                progress=0.0,
                                message=f"Downloading... {read_so_far} bytes",
                            )

            # Basic corruption guard for full-exe update payload.
            min_size = 1024 * 1024
            try:
                size_bytes = os.path.getsize(tmp_path)
            except Exception:
                size_bytes = 0
            if size_bytes < min_size:
                raise RuntimeError(f"Downloaded file is too small ({size_bytes} bytes).")

            if expected_sha256:
                with open(tmp_path, "rb") as f:
                    actual = hashlib.sha256(f.read()).hexdigest().lower()
                if actual != expected_sha256:
                    raise RuntimeError("Checksum mismatch for downloaded update.")

            self._set_update_state(
                stage="downloaded",
                progress=100.0,
                message="Download complete. Ready to apply update.",
                downloadedPath=tmp_path,
            )
            host_log("INFO", "Updater", f"Download finished: {tmp_path}")
        except Exception as e:
            msg = str(e)
            self._set_update_state(
                stage="error",
                progress=0.0,
                message=f"Download failed: {msg}",
                downloadedPath="",
            )
            host_log("ERROR", "Updater", f"Download failed: {msg}")
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    def _get_target_exe_path(self):
        if getattr(sys, "frozen", False):
            return os.path.abspath(sys.executable)
        # Dev fallback path.
        return os.path.join(ROOT_DIR, "AnimePlatformer.exe")

    def _write_updater_script(self, target_exe, downloaded_exe, backup_exe, current_pid, updater_log_path):
        try:
            fd, script_path = tempfile.mkstemp(prefix="anime_platformer_apply_", suffix=".bat")
            os.close(fd)
            script_lines = [
                "@echo off",
                "setlocal EnableExtensions",
                f'set "TARGET={target_exe}"',
                f'set "NEWEXE={downloaded_exe}"',
                f'set "BACKUP={backup_exe}"',
                f'set "OLDPID={int(current_pid)}"',
                f'set "LOG={updater_log_path}"',
                'for %%I in ("%TARGET%") do set "TARGET_DIR=%%~dpI"',
                'echo ==== updater start %DATE% %TIME% ====>>"%LOG%"',
                'echo target="%TARGET%" new="%NEWEXE%" backup="%BACKUP%" oldpid="%OLDPID%">>"%LOG%"',
                'echo [Updater] script alive>>"%LOG%"',
                'if not exist "%TARGET%" echo [Updater] WARN target missing before apply>>"%LOG%"',
                'if not exist "%NEWEXE%" echo [Updater] ERROR new exe missing before apply>>"%LOG%"',
                'echo [Updater] skipping explicit pid kill; waiting via file-lock retries>>"%LOG%"',
                ":wait_done",
                "echo [Updater] Creating backup...",
                "set RETRIES=0",
                ":backup_retry",
                'copy /Y "%TARGET%" "%BACKUP%" >nul 2>&1',
                "if not errorlevel 1 goto backup_ok",
                "set /a RETRIES+=1",
                'echo [Updater] backup retry %RETRIES% failed (err=%ERRORLEVEL%)>>"%LOG%"',
                "if %RETRIES% GEQ 20 goto rollback",
                "timeout /t 1 /nobreak >nul",
                "goto backup_retry",
                ":backup_ok",
                'echo [Updater] backup ok >>"%LOG%"',
                "echo [Updater] Replacing executable...",
                "set RETRIES=0",
                ":replace_retry",
                'copy /Y "%NEWEXE%" "%TARGET%" >nul 2>&1',
                "if not errorlevel 1 goto replace_ok",
                "set /a RETRIES+=1",
                'echo [Updater] replace retry %RETRIES% failed (err=%ERRORLEVEL%)>>"%LOG%"',
                "if %RETRIES% GEQ 20 goto rollback",
                "timeout /t 1 /nobreak >nul",
                "goto replace_retry",
                ":replace_ok",
                'echo [Updater] replace ok >>"%LOG%"',
                "echo [Updater] Update applied. Restarting game...",
                'set "START_OK=0"',
                'powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "try { $p = Start-Process -FilePath $env:TARGET -WorkingDirectory $env:TARGET_DIR -PassThru -ErrorAction Stop; Start-Sleep -Milliseconds 1200; if (Get-Process -Id $p.Id -ErrorAction SilentlyContinue) { exit 0 } else { exit 2 } } catch { exit 1 }" >nul 2>&1',
                "if errorlevel 1 goto rollback",
                'set "START_OK=1"',
                'echo [Updater] restart launch ok>>"%LOG%"',
                'del /f /q "%NEWEXE%" >nul 2>&1',
                "goto done",
                ":rollback",
                "echo [Updater] Replacement failed. Restoring backup...",
                'echo [Updater] rollback >>"%LOG%"',
                'copy /Y "%BACKUP%" "%TARGET%" >nul 2>&1',
                'set "START_OK=0"',
                'powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "try { $p = Start-Process -FilePath $env:TARGET -WorkingDirectory $env:TARGET_DIR -PassThru -ErrorAction Stop; Start-Sleep -Milliseconds 1200; if (Get-Process -Id $p.Id -ErrorAction SilentlyContinue) { exit 0 } else { exit 2 } } catch { exit 1 }" >nul 2>&1',
                'if not errorlevel 1 set "START_OK=1"',
                'if "%START_OK%"=="1" (echo [Updater] rollback relaunch ok>>"%LOG%") else (echo [Updater] rollback relaunch failed>>"%LOG%")',
                ":done",
                'echo ==== updater end %DATE% %TIME% ====>>"%LOG%"',
                'start "" /b cmd /c del /f /q "%~f0" >nul 2>&1',
                "exit /b 0",
            ]
            with open(script_path, "w", encoding="utf-8") as f:
                f.write("\n".join(script_lines))
            return script_path
        except Exception as e:
            host_log("ERROR", "Updater", f"Failed to write helper script: {e}")
            return ""

    def _fetch_json(self, url):
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "AnimePlatformerUpdater/1.0",
                "Accept": "application/vnd.github+json",
            },
        )
        with self._urlopen(req, timeout=8) as resp:
            raw = resp.read().decode("utf-8")
        return json.loads(raw)

    def _urlopen(self, request, timeout=8):
        ctx = ssl.create_default_context()
        return urllib.request.urlopen(request, timeout=timeout, context=ctx)

    def _fetch_github_release(self, repo, channel):
        ch = str(channel or "stable").strip().lower()
        if ch in ("stable", "latest"):
            url = f"https://api.github.com/repos/{repo}/releases/latest"
            return self._fetch_json(url)

        url = f"https://api.github.com/repos/{repo}/releases"
        releases = self._fetch_json(url)
        if isinstance(releases, list):
            token = ch
            for rel in releases:
                tag = str(rel.get("tag_name", "")).lower()
                name = str(rel.get("name", "")).lower()
                if token and (token in tag or token in name):
                    return rel
            if releases:
                return releases[0]
        raise RuntimeError("No release found for update channel.")

    def _choose_release_assets(self, release_payload):
        assets = release_payload.get("assets") or []
        exe_asset = None
        sha_asset = None
        for asset in assets:
            name = str(asset.get("name", ""))
            if name.lower().endswith(".exe"):
                exe_asset = asset
            if name.lower().endswith(".exe.sha256"):
                sha_asset = asset
        exe_url = str((exe_asset or {}).get("browser_download_url", "")) if exe_asset else ""
        sha_url = str((sha_asset or {}).get("browser_download_url", "")) if sha_asset else ""
        checksum = ""
        if sha_url:
            try:
                req = urllib.request.Request(
                    sha_url,
                    headers={"User-Agent": "AnimePlatformerUpdater/1.0"},
                    method="GET",
                )
                with self._urlopen(req, timeout=8) as resp:
                    checksum = resp.read().decode("utf-8", errors="ignore").strip().split()[0].lower()
            except Exception:
                checksum = ""
        return exe_url, checksum

    def _compare_versions(self, a, b):
        def parse(v):
            out = []
            for p in str(v).split("."):
                try:
                    out.append(int(p))
                except Exception:
                    out.append(0)
            return out

        aa = parse(a)
        bb = parse(b)
        m = max(len(aa), len(bb))
        for i in range(m):
            av = aa[i] if i < len(aa) else 0
            bv = bb[i] if i < len(bb) else 0
            if av > bv:
                return 1
            if av < bv:
                return -1
        return 0


def main():
    ensure_user_log_dir()
    set_dpi_awareness()
    maybe_restore_failed_update()
    mark_update_healthy_later()
    host_log("INFO", "Launcher", "Starting Anime Platformer desktop runtime.")
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        root = sys._MEIPASS
    else:
        root = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(root, "index.html")
    if not os.path.exists(index_path):
        # Fallback for local/dev launches where _MEIPASS is not the expected root.
        alt = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
        if os.path.exists(alt):
            index_path = alt
        else:
            raise FileNotFoundError(f"index.html not found in '{root}' or launcher directory.")
    url = f"file:///{index_path.replace(os.sep, '/')}"

    native_w, native_h = FIXED_FULLSCREEN_W, FIXED_FULLSCREEN_H
    host_log("INFO", "Launcher", f"Startup display target: {native_w}x{native_h} fullscreen=true (fixed)")

    window = webview.create_window(
        "Anime Platformer",
        url=url,
        width=native_w,
        height=native_h,
        fullscreen=False,
        min_size=(1024, 576),
        background_color="#0f172a",
        js_api=Api(),
    )

    def _after_start():
      try:
          # Delay a little so webview surface is ready before fullscreen switch.
          time.sleep(0.12)
          res = _apply_window_mode_native("fullscreen")
          host_log("INFO", "Launcher", f"Post-start fullscreen apply: ok={res.get('ok')} mode={res.get('mode')}")
      except Exception as e:
          host_log("WARN", "Launcher", f"Post-start fullscreen apply failed: {e}")
      try:
          win = webview.windows[0]
          win.evaluate_js(
              "(function(){"
              "const fire=()=>window.dispatchEvent(new Event('resize'));"
              "fire(); setTimeout(fire,80); setTimeout(fire,220); setTimeout(fire,420); setTimeout(fire,800);"
              "})();"
          )
      except Exception as e:
          host_log("WARN", "Launcher", f"Post-start resize pulse failed: {e}")

    webview.start(_after_start, window, debug=False)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        host_log("ERROR", "Launcher", f"Fatal crash: {e}")
        host_log("ERROR", "Launcher", traceback.format_exc())
        raise
