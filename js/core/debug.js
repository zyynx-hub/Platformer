window.Platformer = window.Platformer || {};

Platformer.Debug = {
  initialized: false,
  enabled: false,
  lines: [],
  maxLines: 300,
  panel: null,
  logEl: null,
  statusEl: null,
  copyBtn: null,
  latestErrorBlock: "",
  _monitorsAttached: false,
  _nativeLogInFlight: 0,
  _nativeLogDropped: 0,
  _lastMismatchKey: "",
  _lastMismatchAt: 0,

  init() {
    if (this.initialized) return;
    this.initialized = true;
    const desktopHost = !!(window.pywebview && window.pywebview.api);
    this.enabled = !!(window.DEBUG_MODE || Platformer.BUILD_DEBUG || desktopHost);
    if (!this.enabled) return;

    const root = document.createElement("div");
    root.style.position = "fixed";
    root.style.right = "12px";
    root.style.bottom = "12px";
    root.style.zIndex = "999999";
    root.style.fontFamily = "Consolas, monospace";

    const toggle = document.createElement("button");
    toggle.textContent = "DEBUG";
    toggle.style.padding = "8px 10px";
    toggle.style.background = "#111827";
    toggle.style.color = "#e5e7eb";
    toggle.style.border = "1px solid #374151";
    toggle.style.cursor = "pointer";
    toggle.style.borderRadius = "6px";

    const panel = document.createElement("div");
    panel.style.display = "none";
    panel.style.marginTop = "8px";
    panel.style.width = "min(920px, 92vw)";
    panel.style.height = "min(46vh, 420px)";
    panel.style.background = "rgba(0,0,0,0.92)";
    panel.style.color = "#86efac";
    panel.style.border = "1px solid #374151";
    panel.style.borderRadius = "8px";
    panel.style.padding = "10px";
    panel.style.boxSizing = "border-box";
    panel.style.display = "none";

    const topBar = document.createElement("div");
    topBar.style.display = "flex";
    topBar.style.justifyContent = "space-between";
    topBar.style.alignItems = "center";
    topBar.style.marginBottom = "8px";

    const title = document.createElement("div");
    title.textContent = "Runtime Debug Console";
    title.style.color = "#f9fafb";

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.gap = "8px";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy latest error";
    copyBtn.style.padding = "6px 8px";
    copyBtn.style.background = "#1f2937";
    copyBtn.style.color = "#f9fafb";
    copyBtn.style.border = "1px solid #4b5563";
    copyBtn.style.cursor = "pointer";

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.style.padding = "6px 8px";
    clearBtn.style.background = "#1f2937";
    clearBtn.style.color = "#f9fafb";
    clearBtn.style.border = "1px solid #4b5563";
    clearBtn.style.cursor = "pointer";

    right.appendChild(copyBtn);
    right.appendChild(clearBtn);

    topBar.appendChild(title);
    topBar.appendChild(right);

    const status = document.createElement("div");
    status.style.marginBottom = "6px";
    status.style.color = "#93c5fd";
    status.textContent = "No errors yet.";

    const log = document.createElement("pre");
    log.style.margin = "0";
    log.style.height = "calc(100% - 58px)";
    log.style.overflow = "auto";
    log.style.whiteSpace = "pre-wrap";
    log.style.fontSize = "12px";
    log.style.lineHeight = "1.32";
    log.textContent = "Debug console ready.\n";

    panel.appendChild(topBar);
    panel.appendChild(status);
    panel.appendChild(log);
    root.appendChild(toggle);
    root.appendChild(panel);
    document.body.appendChild(root);

    toggle.addEventListener("click", () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        panel.style.display = panel.style.display === "none" ? "block" : "none";
      }
    });

    clearBtn.addEventListener("click", () => {
      this.lines = [];
      log.textContent = "";
      status.textContent = "Cleared.";
    });

    copyBtn.addEventListener("click", async () => {
      const text = this.latestErrorBlock || "No captured error block yet.";
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "Latest error copied to clipboard.";
      } catch (_e) {
        status.textContent = "Copy failed. Select text manually from logs.";
      }
    });

    this.panel = panel;
    this.logEl = log;
    this.statusEl = status;
    this.copyBtn = copyBtn;

    window.addEventListener("error", (event) => {
      // Resource load failures (scripts, audio, images) come through error events too.
      if (event && event.target && event.target !== window) {
        const t = event.target;
        const tag = t.tagName || "UNKNOWN";
        const src = t.src || t.href || "(no src/href)";
        this.error("resource.error", `TAG: ${tag}\nSOURCE: ${src}`);
        return;
      }

      const msg = event.message || "Unknown window error";
      const file = event.filename || "(no filename)";
      const line = event.lineno || 0;
      const col = event.colno || 0;
      const stack = event.error && event.error.stack ? event.error.stack : "(no stack)";
      this.error("window.onerror", `MESSAGE: ${msg}\nFILE: ${file}:${line}:${col}\n${stack}`);
    }, true);

    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const msg = reason && reason.message ? reason.message : String(reason);
      const stack = reason && reason.stack ? reason.stack : "(no stack)";
      this.error("unhandledrejection", `${msg}\n${stack}`);
    });

    this.patchConsole();
  },

  patchConsole() {
    if (console.__platformerDebugPatched) return;
    console.__platformerDebugPatched = true;

    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origErr = console.error.bind(console);

    console.log = (...args) => {
      this.log("console.log", this.stringifyArgs(args));
      origLog(...args);
    };
    console.warn = (...args) => {
      this.warn("console.warn", this.stringifyArgs(args));
      origWarn(...args);
    };
    console.error = (...args) => {
      this.error("console.error", this.stringifyArgs(args));
      origErr(...args);
    };
  },

  stringifyArgs(args) {
    return args.map((a) => {
      if (typeof a === "string") return a;
      try {
        return JSON.stringify(a);
      } catch (_e) {
        return String(a);
      }
    }).join(" ");
  },

  timestamp() {
    return new Date().toISOString().slice(11, 19);
  },

  append(type, label, message) {
    if (!this.enabled) return;
    const line = `[${this.timestamp()}] [${type}] ${label}: ${message}`;
    this.lines.push(line);
    if (this.lines.length > this.maxLines) {
      this.lines.shift();
    }
    if (this.logEl) {
      this.logEl.textContent = this.lines.join("\n");
      this.logEl.scrollTop = this.logEl.scrollHeight;
    }
    this.forwardToNativeConsole(type, label, message);
  },

  forwardToNativeConsole(type, label, message) {
    try {
      if (!(window.pywebview && window.pywebview.api && typeof window.pywebview.api.log_event === "function")) {
        return;
      }
      // Avoid flooding host bridge on high-frequency logs.
      if (this._nativeLogInFlight > 10) {
        this._nativeLogDropped += 1;
        if (this._nativeLogDropped % 25 === 0) {
          window.pywebview.api.log_event("WARN", "DebugBridge", `Dropped ${this._nativeLogDropped} log lines (bridge saturated)`).catch(() => {});
        }
        return;
      }
      this._nativeLogInFlight += 1;
      window.pywebview.api.log_event(type, label, String(message)).catch(() => {})
        .finally(() => {
          this._nativeLogInFlight = Math.max(0, this._nativeLogInFlight - 1);
        });
    } catch (_e) {
      // best effort
    }
  },

  log(label, message) {
    this.append("INFO", label, message);
  },

  warn(label, message) {
    this.append("WARN", label, message);
  },

  error(label, message) {
    this.append("ERROR", label, message);
    this.latestErrorBlock = [
      "=== COPY_THIS_TO_ASSISTANT ===",
      `TIME: ${new Date().toISOString()}`,
      `SOURCE: ${label}`,
      "DETAILS:",
      message,
      "=== END_COPY ===",
    ].join("\n");
    if (this.statusEl) {
      this.statusEl.textContent = "Error captured. Click 'Copy latest error'.";
      this.statusEl.style.color = "#fca5a5";
    }
  },

  attachGameMonitors(game) {
    if (!this.enabled) return;
    if (this._monitorsAttached || !game) return;
    this._monitorsAttached = true;

    try {
      const sm = game.scene && game.scene.events ? game.scene.events : null;
      if (sm) {
        const sceneEvent = (name) => (scene) => {
          const key = scene && scene.scene && scene.scene.key ? scene.scene.key : "unknown";
          this.log("Scene", `${name}: ${key}`);
        };
        sm.on("start", sceneEvent("start"));
        sm.on("ready", sceneEvent("ready"));
        sm.on("pause", sceneEvent("pause"));
        sm.on("resume", sceneEvent("resume"));
        sm.on("sleep", sceneEvent("sleep"));
        sm.on("wake", sceneEvent("wake"));
        sm.on("shutdown", sceneEvent("shutdown"));
        sm.on("destroy", sceneEvent("destroy"));
      }
    } catch (e) {
      this.warn("Debug.attachGameMonitors", `Scene monitor attach failed: ${e && e.message ? e.message : e}`);
    }

    try {
      if (game.scale && game.scale.on) {
        game.scale.on("resize", (sz) => {
          this.log("Scale.resize", `${Math.round(sz.width)}x${Math.round(sz.height)}`);
        });
      }
    } catch (e) {
      this.warn("Debug.attachGameMonitors", `Scale monitor attach failed: ${e && e.message ? e.message : e}`);
    }

    try {
      document.addEventListener("visibilitychange", () => {
        this.log("Visibility", document.hidden ? "hidden" : "visible");
      });
    } catch (_e) {
      // best effort
    }

    // Detect black bars / stale canvas sizing (common in desktop wrappers).
    setInterval(() => {
      try {
        if (!game.canvas) return;
        const root = document.getElementById("game-root");
        const vw = (root && root.clientWidth) || (document.documentElement && document.documentElement.clientWidth) || window.innerWidth || 0;
        const vh = (root && root.clientHeight) || (document.documentElement && document.documentElement.clientHeight) || window.innerHeight || 0;
        const cw = game.canvas.clientWidth || game.canvas.width || 0;
        const ch = game.canvas.clientHeight || game.canvas.height || 0;
        const dx = Math.abs(cw - vw);
        const dy = Math.abs(ch - vh);
        if (dx > 8 || dy > 8) {
          const now = Date.now();
          const key = `${vw}x${vh}|${cw}x${ch}`;
          if (key !== this._lastMismatchKey || now - this._lastMismatchAt > 5000) {
            this._lastMismatchKey = key;
            this._lastMismatchAt = now;
            this.warn("ViewportMismatch", `viewport=${vw}x${vh} canvas=${cw}x${ch} (dx=${dx},dy=${dy})`);
          }
        }
      } catch (_e) {
        // best effort
      }
    }, 1200);
  },

  safe(label, fn, ctx, args) {
    if (!this.enabled) {
      return fn.apply(ctx, args || []);
    }
    try {
      return fn.apply(ctx, args || []);
    } catch (err) {
      const stack = err && err.stack ? err.stack : String(err);
      this.error(label, stack);
      return undefined;
    }
  },
};

