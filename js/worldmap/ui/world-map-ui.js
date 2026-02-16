window.Platformer = window.Platformer || {};

Platformer.WorldMapUI = class WorldMapUI {
  constructor(scene) {
    this.scene = scene;
    this.infoPanel = null;
    this.infoTitle = null;
    this.infoBody = null;
    this.hintText = null;
    this.backText = null;
    this.helpButton = null;
    this.helpButtonText = null;
    this.helpPanel = null;
    this.helpPanelText = null;
    this.helpOpen = false;
    this.debugText = null;
    this.resize();
  }

  buildIfMissing() {
    if (this.infoPanel) return;
    this.infoPanel = this.scene.add.rectangle(18, 18, 340, 220, 0x0f172a, 0.82)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x7dd3fc, 0.75)
      .setScrollFactor(0)
      .setDepth(70);
    this.infoTitle = this.scene.add.text(30, 30, "Map Node", {
      fontFamily: "Consolas",
      fontSize: "22px",
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 4,
    }).setDepth(71);
    this.infoTitle.setScrollFactor(0);
    this.infoBody = this.scene.add.text(30, 62, "Walk onto a node.", {
      fontFamily: "Consolas",
      fontSize: "16px",
      color: "#cbd5e1",
      lineSpacing: 4,
      wordWrap: { width: 315 },
    }).setDepth(71);
    this.infoBody.setScrollFactor(0);

    this.hintText = this.scene.add.text(24, 252, "", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#fef3c7",
      stroke: "#0f172a",
      strokeThickness: 4,
    }).setDepth(71);
    this.hintText.setScrollFactor(0);

    this.backText = this.scene.add.text(24, this.scene.scale.height - 34, "ESC: Back to Menu", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#e2e8f0",
      stroke: "#0f172a",
      strokeThickness: 4,
    }).setDepth(71);
    this.backText.setScrollFactor(0);

    this.helpButton = this.scene.add.rectangle(this.scene.scale.width - 85, 34, 132, 34, 0x1d4ed8, 0.96)
      .setStrokeStyle(2, 0x93c5fd, 0.85)
      .setScrollFactor(0)
      .setDepth(72)
      .setInteractive({ useHandCursor: true });
    this.helpButtonText = this.scene.add.text(this.scene.scale.width - 85, 34, "Info (H)", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#f8fafc",
    }).setOrigin(0.5).setDepth(73);
    this.helpButtonText.setScrollFactor(0);
    this.helpButton.on("pointerdown", () => this.toggleHelp());

    this.helpPanel = this.scene.add.rectangle(this.scene.scale.width / 2, this.scene.scale.height / 2, 620, 300, 0x020617, 0.9)
      .setStrokeStyle(2, 0x67e8f9, 0.9)
      .setScrollFactor(0)
      .setDepth(90)
      .setVisible(false)
      .setInteractive();
    this.helpPanelText = this.scene.add.text(this.scene.scale.width / 2 - 290, this.scene.scale.height / 2 - 130,
      "World Map Help\n\n- Move: WASD / Arrow Keys\n- Select node by walking onto it\n- Enter level: E or Enter\n- Back to menu: ESC\n\nNode tips appear per-level when first selected.\nThis panel is optional and never blocks map movement.", {
        fontFamily: "Consolas",
        fontSize: "20px",
        color: "#e2e8f0",
        lineSpacing: 6,
        wordWrap: { width: 570 },
      }).setDepth(91).setVisible(false);
    this.helpPanelText.setScrollFactor(0);
    this.helpPanel.on("pointerdown", () => this.toggleHelp(false));

    this.debugText = this.scene.add.text(this.scene.scale.width - 14, this.scene.scale.height - 14, "", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: "#93c5fd",
      stroke: "#0f172a",
      strokeThickness: 4,
      align: "right",
    }).setOrigin(1, 1).setDepth(71);
    this.debugText.setScrollFactor(0);
  }

  updateNodeInfo(node, best, unlocked, showInteractHint, tutorialHint) {
    this.buildIfMissing();
    if (!node) {
      this.infoTitle.setText("Map Node");
      this.infoBody.setText("Walk onto a node.");
      this.hintText.setText("");
      return;
    }

    const bestCoins = best && Number.isFinite(best.bestCoins) ? best.bestCoins : 0;
    const bestTime = best && Number.isFinite(best.bestTimeLeft) ? best.bestTimeLeft : 0;
    this.infoTitle.setText(`${node.displayName} (${node.levelId})`);
    this.infoBody.setText([
      `Difficulty: ${node.difficulty || "Unknown"}`,
      `State: ${unlocked ? "Unlocked" : "Locked"}`,
      `Best Coins: ${bestCoins}`,
      `Best Time Left: ${bestTime}s`,
      "",
      tutorialHint || "",
    ].join("\n").trim());
    this.reflowInfoPanel();

    if (showInteractHint && unlocked) {
      this.hintText.setText("Press E / ENTER to play this level");
    } else if (!unlocked) {
      this.hintText.setText("Locked: clear required previous node(s)");
    } else {
      this.hintText.setText("");
    }
  }

  setDebug(text) {
    this.buildIfMissing();
    this.debugText.setText(String(text || ""));
  }

  toggleHelp(force) {
    this.buildIfMissing();
    if (typeof force === "boolean") this.helpOpen = force;
    else this.helpOpen = !this.helpOpen;
    this.helpPanel.setVisible(this.helpOpen);
    this.helpPanelText.setVisible(this.helpOpen);
  }

  resize() {
    this.buildIfMissing();
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    this.backText.setPosition(24, h - 34);
    this.helpButton.setPosition(w - 85, 34);
    this.helpButtonText.setPosition(w - 85, 34);
    this.helpPanel.setPosition(w / 2, h / 2);
    this.helpPanelText.setPosition(w / 2 - 290, h / 2 - 130);
    this.debugText.setPosition(w - 14, h - 14);
    this.reflowInfoPanel();
  }

  reflowInfoPanel() {
    if (!this.infoPanel || !this.infoBody || !this.infoTitle || !this.hintText) return;
    const minHeight = 220;
    const padTop = 12;
    const bodyTop = 62;
    const bottomPad = 16;
    const contentBottom = bodyTop + this.infoBody.height + bottomPad;
    const panelHeight = Math.max(minHeight, Math.ceil(contentBottom + padTop));
    this.infoPanel.setSize(this.infoPanel.width, panelHeight);
    this.hintText.setPosition(this.infoPanel.x + 6, this.infoPanel.y + panelHeight + 10);
  }

  destroy() {
    [
      this.infoPanel,
      this.infoTitle,
      this.infoBody,
      this.hintText,
      this.backText,
      this.helpButton,
      this.helpButtonText,
      this.helpPanel,
      this.helpPanelText,
      this.debugText,
    ].forEach((el) => {
      if (el && el.destroy) el.destroy();
    });
  }
};
