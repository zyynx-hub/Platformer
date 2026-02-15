window.Platformer = window.Platformer || {};

Platformer.OptionsScene = class extends Phaser.Scene {
  constructor() {
    super("OptionsScene");
    this.awaitingControl = null;
    this.rebindHint = null;
    this.dom = null;
    this.boundKeydown = null;
    this.returnTo = "menu";
    this.backBtn = null;
  }

  init(data) {
    this.returnTo = data && data.returnTo ? data.returnTo : "menu";
    if (Platformer.Debug) Platformer.Debug.log("OptionsScene", `Opened (returnTo=${this.returnTo}).`);
  }

  create() {
    const s = Platformer.Settings.current;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x020617, 0.9);
    this.add.text(cx, 48, "OPTIONS", {
      fontFamily: "Verdana",
      fontSize: "42px",
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.rebindHint = this.add.text(cx, 92, "Click a key button to rebind. Press ESC to return.", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#cbd5e1",
    }).setOrigin(0.5);

    const wrap = document.createElement("div");
    wrap.style.width = "min(1000px, 92vw)";
    wrap.style.maxHeight = "72vh";
    wrap.style.overflowY = "auto";
    wrap.style.background = "rgba(15,23,42,0.82)";
    wrap.style.border = "2px solid #334155";
    wrap.style.borderRadius = "10px";
    wrap.style.padding = "12px 14px";
    wrap.style.fontFamily = "Consolas, monospace";
    wrap.style.color = "#e2e8f0";

    const sec = (title) => `<h3 style="margin:14px 0 8px;color:#f8fafc">${title}</h3>`;
    const row = (label, control) => `<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin:7px 0"><span>${label}</span><span>${control}</span></div>`;

    wrap.innerHTML = [
      sec("Gameplay"),
      row("Difficulty", `<select id="difficulty"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select>`),

      sec("Controls"),
      row("Left", `<button data-bind="left">${s.controls.left}</button>`),
      row("Right", `<button data-bind="right">${s.controls.right}</button>`),
      row("Jump", `<button data-bind="jump">${s.controls.jump}</button>`),
      row("Dash", `<button data-bind="dash">${s.controls.dash}</button>`),
      row("Attack", `<button data-bind="attack">${s.controls.attack}</button>`),
      row("Interact", `<button data-bind="interact">${s.controls.interact}</button>`),
      row("Pause", `<button data-bind="pause">${s.controls.pause}</button>`),

      sec("Accessibility"),
      row("Text size", `<select id="textSize"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>`),
      row("Colorblind mode", `<select id="colorblindMode"><option value="off">Off</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option></select>`),
      row("Reduce screen shake", `<input id="reduceScreenShake" type="range" min="0" max="100" step="1" /><span id="reduceScreenShakeVal"></span>`),
      row("Reduced motion", `<select id="reducedMotion"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Flash reduction", `<select id="flashReduction"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Subtitles", `<select id="subtitles"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Audio cues", `<select id="audioCues"><option value="off">Off</option><option value="on">On</option></select>`),

      sec("Video"),
      row("Fullscreen", `<select id="fullscreen"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Resolution scale", `<input id="resolutionScale" type="range" min="50" max="100" step="1" /><span id="resolutionScaleVal"></span>`),
      row("Pixel-perfect", `<select id="pixelPerfect"><option value="off">Off</option><option value="on">On</option></select>`),
      row("VSync", `<select id="vsync"><option value="off">Off</option><option value="on">On</option></select>`),
      row("FPS cap", `<select id="fpsCap"><option value="30">30</option><option value="60">60</option><option value="unlimited">Unlimited</option></select>`),
      row("Camera smoothing", `<input id="cameraSmoothing" type="range" min="0" max="100" step="1" /><span id="cameraSmoothingVal"></span>`),
      row("Brightness", `<input id="brightness" type="range" min="0.8" max="1.2" step="0.01" /><span id="brightnessVal"></span>`),

      sec("Audio"),
      row("Master volume", `<input id="master" type="range" min="0" max="100" step="1" /><span id="masterVal"></span>`),
      row("Music volume", `<input id="music" type="range" min="0" max="100" step="1" /><span id="musicVal"></span>`),
      row("SFX volume", `<input id="sfx" type="range" min="0" max="100" step="1" /><span id="sfxVal"></span>`),
      row("UI volume", `<input id="ui" type="range" min="0" max="100" step="1" /><span id="uiVal"></span>`),
      row("Dynamic range", `<select id="dynamicRange"><option value="night">Night</option><option value="normal">Normal</option><option value="wide">Wide</option></select>`),
      row("Mute when unfocused", `<select id="muteWhenUnfocused"><option value="off">Off</option><option value="on">On</option></select>`),

      sec("Save / Convenience"),
      row("Auto-save", `<select id="autoSave"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Checkpoint frequency", `<select id="checkpointFrequency"><option value="sparse">Sparse</option><option value="standard">Standard</option><option value="frequent">Frequent</option></select>`),
      row("Speedrun mode", `<select id="speedrunMode"><option value="off">Off</option><option value="on">On</option></select>`),

      sec("Updates"),
      row("Online update check", `<select id="updatesEnabled"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Auto update + restart", `<select id="autoUpdate"><option value="on">On</option><option value="off">Off</option></select>`),
      row("Update source", `<input id="updateSource" type="text" readonly style="opacity:0.85" />`),
      row("Current version", `<input id="currentVersion" type="text" readonly style="opacity:0.85" />`),

      `<div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">`,
      `<button id="resetDefaults">Reset defaults</button>`,
      `<button id="saveBack">Save + Back</button>`,
      `</div>`,
    ].join("");

    this.dom = this.add.dom(cx, cy + 28, wrap);
    this.backBtn = this.add.rectangle(96, 44, 156, 46, 0xdc2626, 0.98)
      .setStrokeStyle(3, 0xfee2e2)
      .setScrollFactor(0)
      .setDepth(40)
      .setInteractive({ useHandCursor: true });
    this.add.text(96, 44, "< BACK", {
      fontFamily: "Consolas",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#450a0a",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(41);
    this.backBtn.on("pointerdown", () => {
      applyAndSave();
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "Back button pressed.");
      this.goBack();
    });

    const val = (id) => wrap.querySelector(`#${id}`);
    const setSelect = (id, v) => { val(id).value = v; };
    const setRange = (id, v, suffix = "%") => {
      val(id).value = String(v);
      const txt = val(`${id}Val`);
      if (txt) txt.textContent = `${v}${suffix}`;
    };

    setSelect("difficulty", s.gameplay.difficulty);
    setSelect("textSize", s.accessibility.textSize);
    setSelect("colorblindMode", s.accessibility.colorblindMode);
    setRange("reduceScreenShake", s.accessibility.reduceScreenShake);
    setSelect("reducedMotion", s.accessibility.reducedMotion ? "on" : "off");
    setSelect("flashReduction", s.accessibility.flashReduction ? "on" : "off");
    setSelect("subtitles", s.accessibility.subtitles ? "on" : "off");
    setSelect("audioCues", s.accessibility.audioCues ? "on" : "off");

    setSelect("fullscreen", s.video.fullscreen ? "on" : "off");
    setRange("resolutionScale", s.video.resolutionScale);
    setSelect("pixelPerfect", s.video.pixelPerfect ? "on" : "off");
    setSelect("vsync", s.video.vsync ? "on" : "off");
    setSelect("fpsCap", s.video.fpsCap);
    setRange("cameraSmoothing", s.video.cameraSmoothing);
    setRange("brightness", s.video.brightness.toFixed(2), "");

    setRange("master", s.audio.master);
    setRange("music", s.audio.music);
    setRange("sfx", s.audio.sfx);
    setRange("ui", s.audio.ui);
    setSelect("dynamicRange", s.audio.dynamicRange);
    setSelect("muteWhenUnfocused", s.audio.muteWhenUnfocused ? "on" : "off");

    setSelect("autoSave", s.convenience.autoSave ? "on" : "off");
    setSelect("checkpointFrequency", s.convenience.checkpointFrequency);
    setSelect("speedrunMode", s.convenience.speedrunMode ? "on" : "off");
    setSelect("updatesEnabled", s.updates.enabled ? "on" : "off");
    setSelect("autoUpdate", s.updates.autoUpdate === false ? "off" : "on");
    val("updateSource").value = s.updates.source || "GitHub Releases";
    val("currentVersion").value = (Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || s.updates.currentVersion || "1.0.0";

    ["reduceScreenShake", "resolutionScale", "cameraSmoothing", "brightness", "master", "music", "sfx", "ui"].forEach((id) => {
      val(id).addEventListener("input", () => {
        const suffix = id === "brightness" ? "" : "%";
        val(`${id}Val`).textContent = `${val(id).value}${suffix}`;
      });
    });

    wrap.querySelectorAll("[data-bind]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.awaitingControl = btn.getAttribute("data-bind");
        if (Platformer.Debug) Platformer.Debug.log("OptionsScene.rebind", `Awaiting key for ${this.awaitingControl}`);
        this.rebindHint.setText(`Press a key for ${this.awaitingControl.toUpperCase()}...`);
      });
    });

    const applyAndSave = () => {
      const c = Platformer.Settings.current;
      c.gameplay.difficulty = val("difficulty").value;

      c.accessibility.textSize = val("textSize").value;
      c.accessibility.colorblindMode = val("colorblindMode").value;
      c.accessibility.reduceScreenShake = Number(val("reduceScreenShake").value);
      c.accessibility.reducedMotion = val("reducedMotion").value === "on";
      c.accessibility.flashReduction = val("flashReduction").value === "on";
      c.accessibility.subtitles = val("subtitles").value === "on";
      c.accessibility.audioCues = val("audioCues").value === "on";

      c.video.fullscreen = val("fullscreen").value === "on";
      c.video.resolutionScale = Number(val("resolutionScale").value);
      c.video.pixelPerfect = val("pixelPerfect").value === "on";
      c.video.vsync = val("vsync").value === "on";
      c.video.fpsCap = val("fpsCap").value;
      c.video.cameraSmoothing = Number(val("cameraSmoothing").value);
      c.video.brightness = Number(val("brightness").value);

      c.audio.master = Number(val("master").value);
      c.audio.music = Number(val("music").value);
      c.audio.sfx = Number(val("sfx").value);
      c.audio.ui = Number(val("ui").value);
      c.audio.dynamicRange = val("dynamicRange").value;
      c.audio.muteWhenUnfocused = val("muteWhenUnfocused").value === "on";

      c.convenience.autoSave = val("autoSave").value === "on";
      c.convenience.checkpointFrequency = val("checkpointFrequency").value;
      c.convenience.speedrunMode = val("speedrunMode").value === "on";

      c.updates.enabled = val("updatesEnabled").value === "on";
      c.updates.autoUpdate = val("autoUpdate").value === "on";
      c.updates.source = "GitHub Releases";
      c.updates.currentVersion = (Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || "1.0.0";
      c.updates.manifestUrl = "";
      c.updates.downloadUrl = "";

      Platformer.Settings.save();
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "Settings saved.");
      this.applyRuntimeVideoSettings();
    };

    wrap.querySelector("#saveBack").addEventListener("click", () => {
      applyAndSave();
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "Save + Back pressed.");
      this.goBack();
    });

    wrap.querySelector("#resetDefaults").addEventListener("click", () => {
      Platformer.Settings.reset();
      if (Platformer.Debug) Platformer.Debug.warn("OptionsScene", "Settings reset to defaults.");
      this.scene.restart();
    });

    this.boundKeydown = (event) => {
      if (!this.awaitingControl) return;
      event.preventDefault();
      const key = this.normalizeKey(event);
      Platformer.Settings.current.controls[this.awaitingControl] = key;
      Platformer.Settings.save();
      const btn = wrap.querySelector(`[data-bind="${this.awaitingControl}"]`);
      if (btn) btn.textContent = key;
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene.rebind", `${this.awaitingControl} -> ${key}`);
      this.rebindHint.setText(`${this.awaitingControl.toUpperCase()} bound to ${key}`);
      this.awaitingControl = null;
    };

    window.addEventListener("keydown", this.boundKeydown, true);
    this.events.once("shutdown", () => this.cleanup());

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.awaitingControl) {
        this.awaitingControl = null;
        if (Platformer.Debug) Platformer.Debug.log("OptionsScene.rebind", "Rebind cancelled with ESC.");
        this.rebindHint.setText("Click a key button to rebind. Press ESC to return.");
        return;
      }
      applyAndSave();
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "ESC save + back.");
      this.goBack();
    });
  }

  goBack() {
    if (this.returnTo === "pause") {
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "Returning to pause menu.");
      this.scene.stop();
      this.game.events.emit("options-closed-to-pause");
      return;
    }
    if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "Returning to main menu.");
    this.scene.start("MenuScene");
  }

  normalizeKey(event) {
    const k = (event.key || "").toUpperCase();
    if (k === " ") return "SPACE";
    if (k === "ESCAPE") return "ESC";
    if (k === "ARROWLEFT") return "LEFT";
    if (k === "ARROWRIGHT") return "RIGHT";
    if (k === "ARROWUP") return "UP";
    if (k === "ARROWDOWN") return "DOWN";
    if (k === "CONTROL") return "CTRL";
    return k;
  }

  applyRuntimeVideoSettings() {
    const s = Platformer.Settings.current.video;
    if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.set_fullscreen === "function") {
      window.pywebview.api.set_fullscreen(!!s.fullscreen)
        .then((res) => {
          if (res && res.ok) {
            if (Platformer.Debug) Platformer.Debug.log("Options.fullscreen", `native fullscreen=${res.fullscreen}`);
          } else if (Platformer.Debug) {
            Platformer.Debug.warn("Options.fullscreen", (res && res.message) || "native fullscreen call failed");
          }
        })
        .catch((err) => {
          if (Platformer.Debug) Platformer.Debug.warn("Options.fullscreen", `native fullscreen error: ${err && err.message ? err.message : err}`);
        });
      return;
    }

    if (s.fullscreen && !this.scale.isFullscreen) {
      this.scale.startFullscreen();
      if (Platformer.Debug) Platformer.Debug.log("Options.fullscreen", "browser fullscreen start requested");
    }
    if (!s.fullscreen && this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      if (Platformer.Debug) Platformer.Debug.log("Options.fullscreen", "browser fullscreen stop requested");
    }
  }

  shutdown() {
    this.cleanup();
  }

  cleanup() {
    if (this.boundKeydown) {
      window.removeEventListener("keydown", this.boundKeydown, true);
      this.boundKeydown = null;
    }
  }
};
