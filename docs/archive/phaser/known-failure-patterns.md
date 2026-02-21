# Known Failure Patterns

A distilled failure history from the project. Use this as a regression checklist before introducing changes to any of these subsystems.

## Update / Relaunch Failures

**Symptom**: update downloads but app does not relaunch.

**Recurring causes**:
- Old process not terminating cleanly (file lock / PID handoff)
- Fragile helper restart strategy (single-shot or blocking wait)
- Status flow not reaching terminal UI states

**Fix patterns**: retry-based restart/apply logic, hardened helper script, better updater logging and status propagation.

## Stuck "Checking for updates"

**Symptom**: UI remains in checking state indefinitely.

**Recurring causes**:
- Skipped or suppressed auto-check branch
- Callback/status not finalized in one control path
- Retry loop without bounded terminal state

**Fix patterns**: bounded retries + explicit end statuses, corrected guard logic around check timing.

## GitHub Release Pipeline Breakage

**Symptom**: CI release job fails or assets unavailable.

**Recurring causes**:
- Python/tooling mismatch (pythonnet/pywebview CI compatibility)
- Missing or delayed release assets vs tag creation timing
- API rate-limit from unauthenticated checks

**Fix patterns**: pin stable toolchain versions, ensure release body/assets are explicit, add rate-limit fallback handling.

## Critical Sprite Missing (`player-idle-sheet`)

**Symptom**: missing idle sheet warning/critical and fallback visuals.

**Recurring causes**:
- `IFFY_IDLE.png` load failure (including `file://` CORS behavior)
- Spritesheet generation path not guaranteed on failure

**Fix patterns**: guaranteed BootScene fallback sheet, asset validation gate marking idle source as required.

## Fullscreen / Resize / Input Misalignment

**Symptom**: blurry UI, shifted click targets, exposed margins, bad scaling.

**Recurring causes**:
- Mixed sizing authorities (window vs host vs manual canvas CSS)
- Browser fullscreen usage inside desktop host
- DPI/scale mismatch paths

**Fix patterns**: native fullscreen authority for desktop, single resize authority, avoid conflicting manual canvas sizing.

## Scene Lifecycle Crashes

**Symptom**: crashes during replay/menu transitions.

**Recurring causes**:
- Stale listener registrations surviving scene shutdown
- HUD update callbacks firing after UI teardown

**Fix patterns**: strict listener registration/unregistration, null/disposal guards, shared cleanup helpers in shutdown.

## Menu -> WorldMap Transition Guard (OI-007)

**Symptom**: after `Menu -> Play -> level -> Menu -> Play`, Play is blocked with `Play ignored: world-map launch already in flight`.

**Root cause**: transition guard flag persisted across scene reuse; success path didn't reset the guard on subsequent `MenuScene` starts.

**Fix**: reset one-shot transition guards in `init()` for reused scenes.

## World-Map Resize Particle Null Dereference (OI-008)

**Symptom**: `WorldMapView: resize.exec failed: TypeError: Cannot read properties of null (reading 'accelerationX')`.

**Root cause**: resize path called particle manager `setConfig` during transition timing when emitter internals were invalid/null.

**Fix**: guarded bounds-aware particle-manager rebuild instead of resize-time `setConfig`.

## Settings Persistence Resets

**Symptom**: options/audio/hitbox settings revert between launches.

**Recurring causes**:
- localStorage origin instability in EXE context
- Hard cap/fallback behavior replacing saved settings

**Fix patterns**: host-backed persistent settings path, removal of destructive size-cap fallback.

## World Map / Level Routing Regressions

**Symptom**: wrong level launch, misdrawn paths, over-unlocked graph.

**Recurring causes**:
- String-derived level mapping instead of explicit IDs
- Render order/index initialization issues
- Old persisted unlock state conflicting with current rules

**Fix patterns**: explicit `gameLevel` mapping, deterministic init order, unlock rules reapplied on load.
