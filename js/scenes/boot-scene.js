window.Platformer = window.Platformer || {};

Platformer.BootScene = class extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.audio("game-bgm", "assets/Slaughter to Prevail - K (mp3cut.net).mp3");
    this.load.audio("pause-bgm", "assets/Elevator Music - So Chill (mp3cut.net).mp3");
    this.load.image("player-idle-raw", "assets/IFFY_IDLE.png");
    this.load.on("loaderror", (fileObj) => {
      if (fileObj && fileObj.key === "player-idle-raw" && Platformer.Debug) {
        Platformer.Debug.warn("BootScene.playerIdle", `Preload failed for ${fileObj.src || "assets/IFFY_IDLE.png"}`);
      }
    });
  }

  createRectTexture(key, width, height, fillColor, borderColor = null) {
    const g = this.add.graphics();
    g.fillStyle(fillColor, 1);
    g.fillRect(0, 0, width, height);
    if (borderColor !== null) {
      g.lineStyle(2, borderColor, 1);
      g.strokeRect(1, 1, width - 2, height - 2);
    }
    g.generateTexture(key, width, height);
    g.destroy();
  }

  createCircleTexture(key, diameter, fillColor, borderColor = null) {
    const g = this.add.graphics();
    g.fillStyle(fillColor, 1);
    g.fillCircle(diameter / 2, diameter / 2, diameter / 2);
    if (borderColor !== null) {
      g.lineStyle(2, borderColor, 1);
      g.strokeCircle(diameter / 2, diameter / 2, diameter / 2 - 1);
    }
    g.generateTexture(key, diameter, diameter);
    g.destroy();
  }

  createHazardTexture(key, size, baseColor, accentColor) {
    const g = this.add.graphics();
    // Base mount
    g.fillStyle(0x111827, 1);
    g.fillRoundedRect(2, size - 12, size - 4, 10, 3);

    // Turret body
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(5, 8, size - 10, size - 10, 4);

    // Barrel and muzzle glow
    g.fillStyle(0x1f2937, 1);
    g.fillRect(size / 2 - 2, 2, 4, 8);
    g.fillStyle(accentColor, 1);
    g.fillCircle(size / 2, 4, 3);
    g.fillStyle(0xfef08a, 0.85);
    g.fillCircle(size / 2, 4, 1.3);

    // Warning chevrons
    g.fillStyle(0x450a0a, 1);
    g.fillTriangle(8, size - 6, 12, size - 10, 16, size - 6);
    g.fillTriangle(size - 16, size - 6, size - 12, size - 10, size - 8, size - 6);

    g.lineStyle(2, 0x0b1220, 1);
    g.strokeRoundedRect(5, 8, size - 10, size - 10, 4);
    g.lineStyle(1, 0xe2e8f0, 0.6);
    g.strokeCircle(size / 2, 4, 3);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  drawCreatureEnemy(g, size, palette) {
    const outline = palette.outline || 0x0f172a;
    const hood = palette.body || 0x6477ff;
    const hoodDark = palette.inner || 0x4652d9;
    const face = palette.face || 0xf8fafc;
    const skin = palette.skin || 0xf4cda6;
    const eye = palette.eye || 0x020617;

    // Hood/body.
    g.fillStyle(hood, 1);
    g.fillRoundedRect(3, 7, size - 6, size - 9, 8);
    g.fillEllipse(size * 0.50, size * 0.46, size * 0.86, size * 0.82);
    g.fillTriangle(size * 0.50, 1, size * 0.36, 9, size * 0.62, 9);

    // Face area.
    g.fillStyle(face, 1);
    g.fillEllipse(size * 0.50, size * 0.52, size * 0.54, size * 0.56);

    // Eyes.
    g.fillStyle(eye, 1);
    g.fillEllipse(size * 0.37, size * 0.51, size * 0.16, size * 0.24);
    g.fillEllipse(size * 0.63, size * 0.51, size * 0.16, size * 0.24);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(size * 0.35, size * 0.45, 1.2);
    g.fillCircle(size * 0.61, size * 0.45, 1.2);

    // Mouth/muzzle area.
    g.fillStyle(skin, 1);
    g.fillRoundedRect(size * 0.41, size * 0.60, size * 0.18, size * 0.10, 2);

    // Legs.
    g.fillStyle(hoodDark, 1);
    g.fillRoundedRect(size * 0.30, size - 8, size * 0.14, 7, 2);
    g.fillRoundedRect(size * 0.56, size - 8, size * 0.14, 7, 2);

    // Outline.
    g.lineStyle(2, outline, 1);
    g.strokeRoundedRect(3, 7, size - 6, size - 9, 8);
    g.lineStyle(2, outline, 0.95);
    g.strokeEllipse(size * 0.50, size * 0.46, size * 0.86, size * 0.82);
    g.lineStyle(1.5, outline, 0.95);
    g.strokeEllipse(size * 0.50, size * 0.52, size * 0.54, size * 0.56);
  }

  createEnemyTexture(key, size, bodyColor, accentColor) {
    const g = this.add.graphics();
    this.drawCreatureEnemy(g, size, {
      body: bodyColor,
      inner: Phaser.Display.Color.IntegerToColor(bodyColor).darken(25).color,
      face: 0xf8fafc,
      skin: 0xf4cda6,
      eye: 0x020617,
      outline: accentColor || 0x0f172a,
    });
    g.generateTexture(key, size, size);
    g.destroy();
  }

  createEnemyTextureVariant(key, size, palette) {
    const g = this.add.graphics();
    this.drawCreatureEnemy(g, size, {
      body: palette.body,
      inner: palette.inner,
      face: 0xf8fafc,
      skin: 0xf4cda6,
      eye: 0x020617,
      outline: palette.horns || 0x0f172a,
    });
    g.generateTexture(key, size, size);
    g.destroy();
  }

  createProjectileTexture(key, size) {
    const g = this.add.graphics();
    g.fillStyle(0x7f1d1d, 1);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.fillStyle(0xf97316, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 2);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(size / 2 + 1, size / 2 - 1, size / 2 - 5);
    g.lineStyle(1, 0x111827, 0.8);
    g.strokeCircle(size / 2, size / 2, size / 2 - 1);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  createAnimeGirlTexture(key, pose) {
    const g = this.add.graphics();
    const hairColor = pose.jump ? 0xf59e0b : 0xfbbf24;
    const dressColor = pose.jump ? 0x1d4ed8 : 0x2563eb;
    const skin = 0xffddc7;

    g.fillStyle(hairColor, 1);
    g.fillEllipse(14, 10, 20, 16);
    g.fillEllipse(8, 11, 8, 8);
    g.fillEllipse(20, 11, 8, 8);

    g.fillStyle(skin, 1);
    g.fillEllipse(14, 11, 13, 12);

    g.fillStyle(0x111827, 1);
    g.fillCircle(11, pose.blink ? 11 : 10, pose.blink ? 1 : 1.6);
    g.fillCircle(17, pose.blink ? 11 : 10, pose.blink ? 1 : 1.6);

    g.lineStyle(1.5, 0xe11d48, 1);
    g.beginPath();
    g.moveTo(12, 14);
    g.lineTo(16, 14);
    g.strokePath();

    g.fillStyle(dressColor, 1);
    g.fillRoundedRect(9, 17, 10, 10, 2);

    g.fillStyle(0xffffff, 1);
    g.fillRect(11, 19, 6, 3);

    const armLeftY = pose.armLeftY ?? 21;
    const armRightY = pose.armRightY ?? 21;
    g.fillStyle(skin, 1);
    g.fillRect(6, armLeftY, 3, 8);
    g.fillRect(19, armRightY, 3, 8);

    g.fillStyle(0x0f172a, 1);
    g.fillRect(8, 27, 12, 5);

    const legLeftY = pose.legLeftY ?? 32;
    const legRightY = pose.legRightY ?? 32;
    g.fillStyle(0x111827, 1);
    g.fillRect(10, legLeftY, 3, 6);
    g.fillRect(15, legRightY, 3, 6);

    g.fillStyle(0xec4899, 1);
    g.fillRect(6, 4, 4, 2);
    g.fillRect(18, 4, 4, 2);

    g.generateTexture(key, 28, 38);
    g.destroy();
  }

  createPlayerTextures() {
    this.createAnimeGirlTexture("player-idle-1", {
      armLeftY: 21, armRightY: 21, legLeftY: 32, legRightY: 32, blink: false, jump: false,
    });
    this.createAnimeGirlTexture("player-idle-2", {
      armLeftY: 22, armRightY: 22, legLeftY: 32, legRightY: 32, blink: true, jump: false,
    });
    this.createAnimeGirlTexture("player-run-1", {
      armLeftY: 19, armRightY: 23, legLeftY: 31, legRightY: 33, blink: false, jump: false,
    });
    this.createAnimeGirlTexture("player-run-2", {
      armLeftY: 23, armRightY: 19, legLeftY: 33, legRightY: 31, blink: false, jump: false,
    });
    this.createAnimeGirlTexture("player-jump", {
      armLeftY: 17, armRightY: 17, legLeftY: 30, legRightY: 30, blink: false, jump: true,
    });
  }

  create() {
    const { TILE } = Platformer.Config;
    const cbMode = Platformer.Settings.current.accessibility.colorblindMode;
    const hazardColor = cbMode === "off" ? 0xdc2626 : (cbMode === "tritanopia" ? 0xf59e0b : 0x2563eb);
    const laserAccent = cbMode === "off" ? 0xfca5a5 : 0xfef08a;
    const coinColor = cbMode === "deuteranopia" ? 0xf9a8d4 : 0xfacc15;
    const enemyColor = cbMode === "protanopia" ? 0x22d3ee : 0xfb923c;
    const enemyFangColor = cbMode === "protanopia" ? 0xfef08a : 0xffffff;

    this.createPlayerTextures();
    this.createRectTexture("ground", TILE, TILE, 0x8b5a2b, 0x5a3a1d);
    this.createRectTexture("platform", TILE, TILE, 0x6b7280, 0x374151);
    this.createRectTexture("oneway", TILE, 12, 0x38bdf8, 0x0369a1);
    this.createHazardTexture("hazard", TILE, hazardColor, laserAccent);
    this.setupPlayerIdleAnimation();
    this.createCircleTexture("coin", 16, coinColor, 0xa16207);
    this.createEnemyTexture("enemy", 24, enemyColor, enemyFangColor);
    this.createEnemyTextureVariant("enemy-e", 24, { body: 0xfb923c, inner: 0x7f1d1d, accent: 0xffffff, horns: 0xfef08a });
    this.createEnemyTextureVariant("enemy-f", 24, { body: 0x22d3ee, inner: 0x164e63, accent: 0xfef08a, horns: 0xe2e8f0 });
    this.createEnemyTextureVariant("enemy-g", 24, { body: 0xf43f5e, inner: 0x4c0519, accent: 0xfef2f2, horns: 0xfda4af });
    this.createEnemyTextureVariant("enemy-h", 24, { body: 0xa855f7, inner: 0x3b0764, accent: 0xfef08a, horns: 0xd8b4fe });
    this.createProjectileTexture("hazard-projectile", 14);
    this.createRectTexture("checkpoint", 16, 40, 0xa855f7, 0x581c87);

    this.registry.set("coins", 0);
    this.registry.set("health", 3);
    this.registry.set("lives", 2);
    this.registry.set("level", 1);

    this.scene.start("MenuScene");
  }

  setupPlayerIdleAnimation() {
    if (!this.textures.exists("player-idle-raw")) {
      if (Platformer.Debug) Platformer.Debug.warn("BootScene.playerIdle", "Texture player-idle-raw not found. Trying runtime URL fallbacks.");
      this.tryRuntimeLoadPlayerIdle();
      return;
    }

    const source = this.textures.get("player-idle-raw").getSourceImage();
    if (!source || !source.width || !source.height) {
      if (Platformer.Debug) Platformer.Debug.warn("BootScene.playerIdle", "player-idle-raw source has invalid dimensions.");
      return;
    }

    const frames = 4;
    const frameWidth = Math.floor(source.width / frames);
    const frameHeight = source.height;
    if (frameWidth < 1 || frameHeight < 1) {
      if (Platformer.Debug) Platformer.Debug.warn("BootScene.playerIdle", `Invalid frame size: ${frameWidth}x${frameHeight}`);
      return;
    }

    if (this.textures.exists("player-idle-sheet")) {
      this.textures.remove("player-idle-sheet");
    }
    this.textures.addSpriteSheet("player-idle-sheet", source, {
      frameWidth,
      frameHeight,
      endFrame: frames - 1,
    });

    if (this.anims.exists("playerIdleAnim")) {
      this.anims.remove("playerIdleAnim");
    }
    this.anims.create({
      key: "playerIdleAnim",
      frames: this.anims.generateFrameNumbers("player-idle-sheet", { start: 0, end: frames - 1 }),
      frameRate: 6,
      repeat: -1,
    });
    if (Platformer.Debug) Platformer.Debug.log("BootScene.playerIdle", `Loaded IFFY idle sheet ${source.width}x${source.height}, frames=${frames}`);
  }

  tryRuntimeLoadPlayerIdle() {
    if (this._tryingRuntimeIdleLoad) {
      return;
    }
    this._tryingRuntimeIdleLoad = true;

    const candidates = [
      "assets/IFFY_IDLE.png",
      "./assets/IFFY_IDLE.png",
      "assets/iffy_idle.png",
      "./assets/iffy_idle.png",
      "assets/IFFY_IDLE.PNG",
      "./assets/IFFY_IDLE.PNG",
    ];

    const tryNext = (idx) => {
      if (idx >= candidates.length) {
        if (Platformer.Debug) Platformer.Debug.warn("BootScene.playerIdle", "Runtime fallback failed for all IFFY_IDLE paths.");
        this._tryingRuntimeIdleLoad = false;
        return;
      }

      const src = candidates[idx];
      const img = new Image();
      img.onload = () => {
        try {
          if (this.textures.exists("player-idle-raw")) {
            this.textures.remove("player-idle-raw");
          }
          this.textures.addImage("player-idle-raw", img);
          if (Platformer.Debug) Platformer.Debug.log("BootScene.playerIdle", `Runtime-loaded player idle from ${src}`);
          this._tryingRuntimeIdleLoad = false;
          this.setupPlayerIdleAnimation();
        } catch (e) {
          if (Platformer.Debug) Platformer.Debug.warn("BootScene.playerIdle", `Runtime addImage failed for ${src}: ${e && e.message ? e.message : e}`);
          tryNext(idx + 1);
        }
      };
      img.onerror = () => {
        if (Platformer.Debug) Platformer.Debug.warn("BootScene.playerIdle", `Runtime load failed: ${src}`);
        tryNext(idx + 1);
      };
      img.src = src;
    };

    tryNext(0);
  }
};
