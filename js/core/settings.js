window.Platformer = window.Platformer || {};

Platformer.DEFAULT_SETTINGS = {
  settingsVersion: 2,
  gameplay: {
    difficulty: "normal",
  },
  controls: {
    left: "A",
    right: "D",
    jump: "W",
    dash: "SHIFT",
    attack: "J",
    interact: "E",
    pause: "ESC",
  },
  accessibility: {
    textSize: "medium",
    colorblindMode: "off",
    reduceScreenShake: 50,
    reducedMotion: false,
    flashReduction: false,
    subtitles: true,
    audioCues: true,
  },
  video: {
    fullscreen: false,
    resolutionScale: 100,
    pixelPerfect: true,
    vsync: true,
    fpsCap: "60",
    cameraSmoothing: 35,
    brightness: 1.0,
  },
  audio: {
    master: 80,
    music: 60,
    sfx: 85,
    ui: 70,
    dynamicRange: "normal",
    muteWhenUnfocused: false,
  },
  convenience: {
    autoSave: true,
    checkpointFrequency: "standard",
    speedrunMode: false,
    introSeen: false,
  },
  updates: {
    enabled: true,
    autoUpdate: true,
    currentVersion: "1.0.0",
    source: "GitHub Releases",
    manifestUrl: "",
    downloadUrl: "",
  },
};

Platformer.deepClone = function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
};

Platformer.deepMerge = function deepMerge(base, incoming) {
  const out = Platformer.deepClone(base);
  const mergeInto = (target, source) => {
    if (!source || typeof source !== "object") return;
    Object.keys(source).forEach((key) => {
      const src = source[key];
      if (src && typeof src === "object" && !Array.isArray(src)) {
        if (!target[key] || typeof target[key] !== "object") {
          target[key] = {};
        }
        mergeInto(target[key], src);
      } else {
        target[key] = src;
      }
    });
  };
  mergeInto(out, incoming);
  return out;
};

