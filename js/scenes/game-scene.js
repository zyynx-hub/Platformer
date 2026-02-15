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
  }

  init(data) {
    const settings = Platformer.Settings.current;
    const difficulty = settings.gameplay.difficulty;
    const startLives = difficulty === "easy" ? 3 : (difficulty === "hard" ? 1 : 2);
    const timerSeconds = difficulty === "easy" ? 120 : (difficulty === "hard" ? 70 : 90);
    const carryState = !!(data && data.carryState);

    this.currentLevel = data.level || 1;
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
  }

  create() {
    const { PLAYER, TILE } = Platformer.Config;
    const settings = Platformer.Settings.current;
    const difficulty = settings.gameplay.difficulty;
    const checkpointMode = settings.convenience.checkpointFrequency;

    this.mapRows = Platformer.createLevelData(this.currentLevel || 1);
    this.mapHeight = this.mapRows.length;
    this.mapWidth = this.mapRows[0].length;
    this.normalizeTurretTiles();
    this.normalizeEnemyTiles();

    this.physics.world.gravity.y = PLAYER.gravity;
    this.physics.world.setBounds(0, 0, this.mapWidth * TILE, this.mapHeight * TILE + 180);

    this.createTokyoBackdrop();

    this.solids = this.physics.add.staticGroup();
    this.oneWays = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.coins = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: true, immovable: false });
    this.enemyPatrolSpeed = difficulty === "hard" ? 95 : (difficulty === "easy" ? 48 : 60);
    this.hazardDamage = difficulty === "hard" ? 2 : 1;
    this.hazardCooldownScale = difficulty === "easy" ? 1.35 : (difficulty === "hard" ? 0.8 : 1);
    this.projectileIntervalMs = difficulty === "hard" ? 850 : (difficulty === "easy" ? 1500 : 1100);
    this.projectileSpeed = difficulty === "hard" ? 270 : (difficulty === "easy" ? 180 : 230);
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
          block.refreshBody();
        }

        if (tile === "=") {
          const platform = this.oneWays.create(px + TILE / 2, py + 10, "oneway");
          platform.refreshBody();
        }

        if (tile === "^") {
          const spike = this.hazards.create(px + TILE / 2, py + TILE / 2, "hazard");
          spike.setDisplaySize(TILE, TILE);
          spike.refreshBody();
        }

        if (tile === "C") {
          const coin = this.coins.create(px + TILE / 2, py + TILE / 2, "coin");
          coin.refreshBody();
        }

        if (tile === "E" || tile === "F" || tile === "G" || tile === "H") {
          const enemyType = tile;
          const textureByType = { E: "enemy-e", F: "enemy-f", G: "enemy-g", H: "enemy-h" };
          const speedByType = { E: this.enemyPatrolSpeed, F: this.enemyPatrolSpeed * 0.9, G: this.enemyPatrolSpeed * 1.2, H: this.enemyPatrolSpeed * 0.75 };
          const enemy = this.enemies.create(px + TILE / 2, py + TILE / 2, textureByType[enemyType] || "enemy");
          const patrol = this.computeEnemyPatrolBounds(x, y);
          enemy.body.setSize(24, 24);
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
    if (this.useImportedCharacter) {
      this.player.setDisplaySize(56, 56);
      this.player.body.setSize(22, 44, true);
    } else {
      this.player.setDisplaySize(28, 38);
      this.player.body.setSize(20, 34);
    }
    this.player.setCollideWorldBounds(true);
    // Allow dash velocity to exceed normal run cap.
    this.player.setMaxVelocity(Math.max(PLAYER.maxSpeed, PLAYER.dashSpeed + 60), 700);
    this.player.setDragX(PLAYER.drag);

    this.respawnPoint.copy(this.spawnPoint);
    if (this.spawnCheckpointOnStart) {
      const extraStartCheckpoint = this.checkpoints.create(this.spawnPoint.x + 24, this.spawnPoint.y - 20, "checkpoint");
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
    this.cameras.main.startFollow(this.player, true, smooth, smooth);
    this.cameras.main.setDeadzone(180, 120);
    this.cameras.main.setBackgroundColor("#0b1026");
    this.updateCameraFraming();
    this.scale.on("resize", this.updateCameraFraming, this);
    this.applyVideoSettings();
    this.createPlayerHealthBar();
    this.registry.set("shield", this.shieldCharges);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys(this.buildControlKeyMap());
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
    this.playerHealthBarBg = this.add.rectangle(this.player.x, this.player.y - 34, 38, 7, 0x111827, 0.92)
      .setStrokeStyle(1, 0xe2e8f0, 0.85)
      .setDepth(55);
    this.playerHealthBarFill = this.add.rectangle(this.player.x - 18, this.player.y - 34, 34, 5, 0x22c55e, 1)
      .setOrigin(0, 0.5)
      .setDepth(56);
    this.updatePlayerHealthBar();
  }

  updatePlayerHealthBar() {
    if (!this.player || !this.playerHealthBarBg || !this.playerHealthBarFill) {
      return;
    }

    const health = Phaser.Math.Clamp(this.registry.get("health"), 0, 3);
    const ratio = health / 3;
    const fillWidth = Math.max(0, 34 * ratio);
    const color = ratio > 0.66 ? 0x22c55e : (ratio > 0.33 ? 0xf59e0b : 0xef4444);

    this.playerHealthBarBg.setPosition(this.player.x, this.player.y - 34);
    this.playerHealthBarFill.setPosition(this.player.x - 18, this.player.y - 34);
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

      const inRangeX = Math.abs(shooter.x - this.player.x) < 540;
      const inRangeY = Math.abs(shooter.y - this.player.y) < 260;
      if (!inRangeX || !inRangeY) {
        continue;
      }

      const projectile = this.hazardProjectiles.create(shooter.x, shooter.y - 8, "hazard-projectile");
      projectile.setDepth(70);
      projectile.body.setSize(10, 10);
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
      demoWin: Phaser.Input.Keyboard.KeyCodes.F2,
    };
  }

  applyVideoSettings() {
    const s = Platformer.Settings.current;
    const brightness = Phaser.Math.Clamp(s.video.brightness, 0.8, 1.2);
    const shade = brightness >= 1 ? 0xffffff : 0x000000;
    const alpha = Math.abs(1 - brightness) * 0.45;
    this.brightnessOverlay = this.add.rectangle(
      this.mapWidth * Platformer.Config.TILE / 2,
      this.mapHeight * Platformer.Config.TILE / 2,
      this.mapWidth * Platformer.Config.TILE + 800,
      this.mapHeight * Platformer.Config.TILE + 800,
      shade,
      alpha
    ).setScrollFactor(0).setDepth(200);
  }

  updateCameraFraming() {
    if (!this.cameras || !this.cameras.main) {
      return;
    }
    const s = Platformer.Settings.current;
    const baseZoom = this.scale.height / Platformer.Config.GAME_HEIGHT;
    const resScale = Phaser.Math.Clamp(s.video.resolutionScale / 100, 0.5, 1);
    const zoom = Phaser.Math.Clamp(baseZoom * resScale, 0.75, 3);
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
    const { PLAYER } = Platformer.Config;
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
    this.player.setDragX(Platformer.Config.PLAYER.drag);
    this.player.clearTint();
  }

  tryAttack(now) {
    const { PLAYER } = Platformer.Config;
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
        const power = Phaser.Math.Clamp(impact / 700, 0.08, 0.24);
        const reduce = Platformer.Settings.current.accessibility.reduceScreenShake / 100;
        this.cameras.main.shake(80, power * 0.015 * reduce, true);
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
    this.respawnPoint.set(checkpoint.x, checkpoint.y - 20);
  }

  onHazardHit() {
    this.applyDamage(this.hazardDamage);
  }

  handleEnemyContact(enemy) {
    const { PLAYER } = Platformer.Config;

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
    const { PLAYER } = Platformer.Config;
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
      this.player.setVelocity(-this.player.body.velocity.x * 0.35, -220);
      if (settings.accessibility.reduceScreenShake > 0) {
        this.cameras.main.shake(
          90,
          0.0018 * (settings.accessibility.reduceScreenShake / 100),
          true
        );
      }
    }
  }

  respawn() {
    const a11y = Platformer.Settings.current.accessibility;
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.player.setVelocity(0, 0);
    this.player.setAccelerationX(0);
    this.player.clearTint();
    this.jumpsUsed = 0;
    this.isJumpHeld = false;
    this.isDashing = false;
    this.attackActiveUntil = 0;
    if (!a11y.flashReduction) {
      this.cameras.main.flash(120, 255, 255, 255);
    }
    this.updatePlayerHealthBar();
    this.events.emit("hud-update");
  }

  completeLevel() {
    const a11y = Platformer.Settings.current.accessibility;
    const maxLevels = 4;
    this.levelComplete = true;
    this.player.setAccelerationX(0);
    this.player.setVelocity(0, -140);
    this.player.setTexture("player-run-1");
    this.player.setTint(0xfef08a);
    this.physics.world.pause();
    this.cameras.main.zoomTo(a11y.reducedMotion ? 1.02 : 1.15, a11y.reducedMotion ? 220 : 550, "Quad.easeOut", true);
    if (!a11y.flashReduction) {
      this.cameras.main.flash(200, 255, 255, 255);
    }
    if (this.currentLevel < maxLevels) {
      const nextLevel = this.currentLevel + 1;
      this.game.events.emit("level-transition", { from: this.currentLevel, to: nextLevel });
      this.time.delayedCall(a11y.reducedMotion ? 450 : 900, () => {
        this.scene.restart({ level: nextLevel, carryState: true });
      });
    } else {
      this.game.events.emit("level-complete", {
        level: this.registry.get("level"),
        coins: this.registry.get("coins"),
        targetCoins: Platformer.Config.WIN_COIN_TARGET,
      });
    }
  }

  update() {
    const { PLAYER, WIN_COIN_TARGET } = Platformer.Config;

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
    const jumpHeld = this.cursors.up.isDown || this.cursors.space.isDown || this.keys.jump.isDown;
    const grounded = this.player.body.blocked.down || this.player.body.touching.down;

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

    if (!this.isDashing && canUseCoyote && hasBufferedJump) {
      this.player.setVelocityY(-PLAYER.jumpVelocity);
      this.jumpsUsed = 1;
      this.lastOnGroundTime = -9999;
      this.lastJumpPressedTime = -9999;
      this.isJumpHeld = true;
      Platformer.beeper.jump();
    } else if (!this.isDashing && jumpPressed && this.jumpsUsed < PLAYER.maxJumps) {
      this.player.setVelocityY(-PLAYER.jumpVelocity);
      this.jumpsUsed += 1;
      this.lastJumpPressedTime = -9999;
      this.isJumpHeld = true;
      Platformer.beeper.jump();
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

    if (this.isDashing) {
      const dashDir = this.player.body.velocity.x >= 0 ? 1 : -1;
      this.player.setVelocityX(dashDir * PLAYER.dashSpeed);
      this.player.setAccelerationX(0);
      if (now >= this.dashEndsAt) {
        this.stopDash();
      }
    } else if (moveLeft && !moveRight) {
      this.player.setAccelerationX(-PLAYER.acceleration);
      this.player.setFlipX(false);
      this.facingDir = -1;
    } else if (moveRight && !moveLeft) {
      this.player.setAccelerationX(PLAYER.acceleration);
      this.player.setFlipX(true);
      this.facingDir = 1;
    } else {
      this.player.setAccelerationX(0);
    }
    if (!this.isDashing && now > this.attackActiveUntil) {
      this.player.clearTint();
    }

    if (this.useImportedCharacter) {
      if (!grounded) {
        if (this.player.anims && this.player.anims.isPlaying) {
          this.player.anims.stop();
        }
        if (this.player.texture && this.player.texture.key === "player-idle-sheet") {
          this.player.setFrame(2);
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
    } else if (this.player.body.velocity.y < -25 || !this.player.body.blocked.down) {
      if (this.player.anims && this.player.anims.isPlaying) {
        this.player.anims.stop();
      }
      this.player.setTexture("player-jump");
    } else if (Math.abs(this.player.body.velocity.x) > 35) {
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
    this.scale.off("resize", this.updateCameraFraming, this);
  }
};
