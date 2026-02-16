window.Platformer = window.Platformer || {};

Platformer.WorldMapShopPanel = class WorldMapShopPanel {
  constructor(scene) {
    this.scene = scene;
    this.root = null;
    this.title = null;
    this.wallet = null;
    this.body = null;
    this.footer = null;
    this.visible = false;
    this.shop = null;
    this.selected = 0;
    this.onClose = null;
  }

  build() {
    if (this.root) return;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    this.root = this.scene.add.container(w / 2, h / 2).setDepth(120).setVisible(false);

    const bg = this.scene.add.rectangle(0, 0, 620, 360, 0x020617, 0.92)
      .setStrokeStyle(2, 0x7dd3fc, 0.9);
    this.title = this.scene.add.text(-292, -160, "SHOP", {
      fontFamily: "Consolas",
      fontSize: "30px",
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 4,
    });
    this.wallet = this.scene.add.text(292, -160, "Coins: 0", {
      fontFamily: "Consolas",
      fontSize: "20px",
      color: "#fcd34d",
      stroke: "#0f172a",
      strokeThickness: 4,
      align: "right",
    }).setOrigin(1, 0);
    this.body = this.scene.add.text(-292, -112, "", {
      fontFamily: "Consolas",
      fontSize: "22px",
      color: "#e2e8f0",
      lineSpacing: 8,
      wordWrap: { width: 584 },
    });
    this.footer = this.scene.add.text(-292, 136, "UP/DOWN choose  ENTER buy  ESC close", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#93c5fd",
      stroke: "#0f172a",
      strokeThickness: 4,
    });

    this.root.add([bg, this.title, this.wallet, this.body, this.footer]);
  }

  open(shop, onClose) {
    this.build();
    this.shop = shop || { id: "shop", name: "Shop", items: [] };
    this.selected = 0;
    this.onClose = typeof onClose === "function" ? onClose : null;
    this.visible = true;
    this.root.setVisible(true);
    this.resize();
    this.refresh();
    if (Platformer.Debug) Platformer.Debug.log("WorldMap.shop", `Opened shop=${this.shop.id} items=${(this.shop.items || []).length}`);
  }

  close() {
    if (!this.visible) return;
    this.visible = false;
    if (this.root) this.root.setVisible(false);
    const cb = this.onClose;
    this.onClose = null;
    this.shop = null;
    if (cb) cb();
    if (Platformer.Debug) Platformer.Debug.log("WorldMap.shop", "Closed shop panel.");
  }

  moveSelection(dir) {
    if (!this.visible || !this.shop || !Array.isArray(this.shop.items) || this.shop.items.length === 0) return;
    const n = this.shop.items.length;
    this.selected = (this.selected + dir + n) % n;
    this.refresh();
  }

  tryBuySelected() {
    if (!this.visible || !this.shop || !Array.isArray(this.shop.items) || this.shop.items.length === 0) return;
    const item = this.shop.items[this.selected];
    const res = Platformer.Progress.purchaseUpgrade(item);
    if (!res || !res.ok) {
      Platformer.beeper.damage();
      if (Platformer.Debug) Platformer.Debug.warn("WorldMap.shop", `Purchase denied: ${res && res.message ? res.message : "unknown"}`);
    } else {
      Platformer.beeper.coin();
    }
    this.refresh();
  }

  refresh() {
    if (!this.visible || !this.shop) return;
    const coins = Platformer.Progress.getWalletCoins();
    this.title.setText(this.shop.name || "Shop");
    this.wallet.setText(`Coins: ${coins}`);
    const items = Array.isArray(this.shop.items) ? this.shop.items : [];
    if (!items.length) {
      this.body.setText("No items available.");
      return;
    }
    const lines = [];
    items.forEach((it, idx) => {
      const owned = Platformer.Progress.getOwnedUpgradeCount(it.id);
      const max = Math.max(1, Number(it.max || 1));
      const soldOut = owned >= max;
      const afford = coins >= Number(it.cost || 0);
      const marker = idx === this.selected ? "> " : "  ";
      const state = soldOut ? "MAX" : (afford ? "BUY" : "LOCK");
      lines.push(`${marker}${it.label}  [${it.cost}]  (${owned}/${max})  ${state}`);
      if (idx === this.selected) {
        lines.push(`   ${it.stat} ${Number(it.delta) >= 0 ? "+" : ""}${it.delta}`);
      }
    });
    this.body.setText(lines.join("\n"));
  }

  handleInput(justInput) {
    if (!this.visible) return false;
    if (justInput.up) {
      this.moveSelection(-1);
      return true;
    }
    if (justInput.down) {
      this.moveSelection(1);
      return true;
    }
    if (justInput.interact) {
      this.tryBuySelected();
      return true;
    }
    return true;
  }

  resize() {
    if (!this.root) return;
    this.root.setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2);
  }

  destroy() {
    if (this.root) this.root.destroy(true);
    this.root = null;
  }
};

