window.Platformer = window.Platformer || {};

Platformer.UIScene = class extends Phaser.Scene {
  constructor() {
    super("UIScene");
    this.hudText = null;
    this.pauseText = null;
    this.gameOverText = null;
    this.victoryText = null;
    this.victorySubText = null;
    this.victoryBars = [];
    this.victorySpeedLines = [];
    this.victoryCharacter = null;
    this.transitionText = null;
    this.toastText = null;
    this.toastTween = null;
    this.pausePanel = null;
    this.pauseButtons = [];
    this.pauseMusic = null;
    this.pauseMusicHtml = null;
    this.resumePhaserGameMusic = false;
    this.resumeHtmlGameMusic = false;
    this.onRegistryChanged = null;
    this.gamePaused = false;
    this.gameOver = false;
    this.levelComplete = false;
    this.onPauseKey = null;
    this.onRestartKey = null;
    this.onEnterKey = null;
    this.onGameOver = null;
    this.onLevelComplete = null;
    this.onLevelTransition = null;
    this.onOptionsClosed = null;
    this.onToastMessage = null;
    this.pauseKeyEventName = null;
    this.lastLevelCompletePayload = null;
    this.jetpackFuelBg = null;
    this.jetpackFuelFill = null;
    this.jetpackFuelLabel = null;
    this.onResize = null;
  }

  init() {
    // Register pause key early so it's ready before GameScene becomes interactive
    const pauseKey = Platformer.Settings.current.controls.pause || "ESC";
    this.pauseKeyEventName = `keydown-${pauseKey}`;
  }

  create() {
    const textScale = Platformer.Settings.textScale();

    this.hudText = this.add.text(16, 14, "", {
      fontFamily: "Consolas",
      fontSize: `${Math.round(20 * textScale)}px`,
      color: "#f8fafc",
      stroke: "#111827",
      strokeThickness: 4,
    }).setScrollFactor(0);
    this.jetpackFuelLabel = this.add.text(16, 46, "Jetpack", {
      fontFamily: "Consolas",
      fontSize: `${Math.round(16 * textScale)}px`,
      color: "#bfdbfe",
      stroke: "#111827",
      strokeThickness: 3,
    }).setScrollFactor(0);
    this.jetpackFuelBg = this.add.rectangle(102, 58, 172, 12, 0x111827, 0.92)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0x93c5fd, 0.85);
    this.jetpackFuelFill = this.add.rectangle(104, 58, 168, 8, 0x22d3ee, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0);

    this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, "PAUSED", {
      fontFamily: "Verdana",
      fontSize: `${Math.round(56 * textScale)}px`,
      color: "#fcd34d",
      stroke: "#1f2937",
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
    this.buildPauseMenu(textScale);

    this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2,
      "GAME OVER\nPress R to Restart", {
        fontFamily: "Verdana",
        fontSize: `${Math.round(44 * textScale)}px`,
        color: "#fca5a5",
        align: "center",
        stroke: "#1f2937",
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setScrollFactor(0).setVisible(false);

    this.victoryText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 24,
      "MISSION CLEAR!", {
        fontFamily: "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
        fontSize: `${Math.round(74 * textScale)}px`,
        color: "#fde047",
        stroke: "#7f1d1d",
        strokeThickness: 12,
        shadow: { offsetX: 0, offsetY: 0, color: "#000000", blur: 10, fill: true },
      }
    ).setOrigin(0.5).setScrollFactor(0).setVisible(false).setAlpha(0);

    this.victorySubText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 52,
      "Coins Secured. Press ENTER for World Map", {
        fontFamily: "Consolas",
        fontSize: `${Math.round(26 * textScale)}px`,
        color: "#f8fafc",
        stroke: "#111827",
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setScrollFactor(0).setVisible(false).setAlpha(0);

    this.transitionText = this.add.text(this.scale.width / 2, this.scale.height / 2,
      "", {
        fontFamily: "Verdana",
        fontSize: `${Math.round(46 * textScale)}px`,
        color: "#fef08a",
        stroke: "#1f2937",
        strokeThickness: 7,
        align: "center",
      }
    ).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(120);

    this.toastText = this.add.text(this.scale.width / 2, 74, "", {
      fontFamily: "Consolas",
      fontSize: `${Math.round(24 * textScale)}px`,
      color: "#fef3c7",
      stroke: "#111827",
      strokeThickness: 5,
      align: "center",
    }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(130);

    this.createVictoryFX();
    this.layoutHud();
    this.layoutPauseMenu();
    this.updateHud();

    this.onRegistryChanged = () => this.updateHud();
    this.registry.events.on("changedata", this.onRegistryChanged);

    this.onGameOver = () => {
      this.gameOver = true;
      if (Platformer.Debug) Platformer.Debug.warn("UIScene", "Game over shown.");
      this.gameOverText.setVisible(true);
      this.hidePauseMenu();
    };
    this.game.events.on("game-over", this.onGameOver);

    this.onLevelComplete = (payload) => {
      this.levelComplete = true;
      this.lastLevelCompletePayload = payload || null;
      if (Platformer.Debug) Platformer.Debug.log("UIScene", "Level complete overlay shown.");
      this.hidePauseMenu();
      this.showVictorySequence();
    };
    this.game.events.on("level-complete", this.onLevelComplete);

    this.onLevelTransition = (payload) => {
      this.hidePauseMenu();
      this.showLevelTransition(payload);
    };
    this.game.events.on("level-transition", this.onLevelTransition);

    this.onOptionsClosed = () => {
      if (!this.gameOver && !this.levelComplete && this.scene.isPaused("GameScene")) {
        this.showPauseMenu();
      }
    };
    this.game.events.on("options-closed-to-pause", this.onOptionsClosed);

    this.onToastMessage = (payload) => this.showToast(payload);
    this.game.events.on("toast-message", this.onToastMessage);

    this.onPauseKey = () => {
      if (this.scene.isActive("OptionsScene")) return;
      if (this.gameOver || this.levelComplete) return;
      this.togglePauseMenu();
    };
    this.input.keyboard.on(this.pauseKeyEventName, this.onPauseKey);

    this.onRestartKey = () => {
      if (!this.gameOver) return;
      this.gameOver = false;
      this.gamePaused = false;
      this.gameOverText.setVisible(false);
      this.hidePauseMenu();
      this.game.events.emit("restart-level");
    };
    this.input.keyboard.on("keydown-R", this.onRestartKey);

    this.onEnterKey = () => {
      if (!this.levelComplete) return;
      this.levelComplete = false;
      this.resetOverlayStates();
      this.stopGameplayMusic();
      this.scene.stop("GameScene");
      this.scene.stop();
      const focusNodeId = this.lastLevelCompletePayload && (this.lastLevelCompletePayload.resolvedNodeId || this.lastLevelCompletePayload.nodeId);
      this.scene.start("WorldMapScene", { focusNodeId: focusNodeId || null });
    };
    this.input.keyboard.on("keydown-ENTER", this.onEnterKey);

    this.onResize = () => {
      this.layoutHud();
      this.layoutPauseMenu();
    };
    this.scale.on("resize", this.onResize);
  }

  layoutHud() {
    if (this.hudText) this.hudText.setPosition(16, 14);
    if (this.jetpackFuelLabel) this.jetpackFuelLabel.setPosition(16, 46);
    if (this.jetpackFuelBg) this.jetpackFuelBg.setPosition(102, 58);
    if (this.jetpackFuelFill) this.jetpackFuelFill.setPosition(104, 58);
  }

  buildPauseMenu(textScale) {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.pausePanel = this.add.rectangle(cx, cy, 560, 340, 0x020617, 0.86)
      .setStrokeStyle(2, 0x94a3b8, 0.8)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(100);

    this.pauseText.setDepth(101);
    this.pauseText.setY(cy - 118);

    const createBtn = (y, label, onClick) => {
      const offsetY = y - cy;
      const box = this.add.rectangle(cx, y, 280, 50, 0x1d4ed8, 0.96)
        .setStrokeStyle(2, 0x93c5fd, 0.9)
        .setDepth(101)
        .setScrollFactor(0)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(cx, y, label, {
        fontFamily: "Consolas",
        fontSize: `${Math.round(28 * textScale)}px`,
        color: "#f8fafc",
      }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setVisible(false);

      box.on("pointerover", () => box.setFillStyle(0x2563eb, 0.98));
      box.on("pointerout", () => box.setFillStyle(0x1d4ed8, 0.96));
      box.on("pointerdown", onClick);

      this.pauseButtons.push({ box, text, offsetY, label });
    };

    createBtn(cy - 30, "Resume", () => this.resumeFromPause());
    createBtn(cy + 35, "Options", () => {
      this.hidePauseMenu();
      this.scene.launch("OptionsScene", { returnTo: "pause" });
    });
    createBtn(cy + 100, "Return to Menu", () => {
      if (Platformer.Debug) Platformer.Debug.warn("UIScene.pause", "Return to Menu clicked.");
      this.stopPauseMusic();
      this.stopGameplayMusic();
      this.hidePauseMenu();
      this.scene.stop("GameScene");
      if (this.scene.isActive("OptionsScene")) this.scene.stop("OptionsScene");
      this.scene.stop();
      this.scene.start("MenuScene");
    });
  }

  layoutPauseMenu() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    if (this.pausePanel) this.pausePanel.setPosition(cx, cy);
    if (this.pauseText) this.pauseText.setPosition(cx, cy - 118);
    this.pauseButtons.forEach((b) => {
      if (!b) return;
      const targetY = cy + (Number.isFinite(b.offsetY) ? b.offsetY : 0);
      if (b.box) b.box.setPosition(cx, targetY);
      if (b.text) b.text.setPosition(cx, targetY);
    });
    if (this.gameOverText) this.gameOverText.setPosition(cx, cy);
    if (this.transitionText) this.transitionText.setPosition(cx, cy);
    if (this.toastText) this.toastText.setPosition(cx, 74);
    if (this.victoryText) this.victoryText.setPosition(cx, cy - 24);
    if (this.victorySubText) this.victorySubText.setPosition(cx, cy + 52);
  }

  showPauseMenu() {
    if (Platformer.Debug) Platformer.Debug.log("UIScene.pause", "Pause menu opened.");
    this.layoutPauseMenu();
    this.pauseGameplayMusic();
    this.playPauseMusic();
    this.pausePanel.setVisible(true);
    this.pauseText.setVisible(true);
    this.pauseButtons.forEach((b) => {
      b.box.setVisible(true);
      b.text.setVisible(true);
    });
    if (Platformer.Debug) {
      try {
        const ys = this.pauseButtons.map((b) => (b && b.box ? Math.round(b.box.y) : -1)).filter((y) => y >= 0);
        const sorted = ys.slice().sort((a, b) => a - b);
        const minGap = sorted.length > 1 ? Math.min(...sorted.slice(1).map((v, i) => v - sorted[i])) : 999;
        Platformer.Debug.log("UIScene.pause", `buttonYs=${ys.join(",")} minGap=${minGap}`);
        if (minGap < 28) {
          Platformer.Debug.warn("UIScene.pause.layout", "Pause buttons are too close/overlapping after layout.");
        }
      } catch (err) {
        Platformer.Debug.warn("UIScene.pause.layout", `Diagnostics failed: ${err && err.message ? err.message : err}`);
      }
    }
    this.gamePaused = true;
  }

  hidePauseMenu() {
    if (this.pausePanel) this.pausePanel.setVisible(false);
    this.pauseText.setVisible(false);
    this.pauseButtons.forEach((b) => {
      b.box.setVisible(false);
      b.text.setVisible(false);
    });
    this.gamePaused = false;
  }

  togglePauseMenu() {
    if (this.scene.isPaused("GameScene")) {
      this.resumeFromPause();
    } else {
      this.scene.pause("GameScene");
      this.showPauseMenu();
    }
  }

  resumeFromPause() {
    if (Platformer.Debug) Platformer.Debug.log("UIScene.pause", "Resuming gameplay from pause.");
    this.stopPauseMusic();
    this.resumeGameplayMusic();
    this.scene.resume("GameScene");
    this.hidePauseMenu();
  }

  pauseGameplayMusic() {
    if (Platformer.gameMusic && Platformer.gameMusic.isPlaying) {
      try {
        Platformer.gameMusic.pause();
        this.resumePhaserGameMusic = true;
      } catch (_e) {
        // Ignore; best effort.
      }
    }

    if (Platformer.gameMusicHtml && !Platformer.gameMusicHtml.paused) {
      try {
        Platformer.gameMusicHtml.pause();
        this.resumeHtmlGameMusic = true;
      } catch (_e) {
        // Ignore; best effort.
      }
    }
  }

  resumeGameplayMusic() {
    if (this.resumePhaserGameMusic && Platformer.gameMusic) {
      try {
        Platformer.gameMusic.resume();
      } catch (_e) {
        // Ignore; best effort.
      }
    }

    if (this.resumeHtmlGameMusic && Platformer.gameMusicHtml) {
      Platformer.gameMusicHtml.play().catch(() => {});
    }

    this.resumePhaserGameMusic = false;
    this.resumeHtmlGameMusic = false;
  }

  stopGameplayMusic() {
    if (Platformer.Debug) Platformer.Debug.log("UIScene.audio", "Stopping gameplay music for scene transition.");
    if (Platformer.gameMusic) {
      try {
        if (Platformer.gameMusic.isPlaying) {
          Platformer.gameMusic.stop();
        } else if (typeof Platformer.gameMusic.pause === "function") {
          Platformer.gameMusic.pause();
        }
      } catch (_e) {
        // best effort
      }
      Platformer.gameMusic = null;
    }
    if (Platformer.gameMusicHtml) {
      try {
        Platformer.gameMusicHtml.pause();
        Platformer.gameMusicHtml.currentTime = 0;
      } catch (_e) {
        // best effort
      }
      Platformer.gameMusicHtml = null;
    }
    this.resumePhaserGameMusic = false;
    this.resumeHtmlGameMusic = false;
  }

  playPauseMusic() {
    const audioSettings = Platformer.Settings.current.audio;
    const volume = Phaser.Math.Clamp((audioSettings.master / 100) * (audioSettings.music / 100), 0, 1);

    if (this.cache.audio.exists("pause-bgm")) {
      if (!this.pauseMusic) {
        this.pauseMusic = this.sound.get("pause-bgm");
        if (!this.pauseMusic) {
          try {
            this.pauseMusic = this.sound.add("pause-bgm", { loop: true, volume });
          } catch (_e) {
            this.pauseMusic = null;
          }
        }
      }
      if (this.pauseMusic) {
        this.pauseMusic.setLoop(true);
        this.pauseMusic.setVolume(volume);
        if (!this.pauseMusic.isPlaying) {
          try {
            this.pauseMusic.play();
          } catch (_e) {
            // Autoplay gating: user already pressed ESC, so retry on next input if needed.
          }
        }
        return;
      }
    }

    // HTML audio fallback.
    if (!this.pauseMusicHtml) {
      try {
        this.pauseMusicHtml = new Audio("assets/Elevator Music - So Chill (mp3cut.net).mp3");
        Platformer.pauseMusicHtml = this.pauseMusicHtml;
        this.pauseMusicHtml.loop = true;
      } catch (_e) {
        this.pauseMusicHtml = null;
      }
    }
    if (this.pauseMusicHtml) {
      this.pauseMusicHtml.volume = volume;
      this.pauseMusicHtml.play().catch(() => {});
    }
  }

  stopPauseMusic() {
    if (this.pauseMusic && this.pauseMusic.isPlaying) {
      this.pauseMusic.stop();
    }
    if (this.pauseMusicHtml) {
      this.pauseMusicHtml.pause();
      this.pauseMusicHtml.currentTime = 0;
      Platformer.pauseMusicHtml = null;
    }
  }

  updateHud() {
    if (!this.hudText || !this.hudText.active) {
      return;
    }
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) {
      return;
    }

    const lives = this.registry.get("lives");
    const health = this.registry.get("health");
    const coins = this.registry.get("coins");
    const level = this.registry.get("level");
    const timeLeft = this.registry.get("timeLeft");
    const threat = this.registry.get("threat");
    const dashCd = Number(this.registry.get("dashCd") || 0);
    const shield = Math.max(0, Number(this.registry.get("shield") || 0));
    const jetpackFuel = Phaser.Math.Clamp(Number(this.registry.get("jetpackFuel") || 0), 0, 100);
    const { WIN_COIN_TARGET } = Platformer.Config;
    const dashTxt = dashCd <= 0.06 ? "READY" : `${dashCd.toFixed(1)}s`;

    try {
      this.hudText.setText(
        `Level: ${level}   Lives: ${Math.max(0, lives)}   Health: ${Math.max(0, health)}   Coins: ${coins}/${WIN_COIN_TARGET}   Time: ${Math.max(0, timeLeft || 0)}   Threat: ${threat || "CALM"}   Dash: ${dashTxt}   Shield: ${shield}   Fuel: ${Math.round(jetpackFuel)}%`
      );
      if (this.jetpackFuelFill && this.jetpackFuelBg) {
        const fillW = Math.max(0, Math.round(168 * (jetpackFuel / 100)));
        this.jetpackFuelFill.width = fillW;
        const color = jetpackFuel > 60 ? 0x22d3ee : (jetpackFuel > 28 ? 0xf59e0b : 0xef4444);
        this.jetpackFuelFill.setFillStyle(color, 1);
      }
    } catch (err) {
      const msg = err && err.stack ? err.stack : String(err);
      if (Platformer.Debug && Platformer.Debug.error) {
        Platformer.Debug.error("UIScene.updateHud", msg);
      }
    }
  }

  showToast(payload) {
    if (!payload || !this.toastText) return;
    const text = String(payload.text || "").trim();
    if (!text) return;
    const color = payload.color || 0xfef3c7;
    this.toastText.setText(text);
    this.toastText.setColor(`#${color.toString(16).padStart(6, "0")}`);
    this.toastText.setAlpha(1);
    this.toastText.setVisible(true);
    if (this.toastTween) {
      this.toastTween.stop();
      this.toastTween = null;
    }
    this.toastTween = this.tweens.add({
      targets: this.toastText,
      y: 58,
      alpha: 0,
      duration: 900,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (this.toastText) {
          this.toastText.setVisible(false);
          this.toastText.setY(74);
        }
      },
    });
  }

  createVictoryFX() {
    const topBar = this.add.rectangle(this.scale.width / 2, -45, this.scale.width, 90, 0x020617, 0.92)
      .setScrollFactor(0).setVisible(false);
    const bottomBar = this.add.rectangle(this.scale.width / 2, this.scale.height + 45, this.scale.width, 90, 0x020617, 0.92)
      .setScrollFactor(0).setVisible(false);
    this.victoryBars = [topBar, bottomBar];

    const lineColor = 0xffffff;
    for (let i = 0; i < 16; i += 1) {
      const y = 40 + i * 30;
      const line = this.add.rectangle(-220, y, 190, 4, lineColor, 0.22)
        .setAngle(-16)
        .setScrollFactor(0)
        .setVisible(false);
      this.victorySpeedLines.push(line);
    }

    this.victoryCharacter = this.buildVictoryCharacter(this.scale.width - 210, this.scale.height - 210);
    this.victoryCharacter.setVisible(false).setAlpha(0).setScale(0.8);
  }

  buildVictoryCharacter(x, y) {
    const style = [
      "width:236px",
      "height:236px",
      "border:4px solid #fde047",
      "background:rgba(15,23,42,0.86)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "overflow:hidden",
      "box-sizing:border-box",
    ].join(";");

    const dom = this.add.dom(x, y, "div", style, "").setScrollFactor(0);
    const img = document.createElement("img");
    img.src = "./assets/kawaii-anime-girl.gif";
    img.alt = "Victory Girl";
    img.style.width = "220px";
    img.style.height = "220px";
    img.style.objectFit = "cover";
    img.onerror = () => {
      dom.node.innerHTML = "<span style='font-family:Consolas;color:#f8fafc;font-size:32px'>VICTORY</span>";
    };
    dom.node.appendChild(img);

    return dom;
  }

  showVictorySequence() {
    if (this.victoryCharacter) {
      this.victoryCharacter.destroy();
    }
    this.victoryCharacter = this.buildVictoryCharacter(this.scale.width - 210, this.scale.height - 210);
    this.victoryCharacter.setVisible(false).setAlpha(0).setScale(0.8);

    this.pauseText.setVisible(false);
    this.gameOverText.setVisible(false);
    this.victoryBars.forEach((bar) => bar.setVisible(true));
    this.victorySpeedLines.forEach((line) => line.setVisible(true));
    this.victoryText.setVisible(true);
    this.victorySubText.setVisible(true);
    this.victoryCharacter.setVisible(true);

    this.tweens.add({
      targets: this.victoryBars[0],
      y: 40,
      duration: 320,
      ease: "Cubic.easeOut",
    });
    this.tweens.add({
      targets: this.victoryBars[1],
      y: this.scale.height - 40,
      duration: 320,
      ease: "Cubic.easeOut",
    });

    this.victorySpeedLines.forEach((line, idx) => {
      line.x = -220 - idx * 36;
      this.tweens.add({
        targets: line,
        x: this.scale.width + 220,
        duration: 360 + idx * 22,
        ease: "Linear",
        repeat: -1,
        delay: idx * 20,
      });
    });

    this.tweens.add({
      targets: this.victoryText,
      alpha: 1,
      scaleX: { from: 1.65, to: 1 },
      scaleY: { from: 0.35, to: 1 },
      angle: { from: -8, to: 0 },
      duration: 280,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: this.victorySubText,
      alpha: 1,
      y: this.victorySubText.y + 10,
      duration: 240,
      delay: 180,
      ease: "Quad.easeOut",
    });

    this.tweens.add({
      targets: this.victoryText,
      scale: 1.05,
      yoyo: true,
      duration: 620,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: this.victoryCharacter,
      alpha: 1,
      scale: 1,
      x: this.scale.width - 196,
      duration: 300,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: this.victoryCharacter,
      y: this.victoryCharacter.y - 8,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: "Sine.easeInOut",
    });
  }

  showLevelTransition(payload) {
    const from = payload && payload.from ? payload.from : "?";
    const to = payload && payload.to ? payload.to : "?";
    this.transitionText
      .setText(`LEVEL ${from} CLEAR\\nNEXT: LEVEL ${to}`)
      .setVisible(true)
      .setAlpha(0)
      .setScale(1.1);

    this.tweens.add({
      targets: this.transitionText,
      alpha: 1,
      scale: 1,
      duration: 220,
      yoyo: true,
      hold: 350,
      onComplete: () => this.transitionText.setVisible(false),
    });
  }

  resetOverlayStates() {
    this.gameOverText.setVisible(false);
    this.pauseText.setVisible(false);
    this.hidePauseMenu();
    this.stopPauseMusic();
    this.victoryText.setVisible(false).setAlpha(0).setScale(1).setAngle(0);
    if (this.transitionText) {
      this.transitionText.setVisible(false).setAlpha(0).setScale(1);
    }
    this.victorySubText.setVisible(false).setAlpha(0).setY(this.scale.height / 2 + 52);
    this.victoryBars[0].setVisible(false).setY(-45);
    this.victoryBars[1].setVisible(false).setY(this.scale.height + 45);
    this.victorySpeedLines.forEach((line) => line.setVisible(false));

    if (this.victoryCharacter) {
      this.victoryCharacter.setVisible(false).setAlpha(0).setScale(0.8);
      this.victoryCharacter.setPosition(this.scale.width - 210, this.scale.height - 210);
    }

    this.tweens.killAll();
  }

  shutdown() {
    this.stopPauseMusic();
    this.resumePhaserGameMusic = false;
    this.resumeHtmlGameMusic = false;
    if (this.toastTween) {
      this.toastTween.stop();
      this.toastTween = null;
    }
    if (this.onRegistryChanged) {
      this.registry.events.off("changedata", this.onRegistryChanged);
      this.onRegistryChanged = null;
    }
    if (this.onGameOver) this.game.events.off("game-over", this.onGameOver);
    if (this.onLevelComplete) this.game.events.off("level-complete", this.onLevelComplete);
    if (this.onLevelTransition) this.game.events.off("level-transition", this.onLevelTransition);
    if (this.onOptionsClosed) this.game.events.off("options-closed-to-pause", this.onOptionsClosed);
    if (this.onToastMessage) this.game.events.off("toast-message", this.onToastMessage);
    if (this.onPauseKey && this.pauseKeyEventName) this.input.keyboard.off(this.pauseKeyEventName, this.onPauseKey);
    if (this.onRestartKey) this.input.keyboard.off("keydown-R", this.onRestartKey);
    if (this.onEnterKey) this.input.keyboard.off("keydown-ENTER", this.onEnterKey);
    if (this.onResize) this.scale.off("resize", this.onResize);
    this.onPauseKey = null;
    this.onRestartKey = null;
    this.onEnterKey = null;
    this.onGameOver = null;
    this.onLevelComplete = null;
    this.onLevelTransition = null;
    this.onOptionsClosed = null;
    this.onToastMessage = null;
    this.pauseKeyEventName = null;
    this.onResize = null;
  }
};
