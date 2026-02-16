window.Platformer = window.Platformer || {};

Platformer.WorldMapScene = class extends Phaser.Scene {
  constructor() {
    super("WorldMapScene");
    this.mapData = null;
    this.progress = null;
    this.mapRoot = null;
    this.avatar = null;
    this.controller = null;
    this.nodes = [];
    this.selectedNode = null;
    this.ui = null;
    this.keys = null;
    this.onResize = null;
    this.lastSaveAt = 0;
    this.lastInteractDown = false;
    this.lastHelpDown = false;
    this.focusNodeId = null;
    this.lastViewportW = 0;
    this.lastViewportH = 0;
    this.pendingRelayoutCall = null;
    this.useDataDrivenWorld = false;
    this.worldView = null;
    this.activeWorld = null;
    this.pendingWorldLoad = null;
    this.worldNodeById = {};
    this.worldGraph = {};
    this.currentNodeId = null;
    this.pendingTargetNodeId = null;
    this.travelState = null;
    this.prevInput = { left: false, right: false, up: false, down: false, interact: false };
    this.autoWalkConsumed = {};
    this.worldState = null;
    this.shopPanel = null;
    this.onSettingsChanged = null;
  }

  init(data) {
    this.focusNodeId = data && data.focusNodeId ? String(data.focusNodeId) : null;
  }

  create() {
    this.onSettingsChanged = (nextSettings) => this.applyRuntimeSettings(nextSettings);
    this.game.events.on("settings-changed", this.onSettingsChanged);
    if (!Platformer.DEBUG_WORLD_MAP) {
      this.useDataDrivenWorld = true;
      this.createDataDrivenWorldStatic();
      return;
    }

    this.mapData = Platformer.WorldMapData;
    this.progress = Platformer.Progress;
    this.progress.ensureLoaded();

    this.mapRoot = this.add.container(0, 0).setDepth(10);
    this.drawBackground();
    this.drawPathsAndBlockedRegions();
    this.createNodes();
    this.createAvatar();
    this.ui = new Platformer.WorldMapUI(this);

    this.keys = this.buildInputMap();
    this.input.keyboard.on("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.keyboard.on("keydown-H", () => this.ui.toggleHelp());

    this.onResize = () => this.handleResize();
    this.scale.on("resize", this.onResize);
    this.handleResize();

    if (Platformer.Debug) {
      const unlocked = Object.keys(this.progress.ensureLoaded().unlockedNodes || {}).length;
      Platformer.Debug.log("WorldMap", `Loaded map=${this.mapData.id} nodes=${this.nodes.length} unlocked=${unlocked}`);
    }
  }

  createDataDrivenWorldStatic() {
    this.progress = Platformer.Progress;
    this.progress.ensureLoaded();
    this.keys = this.buildInputMap();
    this.shopPanel = new Platformer.WorldMapShopPanel(this);
    this.ensureWorldMapMusic();
    this.time.delayedCall(1300, () => {
      if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
      const phaserPlaying = !!(this.sound && this.sound.get("menu-bgm") && this.sound.get("menu-bgm").isPlaying);
      const htmlPlaying = !!(Platformer.menuMusicHtml && !Platformer.menuMusicHtml.paused);
      if (!phaserPlaying && !htmlPlaying && Platformer.Debug) {
        Platformer.Debug.warn("WorldMap.audio", "No world-map music is currently playing after startup.");
      }
    });

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.shopPanel && this.shopPanel.visible) {
        this.shopPanel.close();
        this.refreshTraversalUi();
        return;
      }
      this.scene.start("MenuScene");
    });
    this.onResize = () => this.handleResize();
    this.scale.on("resize", this.onResize);

    this.pendingWorldLoad = Platformer.WorldMapManager.loadWorld("world_tutorial")
      .then((world) => {
        if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
        this.activeWorld = world;
        this.worldState = this.progress.ensureWorldState(world);
        this.applyWorldProgressToNodes();
        this.worldView = new Platformer.WorldMapView(this, world);
        this.worldView.render();
        this.buildWorldGraph();
        this.initWorldTraversalState();
        this.handleResize();
      })
      .catch((err) => {
        if (Platformer.Debug) {
          Platformer.Debug.error("WorldMapScene.createDataDrivenWorldStatic", err && err.stack ? err.stack : String(err));
        }
      })
      .finally(() => {
        this.pendingWorldLoad = null;
      });
  }

  applyWorldProgressToNodes() {
    if (!this.activeWorld || !Array.isArray(this.activeWorld.nodes) || !this.progress) return;
    const ws = this.progress.ensureWorldState(this.activeWorld);
    this.worldState = ws;
    this.activeWorld.nodes.forEach((node) => {
      if (!node || !node.id) return;
      const id = String(node.id);
      const unlocked = !!ws.unlockedNodes[id];
      const completed = !!ws.completedNodes[id];
      node.state = completed ? "completed" : (unlocked ? "unlocked" : "locked");
    });
  }

  buildWorldGraph() {
    this.worldNodeById = {};
    this.worldGraph = {};
    const nodes = Array.isArray(this.activeWorld && this.activeWorld.nodes) ? this.activeWorld.nodes : [];
    const edges = Array.isArray(this.activeWorld && this.activeWorld.edges) ? this.activeWorld.edges : [];
    nodes.forEach((n) => {
      if (!n || !n.id || !n.pos) return;
      this.worldNodeById[n.id] = n;
      this.worldGraph[n.id] = this.worldGraph[n.id] || [];
    });
    edges.forEach((e) => {
      if (!e || !e.from || !e.to) return;
      if (!this.worldNodeById[e.from] || !this.worldNodeById[e.to]) return;
      this.worldGraph[e.from] = this.worldGraph[e.from] || [];
      this.worldGraph[e.to] = this.worldGraph[e.to] || [];
      if (!this.worldGraph[e.from].includes(e.to)) this.worldGraph[e.from].push(e.to);
      if (!this.worldGraph[e.to].includes(e.from)) this.worldGraph[e.to].push(e.from);
    });
  }

  initWorldTraversalState() {
    const startId = (this.activeWorld && this.activeWorld.startNodeId) || null;
    this.currentNodeId = this.resolveInitialNodeId(startId);
    this.pendingTargetNodeId = null;
    this.travelState = null;
    this.autoWalkConsumed = {};

    const node = this.worldNodeById[this.currentNodeId];
    if (node && this.worldView) {
      this.worldView.createAvatar();
      this.worldView.setAvatarPosition(node.pos.x - 26, node.pos.y);
      this.worldView.selectNode(node.id);
      this.refreshTraversalUi();
    }
  }

  resolveInitialNodeId(defaultId) {
    if (this.focusNodeId && this.worldNodeById[this.focusNodeId]) return this.focusNodeId;
    const ws = this.progress.ensureWorldState(this.activeWorld);
    if (ws && ws.lastSelectedNodeId && this.worldNodeById[ws.lastSelectedNodeId]) return ws.lastSelectedNodeId;
    if (defaultId && this.worldNodeById[defaultId]) return defaultId;
    const keys = Object.keys(this.worldNodeById);
    return keys.length ? keys[0] : null;
  }

  getConnectedNodeIds(nodeId) {
    return (this.worldGraph[nodeId] || []).filter((id) => !!this.worldNodeById[id]);
  }

  isCurrentWorldNodeUnlocked(nodeId) {
    if (!this.activeWorld || !this.progress) return false;
    return this.progress.isWorldNodeUnlocked(this.activeWorld, nodeId);
  }

  chooseDirectionalNeighbor(fromId, dirX, dirY) {
    const from = this.worldNodeById[fromId];
    if (!from) return null;
    const candidates = this.getConnectedNodeIds(fromId).filter((id) => this.isCurrentWorldNodeUnlocked(id));
    if (!candidates.length) return null;

    let bestId = null;
    let bestScore = -Infinity;
    candidates.forEach((id) => {
      const to = this.worldNodeById[id];
      if (!to) return;
      const vx = to.pos.x - from.pos.x;
      const vy = to.pos.y - from.pos.y;
      const mag = Math.sqrt(vx * vx + vy * vy);
      if (mag < 0.001) return;
      const nx = vx / mag;
      const ny = vy / mag;
      const dot = nx * dirX + ny * dirY;
      if (dot <= 0.15) return;
      const score = dot * 1000 - mag;
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    });
    return bestId;
  }

  startTravelTo(targetNodeId, autoWalk = false) {
    if (!this.currentNodeId || !targetNodeId || this.currentNodeId === targetNodeId) return false;
    if (!this.isCurrentWorldNodeUnlocked(targetNodeId)) return false;
    const from = this.worldNodeById[this.currentNodeId];
    const to = this.worldNodeById[targetNodeId];
    if (!from || !to) return false;
    const dx = to.pos.x - from.pos.x;
    const dy = to.pos.y - from.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return false;

    this.travelState = {
      fromId: this.currentNodeId,
      toId: targetNodeId,
      x: from.pos.x - 26,
      y: from.pos.y,
      startX: from.pos.x - 26,
      startY: from.pos.y,
      endX: to.pos.x - 26,
      endY: to.pos.y,
      dist,
      traveled: 0,
      speed: autoWalk ? 92 : 170,
      autoWalk: !!autoWalk,
    };
    this.pendingTargetNodeId = targetNodeId;
    return true;
  }

  updateTravel(deltaMs) {
    if (!this.travelState || !this.worldView) return;
    const dt = Math.max(0.001, Number(deltaMs || 16) / 1000);
    const t = this.travelState;
    const step = Math.min(t.dist - t.traveled, t.speed * dt);
    t.traveled += step;
    const p = Phaser.Math.Clamp(t.traveled / Math.max(1, t.dist), 0, 1);
    const x = Phaser.Math.Linear(t.startX, t.endX, p);
    const y = Phaser.Math.Linear(t.startY, t.endY, p);
    this.worldView.setAvatarPosition(x, y);
    this.worldView.setAvatarFacing(t.endX - t.startX);
    this.worldView.setAvatarMoving(true, this.time.now);

    if (p >= 1) {
      this.currentNodeId = t.toId;
      this.travelState = null;
      this.pendingTargetNodeId = null;
      this.onArriveNode(this.currentNodeId);
    }
  }

  onArriveNode(nodeId) {
    const node = this.worldNodeById[nodeId];
    if (!node || !this.worldView) return;
    this.worldView.setAvatarMoving(false, this.time.now);
    this.worldView.selectNode(nodeId);
    this.progress.setWorldSelectedNode(this.activeWorld, nodeId);
    this.refreshTraversalUi();
  }

  refreshTraversalUi() {
    if (!this.worldView || !this.currentNodeId) return;
    const node = this.worldNodeById[this.currentNodeId];
    if (!node) return;
    this.applyWorldProgressToNodes();
    if (this.worldView) {
      this.activeWorld.nodes.forEach((n) => {
        this.worldView.setNodeState(n.id, n.state);
      });
    }
    this.worldView.selectNode(node.id);
    const options = this.getConnectedNodeIds(node.id).filter((id) => this.isCurrentWorldNodeUnlocked(id));
    this.worldView.setAvailableNodes(options, this.pendingTargetNodeId);

    const title = node.ui && node.ui.title ? node.ui.title : node.id;
    const hint = node.ui && node.ui.hint ? node.ui.hint : "Press Enter/E to confirm";
    const nodeUnlocked = this.isCurrentWorldNodeUnlocked(node.id);
    const prompt = this.pendingTargetNodeId
      ? `Traveling to ${this.pendingTargetNodeId}...`
      : (nodeUnlocked
        ? (String(node.type || "") === "shop" ? "Move: WASD/Arrows  Confirm: E/Enter (Shop)" : "Move: WASD/Arrows  Confirm: E/Enter")
        : "Locked node.");
    const best = this.progress.getWorldNodeBest(this.activeWorld, node.id);
    this.worldView.infoTitle.setText(`${title} (${node.id})`);
    this.worldView.infoBody.setText([
      `Type: ${String(node.type || "level")}`,
      `State: ${String(node.state || "locked")}`,
      `Best Coins: ${best ? Number(best.bestCoins || 0) : 0}`,
      `Best Time Left: ${best ? Number(best.bestTimeLeft || 0) : 0}s`,
      "",
      hint,
    ].join("\n"));
    this.worldView.reflowInfoPanel();
    this.worldView.setPrompt(prompt);

    const edgeCount = Array.isArray(this.activeWorld && this.activeWorld.edges) ? this.activeWorld.edges.length : 0;
    const unlockedCount = this.activeWorld.nodes.filter((n) => this.isCurrentWorldNodeUnlocked(n.id)).length;
    this.worldView.setDebug(`World: ${this.activeWorld.id} | Node: ${node.id} | Next: ${options.length} | Unlocked: ${unlockedCount}/${this.activeWorld.nodes.length} | Edges: ${edgeCount}`);
  }

  tryStartAutoWalk() {
    if (!this.currentNodeId || this.travelState) return;
    const node = this.worldNodeById[this.currentNodeId];
    if (!node || !node.autoWalkTo) return;
    if (this.autoWalkConsumed[node.id]) return;
    if (!this.worldNodeById[node.autoWalkTo]) return;
    if (!this.isCurrentWorldNodeUnlocked(node.autoWalkTo)) return;
    this.autoWalkConsumed[node.id] = true;
    this.startTravelTo(node.autoWalkTo, true);
    this.refreshTraversalUi();
  }

  drawBackground() {
    const { w, h } = this.getViewportSize();
    this.bgSky = this.add.rectangle(0, 0, w, h, 0x071638, 1).setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.bgStrip1 = this.add.rectangle(0, h * 0.15, w, h * 0.18, 0x122b63, 0.5).setOrigin(0, 0).setDepth(1).setScrollFactor(0);
    this.bgStrip2 = this.add.rectangle(0, h * 0.62, w, h * 0.22, 0x173c84, 0.48).setOrigin(0, 0).setDepth(1).setScrollFactor(0);
    this.grid = this.add.graphics().setDepth(2).setScrollFactor(0);
    this.redrawGrid();

    this.particles = this.add.particles(0, 0, this.textureOr("coin", "__WHITE"), {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      lifespan: { min: 2500, max: 5000 },
      speedY: { min: -18, max: -5 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.08, end: 0 },
      alpha: { start: 0.3, end: 0 },
      frequency: 130,
      quantity: 1,
    }).setDepth(3).setScrollFactor(0);
  }

  redrawGrid() {
    if (!this.grid) return;
    const { w, h } = this.getViewportSize();
    this.grid.clear();
    this.grid.lineStyle(1, 0x38bdf8, 0.08);
    for (let x = 0; x < w; x += 64) {
      this.grid.beginPath();
      this.grid.moveTo(x, 0);
      this.grid.lineTo(x, h);
      this.grid.strokePath();
    }
    for (let y = 0; y < h; y += 64) {
      this.grid.beginPath();
      this.grid.moveTo(0, y);
      this.grid.lineTo(w, y);
      this.grid.strokePath();
    }
  }

  drawPathsAndBlockedRegions() {
    const g = this.add.graphics().setDepth(10);
    g.lineStyle(8, 0x0f2f63, 0.95);
    this.mapData.nodes.forEach((node) => {
      (node.next || []).forEach((nextId) => {
        const next = this.mapData.getNodeById(nextId);
        if (!next) return;
        g.beginPath();
        g.moveTo(node.x, node.y);
        g.lineTo(next.x, next.y);
        g.strokePath();
      });
    });
    g.lineStyle(3, 0x67e8f9, 0.88);
    this.mapData.nodes.forEach((node) => {
      (node.next || []).forEach((nextId) => {
        const next = this.mapData.getNodeById(nextId);
        if (!next) return;
        g.beginPath();
        g.moveTo(node.x, node.y);
        g.lineTo(next.x, next.y);
        g.strokePath();
      });
    });

    this.mapRoot.add(g);
    this.blockedVisuals = this.mapData.blockedRegions.map((r) => {
      const rect = this.add.rectangle(r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, 0x0f172a, 0.62)
        .setStrokeStyle(2, 0x334155, 0.9)
        .setDepth(11);
      const label = this.add.text(rect.x, rect.y, r.label || "blocked", {
        fontFamily: "Consolas",
        fontSize: "14px",
        color: "#94a3b8",
      }).setOrigin(0.5).setDepth(12);
      this.mapRoot.add([rect, label]);
      return { rect, label };
    });
  }

  createNodes() {
    this.nodes = this.mapData.nodes.map((n) => new Platformer.LevelNode(this, n, this.progress, this.mapRoot));
    this.refreshNodeUnlocks();
  }

  createAvatar() {
    const spawn = this.computeSpawnPoint();
    this.avatar = this.add.sprite(spawn.x, spawn.y, this.textureOr("player-run-1", "player-idle-1")).setDepth(30);
    this.avatar.setDisplaySize(42, 56);
    this.mapRoot.add(this.avatar);
    this.controller = new Platformer.PlayerMapController(
      this,
      this.avatar,
      this.mapData.bounds,
      this.mapData.blockedRegions
    );
  }

  computeSpawnPoint() {
    const d = this.progress.ensureLoaded();
    if (this.focusNodeId) {
      const node = this.mapData.getNodeById(this.focusNodeId);
      if (node) return { x: node.x - 26, y: node.y };
    }
    if (d.lastMapPosition) {
      return {
        x: Phaser.Math.Clamp(d.lastMapPosition.x, this.mapData.bounds.x + 18, this.mapData.bounds.x + this.mapData.bounds.width - 18),
        y: Phaser.Math.Clamp(d.lastMapPosition.y, this.mapData.bounds.y + 18, this.mapData.bounds.y + this.mapData.bounds.height - 18),
      };
    }
    if (d.lastSelectedNodeId) {
      const node = this.mapData.getNodeById(d.lastSelectedNodeId);
      if (node) return { x: node.x - 26, y: node.y };
    }
    return { x: this.mapData.spawn.x, y: this.mapData.spawn.y };
  }

  buildInputMap() {
    const controls = Platformer.Settings.current.controls || {};
    const key = (name, fallback) => {
      const code = String(controls[name] || fallback || "").toUpperCase();
      return this.input.keyboard.addKey(code);
    };
    return {
      left: key("left", "A"),
      right: key("right", "D"),
      up: key("jump", "W"),
      down: this.input.keyboard.addKey("S"),
      interact: key("interact", "E"),
      enter: this.input.keyboard.addKey("ENTER"),
      arrows: this.input.keyboard.createCursorKeys(),
    };
  }

  getInputState() {
    const k = this.keys;
    return {
      left: (k.left && k.left.isDown) || (k.arrows && k.arrows.left.isDown),
      right: (k.right && k.right.isDown) || (k.arrows && k.arrows.right.isDown),
      up: (k.up && k.up.isDown) || (k.arrows && k.arrows.up.isDown),
      down: (k.down && k.down.isDown) || (k.arrows && k.arrows.down.isDown),
      interact: (k.interact && k.interact.isDown) || (k.enter && k.enter.isDown),
    };
  }

  refreshNodeUnlocks() {
    this.nodes.forEach((n) => n.refreshUnlock());
  }

  update(_time, delta) {
    if (this.useDataDrivenWorld) {
      if (this.worldView && typeof this.worldView.updateAmbient === "function") {
        this.worldView.updateAmbient(_time, delta);
      }
      const vp = this.getViewportSize();
      if (vp.w !== this.lastViewportW || vp.h !== this.lastViewportH) {
        this.handleResize(vp.w, vp.h);
      }
      if (this.travelState) {
        this.updateTravel(delta);
        return;
      }
      this.handleDataDrivenInput();
      return;
    }
    if (!this.controller || !this.avatar) return;
    const vp = this.getViewportSize();
    if (vp.w !== this.lastViewportW || vp.h !== this.lastViewportH) {
      this.handleResize(vp.w, vp.h);
    }
    const input = this.getInputState();
    const motion = this.controller.update(input, delta);

    if (motion.moving) {
      const frame = Math.floor(this.time.now / 120) % 2 === 0 ? "player-run-1" : "player-run-2";
      this.avatar.setTexture(this.textureOr(frame, "player-idle-1"));
    } else {
      this.avatar.setTexture(this.textureOr("player-idle-1", "player-run-1"));
    }

    this.updateSelectedNode();
    this.updateInteraction(input.interact);
    this.updateSaveTick();
  }

  updateSelectedNode() {
    let nearest = null;
    let nearestDist = Infinity;
    this.nodes.forEach((node) => {
      const dx = this.avatar.x - node.data.x;
      const dy = this.avatar.y - node.data.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inRange = dist <= node.radius;
      node.setSelected(inRange);
      if (inRange && dist < nearestDist) {
        nearest = node;
        nearestDist = dist;
      }
    });

    this.selectedNode = nearest;
    const d = this.progress.ensureLoaded();
    const best = nearest ? d.bestByNode[nearest.id] : null;
    const tutorialHint = nearest && !this.progress.hasSeenTutorial(nearest.id)
      ? `Tip: ${nearest.data.tutorial || "No tutorial text."}`
      : "";
    this.ui.updateNodeInfo(
      nearest ? nearest.data : null,
      best,
      nearest ? nearest.unlocked : false,
      !!nearest,
      tutorialHint
    );

    const unlockedCount = Object.keys(d.unlockedNodes || {}).filter((k) => d.unlockedNodes[k]).length;
    this.ui.setDebug(`Selected: ${nearest ? nearest.id : "none"} | Unlocked: ${unlockedCount}/${this.nodes.length}`);
  }

  updateInteraction(interactDown) {
    const pressed = interactDown && !this.lastInteractDown;
    this.lastInteractDown = interactDown;
    if (!pressed || !this.selectedNode) return;

    const node = this.selectedNode;
    if (!node.unlocked) {
      Platformer.beeper.damage();
      return;
    }

    this.progress.data.lastSelectedNodeId = node.id;
    this.progress.save();
    if (!this.progress.hasSeenTutorial(node.id)) {
      this.progress.markTutorialSeen(node.id);
      if (Platformer.Debug) Platformer.Debug.log("WorldMap", `First-time hint consumed for ${node.id}`);
    }
    this.progress.updateMapPosition({ x: this.avatar.x, y: this.avatar.y });

    this.launchLevel(node.data);
  }

  launchLevel(nodeData) {
    if (!nodeData) return;
    const levelNum = this.resolveNodeGameLevel(nodeData);
    if (Platformer.Debug) Platformer.Debug.log("WorldMap", `Entering ${nodeData.id} -> level=${levelNum}`);
    this.stopWorldMapMusic();

    const difficulty = Platformer.Settings.current.gameplay.difficulty;
    const baseLives = difficulty === "easy" ? 3 : (difficulty === "hard" ? 1 : 2);
    this.registry.set("coins", 0);
    this.registry.set("health", 3);
    this.registry.set("lives", baseLives);
    this.registry.set("level", levelNum);

    if (this.scene.isActive("UIScene") || this.scene.isPaused("UIScene")) {
      this.scene.stop("UIScene");
    }

    this.scene.start("GameScene", {
      level: levelNum,
      nodeId: nodeData.id,
      worldId: this.activeWorld && this.activeWorld.id ? this.activeWorld.id : null,
      fromWorldMap: true,
    });
    this.scene.launch("UIScene");
  }

  resolveNodeGameLevel(nodeData) {
    if (!nodeData) return 1;
    if (Number.isFinite(Number(nodeData.gameLevel))) return Number(nodeData.gameLevel);
    if (nodeData.levelRef && Platformer.WorldMapManager && typeof Platformer.WorldMapManager.resolveGameLevelRef === "function") {
      return Platformer.WorldMapManager.resolveGameLevelRef(nodeData.levelRef);
    }
    return 1;
  }

  ensureWorldMapMusic() {
    try {
      const audioSettings = Platformer.Settings.current.audio;
      const volume = Phaser.Math.Clamp((audioSettings.master / 100) * (audioSettings.music / 100), 0, 1);
      if (Platformer.Debug) {
        Platformer.Debug.log(
          "WorldMap.audio",
          `Ensuring map BGM master=${audioSettings.master} music=${audioSettings.music} volume=${volume.toFixed(2)} muted=${this.sound && this.sound.mute ? "yes" : "no"} hidden=${document.hidden ? "yes" : "no"}`
        );
        if (volume <= 0.001) {
          Platformer.Debug.warn("WorldMap.audio", "Effective music volume is 0. Increase Master/Music volume in Options.");
        }
      }

      if (Platformer.gameMusic) {
        try {
          if (Platformer.gameMusic.isPlaying) Platformer.gameMusic.stop();
        } catch (_e) {}
        Platformer.gameMusic = null;
      }
      if (Platformer.gameMusicHtml) {
        try {
          Platformer.gameMusicHtml.pause();
          Platformer.gameMusicHtml.currentTime = 0;
        } catch (_e) {}
        Platformer.gameMusicHtml = null;
      }

      const tryPlayMenuBgm = () => {
        let music = this.sound.get("menu-bgm");
        if (!music) {
          try {
            music = this.sound.add("menu-bgm", { loop: true, volume });
            if (Platformer.Debug) Platformer.Debug.log("WorldMap.audio", "Created menu-bgm sound instance.");
          } catch (err) {
            if (Platformer.Debug) Platformer.Debug.warn("WorldMap.audio", `menu-bgm add failed: ${err && err.message ? err.message : err}`);
            return false;
          }
        }
        Platformer.menuMusic = music;
        music.setLoop(true);
        music.setVolume(volume);
        if (!music.isPlaying) {
          try {
            if (this.sound && this.sound.context && this.sound.context.state === "suspended") {
              this.sound.context.resume().catch(() => {});
              if (Platformer.Debug) Platformer.Debug.warn("WorldMap.audio", "WebAudio context suspended; resume requested.");
            }
            music.play();
            if (Platformer.Debug) Platformer.Debug.log("WorldMap.audio", "Playing menu-bgm (Phaser).");
          } catch (err) {
            if (Platformer.Debug) Platformer.Debug.warn("WorldMap.audio", `menu-bgm play blocked: ${err && err.message ? err.message : err}`);
            return false;
          }
        } else if (Platformer.Debug) {
          Platformer.Debug.log("WorldMap.audio", "menu-bgm already playing.");
        }
        return true;
      };

      if (this.cache && this.cache.audio && this.cache.audio.exists("menu-bgm")) {
        if (tryPlayMenuBgm()) return;
      }
      if (Platformer.Debug) Platformer.Debug.warn("WorldMap.audio", "menu-bgm not found in cache; using HTML fallback.");
      this.playWorldMapHtmlMusic(volume, audioSettings);
    } catch (err) {
      if (Platformer.Debug) Platformer.Debug.error("WorldMap.audio", err && err.stack ? err.stack : String(err));
    }
  }

  applyRuntimeSettings(nextSettings) {
    try {
      const settings = nextSettings || Platformer.Settings.current || {};
      const audio = settings.audio || { master: 80, music: 60, muteWhenUnfocused: false };
      const volume = Phaser.Math.Clamp((Number(audio.master) / 100) * (Number(audio.music) / 100), 0, 1);

      if (Platformer.menuMusic && typeof Platformer.menuMusic.setVolume === "function") {
        Platformer.menuMusic.setVolume(volume);
      }
      if (Platformer.menuMusicHtml) {
        Platformer.menuMusicHtml.volume = volume;
      }
      if (audio.muteWhenUnfocused && document.hidden) {
        if (Platformer.menuMusicHtml && !Platformer.menuMusicHtml.paused) {
          Platformer.menuMusicHtml.pause();
        }
      }
      this.keys = this.buildInputMap();
      if (Platformer.Debug) {
        Platformer.Debug.log("WorldMap.settings", `Applied runtime settings: mapVolume=${volume.toFixed(2)}`);
      }
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.error("WorldMap.settings", err && err.stack ? err.stack : String(err));
      }
    }
  }

  playWorldMapHtmlMusic(volume, audioSettings) {
    try {
      if (!Platformer.menuMusicHtml) {
        Platformer.menuMusicHtml = new Audio("assets/nickpanek-energetic-chiptune-video-game-music-platformer-8-bit-318348.mp3");
      }
      const music = Platformer.menuMusicHtml;
      music.loop = true;
      music.volume = Phaser.Math.Clamp(volume, 0, 1);
      music.onerror = (e) => {
        if (Platformer.Debug) Platformer.Debug.error("WorldMap.audio", `HTML audio error: ${e && e.message ? e.message : "unknown error"}`);
      };
      const tryPlay = () => {
        if (audioSettings && audioSettings.muteWhenUnfocused && document.hidden) return;
        music.play().then(() => {
          if (Platformer.Debug) Platformer.Debug.log("WorldMap.audio", "Playing menu-bgm (HTML fallback).");
        }).catch((e) => {
          if (Platformer.Debug) Platformer.Debug.warn("WorldMap.audio", `HTML play blocked: ${e && e.message ? e.message : e}`);
        });
      };
      this.input.once("pointerdown", tryPlay);
      this.input.keyboard.once("keydown", tryPlay);
      tryPlay();
    } catch (err) {
      if (Platformer.Debug) Platformer.Debug.error("WorldMap.audio", `HTML fallback failed: ${err && err.message ? err.message : err}`);
    }
  }

  stopWorldMapMusic() {
    try {
      this.sound.stopByKey("menu-bgm");
      if (Platformer.menuMusic) {
        try {
          if (Platformer.menuMusic.isPlaying) Platformer.menuMusic.stop();
        } catch (_e) {}
        Platformer.menuMusic = null;
      }
      if (Platformer.menuMusicHtml) {
        Platformer.menuMusicHtml.pause();
        Platformer.menuMusicHtml.currentTime = 0;
        Platformer.menuMusicHtml = null;
      }
      if (Platformer.Debug) Platformer.Debug.log("WorldMap.audio", "Stopped world-map/menu music.");
    } catch (err) {
      if (Platformer.Debug) Platformer.Debug.warn("WorldMap.audio", `Stop failed: ${err && err.message ? err.message : err}`);
    }
  }

  updateSaveTick() {
    if (!this.progress || !this.avatar) return;
    if (this.time.now - this.lastSaveAt < 900) return;
    this.lastSaveAt = this.time.now;
    this.progress.updateMapPosition({ x: this.avatar.x, y: this.avatar.y });
  }

  handleDataDrivenInput() {
    if (!this.keys || !this.currentNodeId || !this.worldView) return;
    const input = this.getInputState();
    const just = {
      left: input.left && !this.prevInput.left,
      right: input.right && !this.prevInput.right,
      up: input.up && !this.prevInput.up,
      down: input.down && !this.prevInput.down,
      interact: input.interact && !this.prevInput.interact,
    };
    this.prevInput = input;

    if (this.shopPanel && this.shopPanel.visible) {
      this.shopPanel.handleInput(just);
      return;
    }

    let direction = null;
    if (just.left) direction = { x: -1, y: 0 };
    else if (just.right) direction = { x: 1, y: 0 };
    else if (just.up) direction = { x: 0, y: -1 };
    else if (just.down) direction = { x: 0, y: 1 };

    if (direction) {
      const candidate = this.chooseDirectionalNeighbor(this.currentNodeId, direction.x, direction.y);
      if (candidate) {
        this.pendingTargetNodeId = candidate;
        this.startTravelTo(candidate, false);
      } else if (Platformer.Debug) {
        Platformer.Debug.log("WorldMap.unlock", `Blocked move from ${this.currentNodeId}: no unlocked neighbor in direction (${direction.x},${direction.y}).`);
      }
      this.refreshTraversalUi();
      return;
    }

    if (just.interact) {
      const node = this.worldNodeById[this.currentNodeId];
      if (!node) return;
      if (!this.isCurrentWorldNodeUnlocked(node.id)) {
        Platformer.beeper.damage();
        return;
      }
      if (!this.progress.hasSeenWorldTutorial(this.activeWorld, node.id)) {
        this.progress.markWorldTutorialSeen(this.activeWorld, node.id);
      }
      if (String(node.type || "") === "shop" || !!node.shopRef) {
        this.openShopForNode(node);
        return;
      }
      if (node.levelRef || Number.isFinite(Number(node.gameLevel))) {
        this.launchLevel(node);
        return;
      }
      Platformer.beeper.coin();
    }
  }

  handleResize(inW, inH) {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
    const vp = this.getViewportSize();
    const w = Number(inW) || vp.w;
    const h = Number(inH) || vp.h;
    this.lastViewportW = w;
    this.lastViewportH = h;
    if (this.useDataDrivenWorld) {
      if (this.worldView) this.worldView.resize();
      if (this.shopPanel) this.shopPanel.resize();
      return;
    }
    const safeRectSizePos = (obj, width, height, x, y) => {
      if (!obj || !obj.active || !obj.scene) return;
      obj.setSize(width, height).setPosition(x, y);
    };
    safeRectSizePos(this.bgSky, w, h, 0, 0);
    safeRectSizePos(this.bgStrip1, w, h * 0.18, 0, h * 0.15);
    safeRectSizePos(this.bgStrip2, w, h * 0.22, 0, h * 0.62);
    this.redrawGrid();
    if (this.particles) {
      this.particles.setConfig({
        x: { min: 0, max: w },
        y: { min: 0, max: h },
      });
    }
    if (this.ui) this.ui.resize();
    this.layoutMapRootToViewport();
    if (this.pendingRelayoutCall) {
      this.pendingRelayoutCall.remove(false);
      this.pendingRelayoutCall = null;
    }
    if (this.time && this.sys && this.sys.settings && this.sys.settings.active) {
      this.pendingRelayoutCall = this.time.delayedCall(40, () => {
        this.pendingRelayoutCall = null;
        if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
        this.layoutMapRootToViewport();
      });
    }
  }

  layoutMapRootToViewport() {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
    if (!this.mapRoot || !this.mapRoot.active || !this.mapData || !this.mapData.bounds) return;
    const { w, h } = this.getViewportSize();
    const b = this.mapData.bounds;
    const margin = Math.max(24, Math.round(Math.min(w, h) * 0.04));
    const sx = (w - margin * 2) / Math.max(1, b.width);
    const sy = (h - margin * 2) / Math.max(1, b.height);
    const scale = Phaser.Math.Clamp(Math.min(sx, sy), 0.35, 2.2);
    const fittedW = b.width * scale;
    const fittedH = b.height * scale;
    const offsetX = (w - fittedW) * 0.5 - b.x * scale;
    const offsetY = (h - fittedH) * 0.5 - b.y * scale;

    this.mapRoot.setScale(scale);
    this.mapRoot.setPosition(offsetX, offsetY);

    const cam = this.cameras && this.cameras.main;
    if (cam) {
      cam.setViewport(0, 0, w, h);
      cam.setZoom(1);
      cam.scrollX = 0;
      cam.scrollY = 0;
      cam.roundPixels = true;
    }
  }

  getViewportSize() {
    const gs = this.scale && this.scale.gameSize ? this.scale.gameSize : null;
    const bs = this.scale && this.scale.baseSize ? this.scale.baseSize : null;
    const w = (gs && gs.width) || (bs && bs.width) || this.scale.width || 960;
    const h = (gs && gs.height) || (bs && bs.height) || this.scale.height || 540;
    return { w: Math.max(640, Math.round(w)), h: Math.max(360, Math.round(h)) };
  }

  openShopForNode(node) {
    const worldId = this.activeWorld && this.activeWorld.id ? this.activeWorld.id : "world_tutorial";
    const shopRef = node && node.shopRef ? String(node.shopRef) : null;
    if (!shopRef) {
      if (Platformer.Debug) Platformer.Debug.warn("WorldMap.shop", `Node ${node && node.id ? node.id : "unknown"} has no shopRef.`);
      Platformer.beeper.damage();
      return;
    }
    Platformer.WorldMapManager.loadShop(worldId, shopRef)
      .then((shop) => {
        if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
        if (!this.shopPanel) return;
        this.shopPanel.open(shop, () => {
          this.refreshTraversalUi();
        });
      })
      .catch((err) => {
        if (Platformer.Debug) Platformer.Debug.error("WorldMap.shop", err && err.stack ? err.stack : String(err));
        Platformer.beeper.damage();
      });
  }

  textureOr(key, fallback) {
    if (key && this.textures.exists(key)) return key;
    if (fallback && this.textures.exists(fallback)) return fallback;
    return "__WHITE";
  }

  shutdown() {
    if (this.onSettingsChanged) {
      this.game.events.off("settings-changed", this.onSettingsChanged);
      this.onSettingsChanged = null;
    }
    if (!this.scene.isActive("GameScene")) {
      this.stopWorldMapMusic();
    }
    if (this.pendingWorldLoad && typeof this.pendingWorldLoad.cancel === "function") {
      this.pendingWorldLoad.cancel();
    }
    this.pendingWorldLoad = null;
    if (this.pendingRelayoutCall) {
      this.pendingRelayoutCall.remove(false);
      this.pendingRelayoutCall = null;
    }
    if (this.onResize) {
      this.scale.off("resize", this.onResize);
      this.onResize = null;
    }
    if (this.ui) {
      this.ui.destroy();
      this.ui = null;
    }
    if (this.worldView) {
      this.worldView.destroy();
      this.worldView = null;
    }
    if (this.shopPanel) {
      this.shopPanel.destroy();
      this.shopPanel = null;
    }
    this.worldNodeById = {};
    this.worldGraph = {};
    this.currentNodeId = null;
    this.pendingTargetNodeId = null;
    this.travelState = null;
    this.nodes.forEach((n) => n.destroy());
    this.nodes = [];
    if (this.particles) {
      this.particles.destroy();
      this.particles = null;
    }
    if (this.mapRoot) {
      this.mapRoot.destroy(true);
      this.mapRoot = null;
    }
  }
};
