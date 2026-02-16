window.Platformer = window.Platformer || {};

Platformer.GameScene = class extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.solids = null;
    this.oneWays = null;
    this.hazards = null;
    this.coins = null;
    this.enemies = null;
    this.checkpoints = null;
    this.player = null;
    this.cursors = null;
    this.keys = null;
    this.respawnPoint = new Phaser.Math.Vector2(64, 64);
    this.lastOnGroundTime = 0;
    this.lastJumpPressedTime = -9999;
    this.isJumpHeld = false;
    this.jumpsUsed = 0;
    this.lastDamageTime = -9999;
    this.isDead = false;
    this.spawnPoint = new Phaser.Math.Vector2(64, 64);
    this.mapRows = [];
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.levelComplete = false;
    this.parallax = [];
    this.lastEnemyEdgeCheckTime = 0;
    this.playerHealthBarBg = null;
    this.playerHealthBarFill = null;
    this.hazardProjectiles = null;
    this.hazardShooters = [];
    this.lastHazardShotAt = 0;
    this.projectileIntervalMs = 1200;
    this.projectileSpeed = 220;
    this.levelTimeRemainingMs = 90000;
    this.lastTickTime = 0;
    this.lastTimerSecond = -1;
    this.threatActive = false;
    this.idleAnimWarned = false;
    this.useImportedCharacter = false;
    this.diagLastAt = 0;
    this.diagCooldowns = {};
    this.facingDir = 1;
    this.isDashing = false;
    this.dashEndsAt = 0;
    this.lastDashAt = -9999;
    this.attackActiveUntil = 0;
    this.lastAttackAt = -9999;
    this.wasGroundedLastFrame = false;
    this.airbornePeakSpeedY = 0;
    this.coinRewardState = {};
    this.shieldCharges = 0;
    this.lastAuxHudAt = 0;
    this.onSettingsChanged = null;
    this.jetpack = null;
    this.jetpackFuelPercent = 100;
    this.jetpackActive = false;
    this.jetpackFlame = null;
    this.jetpackFlameOffsetY = 22;
    this.tinyGridMode = false;
    this.playerTuning = null;
    this.jetpackTuning = null;
    this.hpBarCfg = null;
    this.lastTileEmbedLogAt = 0;
    this.tileEmbedFrames = 0;
    this.playerBodyWorldW = 0;
    this.playerBodyWorldH = 0;
    this.playerHitboxProfile = { w: 9, h: 24, ox: 0, oy: -3 };
    this.hitboxOverlay = null;
    this.hitboxOverlayEnabled = false;
    this.onHitboxesToggle = null;
    this.onPlayerHitboxChanged = null;
    this.lastHitboxDrawAt = 0;
    this.ldtkVisualTiles = [];
    this.usesLdtkLevel = false;
  }

  init(data) {
    const settings = Platformer.Settings.current;
    const difficulty = settings.gameplay.difficulty;
    const startLives = difficulty === "easy" ? 3 : (difficulty === "hard" ? 1 : 2);
    const timerSeconds = difficulty === "easy" ? 120 : (difficulty === "hard" ? 70 : 90);
    const carryState = !!(data && data.carryState);

    this.currentLevel = data.level || 1;
    this.currentNodeId = data && data.nodeId ? String(data.nodeId) : null;
    this.currentWorldId = data && data.worldId ? String(data.worldId) : null;
    this.registry.set("level", this.currentLevel);
    if (!carryState) {
      this.registry.set("health", 3);
      this.registry.set("lives", startLives);
    } else {
      this.registry.set("health", Math.max(1, this.registry.get("health") || 3));
      this.registry.set("lives", Math.max(1, this.registry.get("lives") || startLives));
    }
    this.registry.set("coins", 0);
    this.registry.set("timeLeft", timerSeconds);
    this.registry.set("threat", "CALM");
    this.registry.set("dashCd", 0);
    this.registry.set("shield", 0);
    this.registry.set("jetpackFuel", 100);
    this.isDead = false;
    this.levelComplete = false;
    this.levelTimeRemainingMs = timerSeconds * 1000;
    this.lastTickTime = 0;
    this.lastTimerSecond = -1;
    this.lastHazardShotAt = 0;
    this.threatActive = false;
    this.facingDir = 1;
    this.isDashing = false;
    this.dashEndsAt = 0;
    this.lastDashAt = -9999;
    this.attackActiveUntil = 0;
    this.lastAttackAt = -9999;
    this.wasGroundedLastFrame = false;
    this.airbornePeakSpeedY = 0;
    this.coinRewardState = {};
    this.shieldCharges = 0;
    this.lastAuxHudAt = 0;
    this.jetpackFuelPercent = 100;
    this.jetpackActive = false;
  }

  preload() {
    try {
      const jsonCache = this.cache && this.cache.json ? this.cache.json : null;
      const hasLdtkProject = !!(jsonCache && jsonCache.get("ldtk-test"));
      const hasLevelFiveJson = !!(jsonCache && jsonCache.get("level-5"));

      if (!hasLdtkProject) {
        this.load.json("ldtk-test", "assets/test.ldtk");
      }
      if (!hasLevelFiveJson) {
        this.load.json("level-5", "assets/levels/level-ldtk-test.json");
      }
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.warn("GameScene.preload", `LDtk preload guard failed: ${err && err.message ? err.message : err}`);
      }
    }
  }

  create() {
    const { PLAYER, TILE } = Platformer.Config;
    const settings = Platformer.Settings.current;
    const difficulty = settings.gameplay.difficulty;
    const checkpointMode = settings.convenience.checkpointFrequency;
    this.tinyGridMode = TILE <= 8;
    this.playerTuning = this.buildPlayerTuning(PLAYER);
    this.jetpackTuning = this.buildJetpackTuning(Platformer.Config.JETPACK);
    const P = this.playerTuning;
    const enemySpeedScale = this.tinyGridMode ? 0.34 : 1;

    const ldtkLevelData = this.tryBuildLevelFromLdtk(this.currentLevel || 1);
    if (ldtkLevelData && Array.isArray(ldtkLevelData.rows) && ldtkLevelData.rows.length) {
      this.mapRows = ldtkLevelData.rows;
      this.usesLdtkLevel = true;
      if (Platformer.Debug) {
        Platformer.Debug.log("GameScene.ldtk", `Using native LDtk map for level=${this.currentLevel} size=${ldtkLevelData.width}x${ldtkLevelData.height}`);
      }
    } else {
      this.mapRows = Platformer.createLevelData(this.currentLevel || 1);
      this.usesLdtkLevel = false;
    }
    this.mapHeight = this.mapRows.length;
    this.mapWidth = this.mapRows[0].length;
    this.normalizeTurretTiles();
    this.normalizeEnemyTiles();

    this.physics.world.gravity.y = P.gravity;
    this.physics.world.setBounds(0, 0, this.mapWidth * TILE, this.mapHeight * TILE + 180);

    if (this.usesLdtkLevel) {
      this.cameras.main.setBackgroundColor("#0f132a");
      this.renderLdtkVisualTiles();
      if (Platformer.Debug) {
        Platformer.Debug.log("GameScene.ldtk", "LDtk level active: placeholder ground rendering disabled (collision-only solids).");
      }
    } else {
      this.createTokyoBackdrop();
    }

    this.solids = this.physics.add.staticGroup();
    this.oneWays = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.coins = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: true, immovable: false });
    this.enemyPatrolSpeed = (difficulty === "hard" ? 95 : (difficulty === "easy" ? 48 : 60)) * enemySpeedScale;
    this.hazardDamage = difficulty === "hard" ? 2 : 1;
    this.hazardCooldownScale = difficulty === "easy" ? 1.35 : (difficulty === "hard" ? 0.8 : 1);
    this.projectileIntervalMs = difficulty === "hard" ? 850 : (difficulty === "easy" ? 1500 : 1100);
    this.projectileSpeed = (difficulty === "hard" ? 270 : (difficulty === "easy" ? 180 : 230)) * enemySpeedScale;
    this.maxCheckpointCount = checkpointMode === "sparse" ? 1 : (checkpointMode === "frequent" ? 999 : (difficulty === "hard" ? 1 : 2));
    this.spawnCheckpointOnStart = checkpointMode === "frequent" || difficulty === "easy";
    this.hazardProjectiles = this.physics.add.group({ allowGravity: false, immovable: true });
    let checkpointCount = 0;

    for (let y = 0; y < this.mapHeight; y += 1) {
      for (let x = 0; x < this.mapWidth; x += 1) {
        const tile = this.mapRows[y][x];
        const px = x * TILE;
        const py = y * TILE;

        if (tile === "#") {
          const block = this.solids.create(px + TILE / 2, py + TILE / 2, "ground");
          if (this.usesLdtkLevel) {
            // Keep collider body but don't draw placeholder tile over LDtk visuals.
            block.setVisible(false);
            block.setAlpha(0);
          }
          block.refreshBody();
        }

        if (tile === "=") {
          const platform = this.oneWays.create(px + TILE / 2, py + Math.max(2, Math.round(TILE * 0.38)), "oneway");
          platform.refreshBody();
        }

        if (tile === "^") {
          const spike = this.hazards.create(px + TILE / 2, py + TILE / 2, "hazard");
          spike.setDisplaySize(TILE, TILE);
          spike.refreshBody();
        }

        if (tile === "C") {
          const coin = this.coins.create(px + TILE / 2, py + TILE / 2, "coin");
          if (this.tinyGridMode) coin.setDisplaySize(Math.max(5, TILE * 0.85), Math.max(5, TILE * 0.85));
          coin.refreshBody();
        }

        if (tile === "E" || tile === "F" || tile === "G" || tile === "H") {
          const enemyType = tile;
          const textureByType = { E: "enemy-e", F: "enemy-f", G: "enemy-g", H: "enemy-h" };
          const speedByType = { E: this.enemyPatrolSpeed, F: this.enemyPatrolSpeed * 0.9, G: this.enemyPatrolSpeed * 1.2, H: this.enemyPatrolSpeed * 0.75 };
          const enemy = this.enemies.create(px + TILE / 2, py + TILE / 2, textureByType[enemyType] || "enemy");
          const patrol = this.computeEnemyPatrolBounds(x, y);
          if (this.tinyGridMode) {
            enemy.setDisplaySize(10, 10);
            enemy.body.setSize(8, 8);
          } else {
            enemy.body.setSize(24, 24);
          }
          enemy.setBounce(0, 0);
          enemy.setCollideWorldBounds(true);
          enemy.setVelocityX(-speedByType[enemyType]);
          enemy.setData("patrolSpeed", speedByType[enemyType]);
          enemy.setData("direction", -1);
          enemy.setData("turnCooldownUntil", 0);
          enemy.setData("patrolMinX", patrol.minX);
          enemy.setData("patrolMaxX", patrol.maxX);
          enemy.setData("useBoundedPatrol", patrol.maxX - patrol.minX >= TILE * 2);
          enemy.setData("enemyType", enemyType);
          enemy.setData("nextJumpAt", this.time.now + 800 + x * 3);
          enemy.setData("hp", enemyType === "H" ? 2 : 1);
          enemy.setData("lastX", enemy.x);
          enemy.setData("stuckSince", this.time.now);
          enemy.setData("aiState", "patrol");
          enemy.setData("stateUntil", 0);
          enemy.setData("attackCooldownUntil", this.time.now + 700 + (x % 5) * 90);
        }

        if (tile === "K") {
          if (checkpointCount >= this.maxCheckpointCount) {
            continue;
          }
          const checkpoint = this.checkpoints.create(px + TILE / 2, py + TILE / 2, "checkpoint");
          if (this.tinyGridMode) checkpoint.setDisplaySize(Math.max(4, TILE * 0.75), Math.max(12, TILE * 2));
          checkpoint.setData("activeCheckpoint", false);
          checkpoint.refreshBody();
          checkpointCount += 1;
        }

        if (tile === "S") {
          this.spawnPoint.set(px + TILE / 2, py + TILE / 2);
        }
      }
    }

    this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "player-idle-1");
    if (this.textures.exists("player-idle-sheet")) {
      this.player.setTexture("player-idle-sheet", 0);
      this.useImportedCharacter = true;
      if (Platformer.Debug) Platformer.Debug.log("GameScene.playerIdle", "Using imported player-idle-sheet.");
    } else if (Platformer.Debug) {
      Platformer.Debug.warn("GameScene.playerIdle", "player-idle-sheet missing, using fallback idle textures.");
    }
    const tinyGrid = TILE <= 8;
    if (this.useImportedCharacter) {
      if (tinyGrid) {
        this.player.setDisplaySize(32, 32);
        this.applyTinyPlayerHitboxProfile();
      } else {
        this.player.setDisplaySize(56, 56);
        this.player.body.setSize(22, 44, true);
      }
    } else if (tinyGrid) {
      this.player.setDisplaySize(32, 32);
      this.applyTinyPlayerHitboxProfile();
    } else {
      this.player.setDisplaySize(28, 38);
      this.player.body.setSize(20, 34);
    }
    this.alignPlayerBodyToFeet();
    if (this.tinyGridMode && Platformer.Debug && this.player && this.player.body) {
      Platformer.Debug.log(
        "GameScene.collision",
        `Tiny body initialized world=${this.player.body.width.toFixed(1)}x${this.player.body.height.toFixed(1)} scale=${this.player.scaleX.toFixed(3)},${this.player.scaleY.toFixed(3)}`
      );
    }
    this.player.setCollideWorldBounds(true);
    // Allow dash velocity to exceed normal run cap.
    this.player.setMaxVelocity(Math.max(P.maxSpeed, P.dashSpeed + 60), P.maxFallSpeed || 760);
    this.player.setDragX(P.drag);
    this.player.setAccelerationY(0);
    this.player.body.setGravityY(0);
    this.resolvePlayerEmbedding("spawn");

    this.respawnPoint.copy(this.spawnPoint);
    if (this.spawnCheckpointOnStart) {
      const extraStartCheckpoint = this.checkpoints.create(
        this.spawnPoint.x + (this.tinyGridMode ? TILE * 3 : 24),
        this.spawnPoint.y - (this.tinyGridMode ? TILE * 2 : 20),
        "checkpoint"
      );
      if (this.tinyGridMode) extraStartCheckpoint.setDisplaySize(Math.max(4, TILE * 0.75), Math.max(12, TILE * 2));
      extraStartCheckpoint.setData("activeCheckpoint", true);
      extraStartCheckpoint.setTint(0x22c55e);
      extraStartCheckpoint.refreshBody();
    }

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.oneWays, null, this.enemyOneWayProcess, this);
    this.physics.add.collider(this.player, this.oneWays, null, this.oneWayProcess, this);

    this.physics.add.collider(this.player, this.hazards);
    this.physics.add.collider(this.hazardProjectiles, this.solids, (projectile) => projectile.destroy(), null, this);
    this.physics.add.collider(this.hazardProjectiles, this.oneWays, (projectile) => projectile.destroy(), null, this);
    this.physics.add.overlap(this.player, this.coins, (_, coin) => this.collectCoin(coin), null, this);
    this.physics.add.overlap(this.player, this.checkpoints, (_, cp) => this.activateCheckpoint(cp), null, this);
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => this.handleEnemyContact(enemy), null, this);
    this.physics.add.overlap(this.player, this.hazardProjectiles, (_, projectile) => {
      projectile.destroy();
      this.applyDamage(1);
    }, null, this);

    this.cameras.main.setBounds(0, 0, this.mapWidth * TILE, this.mapHeight * TILE);
    const smooth = Phaser.Math.Clamp(settings.video.cameraSmoothing / 100, 0, 1);
    const followLerp = this.tinyGridMode ? 1 : smooth;
    this.cameras.main.startFollow(this.player, true, followLerp, followLerp);
    this.cameras.main.roundPixels = !this.tinyGridMode;
    this.cameras.main.setDeadzone(this.tinyGridMode ? 56 : 180, this.tinyGridMode ? 40 : 120);
    this.cameras.main.setBackgroundColor("#0b1026");
    this.updateCameraFraming();
    this.scale.on("resize", this.updateCameraFraming, this);
    this.applyVideoSettings();
    this.createPlayerHealthBar();
    this.createJetpackFx();
    this.jetpack = new Platformer.JetpackController(this.jetpackTuning, {
      onJetpackStart: () => {
        if (Platformer.Debug) Platformer.Debug.log("GameScene.jetpack", "Jetpack thrust started.");
      },
      onJetpackStop: (_scene, ctrl, reason) => {
        if (Platformer.Debug) {
          Platformer.Debug.log("GameScene.jetpack", `Jetpack thrust stopped. reason=${reason} fuel=${Math.round(ctrl.fuelPercent)}%`);
        }
      },
    });
    this.jetpack.reset(true);
    this.jetpackFuelPercent = this.jetpack.fuelPercent;
    if (Platformer.Debug) {
      const j = Platformer.Config.JETPACK || {};
      Platformer.Debug.log(
        "GameScene.jetpack",
        `Init cap=${j.fuelCapacity}s drain=${j.drainRate}/s regen=${j.regenRate}/s tinyGrid=${this.tinyGridMode ? "yes" : "no"}`
      );
    }
    if (Platformer.Debug) {
      Platformer.Debug.log(
        "GameScene.tuning",
        `tinyGrid=${this.tinyGridMode ? "yes" : "no"} speed=${P.maxSpeed.toFixed(1)} jump=${P.jumpVelocity.toFixed(1)} gravity=${P.gravity.toFixed(1)}`
      );
    }
    this.registry.set("shield", this.shieldCharges);
    this.registry.set("jetpackFuel", this.jetpackFuelPercent);
    this.setupHitboxOverlay();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys(this.buildControlKeyMap());
    this.onSettingsChanged = (nextSettings) => this.applyRuntimeSettings(nextSettings);
    this.game.events.on("settings-changed", this.onSettingsChanged);
    this.setupGameMusic();
    this.setupHazardShooters();
    this.initRuntimeDiagnostics();
    this.onRestartLevel = () => {
      if (Platformer.Debug) Platformer.Debug.warn("GameScene", "restart-level event received; restarting current level.");
      this.scene.restart({ level: this.currentLevel || 1 });
    };
    this.game.events.on("restart-level", this.onRestartLevel);

    this.events.emit("hud-update");
  }

  initRuntimeDiagnostics() {
    if (!Platformer.Debug) return;
    Platformer.Debug.log(
      "GameScene.diag",
      `Level ${this.currentLevel} booted. map=${this.mapWidth}x${this.mapHeight} enemies=${this.enemies ? this.enemies.countActive(true) : 0} turrets=${this.hazards ? this.hazards.countActive(true) : 0}`
    );
  }

  diagWarn(key, message, cooldownMs = 1600) {
    if (!Platformer.Debug) return;
    const now = this.time ? this.time.now : Date.now();
    const last = this.diagCooldowns[key] || 0;
    if (now - last < cooldownMs) return;
    this.diagCooldowns[key] = now;
    Platformer.Debug.warn(`GameScene.diag.${key}`, message);
  }

  runRuntimeDiagnostics(now) {
    if (!Platformer.Debug) return;
    if (!this.player || !this.player.body) {
      this.diagWarn("player_missing", "Player body missing during update.", 3000);
      return;
    }

    const worldW = this.mapWidth * Platformer.Config.TILE;
    const worldH = this.mapHeight * Platformer.Config.TILE + 200;
    const { x, y } = this.player;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      this.diagWarn("player_nan", `Invalid player position x=${x} y=${y}`, 0);
    }
    if (x < -140 || x > worldW + 140 || y < -200 || y > worldH + 260) {
      this.diagWarn("player_oob", `Player out of expected bounds x=${Math.round(x)} y=${Math.round(y)} world=${worldW}x${worldH}`);
    }

    const health = this.registry.get("health");
    const lives = this.registry.get("lives");
    const coins = this.registry.get("coins");
    if (!Number.isFinite(health) || health < -1 || health > 3) this.diagWarn("health_invalid", `health=${health}`);
    if (!Number.isFinite(lives) || lives < -1 || lives > 9) this.diagWarn("lives_invalid", `lives=${lives}`);
    if (!Number.isFinite(coins) || coins < 0 || coins > 9999) this.diagWarn("coins_invalid", `coins=${coins}`);

    let groundedEnemies = 0;
    let stuckEnemies = 0;
    this.enemies.children.each((enemy) => {
      if (!enemy || !enemy.active || !enemy.body) return;
      const ex = enemy.x;
      const ey = enemy.y;
      if (!Number.isFinite(ex) || !Number.isFinite(ey)) {
        this.diagWarn("enemy_nan", `enemy invalid pos x=${ex} y=${ey}`, 0);
        return;
      }
      if (ex < -80 || ex > worldW + 80 || ey > worldH + 200) {
        this.diagWarn("enemy_oob", `enemy out of bounds x=${Math.round(ex)} y=${Math.round(ey)}`);
      }
      if (enemy.body.blocked.down || enemy.body.touching.down) groundedEnemies += 1;
      const speedX = Math.abs(enemy.body.velocity.x || 0);
      if ((enemy.body.blocked.down || enemy.body.touching.down) && speedX < 8) stuckEnemies += 1;
    });

    if (this.enemies.countActive(true) > 0 && groundedEnemies === 0) {
      this.diagWarn("enemies_airborne", "All enemies airborne; check spawn/support tiles.", 2200);
    }
    if (stuckEnemies >= 2) {
      this.diagWarn("enemies_stalling", `${stuckEnemies} enemies currently stalled on ground.`, 1800);
    }

    this.hazards.children.each((hazard) => {
      if (!hazard || !hazard.active) return;
      const belowY = hazard.y + Platformer.Config.TILE * 0.55;
      if (!this.hasSupportAtWorld(hazard.x, belowY)) {
        this.diagWarn("turret_unsupported", `Turret at (${Math.round(hazard.x)},${Math.round(hazard.y)}) has no support below.`);
      }
    });

    if (this.hazardProjectiles && this.hazardShooters.length > 0 && now > 4500 && this.lastHazardShotAt <= 0) {
      this.diagWarn("no_projectile_fire", "Turrets present but no projectile has fired yet.", 5000);
    }
  }

  setupGameMusic() {
    const audioSettings = Platformer.Settings.current.audio;
    const volume = (audioSettings.master / 100) * (audioSettings.music / 100);

    if (Platformer.menuMusicHtml) {
      Platformer.menuMusicHtml.pause();
      Platformer.menuMusicHtml.currentTime = 0;
      Platformer.menuMusicHtml = null;
    }
    this.sound.stopByKey("menu-bgm");

    const startPhaserMusic = () => {
      let music = Platformer.gameMusic;
      if (!music) {
        music = this.sound.get("game-bgm");
        if (!music) {
          try {
            music = this.sound.add("game-bgm", { loop: true, volume });
          } catch (_e) {
            this.setupHtmlGameMusicFallback(volume, audioSettings);
            return;
          }
        }
        Platformer.gameMusic = music;
      }

      music.setLoop(true);
      music.setVolume(volume);
      const tryPlay = () => {
        if (!music || music.isPlaying) return;
        try {
          music.play();
        } catch (_e) {
          // Autoplay gating may block until first user input.
        }
      };
      this.input.once("pointerdown", tryPlay);
      this.input.keyboard.once("keydown", tryPlay);
      tryPlay();
    };

    if (this.cache.audio.exists("game-bgm")) {
      startPhaserMusic();
      return;
    }

    this.load.audio("game-bgm", "assets/Slaughter to Prevail - K (mp3cut.net).mp3");
    this.load.once("complete", startPhaserMusic);
    this.load.once("loaderror", () => this.setupHtmlGameMusicFallback(volume, audioSettings));
    this.load.start();
  }

  setupHtmlGameMusicFallback(volume, audioSettings) {
    try {
      if (!Platformer.gameMusicHtml) {
        Platformer.gameMusicHtml = new Audio("assets/Slaughter to Prevail - K (mp3cut.net).mp3");
      }
      const music = Platformer.gameMusicHtml;
      music.loop = true;
      music.volume = Phaser.Math.Clamp(volume, 0, 1);

      const tryPlay = () => {
        if (audioSettings.muteWhenUnfocused && document.hidden) return;
        music.play().catch(() => {});
      };

      this.input.once("pointerdown", tryPlay);
      this.input.keyboard.once("keydown", tryPlay);
      tryPlay();
    } catch (_e) {
      // Keep game functional if audio fails.
    }
  }

  createPlayerHealthBar() {
    this.hpBarCfg = this.tinyGridMode
      ? { yOff: 20, w: 16, h: 4, fillW: 14, fillH: 2 }
      : { yOff: 34, w: 38, h: 7, fillW: 34, fillH: 5 };
    this.playerHealthBarBg = this.add.rectangle(
      this.player.x,
      this.player.y - this.hpBarCfg.yOff,
      this.hpBarCfg.w,
      this.hpBarCfg.h,
      0x111827,
      0.92
    )
      .setStrokeStyle(1, 0xe2e8f0, 0.85)
      .setDepth(55);
    this.playerHealthBarFill = this.add.rectangle(
      this.player.x - this.hpBarCfg.fillW / 2,
      this.player.y - this.hpBarCfg.yOff,
      this.hpBarCfg.fillW,
      this.hpBarCfg.fillH,
      0x22c55e,
      1
    )
      .setOrigin(0, 0.5)
      .setDepth(56);
    this.updatePlayerHealthBar();
  }

  createJetpackFx() {
    let key = this.textures.exists("jetpack-flame-1") ? "jetpack-flame-1" : "coin";
    if (this.tinyGridMode) {
      if (!this.textures.exists("jetpack-flame-tiny")) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xfbbf24, 1);
        g.fillTriangle(4, 0, 0, 7, 8, 7);
        g.generateTexture("jetpack-flame-tiny", 8, 8);
        g.destroy();
      }
      key = "jetpack-flame-tiny";
    }
    this.jetpackFlameOffsetY = this.tinyGridMode ? 7 : 22;
    this.jetpackFlame = this.add.sprite(this.player.x, this.player.y + 18, key)
      .setDepth(54)
      .setVisible(false);
    this.jetpackFlame.setBlendMode(this.tinyGridMode ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD);
    if (this.tinyGridMode) {
      this.jetpackFlame.setDisplaySize(6, 6);
    } else if (key === "coin") {
      this.jetpackFlame.setDisplaySize(12, 12);
    }
  }

  updateJetpackFx(now, active) {
    if (!this.jetpackFlame || !this.player) return;
    this.jetpackFlame.setPosition(this.player.x, this.player.y + this.jetpackFlameOffsetY);
    if (!active) {
      this.jetpackFlame.setVisible(false);
      return;
    }
    this.jetpackFlame.setVisible(true);
    if (!this.tinyGridMode && this.textures.exists("jetpack-flame-1") && this.textures.exists("jetpack-flame-2")) {
      const frameKey = Math.floor(now / 75) % 2 === 0 ? "jetpack-flame-1" : "jetpack-flame-2";
      this.jetpackFlame.setTexture(frameKey);
    }
    if (this.tinyGridMode) {
      const pulse = 0.85 + Math.sin(now * 0.03) * 0.15;
      this.jetpackFlame.setScale(this.facingDir < 0 ? -pulse : pulse, pulse);
      this.jetpackFlame.setAlpha(0.9);
      return;
    }
    this.jetpackFlame.setScale(this.facingDir < 0 ? -1 : 1, 1);
  }

  alignPlayerBodyToFeet() {
    if (!this.player || !this.player.body || !this.tinyGridMode) return;
    const sx = Math.max(0.0001, Math.abs(this.player.scaleX || 1));
    const sy = Math.max(0.0001, Math.abs(this.player.scaleY || 1));
    const bodyWorldW = this.playerBodyWorldW || this.player.body.width;
    const bodyWorldH = this.playerBodyWorldH || this.player.body.height;
    const p = this.playerHitboxProfile || { ox: 0, oy: 10 };
    const oxWorld = Math.max(0, (this.player.displayWidth - bodyWorldW) * 0.5 + (p.ox || 0));
    const oyWorld = Math.max(0, this.player.displayHeight - bodyWorldH + (p.oy || 0));
    this.player.body.setOffset(oxWorld / sx, oyWorld / sy);
  }

  applyTinyPlayerHitboxProfile() {
    if (!this.tinyGridMode || !this.player) return;
    const fallback = { w: 9, h: 24, ox: 0, oy: -3 };
    let source = "fallback";
    let p = null;

    // First source: host-backed settings (persistent across EXE restarts).
    const settingsDebug = Platformer.Settings && Platformer.Settings.current
      ? Platformer.Settings.current.debug
      : null;
    if (settingsDebug && settingsDebug.playerHitbox) {
      p = {
        w: Phaser.Math.Clamp(Number(settingsDebug.playerHitbox.w) || fallback.w, 4, 64),
        h: Phaser.Math.Clamp(Number(settingsDebug.playerHitbox.h) || fallback.h, 4, 64),
        ox: Phaser.Math.Clamp(Number(settingsDebug.playerHitbox.ox) || fallback.ox, -24, 24),
        oy: Phaser.Math.Clamp(Number(settingsDebug.playerHitbox.oy) || fallback.oy, -24, 24),
      };
      source = "settings";
    }

    // Prefer the debug module profile when available.
    if (!p && Platformer.Debug && typeof Platformer.Debug.getPlayerHitboxProfile === "function") {
      p = Platformer.Debug.getPlayerHitboxProfile();
      source = "debug";
    }

    // Robust fallback: load persisted profile directly even if Debug init order changes.
    if (!p) {
      try {
        const raw = localStorage.getItem("platformer_player_hitbox");
        if (raw) {
          const parsed = JSON.parse(raw);
          p = {
            w: Phaser.Math.Clamp(Number(parsed.w) || fallback.w, 4, 64),
            h: Phaser.Math.Clamp(Number(parsed.h) || fallback.h, 4, 64),
            ox: Phaser.Math.Clamp(Number(parsed.ox) || fallback.ox, -24, 24),
            oy: Phaser.Math.Clamp(Number(parsed.oy) || fallback.oy, -24, 24),
          };
          source = "localStorage";
        }
      } catch (_e) {
        // Ignore parse/storage errors and keep fallback.
      }
    }

    this.playerHitboxProfile = { ...fallback, ...(p || {}) };
    this.setPlayerBodyWorldSize(this.playerHitboxProfile.w, this.playerHitboxProfile.h, false);
    this.alignPlayerBodyToFeet();
    if (Platformer.Debug) {
      Platformer.Debug.log(
        "GameScene.collision",
        `Hitbox profile loaded (${source}) w=${this.playerHitboxProfile.w} h=${this.playerHitboxProfile.h} ox=${this.playerHitboxProfile.ox} oy=${this.playerHitboxProfile.oy}`
      );
    }
  }

  setPlayerBodyWorldSize(worldW, worldH, center) {
    if (!this.player || !this.player.body) return;
    this.playerBodyWorldW = worldW;
    this.playerBodyWorldH = worldH;
    const sx = Math.max(0.0001, Math.abs(this.player.scaleX || 1));
    const sy = Math.max(0.0001, Math.abs(this.player.scaleY || 1));
    const rawW = Math.max(1, worldW / sx);
    const rawH = Math.max(1, worldH / sy);
    this.player.body.setSize(rawW, rawH, center);
  }

  resolvePlayerEmbedding(context) {
    if (!this.tinyGridMode || !this.player || !this.player.body) return;
    const body = this.player.body;
    let overlapped = !!body.embedded;
    if (!overlapped && this.physics && this.solids) {
      overlapped = this.physics.overlap(this.player, this.solids);
    }
    if (!overlapped) return;

    for (let i = 0; i < 64; i += 1) {
      this.player.y -= 1;
      if (typeof body.updateFromGameObject === "function") body.updateFromGameObject();
      if (!this.physics.overlap(this.player, this.solids)) {
        body.embedded = false;
        break;
      }
    }
    const stillOverlapped = this.physics && this.solids ? this.physics.overlap(this.player, this.solids) : false;
    if (body.velocity.y > 0) body.velocity.y = 0;
    if (Platformer.Debug) {
      if (stillOverlapped) {
        Platformer.Debug.error(
          "GameScene.collision",
          `Player still embedded after resolve (${context}) x=${this.player.x.toFixed(1)} y=${this.player.y.toFixed(1)} ` +
          `bx=${body.x.toFixed(1)} by=${body.y.toFixed(1)} bw=${body.width} bh=${body.height} ` +
          `vx=${body.velocity.x.toFixed(1)} vy=${body.velocity.y.toFixed(1)}`
        );
      } else {
        Platformer.Debug.warn("GameScene.collision", `Resolved embedded player (${context}).`);
      }
    }
  }

  logIfPlayerInsideTile(now) {
    if (!this.player || !this.player.body || !this.solids || !this.physics) return;
    const body = this.player.body;
    const overlapped = !!body.embedded || this.physics.overlap(this.player, this.solids);
    if (!overlapped) {
      this.tileEmbedFrames = 0;
      return;
    }

    this.tileEmbedFrames += 1;
    if (this.tileEmbedFrames < 2) return;
    if (now - this.lastTileEmbedLogAt < 500) return;
    this.lastTileEmbedLogAt = now;

    if (Platformer.Debug) {
      Platformer.Debug.error(
        "GameScene.collision",
        `INSIDE_TILE detected x=${this.player.x.toFixed(1)} y=${this.player.y.toFixed(1)} ` +
        `bx=${body.x.toFixed(1)} by=${body.y.toFixed(1)} bw=${body.width} bh=${body.height} ` +
        `vx=${body.velocity.x.toFixed(1)} vy=${body.velocity.y.toFixed(1)} ` +
        `blocked(d,l,r,u)=${body.blocked.down ? 1 : 0},${body.blocked.left ? 1 : 0},${body.blocked.right ? 1 : 0},${body.blocked.up ? 1 : 0}`
      );
    }
  }

  resolveGroundPenetration(now) {
    if (!this.tinyGridMode || !this.player || !this.player.body || !this.solids || !this.physics) return;
    const body = this.player.body;
    if (!body.blocked.down || body.velocity.y < 0) return;
    let top = Number.POSITIVE_INFINITY;
    const hasOverlap = this.physics.overlap(this.player, this.solids, (_p, solid) => {
      if (solid && solid.body) top = Math.min(top, solid.body.top);
    });
    if (!hasOverlap || !Number.isFinite(top)) return;

    const penetration = body.bottom - top;
    if (penetration <= 1.25) return;
    const moved = Math.min(4, Math.ceil(penetration - 1));
    this.player.y -= moved;
    if (typeof body.updateFromGameObject === "function") body.updateFromGameObject();
    if (moved > 0 && Platformer.Debug && now - this.lastTileEmbedLogAt > 250) {
      this.lastTileEmbedLogAt = now;
      Platformer.Debug.warn("GameScene.collision", `Ground penetration corrected by ${moved}px`);
    }
  }

  setupHitboxOverlay() {
    this.hitboxOverlayEnabled = !!(Platformer.Debug && Platformer.Debug.hitboxesEnabled);
    this.hitboxOverlay = this.add.graphics();
    this.hitboxOverlay.setDepth(5000);
    this.hitboxOverlay.setScrollFactor(1);
    this.onHitboxesToggle = (ev) => {
      this.hitboxOverlayEnabled = !!(ev && ev.detail && ev.detail.enabled);
      if (Platformer.Debug) Platformer.Debug.log("GameScene.hitboxes", `Overlay ${this.hitboxOverlayEnabled ? "ON" : "OFF"}`);
      if (!this.hitboxOverlayEnabled && this.hitboxOverlay) this.hitboxOverlay.clear();
    };
    window.addEventListener("platformer:hitboxes-toggle", this.onHitboxesToggle);
    this.onPlayerHitboxChanged = (ev) => {
      const p = ev && ev.detail ? ev.detail : null;
      if (!p || !this.tinyGridMode || !this.player) return;
      this.playerHitboxProfile = { ...this.playerHitboxProfile, ...p };
      this.setPlayerBodyWorldSize(this.playerHitboxProfile.w, this.playerHitboxProfile.h, false);
      this.alignPlayerBodyToFeet();
      if (typeof this.player.body.updateFromGameObject === "function") this.player.body.updateFromGameObject();
      if (Platformer.Debug) {
        Platformer.Debug.log(
          "GameScene.collision",
          `Player HB applied w=${this.playerHitboxProfile.w} h=${this.playerHitboxProfile.h} ox=${this.playerHitboxProfile.ox} oy=${this.playerHitboxProfile.oy}`
        );
      }
    };
    window.addEventListener("platformer:player-hitbox-changed", this.onPlayerHitboxChanged);
  }

  drawHitboxOverlay(now) {
    if (!this.hitboxOverlay) return;
    if (!this.hitboxOverlayEnabled) {
      this.hitboxOverlay.clear();
      return;
    }
    if (now - this.lastHitboxDrawAt < 16) return;
    this.lastHitboxDrawAt = now;

    const g = this.hitboxOverlay;
    g.clear();
    const cam = this.cameras && this.cameras.main ? this.cameras.main : null;
    const view = cam ? cam.worldView : null;
    const inView = (b) => {
      if (!view) return true;
      return !(b.right < view.x - 24 || b.x > view.right + 24 || b.bottom < view.y - 24 || b.y > view.bottom + 24);
    };

    const drawBody = (body, color, width = 1) => {
      if (!body) return;
      if (!inView(body)) return;
      g.lineStyle(width, color, 1);
      g.strokeRect(body.x, body.y, body.width, body.height);
    };

    drawBody(this.player && this.player.body, 0x22c55e, 2);
    this.solids && this.solids.children.each((o) => drawBody(o && o.body, 0x38bdf8, 1));
    this.oneWays && this.oneWays.children.each((o) => drawBody(o && o.body, 0x06b6d4, 1));
    this.hazards && this.hazards.children.each((o) => drawBody(o && o.body, 0xf97316, 1));
    this.enemies && this.enemies.children.each((o) => drawBody(o && o.body, 0xef4444, 1));
    this.hazardProjectiles && this.hazardProjectiles.children.each((o) => drawBody(o && o.body, 0xeab308, 1));
  }

  updatePlayerHealthBar() {
    if (!this.player || !this.playerHealthBarBg || !this.playerHealthBarFill) {
      return;
    }

    const health = Phaser.Math.Clamp(this.registry.get("health"), 0, 3);
    const ratio = health / 3;
    const fillWidth = Math.max(0, (this.hpBarCfg ? this.hpBarCfg.fillW : 34) * ratio);
    const color = ratio > 0.66 ? 0x22c55e : (ratio > 0.33 ? 0xf59e0b : 0xef4444);
    const yOff = this.hpBarCfg ? this.hpBarCfg.yOff : 34;
    const xOff = this.hpBarCfg ? this.hpBarCfg.fillW / 2 : 18;
    this.playerHealthBarBg.setPosition(this.player.x, this.player.y - yOff);
    this.playerHealthBarFill.setPosition(this.player.x - xOff, this.player.y - yOff);
    this.playerHealthBarFill.width = fillWidth;
    this.playerHealthBarFill.setFillStyle(color, 1);
    this.playerHealthBarFill.setVisible(fillWidth > 0);
  }

  setupHazardShooters() {
    this.hazardShooters = [];
    let i = 0;
    this.hazards.children.each((hazard) => {
      // All turrets are active; stagger initial fire times for readability.
      hazard.setData("nextShotAt", this.time.now + i * 140);
      this.hazardShooters.push(hazard);
      i += 1;
    });
  }

  spawnHazardProjectiles(now) {
    if (!this.hazardShooters.length) {
      return;
    }

    let fired = 0;
    const maxShotsPerTick = 2;
    for (let i = 0; i < this.hazardShooters.length; i += 1) {
      if (fired >= maxShotsPerTick) {
        break;
      }

      const shooter = this.hazardShooters[i];
      if (!shooter || !shooter.active) {
        continue;
      }

      const nextShotAt = shooter.getData("nextShotAt") || 0;
      if (now < nextShotAt) {
        continue;
      }

      const inRangeX = Math.abs(shooter.x - this.player.x) < (this.tinyGridMode ? 220 : 540);
      const inRangeY = Math.abs(shooter.y - this.player.y) < (this.tinyGridMode ? 120 : 260);
      if (!inRangeX || !inRangeY) {
        continue;
      }

      const projectile = this.hazardProjectiles.create(shooter.x, shooter.y - 8, "hazard-projectile");
      projectile.setDepth(70);
      projectile.body.setSize(this.tinyGridMode ? 4 : 10, this.tinyGridMode ? 4 : 10);
      if (this.tinyGridMode) projectile.setDisplaySize(5, 5);
      projectile.body.setAllowGravity(false);
      projectile.setCollideWorldBounds(false);

      const dir = this.player.x >= shooter.x ? 1 : -1;
      const yAim = Phaser.Math.Clamp(this.player.y - shooter.y, -120, 90) * 0.35;
      projectile.setVelocity(dir * this.projectileSpeed, yAim);

      const stagger = (Math.floor(shooter.x / Platformer.Config.TILE) % 3) * 90;
      shooter.setData("nextShotAt", now + this.projectileIntervalMs + stagger);
      fired += 1;
      this.lastHazardShotAt = now;
    }
  }

  updateProjectiles() {
    const maxY = this.mapHeight * Platformer.Config.TILE + 200;
    const minX = -120;
    const maxX = this.mapWidth * Platformer.Config.TILE + 120;
    this.hazardProjectiles.children.each((p) => {
      if (!p.active) return;
      if (p.x < minX || p.x > maxX || p.y > maxY) {
        p.destroy();
      }
    });
  }

  updateLevelTimer(now) {
    if (!this.lastTickTime) {
      this.lastTickTime = now;
      return;
    }

    const dt = now - this.lastTickTime;
    this.lastTickTime = now;
    this.levelTimeRemainingMs = Math.max(0, this.levelTimeRemainingMs - dt);
    const secondsLeft = Math.ceil(this.levelTimeRemainingMs / 1000);
    if (secondsLeft !== this.lastTimerSecond) {
      this.lastTimerSecond = secondsLeft;
      this.registry.set("timeLeft", secondsLeft);
    }

    if (this.levelTimeRemainingMs <= 0 && !this.isDead) {
      this.isDead = true;
      this.game.events.emit("game-over");
      this.scene.pause();
    }
  }

  createTokyoBackdrop() {
    const { TILE } = Platformer.Config;
    const worldW = this.mapWidth * TILE;

    const skyTop = this.add.rectangle(worldW / 2, 120, worldW, 240, 0x111827).setDepth(-120).setScrollFactor(0);
    const skyMid = this.add.rectangle(worldW / 2, 260, worldW, 280, 0x1e1b4b).setDepth(-119).setScrollFactor(0);
    const skyGlow = this.add.rectangle(worldW / 2, 210, worldW, 180, 0x312e81, 0.35).setDepth(-118).setScrollFactor(0);
    this.parallax.push(skyTop, skyMid, skyGlow);

    const moon = this.add.circle(760, 88, 34, 0xfef3c7, 0.9).setDepth(-117).setScrollFactor(0.04);
    const moonGlow = this.add.circle(760, 88, 52, 0xfef9c3, 0.18).setDepth(-118).setScrollFactor(0.04);
    this.parallax.push(moon, moonGlow);

    const farHeights = [110, 120, 100, 130, 95, 126, 106, 116];
    for (let i = 0; i < 40; i += 1) {
      const w = 90;
      const h = farHeights[i % farHeights.length];
      const x = i * 88;
      const y = 320 - h / 2;
      const b = this.add.rectangle(x, y, w, h, 0x0f172a).setOrigin(0, 0.5).setDepth(-90).setScrollFactor(0.2);
      this.parallax.push(b);

      for (let wx = 0; wx < 4; wx += 1) {
        const color = (wx + i) % 2 === 0 ? 0x22d3ee : 0xf472b6;
        const win = this.add.rectangle(x + 12 + wx * 18, y - h / 2 + 18 + ((i + wx) % 5) * 14, 9, 6, color, 0.8)
          .setDepth(-89)
          .setScrollFactor(0.2);
        this.parallax.push(win);
      }
    }

    const midHeights = [140, 170, 150, 188, 132, 168];
    for (let i = 0; i < 26; i += 1) {
      const w = 122;
      const h = midHeights[i % midHeights.length];
      const x = i * 118;
      const y = 390 - h / 2;
      const b = this.add.rectangle(x, y, w, h, 0x020617).setOrigin(0, 0.5).setDepth(-70).setScrollFactor(0.45);
      this.parallax.push(b);

      if (i % 4 === 1) {
        const sign = this.add.rectangle(x + 70, y - h / 2 + 34, 58, 18, 0xdb2777, 0.9)
          .setDepth(-69)
          .setScrollFactor(0.45);
        this.parallax.push(sign);
      }
    }

    for (let i = 0; i < 24; i += 1) {
      const line = this.add.rectangle(i * 170, 120 + (i % 5) * 72, 120, 4, 0xffffff, 0.28)
        .setAngle(-16)
        .setOrigin(0, 0.5)
        .setDepth(-60)
        .setScrollFactor(0.12);
      this.parallax.push(line);
    }
  }

  tryBuildLevelFromLdtk(levelNumber) {
    if (Number(levelNumber) !== 5) return null;
    try {
      const ldtk = this.cache && this.cache.json ? this.cache.json.get("ldtk-test") : null;
      if (!ldtk || typeof ldtk !== "object") {
        const hasLevelFiveJson = !!(this.cache && this.cache.json && this.cache.json.get("level-5"));
        if (Platformer.Debug) {
          if (hasLevelFiveJson || (Platformer.LevelBuilders && typeof Platformer.LevelBuilders[5] === "function")) {
            Platformer.Debug.log("GameScene.ldtk", "Missing cached ldtk-test JSON; using Level 5 fallback data (JSON/built-in).");
          } else {
            Platformer.Debug.warn("GameScene.ldtk", "Missing ldtk-test and level-5 fallback data; using classic fallback level.");
          }
        }
        return null;
      }
      const levels = Array.isArray(ldtk.levels) ? ldtk.levels : [];
      const level = levels[0] || null;
      if (!level) {
        if (Platformer.Debug) Platformer.Debug.warn("GameScene.ldtk", "No levels in test.ldtk; falling back.");
        return null;
      }
      const layers = Array.isArray(level.layerInstances) ? level.layerInstances : [];
      const intLayer = layers.find((li) => li && li.__type === "IntGrid") || null;
      if (!intLayer) {
        if (Platformer.Debug) Platformer.Debug.warn("GameScene.ldtk", "No IntGrid layer found in test.ldtk; falling back.");
        return null;
      }
      const width = Number(intLayer.__cWid || 0);
      const height = Number(intLayer.__cHei || 0);
      const csv = Array.isArray(intLayer.intGridCsv) ? intLayer.intGridCsv : [];
      if (!width || !height || csv.length !== width * height) {
        if (Platformer.Debug) Platformer.Debug.warn("GameScene.ldtk", `Invalid IntGrid dimensions w=${width} h=${height} csv=${csv.length}; falling back.`);
        return null;
      }

      const rowsChars = Array.from({ length: height }, () => Array.from({ length: width }, () => "."));
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const v = Number(csv[y * width + x] || 0);
          if (v !== 0) rowsChars[y][x] = "#";
        }
      }

      // Find a sensible spawn above a solid tile.
      let sx = 1;
      let sy = 1;
      for (let y = 1; y < height; y += 1) {
        let found = false;
        for (let x = 0; x < width; x += 1) {
          if (rowsChars[y][x] === "." && rowsChars[y - 1][x] === "#") {
            sx = x;
            sy = y;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      rowsChars[sy][sx] = "S";

      return {
        width,
        height,
        rows: rowsChars.map((r) => r.join("")),
      };
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.error("GameScene.ldtk", err && err.stack ? err.stack : String(err));
      }
      return null;
    }
  }

  renderLdtkVisualTiles() {
    try {
      if (!this.textures.exists("ldtk-cavernas")) {
        if (Platformer.Debug) Platformer.Debug.warn("GameScene.ldtk", "ldtk-cavernas texture missing; visual tile render skipped.");
        return;
      }
      const ldtk = this.cache && this.cache.json ? this.cache.json.get("ldtk-test") : null;
      const level = ldtk && Array.isArray(ldtk.levels) ? ldtk.levels[0] : null;
      const layers = level && Array.isArray(level.layerInstances) ? level.layerInstances : [];
      const intLayer = layers.find((li) => li && li.__type === "IntGrid") || null;
      if (!intLayer) return;
      const autoTiles = Array.isArray(intLayer.autoLayerTiles) ? intLayer.autoLayerTiles : [];

      const tex = this.textures.get("ldtk-cavernas");
      const src = tex && tex.getSourceImage ? tex.getSourceImage() : null;
      const tileSize = Number(intLayer.__gridSize || Platformer.Config.TILE || 8);
      const cols = src && src.width ? Math.max(1, Math.floor(src.width / tileSize)) : 1;

      // Clear previous visuals if scene restarts.
      if (Array.isArray(this.ldtkVisualTiles) && this.ldtkVisualTiles.length) {
        this.ldtkVisualTiles.forEach((o) => { if (o && o.destroy) o.destroy(); });
      }
      this.ldtkVisualTiles = [];

      for (let i = 0; i < autoTiles.length; i += 1) {
        const t = autoTiles[i];
        if (!t || !Array.isArray(t.px) || !Array.isArray(t.src)) continue;
        const px = Number(t.px[0] || 0);
        const py = Number(t.px[1] || 0);
        const sx = Number(t.src[0] || 0);
        const sy = Number(t.src[1] || 0);
        const f = Number(t.f || 0);
        const frame = Math.floor(sy / tileSize) * cols + Math.floor(sx / tileSize);
        const img = this.add.image(px + tileSize / 2, py + tileSize / 2, "ldtk-cavernas", frame)
          .setDepth(-40)
          .setOrigin(0.5);
        if ((f & 1) !== 0) img.setFlipX(true);
        if ((f & 2) !== 0) img.setFlipY(true);
        this.ldtkVisualTiles.push(img);
      }

      if (Platformer.Debug) {
        Platformer.Debug.log("GameScene.ldtk", `Rendered LDtk auto tiles: ${this.ldtkVisualTiles.length}`);
      }
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.error("GameScene.ldtk", err && err.stack ? err.stack : String(err));
      }
    }
  }

  oneWayProcess(player, platform) {
    const pBody = player.body;
    const platBody = platform.body;
    const wasAbove = pBody.bottom <= platBody.top + 6;
    const isFalling = pBody.velocity.y >= 0;
    return wasAbove && isFalling;
  }

  keyCodeFromName(name, fallback) {
    if (!name) return fallback;
    const upper = String(name).toUpperCase();
    const direct = Phaser.Input.Keyboard.KeyCodes[upper];
    if (typeof direct === "number") return direct;
    if (upper.length === 1) {
      const letter = Phaser.Input.Keyboard.KeyCodes[upper];
      if (typeof letter === "number") return letter;
    }
    return fallback;
  }

  buildPlayerTuning(base) {
    const b = base || {};
    if (!this.tinyGridMode) return { ...b };
    const s = 0.5;
    return {
      ...b,
      maxSpeed: (b.maxSpeed || 164) * s,
      acceleration: (b.acceleration || 1080) * (s * 1.35),
      drag: (b.drag || 3200) * (s * 1.25),
      jumpVelocity: (b.jumpVelocity || 420) * s,
      gravity: (b.gravity || 1100) * s,
      dashSpeed: (b.dashSpeed || 460) * s,
      maxRiseSpeed: (b.maxRiseSpeed || 520) * s,
      maxFallSpeed: (b.maxFallSpeed || 760) * s,
      attackRange: Math.max(12, (b.attackRange || 44) * 0.45),
    };
  }

  buildJetpackTuning(base) {
    const b = { ...(base || {}) };
    if (!this.tinyGridMode) return b;
    const s = 0.5;
    b.maxUpSpeed = Math.max(28, Number(b.maxUpSpeed || 220) * s);
    b.momentumBoostSpeed = Math.max(12, Number(b.momentumBoostSpeed || 72) * s);
    b.activationKickSpeed = Math.max(8, Number(b.activationKickSpeed || 34) * s);
    b.maxAccel = Math.max(180, Number(b.maxAccel || 1320) * s);
    b.maxThrustAccel = Math.max(180, Number(b.maxThrustAccel || 1300) * s);
    b.brakeDecelMax = Math.max(120, Number(b.brakeDecelMax || 760) * s);
    b.liftThresholdSpeed = Math.max(10, Number(b.liftThresholdSpeed || 56) * s);
    return b;
  }

  buildControlKeyMap() {
    const c = Platformer.Settings.current.controls;
    return {
      left: this.keyCodeFromName(c.left, Phaser.Input.Keyboard.KeyCodes.A),
      right: this.keyCodeFromName(c.right, Phaser.Input.Keyboard.KeyCodes.D),
      jump: this.keyCodeFromName(c.jump, Phaser.Input.Keyboard.KeyCodes.W),
      dash: this.keyCodeFromName(c.dash, Phaser.Input.Keyboard.KeyCodes.SHIFT),
      attack: this.keyCodeFromName(c.attack, Phaser.Input.Keyboard.KeyCodes.J),
      interact: this.keyCodeFromName(c.interact, Phaser.Input.Keyboard.KeyCodes.E),
      pause: this.keyCodeFromName(c.pause, Phaser.Input.Keyboard.KeyCodes.ESC),
      jetpack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      demoWin: Phaser.Input.Keyboard.KeyCodes.F2,
    };
  }

  applyVideoSettings() {
    const s = Platformer.Settings.current;
    const brightness = Phaser.Math.Clamp(s.video.brightness, 0.8, 1.2);
    const shade = brightness >= 1 ? 0xffffff : 0x000000;
    const alpha = Math.abs(1 - brightness) * 0.45;
    const centerX = this.mapWidth * Platformer.Config.TILE / 2;
    const centerY = this.mapHeight * Platformer.Config.TILE / 2;
    const width = this.mapWidth * Platformer.Config.TILE + 800;
    const height = this.mapHeight * Platformer.Config.TILE + 800;
    if (this.brightnessOverlay && this.brightnessOverlay.active) {
      this.brightnessOverlay.setPosition(centerX, centerY);
      this.brightnessOverlay.setSize(width, height);
      this.brightnessOverlay.setFillStyle(shade, alpha);
    } else {
      this.brightnessOverlay = this.add.rectangle(centerX, centerY, width, height, shade, alpha)
        .setScrollFactor(0)
        .setDepth(200);
    }
  }

  applyRuntimeSettings(nextSettings) {
    try {
      const settings = nextSettings || Platformer.Settings.current || {};
      const audio = settings.audio || { master: 80, music: 60 };
      const volume = Phaser.Math.Clamp((Number(audio.master) / 100) * (Number(audio.music) / 100), 0, 1);

      if (Platformer.gameMusic && typeof Platformer.gameMusic.setVolume === "function") {
        Platformer.gameMusic.setVolume(volume);
      }
      if (Platformer.gameMusicHtml) {
        Platformer.gameMusicHtml.volume = volume;
      }
      if (this.keys && this.input && this.input.keyboard) {
        this.keys = this.input.keyboard.addKeys(this.buildControlKeyMap());
      }
      this.applyVideoSettings();
      this.updateCameraFraming();
      if (this.cameras && this.cameras.main && this.player) {
        const smooth = Phaser.Math.Clamp((settings.video.cameraSmoothing || 0) / 100, 0, 1);
        const followLerp = this.tinyGridMode ? 1 : smooth;
        this.cameras.main.startFollow(this.player, true, followLerp, followLerp);
        this.cameras.main.roundPixels = !this.tinyGridMode;
      }
      if (Platformer.Debug) {
        Platformer.Debug.log("GameScene.settings", `Applied runtime settings: gameVolume=${volume.toFixed(2)}`);
      }
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.error("GameScene.settings", err && err.stack ? err.stack : String(err));
      }
    }
  }

  updateCameraFraming() {
    if (!this.cameras || !this.cameras.main) {
      return;
    }
    const s = Platformer.Settings.current;
    const baseZoom = this.scale.height / Platformer.Config.GAME_HEIGHT;
    const resScale = Phaser.Math.Clamp(s.video.resolutionScale / 100, 0.5, 1);
    const modeZoom = this.tinyGridMode ? 3.5 : 1;
    const zoom = this.tinyGridMode
      ? Phaser.Math.Clamp(baseZoom * resScale * modeZoom, 2.5, 7)
      : Phaser.Math.Clamp(baseZoom * resScale * modeZoom, 0.75, 3);
    this.cameras.main.setZoom(zoom);
  }

  normalizeTurretTiles() {
    const grid = this.mapRows.map((row) => row.split(""));
    const inBounds = (x, y) => x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    const isSupport = (x, y) => {
      if (!inBounds(x, y)) return false;
      const ch = grid[y][x];
      return ch === "#" || ch === "=";
    };
    const isWalkableSlot = (x, y) => {
      if (!inBounds(x, y)) return false;
      const ch = grid[y][x];
      return ch === "." || ch === "^";
    };
    const findSpawnX = () => {
      for (let yy = 0; yy < this.mapHeight; yy += 1) {
        for (let xx = 0; xx < this.mapWidth; xx += 1) {
          if (grid[yy][xx] === "S") return xx;
        }
      }
      return 0;
    };
    const spawnX = findSpawnX();

    const turrets = [];
    for (let y = 0; y < this.mapHeight; y += 1) {
      for (let x = 0; x < this.mapWidth; x += 1) {
        if (grid[y][x] === "^") {
          turrets.push({ x, y });
          grid[y][x] = ".";
        }
      }
    }

    const isSafeFromSpawn = (x) => Math.abs(x - spawnX) >= 8;
    const tryPlace = (x, y) => {
      if (isWalkableSlot(x, y) && isSupport(x, y + 1)) {
        if (!isSafeFromSpawn(x)) {
          return false;
        }
        grid[y][x] = "^";
        return true;
      }
      return false;
    };

    turrets.forEach(({ x, y }) => {
      let placed = false;
      const preferredY = Phaser.Math.Clamp(y, 0, this.mapHeight - 2);

      // Keep authored lane first for better level readability.
      placed = tryPlace(x, preferredY);

      // Then search nearby vertically only.
      if (!placed) {
        for (let d = 1; d <= 2 && !placed; d += 1) {
          const up = preferredY - d;
          const down = preferredY + d;
          if (up >= 0) placed = tryPlace(x, up);
          if (!placed && down <= this.mapHeight - 2) placed = tryPlace(x, down);
        }
      }
    });

    this.mapRows = grid.map((row) => row.join(""));
  }

  normalizeEnemyTiles() {
    const enemyChars = new Set(["E", "F", "G", "H"]);
    const grid = this.mapRows.map((row) => row.split(""));
    const inBounds = (x, y) => x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    const chAt = (x, y) => (inBounds(x, y) ? grid[y][x] : ".");
    const isSupport = (x, y) => {
      const ch = chAt(x, y);
      return ch === "#" || ch === "=";
    };
    const isEnemySpotOpen = (x, y) => chAt(x, y) === ".";
    const isHazardAt = (x, y) => chAt(x, y) === "^";
    const hasHeadroom = (x, y) => y <= 0 || chAt(x, y - 1) === ".";
    const canStandAt = (x, y) =>
      inBounds(x, y)
      && y < this.mapHeight - 1
      && isEnemySpotOpen(x, y)
      && isSupport(x, y + 1)
      && !isHazardAt(x, y)
      && hasHeadroom(x, y);
    const patrolSpanAt = (x, y) => {
      if (!canStandAt(x, y)) {
        return 0;
      }

      let left = x;
      let right = x;
      while (canStandAt(left - 1, y)) left -= 1;
      while (canStandAt(right + 1, y)) right += 1;
      return right - left + 1;
    };

    let spawnX = 0;
    for (let y = 0; y < this.mapHeight; y += 1) {
      for (let x = 0; x < this.mapWidth; x += 1) {
        if (grid[y][x] === "S") {
          spawnX = x;
        }
      }
    }

    const turrets = [];
    const enemies = [];
    for (let y = 0; y < this.mapHeight; y += 1) {
      for (let x = 0; x < this.mapWidth; x += 1) {
        const ch = grid[y][x];
        if (ch === "^") turrets.push({ x, y });
        if (enemyChars.has(ch)) {
          enemies.push({ x, y, type: ch });
          grid[y][x] = ".";
        }
      }
    }

    const isSafeFromTurrets = (x, y) => !turrets.some((t) => Math.abs(t.x - x) <= 5 && Math.abs(t.y - y) <= 2);
    const isSafeFromSpawn = (x) => Math.abs(x - spawnX) >= 10;
    const placedEnemies = [];
    const isSafeFromOtherEnemies = (x, y) => !placedEnemies.some((e) => Math.abs(e.x - x) <= 4 && Math.abs(e.y - y) <= 2);
    const hasPatrolRoom = (x, y) => {
      const span = patrolSpanAt(x, y);
      if (span < 6) return false;
      return canStandAt(x - 1, y) || canStandAt(x + 1, y);
    };
    const canPlaceEnemy = (x, y) =>
      canStandAt(x, y)
      && hasPatrolRoom(x, y)
      && isSafeFromTurrets(x, y)
      && isSafeFromSpawn(x)
      && isSafeFromOtherEnemies(x, y);

    enemies.forEach((enemy) => {
      let placed = false;
      const tryOrder = [0, -1, 1];
      for (const dy of tryOrder) {
        const yy = enemy.y + dy;
        for (let dx = 0; dx <= 6; dx += 1) {
          const xs = dx === 0 ? [enemy.x] : [enemy.x - dx, enemy.x + dx];
          for (const xx of xs) {
            if (canPlaceEnemy(xx, yy)) {
              grid[yy][xx] = enemy.type;
              placedEnemies.push({ x: xx, y: yy });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
        if (placed) break;
      }

      if (!placed) {
        for (let y = 0; y < this.mapHeight - 1; y += 1) {
          for (let x = 0; x < this.mapWidth; x += 1) {
            if (canPlaceEnemy(x, y)) {
              grid[y][x] = enemy.type;
              placedEnemies.push({ x, y });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
      }
    });

    this.mapRows = grid.map((row) => row.join(""));
  }

  enemyOneWayProcess(enemy, platform) {
    const eBody = enemy.body;
    const pBody = platform.body;
    return eBody.bottom <= pBody.top + 4 && eBody.velocity.y >= 0;
  }

  tileCharAtWorld(worldX, worldY) {
    const { TILE } = Platformer.Config;
    const tx = Math.floor(worldX / TILE);
    const ty = Math.floor(worldY / TILE);
    return this.tileCharAt(tx, ty);
  }

  tileCharAt(tileX, tileY) {
    if (tileX < 0 || tileY < 0 || tileY >= this.mapHeight || tileX >= this.mapWidth) {
      return ".";
    }
    return this.mapRows[tileY][tileX];
  }

  hasSupportAtWorld(worldX, worldY) {
    const ch = this.tileCharAtWorld(worldX, worldY);
    return ch === "#" || ch === "=";
  }

  isHazardAtWorld(worldX, worldY) {
    return this.tileCharAtWorld(worldX, worldY) === "^";
  }

  isSupportTile(tileX, tileY) {
    const ch = this.tileCharAt(tileX, tileY);
    return ch === "#" || ch === "=";
  }

  isHazardTile(tileX, tileY) {
    return this.tileCharAt(tileX, tileY) === "^";
  }

  computeEnemyPatrolBounds(tileX, tileY) {
    const { TILE } = Platformer.Config;
    const supportY = tileY + 1;
    let left = tileX;
    let right = tileX;

    while (this.isSupportTile(left - 1, supportY) && !this.isHazardTile(left - 1, tileY)) {
      left -= 1;
    }
    while (this.isSupportTile(right + 1, supportY) && !this.isHazardTile(right + 1, tileY)) {
      right += 1;
    }

    return {
      minX: left * TILE + TILE / 2,
      maxX: right * TILE + TILE / 2,
    };
  }

  updateEnemyPatrol(enemy, now) {
    if (!enemy.active) return;

    let speed = enemy.getData("patrolSpeed");
    let dir = enemy.getData("direction");
    if (!dir) dir = enemy.body.velocity.x >= 0 ? 1 : -1;
    const minX = enemy.getData("patrolMinX");
    const maxX = enemy.getData("patrolMaxX");
    const useBounded = !!enemy.getData("useBoundedPatrol");
    const turnCooldownUntil = enemy.getData("turnCooldownUntil") || 0;
    const grounded = enemy.body.blocked.down || enemy.body.touching.down;
    const enemyType = enemy.getData("enemyType") || "E";
    const closeX = Math.abs(enemy.x - this.player.x) < (enemyType === "G" ? 260 : 190);
    const closeY = Math.abs(enemy.y - this.player.y) < 70;
    const aggressive = closeX && closeY;
    let aiState = enemy.getData("aiState") || "patrol";
    let stateUntil = enemy.getData("stateUntil") || 0;
    let attackCooldownUntil = enemy.getData("attackCooldownUntil") || 0;

    if (aggressive) {
      dir = this.player.x >= enemy.x ? 1 : -1;
      const mult = enemyType === "G" ? 2.3 : (enemyType === "H" ? 1.55 : 1.8);
      speed *= mult;
      enemy.setTint(0xf87171);
    } else {
      enemy.clearTint();
    }

    if ((enemyType === "G" || enemyType === "H") && aggressive && grounded) {
      if (aiState === "patrol" && now >= attackCooldownUntil) {
        aiState = "windup";
        stateUntil = now + (enemyType === "G" ? 210 : 280);
      } else if (aiState === "windup" && now >= stateUntil) {
        aiState = "lunge";
        stateUntil = now + (enemyType === "G" ? 280 : 220);
        dir = this.player.x >= enemy.x ? 1 : -1;
      } else if (aiState === "lunge" && now >= stateUntil) {
        aiState = "recover";
        stateUntil = now + 240;
        attackCooldownUntil = now + (enemyType === "G" ? 900 : 1200);
      } else if (aiState === "recover" && now >= stateUntil) {
        aiState = "patrol";
      }
    } else if (!aggressive && aiState !== "patrol") {
      aiState = "patrol";
    }

    if (aiState === "windup") {
      speed = 0;
      enemy.setTint(0xfacc15);
    } else if (aiState === "lunge") {
      const burst = enemyType === "G" ? 3.2 : 2.5;
      speed *= burst;
      enemy.setTint(0xfb7185);
    }

    if (enemyType === "F" && grounded) {
      const nextJumpAt = enemy.getData("nextJumpAt") || 0;
      if (now >= nextJumpAt) {
        enemy.setVelocityY(-260);
        enemy.setData("nextJumpAt", now + 1150);
      }
    }

    const hitLeft = enemy.body.blocked.left || enemy.body.touching.left;
    const hitRight = enemy.body.blocked.right || enemy.body.touching.right;

    if (hitLeft) {
      dir = 1;
      enemy.x += 1.5;
    }
    if (hitRight) {
      dir = -1;
      enemy.x -= 1.5;
    }

    if (useBounded) {
      if (enemy.x <= minX + 2) {
        dir = 1;
      } else if (enemy.x >= maxX - 2) {
        dir = -1;
      }
    }

    if (grounded) {
      const aheadX = enemy.x + dir * (enemy.body.width / 2 + 8);
      const footY = enemy.body.bottom + 6;
      const noGroundAhead = !this.hasSupportAtWorld(aheadX, footY);
      const hazardAhead = this.isHazardAtWorld(aheadX, footY - 10);
      if ((!useBounded && noGroundAhead) || hazardAhead) {
        if (now >= turnCooldownUntil) {
          dir *= -1;
          enemy.setData("turnCooldownUntil", now + 160);
          enemy.x += dir * 4;
        }
      }
    }

    if (!grounded && !useBounded) {
      const fallbackAheadX = enemy.x + dir * (enemy.body.width / 2 + 5);
      const fallbackFootY = enemy.body.bottom + 10;
      if (!this.hasSupportAtWorld(fallbackAheadX, fallbackFootY) && now >= turnCooldownUntil) {
        dir *= -1;
        enemy.setData("turnCooldownUntil", now + 160);
      }
    }

    enemy.setData("direction", dir);
    enemy.setVelocityX(dir * speed);
    enemy.setData("isAggressive", aggressive);
    enemy.setData("aiState", aiState);
    enemy.setData("stateUntil", stateUntil);
    enemy.setData("attackCooldownUntil", attackCooldownUntil);

    // Stuck recovery: if enemy is grounded and not advancing, hop out of cracks.
    const lastX = enemy.getData("lastX");
    let stuckSince = enemy.getData("stuckSince") || now;
    const moved = Math.abs(enemy.x - lastX) > 2;
    if (moved) {
      stuckSince = now;
    }

    if (grounded && !moved && Math.abs(enemy.body.velocity.x) < 14) {
      if (now - stuckSince > 320) {
        const jumpY = enemyType === "H" ? -210 : -260;
        enemy.setVelocityY(jumpY);
        dir *= -1;
        enemy.setData("direction", dir);
        enemy.setVelocityX(dir * speed);
        stuckSince = now;
      }
    }

    enemy.setData("lastX", enemy.x);
    enemy.setData("stuckSince", stuckSince);
  }

  showToast(message, color = 0xfef3c7) {
    this.game.events.emit("toast-message", { text: message, color });
    if (Platformer.Debug) Platformer.Debug.log("GameScene.toast", message);
  }

  applyCoinMilestoneReward(totalCoins) {
    if (this.coinRewardState[totalCoins]) return;

    if (totalCoins === 3) {
      const before = this.registry.get("health") || 0;
      const after = Math.min(3, before + 1);
      if (after > before) {
        this.registry.set("health", after);
        this.showToast("Reward: +1 Health", 0x86efac);
      } else {
        this.showToast("Reward: Health already full", 0xbbf7d0);
      }
      this.coinRewardState[totalCoins] = true;
      this.events.emit("hud-update");
      this.updatePlayerHealthBar();
      return;
    }

    if (totalCoins === 6) {
      this.levelTimeRemainingMs += 12000;
      const secondsLeft = Math.ceil(this.levelTimeRemainingMs / 1000);
      this.registry.set("timeLeft", secondsLeft);
      this.showToast("Reward: +12s Time", 0x93c5fd);
      this.coinRewardState[totalCoins] = true;
      this.events.emit("hud-update");
      return;
    }

    if (totalCoins === 9) {
      this.shieldCharges += 1;
      this.registry.set("shield", this.shieldCharges);
      this.showToast("Reward: Shield x1", 0xc4b5fd);
      this.coinRewardState[totalCoins] = true;
      this.events.emit("hud-update");
    }
  }

  tryStartDash(now, moveLeft, moveRight) {
    const PLAYER = this.playerTuning || Platformer.Config.PLAYER;
    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    const canDash = now - this.lastDashAt >= PLAYER.dashCooldownMs;
    if (!canDash || this.isDashing) return false;

    let dir = this.facingDir || 1;
    if (moveLeft && !moveRight) dir = -1;
    if (moveRight && !moveLeft) dir = 1;

    this.isDashing = true;
    this.lastDashAt = now;
    this.dashEndsAt = now + PLAYER.dashDurationMs;
    this.player.setDragX(0);
    this.player.setAccelerationX(0);
    this.player.setVelocityX(dir * PLAYER.dashSpeed);
    if (!grounded && this.player.body.velocity.y > 30) {
      this.player.setVelocityY(30);
    }
    this.player.setTint(0x93c5fd);
    this.registry.set("dashCd", Math.ceil(PLAYER.dashCooldownMs / 1000));
    Platformer.beeper.dash();
    return true;
  }

  stopDash() {
    if (!this.isDashing) return;
    this.isDashing = false;
    this.player.setDragX((this.playerTuning || Platformer.Config.PLAYER).drag);
    this.player.clearTint();
  }

  tryAttack(now) {
    const PLAYER = this.playerTuning || Platformer.Config.PLAYER;
    if (now - this.lastAttackAt < PLAYER.attackCooldownMs) return;

    this.lastAttackAt = now;
    this.attackActiveUntil = now + 120;
    this.player.setTint(0xfde68a);
    Platformer.beeper.attack();

    let hits = 0;
    this.enemies.children.each((enemy) => {
      if (!enemy || !enemy.active) return;
      const dx = enemy.x - this.player.x;
      const dy = Math.abs(enemy.y - this.player.y);
      const inFront = this.facingDir > 0 ? dx >= -6 : dx <= 6;
      const inRange = Math.abs(dx) <= PLAYER.attackRange && dy <= 28;
      if (!inFront || !inRange) return;

      const hp = enemy.getData("hp") || 1;
      if (hp <= 1) {
        enemy.disableBody(true, true);
      } else {
        enemy.setData("hp", hp - 1);
        enemy.setTint(0xfca5a5);
      }
      hits += 1;
    });

    if (hits > 0) {
      this.showToast(`Hit x${hits}`, 0xfef08a);
    }
  }

  updateLandingFeedback() {
    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    const currentDownSpeed = Math.max(0, this.player.body.velocity.y);
    if (!grounded) {
      this.airbornePeakSpeedY = Math.max(this.airbornePeakSpeedY, currentDownSpeed);
    } else if (!this.wasGroundedLastFrame) {
      const impact = this.airbornePeakSpeedY;
      if (impact > 200) {
        // Screen shake removed: keep landing audio feedback only.
        Platformer.beeper.land();
      }
      this.airbornePeakSpeedY = 0;
    }
    this.wasGroundedLastFrame = grounded;
  }

  updateAuxHud(now) {
    if (now - this.lastAuxHudAt < 120) return;
    this.lastAuxHudAt = now;

    const dashLeft = Math.max(0, (Platformer.Config.PLAYER.dashCooldownMs - (now - this.lastDashAt)) / 1000);
    this.registry.set("dashCd", dashLeft);
    this.registry.set("shield", this.shieldCharges);
    this.registry.set("jetpackFuel", this.jetpackFuelPercent);
  }

  collectCoin(coin) {
    coin.disableBody(true, true);
    const updatedCoins = this.registry.get("coins") + 1;
    this.registry.set("coins", updatedCoins);
    Platformer.beeper.coin();
    this.applyCoinMilestoneReward(updatedCoins);
    this.events.emit("hud-update");

    if (updatedCoins >= Platformer.Config.WIN_COIN_TARGET && !this.levelComplete) {
      this.completeLevel();
    }
  }

  activateCheckpoint(checkpoint) {
    if (checkpoint.getData("activeCheckpoint")) {
      return;
    }

    this.checkpoints.children.each((cp) => {
      cp.clearTint();
      cp.setData("activeCheckpoint", false);
    });

    checkpoint.setTint(0x22c55e);
    checkpoint.setData("activeCheckpoint", true);
    this.respawnPoint.set(checkpoint.x, checkpoint.y - (this.tinyGridMode ? 10 : 20));
  }

  onHazardHit() {
    this.applyDamage(this.hazardDamage);
  }

  handleEnemyContact(enemy) {
    const PLAYER = this.playerTuning || Platformer.Config.PLAYER;

    if (!enemy.active || this.isDead) {
      return;
    }

    if (this.isDashing) {
      const hp = enemy.getData("hp") || 1;
      if (hp <= 1) {
        enemy.disableBody(true, true);
      } else {
        enemy.setData("hp", hp - 1);
      }
      this.player.setVelocityY(-PLAYER.jumpVelocity * 0.3);
      this.showToast("Dash Break!", 0x93c5fd);
      return;
    }

    const playerBottom = this.player.body.bottom;
    const enemyTop = enemy.body.top;
    const isStomp = this.player.body.velocity.y > 40 && playerBottom <= enemyTop + 10;

    if (isStomp) {
      const hp = enemy.getData("hp") || 1;
      if (hp <= 1) {
        enemy.disableBody(true, true);
      } else {
        enemy.setData("hp", hp - 1);
        enemy.setTint(0xfca5a5);
      }
      this.player.setVelocityY(-PLAYER.jumpVelocity * 0.55);
      Platformer.beeper.stomp();
      return;
    }

    const enemyType = enemy.getData("enemyType") || "E";
    const aiState = enemy.getData("aiState") || "patrol";
    const contactDamage = (enemyType === "H" || aiState === "lunge") ? 2 : 1;
    this.applyDamage(contactDamage);
  }

  applyDamage(amount = 1) {
    const PLAYER = this.playerTuning || Platformer.Config.PLAYER;
    const settings = Platformer.Settings.current;

    const now = this.time.now;
    const invuln = Math.round(PLAYER.hurtInvulnMs * this.hazardCooldownScale);
    if (now - this.lastDamageTime < invuln || this.isDead) {
      return;
    }

    if (this.shieldCharges > 0) {
      this.shieldCharges -= 1;
      this.registry.set("shield", this.shieldCharges);
      this.lastDamageTime = now;
      this.player.setTintFill(0xc4b5fd);
      this.time.delayedCall(90, () => {
        if (this.player && this.player.active) this.player.clearTint();
      });
      this.showToast("Shield blocked damage", 0xc4b5fd);
      return;
    }

    this.lastDamageTime = now;
    const newHealth = this.registry.get("health") - amount;
    this.registry.set("health", newHealth);
    this.events.emit("hud-update");
    this.updatePlayerHealthBar();
    Platformer.beeper.damage();

    if (newHealth <= 0) {
      const remainingLives = this.registry.get("lives") - 1;
      this.registry.set("lives", remainingLives);

      if (remainingLives <= 0) {
        this.isDead = true;
        this.game.events.emit("game-over");
        this.scene.pause();
        return;
      }

      this.registry.set("health", 3);
      this.respawn();
    } else {
      this.player.setVelocity(-this.player.body.velocity.x * 0.35, this.tinyGridMode ? -75 : -220);
      // Screen shake removed entirely.
    }
  }

  respawn() {
    const a11y = Platformer.Settings.current.accessibility;
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.alignPlayerBodyToFeet();
    this.resolvePlayerEmbedding("respawn");
    this.player.setVelocity(0, 0);
    this.player.setAccelerationX(0);
    this.player.clearTint();
    this.jumpsUsed = 0;
    this.isJumpHeld = false;
    this.isDashing = false;
    this.attackActiveUntil = 0;
    this.jetpackActive = false;
    if (this.jetpack) this.jetpack.reset(true);
    this.jetpackFuelPercent = this.jetpack ? this.jetpack.fuelPercent : 100;
    this.registry.set("jetpackFuel", this.jetpackFuelPercent);
    this.player.setAccelerationY(0);
    this.player.body.setGravityY(0);
    if (this.jetpackFlame) this.jetpackFlame.setVisible(false);
    if (!a11y.flashReduction) {
      this.cameras.main.flash(120, 255, 255, 255);
    }
    this.updatePlayerHealthBar();
    this.events.emit("hud-update");
  }

  completeLevel() {
    const a11y = Platformer.Settings.current.accessibility;
    const timeLeft = Number(this.registry.get("timeLeft") || 0);
    const coins = Number(this.registry.get("coins") || 0);
    const payload = {
      nodeId: this.currentNodeId,
      worldId: this.currentWorldId,
      level: this.registry.get("level"),
      coins,
      timeLeft,
      targetCoins: Platformer.Config.WIN_COIN_TARGET,
    };

    this.levelComplete = true;
    this.player.setAccelerationX(0);
    this.player.setVelocity(0, this.tinyGridMode ? -52 : -140);
    this.jetpackActive = false;
    if (this.jetpack) this.jetpack.reset(false);
    this.jetpackFuelPercent = this.jetpack ? this.jetpack.fuelPercent : this.jetpackFuelPercent;
    this.player.setAccelerationY(0);
    this.player.body.setGravityY(0);
    if (this.jetpackFlame) this.jetpackFlame.setVisible(false);
    this.player.setTexture("player-run-1");
    this.player.setTint(0xfef08a);
    this.physics.world.pause();
    const baseZoom = this.cameras.main ? this.cameras.main.zoom : 1;
    const targetZoom = this.tinyGridMode
      ? baseZoom * (a11y.reducedMotion ? 1.01 : 1.05)
      : (a11y.reducedMotion ? 1.02 : 1.15);
    this.cameras.main.zoomTo(targetZoom, a11y.reducedMotion ? 220 : 550, "Quad.easeOut", true);
    if (!a11y.flashReduction) {
      this.cameras.main.flash(200, 255, 255, 255);
    }
    if (Platformer.Progress && typeof Platformer.Progress.markLevelCompleted === "function") {
      try {
        const resolvedNodeId = Platformer.Progress.markLevelCompleted(payload);
        payload.resolvedNodeId = resolvedNodeId;
      } catch (err) {
        if (Platformer.Debug) {
          Platformer.Debug.error("GameScene.completeLevel", err && err.stack ? err.stack : String(err));
        }
      }
    }

    this.game.events.emit("level-complete", payload);
  }

  update() {
    const PLAYER = this.playerTuning || Platformer.Config.PLAYER;
    const { WIN_COIN_TARGET } = Platformer.Config;

    if (!this.player || this.isDead || this.levelComplete) {
      return;
    }

    const now = this.time.now;
    if (now - this.diagLastAt >= 450) {
      this.diagLastAt = now;
      this.runRuntimeDiagnostics(now);
    }
    this.updateLevelTimer(now);
    this.spawnHazardProjectiles(now);
    this.updateProjectiles();
    this.updatePlayerHealthBar();
    const moveLeft = this.keys.left.isDown || this.cursors.left.isDown;
    const moveRight = this.keys.right.isDown || this.cursors.right.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space)
      || Phaser.Input.Keyboard.JustDown(this.keys.jump);
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keys.dash);
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack);
    const demoWinPressed = Phaser.Input.Keyboard.JustDown(this.keys.demoWin);
    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    const jumpHeld = this.cursors.up.isDown || this.cursors.space.isDown || this.keys.jump.isDown;
    // Jetpack thrust is explicit: hold SPACE only.
    const jetpackInputHeld = !grounded && (
      this.cursors.space.isDown
      || (this.keys.jetpack && this.keys.jetpack.isDown)
    );
    const dt = Math.max(0.001, this.game.loop.delta / 1000);

    if (demoWinPressed && !this.levelComplete) {
      this.registry.set("coins", WIN_COIN_TARGET);
      this.events.emit("hud-update");
      this.completeLevel();
      return;
    }

    if (grounded) {
      this.lastOnGroundTime = now;
      this.jumpsUsed = 0;
    }

    if (jumpPressed) {
      this.lastJumpPressedTime = now;
    }

    const canUseCoyote = now - this.lastOnGroundTime <= PLAYER.coyoteTimeMs;
    const hasBufferedJump = now - this.lastJumpPressedTime <= PLAYER.jumpBufferMs;

    // Prevent mid-air jump velocity resets: coyote jump is only valid before first jump is consumed.
    if (!this.isDashing && this.jumpsUsed === 0 && canUseCoyote && hasBufferedJump) {
      this.player.setVelocityY(-PLAYER.jumpVelocity);
      this.jumpsUsed = 1;
      this.lastOnGroundTime = -9999;
      this.lastJumpPressedTime = -9999;
      this.isJumpHeld = true;
      Platformer.beeper.jump();
    }
    const jetpackStatus = this.jetpack
      ? this.jetpack.update({
        scene: this,
        player: this.player,
        now,
        dt,
        grounded,
        jumpHeld,
        thrustHeld: jetpackInputHeld,
        worldGravity: PLAYER.gravity,
        jumpVelocity: PLAYER.jumpVelocity,
      })
      : { isThrusting: false, fuelPercent: 0 };
    this.jetpackActive = !!jetpackStatus.isThrusting;
    this.jetpackFuelPercent = Phaser.Math.Clamp(Number(jetpackStatus.fuelPercent || 0), 0, 100);
    if (this.jetpackActive) {
      this.isJumpHeld = false;
    }

    // Safety clamp: prevent rare vertical-speed spikes from interactions/stacked forces.
    const maxRiseSpeed = Math.max(120, Number(PLAYER.maxRiseSpeed || 520));
    const maxFallSpeed = Math.max(200, Number(PLAYER.maxFallSpeed || 760));
    if (this.player.body.velocity.y < -maxRiseSpeed) {
      this.player.setVelocityY(-maxRiseSpeed);
    } else if (this.player.body.velocity.y > maxFallSpeed) {
      this.player.setVelocityY(maxFallSpeed);
    }

    if (!this.isDashing && !jumpHeld && this.isJumpHeld && this.player.body.velocity.y < -120) {
      this.player.setVelocityY(this.player.body.velocity.y * 0.5);
      this.isJumpHeld = false;
    }

    if (dashPressed) {
      this.tryStartDash(now, moveLeft, moveRight);
    }
    if (attackPressed) {
      this.tryAttack(now);
    }

    const opposingInput = moveLeft && moveRight;

    if (this.isDashing) {
      const dashDir = this.player.body.velocity.x >= 0 ? 1 : -1;
      this.player.setVelocityX(dashDir * PLAYER.dashSpeed);
      this.player.setAccelerationX(0);
      this.player.setDragX(0);
      if (now >= this.dashEndsAt) {
        this.stopDash();
      }
    } else {
      const moveSpeed = grounded ? PLAYER.maxSpeed : Math.floor(PLAYER.maxSpeed * 0.9);
      this.player.setAccelerationX(0);
      this.player.setDragX(0);

      if (opposingInput || (!moveLeft && !moveRight)) {
        // Digital stop: no inertia, no glide, no opposite-key slide.
        this.player.setVelocityX(0);
        if (this.player.body) this.player.body.velocity.x = 0;
      } else if (moveLeft) {
        this.player.setVelocityX(-moveSpeed);
        this.player.setFlipX(false);
        this.facingDir = -1;
      } else if (moveRight) {
        this.player.setVelocityX(moveSpeed);
        this.player.setFlipX(true);
        this.facingDir = 1;
      }
    }
    if (this.tinyGridMode && this.player && this.player.body) {
      const body = this.player.body;
      if ((body.blocked.left && moveLeft && !moveRight) || (body.blocked.right && moveRight && !moveLeft)) {
        this.player.setVelocityX(0);
      }
      if (body.embedded) {
        this.resolvePlayerEmbedding("runtime");
      }
    }
    this.resolveGroundPenetration(now);
    this.logIfPlayerInsideTile(now);
    this.drawHitboxOverlay(now);
    if (!this.isDashing && now > this.attackActiveUntil) {
      this.player.clearTint();
    }

    this.updateJetpackFx(now, this.jetpackActive);

    if (this.useImportedCharacter) {
      if (!grounded) {
        if (this.player.anims && this.player.anims.isPlaying) {
          this.player.anims.stop();
        }
        if (this.player.texture && this.player.texture.key === "player-idle-sheet") {
          const airborneFrame = this.jetpackActive ? ((Math.floor(now / 90) % 2 === 0) ? 1 : 2) : 2;
          this.player.setFrame(airborneFrame);
        }
      } else if (this.anims.exists("playerIdleAnim")) {
        if (!this.player.anims.isPlaying || this.player.anims.getName() !== "playerIdleAnim") {
          this.player.setTexture("player-idle-sheet", 0);
          this.player.play("playerIdleAnim");
        }
      } else {
        if (!this.idleAnimWarned && Platformer.Debug) {
          Platformer.Debug.warn("GameScene.playerIdle", "playerIdleAnim not found; fallback idle in use.");
          this.idleAnimWarned = true;
        }
        this.player.setTexture((Math.floor(now / 360) % 2 === 0) ? "player-idle-1" : "player-idle-2");
      }
    } else if (this.jetpackActive || this.player.body.velocity.y < (this.tinyGridMode ? -8 : -25) || !this.player.body.blocked.down) {
      if (this.player.anims && this.player.anims.isPlaying) {
        this.player.anims.stop();
      }
      this.player.setTexture("player-jump");
    } else if (Math.abs(this.player.body.velocity.x) > (this.tinyGridMode ? 10 : 35)) {
      if (this.player.anims && this.player.anims.isPlaying) {
        this.player.anims.stop();
      }
      this.player.setTexture((Math.floor(now / 100) % 2 === 0) ? "player-run-1" : "player-run-2");
    } else {
      this.player.setTexture((Math.floor(now / 360) % 2 === 0) ? "player-idle-1" : "player-idle-2");
    }

    let anyAggressive = false;
    this.enemies.children.each((enemy) => {
      this.updateEnemyPatrol(enemy, now);
      if (enemy.getData("isAggressive")) {
        anyAggressive = true;
      }
    });
    const projectileThreat = this.hazardProjectiles && this.hazardProjectiles.countActive(true) > 0;
    const threat = anyAggressive || projectileThreat;
    if (threat !== this.threatActive) {
      this.threatActive = threat;
      this.registry.set("threat", threat ? "DANGER" : "CALM");
    }
    this.updateLandingFeedback();
    this.updateAuxHud(now);

    if (this.player.y > this.mapHeight * Platformer.Config.TILE + 140) {
      this.applyDamage();
      if (!this.isDead) {
        this.respawn();
      }
    }
  }

  shutdown() {
    if (this.onRestartLevel) {
      this.game.events.off("restart-level", this.onRestartLevel);
      this.onRestartLevel = null;
    }
    if (this.onSettingsChanged) {
      this.game.events.off("settings-changed", this.onSettingsChanged);
      this.onSettingsChanged = null;
    }
    this.scale.off("resize", this.updateCameraFraming, this);
    if (this.jetpackFlame && this.jetpackFlame.destroy) {
      this.jetpackFlame.destroy();
      this.jetpackFlame = null;
    }
    if (this.onHitboxesToggle) {
      window.removeEventListener("platformer:hitboxes-toggle", this.onHitboxesToggle);
      this.onHitboxesToggle = null;
    }
    if (this.onPlayerHitboxChanged) {
      window.removeEventListener("platformer:player-hitbox-changed", this.onPlayerHitboxChanged);
      this.onPlayerHitboxChanged = null;
    }
    if (this.hitboxOverlay && this.hitboxOverlay.destroy) {
      this.hitboxOverlay.destroy();
      this.hitboxOverlay = null;
    }
    if (Array.isArray(this.ldtkVisualTiles) && this.ldtkVisualTiles.length) {
      this.ldtkVisualTiles.forEach((o) => { if (o && o.destroy) o.destroy(); });
      this.ldtkVisualTiles = [];
    }
  }
};
