window.Platformer = window.Platformer || {};

Platformer.WorldMapView = class WorldMapView {
  constructor(scene, worldData) {
    this.scene = scene;
    this.world = worldData || null;
    this.root = scene.add.container(0, 0).setDepth(10);
    this.nodeById = {};
    this.nodeViews = {};
    this.selectedNodeId = null;
    this.availableNodeIds = [];
    this.pendingNodeId = null;
    this.avatar = null;

    this.bgSky = null;
    this.bgBandA = null;
    this.bgBandB = null;
    this.scanlines = null;
    this.bgLayers = [];
    this.bgOrbs = [];
    this.layerKeys = [];
    this.pathGraphics = null;
    this.pathLines = [];
    this.particles = null;

    this.infoPanel = null;
    this.infoTitle = null;
    this.infoBody = null;
    this.infoHint = null;
    this.debugText = null;
  }

  render() {
    this.ensureNodeIndex();
    this.safeRun("drawBackground", () => this.drawBackground());
    this.safeRun("drawPaths", () => this.drawPaths());
    this.safeRun("drawNodes", () => this.drawNodes());
    this.safeRun("createInfoPanel", () => this.createInfoPanel());
    this.safeRun("resize", () => this.resize());

    const startId = this.world && this.world.startNodeId ? this.world.startNodeId : null;
    if (startId && this.nodeById[startId]) {
      this.selectNode(startId);
    }
  }

  drawBackground() {
    const vp = this.getViewport();
    const colors = (this.world && this.world.theme && this.world.theme.colors) ? this.world.theme.colors : {};
    const cTop = this.parseColor(colors.bgTop, 0x050b1f);
    const cBottom = this.parseColor(colors.bgBottom, 0x0a183c);
    const cMidA = this.parseColor(colors.bgBandA, 0x11285b);
    const cMidB = this.parseColor(colors.bgBandB, 0x0f2a5e);
    this.bgSky = this.scene.add.rectangle(0, 0, vp.w, vp.h, cTop, 1).setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.bgBandA = this.scene.add.rectangle(0, vp.h * 0.14, vp.w, vp.h * 0.26, cMidA, 0.22).setOrigin(0, 0).setDepth(1).setScrollFactor(0);
    this.bgBandB = this.scene.add.rectangle(0, vp.h * 0.58, vp.w, vp.h * 0.22, cMidB, 0.18).setOrigin(0, 0).setDepth(1).setScrollFactor(0);
    this.bgOrbs = [
      this.scene.add.circle(vp.w * 0.18, vp.h * 0.23, Math.max(90, Math.round(vp.h * 0.11)), 0x7c3aed, 0.1).setDepth(1.3).setScrollFactor(0),
      this.scene.add.circle(vp.w * 0.8, vp.h * 0.18, Math.max(110, Math.round(vp.h * 0.14)), 0x22d3ee, 0.08).setDepth(1.35).setScrollFactor(0),
    ];

    this.scanlines = this.scene.add.graphics().setDepth(2).setScrollFactor(0);
    this.redrawScanlines(vp.w, vp.h, cBottom, colors);
    this.createParallaxLayers(vp.w, vp.h);

    this.particles = this.scene.add.particles(0, 0, this.textureOr("coin", "__WHITE"), {
      x: { min: 0, max: vp.w },
      y: { min: 0, max: vp.h },
      lifespan: { min: 3000, max: 5200 },
      speedY: { min: -20, max: -7 },
      speedX: { min: -7, max: 7 },
      scale: { start: 0.06, end: 0 },
      alpha: { start: 0.24, end: 0 },
      quantity: 1,
      frequency: 160,
    }).setDepth(3).setScrollFactor(0);
  }

  createParallaxLayers(w, h) {
    this.bgLayers = [];
    const layers = Array.isArray(this.world && this.world.backgroundLayers) ? this.world.backgroundLayers : [];
    layers.forEach((layer, idx) => {
      const key = `wm-bg-${String(this.world && this.world.id ? this.world.id : "world")}-${idx}`;
      const alpha = Phaser.Math.Clamp(Number(layer && layer.alpha != null ? layer.alpha : 0.8), 0, 1);
      const parallax = Number(layer && layer.parallax != null ? layer.parallax : 0.2);
      const depth = 1.2 + idx * 0.35;
      const fallbackTint = [0x1e3a8a, 0x1d4ed8, 0x0ea5e9][idx % 3];
      const ts = this.scene.add.tileSprite(0, 0, w, h, "__WHITE")
        .setOrigin(0, 0)
        .setDepth(depth)
        .setScrollFactor(0)
        .setAlpha(alpha)
        .setTint(fallbackTint);
      this.bgLayers.push({ sprite: ts, parallax, key, src: layer && layer.src ? String(layer.src) : "" });

      const src = layer && layer.src ? String(layer.src) : "";
      if (!src) return;
      if (this.scene.textures.exists(key)) {
        ts.setTexture(key).clearTint();
        return;
      }
      this.safeRun("bgLayer.load", () => {
        this.scene.load.image(key, src);
        this.scene.load.once(`filecomplete-image-${key}`, () => {
          if (!this.scene || !this.scene.sys || !this.scene.sys.settings || !this.scene.sys.settings.active) return;
          if (!ts || !ts.active) return;
          ts.setTexture(key).clearTint();
          if (Platformer.Debug) Platformer.Debug.log("WorldMapView.theme", `Loaded background layer ${idx + 1}: ${src}`);
        });
        this.scene.load.once("loaderror", (fileObj) => {
          if (!fileObj || String(fileObj.key) !== key) return;
          if (Platformer.Debug) Platformer.Debug.warn("WorldMapView.theme", `Background layer missing: ${src} (fallback tint used)`);
        });
        this.scene.load.start();
      });
    });
  }

  redrawScanlines(w, h, bottomColor, colors) {
    if (!this.scanlines) return;
    this.scanlines.clear();
    const lineColor = this.parseColor(colors && colors.gridLine, 0x67e8f9);
    const orbA = this.parseColor(colors && colors.orbA, 0x7c3aed);
    const orbB = this.parseColor(colors && colors.orbB, 0x38bdf8);

    this.scanlines.fillStyle(bottomColor, 0.16);
    this.scanlines.fillCircle(w * 0.18, h * 0.26, Math.max(120, Math.round(h * 0.16)));
    this.scanlines.fillStyle(bottomColor, 0.12);
    this.scanlines.fillCircle(w * 0.82, h * 0.18, Math.max(140, Math.round(h * 0.2)));

    this.scanlines.fillStyle(orbA, 0.09);
    this.scanlines.fillCircle(w * 0.24, h * 0.24, Math.max(90, Math.round(h * 0.12)));
    this.scanlines.fillStyle(orbB, 0.08);
    this.scanlines.fillCircle(w * 0.78, h * 0.2, Math.max(110, Math.round(h * 0.14)));

    this.scanlines.lineStyle(1, lineColor, 0.08);
    for (let y = 0; y <= h; y += 84) {
      this.scanlines.beginPath();
      this.scanlines.moveTo(0, y);
      this.scanlines.lineTo(w, y);
      this.scanlines.strokePath();
    }

    this.scanlines.lineStyle(2, lineColor, 0.14);
    for (let i = 0; i < 10; i += 1) {
      const x = (i * 137) % (w + 200) - 80;
      const y = 40 + ((i * 97) % (h - 80));
      this.scanlines.beginPath();
      this.scanlines.moveTo(x, y);
      this.scanlines.lineTo(x + 170, y - 44);
      this.scanlines.strokePath();
    }
  }

  drawPaths() {
    this.ensureNodeIndex();
    this.clearPathLines();
    const edges = Array.isArray(this.world && this.world.edges) ? this.world.edges : [];
    if (!edges.length && Platformer.Debug) {
      Platformer.Debug.warn("WorldMapView", "No edges found to draw.");
    }
    let drawn = 0;
    edges.forEach((edge) => {
      const from = this.getNode(edge.from);
      const to = this.getNode(edge.to);
      if (!from || !to) return;
      try {
        const lineCfg = this.world && this.world.lineStyle ? this.world.lineStyle : {};
        const glowColor = this.parseColor(lineCfg.glowColor, 0x1e3a8a);
        const coreColor = this.parseColor(lineCfg.color, 0x67e8f9);
        const glowWidth = Math.max(1, Number(lineCfg.glowWidth || 10));
        const coreWidth = Math.max(1, Number(lineCfg.width || 4));
        const glow = this.scene.add.line(
          0, 0,
          from.pos.x, from.pos.y,
          to.pos.x, to.pos.y,
          glowColor,
          0.95
        ).setOrigin(0, 0).setLineWidth(glowWidth, glowWidth).setDepth(11);
        const core = this.scene.add.line(
          0, 0,
          from.pos.x, from.pos.y,
          to.pos.x, to.pos.y,
          coreColor,
          1
        ).setOrigin(0, 0).setLineWidth(coreWidth, coreWidth).setDepth(12);
        const dot = this.scene.add.circle(
          (from.pos.x + to.pos.x) * 0.5,
          (from.pos.y + to.pos.y) * 0.5,
          3.5,
          0x93c5fd,
          0.95
        ).setDepth(13);
        this.pathLines.push(glow, core, dot);
        this.root.add([glow, core, dot]);
        drawn += 1;
      } catch (err) {
        if (Platformer.Debug) {
          Platformer.Debug.error("WorldMapView.drawPaths", `edge ${edge.from}->${edge.to} failed: ${err && err.stack ? err.stack : err}`);
        }
      }
    });
    if (Platformer.Debug) {
      Platformer.Debug.log("WorldMapView.drawPaths", `edges total=${edges.length} drawn=${drawn}`);
      if (drawn === 0 && edges.length > 0) {
        Platformer.Debug.warn("WorldMapView.drawPaths", "Edges exist but none were drawn.");
      }
    }
  }

  drawNodes() {
    this.ensureNodeIndex();
    const nodes = Array.isArray(this.world && this.world.nodes) ? this.world.nodes : [];
    nodes.forEach((node) => {
      const style = this.resolveNodeStyle(node);
      const outer = this.scene.add.circle(node.pos.x, node.pos.y, 18, style.fill, 0.95)
        .setStrokeStyle(3, style.stroke, 0.92)
        .setDepth(20);
      const inner = this.scene.add.circle(node.pos.x, node.pos.y, 9, style.inner, 1)
        .setDepth(21);
      const label = this.scene.add.text(node.pos.x, node.pos.y - 30, this.nodeTitle(node), {
        fontFamily: "Consolas",
        fontSize: "16px",
        color: style.label,
        stroke: "#0f172a",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(22);
      const badge = this.scene.add.text(node.pos.x, node.pos.y, this.nodeBadge(node), {
        fontFamily: "Consolas",
        fontSize: "15px",
        color: "#f8fafc",
        stroke: "#0f172a",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(23);

      this.nodeViews[node.id] = { outer, inner, label, badge, style };
      this.root.add([outer, inner, label, badge]);
    });
  }

  resolveNodeStyle(node) {
    const type = String(node.type || "level");
    const state = String(node.state || "").toLowerCase();
    const isLocked = state === "locked";
    const isCompleted = state === "completed";
    if (isLocked) {
      return { fill: 0x475569, stroke: 0x64748b, inner: 0x334155, label: "#94a3b8" };
    }
    if (isCompleted) {
      return { fill: 0x16a34a, stroke: 0xbbf7d0, inner: 0xfef08a, label: "#dcfce7" };
    }
    if (type === "shop") return { fill: 0x22c55e, stroke: 0xbbf7d0, inner: 0xfef08a, label: "#dcfce7" };
    if (type === "boss") return { fill: 0xef4444, stroke: 0xfecaca, inner: 0xf97316, label: "#fee2e2" };
    if (type === "junction") return { fill: 0xa855f7, stroke: 0xe9d5ff, inner: 0xc4b5fd, label: "#f3e8ff" };
    if (type === "tutorial") return { fill: 0x38bdf8, stroke: 0xe0f2fe, inner: 0xfacc15, label: "#e2e8f0" };
    if (type === "start") return { fill: 0x0ea5e9, stroke: 0xbae6fd, inner: 0xfacc15, label: "#f8fafc" };
    return { fill: 0x38bdf8, stroke: 0xe0f2fe, inner: 0xfacc15, label: "#e2e8f0" };
  }

  createInfoPanel() {
    this.infoPanel = this.scene.add.rectangle(20, 20, 360, 220, 0x0f172a, 0.84)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x7dd3fc, 0.78)
      .setDepth(70)
      .setScrollFactor(0);
    this.infoTitle = this.scene.add.text(34, 34, "Tutorial World", {
      fontFamily: "Consolas",
      fontSize: "26px",
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 4,
    }).setDepth(71).setScrollFactor(0);
    this.infoBody = this.scene.add.text(34, 74, "Walk to a node to inspect.", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#cbd5e1",
      lineSpacing: 4,
      wordWrap: { width: 330 },
    }).setDepth(71).setScrollFactor(0);
    this.infoHint = this.scene.add.text(30, 252, "Press E / ENTER to play this level", {
      fontFamily: "Consolas",
      fontSize: "22px",
      color: "#fef3c7",
      stroke: "#0f172a",
      strokeThickness: 5,
    }).setDepth(72).setScrollFactor(0);
    this.infoHint.setText("Use WASD / Arrow keys to move on the map");

    this.debugText = this.scene.add.text(this.getViewport().w - 20, this.getViewport().h - 18, "", {
      fontFamily: "Consolas",
      fontSize: "16px",
      color: "#93c5fd",
      stroke: "#0f172a",
      strokeThickness: 4,
      align: "right",
    }).setOrigin(1, 1).setDepth(72).setScrollFactor(0);
  }

  selectNode(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return;
    this.selectedNodeId = nodeId;

    Object.keys(this.nodeViews).forEach((id) => {
      const view = this.nodeViews[id];
      if (!view) return;
      if (id === nodeId) {
        view.outer.setScale(1.15).setFillStyle(0x22d3ee, 1);
        view.inner.setScale(1.2);
        if (view.badge) view.badge.setScale(1.1);
      } else {
        view.outer.setScale(1).setFillStyle(view.style.fill, 0.95);
        view.inner.setScale(1);
        if (view.badge) view.badge.setScale(1);
      }
    });

    this.infoTitle.setText(`${this.nodeTitle(node)} (${node.id})`);
    const type = String(node.type || "level");
    const state = String(node.state || "unlocked");
    const hint = (node.ui && node.ui.hint) ? node.ui.hint : "Press Enter/E to confirm";
    this.infoBody.setText([
      `Type: ${type}`,
      `State: ${state}`,
      "",
      hint,
    ].join("\n"));

    this.reflowInfoPanel();
  }

  setDebug(text) {
    if (!this.debugText) return;
    this.debugText.setText(String(text || ""));
  }

  setPrompt(text) {
    if (!this.infoHint) return;
    this.infoHint.setText(String(text || ""));
  }

  setAvailableNodes(nodeIds, pendingNodeId) {
    this.availableNodeIds = Array.isArray(nodeIds) ? nodeIds.slice() : [];
    this.pendingNodeId = pendingNodeId || null;
    const available = new Set(this.availableNodeIds);
    Object.keys(this.nodeViews).forEach((id) => {
      const view = this.nodeViews[id];
      if (!view) return;
      const isSelected = id === this.selectedNodeId;
      const isAvailable = available.has(id);
      const isPending = id === this.pendingNodeId;
      if (isPending) {
        view.outer.setStrokeStyle(4, 0xfef08a, 1);
      } else if (isAvailable) {
        view.outer.setStrokeStyle(3, 0x67e8f9, 1);
      } else {
        view.outer.setStrokeStyle(3, view.style.stroke, 0.92);
      }
      if (!isSelected) {
        view.outer.setFillStyle(view.style.fill, 0.95);
      }
    });
  }

  setNodeState(nodeId, state) {
    const node = this.getNode(nodeId);
    const view = this.nodeViews[String(nodeId)];
    if (!node || !view) return;
    node.state = String(state || "locked");
    const style = this.resolveNodeStyle(node);
    view.style = style;
    view.outer.setFillStyle(style.fill, 0.95).setStrokeStyle(3, style.stroke, 0.92);
    view.inner.setFillStyle(style.inner, 1);
    view.label.setColor(style.label);
    if (view.badge) view.badge.setColor("#f8fafc");
  }

  createAvatar() {
    if (this.avatar && this.avatar.active) return this.avatar;
    this.avatar = this.scene.add.sprite(0, 0, this.textureOr("player-run-1", "player-idle-1")).setDepth(30);
    this.avatar.setDisplaySize(42, 56);
    this.root.add(this.avatar);
    return this.avatar;
  }

  setAvatarPosition(x, y) {
    if (!this.avatar) this.createAvatar();
    if (!this.avatar) return;
    this.avatar.setPosition(Number(x) || 0, Number(y) || 0);
  }

  setAvatarFacing(dirX) {
    if (!this.avatar) return;
    if (Math.abs(dirX) < 0.01) return;
    this.avatar.setFlipX(dirX < 0);
  }

  setAvatarMoving(isMoving, tickNow) {
    if (!this.avatar) return;
    const t = Number(tickNow || 0);
    if (isMoving) {
      const frame = Math.floor(t / 120) % 2 === 0 ? "player-run-1" : "player-run-2";
      this.avatar.setTexture(this.textureOr(frame, "player-idle-1"));
    } else {
      this.avatar.setTexture(this.textureOr("player-idle-1", "player-run-1"));
    }
  }

  reflowInfoPanel() {
    if (!this.infoPanel || !this.infoBody || !this.infoHint) return;
    const panelHeight = Math.max(220, Math.ceil(84 + this.infoBody.height + 20));
    this.infoPanel.setSize(360, panelHeight);
    this.infoHint.setPosition(this.infoPanel.x + 8, this.infoPanel.y + panelHeight + 10);
  }

  resize() {
    this.safeRun("resize.exec", () => {
      const vp = this.getViewport();
      this.safeRect(this.bgSky, vp.w, vp.h, 0, 0);
      this.safeRect(this.bgBandA, vp.w, vp.h * 0.22, 0, vp.h * 0.2);
      this.safeRect(this.bgBandB, vp.w, vp.h * 0.24, 0, vp.h * 0.62);
      if (this.bgOrbs[0]) this.bgOrbs[0].setPosition(vp.w * 0.18, vp.h * 0.23);
      if (this.bgOrbs[1]) this.bgOrbs[1].setPosition(vp.w * 0.8, vp.h * 0.18);
      const colors = (this.world && this.world.theme && this.world.theme.colors) ? this.world.theme.colors : {};
      this.redrawScanlines(vp.w, vp.h, this.parseColor(colors.bgBottom, 0x0a183c), colors);
      this.bgLayers.forEach((entry) => {
        if (!entry || !entry.sprite || !entry.sprite.active || typeof entry.sprite.setSize !== "function") return;
        entry.sprite.setSize(vp.w, vp.h).setPosition(0, 0);
      });

      if (this.particles) {
        this.particles.setConfig({
          x: { min: 0, max: vp.w },
          y: { min: 0, max: vp.h },
        });
      }

      this.layoutMapRootToViewport();

      if (this.debugText) {
        this.debugText.setPosition(vp.w - 20, vp.h - 18);
      }
    });
  }

  updateAmbient(timeMs) {
    const t = Number(timeMs || 0) * 0.001;
    this.bgLayers.forEach((entry, idx) => {
      if (!entry || !entry.sprite || !entry.sprite.active) return;
      if (typeof entry.sprite.tilePositionX !== "number") return;
      const p = Number(entry.parallax || 0.2);
      entry.sprite.tilePositionX = (t * 40 * p) + idx * 7;
      entry.sprite.tilePositionY = Math.sin(t * (0.2 + p * 0.3)) * (2 + idx);
    });
    if (this.bgOrbs[0]) this.bgOrbs[0].x += Math.cos(t * 0.8) * 0.22;
    if (this.bgOrbs[1]) this.bgOrbs[1].x += Math.sin(t * 0.7) * 0.25;
  }

  layoutMapRootToViewport() {
    if (!this.root || !this.world) return;
    const vp = this.getViewport();
    const b = this.deriveBounds();
    const margin = Math.max(24, Math.round(Math.min(vp.w, vp.h) * 0.04));
    const sx = (vp.w - margin * 2) / Math.max(1, b.width);
    const sy = (vp.h - margin * 2) / Math.max(1, b.height);
    const scale = Phaser.Math.Clamp(Math.min(sx, sy), 0.35, 2.2);
    const fittedW = b.width * scale;
    const fittedH = b.height * scale;
    const offsetX = (vp.w - fittedW) * 0.5 - b.x * scale;
    const offsetY = (vp.h - fittedH) * 0.5 - b.y * scale;

    this.root.setScale(scale);
    this.root.setPosition(offsetX, offsetY);

    const cam = this.scene.cameras && this.scene.cameras.main;
    if (cam) {
      cam.setViewport(0, 0, vp.w, vp.h);
      cam.setZoom(1);
      cam.scrollX = 0;
      cam.scrollY = 0;
      cam.roundPixels = true;
    }
  }

  deriveBounds() {
    const nodes = Array.isArray(this.world && this.world.nodes) ? this.world.nodes : [];
    if (!nodes.length) return { x: 0, y: 0, width: 1000, height: 700 };
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    nodes.forEach((n) => {
      const x = Number(n.pos && n.pos.x);
      const y = Number(n.pos && n.pos.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return { x: 0, y: 0, width: 1000, height: 700 };
    return {
      x: minX - 120,
      y: minY - 120,
      width: (maxX - minX) + 240,
      height: (maxY - minY) + 240,
    };
  }

  nodeTitle(node) {
    if (!node) return "Node";
    if (node.ui && node.ui.title) return String(node.ui.title);
    return String(node.id || "Node");
  }

  nodeBadge(node) {
    const t = String((node && node.type) || "level");
    if (t === "start") return "S";
    if (t === "shop") return "$";
    if (t === "boss") return "B";
    if (t === "junction") return "+";
    if (t === "tutorial") return "T";
    return "L";
  }

  getNode(id) {
    return this.nodeById[String(id)] || null;
  }

  ensureNodeIndex() {
    this.nodeById = {};
    const nodes = Array.isArray(this.world && this.world.nodes) ? this.world.nodes : [];
    nodes.forEach((n) => {
      if (!n || !n.id || !n.pos) return;
      this.nodeById[n.id] = n;
    });
  }

  getViewport() {
    const gs = this.scene.scale && this.scene.scale.gameSize ? this.scene.scale.gameSize : null;
    const bs = this.scene.scale && this.scene.scale.baseSize ? this.scene.scale.baseSize : null;
    const w = (gs && gs.width) || (bs && bs.width) || this.scene.scale.width || 960;
    const h = (gs && gs.height) || (bs && bs.height) || this.scene.scale.height || 540;
    return { w: Math.max(640, Math.round(w)), h: Math.max(360, Math.round(h)) };
  }

  safeRect(obj, width, height, x, y) {
    if (!obj || !obj.active || !obj.scene) return;
    obj.setSize(width, height).setPosition(x, y);
  }

  textureOr(key, fallback) {
    if (key && this.scene.textures.exists(key)) return key;
    if (fallback && this.scene.textures.exists(fallback)) return fallback;
    return "__WHITE";
  }

  parseColor(value, fallback) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const s = value.trim();
      if (/^#?[0-9a-fA-F]{6}$/.test(s)) {
        return Number.parseInt(s.replace("#", ""), 16);
      }
    }
    return fallback;
  }

  destroy() {
    this.clearPathLines();
    [
      this.bgSky,
      this.bgBandA,
      this.bgBandB,
      this.scanlines,
      this.particles,
      this.infoPanel,
      this.infoTitle,
      this.infoBody,
      this.infoHint,
      this.debugText,
      this.avatar,
      this.root,
    ].forEach((obj) => {
      if (obj && obj.destroy) obj.destroy();
    });
    this.bgOrbs.forEach((o) => {
      if (o && o.destroy) o.destroy();
    });
    this.bgOrbs = [];
    this.bgLayers = [];
  }

  clearPathLines() {
    if (!Array.isArray(this.pathLines)) this.pathLines = [];
    this.pathLines.forEach((obj) => {
      if (obj && obj.destroy) obj.destroy();
    });
    this.pathLines = [];
  }

  safeRun(label, fn) {
    try {
      return fn();
    } catch (err) {
      if (Platformer.Debug) {
        Platformer.Debug.error("WorldMapView", `${label} failed: ${err && err.stack ? err.stack : err}`);
      }
      return null;
    }
  }
};
