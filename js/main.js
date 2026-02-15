window.Platformer = window.Platformer || {};

(async () => {
  if (!Platformer.BUILD_VERSION || typeof Platformer.BUILD_VERSION !== "string") {
    document.body.innerHTML = "<div style='font-family:Consolas,monospace;padding:24px;color:#fee2e2;background:#1f2937'>Build metadata missing. Rebuild the game package.</div>";
    throw new Error("BUILD_VERSION missing.");
  }
  await Platformer.Settings.bootstrap();
  const { PLAYER } = Platformer.Config;
  const settings = Platformer.Settings.current;
  const fpsTarget = settings.video.fpsCap === "unlimited" ? 0 : Number(settings.video.fpsCap);
  const isFileProtocol = window.location.protocol === "file:";
  const isDesktopHost = !!(window.pywebview && window.pywebview.api);
  const dpr = Math.max(1, Math.min(2, Math.round((window.devicePixelRatio || 1) * 100) / 100));
  const getViewportSize = () => {
    const root = document.getElementById("game-root");
    const rootW = root && root.clientWidth ? root.clientWidth : 0;
    const rootH = root && root.clientHeight ? root.clientHeight : 0;
    const docW = document.documentElement && document.documentElement.clientWidth ? document.documentElement.clientWidth : 0;
    const docH = document.documentElement && document.documentElement.clientHeight ? document.documentElement.clientHeight : 0;
    const w = Math.max(rootW, docW, 640);
    const h = Math.max(rootH, docH, 360);
    return { w, h };
  };
  const initial = getViewportSize();
  Platformer.Debug.init();
  if (Platformer.BUILD_VERSION) {
    Platformer.Debug.log("Build", `version=${Platformer.BUILD_VERSION} time=${Platformer.BUILD_TIME_UTC || "n/a"}`);
  }
  if (isFileProtocol && !isDesktopHost) Platformer.Debug.log("Runtime", "file:// mode detected.");
  if (isDesktopHost) Platformer.Debug.log("Runtime", "Desktop host mode detected.");

  const SafeBootScene = Platformer.wrapSceneSafety(Platformer.BootScene, "BootScene");
  const SafeMenuScene = Platformer.wrapSceneSafety(Platformer.MenuScene, "MenuScene");
  const SafeIntroScene = Platformer.wrapSceneSafety(Platformer.IntroScene, "IntroScene");
  const SafeOptionsScene = Platformer.wrapSceneSafety(Platformer.OptionsScene, "OptionsScene");
  const SafeGameScene = Platformer.wrapSceneSafety(Platformer.GameScene, "GameScene");
  const SafeUIScene = Platformer.wrapSceneSafety(Platformer.UIScene, "UIScene");

  const config = {
    type: Phaser.AUTO,
    width: initial.w,
    height: initial.h,
    parent: "game-root",
    pixelArt: settings.video.pixelPerfect,
    resolution: dpr,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: initial.w,
      height: initial.h,
      zoom: 1,
    },
    backgroundColor: "#7dd3fc",
    autoRound: true,
    render: {
      antialias: false,
      antialiasGL: false,
      pixelArt: true,
      roundPixels: true,
      powerPreference: "high-performance",
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: PLAYER.gravity },
        debug: false,
      },
    },
    fps: {
      target: fpsTarget || 60,
      forceSetTimeOut: !settings.video.vsync,
    },
    dom: {
      createContainer: true,
    },
    scene: [
      SafeBootScene,
      SafeMenuScene,
      SafeIntroScene,
      SafeOptionsScene,
      SafeGameScene,
      SafeUIScene,
    ],
  };

  const game = new Phaser.Game(config);
  window.AnimePlatformerGame = {
    play() { if (game && game.scene) game.scene.resume("GameScene"); },
    pause() { if (game && game.scene) game.scene.pause("GameScene"); },
    settings() { return Platformer.Settings.current; },
  };
  Platformer.Debug.attachGameMonitors(game);
  let lastW = initial.w;
  let lastH = initial.h;

  const applySize = (wRaw, hRaw, source = "window") => {
    const vp = getViewportSize();
    const w = Math.max(640, Number(wRaw) || vp.w);
    const h = Math.max(360, Number(hRaw) || vp.h);
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    Platformer.Debug.log("ResizeSync", `${source} -> ${w}x${h}`);

    if (game && game.scale) {
      game.scale.resize(w, h);
      if (typeof game.scale.refresh === "function") {
        game.scale.refresh();
      }
      if (game.input && game.input.manager && typeof game.input.manager.resize === "function") {
        game.input.manager.resize(w, h);
      }
    }
  };
  const syncGameSize = () => {
    const vp = getViewportSize();
    applySize(vp.w, vp.h, "viewport");
  };

  window.addEventListener("resize", syncGameSize);
  window.addEventListener("orientationchange", syncGameSize);
  window.addEventListener("online", () => {
    const scene = game && game.scene ? game.scene.getScene("MenuScene") : null;
    if (scene && typeof scene.autoCheckUpdatesForBottomLeft === "function") {
      scene.autoCheckUpdatesForBottomLeft();
    }
  });
  // Keep a lightweight heartbeat for wrappers that occasionally miss resize events.
  setInterval(syncGameSize, 500);

  if (settings.video.fullscreen) {
    game.events.once("ready", () => {
      if (!game.scale.isFullscreen) {
        game.scale.startFullscreen();
      }
    });
  }
})();


