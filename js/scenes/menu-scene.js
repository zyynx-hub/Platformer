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
    this.latestReleaseNotes = "No update details yet.\n\nWorking on gameplay pressure, enemy behavior, and update reliability.";
    this.latestReleaseTag = "";
    this.pendingUpdateUrl = "";
    this.updateInProgress = false;
    this.bgSky = null;
    this.bgMid = null;
    this.bgGround = null;
    this.titleText = null;
    this.comingSoonText = null;
    this.menuButtons = {};
    this.onResize = null;
    this.menuUiElements = [];
    this.menuInteractive = false;
    this.introFx = null;
    this.introParticles = null;
    this.introLines = [];
    this.introConfig = {
      totalMs: 3600,
      uiFadeMs: 420,
      titleRevealDelayMs: 220,
      titleRevealMs: 760,
      skyColor: 0x67c8ff,
      midColor: 0x75e0bc,
      groundColor: 0x5ea800,
      glowCyan: 0x53e0ff,
      glowPink: 0xff71c7,
    };
  }

  create() {
    const textScale = Platformer.Settings.textScale();

    this.bgSky = this.add.rectangle(0, 0, 10, 10, this.introConfig.skyColor, 1).setOrigin(0, 0);
    this.bgMid = this.add.rectangle(0, 0, 10, 10, this.introConfig.midColor, 1).setOrigin(0, 0);
    this.bgGround = this.add.rectangle(0, 0, 10, 10, this.introConfig.groundColor, 1).setOrigin(0, 0);

    this.titleText = this.add.text(0, 72, "ANIME PLATFORMER", {
      fontFamily: "Verdana",
      fontSize: `${Math.round(46 * textScale)}px`,
      color: "#0f172a",
      stroke: "#f8fafc",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(14);
    this.setupMenuMusic();

    const makeButton = (id, y, label, onClick, opts = {}) => {
      const disabled = !!opts.disabled;
      const box = this.add.rectangle(0, y, 280, 50, disabled ? 0x64748b : 0xd4a373, 1)
        .setStrokeStyle(3, 0x3f2b1d, 1)
        .setDepth(10);
      const txt = this.add.text(0, y, label, {
        fontFamily: "Consolas",
        fontSize: `${Math.round(30 * textScale)}px`,
        color: disabled ? "#cbd5e1" : "#0f172a",
      }).setOrigin(0.5).setDepth(11);

      if (!disabled) {
        box.setInteractive({ useHandCursor: true });
        box.on("pointerover", () => box.setFillStyle(0xe8b47f));
        box.on("pointerout", () => box.setFillStyle(0xd4a373));
        box.on("pointerdown", onClick);
      }

      this.menuButtons[id] = { box, txt };
      return this.menuButtons[id];
    };

    const launchGameplay = () => {
      this.stopMenuMusic();
      const difficulty = Platformer.Settings.current.gameplay.difficulty;
      const baseLives = difficulty === "easy" ? 3 : (difficulty === "hard" ? 1 : 2);

      if (this.scene.isActive("UIScene") || this.scene.isPaused("UIScene")) {
        this.scene.stop("UIScene");
      }
      if (this.scene.isActive("GameScene") || this.scene.isPaused("GameScene")) {
        this.scene.stop("GameScene");
      }

      this.registry.set("coins", 0);
      this.registry.set("health", 3);
      this.registry.set("lives", baseLives);
      this.registry.set("level", 1);
          this.scene.start("GameScene", { level: 1 });
      this.scene.launch("UIScene");
      if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Play -> GameScene launched.");
    };

    const startGame = () => {
      if (!this.menuInteractive) return;
      Platformer.beeper.unlock();
      if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Play clicked.");
      if (this.sound && this.sound.context && this.sound.context.state === "suspended") {
        this.sound.context.resume().catch(() => {});
      }

      const seen = !!Platformer.Settings.current.convenience.introSeen;
      if (seen) {
        if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Intro already seen; starting gameplay directly.");
        launchGameplay();
      } else {
        this.stopMenuMusic();
        if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Starting IntroScene before gameplay.");
        this.scene.start("IntroScene");
      }
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
      this.scene.start("OptionsScene", { returnTo: "menu" });
    });
    makeButton("credits", 0, "CREDITS", () => this.showCredits());
    makeButton("exit", 0, "EXIT", () => this.handleExit());
    this.createBottomLeftVersionInfo();
    this.createMenuUpdateWidget();
    this.createWhatsChangedWidget();
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
    this.onResize = () => this.layoutMenu();
    this.scale.on("resize", this.onResize);
    if (shouldPlayMenuIntro) this.playMenuIntro();

    this.input.keyboard.on("keydown-ENTER", startGame);
  }

  layoutMenu() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    this.bgSky.setSize(w, h).setPosition(0, 0);
    this.bgMid.setSize(w, 220).setPosition(0, cy + 160);
    this.bgGround.setSize(w, 120).setPosition(0, cy + 220);
    this.titleText.setPosition(cx, 72);

    const y0 = cy - 40;
    const spacing = 60;
    const p = this.menuButtons.play;
    const c = this.menuButtons.continue;
    const o = this.menuButtons.options;
    const cr = this.menuButtons.credits;
    const e = this.menuButtons.exit;
    const place = (item, y) => {
      if (!item) return;
      item.box.setPosition(cx, y);
      item.txt.setPosition(cx, y);
    };
    place(p, y0);
    place(c, y0 + spacing);
    place(o, y0 + spacing * 2);
    place(cr, y0 + spacing * 3);
    place(e, y0 + spacing * 4);
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
    if (this.versionInfoText) this.versionInfoText.setPosition(14, h - 12);
    this.layoutMenuIntroFx();
  }

  createMenuUpdateWidget() {
    const x = this.scale.width - 96;
    const y = 38;
    this.updateButton = this.add.rectangle(x, y, 160, 38, 0x334155, 0.95)
      .setStrokeStyle(2, 0x94a3b8, 0.95)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.updateButtonText = this.add.text(x, y, "Update", {
      fontFamily: "Consolas",
      fontSize: "22px",
      color: "#f8fafc",
    }).setOrigin(0.5).setDepth(21);
    this.updateButton.on("pointerover", () => this.updateButton.setFillStyle(0x475569, 0.98));
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
        this.updateButtonText.setText(this.pendingUpdateUrl ? "Update + Restart" : "Update");
        const v = result.latestVersion ? `v${result.latestVersion}` : "new";
        this.setBottomLeftUpdateStatus(`Update found (${v}).`);
        if (Platformer.Debug) Platformer.Debug.warn("MenuScene.update", `Update available: ${v}`);
      } else {
        this.pendingUpdateUrl = "";
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
    this.versionInfoText = this.add.text(14, this.scale.height - 12, "", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#e2e8f0",
      stroke: "#0f172a",
      strokeThickness: 4,
      align: "left",
    }).setOrigin(0, 1).setDepth(25);

    this.setBottomLeftUpdateStatus("Checking for updates...");
    this.versionInfoText.setText(`Version: ${currentVersion}\nUpdate: Checking for updates...`);
  }

  setBottomLeftUpdateStatus(statusText) {
    if (!this.versionInfoText) return;
    const currentVersion = ((Platformer.Settings.current.updates || {}).currentVersion || "1.0.0").trim();
    const safeStatus = statusText || "Unknown";
    this.versionInfoText.setText(`Version: ${currentVersion}\nUpdate: ${safeStatus}`);
  }

  async autoCheckUpdatesForBottomLeft() {
    const cfg = Platformer.Settings.current.updates || {};
    if (!cfg.enabled) {
      this.setBottomLeftUpdateStatus("Auto updates are off.");
      return;
    }

      this.setBottomLeftUpdateStatus("Checking for updates...");
    const result = await Platformer.Updater.check();
    if (!result.ok) {
      if (result.transient) {
        this.setBottomLeftUpdateStatus("Checking for updates...");
        this.time.delayedCall(1200, () => this.autoCheckUpdatesForBottomLeft());
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
      this.updateButtonText.setText(this.pendingUpdateUrl ? "Update + Restart" : "Update");
      this.setBottomLeftUpdateStatus(`Update found (${v}). Press Update.`);
    } else {
      this.setBottomLeftUpdateStatus("You're up to date.");
      this.updateButtonText.setText("Update");
    }
  }

  createWhatsChangedWidget() {
    const x = this.scale.width - 96;
    const y = 84;
    this.changeButton = this.add.rectangle(x, y, 160, 34, 0x1e293b, 0.95)
      .setStrokeStyle(2, 0x94a3b8, 0.95)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.changeButtonText = this.add.text(x, y, "What's Changed", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#e2e8f0",
    }).setOrigin(0.5).setDepth(21);

    this.changePanel = this.add.rectangle(0, 0, 480, 290, 0x0f172a, 0.92)
      .setStrokeStyle(2, 0x94a3b8)
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
    Object.values(this.menuButtons).forEach((b) => {
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
    const interactiveIds = ["play", "options", "credits", "exit"];
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

    const glow = this.add.circle(this.scale.width / 2, 86, 220, this.introConfig.glowCyan, 0.08)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(13);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.15, to: 0.03 },
      scale: { from: 0.8, to: 1.14 },
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
      duration: 2200,
    });

    this.time.delayedCall(this.introConfig.totalMs - this.introConfig.uiFadeMs, () => {
      this.tweens.add({
        targets: this.menuUiElements.filter((el) => el !== this.titleText),
        alpha: 1,
        duration: this.introConfig.uiFadeMs,
        ease: "Sine.Out",
      });
    });

    this.time.delayedCall(this.introConfig.totalMs, () => {
      this.setMenuInteractive(true);
      if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Menu intro complete. UI interactive.");
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

  setLatestChangesFromResult(result) {
    if (!result) return;
    const v = result.latestVersion ? String(result.latestVersion) : "";
    const notes = this.normalizeReleaseNotes(result.releaseNotes || "");
    this.latestReleaseTag = v;
    this.latestReleaseNotes = v ? `Release ${v}\n\n${notes}` : notes;
    if (this.changePanelBody) this.changePanelBody.setText(this.latestReleaseNotes);
  }

  showCredits() {
    if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Credits opened.");
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const back = this.add.rectangle(cx, cy, 640, 250, 0x0f172a, 0.88)
      .setStrokeStyle(2, 0x94a3b8)
      .setDepth(30)
      .setInteractive();
    const txt = this.add.text(cx, cy - 10,
      "Credits\nCode + Design: Robin + Codex\nFramework: Phaser 3\n\nClick panel to close", {
        fontFamily: "Consolas",
        fontSize: "28px",
        color: "#e2e8f0",
        align: "center",
      }
    ).setOrigin(0.5).setDepth(31);

    back.on("pointerdown", () => {
      back.destroy();
      txt.destroy();
      if (Platformer.Debug) Platformer.Debug.log("MenuScene", "Credits closed.");
    });
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
        } catch (_e) {
          return;
        }
      } else {
        this.menuMusic.setVolume(volume);
        this.menuMusic.setLoop(true);
      }

      const tryPlay = () => {
        if (!this.menuMusic) return;
        if (settings.muteWhenUnfocused && document.hidden) return;
        if (this.menuMusic.isPlaying) return;
        try {
          this.menuMusic.play();
        } catch (_e) {
          // Autoplay restrictions are expected; user input handler below retries.
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
      return;
    }

    if (this.cache.audio.exists("menu-bgm")) {
      wirePlayback();
      return;
    }

    this.load.audio("menu-bgm", "assets/nickpanek-energetic-chiptune-video-game-music-platformer-8-bit-318348.mp3");
    this.load.once("complete", wirePlayback);
    this.load.once("loaderror", () => {
      this.setupHtmlAudioFallback(volume, settings);
    });
    this.load.start();
  }

  setupHtmlAudioFallback(volume, settings) {
    try {
      if (Platformer.menuMusicHtml) {
        this.menuMusicHtml = Platformer.menuMusicHtml;
        this.menuMusicHtml.volume = Phaser.Math.Clamp(volume, 0, 1);
        return;
      }

      this.menuMusicHtml = new Audio("assets/nickpanek-energetic-chiptune-video-game-music-platformer-8-bit-318348.mp3");
      Platformer.menuMusicHtml = this.menuMusicHtml;
      this.menuMusicHtml.loop = true;
      this.menuMusicHtml.volume = Phaser.Math.Clamp(volume, 0, 1);

      const tryPlay = () => {
        if (!this.menuMusicHtml) return;
        if (settings.muteWhenUnfocused && document.hidden) return;
        this.menuMusicHtml.play().catch(() => {});
      };

      this.input.once("pointerdown", tryPlay);
      this.input.keyboard.once("keydown", tryPlay);
      tryPlay();
    } catch (_e) {
      // Keep menu functional with no music.
    }
  }

  stopMenuMusic() {
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
  }

  shutdown() {
    // Keep menu music alive across Menu <-> Options transitions.
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
    this.introLines = [];
  }
};
