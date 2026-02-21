# Project Context

## Product Identity

AnimePlatformer is a Phaser 3 browser-based platformer that evolved into a desktop-distributed game (`AnimePlatformer.exe`). The project scope extends beyond a single level: menu, intro, options, world map, gameplay, and update flow are all first-class features.

## Runtime Model

- **Primary runtime**: Phaser scenes under `js/`
- **Desktop host bridge**: `desktop_launcher.py`
- **Build outputs are tested as executable builds**, not only in-browser runs

## Project Priorities

These priorities emerged consistently throughout development:

1. **Plug-and-play UX** for non-technical players
2. **Deterministic behavior** and clear fail paths over silent fallback
3. **Strong debug logging** (`log`, `warn`, `critical`) with actionable messages
4. **Fast local iteration** with frequent EXE rebuilds for validation

## Critical Content Dependencies

The level/map pipeline depends on LDtk and generated JSON. These assets are treated as release blockers when missing:

- `assets/test.ldtk` -- LDtk project file
- `assets/Cavernas_by_Adam_Saltsman.png` -- tileset spritesheet
- `assets/IFFY_IDLE.png` -- player idle sprite source
- `assets/levels/level-ldtk-test.json` -- generated level data

## Persistence Model

- Gameplay and settings persistence uses the desktop host bridge (not fragile browser-only localStorage)
- Host-side state is important for desktop consistency:
  - Updater behavior tied to desktop host lifecycle and file paths
  - Settings behavior tied to `settings.json` via PyWebView bridge

## Debug and Log Sources

| Source | Purpose |
|---|---|
| In-game debug console | First triage surface |
| `runtime-debug.log` | Runtime scene flow, startup, errors |
| `updater.log` | Update check/apply/restart sequence |
| `%LOCALAPPDATA%\AnimePlatformer\update_state.json` | Pending update markers |
