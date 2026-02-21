# Release Checklist

Use this checklist before shipping any release. Every item must pass.

## Pre-Build Gates

- [ ] `python scripts/build_js_bundle.py` passes
- [ ] `python scripts/validate_assets.py` passes
- [ ] `cmd /c build_portable_exe.bat` produces a new EXE
- [ ] Build version in `js/core/build-info.js` is updated and monotonic

## Packaged Smoke Test

Run the built EXE and verify these flows:

### Flow A: Full loop
```
Menu -> Play -> WorldMap -> enter level -> return to Menu
```

### Flow B: Replay stability
```
Menu -> Play -> level -> Menu -> Play (verify no blocked transitions)
```

### Flow C: Display mode cycle
Test each mode and verify no UI misalignment or input drift:
- [ ] Windowed
- [ ] Borderless
- [ ] Fullscreen

## Log Health Checks

After the smoke test, verify these signatures are **absent** from `runtime-debug.log`:

- [ ] No `WorldMapView: resize.exec failed`
- [ ] No `UIScene.pause.layout`
- [ ] No `Play ignored: world-map launch already in flight`
- [ ] No `[ERROR]`
- [ ] No `[CRITICAL]`

## Updater Continuity

- [ ] `updater.log` contains healthy sequence (`backup ok`, `replace ok`, `restart launch ok`)
- [ ] No unexpected rollback entries

## Release Artifact Checklist

- [ ] EXE asset attached to GitHub release
- [ ] `.exe.sha256` checksum file attached
- [ ] Release tag follows `YYYY.MM.DD.HHMM` format
- [ ] Release body describes changes

## Post-Release Verification

- [ ] Fresh install of released EXE launches correctly
- [ ] In-app updater detects the new version
- [ ] Menu update status reaches a terminal state (not stuck on "checking")
