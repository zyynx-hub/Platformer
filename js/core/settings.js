window.Platformer = window.Platformer || {};

Platformer.DEFAULT_SETTINGS = {
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
  key: "anime_platformer_settings_v1",
  current: Platformer.deepClone(Platformer.DEFAULT_SETTINGS),

  load() {
    try {
      const buildVersion = (Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || "1.0.0";
      const buildUpdateEnabled = Platformer.BUILD_UPDATE_ENABLED !== false;
      const raw = localStorage.getItem(this.key);
      if (!raw) {
        this.current = Platformer.deepClone(Platformer.DEFAULT_SETTINGS);
        this.current.updates.currentVersion = buildVersion;
        this.current.updates.enabled = buildUpdateEnabled;
        this.current.updates.source = "GitHub Releases";
        return this.current;
      }
      const parsed = JSON.parse(raw);
      this.current = Platformer.deepMerge(Platformer.DEFAULT_SETTINGS, parsed);
      // Session-only flag: always reset on full page refresh.
      this.current.convenience.introSeen = false;
      // Always bind current version to packaged build, not stale localStorage.
      this.current.updates.currentVersion = buildVersion;
      // Build config is authoritative for whether updates are enabled.
      this.current.updates.enabled = buildUpdateEnabled;
      this.current.updates.source = "GitHub Releases";
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

  save() {
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
    localStorage.setItem(this.key, JSON.stringify(toSave));
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
