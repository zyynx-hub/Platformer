# Operations And Releases (Reference)

## Canonical Local Build Steps
1. Rebuild JS bundle when JS changed:
   - `python scripts/build_js_bundle.py`
2. Validate critical assets:
   - `python scripts/validate_assets.py`
3. Build desktop executable:
   - `cmd /c build_portable_exe.bat`

## Release Model Observed In Transcript
- Frequent pattern: push code + push version tag, then CI publishes release artifacts.
- Updater expects monotonic version progression.
- In-game updater depends on published downloadable EXE assets, not just code commits.

## Updater Operational Rules
- Treat updater as multi-step workflow: check -> download -> apply -> restart -> verify status.
- Always verify helper logs when update apply/restart fails.
- If update behavior diverges between local and released builds, verify:
  - embedded build version
  - release artifact actually published for target tag
  - updater endpoint/repo visibility/rate-limit behavior

## When To Use CI vs Local Publish
- Local build is fastest for functional testing.
- CI release flow is required for real updater-path validation used by end users.
- If CI publish is blocked, updater validation is incomplete even if local EXE works.

## Regression Gate Before Shipping
- Menu loads and update status reaches a terminal state.
- World map renders and launches intended level IDs.
- No critical asset fallback warnings in Boot/Game startup.
- Options persist across restart.
- Fullscreen/window modes preserve alignment and input mapping.
- Update apply path relaunches cleanly (or logs exact failure point).

## Suggested Use In Future Sessions
- Read `docs/history/PROJECT_CONTEXT.md` first.
- Then use `docs/history/INCIDENTS_AND_ROOT_CAUSES.md` as a fix checklist before introducing new systems.
- Keep `docs/history/ARCHITECTURE_AND_DECISIONS.md` aligned when major design choices change.
