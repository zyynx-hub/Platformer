# Architecture And Decisions (Extracted History)

## High-Impact Architecture Decisions

## 1) Runtime Packaging Pivot
- Decision: move from Electron attempt to Python desktop wrapper.
- Why: Node/npm was unavailable in environment; PyWebView + PyInstaller became the reliable shipping path.
- Impact: native window/fullscreen/update operations moved into `desktop_launcher.py` bridge APIs.

## 2) Modular JS Split
- Decision: split monolithic script into scene/system/core modules.
- Why: frequent feature and bugfix churn made single-file edits unsafe.
- Impact: clearer ownership across `js/scenes`, `js/systems`, `js/core`, and `js/worldmap`.

## 3) Menu-Centric Update UX
- Decision: update controls live in main menu (not gameplay HUD).
- Why: avoid gameplay clutter and accidental update actions mid-run.
- Impact: update status/actions consolidated around menu lifecycle and `UpdateManager`.

## 4) Build-Time Version Stamping
- Decision: auto-generate build version for every build.
- Why: stale cached versions caused confusion and incorrect update state.
- Impact: `scripts/write_build_info.py` + generated `js/core/build-info.js` became authoritative version source.

## 5) Strict Asset Integrity Policy
- Decision: treat key asset/map failures as critical, not cosmetic warnings.
- Why: silent fallback produced misleading "working" builds with broken visuals/gameplay fidelity.
- Impact: stronger validation (`scripts/validate_assets.py`) and explicit critical logs.

## 6) World Map As Data-Driven Layer
- Decision: world map logic and progression moved to dedicated modules/config.
- Why: hardcoded launch paths and unlock behavior produced recurring regressions.
- Impact: clearer map/progression contracts and easier edge/node rule changes.

## 7) Desktop Fullscreen Authority
- Decision: native fullscreen control via pywebview bridge in desktop mode.
- Why: browser fullscreen APIs caused resize/input/layout mismatch in EXE.
- Impact: desktop fullscreen behavior stabilized by host-side APIs and resize sync rules.

## 8) Defensive Scene Lifecycle Handling
- Decision: add stricter listener cleanup and teardown guards.
- Why: repeated crashes from stale callbacks during scene transitions (especially UI/HUD updates).
- Impact: fewer replay/menu-transition crashes and cleaner restart behavior.

## Design Principle That Emerged
- Prefer explicit, observable state transitions over implicit fallback.
- If behavior can fail silently, add logs and terminal statuses so failures become diagnosable.
