# Project Context (From Full Chat History)

## Product Identity
- Project evolved from a Phaser browser platformer prototype into a desktop-distributed game (`AnimePlatformer.exe`) using PyWebView + PyInstaller.
- Current scope is broader than a single level: menu/intro/options/world-map/gameplay/update flow are all first-class features.

## Runtime Model
- Primary runtime: Phaser scenes under `js/`.
- Desktop host/runtime bridge: `desktop_launcher.py`.
- Build outputs are tested as executable builds, not only in-browser runs.

## Core Scene Flow
- Stable flow captured repeatedly in transcript:
  - `BootScene -> IntroScene -> MenuScene -> WorldMapScene -> GameScene (+ UIScene, OptionsScene, ExtrasScene)`
- Menu is operational hub for updates and navigation.
- World map is data-driven and acts as level entry point.

## Project Priorities (Repeated Across Transcript)
- Plug-and-play UX for non-technical players.
- Deterministic behavior and clear fail paths over silent fallback.
- Strong debug logging (`log`, `warn`, `critical`) with actionable messages.
- Fast local iteration + frequent EXE rebuilds for validation.

## Critical Content / Data Dependencies
- Level/map pipeline depends on LDtk and generated JSON.
- Critical assets repeatedly treated as release blockers when missing:
  - `assets/test.ldtk`
  - `assets/Cavernas_by_Adam_Saltsman.png`
  - `assets/IFFY_IDLE.png`
  - `assets/levels/level-ldtk-test.json`

## Persistence Model (Final Direction)
- Gameplay/settings persistence moved away from fragile browser-only assumptions where needed.
- Host-side state is important for desktop consistency:
  - updater and settings behavior are tied to desktop host lifecycle and file paths.

## Canonical Debug/Log Sources
- In-game debug console is first triage surface.
- Host/runtime logs are important for update/restart issues:
  - `updater.log`
  - `runtime-debug.log`
  - helper/update logs near EXE path depending on update flow version.
