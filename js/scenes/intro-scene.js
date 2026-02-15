window.Platformer = window.Platformer || {};

Platformer.IntroScene = class extends Phaser.Scene {
  constructor() {
    super("IntroScene");
    this.slideIndex = 0;
    this.slides = [];
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const textScale = Platformer.Settings.textScale();

    this.slides = [
      {
        title: "Mission Briefing",
        body: "Complete 4 levels by collecting 10 coins each.\nBeat the timer and use checkpoints to survive.",
      },
      {
        title: "Hazards + Enemies",
        body: "Laser turrets launch fireballs.\nEnemy types per level: Walker, Hopper, Dasher, Tank.\nStomp enemies from above to defeat.",
      },
      {
        title: "Controls",
        body: "Move: Left/Right\nJump: Jump key (rebindable)\nDash: Dash key (burst + enemy break)\nAttack: Attack key (close-range hit)\nPause: Pause key\nTip: F2 = demo instant win",
      },
      {
        title: "Coin Rewards",
        body: "3 Coins: +1 Health\n6 Coins: +12s Time\n9 Coins: +1 Shield block\n10 Coins: Level clear",
      },
    ];

    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x020617, 0.55);

    this.add.text(cx, 70, "LEVEL PREVIEW", {
      fontFamily: "Verdana",
      fontSize: `${Math.round(42 * textScale)}px`,
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.panel = this.add.rectangle(cx, cy + 10, 760, 320, 0x0f172a, 0.58)
      .setStrokeStyle(2, 0x94a3b8, 0.9);

    this.titleText = this.add.text(cx, cy - 86, "", {
      fontFamily: "Verdana",
      fontSize: `${Math.round(34 * textScale)}px`,
      color: "#f8fafc",
      stroke: "#111827",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.bodyText = this.add.text(cx, cy - 4, "", {
      fontFamily: "Consolas",
      fontSize: `${Math.round(24 * textScale)}px`,
      color: "#e2e8f0",
      align: "center",
      lineSpacing: 10,
    }).setOrigin(0.5);

    this.pageText = this.add.text(cx - 340, cy + 136, "", {
      fontFamily: "Consolas",
      fontSize: `${Math.round(18 * textScale)}px`,
      color: "#cbd5e1",
    }).setOrigin(0, 0.5);

    this.nextBtn = this.add.rectangle(cx + 280, cy + 136, 170, 44, 0x1d4ed8, 0.98)
      .setStrokeStyle(2, 0x93c5fd)
      .setInteractive({ useHandCursor: true });
    this.nextBtnText = this.add.text(cx + 280, cy + 136, "Next >", {
      fontFamily: "Consolas",
      fontSize: `${Math.round(25 * textScale)}px`,
      color: "#f8fafc",
    }).setOrigin(0.5);

    this.skipBtn = this.add.rectangle(cx + 90, cy + 136, 140, 44, 0x475569, 0.96)
      .setStrokeStyle(2, 0x94a3b8)
      .setInteractive({ useHandCursor: true });
    this.skipText = this.add.text(cx + 90, cy + 136, "Skip", {
      fontFamily: "Consolas",
      fontSize: `${Math.round(24 * textScale)}px`,
      color: "#f8fafc",
    }).setOrigin(0.5);

    this.nextBtn.on("pointerdown", () => this.next());
    this.skipBtn.on("pointerdown", () => this.startGame());

    this.input.keyboard.on("keydown-ENTER", () => this.next());
    this.input.keyboard.on("keydown-SPACE", () => this.next());
    this.input.keyboard.on("keydown-ESC", () => this.scene.start("MenuScene"));

    this.renderSlide();
  }

  renderSlide() {
    const s = this.slides[this.slideIndex];
    this.titleText.setText(s.title);
    this.bodyText.setText(s.body);
    this.pageText.setText(`Preview ${this.slideIndex + 1}/${this.slides.length}`);

    const isLast = this.slideIndex === this.slides.length - 1;
    this.nextBtn.setFillStyle(isLast ? 0x16a34a : 0x1d4ed8, 0.98);
    this.nextBtnText.setText(isLast ? "Start Game" : "Next >");
  }

  next() {
    if (this.slideIndex < this.slides.length - 1) {
      this.slideIndex += 1;
      this.renderSlide();
      return;
    }
    this.startGame();
  }

  startGame() {
    Platformer.Settings.current.convenience.introSeen = true;
    Platformer.Settings.save();

    Platformer.beeper.unlock();
    const difficulty = Platformer.Settings.current.gameplay.difficulty;
    const baseLives = difficulty === "easy" ? 3 : (difficulty === "hard" ? 1 : 2);

    if (this.scene.isActive("UIScene") || this.scene.isPaused("UIScene")) {
      this.scene.stop("UIScene");
    }
    if (this.scene.isActive("GameScene") || this.scene.isPaused("GameScene")) {
      this.scene.stop("GameScene");
    }

    this.registry.set("coins", 0);
    this.registry.set("health", 3);
    this.registry.set("lives", baseLives);
    this.registry.set("level", 1);
    this.scene.start("GameScene", { level: 1 });
    this.scene.launch("UIScene");
  }
};
