window.Platformer = window.Platformer || {};

Platformer.Progress = {
  key: "anime_platformer_progress_v1",
  data: null,

  defaultData() {
    return {
      unlockedNodes: { Level_01: true },
      completedNodes: {},
      bestByNode: {},
      tutorialSeenByNode: {},
      lastSelectedNodeId: "Level_01",
      lastMapPosition: null,
      lastCompletedNodeId: null,
      worlds: {},
      walletCoins: 0,
      upgradesOwned: {},
      playerStats: { health: 0, speed: 1, dashCooldown: 1 },
      version: 2,
    };
  },

  ensureLoaded() {
    if (!this.data) this.load();
    return this.data;
  },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) {
        this.data = this.defaultData();
        return this.data;
      }
      const parsed = JSON.parse(raw);
      this.data = Object.assign(this.defaultData(), parsed || {});
      this.data.unlockedNodes = Object.assign({ Level_01: true }, this.data.unlockedNodes || {});
      this.data.completedNodes = Object.assign({}, this.data.completedNodes || {});
      this.data.bestByNode = Object.assign({}, this.data.bestByNode || {});
      this.data.tutorialSeenByNode = Object.assign({}, this.data.tutorialSeenByNode || {});
      this.data.worlds = Object.assign({}, this.data.worlds || {});
      this.data.walletCoins = Math.max(0, Number(this.data.walletCoins || 0));
      this.data.upgradesOwned = Object.assign({}, this.data.upgradesOwned || {});
      const ps = this.data.playerStats && typeof this.data.playerStats === "object" ? this.data.playerStats : {};
      this.data.playerStats = {
        health: Number(ps.health || 0),
        speed: Number(ps.speed || 1),
        dashCooldown: Number(ps.dashCooldown || 1),
      };
      return this.data;
    } catch (_e) {
      this.data = this.defaultData();
      return this.data;
    }
  },

  save() {
    try {
      this.ensureLoaded();
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (_e) {
      // best effort local persistence
    }
  },

  isUnlocked(nodeId) {
    const d = this.ensureLoaded();
    return !!d.unlockedNodes[nodeId];
  },

  setUnlocked(nodeId, unlocked = true) {
    const d = this.ensureLoaded();
    d.unlockedNodes[nodeId] = !!unlocked;
    this.save();
  },

  markTutorialSeen(nodeId) {
    const d = this.ensureLoaded();
    d.tutorialSeenByNode[nodeId] = true;
    this.save();
  },

  hasSeenTutorial(nodeId) {
    const d = this.ensureLoaded();
    return !!d.tutorialSeenByNode[nodeId];
  },

  updateMapPosition(pos) {
    const d = this.ensureLoaded();
    d.lastMapPosition = pos ? { x: Number(pos.x) || 0, y: Number(pos.y) || 0 } : null;
    this.save();
  },

  ensureWorldState(world) {
    const d = this.ensureLoaded();
    const worldId = world && world.id ? String(world.id) : "world_tutorial";
    if (!d.worlds[worldId]) {
      d.worlds[worldId] = {
        unlockedNodes: {},
        completedNodes: {},
        bestByNode: {},
        tutorialSeenByNode: {},
        lastSelectedNodeId: null,
        lastCompletedNodeId: null,
      };
    }
    const ws = d.worlds[worldId];
    ws.unlockedNodes = Object.assign({}, ws.unlockedNodes || {});
    ws.completedNodes = Object.assign({}, ws.completedNodes || {});
    ws.bestByNode = Object.assign({}, ws.bestByNode || {});
    ws.tutorialSeenByNode = Object.assign({}, ws.tutorialSeenByNode || {});

    const startNodeId = world && world.startNodeId ? String(world.startNodeId) : null;
    if (startNodeId && !ws.unlockedNodes[startNodeId]) ws.unlockedNodes[startNodeId] = true;
    const edges = Array.isArray(world && world.edges) ? world.edges : [];
    edges.forEach((edge) => {
      if (!edge || String(edge.from) !== String(startNodeId)) return;
      if (!edge.unlockRule && edge.to) ws.unlockedNodes[String(edge.to)] = true;
    });
    this.propagateWorldUnlocks(world, ws);
    if (!ws.lastSelectedNodeId) ws.lastSelectedNodeId = startNodeId;
    return ws;
  },

  isWorldNodeUnlocked(world, nodeId) {
    const ws = this.ensureWorldState(world);
    return !!ws.unlockedNodes[String(nodeId)];
  },

  isWorldNodeCompleted(world, nodeId) {
    const ws = this.ensureWorldState(world);
    return !!ws.completedNodes[String(nodeId)];
  },

  getWorldNodeBest(world, nodeId) {
    const ws = this.ensureWorldState(world);
    return ws.bestByNode[String(nodeId)] || null;
  },

  setWorldSelectedNode(world, nodeId) {
    const ws = this.ensureWorldState(world);
    ws.lastSelectedNodeId = String(nodeId || "");
    this.save();
  },

  hasSeenWorldTutorial(world, nodeId) {
    const ws = this.ensureWorldState(world);
    return !!ws.tutorialSeenByNode[String(nodeId)];
  },

  markWorldTutorialSeen(world, nodeId) {
    const ws = this.ensureWorldState(world);
    ws.tutorialSeenByNode[String(nodeId)] = true;
    this.save();
  },

  evaluateUnlockRule(rule, completedMap) {
    if (!rule) return true;
    const s = String(rule);
    if (s.startsWith("complete:")) {
      const id = s.slice("complete:".length);
      return !!completedMap[id];
    }
    return true;
  },

  propagateWorldUnlocks(world, ws) {
    const startNodeId = world && world.startNodeId ? String(world.startNodeId) : null;
    const edges = Array.isArray(world && world.edges) ? world.edges : [];
    const prevUnlocked = Object.assign({}, ws.unlockedNodes || {});
    const rebuiltUnlocked = {};
    if (startNodeId) rebuiltUnlocked[startNodeId] = true;
    Object.keys(ws.completedNodes || {}).forEach((id) => {
      if (ws.completedNodes[id]) rebuiltUnlocked[String(id)] = true;
    });

    let changed = true;
    let guard = 0;
    while (changed && guard < 64) {
      guard += 1;
      changed = false;
      edges.forEach((edge) => {
        if (!edge || !edge.from || !edge.to) return;
        const fromId = String(edge.from);
        const toId = String(edge.to);
        if (!rebuiltUnlocked[fromId]) return;
        const canUnlock = this.evaluateUnlockRule(edge.unlockRule, ws.completedNodes);
        if (!canUnlock) return;
        if (!rebuiltUnlocked[toId]) {
          rebuiltUnlocked[toId] = true;
          changed = true;
        }
      });
    }

    ws.unlockedNodes = rebuiltUnlocked;
    const prevKeys = Object.keys(prevUnlocked).filter((k) => prevUnlocked[k]);
    const nextKeys = Object.keys(rebuiltUnlocked).filter((k) => rebuiltUnlocked[k]);
    const pruned = prevKeys.filter((k) => !rebuiltUnlocked[k]).length;
    const added = nextKeys.filter((k) => !prevUnlocked[k]).length;
    if ((added > 0 || pruned > 0) && Platformer.Debug) {
      Platformer.Debug.log(
        "Progress.world",
        `Reconciled unlocks in ${world && world.id ? world.id : "world"}: +${added}, -${pruned}, total=${nextKeys.length}.`
      );
    }
  },

  applyWorldUnlockGraph(world, completedNodeId) {
    const ws = this.ensureWorldState(world);
    const completed = ws.completedNodes;
    const unlocked = ws.unlockedNodes;
    const edges = Array.isArray(world && world.edges) ? world.edges : [];
    edges.forEach((edge) => {
      if (!edge || String(edge.from) !== String(completedNodeId)) return;
      const canUnlock = this.evaluateUnlockRule(edge.unlockRule, completed);
      if (canUnlock && edge.to) unlocked[String(edge.to)] = true;
    });
    this.propagateWorldUnlocks(world, ws);
  },

  markWorldLevelCompleted(world, payload) {
    const ws = this.ensureWorldState(world);
    const nodeId = payload && payload.nodeId ? String(payload.nodeId) : null;
    if (!nodeId) return null;
    const firstClear = !ws.completedNodes[nodeId];

    ws.completedNodes[nodeId] = true;
    ws.unlockedNodes[nodeId] = true;
    ws.lastCompletedNodeId = nodeId;
    ws.lastSelectedNodeId = nodeId;

    const coins = Number(payload && payload.coins ? payload.coins : 0);
    const timeLeft = Number(payload && payload.timeLeft ? payload.timeLeft : 0);
    const prev = ws.bestByNode[nodeId] || { bestCoins: 0, bestTimeLeft: 0 };
    ws.bestByNode[nodeId] = {
      bestCoins: Math.max(prev.bestCoins || 0, coins),
      bestTimeLeft: Math.max(prev.bestTimeLeft || 0, timeLeft),
    };

    if (firstClear && coins > 0) {
      const d = this.ensureLoaded();
      d.walletCoins = Math.max(0, Number(d.walletCoins || 0) + coins);
      if (Platformer.Debug) Platformer.Debug.log("Progress.shop", `Awarded ${coins} coins for first clear of ${nodeId}. Wallet=${d.walletCoins}`);
    }

    this.applyWorldUnlockGraph(world, nodeId);
    this.save();
    return nodeId;
  },

  getWalletCoins() {
    const d = this.ensureLoaded();
    return Math.max(0, Number(d.walletCoins || 0));
  },

  getOwnedUpgradeCount(upgradeId) {
    const d = this.ensureLoaded();
    return Math.max(0, Number((d.upgradesOwned || {})[String(upgradeId || "")] || 0));
  },

  getPlayerStats() {
    const d = this.ensureLoaded();
    const ps = d.playerStats || {};
    return {
      health: Number(ps.health || 0),
      speed: Number(ps.speed || 1),
      dashCooldown: Number(ps.dashCooldown || 1),
    };
  },

  purchaseUpgrade(item) {
    const d = this.ensureLoaded();
    if (!item || !item.id) return { ok: false, message: "Invalid item." };
    const itemId = String(item.id);
    const cost = Math.max(0, Number(item.cost || 0));
    const max = Math.max(1, Number(item.max || 1));
    const owned = this.getOwnedUpgradeCount(itemId);
    if (owned >= max) return { ok: false, message: "Already maxed." };
    const coins = this.getWalletCoins();
    if (coins < cost) return { ok: false, message: "Not enough coins." };

    d.walletCoins = coins - cost;
    d.upgradesOwned[itemId] = owned + 1;
    d.playerStats = d.playerStats || { health: 0, speed: 1, dashCooldown: 1 };
    const stat = String(item.stat || "");
    const delta = Number(item.delta || 0);
    if (stat === "health") {
      d.playerStats.health = Number(d.playerStats.health || 0) + delta;
    } else if (stat === "speed") {
      d.playerStats.speed = Number(d.playerStats.speed || 1) + delta;
    } else if (stat === "dashCooldown") {
      d.playerStats.dashCooldown = Number(d.playerStats.dashCooldown || 1) + delta;
    }
    this.save();
    if (Platformer.Debug) {
      Platformer.Debug.log("Progress.shop", `Purchased ${itemId} cost=${cost} owned=${d.upgradesOwned[itemId]} wallet=${d.walletCoins}`);
    }
    return { ok: true, walletCoins: d.walletCoins, owned: d.upgradesOwned[itemId], stats: this.getPlayerStats() };
  },

  markLevelCompleted(payload) {
    const manager = Platformer.WorldMapManager || null;
    const targetWorldId = payload && payload.worldId ? String(payload.worldId) : null;
    const activeWorld = manager && typeof manager.getCached === "function" && targetWorldId
      ? manager.getCached(targetWorldId)
      : (manager && typeof manager.getActiveWorld === "function" ? manager.getActiveWorld() : null);
    const incomingNodeId = payload && payload.nodeId ? String(payload.nodeId) : null;
    if (activeWorld && incomingNodeId && manager && typeof manager.getNodeById === "function" && manager.getNodeById(activeWorld, incomingNodeId)) {
      return this.markWorldLevelCompleted(activeWorld, payload);
    }

    const fallbackActiveWorld = manager && typeof manager.getActiveWorld === "function"
      ? manager.getActiveWorld()
      : null;
    if (fallbackActiveWorld && incomingNodeId && manager && typeof manager.getNodeById === "function" && manager.getNodeById(fallbackActiveWorld, incomingNodeId)) {
      return this.markWorldLevelCompleted(fallbackActiveWorld, payload);
    }

    const d = this.ensureLoaded();
    const nodeId = payload && payload.nodeId ? payload.nodeId : null;
    const levelNum = payload && payload.level ? Number(payload.level) : 1;
    const mapNode = nodeId ? Platformer.WorldMapData.getNodeById(nodeId) : Platformer.WorldMapData.getNodeForGameLevel(levelNum);
    const resolvedNodeId = mapNode ? mapNode.id : `Level_${String(levelNum).padStart(2, "0")}`;

    d.completedNodes[resolvedNodeId] = true;
    d.lastCompletedNodeId = resolvedNodeId;

    const coins = Number(payload && payload.coins ? payload.coins : 0);
    const timeLeft = Number(payload && payload.timeLeft ? payload.timeLeft : 0);
    const prev = d.bestByNode[resolvedNodeId] || { bestCoins: 0, bestTimeLeft: 0 };
    d.bestByNode[resolvedNodeId] = {
      bestCoins: Math.max(prev.bestCoins || 0, coins),
      bestTimeLeft: Math.max(prev.bestTimeLeft || 0, timeLeft),
    };

    this.setUnlocked(resolvedNodeId, true);
    this.applyUnlockGraph(resolvedNodeId);
    this.save();
    return resolvedNodeId;
  },

  applyUnlockGraph(completedNodeId) {
    const d = this.ensureLoaded();
    const completed = d.completedNodes;
    const unlocked = d.unlockedNodes;

    const node = Platformer.WorldMapData.getNodeById(completedNodeId);
    if (!node || !Array.isArray(node.next)) return;

    node.next.forEach((nextId) => {
      const nextNode = Platformer.WorldMapData.getNodeById(nextId);
      if (!nextNode) return;
      const req = Array.isArray(nextNode.requires) ? nextNode.requires : [];
      const ok = req.every((id) => !!completed[id]);
      if (ok) unlocked[nextId] = true;
    });
  },
};
