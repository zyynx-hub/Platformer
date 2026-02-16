window.Platformer = window.Platformer || {};

Platformer.WorldMapManager = {
  registry: {},
  cache: {},
  shopCache: {},
  activeWorldId: null,
  defaultWorldId: "world_tutorial",
  embeddedDefaults: {
    world_tutorial: {
      id: "world_tutorial",
      name: "Tutorial World",
      orderIndex: 0,
      theme: {},
      backgroundLayers: [],
      lineStyle: {},
      defaultNodeStyle: {},
      startNodeId: "start",
      nodes: [
        { id: "start", type: "start", pos: { x: 180, y: 640 }, gameLevel: 5, ui: { title: "Rooftop Start", hint: "WASD / Arrow keys to move" } },
        { id: "teach_move", type: "tutorial", pos: { x: 430, y: 560 }, gameLevel: 5, ui: { title: "Movement Basics", hint: "Press Enter/E to confirm" } },
        { id: "junction_1", type: "junction", pos: { x: 700, y: 640 }, ui: { title: "Route Split", hint: "Left = Shop, Up = Continue" } },
        { id: "shop_01", type: "shop", pos: { x: 930, y: 640 }, ui: { title: "Supply Kiosk", hint: "Press Enter/E to confirm" } },
        { id: "teach_jump", type: "tutorial", pos: { x: 700, y: 430 }, ui: { title: "Jump Timing", hint: "WASD / Arrow keys to move" } },
        { id: "teach_hazards", type: "level", pos: { x: 980, y: 360 }, ui: { title: "Hazard Control", hint: "Press Enter/E to confirm" } },
        { id: "boss_approach", type: "level", pos: { x: 1260, y: 360 }, ui: { title: "Boss Approach", hint: "Press Enter/E to confirm" } },
        { id: "boss_tutorial", type: "boss", pos: { x: 1460, y: 280 }, ui: { title: "Boss Tutorial", hint: "Press Enter/E to confirm" } },
      ],
      edges: [
        { from: "start", to: "teach_move", kind: "straight" },
        { from: "teach_move", to: "junction_1", kind: "straight" },
        { from: "junction_1", to: "shop_01", kind: "straight" },
        { from: "junction_1", to: "teach_jump", kind: "straight" },
        { from: "teach_jump", to: "teach_hazards", kind: "straight" },
        { from: "teach_hazards", to: "boss_approach", kind: "straight" },
        { from: "boss_approach", to: "boss_tutorial", kind: "straight" },
      ],
      raw: { config: {}, nodes: {} },
    },
  },
  embeddedShops: {
    world_tutorial: {
      shop_01: {
        id: "shop_01",
        name: "Supply Kiosk",
        items: [
          { id: "hp_up_1", label: "Health Up", cost: 10, stat: "health", delta: 1 },
          { id: "speed_up_1", label: "Speed Up", cost: 8, stat: "speed", delta: 0.1 },
          { id: "dash_cd_1", label: "Dash Cooldown", cost: 12, stat: "dashCooldown", delta: -0.08 },
        ],
      },
    },
  },

  registerWorld(def) {
    if (!def || !def.id) return;
    const id = String(def.id);
    this.registry[id] = {
      id,
      basePath: String(def.basePath || "").replace(/\\/g, "/").replace(/\/$/, ""),
    };
  },

  registerDefaults() {
    if (!this.registry.world_tutorial) {
      this.registerWorld({
        id: "world_tutorial",
        basePath: "js/level/world_tutorial",
      });
    }
  },

  getWorldDef(worldId) {
    this.registerDefaults();
    return this.registry[String(worldId || this.defaultWorldId)] || null;
  },

  getCached(worldId) {
    return this.cache[String(worldId || this.defaultWorldId)] || null;
  },

  getActiveWorld() {
    return this.getCached(this.activeWorldId || this.defaultWorldId);
  },

  getNodeById(world, nodeId) {
    if (!world || !Array.isArray(world.nodes)) return null;
    const id = String(nodeId || "");
    return world.nodes.find((n) => n && String(n.id) === id) || null;
  },

  resolveGameLevelRef(levelRef) {
    if (typeof levelRef === "number" && Number.isFinite(levelRef)) return Number(levelRef);
    const ref = String(levelRef || "");
    const m = ref.match(/(\d+)/);
    if (m) return Number(m[1]);
    return 1;
  },

  async fetchJson(path) {
    const normalized = String(path || "").replace(/\\/g, "/");
    const response = await fetch(normalized, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while loading ${normalized}`);
    }
    return response.json();
  },

  normalize(worldId, config, nodes) {
    const cfg = config && typeof config === "object" ? config : {};
    const nd = nodes && typeof nodes === "object" ? nodes : {};

    return {
      id: String(cfg.id || worldId),
      name: String(cfg.name || worldId),
      orderIndex: Number(cfg.orderIndex || 0),
      theme: cfg.theme || {},
      backgroundLayers: Array.isArray(cfg.backgroundLayers) ? cfg.backgroundLayers : [],
      lineStyle: cfg.lineStyle || {},
      defaultNodeStyle: cfg.defaultNodeStyle || {},
      startNodeId: nd.startNodeId || null,
      nodes: Array.isArray(nd.nodes) ? nd.nodes : [],
      edges: Array.isArray(nd.edges) ? nd.edges : [],
      raw: {
        config: cfg,
        nodes: nd,
      },
    };
  },

  async loadWorld(worldId, opts = {}) {
    const id = String(worldId || this.defaultWorldId);
    if (!opts.force && this.cache[id]) {
      return this.cache[id];
    }

    const def = this.getWorldDef(id);
    if (!def) {
      throw new Error(`World not registered: ${id}`);
    }

    const configPath = `${def.basePath}/world.config.json`;
    const nodesPath = `${def.basePath}/nodes.json`;

    let world = null;
    try {
      const [config, nodes] = await Promise.all([
        this.fetchJson(configPath),
        this.fetchJson(nodesPath),
      ]);
      world = this.normalize(id, config, nodes);
    } catch (err) {
      const embedded = this.embeddedDefaults[id] || null;
      if (!embedded) throw err;
      world = this.normalize(id, embedded, embedded);
      if (Platformer.Debug) {
        Platformer.Debug.warn("WorldMapManager", `Using embedded fallback for ${id}: ${err && err.message ? err.message : err}`);
      }
    }
    this.cache[id] = world;
    this.activeWorldId = id;

    if (Platformer.Debug) {
      Platformer.Debug.log("WorldMapManager", `Loaded world=${id} nodes=${world.nodes.length} edges=${world.edges.length}`);
    }

    return world;
  },

  async warmupDefault() {
    try {
      return await this.loadWorld(this.defaultWorldId);
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.warn("WorldMapManager", `Warmup failed: ${err && err.message ? err.message : err}`);
      }
      return null;
    }
  },

  async loadShop(worldId, shopRef, opts = {}) {
    const wid = String(worldId || this.defaultWorldId);
    const sid = String(shopRef || "");
    if (!sid) throw new Error("Missing shopRef");
    const cacheKey = `${wid}:${sid}`;
    if (!opts.force && this.shopCache[cacheKey]) return this.shopCache[cacheKey];

    const def = this.getWorldDef(wid);
    if (!def) throw new Error(`World not registered: ${wid}`);
    const shopPath = `${def.basePath}/shop/${sid}.json`;
    let shop = null;
    try {
      shop = await this.fetchJson(shopPath);
    } catch (err) {
      const fallback = this.embeddedShops[wid] && this.embeddedShops[wid][sid] ? this.embeddedShops[wid][sid] : null;
      if (!fallback) throw err;
      shop = fallback;
      if (Platformer.Debug) {
        Platformer.Debug.warn("WorldMapManager.shop", `Using embedded fallback for ${cacheKey}: ${err && err.message ? err.message : err}`);
      }
    }

    const normalized = {
      id: String(shop.id || sid),
      name: String(shop.name || sid),
      items: Array.isArray(shop.items) ? shop.items.map((it) => ({
        id: String(it.id || ""),
        label: String(it.label || it.id || "Upgrade"),
        cost: Math.max(0, Number(it.cost || 0)),
        stat: String(it.stat || ""),
        delta: Number(it.delta || 0),
        max: Math.max(1, Number(it.max || 1)),
      })).filter((it) => !!it.id) : [],
    };
    this.shopCache[cacheKey] = normalized;
    if (Platformer.Debug) {
      Platformer.Debug.log("WorldMapManager.shop", `Loaded shop=${cacheKey} items=${normalized.items.length}`);
    }
    return normalized;
  },
};
