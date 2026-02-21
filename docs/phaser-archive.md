# Phaser 3 Build — Archive Summary

> This document describes the abandoned Phaser 3 + PyWebView build. It does not apply to the current Godot 4 project. Kept for historical reference only.

## What It Was

A Phaser 3 browser-based platformer wrapped in Python's PyWebView for desktop distribution, packaged via PyInstaller into a single `.exe`. It had a full scene graph (Boot, Intro, Menu, WorldMap, Game, Options, UI), an in-app updater, and a CI release pipeline to GitHub.

## Why It Was Abandoned

On 2026-02-18, the project was wiped for a blank-slate rebuild in Godot 4. The Phaser build had accumulated too many stability issues (8 stabilization sprints) and the PyWebView/PyInstaller toolchain was fragile.

## Where Legacy Code Lives

- **Source code**: Removed from disk on 2026-02-18. Preserved in git history (search for `js/`, `desktop_launcher.py`, `build_portable_exe.bat`).
- **Documentation**: `docs/archive/phaser/` — all Phaser-era docs (architecture, troubleshooting, ADRs, etc.)
- **Asset source**: `anime-platformer-(4.3)/assets/` — sprites, audio, level JSONs from the abandoned v1 Godot port.

## Lessons Carried Forward

1. **Explicit state over silent fallback** — silent failures caused the hardest bugs. The Godot rebuild logs and guards against implicit failures.
2. **Strict asset validation** — missing assets should be visible errors, not invisible degradation.
3. **Single source of truth for project state** — duplicated status tracking across multiple docs caused drift and confusion.
4. **Separation of collision and visual tiles** — LDtk IntGrid/AutoLayer pattern works well and was kept for Godot.

## Archived Documentation

All Phaser-era docs were moved to `docs/archive/phaser/` on 2026-02-18:
- architecture.md, project-context.md, build-and-release.md, module-ownership.md
- troubleshooting.md, release-checklist.md
- design-decisions.md, known-failure-patterns.md
- release-readiness.md, resolved-issues.md
