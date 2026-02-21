# Troubleshooting Playbook

## Quick Triage Order

1. Check in-game debug panel for first `WARN` or `CRITICAL`
2. Check `updater.log` for update helper sequence health
3. Check `runtime-debug.log` for startup/scene flow errors
4. Confirm launcher content mode:
   - Expect `Launcher.http: Serving content root via localhost` in packaged runs
5. Check `%LOCALAPPDATA%\AnimePlatformer\update_state.json` for pending markers
6. Confirm critical assets exist and are non-empty

## By Symptom

### App crashes on startup
1. Check `runtime-debug.log` for asset load failures
2. Run `python scripts/validate_assets.py` to verify asset integrity
3. Check if JS bundle is stale: rebuild with `python scripts/build_js_bundle.py`
4. Verify localhost content server started (look for `Launcher.http` log)

### Update downloads but app doesn't relaunch
1. Check `updater.log` for the full sequence: `backup ok -> replace ok -> restart launch ok`
2. Look for `replace retry ... err=1` (file lock contention -- transient if followed by `replace ok`)
3. Verify the helper script launched successfully
4. Check if old process terminated cleanly

### Stuck "Checking for updates"
1. Check if update check callback reached a terminal state
2. Look for bounded retry exhaustion in logs
3. Verify GitHub API isn't rate-limited (unauthenticated requests)
4. Confirm release artifact exists for the target tag

### Missing sprites or broken visuals
1. Check boot logs for `Missing player sprite asset` or `Failed to load` messages
2. Verify `assets/IFFY_IDLE.png` and `assets/Cavernas_by_Adam_Saltsman.png` exist
3. Confirm content is served via HTTP (not `file://`)
4. Rebuild: `python scripts/build_js_bundle.py` then `cmd /c build_portable_exe.bat`

### Wrong level loads or world map routing broken
1. Check for `WorldMap.route` CRITICAL diagnostics in logs
2. Verify `assets/levels/level-ldtk-test.json` exists and is valid
3. Check world-map node config: `js/level/world_tutorial/nodes.json`
4. Look for `WorldMapView: resize.exec failed` (particle null dereference)

### Display mode / UI misalignment
1. Check startup mode log: `Launcher: Startup display target: <WxH> mode=<mode>`
2. Verify `Scale.resize` values align to selected mode
3. Check for `UIScene.pause.layout` warnings (stale button references)
4. Test across windowed/borderless/fullscreen transitions

### Settings don't persist across restarts
1. Check if settings are being read from host-side `settings.json` (not just localStorage)
2. Look for corruption fallback warnings in runtime logs
3. Verify `desktop_launcher.py` bridge is reading/writing settings correctly

## Reporting Template

```
- Timestamp:
- Subsystem: [updater / boot / gameplay / world-map / UI / settings / build]
- Source log and relevant lines:
- Repro steps:
- Expected:
- Actual:
```
