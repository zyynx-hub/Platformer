window.Platformer = window.Platformer || {};

Platformer.ExtrasScene = class extends Phaser.Scene {
  constructor() {
    super("ExtrasScene");
    this.onResize = null;
    this.categoryButtons = {};
    this.cards = [];
    this.selectedCategory = "conceptArt";
    this.preview = null;
    this.previewText = null;
    this.infoText = null;
    this.progressSnapshot = null;
  }

  create() {
    this.bgSky = this.add.rectangle(0, 0, 10, 10, 0x081336, 0.98).setOrigin(0, 0);
    this.bgMid = this.add.rectangle(0, 0, 10, 10, 0x132a56, 0.94).setOrigin(0, 0);
    this.bgGround = this.add.rectangle(0, 0, 10, 10, 0x0b6f49, 0.34).setOrigin(0, 0);
    this.bgOverlay = this.add.rectangle(0, 0, 10, 10, 0x020617, 0.38).setOrigin(0, 0);

    this.title = this.add.text(0, 34, "EXTRA'S", {
      fontFamily: "Consolas",
      fontSize: "54px",
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 6,
    }).setOrigin(0.5, 0).setDepth(10);

    this.subtitle = this.add.text(0, 98, "Unlock concept art, achievements and skins by playing levels.", {
      fontFamily: "Consolas",
      fontSize: "20px",
      color: "#cbd5e1",
      stroke: "#0f172a",
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(10);

    this.backBtn = this.add.rectangle(98, 42, 164, 48, 0x1e293b, 0.96)
      .setStrokeStyle(2, 0x67e8f9, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(12);
    this.backLabel = this.add.text(98, 42, "< BACK", {
      fontFamily: "Consolas",
      fontSize: "28px",
      color: "#f8fafc",
    }).setOrigin(0.5).setDepth(13);
    this.backBtn.on("pointerdown", () => {
      if (Platformer.Debug) Platformer.Debug.log("ExtrasScene", "Back to menu.");
      this.scene.start("MenuScene");
    });

    this.categoryBar = this.add.container(0, 0).setDepth(11);
    this.cardsContainer = this.add.container(0, 0).setDepth(11);

    this.preview = this.add.rectangle(0, 0, 10, 10, 0x0f172a, 0.9)
      .setStrokeStyle(2, 0x67e8f9, 0.9)
      .setDepth(12)
      .setVisible(false);
    this.previewText = this.add.text(0, 0, "", {
      fontFamily: "Consolas",
      fontSize: "20px",
      color: "#e2e8f0",
      align: "left",
      wordWrap: { width: 520 },
    }).setDepth(13).setVisible(false);

    this.infoText = this.add.text(0, 0, "", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#93c5fd",
      stroke: "#0f172a",
      strokeThickness: 3,
    }).setOrigin(0, 1).setDepth(12);

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.preview && this.preview.visible) {
        this.preview.setVisible(false);
        this.previewText.setVisible(false);
        return;
      }
      this.scene.start("MenuScene");
    });
    this.input.on("pointerdown", (pointer) => {
      if (!this.preview || !this.preview.visible) return;
      const b = this.preview.getBounds();
      if (!Phaser.Geom.Rectangle.Contains(b, pointer.x, pointer.y)) {
        this.preview.setVisible(false);
        this.previewText.setVisible(false);
      }
    });

    this.refreshProgressSnapshot();
    this.createCategoryButtons();
    this.renderCards();
    this.layout();

    this.onResize = () => {
      if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
      this.layout();
    };
    this.scale.on("resize", this.onResize);
  }

  refreshProgressSnapshot() {
    try {
      this.progressSnapshot = Platformer.Progress ? Platformer.Progress.ensureLoaded() : {};
    } catch (err) {
      this.progressSnapshot = {};
      if (Platformer.Debug) Platformer.Debug.error("ExtrasScene.progress", err && err.stack ? err.stack : String(err));
    }
  }

  getCompletedCount() {
    const progress = this.progressSnapshot || {};
    const worlds = progress.worlds || {};
    const worldCompleted = Object.values(worlds)
      .map((w) => (w && w.completedNodes) ? Object.keys(w.completedNodes).filter((k) => w.completedNodes[k]).length : 0)
      .reduce((sum, n) => sum + n, 0);
    const legacyCompleted = progress.completedNodes
      ? Object.keys(progress.completedNodes).filter((k) => progress.completedNodes[k]).length
      : 0;
    return Math.max(worldCompleted, legacyCompleted);
  }

  getTotalCoins() {
    const progress = this.progressSnapshot || {};
    return Math.max(0, Number(progress.walletCoins || 0));
  }

  buildExtrasData() {
    const completed = this.getCompletedCount();
    const coins = this.getTotalCoins();
    const owned = (this.progressSnapshot && this.progressSnapshot.upgradesOwned) || {};

    const unlockedBy = (type, value) => {
      if (type === "levels") return completed >= value;
      if (type === "coins") return coins >= value;
      if (type === "upgrade") return Number(owned[value] || 0) > 0;
      return false;
    };

    const mk = (item) => ({
      id: item.id,
      name: item.name,
      subcategory: item.subcategory,
      description: item.description,
      unlockType: item.unlockType,
      unlockValue: item.unlockValue,
      unlocked: unlockedBy(item.unlockType, item.unlockValue),
    });

    return {
      conceptArt: [
        mk({ id: "concept_rooftop", name: "Rooftop Sketch", subcategory: "Environment", description: "Early rooftop layout and jump flow.", unlockType: "levels", unlockValue: 1 }),
        mk({ id: "concept_enemy", name: "Blue Creature Draft", subcategory: "Enemies", description: "Concept pass for creature face + silhouette.", unlockType: "levels", unlockValue: 2 }),
        mk({ id: "concept_boss", name: "Boss Moodboard", subcategory: "Boss", description: "Color and posture exploration for boss route.", unlockType: "levels", unlockValue: 4 }),
      ],
      achievements: [
        mk({ id: "ach_first_clear", name: "First Clear", subcategory: "Milestone", description: "Complete any level.", unlockType: "levels", unlockValue: 1 }),
        mk({ id: "ach_collector", name: "Coin Collector", subcategory: "Economy", description: "Hold at least 25 wallet coins.", unlockType: "coins", unlockValue: 25 }),
        mk({ id: "ach_hunter", name: "Path Hunter", subcategory: "Progress", description: "Complete 4 levels.", unlockType: "levels", unlockValue: 4 }),
      ],
      skins: [
        mk({ id: "skin_classic", name: "Classic Runner", subcategory: "Player", description: "Base skin available from start.", unlockType: "levels", unlockValue: 0 }),
        mk({ id: "skin_dash", name: "Turbo Accent", subcategory: "Player", description: "Unlock by buying a speed upgrade.", unlockType: "upgrade", unlockValue: "speed_boost_1" }),
        mk({ id: "skin_guardian", name: "Guardian Palette", subcategory: "Player", description: "Unlock by buying a health upgrade.", unlockType: "upgrade", unlockValue: "hp_up_1" }),
      ],
    };
  }

  createCategoryButtons() {
    const entries = [
      { id: "conceptArt", label: "Concept Art" },
      { id: "achievements", label: "Achievements" },
      { id: "skins", label: "Skins" },
    ];
    entries.forEach((entry) => {
      const box = this.add.rectangle(0, 0, 220, 44, 0x1e293b, 0.94)
        .setStrokeStyle(2, 0x67e8f9, 0.75)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(0, 0, entry.label, {
        fontFamily: "Consolas",
        fontSize: "24px",
        color: "#e2e8f0",
      }).setOrigin(0.5);
      box.on("pointerdown", () => {
        this.selectedCategory = entry.id;
        this.renderCards();
      });
      this.categoryBar.add([box, txt]);
      this.categoryButtons[entry.id] = { box, txt };
    });
  }

  clearCards() {
    this.cards.forEach((card) => {
      if (!card) return;
      [card.box, card.label, card.sub, card.desc, card.status].forEach((o) => {
        if (o && o.destroy) o.destroy();
      });
    });
    this.cards = [];
    this.cardsContainer.removeAll(true);
  }

  renderCards() {
    this.refreshProgressSnapshot();
    const all = this.buildExtrasData();
    const selected = all[this.selectedCategory] || [];
    this.clearCards();

    selected.forEach((item) => {
      const box = this.add.rectangle(0, 0, 320, 160, item.unlocked ? 0x102748 : 0x0f172a, 0.95)
        .setStrokeStyle(2, item.unlocked ? 0x38bdf8 : 0x475569, 0.95)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(0, 0, item.name, {
        fontFamily: "Consolas",
        fontSize: "26px",
        color: item.unlocked ? "#f8fafc" : "#94a3b8",
      }).setOrigin(0, 0);
      const sub = this.add.text(0, 0, `Category: ${item.subcategory}`, {
        fontFamily: "Consolas",
        fontSize: "18px",
        color: "#93c5fd",
      }).setOrigin(0, 0);
      const desc = this.add.text(0, 0, item.description, {
        fontFamily: "Consolas",
        fontSize: "17px",
        color: "#cbd5e1",
        wordWrap: { width: 280 },
      }).setOrigin(0, 0);
      const requirement = item.unlockType === "levels"
        ? `Complete ${item.unlockValue} level(s)`
        : item.unlockType === "coins"
          ? `Collect ${item.unlockValue} wallet coins`
          : `Buy upgrade: ${item.unlockValue}`;
      const status = this.add.text(0, 0, item.unlocked ? "UNLOCKED - Click to view" : `LOCKED - ${requirement}`, {
        fontFamily: "Consolas",
        fontSize: "16px",
        color: item.unlocked ? "#4ade80" : "#fca5a5",
      }).setOrigin(0, 0);

      box.on("pointerdown", () => this.showPreview(item, requirement));

      this.cardsContainer.add([box, label, sub, desc, status]);
      this.cards.push({ item, box, label, sub, desc, status });
    });
    this.layout();
  }

  showPreview(item, requirementText) {
    const lines = [
      `${item.name}`,
      `Type: ${item.subcategory}`,
      "",
      item.description,
      "",
      item.unlocked ? "Unlocked content preview ready." : `Locked: ${requirementText}`,
      "",
      "Press ESC or click outside to close.",
    ];
    this.previewText.setText(lines.join("\n"));
    this.preview.setVisible(true);
    this.previewText.setVisible(true);
    this.layout();
  }

  layout() {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active) return;
    const w = this.scale.width;
    const h = this.scale.height;
    this.bgSky.setSize(w, h).setPosition(0, 0);
    this.bgMid.setSize(w, Math.round(h * 0.45)).setPosition(0, Math.round(h * 0.28));
    this.bgGround.setSize(w, Math.round(h * 0.22)).setPosition(0, Math.round(h * 0.72));
    this.bgOverlay.setSize(w, h).setPosition(0, 0);

    this.title.setPosition(w * 0.5, 22);
    this.subtitle.setPosition(w * 0.5, 88);

    const catY = 140;
    const catStartX = Math.round(w * 0.5 - 240);
    const catGap = 250;
    ["conceptArt", "achievements", "skins"].forEach((id, idx) => {
      const btn = this.categoryButtons[id];
      if (!btn) return;
      const x = catStartX + idx * catGap;
      btn.box.setPosition(x, catY);
      btn.txt.setPosition(x, catY);
      const active = this.selectedCategory === id;
      btn.box.setFillStyle(active ? 0x1d4ed8 : 0x1e293b, active ? 0.98 : 0.94);
      btn.box.setStrokeStyle(2, active ? 0x93c5fd : 0x67e8f9, active ? 1 : 0.75);
    });

    const gridTop = 186;
    const cols = 3;
    const cardW = Math.min(360, Math.floor((w - 80) / cols) - 18);
    const cardH = 176;
    const gapX = 16;
    const gapY = 16;
    this.cards.forEach((card, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 30 + col * (cardW + gapX);
      const y = gridTop + row * (cardH + gapY);
      card.box.setPosition(x + cardW / 2, y + cardH / 2).setSize(cardW, cardH);
      card.label.setPosition(x + 14, y + 10);
      card.sub.setPosition(x + 14, y + 50);
      card.desc.setPosition(x + 14, y + 78).setWordWrapWidth(cardW - 28);
      card.status.setPosition(x + 14, y + cardH - 24);
    });

    const progress = this.progressSnapshot || {};
    const completed = this.getCompletedCount();
    const coins = this.getTotalCoins();
    this.infoText.setText(`Completed Levels: ${completed}   |   Wallet Coins: ${coins}   |   ESC: Back to menu`)
      .setPosition(18, h - 10);

    if (this.preview.visible && this.previewText.visible) {
      const pw = Math.min(620, w - 80);
      const ph = Math.min(300, h - 220);
      const px = w * 0.5;
      const py = h * 0.5 + 30;
      this.preview.setSize(pw, ph).setPosition(px, py);
      this.previewText.setPosition(px - pw / 2 + 18, py - ph / 2 + 16).setWordWrapWidth(pw - 36);
    }

    if (progress && Platformer.Debug) {
      Platformer.Debug.log("ExtrasScene.layout", `${w}x${h} category=${this.selectedCategory} cards=${this.cards.length}`);
    }
  }

  shutdown() {
    if (this.onResize) {
      this.scale.off("resize", this.onResize);
      this.onResize = null;
    }
  }
};
