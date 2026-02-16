# Troubleshooting Playbook

## Quick Triage Order
1. Check in-game debug panel for first `WARN`/`CRITICAL` before cascades.
2. Check `updater.log` in repo root for update helper flow.
3. Check `runtime-debug.log` for startup/scene transitions.
4. Verify critical assets exist and are non-empty:
   - `assets/test.ldtk`
   - `assets/Cavernas_by_Adam_Saltsman.png`
   - `assets/IFFY_IDLE.png`
   - `assets/levels/level-ldtk-test.json`

## Update Issues

### Symptom
Update says available, helper starts, but app does not relaunch.

### Checks
- In `updater.log`, confirm sequence:
  - `backup ok`
  - `replace ok`
  - `restart launch ok`
- If replace retries with `err=1`, old process/file lock existed briefly.
- If relaunch fails, confirm target path still exists and EXE not quarantined.

### Action
- Re-run update from menu once after verifying old process is closed.
- If reproducible, capture full `updater.log` block and PID lines.

## Asset/Map Breakage

### Symptom
Fallbacks triggered for map/sprite and game looks wrong.

### Meaning
- Treat as release-blocking. This is a content integrity failure.

### Action
- Run:
  - `python scripts/validate_assets.py`
- Rebuild:
  - `python scripts/build_js_bundle.py`
  - `cmd /c build_portable_exe.bat`
- Verify `BootScene` logs no critical missing asset events.

## Idle Sprite Critical

### Symptom
`[CRITICAL] player-idle-sheet missing, using fallback idle textures.`

### Root cause candidates
- `player-idle-raw` not loaded.
- `addSpriteSheet` failed from source image.

### Current mitigation
- `BootScene` now builds `player-idle-sheet` from generated fallback idle textures when source path fails.

### If still happening
- Capture:
  - exact `BootScene.playerIdle` lines before `GameScene` starts.

## LDtk Visual mismatch

### Symptom
Collision map works, but visuals do not match LDtk editor.

### Checks
- `ldtk-cavernas` texture loaded.
- Tile size/grid assumptions match export.
- Auto-layer render path executed (`Rendered LDtk auto tiles: N` log).

### Action
- Re-run converter on latest LDtk file:
  - `python scripts/convert_ldtk_to_level_json.py --in assets/test.ldtk --out assets/levels/level-ldtk-test.json`

## Reporting Template
Always report with:
- Timestamp
- Source
- Full message block
- Screenshot if visual mismatch
- Last 30 lines around first error/warn
