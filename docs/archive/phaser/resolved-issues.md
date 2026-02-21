# Resolved Issues

Last updated: 2026-02-17

All issues below have been verified resolved with evidence. They remain documented here as a regression reference.

## OI-008: World-Map Resize Particle Null Dereference

- **Subsystem**: world-map / resize / particles
- **Status**: Resolved
- **Last Verified Build**: `2026.02.17.1106`
- **Root Cause**: resize path used particle manager `setConfig` during transition timing where emitter internals could be invalid/null
- **Fix**: replaced resize-time `setConfig` with guarded bounds-aware particle rebuild (`js/worldmap/WorldMapView.js`)
- **Verified**: absence of `WorldMapView: resize.exec failed` in packaged replay on build `2026.02.17.0946`

## OI-007: Menu -> WorldMap Transition Guard Sticky State

- **Subsystem**: menu / world-map transition guard
- **Status**: Resolved
- **Last Verified Build**: `2026.02.17.1106`
- **Root Cause**: transition guard flag (`worldMapLaunchInFlight`) persisted across scene reuse
- **Fix**: reset guard at `MenuScene.init()` (`js/scenes/menu-scene.js:91-93`)
- **Verified**: exact repro flow (`Menu -> Play -> level -> Menu -> Play`) succeeds on build `2026.02.17.0837`

## OI-006: Menu/World-Map Audio Cache Miss

- **Subsystem**: menu / world-map / audio
- **Status**: Resolved
- **Last Verified Build**: `2026.02.17.0830`
- **Root Cause**: `file://` origin prevented audio asset fetches in packaged builds
- **Fix**: localhost HTTP content serving (`desktop_launcher.py`)
- **Verified**: no `menu-bgm not found in cache` in packaged replay

## OI-005: Gameplay Falls Back to Non-Native LDtk Path

- **Subsystem**: gameplay / LDtk
- **Status**: Resolved
- **Last Verified Build**: `2026.02.17.0830`
- **Root Cause**: `file://` origin prevented JSON asset fetches in packaged builds
- **Fix**: localhost HTTP content serving (`desktop_launcher.py`)
- **Verified**: native LDtk map path used consistently in packaged replay

## OI-004: Critical Boot Asset Load Failures

- **Subsystem**: boot / assets
- **Status**: Resolved
- **Last Verified Build**: `2026.02.17.0830`
- **Root Cause**: `file://` origin caused CORS failures for sprites, tileset, and level data
- **Fix**: localhost HTTP content serving (`desktop_launcher.py`)
- **Verified**: no critical startup fallback signatures in packaged replay

## OI-003: Updater Checksum Integrity Gap

- **Subsystem**: updater / integrity
- **Status**: Resolved
- **Last Verified Build**: `2026.02.17.0830`
- **Root Cause**: missing checksum didn't block updates
- **Fix**: checksum enforcement in `desktop_launcher.py`

## OI-002: Updater Apply/Restart Health

- **Subsystem**: updater / apply-restart
- **Status**: Resolved
- **Last Verified Build**: `2026.02.17.1106`
- **Root Cause**: runtime health state not clearing pending markers after successful update
- **Fix**: launch health state guards + runtime healthy marker clear in `desktop_launcher.py`
- **Verified**: updater continuity stable across all sprint verification passes

## OI-001: Updater API Rate-Limit Degradation

- **Subsystem**: updater / network
- **Status**: Resolved
- **Last Verified Build**: `2026.02.17.1106`
- **Root Cause**: unauthenticated GitHub API calls hitting rate limits
- **Fix**: API/web fallback handling in `desktop_launcher.py`
