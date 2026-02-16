window.Platformer = window.Platformer || {};

Platformer.BootScene = class extends Phaser.Scene {
  constructor() {
    super("BootScene");
    this.playerIdleLoadFailed = false;
    this.playerIdleWarned = false;
  }

  preload() {
    this.load.audio("menu-bgm", "assets/nickpanek-energetic-chiptune-video-game-music-platformer-8-bit-318348.mp3");
    this.load.audio("game-bgm", "assets/Slaughter to Prevail - K (mp3cut.net).mp3");
    this.load.audio("pause-bgm", "assets/Elevator Music - So Chill (mp3cut.net).mp3");
    this.load.image("player-idle-raw", "assets/IFFY_IDLE.png");
    this.load.json("ldtk-test", "assets/test.ldtk");
    this.load.spritesheet("ldtk-cavernas", "assets/Cavernas_by_Adam_Saltsman.png", {
      frameWidth: 8,
      frameHeight: 8,
    });
    this.load.json("level-1", "assets/levels/level-1.json");
    this.load.json("level-2", "assets/levels/level-2.json");
    this.load.json("level-3", "assets/levels/level-3.json");
    this.load.json("level-4", "assets/levels/level-4.json");
    this.load.json("level-5", "assets/levels/level-ldtk-test.json");
    this.load.on("loaderror", (fileObj) => {
      if (fileObj && fileObj.key === "player-idle-raw") {
        this.playerIdleLoadFailed = true;
        if (Platformer.Debug && !this.playerIdleWarned) {
          this.playerIdleWarned = true;
          Platformer.Debug.warn("BootScene.playerIdle", "Optional asset missing: assets/IFFY_IDLE.png. Using built-in fallback character.");
        }
      }
      if (fileObj && fileObj.key === "ldtk-test") {
        Platformer.Debug.warn("BootScene.ldtk", "Failed to load assets/test.ldtk; Level 5 will use JSON/built-in fallback.");
      }
      if (fileObj && fileObj.key === "ldtk-cavernas") {
        Platformer.Debug.warn("BootScene.ldtk", "Failed to load Cavernas tileset; Level 5 visuals will use fallback rendering.");
      }
      if (fileObj && /^level-\d+$/.test(fileObj.key || "")) {
        Platformer.Debug.warn("BootScene.levels", `Level JSON missing for ${fileObj.key}; using built-in fallback.`);
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
    const s = Math.max(12, size);
    const pad = Math.max(1, Math.round(s * 0.12));
    const bodyTop = Math.max(1, Math.round(s * 0.25));
    const bodyH = Math.max(4, s - bodyTop - pad);
    const bodyW = Math.max(4, s - pad * 2);
    const mountH = Math.max(2, Math.round(s * 0.25));
    const mountY = s - mountH - 1;
    const centerX = s / 2;
    const muzzleY = Math.max(2, Math.round(s * 0.2));
    const corner = Math.max(1, Math.round(s * 0.12));

    // Base mount
    g.fillStyle(0x111827, 1);
    g.fillRoundedRect(pad, mountY, s - pad * 2, mountH, corner);

    // Turret body
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(pad + 1, bodyTop, bodyW - 2, bodyH, corner);

    // Barrel and muzzle glow
    g.fillStyle(0x1f2937, 1);
    g.fillRect(centerX - Math.max(1, s * 0.08), 1, Math.max(2, s * 0.16), Math.max(2, s * 0.24));
    g.fillStyle(accentColor, 1);
    g.fillCircle(centerX, muzzleY, Math.max(1, s * 0.12));
    g.fillStyle(0xfef08a, 0.85);
    g.fillCircle(centerX, muzzleY, Math.max(1, s * 0.06));

    // Warning chevrons
    g.fillStyle(0x450a0a, 1);
    const triY = s - Math.max(2, s * 0.12);
    const triH = Math.max(2, s * 0.15);
    g.fillTriangle(pad + 1, triY, pad + 1 + s * 0.12, triY - triH, pad + 1 + s * 0.24, triY);
    g.fillTriangle(s - pad - 1 - s * 0.24, triY, s - pad - 1 - s * 0.12, triY - triH, s - pad - 1, triY);

    g.lineStyle(Math.max(1, Math.round(s * 0.08)), 0x0b1220, 1);
    g.strokeRoundedRect(pad + 1, bodyTop, bodyW - 2, bodyH, corner);
    g.lineStyle(1, 0xe2e8f0, 0.6);
    g.strokeCircle(centerX, muzzleY, Math.max(1, s * 0.12));
    g.generateTexture(key, s, s);
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

  createJetpackFlameTexture(key, width, height, coreColor, glowColor) {
    const g = this.add.graphics();
    g.fillStyle(glowColor, 0.5);
    g.fillEllipse(width / 2, height * 0.46, width * 0.92, height * 0.9);
    g.fillStyle(coreColor, 0.95);
    g.fillTriangle(width * 0.5, height, width * 0.2, height * 0.36, width * 0.8, height * 0.36);
    g.fillStyle(0xfef08a, 0.9);
    g.fillTriangle(width * 0.5, height * 0.8, width * 0.36, height * 0.4, width * 0.64, height * 0.4);
    g.generateTexture(key, width, height);
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
    this.createRectTexture("oneway", TILE, Math.max(3, Math.round(TILE * 0.38)), 0x38bdf8, 0x0369a1);
    this.createHazardTexture("hazard", TILE, hazardColor, laserAccent);
    this.setupPlayerIdleAnimation();
    this.createCircleTexture("coin", 16, coinColor, 0xa16207);
    this.createEnemyTexture("enemy", 24, enemyColor, enemyFangColor);
    this.createEnemyTextureVariant("enemy-e", 24, { body: 0xfb923c, inner: 0x7f1d1d, accent: 0xffffff, horns: 0xfef08a });
    this.createEnemyTextureVariant("enemy-f", 24, { body: 0x22d3ee, inner: 0x164e63, accent: 0xfef08a, horns: 0xe2e8f0 });
    this.createEnemyTextureVariant("enemy-g", 24, { body: 0xf43f5e, inner: 0x4c0519, accent: 0xfef2f2, horns: 0xfda4af });
    this.createEnemyTextureVariant("enemy-h", 24, { body: 0xa855f7, inner: 0x3b0764, accent: 0xfef08a, horns: 0xd8b4fe });
    this.createProjectileTexture("hazard-projectile", 14);
    this.createJetpackFlameTexture("jetpack-flame-1", 18, 26, 0xf97316, 0xfb7185);
    this.createJetpackFlameTexture("jetpack-flame-2", 18, 24, 0xf59e0b, 0xfacc15);
    this.createRectTexture("checkpoint", 16, 40, 0xa855f7, 0x581c87);

    this.registry.set("coins", 0);
    this.registry.set("health", 3);
    this.registry.set("lives", 2);
    this.registry.set("level", 1);
    Platformer.LevelJsonCache = {};
    [1, 2, 3, 4, 5].forEach((n) => {
      const key = `level-${n}`;
      const json = this.cache.json.get(key);
      if (json && typeof json === "object") {
        Platformer.LevelJsonCache[n] = json;
      }
    });
    if (Platformer.WorldMapManager && typeof Platformer.WorldMapManager.warmupDefault === "function") {
      Platformer.WorldMapManager.warmupDefault();
    }

    this.scene.start("MenuScene");
  }

  setupPlayerIdleAnimation() {
    if (!this.textures.exists("player-idle-raw")) {
      if (Platformer.Debug && !this.playerIdleWarned) {
        this.playerIdleWarned = true;
        const msg = this.playerIdleLoadFailed
          ? "Player idle spritesheet failed to preload. Using built-in fallback character."
          : "Player idle spritesheet not found. Using built-in fallback character.";
        Platformer.Debug.warn("BootScene.playerIdle", msg);
      }
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
};
