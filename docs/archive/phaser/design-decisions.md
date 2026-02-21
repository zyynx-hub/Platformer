# Design Decisions

This document captures the major architectural decisions made during development, the reasoning behind them, and their impact.

## ADR-001: PyWebView + PyInstaller Over Electron

**Context**: the project needed a desktop distribution path for a browser-based Phaser game. Electron was the natural choice, but Node/npm was unavailable in the development environment.

**Decision**: use Python's PyWebView for the native window and PyInstaller for packaging.

**Impact**: native window/fullscreen/update operations moved into `desktop_launcher.py` bridge APIs. The Python host became responsible for settings I/O, update lifecycle, and display mode management.

## ADR-002: Modular JS Split

**Context**: the game was originally a monolithic script. Frequent feature and bugfix churn made single-file edits unsafe and hard to review.

**Decision**: split into `js/scenes/`, `js/systems/`, `js/core/`, and `js/worldmap/` modules.

**Impact**: clearer ownership boundaries. Each directory has a defined responsibility. Changes to gameplay don't risk breaking the updater, and vice versa.

## ADR-003: Menu-Centric Update UX

**Context**: update controls needed a home in the UI. Placing them in the gameplay HUD would create clutter and risk accidental update actions mid-run.

**Decision**: consolidate update status and actions in the main menu, managed by `UpdateManager`.

**Impact**: update lifecycle is tied to menu scene lifecycle. Users check for and apply updates before entering gameplay.

## ADR-004: Build-Time Version Stamping

**Context**: stale cached versions caused confusion and incorrect update state. Manual version management was error-prone.

**Decision**: auto-generate build version for every build via `scripts/write_build_info.py` into `js/core/build-info.js`.

**Impact**: `build-info.js` became the authoritative version source. Updater checks compare against this stamp. Version format: `YYYY.MM.DD.HHMM`.

## ADR-005: Strict Asset Integrity Policy

**Context**: silent fallback on missing assets produced misleading "working" builds with broken visuals and degraded gameplay.

**Decision**: treat key asset/map failures as critical errors, not cosmetic warnings.

**Impact**: `scripts/validate_assets.py` gates the build. Boot scene logs critical failures for required assets. Missing assets block releases.

## ADR-006: Data-Driven World Map

**Context**: hardcoded launch paths and unlock behavior produced recurring regressions. Every code change risked breaking level routing.

**Decision**: move world-map logic and progression to dedicated modules with config-driven node/path data.

**Impact**: clearer map/progression contracts. Level routing uses explicit `gameLevel` mapping. Node rules are defined in JSON config, not scattered through code.

## ADR-007: Native Fullscreen Authority

**Context**: browser fullscreen APIs caused resize/input/layout mismatch when running inside the desktop wrapper.

**Decision**: use native fullscreen control via PyWebView bridge for desktop mode.

**Impact**: desktop fullscreen behavior is managed by the host, not the browser. Resize sync is handled through native window events.

## ADR-008: Defensive Scene Lifecycle

**Context**: repeated crashes during scene transitions caused by stale listener registrations and HUD update callbacks firing after teardown.

**Decision**: add strict listener cleanup and teardown guards in all scene shutdown paths.

**Impact**: fewer replay/menu-transition crashes. Scene shutdown methods now use shared cleanup helpers (`removeTimer`, `destroyRef`, `stopNativeViewportPolling`, etc.).

## ADR-009: Localhost HTTP Content Serving

**Context**: the packaged build originally used `file://` URLs, which caused CORS and origin restrictions when loading JSON, audio, and image assets.

**Decision**: serve packaged content via a localhost HTTP server from the `_MEIPASS` root before creating the webview window.

**Impact**: all asset loading works identically in development and packaged builds. This fixed critical boot failures (OI-004, OI-005, OI-006).

## Overarching Design Principle

**Prefer explicit, observable state transitions over implicit fallback.** If behavior can fail silently, add logs and terminal statuses so failures become diagnosable. Silent fallback is the root cause of the hardest bugs in this project's history.
