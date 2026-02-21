# Architecture

## System Overview

AnimePlatformer is a Phaser 3 side-scrolling platformer that runs as a desktop application. The browser-based game engine is hosted inside a Python desktop wrapper using PyWebView, and the entire application is packaged into a single portable executable via PyInstaller.

## Runtime Architecture

```
┌─────────────────────────────────────────────┐
│  desktop_launcher.py (PyWebView host)       │
│  ┌───────────────────────────────────────┐  │
│  │  Localhost HTTP server (_MEIPASS root) │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  Phaser 3 Game (js/)            │  │  │
│  │  │  Scenes / Systems / Core        │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

- **Desktop host** (`desktop_launcher.py`): manages window modes, updater lifecycle, host-side settings I/O, and the localhost HTTP content server
- **Content server**: serves extracted game assets via HTTP to avoid `file://` origin restrictions in the packaged build
- **Phaser runtime** (`js/`): all game logic -- scenes, systems, core utilities, and world-map domain

## Scene Flow

```
BootScene -> IntroScene -> MenuScene -> WorldMapScene -> GameScene
                              │                            │
                              ├── OptionsScene             ├── UIScene
                              └── ExtrasScene              └── (pause overlay)
```

- **BootScene**: asset loading, critical validation, fallback sprite generation
- **IntroScene**: splash/intro sequence
- **MenuScene**: main hub -- play, options, update controls, extras
- **WorldMapScene**: data-driven level selection with node/path graph
- **GameScene**: core platformer gameplay with physics, enemies, hazards
- **UIScene**: HUD overlay running parallel to GameScene
- **OptionsScene**: settings panel (video, audio, controls, debug)

## Module Boundaries

| Directory | Responsibility |
|---|---|
| `js/core/` | Platform-agnostic primitives, shared config, state contracts |
| `js/systems/` | Reusable gameplay/runtime services (jetpack, update manager) |
| `js/scenes/` | Scene lifecycle, UI wiring, transition guards |
| `js/worldmap/` | World-map domain: data, view, controllers, progression |
| `scripts/` | Build/release/docs automation only |
| `desktop_launcher.py` | Desktop host bridge |

## Data Flow

### Content Pipeline
```
LDtk editor -> assets/test.ldtk -> scripts/convert_ldtk_to_level_json.py -> assets/levels/level-ldtk-test.json
                                                                                    │
JS source files -> scripts/build_js_bundle.py -> js/app.bundle.js                  │
                                                       │                            │
All assets + bundle ──────────────────> build_portable_exe.bat -> AnimePlatformer.exe
```

### Update Pipeline
```
GitHub Release (tag + EXE + SHA256)
       │
       ▼
UpdateManager.check() -> download -> verify checksum -> apply (helper script) -> restart
       │                                                                            │
       └── updater.log ◄──────────────────────────────────────────────────────────┘
```

## Persistence Model

- **Game settings**: host-side `settings.json` via PyWebView bridge (not browser localStorage)
- **Update state**: `%LOCALAPPDATA%\AnimePlatformer\update_state.json`
- **World-map progression**: managed through game state in Phaser

## Key Architectural Decisions

See [Design Decisions](../explanation/design-decisions.md) for the full rationale behind each of these choices:

1. PyWebView + PyInstaller over Electron (environment constraints)
2. Modular JS split into core/systems/scenes/worldmap
3. Menu-centric update UX (not gameplay HUD)
4. Build-time version stamping for updater integrity
5. Strict asset integrity policy (critical failures, not cosmetic warnings)
6. Data-driven world map with explicit level routing
7. Native fullscreen via pywebview bridge (not browser API)
8. Defensive scene lifecycle with strict listener cleanup
9. Localhost HTTP content serving for packaged builds
