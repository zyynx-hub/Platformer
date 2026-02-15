window.Platformer = window.Platformer || {};

Platformer.MenuScene = class extends Phaser.Scene {
  constructor() {
    super("MenuScene");
    this.menuMusic = null;
    this.menuMusicHtml = null;
    this.updateButton = null;
    this.updateButtonText = null;
    this.updateStatusText = null;
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
    this.autoUpdateTriggered = false;
    this.bgSky = null;
    this.bgMid = null;
    this.bgGround = null;
    this.titleText = null;
    this.comingSoonText = null;
    this.menuButtons = {};
    this.onResize = null;
  }

  create() {
    const textScale = Platformer.Settings.textScale();

    this.bgSky = this.add.rectangle(0, 0, 10, 10, 0x7dd3fc, 1).setOrigin(0, 0);
    this.bgMid = this.add.rectangle(0, 0, 10, 10, 0x86efac, 1).setOrigin(0, 0);
    this.bgGround = this.add.rectangle(0, 0, 10, 10, 0x65a30d, 1).setOrigin(0, 0);

    this.titleText = this.add.text(0, 72, "ANIME PLATFORMER", {
      fontFamily: "Verdana",
      fontSize: `${Math.round(46 * textScale)}px`,
      color: "#0f172a",
      stroke: "#f8fafc",
      strokeThickness: 8,
    }).setOrigin(0.5);
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
    this.layoutMenu();
    this.onResize = () => this.layoutMenu();
    this.scale.on("resize", this.onResize);

    this.input.keyboard.once("keydown-ENTER", startGame);
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

    if (this.updateButton && this.updateButtonText && this.updateStatusText) {
      const ux = w - 96;
      const uy = 38;
      this.updateButton.setPosition(ux, uy);
      this.updateButtonText.setPosition(ux, uy);
      this.updateStatusText.setVisible(false);
    }
    if (this.changeButton && this.changeButtonText) {
      const cxRight = w - 96;
      const cyTop = 84;
      this.changeButton.setPosition(cxRight, cyTop);
      this.changeButtonText.setPosition(cxRight, cyTop);
    }
    if (this.changePanel && this.changePanelTitle && this.changePanelBody) {
      const panelW = Math.min(560, Math.max(360, Math.round(w * 0.42)), w - 40);
      const panelH = Math.min(420, Math.max(220, Math.round(h * 0.52)), h - 70);
      const px = w - panelW / 2 - 20;
      const py = Math.min(120 + panelH / 2, h - panelH / 2 - 20);
      this.changePanel.setSize(panelW, panelH).setPosition(px, py);
      this.changePanelTitle.setPosition(px - panelW / 2 + 16, py - panelH / 2 + 12);
      this.changePanelBody
        .setPosition(px - panelW / 2 + 16, py - panelH / 2 + 44)
        .setWordWrapWidth(panelW - 32);
    }
    if (this.versionInfoText) this.versionInfoText.setPosition(14, h - 12);
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
    this.updateStatusText = this.add.text(x, y + 28, "", {
      fontFamily: "Consolas",
      fontSize: "13px",
      color: "#0f172a",
      stroke: "#f8fafc",
      strokeThickness: 2,
      align: "right",
    }).setOrigin(0.5, 0).setDepth(21).setVisible(false);

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
      this.setBottomLeftUpdateStatus(`Update found (${v}).`);
      this.pendingUpdateUrl = result.downloadUrl || "";
      this.updateButtonText.setText(this.pendingUpdateUrl ? "Update + Restart" : "Update");

      const autoUpdateEnabled = cfg.autoUpdate !== false;
      if (autoUpdateEnabled && this.pendingUpdateUrl && Platformer.Updater.canInAppApply() && !this.autoUpdateTriggered) {
        this.autoUpdateTriggered = true;
        this.time.delayedCall(450, async () => {
          const r = await this.startInAppUpdate(this.pendingUpdateUrl, `Downloading ${v}...`);
          if (!r.ok) {
            this.autoUpdateTriggered = false;
            if (Platformer.Debug) Platformer.Debug.error("MenuScene.autoUpdate", r.message || "Auto update failed.");
          }
        });
      }
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
      fontSize: "16px",
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

  normalizeReleaseNotes(rawText) {
    const text = String(rawText || "").replace(/\r/g, "").trim();
    const isPlaceholder = text.toLowerCase() === "none" || text.toLowerCase() === "null" || text === "-";
    if (!text || isPlaceholder) {
      return "Changelog unavailable for this check.\n\nOpen GitHub Releases for full patch notes.";
    }
    // Hide noisy auto-generated compare links and keep the panel readable.
    const lines = text
      .split("\n")
      .filter((line) => !/^\*\*full changelog\*\*:/i.test(line.trim()))
      .filter((line) => !/^https?:\/\/github\.com\/.+\/compare\//i.test(line.trim()))
      .map((line) => line.length > 92 ? `${line.slice(0, 92)}...` : line);

    const compact = lines.join("\n").trim();
    const capped = compact.length > 900 ? `${compact.slice(0, 900)}\n...` : compact;
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

  shutdown() {
    // Keep menu music alive across Menu <-> Options transitions.
    if (this.onResize) {
      this.scale.off("resize", this.onResize);
      this.onResize = null;
    }
  }
};
