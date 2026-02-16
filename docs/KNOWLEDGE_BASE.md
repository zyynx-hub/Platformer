# Knowledge Base

## Architecture Map
- Entry: `js/main.js`
- Core:
  - `js/core/constants.js`
  - `js/core/settings.js`
  - `js/core/debug.js`
  - `js/core/updater.js`
  - `js/core/build-info.js` (generated)
- Scenes:
  - `js/scenes/boot-scene.js`
  - `js/scenes/intro-scene.js`
  - `js/scenes/menu-scene.js`
  - `js/scenes/world-map-scene.js`
  - `js/scenes/game-scene.js`
  - `js/scenes/ui-scene.js`
  - `js/scenes/options-scene.js`
  - `js/scenes/extras-scene.js`
- Systems:
  - `js/systems/update-manager.js`
  - `js/systems/jetpack.js`
- World map modules:
  - `js/worldmap/WorldMapManager.js`
  - `js/worldmap/WorldMapView.js`
  - `js/worldmap/controller/player-map-controller.js`
  - `js/worldmap/progress/progress-manager.js`
  - `js/worldmap/nodes/level-node.js`
  - `js/worldmap/ui/world-map-ui.js`
  - `js/worldmap/ui/shop-panel.js`

## Data and Content Sources
- LDtk project: `assets/test.ldtk`
- Tileset: `assets/Cavernas_by_Adam_Saltsman.png`
- Converted fallback JSON: `assets/levels/level-ldtk-test.json`
- World/tutorial graph:
  - `js/level/world_tutorial/world.config.json`
  - `js/level/world_tutorial/nodes.json`

## Build/Release Knowledge
- JS bundle script: `scripts/build_js_bundle.py`
- Asset gate: `scripts/validate_assets.py`
- Build metadata: `scripts/write_build_info.py`
- Publish script: `scripts/publish_github_release.py`
- Full build: `build_portable_exe.bat`

## Persistent Storage
- Game settings/progress: browser localStorage through PyWebView context.
- Host-side updater state:
  - `%LOCALAPPDATA%\AnimePlatformer\update_state.json`
- Updater process logs:
  - repo root `updater.log`

## Update Logic Summary
- Auto-check runs periodically in menu.
- Manual check via Update button.
- Version compare uses generated build version string.
- If remote release newer:
  - download EXE
  - spawn helper script
  - close old process
  - backup + replace EXE
  - relaunch

## Debugging Conventions
- `Platformer.Debug.log(...)` for lifecycle.
- `Platformer.Debug.warn(...)` for recoverable issues.
- `Platformer.Debug.critical(...)` for content-breaking issues (missing maps/sprites/fallbacks).
- User-facing copy block format is supported and should be preserved.

## Common Root Causes (Observed)
- `player-idle-sheet missing`:
  - `IFFY_IDLE` not loaded or spritesheet generation failed.
  - Mitigation: Boot fallback idle sheet generation + asset validation.
- `Missing cached ldtk-test JSON`:
  - LDtk not loaded in cache at scene creation time.
  - Mitigation: critical log + deterministic fallback level.
- Menu music fallback warnings:
  - audio cache key unavailable/failed load.
  - Mitigation: HTML audio fallback is expected recovery path.
- Update stuck in “checking”:
  - status callback path not finalizing on one branch.
  - Mitigation: force terminal status update in menu update manager.

## Safety Rules
- Do not silently downgrade visuals/content when critical assets are missing.
- Always rebuild bundle before packaging EXE.
- Keep version monotonic for release-based updates.
