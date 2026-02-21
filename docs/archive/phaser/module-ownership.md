# Module Ownership

This document maps each subsystem to its primary code paths and evidence sources.

## Runtime

**Scope**: runtime bootstrap, scene registration, and top-level game flow.

| Primary Files |
|---|
| `js/main.js` |
| `js/scenes/boot-scene.js` |
| `js/scenes/intro-scene.js` |
| `js/scenes/menu-scene.js` |
| `js/scenes/world-map-scene.js` |
| `js/scenes/game-scene.js` |
| `js/scenes/ui-scene.js` |

**Evidence**: `runtime-debug.log`, in-game debug panel

## Gameplay

**Scope**: core player movement, combat, collision, hazards, and level behavior.

| Primary Files |
|---|
| `js/scenes/game-scene.js` |
| `js/systems/jetpack.js` |
| `js/core/constants.js` |

**Data inputs**: `assets/test.ldtk`, `assets/levels/level-ldtk-test.json`, `assets/Cavernas_by_Adam_Saltsman.png`, `assets/IFFY_IDLE.png`

## World Map

**Scope**: world navigation graph, node routing, unlock rules, resize/layout, and level launch.

| Primary Files |
|---|
| `js/scenes/world-map-scene.js` |
| `js/worldmap/WorldMapManager.js` |
| `js/worldmap/WorldMapView.js` |
| `js/worldmap/controller/player-map-controller.js` |
| `js/worldmap/progress/progress-manager.js` |
| `js/worldmap/data/world-map-data.js` |
| `js/level/world_tutorial/world.config.json` |
| `js/level/world_tutorial/nodes.json` |

## UI and Options

**Scope**: menu widgets, options panels, UI overlays, and display-mode controls.

| Primary Files |
|---|
| `js/scenes/menu-scene.js` |
| `js/scenes/options-scene.js` |
| `js/scenes/ui-scene.js` |
| `js/core/debug.js` |

**Dependencies**: settings persistence, updater widget

## Settings

**Scope**: settings load/save, defaults, and host/runtime persistence.

| Primary Files |
|---|
| `js/core/settings.js` |
| `js/scenes/options-scene.js` |
| `desktop_launcher.py` |

**Persistence surfaces**: browser localStorage (webview), host `settings.json`, `%LOCALAPPDATA%\AnimePlatformer\update_state.json`

## Updater

**Scope**: GitHub release check, download, apply, relaunch, and health/rollback handling.

| Primary Files |
|---|
| `desktop_launcher.py` |
| `js/core/updater.js` |
| `js/systems/update-manager.js` |
| `js/scenes/menu-scene.js` |

**Evidence**: `updater.log`, `runtime-debug.log`, `%LOCALAPPDATA%\AnimePlatformer\update_state.json`

## Asset Pipeline

**Scope**: critical asset validation, LDtk conversion, and packaging-time integrity.

| Primary Files |
|---|
| `scripts/validate_assets.py` |
| `scripts/convert_ldtk_to_level_json.py` |
| `scripts/build_js_bundle.py` |

**Gate rule**: missing critical assets are release-blocking.

## Build and Release

**Scope**: local build flow, release artifact publication, and version cadence.

| Primary Files |
|---|
| `build_portable_exe.bat` |
| `AnimePlatformer.spec` |
| `scripts/build_js_bundle.py` |
| `scripts/write_build_info.py` |
| `scripts/publish_github_release.py` |
| `.github/workflows/release.yml` |
