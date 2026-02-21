# Release-Readiness Matrix

Last updated: 2026-02-17

## Purpose

This matrix records the current go/no-go state of each release gate area.
Update the **Status** and **Last Verified** columns after every candidate build.

---

## Gate Areas

| Area | Gate Criteria | Check Method | Status | Last Verified |
|---|---|---|---|---|
| JS bundle | `js/app.bundle.js` present and non-empty | `python scripts/smoke_check.py` | PASS | 2026-02-17 |
| Build version | Format `YYYY.MM.DD.HHMM`, monotonic | `python scripts/smoke_check.py` | PASS | 2026-02-17 |
| Asset integrity | All required assets present and valid; integrity manifest written | `python scripts/validate_assets.py` | PASS | 2026-02-17 |
| LDtk level pipeline | `assets/test.ldtk` + `assets/levels/level-ldtk-test.json` structurally valid and consistent | `python scripts/validate_assets.py` | PASS | 2026-02-17 |
| Docs path references | No broken path refs in `docs/**/*.md` (archive excluded) | `python scripts/docs/validate_links.py` | PASS | 2026-02-17 |
| Log health (post-EXE) | No `[ERROR]`, `[CRITICAL]`, or known-bad signatures in `runtime-debug.log` | `python scripts/smoke_check.py --log runtime-debug.log` | PENDING (needs fresh run) | -- |
| Flow A -- Full loop | Menu -> Play -> WorldMap -> Level -> Menu completes without error | Manual (EXE smoke) | PENDING | -- |
| Flow B -- Replay stability | Second Play launch after returning to menu does not block | Manual (EXE smoke) | PENDING | -- |
| Flow C -- Display modes | Windowed / Borderless / Fullscreen all align correctly | Manual (EXE smoke) | PENDING | -- |
| Flow D -- Updater status | Update check reaches terminal state within 15 s | Manual (EXE smoke) | PENDING | -- |
| Release artifact | EXE + `.exe.sha256` present in GitHub release | CI publish output | PENDING (next release) | -- |
| Updater continuity | `updater.log` shows healthy sequence on apply cycle | `updater.log` inspection | PASS | 2026-02-17 |

---

## Automated Gate Script

Run before every packaged build attempt:

```
python scripts/smoke_check.py
```

Run after a packaged EXE smoke session:

```
python scripts/smoke_check.py --log runtime-debug.log
```

---

## Last Known-Good Build

- **Build**: `2026.02.17.1106`
- **Tag**: `sprint7-2026.02.17`
- **Open issues**: 0
- **Automated gate result**: PASS (all 5 automated checks)
- **Manual smoke**: Not recorded for this build cycle (Sprint 8 target: record one clean pass before exit)

---

## How to Update This Matrix

After each smoke session:
1. Run `python scripts/smoke_check.py --log runtime-debug.log` and record result
2. Update Status and Last Verified for each gate area completed
3. Update the "Last Known-Good Build" section if all gates pass
4. Commit the updated matrix with the build tag

---

## PENDING Gate Resolution Plan

The PENDING rows require one complete packaged EXE smoke session:
1. Build EXE: `cmd /c build_portable_exe.bat`
2. Launch EXE, run Flows A-D from the runbook
3. Close EXE
4. Run: `python scripts/smoke_check.py --log runtime-debug.log`
5. Update all PENDING rows with result and date