Platformer.Settings = {
  key: "anime_platformer_settings_v2",
  legacyKeys: ["anime_platformer_settings_v1"],
  prefix: "anime_platformer_settings_",
  current: Platformer.deepClone(Platformer.DEFAULT_SETTINGS),
  _bootstrapped: false,

  waitForBridgeReady(timeoutMs = 2500) {
    return new Promise((resolve) => {
      const isReady = () => !!(window.pywebview && window.pywebview.api);
      if (isReady()) {
        resolve(true);
        return;
      }
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        try { window.removeEventListener("pywebviewready", onReady); } catch (_e) {}
        clearInterval(timer);
        clearTimeout(expire);
        resolve(ok);
      };
      const onReady = () => finish(true);
      try { window.addEventListener("pywebviewready", onReady, { once: true }); } catch (_e) {}
      const timer = setInterval(() => {
        if (isReady()) finish(true);
      }, 100);
      const expire = setTimeout(() => finish(isReady()), Math.max(200, Number(timeoutMs) || 2500));
    });
  },

  migrate(parsed) {
    const input = parsed && typeof parsed === "object" ? Platformer.deepClone(parsed) : {};
    const ver = Number(input.settingsVersion || 1);
    const out = input;

    if (ver < 2) {
      // v2: deprecate player-editable update URLs and lock source label.
      if (!out.updates || typeof out.updates !== "object") out.updates = {};
      out.updates.source = "GitHub Releases";
      out.updates.manifestUrl = "";
      out.updates.downloadUrl = "";
      out.settingsVersion = 2;
    }
    out.settingsVersion = 2;
    return out;
  },

  archiveLegacySnapshot(raw) {
    if (!raw || !window.indexedDB) return;
    try {
      const req = window.indexedDB.open("anime_platformer_archive", 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id", autoIncrement: true });
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction("settings", "readwrite");
          tx.objectStore("settings").add({ at: Date.now(), payload: String(raw).slice(0, 2048) });
          tx.oncomplete = () => db.close();
          tx.onerror = () => db.close();
        } catch (_e) {
          // best effort
        }
      };
    } catch (_e) {
      // best effort
    }
  },

  cleanupObsoleteStorage() {
    try {
      const keep = new Set([this.key, ...this.legacyKeys]);
      Object.keys(localStorage).forEach((k) => {
        if (k && k.startsWith(this.prefix) && !keep.has(k)) {
          localStorage.removeItem(k);
        }
      });
    } catch (_e) {
      // ignore
    }
  },

  load() {
    try {
      const buildVersion = (Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || "1.0.0";
      const buildUpdateEnabled = Platformer.BUILD_UPDATE_ENABLED !== false;
      let raw = localStorage.getItem(this.key);
      if (!raw) {
        for (const legacy of this.legacyKeys) {
          raw = localStorage.getItem(legacy);
          if (raw) break;
        }
      }
      if (!raw) {
        this.current = Platformer.deepClone(Platformer.DEFAULT_SETTINGS);
        this.current.updates.currentVersion = buildVersion;
        this.current.updates.enabled = buildUpdateEnabled;
        this.current.updates.source = "GitHub Releases";
        return this.current;
      }
      this.archiveLegacySnapshot(raw);
      const parsed = this.migrate(JSON.parse(raw));
      this.current = Platformer.deepMerge(Platformer.DEFAULT_SETTINGS, parsed);
      // Session-only flag: always reset on full page refresh.
      this.current.convenience.introSeen = false;
      // Always bind current version to packaged build, not stale localStorage.
      this.current.updates.currentVersion = buildVersion;
      // Build config is authoritative for whether updates are enabled.
      this.current.updates.enabled = buildUpdateEnabled;
      this.current.updates.source = "GitHub Releases";
      this.cleanupObsoleteStorage();
      this.persistLocal();
      return this.current;
    } catch (_e) {
      const buildVersion = (Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || "1.0.0";
      const buildUpdateEnabled = Platformer.BUILD_UPDATE_ENABLED !== false;
      this.current = Platformer.deepClone(Platformer.DEFAULT_SETTINGS);
      this.current.convenience.introSeen = false;
      this.current.updates.currentVersion = buildVersion;
      this.current.updates.enabled = buildUpdateEnabled;
      this.current.updates.source = "GitHub Releases";
      return this.current;
    }
  },

  persistLocal() {
    // Do not persist introSeen; keep it session-only.
    const toSave = Platformer.deepClone(this.current);
    toSave.convenience.introSeen = false;
    toSave.updates.currentVersion = (Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || "1.0.0";
    toSave.updates.source = "GitHub Releases";
    // Legacy player-editable URLs are intentionally not persisted anymore.
    toSave.updates.manifestUrl = "";
    toSave.updates.downloadUrl = "";
    this.current.updates.currentVersion = toSave.updates.currentVersion;
    this.current.updates.source = toSave.updates.source;
    this.current.updates.manifestUrl = "";
    this.current.updates.downloadUrl = "";
    const compact = JSON.stringify(toSave);
    localStorage.setItem(this.key, compact);
    this.legacyKeys.forEach((k) => localStorage.removeItem(k));
    this.cleanupObsoleteStorage();
  },

  async save() {
    this.persistLocal();
    await this.persistHost();
  },

  async persistHost() {
    try {
      await this.waitForBridgeReady(2000);
      if (!(window.pywebview && window.pywebview.api && typeof window.pywebview.api.write_settings_blob === "function")) {
        return;
      }
      const payload = JSON.stringify(this.current);
      const res = await window.pywebview.api.write_settings_blob(payload);
      if (Platformer.Debug && (!res || !res.ok)) {
        Platformer.Debug.warn("Settings.host", (res && res.message) || "Failed writing host settings.");
      }
    } catch (e) {
      if (Platformer.Debug) Platformer.Debug.warn("Settings.host", `write failed: ${e && e.message ? e.message : e}`);
    }
  },

  async bootstrap() {
    this.load();
    if (this._bootstrapped) return this.current;
    this._bootstrapped = true;
    try {
      await this.waitForBridgeReady(3000);
      if (!(window.pywebview && window.pywebview.api && typeof window.pywebview.api.read_settings_blob === "function")) {
        return this.current;
      }
      const res = await window.pywebview.api.read_settings_blob();
      if (!res || !res.ok || !res.data) return this.current;
      const parsed = this.migrate(JSON.parse(String(res.data)));
      this.current = Platformer.deepMerge(Platformer.DEFAULT_SETTINGS, parsed);
      this.current.convenience.introSeen = false;
      this.current.updates.currentVersion = (Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || "1.0.0";
      this.current.updates.enabled = Platformer.BUILD_UPDATE_ENABLED !== false;
      this.current.updates.source = "GitHub Releases";
      this.persistLocal();
      if (Platformer.Debug) Platformer.Debug.log("Settings.host", "Loaded persisted settings from desktop host.");
    } catch (e) {
      if (Platformer.Debug) Platformer.Debug.warn("Settings.host", `bootstrap failed: ${e && e.message ? e.message : e}`);
    }
    return this.current;
  },

  reset() {
    this.current = Platformer.deepClone(Platformer.DEFAULT_SETTINGS);
    this.current.convenience.introSeen = false;
    this.current.updates.currentVersion = (Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || "1.0.0";
    this.current.updates.enabled = Platformer.BUILD_UPDATE_ENABLED !== false;
    this.current.updates.source = "GitHub Releases";
    this.current.updates.manifestUrl = "";
    this.current.updates.downloadUrl = "";
    this.save();
    return this.current;
  },

  textScale() {
    const size = this.current.accessibility.textSize;
    if (size === "small") return 0.9;
    if (size === "large") return 1.2;
    return 1;
  },
};

Platformer.Settings.load();
