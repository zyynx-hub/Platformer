window.Platformer = window.Platformer || {};

Platformer.MenuScene = class extends Phaser.Scene {
  constructor() {
    super("MenuScene");
    this.menuMusic = null;
    this.menuMusicHtml = null;
    this.updateButton = null;
    this.updateButtonText = null;
    this.versionInfoText = null;
    this.changeButton = null;
    this.changeButtonText = null;
    this.changePanel = null;
    this.changePanelTitle = null;
    this.changePanelBody = null;
    this.changePanelOpen = false;
    this.localBuildNotes = [
      "No update details yet.",
      "",
      "Recent changes:",
      "- Live animated menu lane (runner + enemy stomps)",
      "- Menu hit feedback (red blink + knockback, non-lethal)",
      "- Menu ambient state persists after Options return",
      "- Options opens as live overlay over animated menu",
      "- Reworked Options into standalone category cards",
      "- Resize-safe Options layout and anchored back button",
      "- Stable Options scrolling with fixed action footer",
      "- Save + Back / Reset defaults always visible",
      "",
      "If online notes are available, this panel auto-refreshes from GitHub Releases.",
    ].join("\n");
    this.latestReleaseNotes = this.localBuildNotes;
    this.latestReleaseTag = "";
    this.pendingUpdateUrl = "";
    this.updateInProgress = false;
    this.bgSky = null;
    this.bgMid = null;
    this.bgGround = null;
    this.bgAccentTop = null;
    this.bgAccentBottom = null;
    this.bgOrbs = [];
    this.menuCard = null;
    this.titleText = null;
    this.titleShadow = null;
    this.comingSoonText = null;
    this.menuButtons = {};
    this.onResize = null;
    this.menuUiElements = [];
    this.menuInteractive = false;
    this.introFx = null;
    this.introParticles = null;
    this.introLines = [];
    this.introGlow = null;
    this.menuIntroInProgress = false;
    this.menuIntroUiFadeCall = null;
    this.menuIntroDoneCall = null;
    this.menuStage = null;
    this.menuRunner = null;
    this.menuRunnerFace = 1;
    this.menuRunnerGroundY = 0;
    this.menuRunnerSpeed = 82;
    this.menuRunnerJumpVy = -270;
    this.menuRunnerVy = 0;
    this.menuRunnerGravity = 700;
    this.menuRunnerJumpCooldown = 0;
    this.menuRunnerActionTimer = 0;
    this.menuRunnerDamageCooldown = 0;
    this.menuRunnerDamageFlashUntil = 0;
    this.menuEnemies = [];
    this.onSettingsChanged = null;
    this.introConfig = {
      totalMs: 1800,
      uiFadeMs: 260,
      titleRevealDelayMs: 80,
      titleRevealMs: 420,
      buttonStaggerMs: 90,
      buttonMovePx: 18,
      skyColor: 0x081336,
      midColor: 0x132a56,
      groundColor: 0x0b6f49,
      glowCyan: 0x53e0ff,
      glowPink: 0xff71c7,
    };
  }

  create() {
    const textScale = Platformer.Settings.textScale();

    this.bgSky = this.add.rectangle(0, 0, 10, 10, this.introConfig.skyColor, 1).setOrigin(0, 0);
    this.bgMid = this.add.rectangle(0, 0, 10, 10, this.introConfig.midColor, 1).setOrigin(0, 0);
    this.bgGround = this.add.rectangle(0, 0, 10, 10, this.introConfig.groundColor, 1).setOrigin(0, 0);
    this.bgAccentTop = this.add.rectangle(0, 0, 10, 10, 0x1e3a8a, 0.24).setOrigin(0, 0);
    this.bgAccentBottom = this.add.rectangle(0, 0, 10, 10, 0x34d399, 0.22).setOrigin(0, 0);
    this.createPrettyBackdrop();

    this.titleShadow = this.add.text(0, 74, "ANIME PLATFORMER", {
      fontFamily: "Verdana",
      fontSize: `${Math.round(46 * textScale)}px`,
      color: "#67e8f9",
      stroke: "#020617",
      strokeThickness: 12,
    }).setOrigin(0.5).setDepth(13).setAlpha(0.26);

    this.titleText = this.add.text(0, 72, "ANIME PLATFORMER", {
      fontFamily: "Verdana",
      fontSize: `${Math.round(46 * textScale)}px`,
      color: "#f8fafc",
      stroke: "#1e293b",
      strokeThickness: 7,
    }).setOrigin(0.5).setDepth(14);
    this.onSettingsChanged = (nextSettings) => this.applyRuntimeSettings(nextSettings);
    this.game.events.on("settings-changed", this.onSettingsChanged);
    this.setupMenuMusic();

    const makeButton = (id, y, label, onClick, opts = {}) => {
      const disabled = !!opts.disabled;
      const glow = this.add.rectangle(0, y, 286, 56, 0x22d3ee, disabled ? 0.08 : 0.14)
        .setDepth(9)
        .setBlendMode(Phaser.BlendModes.ADD);
      const box = this.add.rectangle(0, y, 280, 50, disabled ? 0x475569 : 0x243b67, 0.96)
        .setStrokeStyle(3, disabled ? 0x64748b : 0x7dd3fc, 0.95)
        .setDepth(10);
      const txt = this.add.text(0, y, label, {
        fontFamily: "Consolas",
        fontSize: `${Math.round(30 * textScale)}px`,
        color: disabled ? "#cbd5e1" : "#f8fafc",
        stroke: disabled ? "#334155" : "#0f172a",
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(11);

      if (!disabled) {
        box.setInteractive({ useHandCursor: true });
        box.on("pointerover", () => {
          box.setFillStyle(0x2f4f86, 1);
          glow.setAlpha(0.26);
          this.tweens.add({ targets: [box, txt, glow], scaleX: 1.03, scaleY: 1.03, duration: 120, ease: "Sine.Out" });
        });
        box.on("pointerout", () => {
          box.setFillStyle(0x243b67, 0.96);
          glow.setAlpha(0.14);
          this.tweens.add({ targets: [box, txt, glow], scaleX: 1, scaleY: 1, duration: 120, ease: "Sine.Out" });
        });
        box.on("pointerdown", onClick);
      }

      this.menuButtons[id] = { box, txt, glow };
      return this.menuButtons[id];
    };

    const launchWorldMap = () => {
      // Keep menu BGM flowing into world map; gameplay scene will take over music.
      if (this.scene.isActive("UIScene") || this.scene.isPaused("UIScene")) this.scene.stop("UIScene");
      if (this.scene.isActive("GameScene") || this.scene.isPaused("GameScene")) this.scene.stop("GameScene");
      if (Platformer.Progress && typeof Platformer.Progress.ensureLoaded === "function") {
        Platformer.Progress.ensureLoaded();
      }
      this.scene.start("WorldMapScene");
      if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Play -> WorldMapScene launched.");
    };

    const startGame = () => {
      if (!this.menuInteractive) return;
      Platformer.beeper.unlock();
      if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Play clicked.");
      if (this.sound && this.sound.context && this.sound.context.state === "suspended") {
        this.sound.context.resume().catch(() => {});
      }
      launchWorldMap();
    };

    makeButton("play", 0, "PLAY", startGame);
    makeButton("continue", 0, "CONTINUE", null, { disabled: true });
    this.comingSoonText = this.add.text(0, 0, "Coming soon ^^", {
      fontFamily: "Consolas",
      fontSize: `${Math.round(17 * textScale)}px`,
      color: "#fef3c7",
      stroke: "#78350f",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12);

    makeButton("options", 0, "OPTIONS", () => {
      if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Opening OptionsScene from menu.");
      try {
        this.scene.start("OptionsScene", { returnTo: "menu" });
        if (Platformer.Debug) Platformer.Debug.log("MenuScene.options", "OptionsScene started in dedicated mode.");
      } catch (err) {
        if (Platformer.Debug) {
          Platformer.Debug.error("MenuScene.options", err && err.stack ? err.stack : String(err));
        }
      }
    });
    makeButton("extras", 0, "EXTRA'S", () => this.showExtras());
    makeButton("exit", 0, "EXIT", () => this.handleExit());
    this.createBottomLeftVersionInfo();
    this.createMenuUpdateWidget();
    this.createWhatsChangedWidget();
    this.createMenuMiniStage();
    this.menuCard = this.add.rectangle(0, 0, 360, 390, 0x0b1731, 0.46)
      .setStrokeStyle(2, 0x7dd3fc, 0.38)
      .setDepth(8.5);
    this.collectMenuUiElements();
    const shouldPlayMenuIntro = !Platformer._menuBootIntroPlayed;
    if (shouldPlayMenuIntro) {
      Platformer._menuBootIntroPlayed = true;
      this.setMenuUiVisible(false);
      this.setMenuInteractive(false);
    } else {
      this.setMenuUiVisible(true);
      this.setMenuInteractive(true);
    }
    this.createMenuIntroFx();
    this.layoutMenu();
    this.onResize = () => {
      if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
      this.handleResize();
    };
    this.scale.on("resize", this.onResize);
    if (shouldPlayMenuIntro) this.playMenuIntro();

    this.input.keyboard.on("keydown-ENTER", startGame);
  }

  layoutMenu() {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
    if (!this.bgSky || !this.bgMid || !this.bgGround) return;
    if (!this.titleText || !this.titleShadow) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    const safeRectSizePos = (obj, width, height, x, y) => {
      if (!obj || !obj.active || !obj.scene) return;
      obj.setSize(width, height).setPosition(x, y);
    };
    const safePos = (obj, x, y) => {
      if (!obj || !obj.active || !obj.scene) return;
      obj.setPosition(x, y);
    };

    try {
      safeRectSizePos(this.bgSky, w, h, 0, 0);
      safeRectSizePos(this.bgMid, w, 220, 0, cy + 160);
      safeRectSizePos(this.bgGround, w, 120, 0, cy + 220);
      safeRectSizePos(this.bgAccentTop, w, Math.round(h * 0.42), 0, 0);
      safeRectSizePos(this.bgAccentBottom, w, Math.round(h * 0.2), 0, h - Math.round(h * 0.24));
      safePos(this.titleShadow, cx, 74);
      safePos(this.titleText, cx, 72);
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.warn("MenuScene.layout", `Skipping stale resize pass: ${err && err.message ? err.message : err}`);
      }
      return;
    }

    const y0 = cy - 40;
    const spacing = 60;
    const p = this.menuButtons.play;
    const c = this.menuButtons.continue;
    const o = this.menuButtons.options;
    const cr = this.menuButtons.extras;
    const e = this.menuButtons.exit;
    const place = (item, y) => {
      if (!item) return;
      if (item.glow) item.glow.setPosition(cx, y);
      item.box.setPosition(cx, y);
      item.txt.setPosition(cx, y);
    };
    place(p, y0);
    place(c, y0 + spacing);
    place(o, y0 + spacing * 2);
    place(cr, y0 + spacing * 3);
    place(e, y0 + spacing * 4);
    if (this.menuCard) this.menuCard.setPosition(cx, y0 + spacing * 2).setSize(360, 356);
    if (this.comingSoonText) this.comingSoonText.setPosition(cx + 210, y0 + spacing);

    if (this.updateButton && this.updateButtonText) {
      const ux = w - 96;
      const uy = 38;
      this.updateButton.setPosition(ux, uy);
      this.updateButtonText.setPosition(ux, uy);
    }
    if (this.changeButton && this.changeButtonText) {
      const cxRight = w - 96;
      const cyTop = 84;
      this.changeButton.setPosition(cxRight, cyTop);
      this.changeButtonText.setPosition(cxRight, cyTop);
    }
    if (this.changePanel && this.changePanelTitle && this.changePanelBody) {
      const panelW = Math.min(560, Math.max(380, Math.round(w * 0.34)));
      const panelH = Math.min(430, Math.max(240, Math.round(h * 0.5)));
      const px = w - panelW / 2 - 20;
      const py = Math.min(116 + panelH / 2, h - panelH / 2 - 20);
      this.changePanel.setSize(panelW, panelH).setPosition(px, py);
      this.changePanelTitle.setPosition(px - panelW / 2 + 16, py - panelH / 2 + 12);
      this.changePanelBody
        .setPosition(px - panelW / 2 + 16, py - panelH / 2 + 44)
        .setWordWrapWidth(panelW - 32);
    }
    if (this.versionInfoText && this.versionInfoText.active && this.versionInfoText.scene) this.versionInfoText.setPosition(14, h - 12);
    this.layoutMenuMiniStage();
    this.layoutMenuIntroFx();
  }

  createMenuMiniStage() {
    this.menuStage = this.add.container(0, 0).setDepth(7.8);

    // Invisible logical lane: runner/enemies stay inside the existing green menu band.
    const lane = this.add.rectangle(0, 0, 10, 10, 0x12815f, 0).setOrigin(0, 0.5);
    const topStrip = this.add.rectangle(0, 0, 10, 8, 0x4ade80, 0).setOrigin(0, 1);
    const laneShade = this.add.rectangle(0, 0, 10, 10, 0x0c5e45, 0).setOrigin(0, 0.5);
    this.menuStage.add([lane, topStrip]);
    this.menuStage.lane = lane;
    this.menuStage.topStrip = topStrip;
    this.menuStage.laneShade = laneShade;
    this.menuStage.add(laneShade);

    this.menuRunner = this.add.sprite(0, 0, this.textureOr("player-run-1", "player")).setDepth(8.2);
    this.menuRunner.setDisplaySize(48, 64);
    this.menuStage.add(this.menuRunner);

    this.menuEnemies = [];
    for (let i = 0; i < 4; i += 1) {
      const enemy = this.add.sprite(0, 0, this.textureOr("enemy-e", "enemy")).setDepth(8.15);
      enemy.setDisplaySize(34, 34);
      enemy.menuX = 0;
      enemy.menuDir = i % 2 === 0 ? 1 : -1;
      enemy.menuSpeed = 30 + (i * 8);
      enemy.alive = true;
      enemy.respawnAt = 0;
      this.menuEnemies.push(enemy);
      this.menuStage.add(enemy);
    }
    this.restoreMenuMiniStageState();
  }

  layoutMenuMiniStage() {
    if (!this.menuStage || !this.menuStage.lane || !this.menuStage.topStrip) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const baseGroundTop = this.bgGround ? this.bgGround.y : (h - 160);
    const baseGroundH = this.bgGround ? this.bgGround.height : 120;
    const laneY = baseGroundTop + Math.round(baseGroundH * 0.44);
    const laneH = Math.max(30, Math.round(baseGroundH * 0.34));
    const margin = 26;
    const laneX = margin;
    const laneW = Math.max(280, w - margin * 2);
    this.menuRunnerGroundY = laneY - 6;

    this.menuStage.lane.setPosition(laneX, laneY).setSize(laneW, laneH);
    this.menuStage.topStrip.setPosition(laneX, laneY).setSize(laneW, 8);
    this.menuStage.laneShade.setPosition(laneX, laneY + 12).setSize(laneW, laneH - 12);

    if (this.menuRunner) {
      if (!Number.isFinite(this.menuRunner.menuX)) {
        this.menuRunner.menuX = laneX + 60;
      }
      this.menuRunner.y = this.menuRunnerGroundY;
    }

    const slot = laneW / (this.menuEnemies.length + 1);
    this.menuEnemies.forEach((enemy, idx) => {
      if (!enemy) return;
      if (!enemy.alive && this.time.now < enemy.respawnAt) return;
      enemy.alive = true;
      enemy.menuX = laneX + slot * (idx + 1) + Phaser.Math.Between(-26, 26);
      enemy.y = this.menuRunnerGroundY + 2;
      enemy.setVisible(true);
      enemy.setAlpha(1);
    });
  }

  restoreMenuMiniStageState() {
    const s = Platformer._menuAmbientState;
    if (!s) return;
    if (this.menuRunner && Number.isFinite(s.runnerX)) {
      this.menuRunner.menuX = s.runnerX;
      this.menuRunner.y = Number.isFinite(s.runnerY) ? s.runnerY : this.menuRunnerGroundY;
      this.menuRunnerFace = s.runnerFace === -1 ? -1 : 1;
      this.menuRunnerVy = Number.isFinite(s.runnerVy) ? s.runnerVy : 0;
      this.menuRunnerJumpCooldown = Number.isFinite(s.runnerJumpCooldown) ? s.runnerJumpCooldown : 0;
      this.menuRunnerDamageCooldown = Number.isFinite(s.runnerDamageCooldown) ? s.runnerDamageCooldown : 0;
      this.menuRunnerActionTimer = Number.isFinite(s.runnerActionTimer) ? s.runnerActionTimer : 0;
    }
    if (Array.isArray(s.enemies) && this.menuEnemies && this.menuEnemies.length) {
      this.menuEnemies.forEach((enemy, idx) => {
        const se = s.enemies[idx];
        if (!enemy || !se) return;
        enemy.menuX = Number.isFinite(se.x) ? se.x : enemy.menuX;
        enemy.menuDir = se.dir === -1 ? -1 : 1;
        enemy.alive = se.alive !== false;
        enemy.respawnAt = Number.isFinite(se.respawnAt) ? se.respawnAt : 0;
        enemy.setVisible(enemy.alive);
        if (enemy.alive) {
          enemy.setAlpha(1);
          enemy.setScale(1, 1);
        }
      });
    }
  }

  saveMenuMiniStageState() {
    Platformer._menuAmbientState = {
      runnerX: this.menuRunner && Number.isFinite(this.menuRunner.menuX) ? this.menuRunner.menuX : null,
      runnerY: this.menuRunner ? this.menuRunner.y : null,
      runnerFace: this.menuRunnerFace,
      runnerVy: this.menuRunnerVy,
      runnerJumpCooldown: this.menuRunnerJumpCooldown,
      runnerDamageCooldown: this.menuRunnerDamageCooldown,
      runnerActionTimer: this.menuRunnerActionTimer,
      enemies: (this.menuEnemies || []).map((enemy) => ({
        x: enemy && Number.isFinite(enemy.menuX) ? enemy.menuX : null,
        dir: enemy && enemy.menuDir === -1 ? -1 : 1,
        alive: !!(enemy && enemy.alive),
        respawnAt: enemy && Number.isFinite(enemy.respawnAt) ? enemy.respawnAt : 0,
      })),
    };
  }

  handleResize() {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
    this.layoutMenu();
    if (this.menuIntroInProgress) {
      this.forceCompleteMenuIntro();
    }
  }

  createMenuUpdateWidget() {
    const x = this.scale.width - 96;
    const y = 38;
    this.updateButton = this.add.rectangle(x, y, 160, 38, 0x334155, 0.95)
      .setStrokeStyle(2, 0x67e8f9, 0.95)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.updateButtonText = this.add.text(x, y, "Update", {
      fontFamily: "Consolas",
      fontSize: "22px",
      color: "#f8fafc",
    }).setOrigin(0.5).setDepth(21);
    this.updateButton.on("pointerover", () => this.updateButton.setFillStyle(0x3b4f73, 0.98));
    this.updateButton.on("pointerout", () => this.updateButton.setFillStyle(0x334155, 0.95));
    this.updateButton.on("pointerdown", async () => {
      if (this.updateInProgress) {
        // Top-right status text intentionally hidden; bottom-left remains source of truth.
        return;
      }

      if (this.pendingUpdateUrl) {
        if (Platformer.Updater.canInAppApply()) {
          const result = await this.startInAppUpdate(this.pendingUpdateUrl, "Updating game...");
          if (!result.ok && Platformer.Debug) {
            Platformer.Debug.error("MenuScene.update", result.message || "Update failed.");
          }
          return;
        }

        if (Platformer.Debug) Platformer.Debug.log("MenuScene.update", `In-app updater unavailable; opening URL: ${this.pendingUpdateUrl}`);
        const opened = Platformer.Updater.openDownload(this.pendingUpdateUrl);
        this.setBottomLeftUpdateStatus(opened ? "Downloading update..." : "Update download failed");
        return;
      }

      this.setBottomLeftUpdateStatus("Checking for updates...");
      if (Platformer.Debug) Platformer.Debug.log("MenuScene.update", "Manual update check requested.");
      const result = await Platformer.Updater.check();
      if (!result.ok) {
        this.setBottomLeftUpdateStatus(result.message || "Can't reach update server.");
        return;
      }
      this.setLatestChangesFromResult(result);
      if (!result.enabled) {
        this.setBottomLeftUpdateStatus("Auto updates are off.");
        return;
      }
      if (result.hasUpdate) {
        this.pendingUpdateUrl = result.downloadUrl || "";
        Platformer.Updater.latestChecksumSha256 = result.checksumSha256 || "";
        this.updateButtonText.setText(this.pendingUpdateUrl ? "Update + Restart" : "Update");
        const v = result.latestVersion ? `v${result.latestVersion}` : "new";
        this.setBottomLeftUpdateStatus(`Update found (${v}).`);
        if (Platformer.Debug) Platformer.Debug.warn("MenuScene.update", `Update available: ${v}`);
      } else {
        this.pendingUpdateUrl = "";
        Platformer.Updater.latestChecksumSha256 = "";
        this.updateButtonText.setText("Update");
        this.setBottomLeftUpdateStatus("You're up to date.");
        if (Platformer.Debug) Platformer.Debug.log("MenuScene.update", "No update available.");
      }
    });

    this.time.delayedCall(100, () => this.autoCheckUpdatesForBottomLeft());
  }

  async startInAppUpdate(downloadUrl, startMessage = "Preparing update...") {
    this.updateInProgress = true;
    this.updateButton.disableInteractive();
    this.updateButtonText.setText("Updating...");
    this.setBottomLeftUpdateStatus(startMessage);
    if (Platformer.Debug) Platformer.Debug.log("MenuScene.update", startMessage);

    const result = await Platformer.Updater.updateAndRestart(downloadUrl, (status) => {
      const pct = Number(status.progress || 0);
      const msg = status.message || status.stage || "Updating...";
      const compact = status.stage === "downloading" && Number.isFinite(pct)
        ? `${msg} (${pct.toFixed(1)}%)`
        : msg;
      this.setBottomLeftUpdateStatus(compact);
    });

    if (!result.ok) {
      this.updateInProgress = false;
      this.updateButton.setInteractive({ useHandCursor: true });
      this.updateButtonText.setText("Update + Restart");
      this.setBottomLeftUpdateStatus(result.message || "Update failed.");
      return { ok: false, message: result.message || "Update failed." };
    }

    this.setBottomLeftUpdateStatus(result.message || "Restarting to finish update...");
    return { ok: true, message: result.message || "Restarting to finish update..." };
  }

  createBottomLeftVersionInfo() {
    const currentVersion = ((Platformer.Settings.current.updates || {}).currentVersion || "1.0.0").trim();
    this.versionInfoStyle = {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#e2e8f0",
      stroke: "#0f172a",
      strokeThickness: 4,
      align: "left",
    };
    this.ensureVersionInfoText();

    this.setBottomLeftUpdateStatus("Checking for updates...");
    this.safeSetText(this.versionInfoText, `Version: ${currentVersion}\nUpdate: Checking for updates...`, "versionInfoText");
  }

  ensureVersionInfoText() {
    if (this.versionInfoText && this.versionInfoText.active && this.versionInfoText.scene === this) {
      this.versionInfoText.setPosition(14, this.scale.height - 12);
      return this.versionInfoText;
    }
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return null;
    try {
      this.versionInfoText = this.add.text(14, this.scale.height - 12, "", this.versionInfoStyle || {
        fontFamily: "Consolas",
        fontSize: "18px",
        color: "#e2e8f0",
        stroke: "#0f172a",
        strokeThickness: 4,
        align: "left",
      }).setOrigin(0, 1).setDepth(25);
      return this.versionInfoText;
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.warn("MenuScene.text", `ensureVersionInfoText failed: ${err && err.message ? err.message : err}`);
      }
      return null;
    }
  }

  safeSetText(target, text, label = "text") {
    if (!target || !target.active || !target.scene) return false;
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return false;
    try {
      target.setText(String(text));
      return true;
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.warn("MenuScene.text", `setText failed (${label}): ${err && err.message ? err.message : err}`);
      }
      if (target === this.versionInfoText) {
        const rebuilt = this.ensureVersionInfoText();
        if (rebuilt && rebuilt !== target) {
          try {
            rebuilt.setText(String(text));
            return true;
          } catch (err2) {
            if (Platformer.Debug) {
              Platformer.Debug.warn("MenuScene.text", `setText retry failed (${label}): ${err2 && err2.message ? err2.message : err2}`);
            }
          }
        }
      }
      return false;
    }
  }

  setBottomLeftUpdateStatus(statusText) {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
    if (!this.ensureVersionInfoText()) return;
    const currentVersion = ((Platformer.Settings.current.updates || {}).currentVersion || "1.0.0").trim();
    const safeStatus = statusText || "Unknown";
    this.safeSetText(this.versionInfoText, `Version: ${currentVersion}\nUpdate: ${safeStatus}`, "bottomLeftStatus");
  }

  async autoCheckUpdatesForBottomLeft() {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
    const cfg = Platformer.Settings.current.updates || {};
    if (!cfg.enabled) {
      this.setBottomLeftUpdateStatus("Auto updates are off.");
      return;
    }

    this.setBottomLeftUpdateStatus("Checking for updates...");
    const result = await Platformer.Updater.check();
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
    if (!this.scene || !this.scene.isActive || !this.scene.isActive("MenuScene")) return;
    if (!result.ok) {
      if (result.transient) {
        this.setBottomLeftUpdateStatus("Checking for updates...");
        if (this.time && this.sys && this.sys.settings && this.sys.settings.active) {
          this.time.delayedCall(1200, () => this.autoCheckUpdatesForBottomLeft());
        }
        return;
      }
      this.setBottomLeftUpdateStatus(result.message || "Can't reach update server.");
      return;
    }
    if (!result.enabled) {
      this.setBottomLeftUpdateStatus("Auto updates are off.");
      return;
    }
    this.setLatestChangesFromResult(result);

    if (result.hasUpdate) {
      const v = result.latestVersion ? `v${result.latestVersion}` : "new version";
      this.pendingUpdateUrl = result.downloadUrl || "";
      Platformer.Updater.latestChecksumSha256 = result.checksumSha256 || "";
      this.safeSetText(this.updateButtonText, this.pendingUpdateUrl ? "Update + Restart" : "Update", "updateButtonText");
      this.setBottomLeftUpdateStatus(`Update found (${v}). Press Update.`);
    } else {
      this.setBottomLeftUpdateStatus("You're up to date.");
      Platformer.Updater.latestChecksumSha256 = "";
      this.safeSetText(this.updateButtonText, "Update", "updateButtonText");
    }
  }

  createWhatsChangedWidget() {
    const x = this.scale.width - 96;
    const y = 84;
    this.changeButton = this.add.rectangle(x, y, 160, 34, 0x1e293b, 0.95)
      .setStrokeStyle(2, 0x67e8f9, 0.95)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.changeButtonText = this.add.text(x, y, "What's Changed", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#e2e8f0",
    }).setOrigin(0.5).setDepth(21);

    this.changePanel = this.add.rectangle(0, 0, 480, 290, 0x0f172a, 0.92)
      .setStrokeStyle(2, 0x67e8f9)
      .setDepth(22)
      .setVisible(false);
    this.changePanelTitle = this.add.text(0, 0, "What's Changed", {
      fontFamily: "Consolas",
      fontSize: "20px",
      color: "#f8fafc",
    }).setOrigin(0, 0).setDepth(23).setVisible(false);
    this.changePanelBody = this.add.text(0, 0, this.latestReleaseNotes, {
      fontFamily: "Consolas",
      fontSize: "15px",
      color: "#cbd5e1",
      align: "left",
      wordWrap: { width: 440, useAdvancedWrap: true },
    }).setOrigin(0, 0).setDepth(23).setVisible(false);

    this.changeButton.on("pointerover", () => this.changeButton.setFillStyle(0x334155, 0.98));
    this.changeButton.on("pointerout", () => this.changeButton.setFillStyle(0x1e293b, 0.95));
    this.changeButton.on("pointerdown", () => {
      this.changePanelOpen = !this.changePanelOpen;
      const on = this.changePanelOpen;
      this.changePanel.setVisible(on);
      this.changePanelTitle.setVisible(on);
      this.changePanelBody.setVisible(on);
      if (on) {
        this.changeButtonText.setText("Hide Changes");
      } else {
        this.changeButtonText.setText("What's Changed");
      }
    });
  }

  collectMenuUiElements() {
    this.menuUiElements = [];
    if (this.titleText) this.menuUiElements.push(this.titleText);
    if (this.titleShadow) this.menuUiElements.push(this.titleShadow);
    if (this.menuCard) this.menuUiElements.push(this.menuCard);
    Object.values(this.menuButtons).forEach((b) => {
      if (b && b.glow) this.menuUiElements.push(b.glow);
      if (b && b.box) this.menuUiElements.push(b.box);
      if (b && b.txt) this.menuUiElements.push(b.txt);
    });
    if (this.comingSoonText) this.menuUiElements.push(this.comingSoonText);
    if (this.updateButton) this.menuUiElements.push(this.updateButton);
    if (this.updateButtonText) this.menuUiElements.push(this.updateButtonText);
    if (this.changeButton) this.menuUiElements.push(this.changeButton);
    if (this.changeButtonText) this.menuUiElements.push(this.changeButtonText);
    if (this.changePanel) this.menuUiElements.push(this.changePanel);
    if (this.changePanelTitle) this.menuUiElements.push(this.changePanelTitle);
    if (this.changePanelBody) this.menuUiElements.push(this.changePanelBody);
    if (this.versionInfoText) this.menuUiElements.push(this.versionInfoText);
  }

  setMenuUiVisible(visible) {
    const a = visible ? 1 : 0;
    this.menuUiElements.forEach((el) => {
      if (!el || !el.active) return;
      el.setAlpha(a);
      if (this.changePanelOpen && (el === this.changePanel || el === this.changePanelTitle || el === this.changePanelBody)) {
        el.setVisible(visible);
      }
    });
  }

  setMenuInteractive(enabled) {
    this.menuInteractive = !!enabled;
    const interactiveIds = ["play", "options", "extras", "exit"];
    interactiveIds.forEach((id) => {
      const b = this.menuButtons[id];
      if (!b || !b.box) return;
      if (enabled) b.box.setInteractive({ useHandCursor: true });
      else b.box.disableInteractive();
    });
    if (this.updateButton) {
      if (enabled) this.updateButton.setInteractive({ useHandCursor: true });
      else this.updateButton.disableInteractive();
    }
    if (this.changeButton) {
      if (enabled) this.changeButton.setInteractive({ useHandCursor: true });
      else this.changeButton.disableInteractive();
    }
  }

  ensureMenuIntroTextures() {
    if (!this.textures.exists("menu-intro-dot")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("menu-intro-dot", 8, 8);
      g.destroy();
    }
    if (!this.textures.exists("menu-intro-line")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 140, 2);
      g.generateTexture("menu-intro-line", 140, 2);
      g.destroy();
    }
  }

  createMenuIntroFx() {
    this.ensureMenuIntroTextures();
    const w = this.scale.width;
    const h = this.scale.height;
    this.introFx = this.add.container(0, 0).setDepth(9);
    this.introLines = [];

    for (let i = 0; i < 12; i += 1) {
      const isPink = i % 3 === 0;
      const line = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(40, h - 80),
        "menu-intro-line"
      )
        .setOrigin(0, 0.5)
        .setTint(isPink ? this.introConfig.glowPink : this.introConfig.glowCyan)
        .setAlpha(isPink ? 0.18 : 0.24)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      line.introSpeed = Phaser.Math.FloatBetween(38, 90);
      line.introParallax = Phaser.Math.FloatBetween(0.3, 1);
      this.introLines.push(line);
      this.introFx.add(line);
    }

    this.introParticles = this.add.particles(0, 0, "menu-intro-dot", {
      x: { min: 0, max: w },
      y: { min: 0, max: h * 0.72 },
      lifespan: { min: 1500, max: 3600 },
      speedX: { min: -8, max: 8 },
      speedY: { min: -36, max: -10 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 0.36, end: 0 },
      tint: [this.introConfig.glowCyan, this.introConfig.glowPink, 0xffffff],
      blendMode: "ADD",
      frequency: 90,
      quantity: 1,
    }).setDepth(10);
  }

  layoutMenuIntroFx() {
    if (!this.introParticles) return;
    const w = this.scale.width;
    const h = this.scale.height;
    this.introParticles.setConfig({
      x: { min: 0, max: w },
      y: { min: 0, max: h * 0.72 },
    });
  }

  playMenuIntro() {
    if (!this.titleText) return;
    this.menuIntroInProgress = true;

    this.titleText.setAlpha(0).setScale(0.94).setY(42);
    this.cameras.main.fadeIn(520, 0, 0, 0);

    this.tweens.add({
      targets: this.titleText,
      delay: this.introConfig.titleRevealDelayMs,
      y: 72,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      ease: "Cubic.Out",
      duration: this.introConfig.titleRevealMs,
    });

    this.introGlow = this.add.circle(this.scale.width / 2, 86, 220, this.introConfig.glowCyan, 0.08)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(13);
    this.tweens.add({
      targets: this.introGlow,
      alpha: { from: 0.15, to: 0.03 },
      scale: { from: 0.8, to: 1.14 },
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
      duration: 2200,
    });

    const orderedButtons = ["play", "continue", "options", "extras", "exit"]
      .map((id) => this.menuButtons[id])
      .filter((b) => !!b);
    const buttonTargets = [];
    orderedButtons.forEach((b) => {
      if (b.glow) buttonTargets.push(b.glow);
      if (b.box) buttonTargets.push(b.box);
      if (b.txt) buttonTargets.push(b.txt);
    });

    buttonTargets.forEach((obj) => {
      obj.y += this.introConfig.buttonMovePx;
      obj.setAlpha(0);
    });

    const titleEndAt = this.introConfig.titleRevealDelayMs + this.introConfig.titleRevealMs;
    orderedButtons.forEach((b, idx) => {
      const delay = titleEndAt + idx * this.introConfig.buttonStaggerMs;
      this.tweens.add({
        targets: [b.box, b.txt].filter(Boolean),
        y: `-=${this.introConfig.buttonMovePx}`,
        alpha: 1,
        duration: this.introConfig.uiFadeMs,
        ease: "Cubic.Out",
        delay,
      });
    });

    const remainingUi = this.menuUiElements.filter((el) => {
      if (el === this.titleText) return false;
      if (buttonTargets.includes(el)) return false;
      return true;
    });
    this.menuIntroUiFadeCall = this.time.delayedCall(titleEndAt + orderedButtons.length * this.introConfig.buttonStaggerMs - 40, () => {
      this.tweens.add({
        targets: remainingUi,
        alpha: 1,
        duration: this.introConfig.uiFadeMs,
        ease: "Sine.Out",
      });
    });

    this.menuIntroDoneCall = this.time.delayedCall(this.introConfig.totalMs, () => {
      this.menuIntroInProgress = false;
      this.setMenuInteractive(true);
      if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Menu intro complete. UI interactive.");
    });
  }

  forceCompleteMenuIntro() {
    if (!this.menuIntroInProgress) return;
    this.menuIntroInProgress = false;

    if (this.menuIntroUiFadeCall) this.menuIntroUiFadeCall.remove(false);
    if (this.menuIntroDoneCall) this.menuIntroDoneCall.remove(false);
    this.menuIntroUiFadeCall = null;
    this.menuIntroDoneCall = null;

    const targets = [
      this.titleText,
      this.titleShadow,
      this.menuCard,
      this.comingSoonText,
      this.updateButton,
      this.updateButtonText,
      this.changeButton,
      this.changeButtonText,
      this.changePanel,
      this.changePanelTitle,
      this.changePanelBody,
      this.versionInfoText,
    ];
    Object.values(this.menuButtons).forEach((b) => {
      if (!b) return;
      targets.push(b.glow, b.box, b.txt);
    });
    this.tweens.killTweensOf(targets.filter(Boolean));
    if (this.introGlow) this.tweens.killTweensOf(this.introGlow);

    this.layoutMenu();
    this.setMenuUiVisible(true);
    this.setMenuInteractive(true);
    if (Platformer.Debug) Platformer.Debug.warn("MenuScene", "Intro auto-completed due to resize.");
  }

  createPrettyBackdrop() {
    const w = this.scale.width;
    const h = this.scale.height;
    const orbA = this.add.circle(w * 0.78, h * 0.22, 150, this.introConfig.glowCyan, 0.11)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2);
    const orbB = this.add.circle(w * 0.2, h * 0.3, 110, this.introConfig.glowPink, 0.1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2);
    this.bgOrbs = [orbA, orbB];
    this.bgOrbs.forEach((orb, idx) => {
      this.tweens.add({
        targets: orb,
        alpha: { from: orb.alpha * 0.8, to: orb.alpha * 1.35 },
        scale: { from: 0.88 + idx * 0.08, to: 1.12 + idx * 0.12 },
        duration: 2800 + idx * 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    });
  }

  normalizeReleaseNotes(rawText) {
    const text = String(rawText || "").replace(/\r/g, "").trim();
    const isPlaceholder = text.toLowerCase() === "none" || text.toLowerCase() === "null" || text === "-";
    if (!text || isPlaceholder) {
      return "Changelog unavailable for this check.\n\nOpen GitHub Releases for full patch notes.";
    }

    const withoutTail = text
      .replace(/\*\*?\s*full\s*changelog\s*\*?\s*:?\s*[\s\S]*$/i, "")
      .replace(/full\s*changelog\s*:?\s*[\s\S]*$/i, "")
      .trim();

    const lines = withoutTail
      .split("\n")
      .filter((line) => !/full\s*changelog/i.test(line))
      .filter((line) => !/github\.com\/.+\/compare\//i.test(line))
      .filter((line) => !/github\.com\/.+\/releases\/download\//i.test(line))
      .filter((line) => !/^\s*https?:\/\/\S+\s*$/i.test(line))
      .map((line) => line.replace(/https?:\/\/\S+/g, ""))
      .map((line) => line.length > 68 ? `${line.slice(0, 68)}...` : line)
      .filter((line) => line.trim().length > 0);

    const compact = lines.join("\n").trim();
    const capped = compact.length > 460 ? `${compact.slice(0, 460)}\n...` : compact;
    return capped || "Changelog unavailable for this check.\n\nOpen GitHub Releases for full patch notes.";
  }

  parseVersionParts(versionText) {
    return String(versionText || "")
      .split(".")
      .map((p) => Number(p))
      .filter((n) => Number.isFinite(n));
  }

  compareVersions(aText, bText) {
    const a = this.parseVersionParts(aText);
    const b = this.parseVersionParts(bText);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const av = Number.isFinite(a[i]) ? a[i] : 0;
      const bv = Number.isFinite(b[i]) ? b[i] : 0;
      if (av > bv) return 1;
      if (av < bv) return -1;
    }
    return 0;
  }

  setLatestChangesFromResult(result) {
    if (!result) return;
    const currentBuild = ((Platformer.BUILD_VERSION && String(Platformer.BUILD_VERSION).trim()) || "1.0.0");
    const v = result.latestVersion ? String(result.latestVersion) : "";
    const staleRemote = !v || this.compareVersions(v, currentBuild) < 0;
    if (staleRemote) {
      this.latestReleaseTag = currentBuild;
      this.latestReleaseNotes = `Release ${currentBuild}\n\n${this.localBuildNotes}`;
      if (this.changePanelBody) this.changePanelBody.setText(this.latestReleaseNotes);
      return;
    }
    const notes = this.normalizeReleaseNotes(result.releaseNotes || "");
    this.latestReleaseTag = v;
    this.latestReleaseNotes = v ? `Release ${v}\n\n${notes}` : notes;
    if (this.changePanelBody) this.changePanelBody.setText(this.latestReleaseNotes);
  }

  showExtras() {
    if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Extras opened.");
    try {
      this.scene.start("ExtrasScene");
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.error("MenuScene.extras", err && err.stack ? err.stack : String(err));
      }
    }
  }

  handleExit() {
    if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Exit requested.");
    if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.exit_app === "function") {
      window.pywebview.api.exit_app();
      return;
    }

    const hint = this.add.text(this.scale.width / 2, this.scale.height - 36,
      "Exit is disabled in browser. Close tab/window.", {
        fontFamily: "Consolas",
        fontSize: "20px",
        color: "#0f172a",
        stroke: "#f8fafc",
        strokeThickness: 4,
      }
    ).setOrigin(0.5);

    this.time.delayedCall(2200, () => hint.destroy());
  }

  setupMenuMusic() {
    const settings = Platformer.Settings.current.audio;
    const volume = (settings.master / 100) * (settings.music / 100);
    if (Platformer.Debug) {
      Platformer.Debug.log(
        "MenuScene.audio",
        `setupMenuMusic master=${settings.master} music=${settings.music} volume=${volume.toFixed(2)} muted=${this.sound && this.sound.mute ? "yes" : "no"} hidden=${document.hidden ? "yes" : "no"}`
      );
      if (volume <= 0.001) {
        Platformer.Debug.warn("MenuScene.audio", "Effective music volume is 0. Increase Master/Music volume in Options.");
      }
    }

    this.sound.stopByKey("pause-bgm");
    if (Platformer.pauseMusicHtml) {
      Platformer.pauseMusicHtml.pause();
      Platformer.pauseMusicHtml.currentTime = 0;
      Platformer.pauseMusicHtml = null;
    }

    if (Platformer.gameMusic) {
      Platformer.gameMusic.stop();
      Platformer.gameMusic = null;
    }
    if (Platformer.gameMusicHtml) {
      Platformer.gameMusicHtml.pause();
      Platformer.gameMusicHtml.currentTime = 0;
      Platformer.gameMusicHtml = null;
    }

    const wirePlayback = () => {
      this.menuMusic = this.sound.get("menu-bgm");
      if (!this.menuMusic) {
        try {
          this.menuMusic = this.sound.add("menu-bgm", { loop: true, volume });
          if (Platformer.Debug) Platformer.Debug.log("MenuScene.audio", "Created menu-bgm sound instance.");
        } catch (_e) {
          if (Platformer.Debug) Platformer.Debug.warn("MenuScene.audio", "Failed to create menu-bgm sound instance.");
          return;
        }
      } else {
        this.menuMusic.setVolume(volume);
        this.menuMusic.setLoop(true);
        if (Platformer.Debug) Platformer.Debug.log("MenuScene.audio", "Reusing existing menu-bgm instance.");
      }

      const tryPlay = () => {
        if (!this.menuMusic) return;
        if (settings.muteWhenUnfocused && document.hidden) return;
        if (this.menuMusic.isPlaying) return;
        try {
          if (this.sound && this.sound.context && this.sound.context.state === "suspended") {
            this.sound.context.resume().catch(() => {});
            if (Platformer.Debug) Platformer.Debug.warn("MenuScene.audio", "WebAudio context suspended; resume requested.");
          }
          this.menuMusic.play();
          if (Platformer.Debug) Platformer.Debug.log("MenuScene.audio", "Playing menu-bgm (Phaser).");
        } catch (_e) {
          // Autoplay restrictions are expected; user input handler below retries.
          if (Platformer.Debug) Platformer.Debug.warn("MenuScene.audio", "menu-bgm play blocked; waiting for next input.");
        }
      };

      this.input.once("pointerdown", tryPlay);
      this.input.keyboard.once("keydown", tryPlay);
      tryPlay();
    };

    // If HTML fallback is already active, just update its volume and keep playing.
    if (Platformer.menuMusicHtml) {
      this.menuMusicHtml = Platformer.menuMusicHtml;
      this.menuMusicHtml.volume = Phaser.Math.Clamp(volume, 0, 1);
      if (Platformer.Debug) Platformer.Debug.log("MenuScene.audio", "Using existing HTML menu music instance.");
      return;
    }

    if (this.cache.audio.exists("menu-bgm")) {
      wirePlayback();
      return;
    }

    this.load.audio("menu-bgm", "assets/nickpanek-energetic-chiptune-video-game-music-platformer-8-bit-318348.mp3");
    this.load.once("complete", wirePlayback);
    this.load.once("loaderror", () => {
      if (Platformer.Debug) Platformer.Debug.warn("MenuScene.audio", "menu-bgm loaderror; switching to HTML fallback.");
      this.setupHtmlAudioFallback(volume, settings);
    });
    this.load.start();
    this.time.delayedCall(1300, () => {
      if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
      const phaserPlaying = !!(this.menuMusic && this.menuMusic.isPlaying);
      const htmlPlaying = !!(Platformer.menuMusicHtml && !Platformer.menuMusicHtml.paused);
      if (!phaserPlaying && !htmlPlaying && Platformer.Debug) {
        Platformer.Debug.warn("MenuScene.audio", "No menu music is currently playing after startup.");
      }
    });
  }

  applyRuntimeSettings(nextSettings) {
    try {
      const settings = nextSettings || Platformer.Settings.current || {};
      const audio = settings.audio || { master: 80, music: 60, muteWhenUnfocused: false };
      const volume = Phaser.Math.Clamp((Number(audio.master) / 100) * (Number(audio.music) / 100), 0, 1);
      if (this.menuMusic) {
        this.menuMusic.setVolume(volume);
      }
      if (this.menuMusicHtml) {
        this.menuMusicHtml.volume = volume;
      }
      if (Platformer.menuMusicHtml) {
        Platformer.menuMusicHtml.volume = volume;
      }
      if (audio.muteWhenUnfocused && document.hidden) {
        if (Platformer.menuMusicHtml && !Platformer.menuMusicHtml.paused) {
          Platformer.menuMusicHtml.pause();
        }
      }
      if (Platformer.Debug) {
        Platformer.Debug.log("MenuScene.settings", `Applied runtime settings: menuVolume=${volume.toFixed(2)}`);
      }
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.error("MenuScene.settings", err && err.stack ? err.stack : String(err));
      }
    }
  }

  setupHtmlAudioFallback(volume, settings) {
    try {
      if (Platformer.menuMusicHtml) {
        this.menuMusicHtml = Platformer.menuMusicHtml;
        this.menuMusicHtml.volume = Phaser.Math.Clamp(volume, 0, 1);
        if (Platformer.Debug) Platformer.Debug.log("MenuScene.audio", "Reusing HTML fallback music instance.");
        return;
      }

      this.menuMusicHtml = new Audio("assets/nickpanek-energetic-chiptune-video-game-music-platformer-8-bit-318348.mp3");
      Platformer.menuMusicHtml = this.menuMusicHtml;
      this.menuMusicHtml.loop = true;
      this.menuMusicHtml.volume = Phaser.Math.Clamp(volume, 0, 1);

      const tryPlay = () => {
        if (!this.menuMusicHtml) return;
        if (settings.muteWhenUnfocused && document.hidden) return;
        this.menuMusicHtml.play()
          .then(() => {
            if (Platformer.Debug) Platformer.Debug.log("MenuScene.audio", "Playing menu-bgm (HTML fallback).");
          })
          .catch((err) => {
            if (Platformer.Debug) Platformer.Debug.warn("MenuScene.audio", `HTML fallback play blocked: ${err && err.message ? err.message : err}`);
          });
      };

      this.input.once("pointerdown", tryPlay);
      this.input.keyboard.once("keydown", tryPlay);
      tryPlay();
    } catch (_e) {
      // Keep menu functional with no music.
      if (Platformer.Debug) Platformer.Debug.error("MenuScene.audio", "HTML fallback setup failed.");
    }
  }

  stopMenuMusic() {
    if (Platformer.Debug) Platformer.Debug.log("MenuScene.audio", "Stopping menu music.");
    if (this.menuMusic && this.menuMusic.isPlaying) {
      this.menuMusic.stop();
    }
    if (this.menuMusicHtml) {
      this.menuMusicHtml.pause();
      this.menuMusicHtml.currentTime = 0;
      this.menuMusicHtml = null;
    }
    if (Platformer.menuMusicHtml) {
      Platformer.menuMusicHtml.pause();
      Platformer.menuMusicHtml.currentTime = 0;
      Platformer.menuMusicHtml = null;
    }
  }

  update(_time, delta) {
    if (!this.introLines || this.introLines.length === 0) return;
    const w = this.scale.width;
    const dt = Math.max(0.001, delta / 1000);
    this.introLines.forEach((line) => {
      if (!line || !line.active) return;
      line.x -= line.introSpeed * line.introParallax * dt;
      if (line.x < -line.width - 10) {
        line.x = w + Phaser.Math.Between(10, 80);
      }
    });
    const t = _time * 0.001;
    if (this.bgOrbs && this.bgOrbs.length === 2) {
      this.bgOrbs[0].x = this.scale.width * 0.78 + Math.cos(t * 0.6) * 16;
      this.bgOrbs[1].x = this.scale.width * 0.2 + Math.sin(t * 0.75) * 18;
    }
    this.updateMenuMiniStage(delta);
  }

  updateMenuMiniStage(delta) {
    if (!this.menuRunner || !this.menuStage || !this.menuStage.lane) return;
    const dt = Math.max(0.001, delta / 1000);
    const lane = this.menuStage.lane;
    const minX = lane.x + 26;
    const maxX = lane.x + lane.width - 26;

    if (!Number.isFinite(this.menuRunner.menuX)) this.menuRunner.menuX = minX + 40;
    this.menuRunner.menuX += this.menuRunnerFace * this.menuRunnerSpeed * dt;
    if (this.menuRunner.menuX <= minX) {
      this.menuRunner.menuX = minX;
      this.menuRunnerFace = 1;
    } else if (this.menuRunner.menuX >= maxX) {
      this.menuRunner.menuX = maxX;
      this.menuRunnerFace = -1;
    }

    this.menuRunnerJumpCooldown -= delta;
    this.menuRunnerDamageCooldown -= delta;
    this.menuRunnerActionTimer -= delta;
    const target = this.menuEnemies.find((e) => {
      if (!e || !e.alive) return false;
      const dx = e.menuX - this.menuRunner.menuX;
      if (Math.abs(dx) > 120) return false;
      return dx * this.menuRunnerFace > 0;
    });
    const grounded = this.menuRunner.y >= this.menuRunnerGroundY - 0.5;
    const freestyleJump = grounded && this.menuRunnerActionTimer <= 0 && this.menuRunnerJumpCooldown <= 0 && Phaser.Math.Between(0, 100) < 12;
    if ((target || freestyleJump) && grounded && this.menuRunnerJumpCooldown <= 0) {
      this.menuRunnerVy = this.menuRunnerJumpVy;
      this.menuRunnerJumpCooldown = target ? 520 : 900;
      this.menuRunnerActionTimer = Phaser.Math.Between(650, 1300);
    }

    this.menuRunnerVy += this.menuRunnerGravity * dt;
    this.menuRunner.y += this.menuRunnerVy * dt;
    if (this.menuRunner.y > this.menuRunnerGroundY) {
      this.menuRunner.y = this.menuRunnerGroundY;
      this.menuRunnerVy = 0;
    }

    this.menuRunner.setFlipX(this.menuRunnerFace < 0);
    if (this.menuRunnerVy < -30) this.menuRunner.setTexture(this.textureOr("player-jump", "player"));
    else if (this.menuRunnerVy > 70 && this.menuRunner.y < this.menuRunnerGroundY) this.menuRunner.setTexture(this.textureOr("player-jump", "player"));
    else this.menuRunner.setTexture(this.textureOr(Math.floor(this.time.now / 130) % 2 === 0 ? "player-run-1" : "player-run-2", "player"));
    this.menuRunner.x = this.menuRunner.menuX;
    if (this.time.now < this.menuRunnerDamageFlashUntil) {
      const blinkOn = Math.floor(this.time.now / 70) % 2 === 0;
      if (blinkOn) this.menuRunner.setTint(0xff4d4d);
      else this.menuRunner.clearTint();
    } else {
      this.menuRunner.clearTint();
    }

    this.menuEnemies.forEach((enemy) => {
      if (!enemy) return;
      if (!enemy.alive) {
        if (this.time.now >= enemy.respawnAt) {
          enemy.alive = true;
          enemy.setVisible(true);
          enemy.setAlpha(1);
          enemy.setScale(1, 1);
          enemy.y = this.menuRunnerGroundY + 2;
          enemy.menuX = Phaser.Math.Between(minX + 40, maxX - 40);
          enemy.menuDir = Phaser.Math.Between(0, 1) ? 1 : -1;
        }
        return;
      }

      enemy.menuX += enemy.menuDir * enemy.menuSpeed * dt;
      if (enemy.menuX <= minX + 18) {
        enemy.menuX = minX + 18;
        enemy.menuDir = 1;
      } else if (enemy.menuX >= maxX - 18) {
        enemy.menuX = maxX - 18;
        enemy.menuDir = -1;
      }
      enemy.x = enemy.menuX;
      enemy.setFlipX(enemy.menuDir < 0);
      const stomp = Math.abs(this.menuRunner.x - enemy.x) < 18
        && this.menuRunner.y < enemy.y - 10
        && this.menuRunnerVy > 60;
      if (stomp) {
        enemy.alive = false;
        enemy.respawnAt = this.time.now + Phaser.Math.Between(1300, 2200);
        this.tweens.add({
          targets: enemy,
          scaleX: 1.35,
          scaleY: 0.45,
          alpha: 0.25,
          duration: 120,
          onComplete: () => {
            if (enemy && enemy.active) enemy.setVisible(false);
          },
        });
        const puff = this.add.circle(enemy.x, enemy.y - 6, 6, 0xffffff, 0.95).setDepth(8.25).setBlendMode(Phaser.BlendModes.ADD);
        this.menuStage.add(puff);
        this.tweens.add({
          targets: puff,
          scale: 3.1,
          alpha: 0,
          duration: 260,
          ease: "Cubic.Out",
          onComplete: () => puff.destroy(),
        });
        this.menuRunnerVy = -190;
        return;
      }

      const sideHit = Math.abs(this.menuRunner.x - enemy.x) < 22
        && Math.abs(this.menuRunner.y - enemy.y) < 24
        && this.menuRunnerDamageCooldown <= 0;
      if (sideHit) {
        this.menuRunnerDamageCooldown = 700;
        this.menuRunnerDamageFlashUntil = this.time.now + 420;
        this.menuRunnerVy = -120;
        this.menuRunnerFace = this.menuRunner.x < enemy.x ? -1 : 1;
        this.menuRunner.menuX += this.menuRunnerFace * 20;
        this.menuRunner.menuX = Phaser.Math.Clamp(this.menuRunner.menuX, minX, maxX);
      }
    });
    this.saveMenuMiniStageState();
  }

  textureOr(textureKey, fallbackKey) {
    if (textureKey && this.textures.exists(textureKey)) return textureKey;
    if (fallbackKey && this.textures.exists(fallbackKey)) return fallbackKey;
    return "__WHITE";
  }

  shutdown() {
    if (this.onSettingsChanged) {
      this.game.events.off("settings-changed", this.onSettingsChanged);
      this.onSettingsChanged = null;
    }
    // Keep menu music alive across Menu <-> Options transitions.
    this.saveMenuMiniStageState();
    if (this.onResize) {
      this.scale.off("resize", this.onResize);
      this.onResize = null;
    }
    if (this.introParticles) {
      this.introParticles.destroy();
      this.introParticles = null;
    }
    if (this.introFx) {
      this.introFx.destroy(true);
      this.introFx = null;
    }
    if (this.introGlow) {
      this.introGlow.destroy();
      this.introGlow = null;
    }
    if (this.menuStage) {
      this.menuStage.destroy(true);
      this.menuStage = null;
    }
    this.menuRunner = null;
    this.menuEnemies = [];
    this.bgOrbs = [];
    this.introLines = [];
  }
};
