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
    this.bgSky = null;
    this.bgMid = null;
    this.bgGround = null;
    this.bgAccentTop = null;
    this.bgAccentBottom = null;
    this.bgOrbs = [];
    this.bgLines = [];
    this.onResize = null;
    this.overlayShade = null;
    this.titleText = null;
    this.hintText = null;
    this.backBtnText = null;
    this.domWrap = null;
    this.optScrollEl = null;
    this.boundDomWheel = null;
  }

  init(data) {
    this.returnTo = data && data.returnTo ? data.returnTo : "menu";
    if (Platformer.Debug) Platformer.Debug.log("OptionsScene", `Opened (returnTo=${this.returnTo}).`);
  }

  create() {
    const s = Platformer.Settings.current;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    if (this.returnTo === "menuOverlay") {
      // Menu scene stays running underneath for a live transparent backdrop.
      this.overlayShade = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x020617, 0.42)
        .setDepth(0)
        .setInteractive();
    } else {
      this.createMenuLikeBackdrop();
      this.layoutBackdrop();
    }
    this.titleText = this.add.text(cx, 48, "OPTIONS", {
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
    wrap.style.width = "min(1180px, 94vw)";
    wrap.style.maxHeight = "74vh";
    wrap.style.overflowY = "hidden";
    wrap.style.padding = "6px";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.position = "relative";
    wrap.style.fontFamily = "Consolas, monospace";
    wrap.style.color = "#e2e8f0";

    const css = `
      <style>
        .opt-grid { display:grid; grid-template-columns: repeat(2, minmax(340px, 1fr)); gap: 12px; }
        .opt-scroll {
          overflow-y:auto;
          flex:1 1 auto;
          min-height: 0;
          height: 100%;
          padding-right: 10px;
          padding-bottom: 84px;
          box-sizing: border-box;
        }
        .opt-card { background: rgba(15,23,42,0.82); border:2px solid #334155; border-radius:10px; padding: 12px; box-shadow: 0 6px 18px rgba(2,6,23,0.35); }
        .opt-title { margin: 0 0 10px 0; color:#f8fafc; font-size: 22px; letter-spacing: 0.5px; }
        .opt-row { display:flex; justify-content:space-between; align-items:center; gap:10px; margin: 8px 0; }
        .opt-row > span { color:#cbd5e1; }
        .opt-card select, .opt-card input[type="text"], .opt-card button {
          background:#1e293b; color:#e2e8f0; border:1px solid #475569; border-radius:6px; padding: 4px 8px; font-family:inherit;
        }
        .opt-card input[type="range"] { width: 170px; }
        .opt-actions {
          display:flex; gap:10px; justify-content:flex-end;
          position: absolute; left: 8px; right: 8px; bottom: 8px; z-index: 5;
          background: rgba(2,6,23,0.92); border: 1px solid #334155; border-radius: 8px; padding: 10px;
        }
        .opt-actions button { background:#0f172a; color:#f8fafc; border:2px solid #64748b; border-radius:8px; padding:8px 12px; cursor:pointer; }
        .opt-actions #saveBack { border-color:#22d3ee; }
        @media (max-width: 900px) { .opt-grid { grid-template-columns: 1fr; } }
      </style>
    `;
    const cardStart = (title) => `<section class="opt-card"><h3 class="opt-title">${title}</h3>`;
    const cardEnd = () => `</section>`;
    const row = (label, control) => `<div class="opt-row"><span>${label}</span><span>${control}</span></div>`;

    wrap.innerHTML = [
      css,
      `<div class="opt-scroll"><div class="opt-grid">`,
      cardStart("Gameplay"),
      row("Difficulty", `<select id="difficulty"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select>`),
      cardEnd(),

      cardStart("Controls"),
      row("Left", `<button data-bind="left">${s.controls.left}</button>`),
      row("Right", `<button data-bind="right">${s.controls.right}</button>`),
      row("Jump", `<button data-bind="jump">${s.controls.jump}</button>`),
      row("Dash", `<button data-bind="dash">${s.controls.dash}</button>`),
      row("Attack", `<button data-bind="attack">${s.controls.attack}</button>`),
      row("Interact", `<button data-bind="interact">${s.controls.interact}</button>`),
      row("Pause", `<button data-bind="pause">${s.controls.pause}</button>`),
      cardEnd(),

      cardStart("Accessibility"),
      row("Text size", `<select id="textSize"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>`),
      row("Colorblind mode", `<select id="colorblindMode"><option value="off">Off</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option></select>`),
      row("Reduce screen shake", `<input id="reduceScreenShake" type="range" min="0" max="100" step="1" /><span id="reduceScreenShakeVal"></span>`),
      row("Reduced motion", `<select id="reducedMotion"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Flash reduction", `<select id="flashReduction"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Subtitles", `<select id="subtitles"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Audio cues", `<select id="audioCues"><option value="off">Off</option><option value="on">On</option></select>`),
      cardEnd(),

      cardStart("Video"),
      row("Fullscreen", `<select id="fullscreen"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Resolution scale", `<input id="resolutionScale" type="range" min="50" max="100" step="1" /><span id="resolutionScaleVal"></span>`),
      row("Pixel-perfect", `<select id="pixelPerfect"><option value="off">Off</option><option value="on">On</option></select>`),
      row("VSync", `<select id="vsync"><option value="off">Off</option><option value="on">On</option></select>`),
      row("FPS cap", `<select id="fpsCap"><option value="30">30</option><option value="60">60</option><option value="unlimited">Unlimited</option></select>`),
      row("Camera smoothing", `<input id="cameraSmoothing" type="range" min="0" max="100" step="1" /><span id="cameraSmoothingVal"></span>`),
      row("Brightness", `<input id="brightness" type="range" min="0.8" max="1.2" step="0.01" /><span id="brightnessVal"></span>`),
      cardEnd(),

      cardStart("Audio"),
      row("Master volume", `<input id="master" type="range" min="0" max="100" step="1" /><span id="masterVal"></span>`),
      row("Music volume", `<input id="music" type="range" min="0" max="100" step="1" /><span id="musicVal"></span>`),
      row("SFX volume", `<input id="sfx" type="range" min="0" max="100" step="1" /><span id="sfxVal"></span>`),
      row("UI volume", `<input id="ui" type="range" min="0" max="100" step="1" /><span id="uiVal"></span>`),
      row("Dynamic range", `<select id="dynamicRange"><option value="night">Night</option><option value="normal">Normal</option><option value="wide">Wide</option></select>`),
      row("Mute when unfocused", `<select id="muteWhenUnfocused"><option value="off">Off</option><option value="on">On</option></select>`),
      cardEnd(),

      cardStart("Save / Convenience"),
      row("Auto-save", `<select id="autoSave"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Checkpoint frequency", `<select id="checkpointFrequency"><option value="sparse">Sparse</option><option value="standard">Standard</option><option value="frequent">Frequent</option></select>`),
      row("Speedrun mode", `<select id="speedrunMode"><option value="off">Off</option><option value="on">On</option></select>`),
      cardEnd(),

      cardStart("Updates"),
      row("Online update check", `<select id="updatesEnabled"><option value="off">Off</option><option value="on">On</option></select>`),
      row("Auto update + restart", `<select id="autoUpdate"><option value="on">On</option><option value="off">Off</option></select>`),
      row("Update source", `<input id="updateSource" type="text" readonly style="opacity:0.85" />`),
      row("Current version", `<input id="currentVersion" type="text" readonly style="opacity:0.85" />`),
      cardEnd(),
      `</div></div>`,

      `<div class="opt-actions">`,
      `<button id="resetDefaults">Reset defaults</button>`,
      `<button id="saveBack">Save + Back</button>`,
      `</div>`,
    ].join("");

    this.domWrap = wrap;
    this.dom = this.add.dom(cx, cy + 28, wrap);
    this.backBtn = this.add.rectangle(96, 44, 156, 46, 0xdc2626, 0.98)
      .setStrokeStyle(3, 0xfee2e2)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(40)
      .setInteractive({ useHandCursor: true });
    this.backBtnText = this.add.text(96, 44, "< BACK", {
      fontFamily: "Consolas",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#450a0a",
      strokeThickness: 5,
    }).setOrigin(0, 0.5).setDepth(41);
    this.backBtn.on("pointerdown", async () => {
      await applyAndSave();
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "Back button pressed.");
      this.goBack();
    });

    const val = (id) => wrap.querySelector(`#${id}`);
    this.optScrollEl = wrap.querySelector(".opt-scroll");
    if (this.optScrollEl) {
      this.boundDomWheel = (event) => {
        this.optScrollEl.scrollTop += event.deltaY;
        event.preventDefault();
        event.stopPropagation();
      };
      this.optScrollEl.addEventListener("wheel", this.boundDomWheel, { passive: false });
    }
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

    const applyAndSave = async () => {
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

      await Platformer.Settings.save();
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "Settings saved.");
      this.applyRuntimeVideoSettings();
    };

    wrap.querySelector("#saveBack").addEventListener("click", async () => {
      await applyAndSave();
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
    if (this.returnTo !== "menuOverlay") {
      this.onResize = () => this.layoutOptions();
      this.scale.on("resize", this.onResize);
    } else {
      this.onResize = () => this.layoutOptions();
      this.scale.on("resize", this.onResize);
    }
    this.layoutOptions();

    this.input.keyboard.on("keydown-ESC", async () => {
      if (this.awaitingControl) {
        this.awaitingControl = null;
        if (Platformer.Debug) Platformer.Debug.log("OptionsScene.rebind", "Rebind cancelled with ESC.");
        this.rebindHint.setText("Click a key button to rebind. Press ESC to return.");
        return;
      }
      await applyAndSave();
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "ESC save + back.");
      this.goBack();
    });
  }

  createMenuLikeBackdrop() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.bgSky = this.add.rectangle(0, 0, w, h, 0x081336, 0.62).setOrigin(0, 0);
    this.bgMid = this.add.rectangle(0, 0, w, 220, 0x132a56, 0.52).setOrigin(0, 0);
    this.bgGround = this.add.rectangle(0, 0, w, 120, 0x0b6f49, 0.46).setOrigin(0, 0);
    this.bgAccentTop = this.add.rectangle(0, 0, w, Math.round(h * 0.42), 0x1e3a8a, 0.16).setOrigin(0, 0);
    this.bgAccentBottom = this.add.rectangle(0, 0, w, Math.round(h * 0.2), 0x34d399, 0.13).setOrigin(0, 0);

    const orbA = this.add.circle(w * 0.78, h * 0.22, 150, 0x53e0ff, 0.08).setBlendMode(Phaser.BlendModes.ADD);
    const orbB = this.add.circle(w * 0.2, h * 0.3, 110, 0xff71c7, 0.07).setBlendMode(Phaser.BlendModes.ADD);
    this.bgOrbs = [orbA, orbB];

    this.bgLines = [];
    for (let i = 0; i < 10; i += 1) {
      const line = this.add.rectangle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(40, h - 80),
        Phaser.Math.Between(70, 150),
        2,
        i % 3 === 0 ? 0xff71c7 : 0x53e0ff,
        0.18
      ).setOrigin(0, 0.5);
      line.moveSpeed = Phaser.Math.FloatBetween(26, 62);
      this.bgLines.push(line);
    }
  }

  layoutBackdrop() {
    if (!this.bgSky) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const cy = h / 2;
    this.bgSky.setSize(w, h).setPosition(0, 0);
    this.bgMid.setSize(w, 220).setPosition(0, cy + 160);
    this.bgGround.setSize(w, 120).setPosition(0, cy + 220);
    this.bgAccentTop.setSize(w, Math.round(h * 0.42)).setPosition(0, 0);
    this.bgAccentBottom.setSize(w, Math.round(h * 0.2)).setPosition(0, h - Math.round(h * 0.24));
  }

  layoutOptions() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;
    this.layoutBackdrop();
    if (this.overlayShade) {
      this.overlayShade.setPosition(cx, cy).setSize(w, h);
    }
    if (this.titleText) this.titleText.setPosition(cx, 48);
    if (this.rebindHint) this.rebindHint.setPosition(cx, 92);

    if (this.domWrap) {
      const panelH = Math.floor(Math.max(320, h * 0.74));
      this.domWrap.style.width = `${Math.floor(Math.min(1180, w * 0.94))}px`;
      this.domWrap.style.maxHeight = `${panelH}px`;
      this.domWrap.style.height = `${panelH}px`;
    }
    if (this.optScrollEl) {
      this.optScrollEl.style.height = "100%";
      this.optScrollEl.style.maxHeight = "100%";
      this.optScrollEl.style.overflowY = "auto";
    }
    const topY = 130;
    const panelH = Math.floor(Math.max(320, h * 0.74));
    const domY = Math.min(cy + 28, topY + (panelH / 2));
    if (this.dom) {
      this.dom.setPosition(cx, domY);
      if (typeof this.dom.updateSize === "function") this.dom.updateSize();
    }

    if (this.backBtn) this.backBtn.setPosition(14, 44);
    if (this.backBtnText) this.backBtnText.setPosition(36, 44);
  }

  goBack() {
    if (this.returnTo === "menuOverlay") {
      const menuScene = this.scene.get("MenuScene");
      if (menuScene && typeof menuScene.setMenuInteractive === "function") {
        if (typeof menuScene.setMenuUiVisible === "function") menuScene.setMenuUiVisible(true);
        menuScene.setMenuInteractive(true);
      }
      if (Platformer.Debug) Platformer.Debug.log("OptionsScene", "Returning to live main menu overlay.");
      this.scene.stop();
      return;
    }
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
    if (this.returnTo === "menuOverlay") {
      const menuScene = this.scene.get("MenuScene");
      if (menuScene) {
        if (typeof menuScene.setMenuUiVisible === "function") menuScene.setMenuUiVisible(true);
        if (typeof menuScene.setMenuInteractive === "function") menuScene.setMenuInteractive(true);
      }
    }
    if (this.onResize) {
      this.scale.off("resize", this.onResize);
      this.onResize = null;
    }
    if (this.optScrollEl && this.boundDomWheel) {
      this.optScrollEl.removeEventListener("wheel", this.boundDomWheel);
    }
    this.boundDomWheel = null;
    this.optScrollEl = null;
    if (this.boundKeydown) {
      window.removeEventListener("keydown", this.boundKeydown, true);
      this.boundKeydown = null;
    }
  }

  update(time, delta) {
    const dt = Math.max(0.001, delta / 1000);
    const w = this.scale.width;
    this.bgLines.forEach((line) => {
      if (!line || !line.active) return;
      line.x -= line.moveSpeed * dt;
      if (line.x < -line.width - 10) line.x = w + Phaser.Math.Between(10, 80);
    });
    const t = time * 0.001;
    if (this.bgOrbs && this.bgOrbs.length === 2) {
      this.bgOrbs[0].x = this.scale.width * 0.78 + Math.cos(t * 0.6) * 16;
      this.bgOrbs[1].x = this.scale.width * 0.2 + Math.sin(t * 0.75) * 18;
    }
  }
};
