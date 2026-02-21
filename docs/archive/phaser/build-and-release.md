# Build and Release Reference

## Local Build Steps

| Step | Command | When Required |
|---|---|---|
| Rebuild JS bundle | `python scripts/build_js_bundle.py` | After any JS file change |
| Validate assets | `python scripts/validate_assets.py` | Before every packaged build |
| Build EXE | `cmd /c build_portable_exe.bat` | When producing a testable desktop build |

## Build Files

| File | Purpose |
|---|---|
| `build_portable_exe.bat` | PyInstaller build script |
| `AnimePlatformer.spec` | PyInstaller spec file |
| `scripts/build_js_bundle.py` | Concatenates JS modules into `js/app.bundle.js` |
| `scripts/write_build_info.py` | Stamps build version into `js/core/build-info.js` |
| `scripts/validate_assets.py` | Validates critical asset existence and integrity |
| `scripts/convert_ldtk_to_level_json.py` | Converts LDtk project to level JSON |
| `scripts/publish_github_release.py` | Publishes release to GitHub |
| `scripts/smoke_check.py` | Automated pre-launch gate: validates build version, JS bundle, assets, docs links, and (optionally) log health |
| `.github/workflows/release.yml` | CI release workflow |

## Desktop Runtime Content Serving

The packaged desktop runtime serves the extracted content root via localhost HTTP before creating the webview window. This avoids `file://` origin fetch failures for JSON, audio, and image assets.

Key code paths in `desktop_launcher.py`:
- Content server setup at startup
- Webview window pointed to `http://localhost:<port>`

Expected log anchor after startup:
```
Launcher.http: Serving content root via localhost
```

## Display Mode Behavior

The launcher derives native display mode from persisted settings (`settings.json -> video.displayMode` + `video.resolutionPreset`) instead of forcing fullscreen defaults.

Supported modes: `windowed`, `borderless`, `fullscreen`

## Release Model

1. Push code changes
2. Push version tag (format: `YYYY.MM.DD.HHMM`)
3. CI publishes release artifacts (EXE + SHA256 checksum)
4. Updater expects monotonic version progression
5. In-game updater depends on published downloadable EXE assets

## Updater Operations

The updater is a multi-step workflow:

```
check -> download -> verify checksum -> apply (helper script) -> restart -> verify health
```

Healthy updater sequence in `updater.log`:
```
backup ok -> replace ok -> restart launch ok
```

`replace retry ... err=1` can be transient lock contention if followed by a later `replace ok`.

## When to Use CI vs Local Build

- **Local build**: fastest for functional testing
- **CI release**: required for real updater-path validation (what end users experience)
- If CI publish is blocked, updater validation is incomplete even if local EXE works