Platformer.wrapSceneSafety = function wrapSceneSafety(SceneClass, sceneName) {
  if (!SceneClass || SceneClass.__safeWrapped) return SceneClass;

  class SafeScene extends SceneClass {
    preload(...args) {
      const fn = SceneClass.prototype.preload;
      if (typeof fn !== "function") return undefined;
      return Platformer.Debug.safe(`${sceneName}.preload`, fn, this, args);
    }

    init(...args) {
      const fn = SceneClass.prototype.init;
      if (typeof fn !== "function") return undefined;
      return Platformer.Debug.safe(`${sceneName}.init`, fn, this, args);
    }

    create(...args) {
      const fn = SceneClass.prototype.create;
      if (typeof fn !== "function") return undefined;
      return Platformer.Debug.safe(`${sceneName}.create`, fn, this, args);
    }

    update(...args) {
      const fn = SceneClass.prototype.update;
      if (typeof fn !== "function") return undefined;
      return Platformer.Debug.safe(`${sceneName}.update`, fn, this, args);
    }

    shutdown(...args) {
      const fn = SceneClass.prototype.shutdown;
      if (typeof fn !== "function") return undefined;
      return Platformer.Debug.safe(`${sceneName}.shutdown`, fn, this, args);
    }
  }

  SafeScene.__safeWrapped = true;
  return SafeScene;
};
