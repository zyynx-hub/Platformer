# Incidents And Root Causes (Condensed)

This is a distilled failure history from the transcript. Use it as a regression checklist.

## Update / Relaunch Failures
- Symptom: update downloads but app does not relaunch.
- Repeated causes:
  - old process not terminating cleanly (file lock / PID handoff issues)
  - fragile helper restart strategy (single-shot relaunch or blocking wait logic)
  - status flow not reaching terminal UI states
- Fix patterns:
  - retry-based restart/apply logic
  - hardened helper script behavior
  - better updater logging and status propagation

## Stuck "Checking for updates"
- Symptom: UI remains in checking state.
- Repeated causes:
  - skipped or suppressed auto-check branch
  - callback/status not finalized in one control path
  - retry loop behavior without bounded terminal state
- Fix patterns:
  - bounded retries + explicit end statuses
  - corrected guard logic around manual/auto check timing

## GitHub Release Pipeline Breakage
- Symptom: Actions release job fails or assets unavailable.
- Repeated causes:
  - Python/tooling mismatch (notably pythonnet/pywebview CI compatibility)
  - missing or delayed release assets vs tag creation timing
  - API rate-limit behavior from unauthenticated checks
- Fix patterns:
  - pin stable toolchain versions in workflow
  - ensure release body/assets are explicit
  - add fallback handling for API-limit/network cases

## Idle Sprite Critical (`player-idle-sheet`)
- Symptom: missing idle sheet warning/critical and fallback visuals.
- Repeated causes:
  - `IFFY_IDLE` load failure (including file:// runtime/CORS behavior)
  - spritesheet generation path not guaranteed on failures
- Fix patterns:
  - guaranteed BootScene fallback sheet creation
  - asset validation gate marking idle source as required
  - additional targeted debug lines around idle setup path

## Fullscreen / Resize / Input Misalignment
- Symptom: blurry UI, shifted click targets, exposed margins, bad scaling.
- Repeated causes:
  - mixed sizing authorities (window vs host vs manual canvas CSS)
  - browser fullscreen usage inside desktop host
  - DPI/scale mismatch paths
- Fix patterns:
  - native fullscreen authority for desktop
  - single resize authority and safer relayout strategy
  - avoid conflicting manual canvas sizing transforms

## Scene Lifecycle Crashes
- Symptom: crashes during replay/menu transitions.
- Repeated causes:
  - stale listener registrations
  - HUD update callbacks firing after UI teardown
- Fix patterns:
  - stricter listener registration/unregistration
  - null/disposal guards around HUD and text updates

## Settings Persistence Resets
- Symptom: options/audio/hitbox settings revert between launches.
- Repeated causes:
  - localStorage origin instability in EXE context
  - previous hard cap/fallback behavior replacing saved settings
- Fix patterns:
  - host-backed persistent settings path
  - removal of destructive size-cap fallback behavior

## World Map / Level Routing Regressions
- Symptom: wrong level launch, misdrawn paths, over-unlocked graph.
- Repeated causes:
  - string-derived level mapping instead of explicit IDs
  - render order/index initialization issues
  - old persisted unlock state conflicting with current rules
- Fix patterns:
  - explicit `gameLevel` mapping
  - deterministic world-map init order
  - unlock rules reapplied reliably on load
