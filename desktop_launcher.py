import os
import sys
import json
import traceback
from datetime import datetime
import ctypes
import tempfile
import threading
import subprocess
import urllib.request
import urllib.error
import webbrowser
import webview

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_PATH = os.path.join(ROOT_DIR, "runtime-debug.log")


def host_log(level, source, message):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [{level}] {source}: {message}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
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

    def exit_app(self):
        webview.windows[0].destroy()

    def set_fullscreen(self, enabled):
        try:
            win = webview.windows[0]
            target = bool(enabled)
            if bool(win.fullscreen) != target:
                win.toggle_fullscreen()
            try:
                win.evaluate_js("window.dispatchEvent(new Event('resize'));")
            except Exception:
                pass
            return {"ok": True, "fullscreen": bool(win.fullscreen)}
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

    def check_update(self, manifest_url, current_version):
        if not manifest_url:
            return {"ok": False, "message": "Update service not configured."}
        try:
            req = urllib.request.Request(
                manifest_url,
                headers={"User-Agent": "AnimePlatformerUpdater/1.0"}
            )
            with urllib.request.urlopen(req, timeout=6) as resp:
                raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            latest = str(data.get("version", current_version or "0.0.0"))
            download_url = str(data.get("downloadUrl", ""))
            has_update = self._compare_versions(latest, current_version or "0.0.0") > 0
            return {
                "ok": True,
                "hasUpdate": has_update,
                "latestVersion": latest,
                "downloadUrl": download_url,
                "message": f"Update found ({latest})." if has_update else "You're up to date.",
            }
        except urllib.error.HTTPError as e:
            if e.code == 403:
                return {"ok": False, "message": "Update server busy, try later."}
            if e.code == 404:
                return {"ok": False, "message": "No public release found yet."}
            return {"ok": False, "message": f"Can't reach update server (HTTP {e.code})."}
        except Exception as e:
            return {"ok": False, "message": f"Can't reach update server: {e}"}

    def check_update_github(self, repo, current_version, channel="stable"):
        repo = str(repo or "").strip()
        if not repo or "/" not in repo:
            return {"ok": False, "message": "Updates not configured by developer."}
        try:
            payload = self._fetch_github_release(repo, channel)
            latest = str(payload.get("tag_name") or payload.get("name") or current_version or "0.0.0").strip()
            download_url = self._choose_release_asset_url(payload)
            has_update = self._compare_versions(latest, current_version or "0.0.0") > 0
            return {
                "ok": True,
                "hasUpdate": has_update,
                "latestVersion": latest,
                "downloadUrl": download_url,
                "message": f"Update found ({latest})." if has_update else "You're up to date.",
            }
        except urllib.error.HTTPError as e:
            if e.code == 403:
                return {"ok": False, "message": "Update server busy, try later."}
            if e.code == 404:
                return {"ok": False, "message": "No public release found yet."}
            return {"ok": False, "message": f"Can't reach update server (HTTP {e.code})."}
        except Exception as e:
            return {"ok": False, "message": f"Can't reach update server: {e}"}

    def start_update_download(self, download_url):
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
            }

            self._download_thread = threading.Thread(
                target=self._download_update_worker,
                args=(str(download_url),),
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
        updater_bat = self._write_updater_script(target_exe, downloaded_path, backup_exe)
        if not updater_bat:
            return {"ok": False, "message": "Failed to create updater helper script."}

        try:
            host_log("INFO", "Updater", f"Launching helper: {updater_bat}")
            subprocess.Popen(
                ["cmd", "/c", updater_bat],
                creationflags=subprocess.CREATE_NEW_CONSOLE | subprocess.DETACHED_PROCESS,
            )
            with self._update_lock:
                self._update_state["stage"] = "applying"
                self._update_state["progress"] = 100.0
                self._update_state["message"] = "Applying update and restarting..."
            webview.windows[0].destroy()
            return {"ok": True, "message": "Applying update and restarting."}
        except Exception as e:
            host_log("ERROR", "Updater", f"Failed to launch updater helper: {e}")
            return {"ok": False, "message": str(e)}

    def _set_update_state(self, **kwargs):
        with self._update_lock:
            self._update_state.update(kwargs)

    def _download_update_worker(self, download_url):
        tmp_path = ""
        try:
            req = urllib.request.Request(
                download_url,
                headers={"User-Agent": "AnimePlatformerUpdater/1.0"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
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

    def _write_updater_script(self, target_exe, downloaded_exe, backup_exe):
        try:
            fd, script_path = tempfile.mkstemp(prefix="anime_platformer_apply_", suffix=".bat")
            os.close(fd)
            script_lines = [
                "@echo off",
                "setlocal",
                f'set "TARGET={target_exe}"',
                f'set "NEWEXE={downloaded_exe}"',
                f'set "BACKUP={backup_exe}"',
                "echo [Updater] Waiting for game process to close...",
                "timeout /t 3 /nobreak >nul",
                "echo [Updater] Creating backup...",
                'copy /Y "%TARGET%" "%BACKUP%" >nul',
                "if errorlevel 1 goto rollback",
                "echo [Updater] Replacing executable...",
                'copy /Y "%NEWEXE%" "%TARGET%" >nul',
                "if errorlevel 1 goto rollback",
                "echo [Updater] Update applied. Restarting game...",
                'start "" "%TARGET%"',
                'del /f /q "%NEWEXE%" >nul 2>&1',
                "goto done",
                ":rollback",
                "echo [Updater] Replacement failed. Restoring backup...",
                'copy /Y "%BACKUP%" "%TARGET%" >nul 2>&1',
                'start "" "%TARGET%"',
                ":done",
                'del /f /q "%~f0" >nul 2>&1',
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
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read().decode("utf-8")
        return json.loads(raw)

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

    def _choose_release_asset_url(self, release_payload):
        assets = release_payload.get("assets") or []
        exe_asset = None
        for asset in assets:
            name = str(asset.get("name", ""))
            if name.lower().endswith(".exe"):
                exe_asset = asset
                break
        if exe_asset:
            return str(exe_asset.get("browser_download_url", ""))
        if assets:
            return str((assets[0] or {}).get("browser_download_url", ""))
        return ""

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
    set_dpi_awareness()
    host_log("INFO", "Launcher", "Starting Anime Platformer desktop runtime.")
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        root = sys._MEIPASS
    else:
        root = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(root, "index.html")
    url = f"file:///{index_path.replace(os.sep, '/')}"

    window = webview.create_window(
        "Anime Platformer",
        url=url,
        width=1366,
        height=768,
        min_size=(1024, 576),
        background_color="#0f172a",
        js_api=Api(),
    )
    webview.start(debug=False)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        host_log("ERROR", "Launcher", f"Fatal crash: {e}")
        host_log("ERROR", "Launcher", traceback.format_exc())
        raise
