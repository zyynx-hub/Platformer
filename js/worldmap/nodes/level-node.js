window.Platformer = window.Platformer || {};

Platformer.LevelNode = class LevelNode {
  constructor(scene, data, progress, rootContainer) {
    this.scene = scene;
    this.data = data;
    this.progress = progress;
    this.id = data.id;
    this.unlocked = !!progress.isUnlocked(this.id);
    this.selected = false;
    this.radius = data.triggerRadius || 40;

    this.pathGlow = null;
    this.node = scene.add.circle(data.x, data.y, 18, this.unlocked ? 0x38bdf8 : 0x475569, 0.92)
      .setStrokeStyle(3, this.unlocked ? 0xe0f2fe : 0x64748b, 0.9)
      .setDepth(20);
    this.inner = scene.add.circle(data.x, data.y, 9, this.unlocked ? 0xfacc15 : 0x334155, this.unlocked ? 1 : 0.85)
      .setDepth(21);
    this.label = scene.add.text(data.x, data.y - 30, data.displayName || data.id, {
      fontFamily: "Consolas",
      fontSize: "16px",
      color: this.unlocked ? "#e2e8f0" : "#94a3b8",
      stroke: "#0f172a",
      strokeThickness: 4,
      align: "center",
    }).setOrigin(0.5).setDepth(22);

    if (rootContainer && rootContainer.add) {
      rootContainer.add([this.node, this.inner, this.label]);
    }
  }

  refreshUnlock() {
    this.unlocked = !!this.progress.isUnlocked(this.id);
    this.node.setFillStyle(this.unlocked ? 0x38bdf8 : 0x475569, 0.92);
    this.node.setStrokeStyle(3, this.unlocked ? 0xe0f2fe : 0x64748b, 0.9);
    this.inner.setFillStyle(this.unlocked ? 0xfacc15 : 0x334155, this.unlocked ? 1 : 0.85);
    this.label.setColor(this.unlocked ? "#e2e8f0" : "#94a3b8");
  }

  setSelected(active) {
    if (this.selected === active) return;
    this.selected = active;
    if (active) {
      this.node.setScale(1.15);
      this.inner.setScale(1.2);
      this.node.setFillStyle(this.unlocked ? 0x22d3ee : 0x64748b, 1);
    } else {
      this.node.setScale(1);
      this.inner.setScale(1);
      this.refreshUnlock();
    }
  }

  inRange(x, y) {
    const dx = x - this.data.x;
    const dy = y - this.data.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  destroy() {
    if (this.node) this.node.destroy();
    if (this.inner) this.inner.destroy();
    if (this.label) this.label.destroy();
    if (this.pathGlow) this.pathGlow.destroy();
  }
};
