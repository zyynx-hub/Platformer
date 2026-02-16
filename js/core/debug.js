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
  hitboxesEnabled: false,
  playerHitboxProfile: { w: 9, h: 24, ox: 0, oy: -3 },

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.enabled = true;
    const settingsDebug = (Platformer.Settings && Platformer.Settings.current && Platformer.Settings.current.debug) || null;
    if (settingsDebug) {
      this.hitboxesEnabled = !!settingsDebug.hitboxesEnabled;
      this.playerHitboxProfile = {
        w: this.clampNum(settingsDebug.playerHitbox && settingsDebug.playerHitbox.w, 4, 64, 9),
        h: this.clampNum(settingsDebug.playerHitbox && settingsDebug.playerHitbox.h, 4, 64, 24),
        ox: this.clampNum(settingsDebug.playerHitbox && settingsDebug.playerHitbox.ox, -24, 24, 0),
        oy: this.clampNum(settingsDebug.playerHitbox && settingsDebug.playerHitbox.oy, -24, 24, -3),
      };
    } else {
      try {
        this.hitboxesEnabled = localStorage.getItem("platformer_hitboxes_enabled") === "1";
      } catch (_e) {
        this.hitboxesEnabled = false;
      }
      this.loadPlayerHitboxProfile();
    }

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

    const hitboxBtn = document.createElement("button");
    hitboxBtn.style.padding = "6px 8px";
    hitboxBtn.style.background = "#1f2937";
    hitboxBtn.style.color = "#f9fafb";
    hitboxBtn.style.border = "1px solid #4b5563";
    hitboxBtn.style.cursor = "pointer";
    const refreshHitboxBtn = () => {
      hitboxBtn.textContent = this.hitboxesEnabled ? "Hitboxes: On" : "Hitboxes: Off";
    };
    refreshHitboxBtn();
    const makeMini = (label) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.padding = "4px 6px";
      b.style.background = "#111827";
      b.style.color = "#cbd5e1";
      b.style.border = "1px solid #334155";
      b.style.cursor = "pointer";
      b.style.fontSize = "11px";
      return b;
    };
    const hbInfo = document.createElement("div");
    hbInfo.style.color = "#93c5fd";
    hbInfo.style.fontSize = "11px";
    hbInfo.style.marginBottom = "6px";
    const hbRow = document.createElement("div");
    hbRow.style.display = "flex";
    hbRow.style.flexWrap = "wrap";
    hbRow.style.gap = "4px";
    hbRow.style.marginBottom = "8px";
    const hbWm = makeMini("W-");
    const hbWp = makeMini("W+");
    const hbHm = makeMini("H-");
    const hbHp = makeMini("H+");
    const hbXm = makeMini("X-");
    const hbXp = makeMini("X+");
    const hbYm = makeMini("Y-");
    const hbYp = makeMini("Y+");
    const hbReset = makeMini("HB Reset");
    const refreshHbInfo = () => {
      const p = this.playerHitboxProfile;
      hbInfo.textContent = `Player HB w=${p.w} h=${p.h} ox=${p.ox} oy=${p.oy}`;
    };
    refreshHbInfo();

    right.appendChild(hitboxBtn);
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
    panel.appendChild(hbInfo);
    panel.appendChild(hbRow);
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

    hitboxBtn.addEventListener("click", () => {
      this.setHitboxesEnabled(!this.hitboxesEnabled);
      refreshHitboxBtn();
      status.textContent = `Hitbox overlay ${this.hitboxesEnabled ? "enabled" : "disabled"}.`;
      status.style.color = "#93c5fd";
    });
    const bumpHb = (key, delta, min, max) => {
      const p = { ...this.playerHitboxProfile };
      p[key] = Math.max(min, Math.min(max, p[key] + delta));
      this.setPlayerHitboxProfile(p);
      refreshHbInfo();
      status.textContent = "Player hitbox updated.";
      status.style.color = "#93c5fd";
    };
    hbWm.addEventListener("click", () => bumpHb("w", -1, 4, 64));
    hbWp.addEventListener("click", () => bumpHb("w", 1, 4, 64));
    hbHm.addEventListener("click", () => bumpHb("h", -1, 4, 64));
    hbHp.addEventListener("click", () => bumpHb("h", 1, 4, 64));
    hbXm.addEventListener("click", () => bumpHb("ox", -1, -24, 24));
    hbXp.addEventListener("click", () => bumpHb("ox", 1, -24, 24));
    hbYm.addEventListener("click", () => bumpHb("oy", -1, -24, 24));
    hbYp.addEventListener("click", () => bumpHb("oy", 1, -24, 24));
    hbReset.addEventListener("click", () => {
      this.setPlayerHitboxProfile({ w: 9, h: 24, ox: 0, oy: -3 });
      refreshHbInfo();
      status.textContent = "Player hitbox reset.";
      status.style.color = "#93c5fd";
    });
    [hbWm, hbWp, hbHm, hbHp, hbXm, hbXp, hbYm, hbYp, hbReset].forEach((b) => hbRow.appendChild(b));

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

  setHitboxesEnabled(enabled) {
    this.hitboxesEnabled = !!enabled;
    if (Platformer.Settings && Platformer.Settings.current) {
      Platformer.Settings.current.debug = Platformer.Settings.current.debug || {};
      Platformer.Settings.current.debug.hitboxesEnabled = this.hitboxesEnabled;
      Platformer.Settings.save();
    } else {
      try {
        localStorage.setItem("platformer_hitboxes_enabled", this.hitboxesEnabled ? "1" : "0");
      } catch (_e) {
        // best effort
      }
    }
    try {
      window.dispatchEvent(new CustomEvent("platformer:hitboxes-toggle", { detail: { enabled: this.hitboxesEnabled } }));
    } catch (_e) {
      // best effort
    }
    this.log("Debug.hitboxes", `Hitboxes ${this.hitboxesEnabled ? "ON" : "OFF"}`);
  },

  loadPlayerHitboxProfile() {
    try {
      const raw = localStorage.getItem("platformer_player_hitbox");
      if (!raw) return;
      const p = JSON.parse(raw);
      this.playerHitboxProfile = {
        w: this.clampNum(p.w, 4, 64, 9),
        h: this.clampNum(p.h, 4, 64, 24),
        ox: this.clampNum(p.ox, -24, 24, 0),
        oy: this.clampNum(p.oy, -24, 24, -3),
      };
    } catch (_e) {
      // best effort
    }
  },

  setPlayerHitboxProfile(profile) {
    this.playerHitboxProfile = {
      w: this.clampNum(profile.w, 4, 64, 9),
      h: this.clampNum(profile.h, 4, 64, 24),
      ox: this.clampNum(profile.ox, -24, 24, 0),
      oy: this.clampNum(profile.oy, -24, 24, -3),
    };
    if (Platformer.Settings && Platformer.Settings.current) {
      Platformer.Settings.current.debug = Platformer.Settings.current.debug || {};
      Platformer.Settings.current.debug.playerHitbox = { ...this.playerHitboxProfile };
      Platformer.Settings.save();
    } else {
      try {
        localStorage.setItem("platformer_player_hitbox", JSON.stringify(this.playerHitboxProfile));
      } catch (_e) {
        // best effort
      }
    }
    try {
      window.dispatchEvent(new CustomEvent("platformer:player-hitbox-changed", { detail: { ...this.playerHitboxProfile } }));
    } catch (_e) {
      // best effort
    }
    this.log("Debug.hitboxProfile", `w=${this.playerHitboxProfile.w} h=${this.playerHitboxProfile.h} ox=${this.playerHitboxProfile.ox} oy=${this.playerHitboxProfile.oy}`);
  },

  getPlayerHitboxProfile() {
    return { ...this.playerHitboxProfile };
  },

  clampNum(v, min, max, fallback) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
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
