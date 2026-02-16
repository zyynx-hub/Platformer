# Per-File And Per-Commit Decision History

Source: `CHAT_HISTORY_RAW.md`

Total SCM events: 157
Total files with extracted history: 116

## Commit/Tag/Push Timeline
- L11376 | `git-command` | Ran git status --short
- L11391 | `git-command` | Ran git diff -- js/scenes/game-scene.js | rg -n "tinyGridMode|playerTuning|jetpackTuning|updateCameraFraming|setDeadzone|createJetpackFx|hpBarCfg|enemySpeedScale|projectile|checkpoint|coin|oneWay|buildPlayerTuning|buildJetpackTuning|modeZoom"
- L13641 | `git-command` | Ran git status --short --branch
- L13647 | `git-command` | Ran git remote -v
- L13655 | `git-commit` | Ran git add -A && git commit -m "Build: sync latest gameplay/map/hitbox updates for release test"
- L13660 | `git-commit` | Ran git add -A; git commit -m "Build: sync latest gameplay/map/hitbox updates for release test"
- L13663 | `git-push` | Ran git push origin main
- L13668 | `git-push` | Ran $tag = Get-Date -Format "yyyy.MM.dd.HHmm"; git tag $tag; git push origin $tag; Write-Output $tag
- L14740 | `git-command` | Ran git status --short
- L14866 | `git-command` | Ran git status --short
- L14869 | `git-command` | Ran git rev-parse --abbrev-ref HEAD
- L14872 | `git-command` | Ran git remote -v
- L14892 | `git-commit` | Ran git add desktop_launcher.py && git commit -m "updater: write helper log beside game exe"
- L14895 | `git-commit` | Ran git add desktop_launcher.py; git commit -m "updater: write helper log beside game exe"
- L14898 | `git-push` | Ran git push origin main
- L14950 | `git-push` | Ran git push origin main
- L14953 | `git-command` | Ran git status --short
- L14956 | `git-command` | Ran git log --oneline -n 5
- L14961 | `git-commit` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L15010 | `git-tag` | Ran git tag -l "2026.02.16.1339"
- L15013 | `git-push` | Ran git push origin "2026.02.16.1339"
- L15016 | `git-tag` | Ran git tag "2026.02.16.1339"
- L15021 | `git-push` | Ran git push origin refs/tags/2026.02.16.1339
- L15024 | `git-command` | Ran git show-ref --tags | Select-String "2026.02.16.1339"
- L15157 | `git-command` | Ran git status --short
- L15160 | `git-command` | Ran git log --oneline -n 5
- L15163 | `git-tag` | Ran git tag -l "2026.02.16.1423"
- L15168 | `git-commit` | Ran git add desktop_launcher.py; git commit -m "updater: harden helper handoff/restart logging and relaunch"; git push origin main
- L15171 | `git-push` | Ran git tag "2026.02.16.1423"; git push origin refs/tags/2026.02.16.1423
- L15240 | `git-command` | Ran git status --short
- L15243 | `git-push` | Ran git push origin main
- L15246 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15249 | `git-command` | Ran git log --oneline -n 3
- L15252 | `git-command` | Ran git status -sb
- L15255 | `git-push` | Ran git push origin HEAD:main
- L15260 | `git-tag` | Ran git tag "2026.02.16.1428"
- L15263 | `git-tag` | Ran git tag -l "2026.02.16.1428"
- L15266 | `git-push` | Ran git push origin refs/tags/2026.02.16.1428
- L15321 | `git-push` | Ran git tag "2026.02.16.1430"; git push origin refs/tags/2026.02.16.1430
- L15324 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15389 | `git-tag` | Ran git tag -l "2026.02.16.1434"
- L15392 | `git-tag` | Ran git tag "2026.02.16.1434"
- L15395 | `git-push` | Ran git push origin refs/tags/2026.02.16.1434
- L15451 | `git-push` | Ran git tag "2026.02.16.1440"; git push origin refs/tags/2026.02.16.1440
- L15454 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15482 | `git-push` | Ran git tag "2026.02.16.1442"; git push origin refs/tags/2026.02.16.1442
- L15517 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15520 | `git-push` | Ran git tag "2026.02.16.1444"; git push origin refs/tags/2026.02.16.1444
- L15572 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15575 | `git-push` | Ran git tag "2026.02.16.1450"; git push origin refs/tags/2026.02.16.1450
- L15640 | `git-tag` | Ran git tag -l "2026.02.16.1456"
- L15643 | `git-tag` | Ran git tag "2026.02.16.1456"
- L15646 | `git-push` | Ran git push origin refs/tags/2026.02.16.1456
- L15698 | `git-tag` | Ran git tag -l "2026.02.16.1457"
- L15701 | `git-push` | Ran git push origin refs/tags/2026.02.16.1457
- L15704 | `git-tag` | Ran git tag "2026.02.16.1457"
- L15804 | `git-commit` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15807 | `git-push` | Ran git tag "2026.02.16.1500"; git push origin refs/tags/2026.02.16.1500
- L15866 | `git-tag` | Ran git tag "2026.02.16.1513"
- L15869 | `git-push` | Ran git push origin refs/tags/2026.02.16.1513
- L15970 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L15973 | `git-push` | Ran git tag "2026.02.16.1520"; git push origin refs/tags/2026.02.16.1520
- L16014 | `git-command` | Ran git branch --show-current
- L16017 | `git-command` | Ran git status --short
- L16040 | `git-tag` | Ran git tag --sort=-creatordate | Select-Object -First 10
- L16046 | `git-tag` | Ran $tags = git tag | Where-Object { $_ -match '^\d{4}\.\d{2}\.\d{2}\.\d{4}$' }; if (-not $tags) { 'NO_TAGS' ; exit 0 }; $maxTag = $tags | Sort-Object { [int]($_ -replace '\.','') } -Descending | Select-Object -First 1; $maxTag
- L16051 | `git-tag` | Ran git tag -l 2026.02.16.1522
- L16054 | `git-tag` | Ran git tag -a 2026.02.16.1522 -m "release: 2026.02.16.1522"
- L16057 | `git-push` | Ran git push origin 2026.02.16.1522
- L16120 | `git-command` | Ran git status --short
- L16125 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map && git commit -m "menu: add top-left test build marker"
- L16129 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: add top-left test build marker"
- L16132 | `git-push` | Ran git push origin main
- L16135 | `git-tag` | Ran git tag -l 2026.02.16.1523
- L16138 | `git-push` | Ran git tag -a 2026.02.16.1523 -m "release: 2026.02.16.1523"; git push origin 2026.02.16.1523
- L16141 | `git-command` | Ran git status --short
- L16171 | `git-command` | Ran git status --short
- L16208 | `git-push` | Ran git push origin main
- L16211 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: remove temporary test marker"
- L16216 | `git-push` | Ran git push origin main
- L16219 | `git-tag` | Ran git tag -l 2026.02.16.1524
- L16222 | `git-push` | Ran git tag -a 2026.02.16.1524 -m "release: 2026.02.16.1524"; git push origin 2026.02.16.1524
- L16339 | `git-command` | Ran git status --short
- L16575 | `git-command` | Ran git branch --show-current
- L16578 | `git-command` | Ran git status --short
- L16583 | `git-tag` | Ran git tag -l 2026.02.16.1615
- L16586 | `git-commit` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16590 | `git-tag` | Ran git tag -l 2026.02.16.1615
- L16596 | `git-commit` | Ran git commit -m "updater: fix initial auto-check stuck status"
- L16599 | `git-command` | Ran git status --short
- L16602 | `git-command` | Ran git log --oneline -n 5
- L16610 | `git-push` | Ran git push origin main
- L16613 | `git-tag` | Ran git tag -a 2026.02.16.1615 -m "release: 2026.02.16.1615"
- L16616 | `git-push` | Ran git push origin 2026.02.16.1615
- L16817 | `git-command` | Ran git status --short
- L16832 | `git-tag` | Ran git tag -l 2026.02.16.1624
- L16841 | `git-command` | Ran git status --short
- L16844 | `git-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16852 | `git-commit` | Ran git commit -m "debug/update: fix console panel overflow and add 10s update polling"
- L16855 | `git-push` | Ran git push origin main
- L16858 | `git-tag` | Ran git tag -a 2026.02.16.1624 -m "release: 2026.02.16.1624"
- L16861 | `git-push` | Ran git push origin 2026.02.16.1624
- L17049 | `git-command` | Ran git branch --show-current
- L17052 | `git-tag` | Ran git tag -l 2026.02.16.1635
- L17055 | `git-command` | Ran git status --short
- L17058 | `git-command` | Ran git log --oneline -n 5
- L17072 | `git-commit` | Ran git commit -m "updater: add GitHub web fallback for API rate limits"
- L17075 | `git-push` | Ran git push origin main
- L17078 | `git-tag` | Ran git tag -a 2026.02.16.1635 -m "release: 2026.02.16.1635"
- L17081 | `git-push` | Ran git push origin 2026.02.16.1635
- L17084 | `git-command` | Ran git status --short
- L17099 | `git-command` | Ran git status --short
- L17102 | `git-tag` | Ran git tag --sort=-creatordate | Select-Object -First 8
- L17105 | `git-command` | Ran git branch --show-current
- L17108 | `git-command` | Ran git status -sb
- L17113 | `git-push` | Ran git tag -a 2026.02.16.1636 -m "release: 2026.02.16.1636"; git push origin 2026.02.16.1636
- L17128 | `git-command` | Ran git status -sb
- L17131 | `git-tag` | Ran git tag -l 2026.02.16.1637
- L17134 | `git-push` | Ran git tag -a 2026.02.16.1637 -m "release: 2026.02.16.1637"; git push origin 2026.02.16.1637
- L17149 | `git-command` | Ran git status --porcelain=v1 -uall
- L17158 | `git-command` | Ran git status -sb
- L17161 | `git-command` | Ran git rev-parse origin/main
- L17164 | `git-command` | Ran git rev-parse HEAD
- L17167 | `git-command` | Ran git log --oneline -n 12
- L17181 | `git-command` | Ran git log --oneline -- assets js/level js/worldmap | Select-Object -First 20
- L17184 | `git-tag` | Ran git tag -l 2026.02.16.1638
- L17187 | `git-push` | Ran git tag -a 2026.02.16.1638 -m "release: 2026.02.16.1638 (full content sync)"; git push origin 2026.02.16.1638
- L17190 | `git-command` | Ran git status -sb
- L17248 | `git-command` | Ran git status --short
- L17433 | `git-command` | Ran git status --short
- L17436 | `git-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17445 | `git-command` | Ran git diff --name-only
- L17448 | `git-command` | Ran git status --short
- L17460 | `git-command` | Ran git branch --show-current
- L17465 | `git-tag` | Ran git tag --list "2026.02.16.*" --sort=v:refname
- L17468 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17479 | `git-command` | Ran git status --short
- L17482 | `git-push` | Ran git push origin main
- L17485 | `git-push` | Ran git tag 2026.02.16.1639; git push origin 2026.02.16.1639
- L17779 | `git-command` | Ran git status --short
- L17882 | `git-command` | Ran git branch --show-current
- L17885 | `git-tag` | Ran git tag --list "2026.02.16.1921"
- L17888 | `git-command` | Ran git status --short
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17894 | `git-push` | Ran git push origin main
- L17897 | `git-push` | Ran git tag 2026.02.16.1921; git push origin 2026.02.16.1921
- L17912 | `git-push` | Ran git tag --list "2026.02.16.1922"; git tag 2026.02.16.1922; git push origin 2026.02.16.1922
- L18064 | `git-command` | Ran git status --short
- L18114 | `git-command` | Ran git status --short
- L18117 | `git-command` | Ran git branch --show-current
- L18120 | `git-tag` | Ran git tag --list "2026.02.16.2027"
- L18123 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18129 | `git-push` | Ran git push origin main; git tag 2026.02.16.2027; git push origin 2026.02.16.2027
- L18144 | `git-push` | Ran git tag --list "2026.02.16.2028"; git tag 2026.02.16.2028; git push origin 2026.02.16.2028
- L18303 | `git-command` | Ran git status --short
- L18643 | `git-command` | Ran git status --short

## File Decision Histories

### `AGENTS.md`
- Events: 1
- L1031 | `change` | No skill from the listed AGENTS.md set applies to this refactor, so I’m proceeding with a direct modular code split. I’m now creating a js/ structure and moving each scene/system into its own file while preserving behavior.

### `AnimePlatformer.exe`
- Events: 67
- L3360 | `change` | AnimePlatformer.exe (updated)
- L3363 | `change` | Upload the latest AnimePlatformer.exe to a release.
- L3624 | `change` | Build target: single EXE in root (AnimePlatformer.exe)
- L3785 | `change` | Validation passed. I’m now rebuilding AnimePlatformer.exe so the new update flow is embedded and ready to test in the desktop build.
- L3879 | `change` | Build failed because AnimePlatformer.exe is currently running/locked. I’ll stop the process, rebuild, and deliver the updated EXE with the clearer update status message.
- L3893 | `change` | Attach the built AnimePlatformer.exe as a release asset.
- L3918 | `change` | Fresh build produced: AnimePlatformer.exe
- L3969 | `change` | AnimePlatformer.exe updated in root.
- L4010 | `change` | Root EXE updated: AnimePlatformer.exe
- L4020 | `change` | You build and publish a new release to zyynx-hub/Platformer (with AnimePlatformer.exe attached).
- L4099 | `change` | After that, launch AnimePlatformer.exe and the update check will read from GitHub automatically.
- L4292 | `change` | Public endpoint returns 200 with release 2026.02.15.1045 and asset AnimePlatformer.exe.
- L4384 | `change` | Published new release 2026.02.15.1049 with AnimePlatformer.exe.
- L4453 | `change` | It auto-builds AnimePlatformer.exe and publishes a GitHub Release when you push a version tag.
- L4525 | `change` | Root EXE updated: AnimePlatformer.exe
- L5290 | `change` | I’ll fetch the latest public release from your GitHub repo and download the EXE directly into your project root as AnimePlatformer.exe. Then I’ll confirm the exact version downloaded.
- L6463 | `change` | I’ll download the latest GitHub release EXE directly to your PC now and overwrite AnimePlatformer.exe.
- L6564 | `change` | I’ll sync your local project to latest main and also download the latest release AnimePlatformer.exe directly into C:\Users\Robin\Desktop\codex so you have everything locally without using in-game updater.
- L6773 | `change` | This will regenerate bundle/map, build the EXE, and place AnimePlatformer.exe in the project root.
- L6778 | `change` | I’m running the local build/install script now so your root AnimePlatformer.exe is updated with the latest final-pass changes.
- L6904 | `change` | AnimePlatformer.exe (latest build)
- L7007 | `change` | AnimePlatformer.exe (updated)
- L7026 | `change` | AnimePlatformer.exe (updated, version 2026.02.15.1502)
- L7544 | `change` | I’ve patched the runtime and launcher; next I’m rebuilding and replacing your local AnimePlatformer.exe so you can verify resize behavior immediately.
- L7558 | `change` | AnimePlatformer.exe updated in root
- L7578 | `change` | Root EXE updated: AnimePlatformer.exe

## 2026-02-16 Strict Cleanup Pass (No Open Issues Target)
- `desktop_launcher.py`
  - Decision: enforce checksum presence for newer updates before allowing apply flow.
  - Reason: close integrity gap where checksum verification was optional.
  - Evidence refs: `desktop_launcher.py:462`, `desktop_launcher.py:465`, `desktop_launcher.py:654`.
- `desktop_launcher.py`
  - Decision: prefer web latest-release resolution for stable/latest channel, API as fallback.
  - Reason: reduce API rate-limit dependency in normal update checks.
  - Evidence refs: `desktop_launcher.py:819`, `desktop_launcher.py:822`.
- `docs/history/OPEN_ISSUES_VERIFIED_WITH_NOISE.md`
  - Decision: keep full noisy disposition for auditability.
- `docs/history/OPEN_ISSUES_VERIFIED.md`
  - Decision: mirror strict final state only (real-open count).
- `docs/history/UNRESOLVED_ITEMS_TRACKER.md`
  - Decision: mark as superseded for active triage by strict verified docs.
- L7772 | `change` | EXE updated: AnimePlatformer.exe
- L8424 | `change` | Launch AnimePlatformer.exe (build 2026.02.15.1756).
- L8496 | `change` | I fixed and rebuilt locally. New EXE is ready at AnimePlatformer.exe (build 2026.02.15.1810).
- L8634 | `change` | EXE updated at: AnimePlatformer.exe
- L8692 | `change` | EXE updated at: AnimePlatformer.exe
- L8815 | `change` | Updated root executable: AnimePlatformer.exe
- L8898 | `change` | Updated local EXE: AnimePlatformer.exe
- L8932 | `change` | Updated EXE: AnimePlatformer.exe
- L9502 | `change` | Rebuilt EXE locally: AnimePlatformer.exe (root updated)
- L9529 | `change` | EXE updated at: AnimePlatformer.exe (project root)
- L9664 | `change` | Updated executable: AnimePlatformer.exe in project root.
- L9783 | `change` | EXE updated at: AnimePlatformer.exe (root)
- L9825 | `change` | Root executable updated: AnimePlatformer.exe
- L9863 | `change` | AnimePlatformer.exe in root is updated.
- L9903 | `change` | Root EXE updated: AnimePlatformer.exe
- L9932 | `change` | AnimePlatformer.exe in root updated.
- L9947 | `change` | Updated root EXE: AnimePlatformer.exe
- L9972 | `change` | AnimePlatformer.exe in root updated.
- L9999 | `change` | Updated root EXE: AnimePlatformer.exe
- L10301 | `change` | rebuilt EXE (AnimePlatformer.exe, build 2026.02.16.0950)
- L10982 | `change` | Updated EXE: AnimePlatformer.exe
- L10997 | `change` | Updated EXE: AnimePlatformer.exe
- L11036 | `change` | Updated EXE: AnimePlatformer.exe
- L11924 | `change` | Updated EXE: AnimePlatformer.exe
- L12169 | `change` | EXE updated: AnimePlatformer.exe
- L12395 | `change` | Updated EXE: AnimePlatformer.exe
- L13182 | `change` | Rebuilt local EXE: AnimePlatformer.exe
- L13591 | `change` | If you publish a new GitHub Release with the updated AnimePlatformer.exe, other users can download that release directly and get your new build, even without your local files.
- L13606 | `change` | You publish each new build as a GitHub Release asset named AnimePlatformer.exe.
- L13687 | `change` | Once it turns green, the release asset AnimePlatformer.exe for tag 2026.02.16.1334 will be available, and other users can test updating via the in-game Update button.
- L13805 | `change` | Good news: the GitHub release is now fully published with AnimePlatformer.exe, so in-game update should be able to download it. I’m rebuilding your local EXE with the new click-path diagnostics so if anything still fails, the debug panel will show the exact reason.
- L13988 | `change` | Build: AnimePlatformer.exe (version 2026.02.16.1244)
- L14736 | `change` | Updated EXE: AnimePlatformer.exe
- L14758 | `change` | AnimePlatformer.exe (root updated)
- L15044 | `change` | The updater needs a new release tag + built AnimePlatformer.exe asset to download.
- L15138 | `change` | EXE updated at: AnimePlatformer.exe
- L15225 | `change` | AnimePlatformer.exe updated.
- L16763 | `change` | Updated exe: AnimePlatformer.exe
- L17036 | `change` | Updated file: AnimePlatformer.exe
- L18097 | `change` | Updated locally to Version 2026.02.16.2027 in AnimePlatformer.exe.
- L18345 | `change` | EXE rebuilt to local version 2026.02.16.2100 at AnimePlatformer.exe

### `AnimePlatformer.spec`
- Events: 1
- L6587 | `change` | Fix: Remove AnimePlatformer.spec from git, add *.spec to .gitignore, regenerate it during every build.

### `app.bundle.js`
- Events: 2
- L9501 | `change` | Rebuilt bundle: app.bundle.js and app.bundle.js.map
- L18677 | `change` | Your workspace still has pre-existing modified files (app.bundle.js, app.bundle.js.map, build-info.js, boot-scene.js, validate_assets.py) plus updater.log untracked.

### `app.bundle.js.map`
- Events: 2
- L9501 | `change` | Rebuilt bundle: app.bundle.js and app.bundle.js.map
- L18677 | `change` | Your workspace still has pre-existing modified files (app.bundle.js, app.bundle.js.map, build-info.js, boot-scene.js, validate_assets.py) plus updater.log untracked.

### `boot-scene.js`
- Events: 5
- L1957 | `change` | Updated in boot-scene.js (createHazardTexture).
- L6700 | `change` | Level data decoupling: moved level definitions to JSON files loaded at runtime (level-1.json, level-2.json, level-3.json, level-4.json, boot-scene.js, level-data.js).
- L6707 | `change` | Missing asset degradation: optional asset warnings/fallback path preserved; criticals now validated pre-build (boot-scene.js, validate_assets.py).
- L17518 | `change` | Added explicit LDtk load-error logs for visibility: boot-scene.js (line 33)
- L18677 | `change` | Your workspace still has pre-existing modified files (app.bundle.js, app.bundle.js.map, build-info.js, boot-scene.js, validate_assets.py) plus updater.log untracked.

### `BootScene.ldtk`
- Events: 1
- L17498 | `command` | Ran rg -n "BootScene.ldtk|Failed to load assets/test.ldtk|Failed to load Cavernas" js/scenes/boot-scene.js

### `build-info.js`
- Events: 13
- L3283 | `change` | I’m now adding a generated build-info.js and forcing currentVersion from that build stamp on startup, so cached settings can’t show stale versions. Then I’ll rebuild the EXE to confirm.
- L3294 | `change` | build-info.js
- L3296 | `change` | index.html now loads build-info.js before settings
- L5235 | `change` | I found one extra modified file (build-info.js) from earlier build metadata; I’ll include it only if regenerated by this new build so versioning stays consistent. Now I’m running the standard build+publish flow.
- L5257 | `change` | build-info.js: regenerated with repo zyynx-hub/Platformer.
- L6646 | `change` | Issue: write_build_info.py:1-30 creates build-info.js but game doesn't validate it exists or is valid.
- L7342 | `change` | build-info.js
- L9208 | `change` | build-info.js
- L9251 | `change` | build-info.js
- L15618 | `change` | Local build: 2026.02.16.1455 (build-info.js, built at 2026-02-16T14:55:02Z)
- L16366 | `change` | Build script updated build-info.js timestamp/version locally (2026.02.16.1604).
- L17855 | `change` | build-info.js
- L18677 | `change` | Your workspace still has pre-existing modified files (app.bundle.js, app.bundle.js.map, build-info.js, boot-scene.js, validate_assets.py) plus updater.log untracked.

### `build_js_bundle.py`
- Events: 4
- L6747 | `change` | Local build: build_portable_exe.bat now runs build_js_bundle.py.
- L6748 | `change` | CI build: release.yml now runs build_js_bundle.py.
- L9652 | `change` | Updated build_js_bundle.py to include:
- L14754 | `change` | build_js_bundle.py: added update-manager.js" to ORDER right after updater.js.

### `build_portable_exe.bat`
- Events: 76
- L2919 | `change` | I also updated build_portable_exe.bat to always build this way (--onefile + output in root).
- L3124 | `change` | build_portable_exe.bat removed --windowed
- L3307 | `change` | Every time you run build_portable_exe.bat, a new version is generated (format: YYYY.MM.DD.HHMM).
- L3668 | `change` | Build script (build_portable_exe.bat) exports/parses repo/channel once and invokes generator.
- L6693 | `change` | Backup cleanup: build now deletes stale .bak files and runs cleanup script (build_portable_exe.bat, cleanup_backups.py).
- L6706 | `change` | Build script safety: no unsafe Python resolution assumptions; %PYTHON%/py controlled usage (build_portable_exe.bat).
- L6747 | `change` | Local build: build_portable_exe.bat now runs build_js_bundle.py.
- L6763 | `change` | Build/release as usual (build_portable_exe.bat)
- L10179 | `command` | Ran cmd /c build_portable_exe.bat
- L10283 | `command` | Ran cmd /c build_portable_exe.bat
- L10639 | `command` | Ran cmd /c build_portable_exe.bat
- L10874 | `command` | Ran cmd /c build_portable_exe.bat
- L10941 | `command` | Ran cmd /c build_portable_exe.bat
- L10976 | `command` | Ran cmd /c build_portable_exe.bat
- L10991 | `command` | Ran cmd /c build_portable_exe.bat
- L11030 | `command` | Ran cmd /c build_portable_exe.bat
- L11343 | `command` | Ran cmd /c build_portable_exe.bat
- L11367 | `command` | Ran cmd /c build_portable_exe.bat
- L11386 | `command` | Ran cmd /c build_portable_exe.bat
- L11520 | `command` | Ran cmd /c build_portable_exe.bat
- L11670 | `command` | Ran cmd /c build_portable_exe.bat
- L11773 | `command` | Ran cmd /c build_portable_exe.bat
- L11833 | `command` | Ran cmd /c build_portable_exe.bat
- L11874 | `command` | Ran cmd /c build_portable_exe.bat
- L11918 | `command` | Ran cmd /c build_portable_exe.bat
- L11970 | `command` | Ran cmd /c build_portable_exe.bat
- L12017 | `command` | Ran cmd /c build_portable_exe.bat
- L12068 | `command` | Ran cmd /c build_portable_exe.bat
- L12147 | `command` | Ran cmd /c build_portable_exe.bat
- L12258 | `command` | Ran cmd /c build_portable_exe.bat
- L12304 | `command` | Ran cmd /c build_portable_exe.bat
- L12373 | `command` | Ran cmd /c build_portable_exe.bat
- L12382 | `command` | Ran cmd /c build_portable_exe.bat
- L12447 | `command` | Ran cmd /c build_portable_exe.bat
- L12500 | `command` | Ran cmd /c build_portable_exe.bat
- L12546 | `command` | Ran cmd /c build_portable_exe.bat
- L12594 | `command` | Ran cmd /c build_portable_exe.bat
- L12795 | `command` | Ran cmd /c build_portable_exe.bat
- L13047 | `command` | Ran cmd /c build_portable_exe.bat
- L13170 | `command` | Ran cmd /c build_portable_exe.bat
- L13330 | `command` | Ran cmd /c build_portable_exe.bat
- L13406 | `command` | Ran cmd /c build_portable_exe.bat
- L13552 | `command` | Ran cmd /c build_portable_exe.bat
- L13616 | `command` | Ran rg -n "publish|release|GITHUB|token|UPDATE_GH_REPO|shadow" build_portable_exe.bat scripts/*.py .github/workflows/*.yml
- L13810 | `command` | Ran cmd /c build_portable_exe.bat
- L13832 | `command` | Ran cmd /c build_portable_exe.bat
- L13956 | `command` | Ran cmd /c build_portable_exe.bat
- L14061 | `command` | Ran cmd /c build_portable_exe.bat
- L14145 | `command` | Ran cmd /c build_portable_exe.bat
- L14211 | `command` | Ran cmd /c build_portable_exe.bat
- L14700 | `command` | Ran cmd /c build_portable_exe.bat
- L14783 | `command` | Ran Get-Content build_portable_exe.bat -TotalCount 320
- L14863 | `command` | Ran $env:UPDATE_GH_REPO='zyynx-hub/Platformer'; $env:UPDATE_CHANNEL='stable'; cmd /c build_portable_exe.bat
- L15122 | `command` | Ran cmd /c build_portable_exe.bat
- L15209 | `command` | Ran cmd /c build_portable_exe.bat
- L15327 | `command` | Ran cmd /c build_portable_exe.bat
- L15448 | `command` | Ran cmd /c build_portable_exe.bat
- L15514 | `command` | Ran cmd /c build_portable_exe.bat
- L15569 | `command` | Ran cmd /c build_portable_exe.bat
- L15801 | `command` | Ran cmd /c build_portable_exe.bat
- L15967 | `command` | Ran cmd /c build_portable_exe.bat
- L16028 | `command` | Ran Get-Content build_portable_exe.bat -First 260
- L16313 | `command` | Ran cmd /c "build_portable_exe.bat <nul"
- L16462 | `command` | Ran cmd /c "build_portable_exe.bat <nul"
- L16536 | `command` | Ran cmd /c "build_portable_exe.bat <nul"
- L16744 | `command` | Ran cmd /c "build_portable_exe.bat <nul"
- L17015 | `command` | Ran cmd /c "build_portable_exe.bat <nul"
- L17273 | `command` | Ran Get-Content build_portable_exe.bat
- L17776 | `command` | Ran cmd /c build_portable_exe.bat
- L17813 | `command` | Ran cmd /c build_portable_exe.bat
- L18043 | `command` | Ran cmd /c build_portable_exe.bat
- L18297 | `command` | Ran cmd /c build_portable_exe.bat
- L18323 | `command` | Ran cmd /c build_portable_exe.bat
- L18385 | `command` | Ran Get-Content build_portable_exe.bat
- L18456 | `change` | 2. Build once: `cmd /c build_portable_exe.bat`.
- L18512 | `change` | - Full build: `build_portable_exe.bat`

### `cache.json`
- Events: 2
- L17298 | `command` | Ran rg -n "LevelJsonCache|level-1|level-5|cache.json.get\(" js/scenes/boot-scene.js && Get-Content js/scenes/boot-scene.js -Tail 240
- L17301 | `command` | Ran rg -n "LevelJsonCache|level-1|level-5|cache.json.get\(" js/scenes/boot-scene.js

### `cleanup_backups.py`
- Events: 1
- L6693 | `change` | Backup cleanup: build now deletes stale .bak files and runs cleanup script (build_portable_exe.bat, cleanup_backups.py).

### `constants.js`
- Events: 2
- L9628 | `change` | Updated constants.js
- L9765 | `change` | Updated jetpack tuning config in constants.js:

### `convert_ldtk_to_level_json.py`
- Events: 1
- L10070 | `change` | Added converter script: convert_ldtk_to_level_json.py

### `debug.js`
- Events: 7
- L2107 | `change` | Added: debug.js
- L2137 | `change` | Updated debug.js:
- L6698 | `change` | Debug console production gating: debug UI now only initializes when debug build flag is enabled (debug.js, main.js, write_build_info.py).
- L6840 | `change` | Updated debug.js to enable debug panel automatically in desktop host mode (pywebview) even if build debug flag is off.
- L16778 | `change` | I’m going to trace the debug panel layout styles in debug.js, reproduce the overflow logic issue from code, then patch it and ship release 2026.02.16.1624 to GitHub as requested.
- L16873 | `change` | Switched debug panel to flex column layout in debug.js.
- L18086 | `change` | Added Platformer.Debug.critical(...) in debug.js (line 368) with red status text + copy block marked [CRITICAL].

### `desktop_launcher.py`
- Events: 56
- L3982 | `change` | I found the exact cause: desktop_launcher.py still had one old fallback string in the GitHub path. I’m removing that, dropping manifest fallback entirely, and making the build script force-close the running client before replacing the root EXE.
- L3995 | `change` | Fixed remaining old string in desktop_launcher.py so 404 now maps to:
- L4485 | `change` | I found two local modifications not yet on GitHub (desktop_launcher.py, updater.js). I’ll commit/push those first so the test release includes the latest updater fixes, then push a new test tag.
- L5263 | `change` | If you want, next I can patch restart reliability further in desktop_launcher.py so after “Update + Restart” it hard-verifies relaunch and reports explicit success/failure in the debug panel.
- L6204 | `change` | I’m going to fix restart at the source by changing the updater flow to launch a detached PowerShell helper (instead of relying on batch startup semantics), then keep a robust batch fallback. I’ll patch desktop_launcher.py, test syntax, and push/tag immediately.
- L6695 | `change` | Updater fallback sprawl: standardized to GitHub-release flow, removed legacy/cascading behavior (updater.js, desktop_launcher.py).
- L6696 | `change` | Integrity check: updater now verifies SHA256 before applying (desktop_launcher.py), and build/release publishes .sha256 (release.yml, publish_github_release.py).
- L6703 | `change` | Rollback health check: pending-update startup health monitor + rollback path now actually runs (desktop_launcher.py).
- L6830 | `change` | Added desktop-host persistent settings file support in desktop_launcher.py:
- L13207 | `command` | Ran rg -n "Platformer.Settings|save\(|load\(|localStorage|pywebview.api|settings" js/core js/scenes desktop_launcher.py
- L13436 | `command` | Ran Get-Content desktop_launcher.py -TotalCount 120
- L13697 | `command` | Ran rg -n "Update|updateBtn|checkForUpdates|autoCheckUpdatesForBottomLeft|applyDownloadedUpdate|start_update_download|update_status|pendingUpdate|Update button|updates" js/scenes/menu-scene.js js/core/updater.js desktop_launcher.py
- L13709 | `command` | Ran Get-Content desktop_launcher.py -TotalCount 860
- L14108 | `command` | Ran rg -n "wait_old_pid|old pid still alive|Waiting for old process|backup retry|replace retry|_write_updater_script" desktop_launcher.py
- L14111 | `command` | Ran Get-Content desktop_launcher.py | Select-Object -First 780 | Select-Object -Skip 640
- L14786 | `command` | Ran Get-Content desktop_launcher.py -TotalCount 380
- L14798 | `command` | Ran rg -n "USER_UPDATER_LOG_PATH|updater.log|update_state.json|apply_" desktop_launcher.py
- L14801 | `command` | Ran Get-Content desktop_launcher.py | Select-Object -Index (450..760)
- L14877 | `command` | Ran rg -n "get_updater_log_path|Helper log expected at|set \"LOG=|LOCALAPPDATA.*updater.log" desktop_launcher.py
- L14883 | `command` | Ran rg -n get_updater_log_path desktop_launcher.py
- L14886 | `command` | Ran rg -n "Helper log expected at" desktop_launcher.py
- L14889 | `command` | Ran rg -n LOG= desktop_launcher.py
- L14892 | `scm-command` | Ran git add desktop_launcher.py && git commit -m "updater: write helper log beside game exe"
- L14892 | `git-commit` | Ran git add desktop_launcher.py && git commit -m "updater: write helper log beside game exe"
- L14895 | `scm-command` | Ran git add desktop_launcher.py; git commit -m "updater: write helper log beside game exe"
- L14895 | `git-commit` | Ran git add desktop_launcher.py; git commit -m "updater: write helper log beside game exe"
- L15065 | `command` | Ran Get-Content desktop_launcher.py | Select-Object -Index (650..760)
- L15166 | `change` | I found uncommitted updater changes locally. I’m committing only the updater fix (desktop_launcher.py), pushing main, then tagging/pushing 2026.02.16.1423 to trigger the release.
- L15168 | `scm-command` | Ran git add desktop_launcher.py; git commit -m "updater: harden helper handoff/restart logging and relaunch"; git push origin main
- L15168 | `git-commit` | Ran git add desktop_launcher.py; git commit -m "updater: harden helper handoff/restart logging and relaunch"; git push origin main
- L15246 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15246 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15324 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15324 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15454 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15454 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15517 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15517 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15572 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15572 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15672 | `command` | Ran rg -n "checksum|sha256|updateAndRestart|downloadedPath|start \"\" \"%TARGET%\"|python311|onefile|_MEI" js/core/updater.js desktop_launcher.py .github/workflows/release.yml scripts/publish_github_release.py
- L15675 | `command` | Ran Get-Content desktop_launcher.py | Select-Object -Index (430..780)
- L15804 | `scm-command` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15804 | `git-commit` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15953 | `command` | Ran Get-Content desktop_launcher.py | Select-Object -Index (670..760)
- L15970 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L15970 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L16893 | `command` | Ran rg -n "def check_update_github|check_update_github|update service|Can't reach update server|no public release|releases/latest|api.github" desktop_launcher.py js/core/updater.js
- L16896 | `command` | Ran Get-Content desktop_launcher.py -First 420
- L16899 | `command` | Ran Get-Content desktop_launcher.py -TotalCount 980 | Select-Object -Skip 400 -First 440
- L17021 | `change` | I fixed it in desktop_launcher.py by:
- L17069 | `command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17219 | `command` | Ran rg -n "Missing cached ldtk-test JSON|falling back to classic level data|diag\.enemies_airborne|diag\.no_projectile_fire|enemies_stalling|player-idle-sheet missing" js/scenes/game-scene.js js/app.bundle.js desktop_launcher.py
- L17262 | `command` | Ran rg -n "test.ldtk|level-ldtk-test|assets/" desktop_launcher.py scripts -g "*"
- L17270 | `command` | Ran Get-Content desktop_launcher.py -TotalCount 320
- L18374 | `command` | Ran rg -n "class .*Scene|UpdateManager|check_update|apply_update|worldmap|ldtk|Hitbox profile|player-idle-sheet|DEBUG_WORLD_MAP" js desktop_launcher.py scripts -S

### `game-scene.js`
- Events: 13
- L1119 | `change` | Also added world guide labels near spawn in game-scene.js (line 143)
- L1150 | `change` | game-scene.js (removed in-world label overlay)
- L1299 | `change` | Fixed enemy edge-turn behavior in game-scene.js.
- L1375 | `change` | Added a visible health bar above the player in game-scene.js.
- L2286 | `change` | Updated game-scene.js:
- L2388 | `change` | Updated game-scene.js in updateEnemyPatrol(...):
- L2402 | `change` | Stuck-recovery logic inside patrol update: game-scene.js (line 813)
- L8807 | `change` | Updated applyVideoSettings in game-scene.js to update the existing brightness overlay instead of stacking new overlays.
- L9494 | `change` | Updated game-scene.js movement logic:
- L9518 | `change` | Updated game-scene.js:
- L9641 | `change` | Updated game-scene.js:
- L17516 | `change` | Added GameScene preload guard to re-load missing LDtk/level-5 JSON before create: game-scene.js (line 125)
- L17517 | `change` | Updated LDtk fallback log/flow so it uses Level 5 fallback data instead of classic fallback: game-scene.js (line 1024)

### `HANDOFF.md`
- Events: 1
- L18372 | `change` | I found no central project docs yet, so I’ll add a focused docs/ set plus a top-level HANDOFF.md. I’m quickly scanning current updater/build/world-map files so the docs match the actual code paths.

### `IFFY_IDLE.png`
- Events: 7
- L2543 | `intent` | Understood. I’ll revert turrets back to the original static hazard and move IFFY_IDLE.png usage to the player only (idle animation), with fallback to your current player textures.
- L6411 | `change` | I’ll fix this warning spam at the source: clean up the player-idle loader so it does one clear check, no repeated fallback URL attempts, and only logs once when IFFY_IDLE.png is missing. Then I’ll push/tag so you can update.
- L18173 | `change` | This critical indicates the imported idle sheet was not created at runtime, so I’m hardening two points now: (1) require IFFY_IDLE.png at build validation, and (2) auto-build a player-idle-sheet fallback from generated player frames so GameScene can’t miss it.
- L18184 | `change` | I confirmed IFFY_IDLE.png is tracked, so this is a runtime sheet-creation failure path. I’m adding a guaranteed fallback player-idle-sheet generator and making IFFY_IDLE.png a required build asset to block bad releases.
- L18184 | `change` | I confirmed IFFY_IDLE.png is tracked, so this is a runtime sheet-creation failure path. I’m adding a guaranteed fallback player-idle-sheet generator and making IFFY_IDLE.png a required build asset to block bad releases.
- L18286 | `change` | I added a hard runtime fallback for idle-sheet creation and made IFFY_IDLE.png required in build validation. I’m rebuilding now and checking that the new fallback log path is present in the bundle.
- L18341 | `change` | Promoted IFFY_IDLE.png to required so bad builds fail early instead of silently degrading.

### `index.html`
- Events: 15
- L1037 | `change` | I’ve finished the modular split and updated index.html to load the new file layout. I’m now adding a compatibility main.js wrapper (instead of deleting) so the repo remains understandable and backward-friendly.
- L1039 | `change` | Refactor complete. The monolith is now split into focused modules and index.html loads them in order.
- L1052 | `change` | Updated script loading in index.html
- L1415 | `change` | Added to index.html script includes
- L2080 | `change` | Debug module is created. I’m wiring it into index.html and wrapping all scenes in main.js so runtime exceptions are captured to the on-screen console with copyable blocks.
- L2108 | `change` | Updated: index.html (includes debug module)
- L2134 | `change` | Updated index.html:
- L2414 | `change` | The interrupted turn deleted level-data.js, so I’m restoring it with a cleaner architecture: level-1.js … level-4.js plus a shared level-data.js loader. I’ll also update index.html script order.
- L2416 | `change` | I’ve split the four levels into separate files. Now I’ll restore level-data.js as a shared dispatcher and update index.html to load all level files correctly.
- L2945 | `change` | I found a critical state issue: your source files (index.html, js/, assets/) are no longer in the workspace root, only build artifacts remain. I need to locate/restore the source tree first before I can add the update button safely.
- L2976 | `change` | index.html restored/updated and includes updater.js
- L3296 | `change` | index.html now loads build-info.js before settings
- L14244 | `command` | Ran Get-Content index.html -TotalCount 260
- L14247 | `command` | Ran rg -n "build_js_bundle|app.bundle|js/core/updater|MenuScene.update|startInAppUpdate|autoCheckUpdatesForBottomLeft" js scripts index.html
- L17319 | `command` | Ran Get-Content index.html

### `intro-scene.js`
- Events: 1
- L1941 | `change` | intro-scene.js (updated tutorial wording)

### `jetpack.js`
- Events: 1
- L9616 | `change` | Added jetpack.js

### `kawaii-anime-girl.gif`
- Events: 2
- L949 | `change` | I see the problem: the victory panel is created before the GIF texture is ready, so it stays on the text fallback. I’m changing it to build/rebuild the character panel at the moment victory starts, so it uses the actual kawaii-anime-girl.gif if available.
- L955 | `change` | Updated main.js so the actual kawaii-anime-girl.gif is used at victory time instead of getting stuck on the fallback.

### `level-1.js`
- Events: 1
- L2414 | `change` | The interrupted turn deleted level-data.js, so I’m restoring it with a cleaner architecture: level-1.js … level-4.js plus a shared level-data.js loader. I’ll also update index.html script order.

### `level-1.json`
- Events: 1
- L6700 | `change` | Level data decoupling: moved level definitions to JSON files loaded at runtime (level-1.json, level-2.json, level-3.json, level-4.json, boot-scene.js, level-data.js).

### `level-2.json`
- Events: 1
- L6700 | `change` | Level data decoupling: moved level definitions to JSON files loaded at runtime (level-1.json, level-2.json, level-3.json, level-4.json, boot-scene.js, level-data.js).

### `level-3.json`
- Events: 1
- L6700 | `change` | Level data decoupling: moved level definitions to JSON files loaded at runtime (level-1.json, level-2.json, level-3.json, level-4.json, boot-scene.js, level-data.js).

### `level-4.js`
- Events: 1
- L2414 | `change` | The interrupted turn deleted level-data.js, so I’m restoring it with a cleaner architecture: level-1.js … level-4.js plus a shared level-data.js loader. I’ll also update index.html script order.

### `level-4.json`
- Events: 1
- L6700 | `change` | Level data decoupling: moved level definitions to JSON files loaded at runtime (level-1.json, level-2.json, level-3.json, level-4.json, boot-scene.js, level-data.js).

### `level-5.js`
- Events: 1
- L17515 | `change` | Added dedicated built-in Level 5 fallback map: level-5.js (line 5)

### `level-data.js`
- Events: 7
- L1964 | `change` | Added turret tiles in level-data.js at:
- L2200 | `change` | I removed 3 hazard turret placements from level-data.js:
- L2275 | `change` | Rebuilt level-data.js so each level has a distinct layout pattern:
- L2414 | `change` | The interrupted turn deleted level-data.js, so I’m restoring it with a cleaner architecture: level-1.js … level-4.js plus a shared level-data.js loader. I’ll also update index.html script order.
- L2414 | `change` | The interrupted turn deleted level-data.js, so I’m restoring it with a cleaner architecture: level-1.js … level-4.js plus a shared level-data.js loader. I’ll also update index.html script order.
- L2416 | `change` | I’ve split the four levels into separate files. Now I’ll restore level-data.js as a shared dispatcher and update index.html to load all level files correctly.
- L6700 | `change` | Level data decoupling: moved level definitions to JSON files loaded at runtime (level-1.json, level-2.json, level-3.json, level-4.json, boot-scene.js, level-data.js).

### `level-ldtk-test.json`
- Events: 1
- L10106 | `change` | Added preload: level-ldtk-test.json

### `Level_01.json`
- Events: 1
- L10147 | `root-cause` | Root cause found: world-map level resolution was deriving Level_01 -> 1 from the string, so changing Level_01.json alone didn’t affect launch. I’m now setting explicit gameLevel: 5 on the Rooftop map nodes (including embedded fallback) and rebuilding.

### `main.js`
- Events: 26
- L64 | `change` | I’ve created the HTML shell and I’m now writing main.js with the full gameplay systems: coyote/buffer jump logic, checkpoint respawn, enemy stomp damage rules, camera follow, and UI scene state handling.
- L794 | `change` | All textures are created at runtime in `main.js` (BootScene) using Phaser Graphics.
- L815 | `change` | Double jump is now added in main.js.
- L834 | `change` | Implemented in main.js:
- L837 | `change` | Updated HUD to show progress as Coins: current/10 in main.js.
- L838 | `change` | Updated start screen text to explicitly state the objective in main.js.
- L839 | `change` | Added level-complete state and trigger in collectCoin() with completeLevel() in main.js.
- L866 | `change` | Updated in main.js:
- L880 | `change` | Added demo shortcut in main.js:
- L910 | `change` | That screenshot is the Phaser missing-texture pattern. I fixed it in main.js by changing how the GIF is loaded:
- L955 | `change` | Updated main.js so the actual kawaii-anime-girl.gif is used at victory time instead of getting stuck on the fallback.
- L1003 | `change` | Implemented in main.js:
- L1029 | `change` | I’ll refactor the monolithic main.js into small modules (config, systems, scenes, level data) while keeping it runnable without build tools. I’m first mapping the current file and then I’ll split it into readable files with ES module imports.
- L1037 | `change` | I’ve finished the modular split and updated index.html to load the new file layout. I’m now adding a compatibility main.js wrapper (instead of deleting) so the repo remains understandable and backward-friendly.
- L1051 | `change` | Added bootstrap entrypoint main.js (creates Phaser config/game)
- L1416 | `change` | Added to scene list in main.js
- L2080 | `change` | Debug module is created. I’m wiring it into index.html and wrapping all scenes in main.js so runtime exceptions are captured to the on-screen console with copyable blocks.
- L2109 | `change` | Updated: main.js (initializes debug + wraps scenes)
- L3070 | `change` | Telemetry hooks are added. Next I’m wiring them in main.js and replacing resize polling with pywebview native size checks so fullscreen size changes are captured even when JS events fail.
- L6698 | `change` | Debug console production gating: debug UI now only initializes when debug build flag is enabled (debug.js, main.js, write_build_info.py).
- L6705 | `change` | Build info validation: hard fail with clear error if build metadata missing (main.js).
- L6708 | `change` | Online retry: update re-check on reconnect wired (main.js).
- L6837 | `change` | Updated main.js:
- L7733 | `change` | Removed risky forced scene resize event emission in global resize sync (main.js).
- L9044 | `change` | Added startup resize pulses in main.js (60/180/420/900ms) so wrappers with stale first frame relayout immediately.
- L9199 | `change` | Added ExtrasScene to bundler order and scene registration in main.js.

### `menu-scene.js`
- Events: 12
- L1118 | `change` | Updated in menu-scene.js (line 22)
- L3357 | `change` | menu-scene.js (Update+Restart UI behavior)
- L3401 | `change` | menu-scene.js: automatic update trigger + status UI
- L5133 | `change` | I’ll simplify that top-right cluster now: remove the top-right “You’re up to date” text entirely, move “What’s Changed” closer to the Update button, and constrain the dropdown panel so it always fits on-screen. I’m patching menu-scene.js directly.
- L5227 | `change` | I’m applying a targeted fix now: disable automatic update apply (manual Update button only), and clean the “What’s Changed” parser/layout so compare links and overflow artifacts stop showing. I’ll patch menu-scene.js, then build and push a new release tag.
- L5246 | `change` | menu-scene.js: autoCheckUpdatesForBottomLeft() now only checks and shows Update found (...) Press Update.
- L5255 | `change` | menu-scene.js: removed visible top-right “You’re up to date” line; bottom-left status remains the single source.
- L6160 | `change` | I found one modified file (menu-scene.js). I’m pushing it now and tagging a new release version so it appears as an update.
- L7003 | `change` | I updated this in menu-scene.js and rebuilt locally.
- L7040 | `change` | Updated menu-scene.js (updateMenuMiniStage) with side-hit detection + damage cooldown + red blink timer.
- L16823 | `change` | There are also local (unpushed) changes from your recent 10-second auto-check work (menu-scene.js and update-manager.js). I’m including those with this release so bundle/source stay consistent, and I’ll stamp build info to 2026.02.16.1624 before pushing.
- L16882 | `change` | Your local 10-second update polling changes (menu-scene.js, update-manager.js) so release behavior matches your latest local build.

### `options-scene.js`
- Events: 2
- L1286 | `change` | Added a prominent red < BACK button in options-scene.js (top-left).
- L3403 | `change` | options-scene.js: toggle for auto-update

### `publish_github_release.py`
- Events: 2
- L6692 | `change` | Release notes: removed static boilerplate in CI and enabled generated notes (release.yml), plus commit-based body generation in local publisher (publish_github_release.py).
- L6696 | `change` | Integrity check: updater now verifies SHA256 before applying (desktop_launcher.py), and build/release publishes .sha256 (release.yml, publish_github_release.py).

### `release.yml`
- Events: 12
- L4452 | `change` | Added GitHub Actions workflow: release.yml
- L6590 | `change` | Issue: release.yml has boilerplate changelog that doesn't reflect actual changes.
- L6622 | `change` | Issue: release.yml uses loose version pins (6.19.0), can break future builds.
- L6692 | `change` | Release notes: removed static boilerplate in CI and enabled generated notes (release.yml), plus commit-based body generation in local publisher (publish_github_release.py).
- L6696 | `change` | Integrity check: updater now verifies SHA256 before applying (desktop_launcher.py), and build/release publishes .sha256 (release.yml, publish_github_release.py).
- L6699 | `change` | Build dep pinning: exact versions moved to requirements-build.txt, used by CI (requirements-build.txt, release.yml).
- L6748 | `change` | CI build: release.yml now runs build_js_bundle.py.
- L15033 | `change` | This should trigger your release.yml workflow and publish release 2026.02.16.1339 for updater testing.
- L15791 | `change` | release.yml
- L15826 | `change` | release.yml now uses python-version: "3.13".
- L15841 | `change` | release.yml
- L16064 | `change` | No local files were committed or altered. This tag push should trigger your release.yml workflow to build/publish the EXE release for updater tests.

### `requirements-build.txt`
- Events: 3
- L6623 | `change` | Fix: Pin exact versions: pyinstaller==6.19.0, pywebview==4.4.1, add requirements-build.txt to track.
- L6699 | `change` | Build dep pinning: exact versions moved to requirements-build.txt, used by CI (requirements-build.txt, release.yml).
- L6699 | `change` | Build dep pinning: exact versions moved to requirements-build.txt, used by CI (requirements-build.txt, release.yml).

### `runw.exe`
- Events: 1
- L6953 | `change` | Build now uses runw.exe (windowed, no terminal).

### `settings.js`
- Events: 7
- L1233 | `change` | Added persistent settings storage in settings.js
- L1727 | `change` | Added persistent flag in settings.js:
- L6610 | `change` | Issue: settings.js:78-100 has no migration path when new settings are added.
- L6697 | `change` | Settings migration: schema versioning + migration + legacy cleanup added (settings.js).
- L6803 | `change` | I fixed the settings reset bug by removing the hard size cap fallback that was overwriting settings with defaults in settings.js.
- L6834 | `change` | Updated settings.js:
- L6948 | `change` | Added explicit bridge-ready wait in settings.js before host read/write.

### `settings.json`
- Events: 1
- L13334 | `change` | Fixed persistence path so hitbox changes are now saved in the durable app settings (host settings.json), not only browser localStorage.

### `test.ldtk`
- Events: 7
- L10065 | `change` | I added the converter. I’ll run it on test.ldtk now and generate a ready-to-use level JSON in assets/levels/.
- L10430 | `change` | New test.ldtk is added, Cavernas_by_Adam_Saltsman is tileset
- L10869 | `change` | Native LDtk rendering is patched in. I’m rebuilding locally now; then level 5 should draw your actual Cavernas tiles from test.ldtk directly.
- L17245 | `command` | Ran rg -n "ldtk|test.ldtk|level-ldtk-test|cached" js -g "*.js"
- L17262 | `command` | Ran rg -n "test.ldtk|level-ldtk-test|assets/" desktop_launcher.py scripts -g "*"
- L17265 | `change` | I confirmed the fallback is hardcoded. Next I’m checking packaging/build scripts to verify whether test.ldtk is missing from distributed EXEs, then I’ll patch only the level-5 LDtk load path to avoid this failure for testers.
- L17998 | `command` | Ran rg -n "GameScene.preload|player-idle-sheet missing|Missing cached ldtk-test JSON|No levels in test.ldtk|No IntGrid layer|Invalid IntGrid dimensions|ldtk-cavernas texture missing|playerIdleAnim not found" js/scenes/game-scene.js

### `ui-scene.js`
- Events: 2
- L1112 | `change` | Added in ui-scene.js (line 69)
- L1151 | `change` | ui-scene.js (removed startup legend text)

### `update-manager.js`
- Events: 16
- L14253 | `change` | update-manager.js
- L14488 | `change` | I found there is already a update-manager.js file, so I’m going to consolidate the current menu update flow into that module (or replace it cleanly) instead of adding a second updater abstraction. Then I’ll wire MenuScene to only call that module APIs.
- L14710 | `change` | File: update-manager.js
- L14731 | `change` | update-manager.js"
- L14754 | `change` | build_js_bundle.py: added update-manager.js" to ORDER right after updater.js.
- L16256 | `change` | update-manager.js
- L16320 | `change` | update-manager.js
- L16347 | `change` | update-manager.js
- L16432 | `change` | update-manager.js
- L16479 | `change` | update-manager.js
- L16515 | `change` | update-manager.js
- L16551 | `change` | update-manager.js
- L16644 | `change` | update-manager.js
- L16756 | `change` | update-manager.js
- L16823 | `change` | There are also local (unpushed) changes from your recent 10-second auto-check work (menu-scene.js and update-manager.js). I’m including those with this release so bundle/source stay consistent, and I’ll stamp build info to 2026.02.16.1624 before pushing.
- L16882 | `change` | Your local 10-second update polling changes (menu-scene.js, update-manager.js) so release behavior matches your latest local build.

### `update_state.json`
- Events: 1
- L14798 | `command` | Ran rg -n "USER_UPDATER_LOG_PATH|updater.log|update_state.json|apply_" desktop_launcher.py

### `updater.js`
- Events: 6
- L2976 | `change` | index.html restored/updated and includes updater.js
- L3400 | `change` | updater.js: update orchestration + progress polling
- L4485 | `change` | I found two local modifications not yet on GitHub (desktop_launcher.py, updater.js). I’ll commit/push those first so the test release includes the latest updater fixes, then push a new test tag.
- L5275 | `change` | updater.js: updater now always falls back to default repo zyynx-hub/Platformer if build repo is missing.
- L6695 | `change` | Updater fallback sprawl: standardized to GitHub-release flow, removed legacy/cascading behavior (updater.js, desktop_launcher.py).
- L14754 | `change` | build_js_bundle.py: added update-manager.js" to ORDER right after updater.js.

### `validate_assets.py`
- Events: 3
- L6701 | `change` | Asset validation: added build-time asset validator (validate_assets.py, wired in CI/local build).
- L6707 | `change` | Missing asset degradation: optional asset warnings/fallback path preserved; criticals now validated pre-build (boot-scene.js, validate_assets.py).
- L18677 | `change` | Your workspace still has pre-existing modified files (app.bundle.js, app.bundle.js.map, build-info.js, boot-scene.js, validate_assets.py) plus updater.log untracked.

### `world.config.json`
- Events: 2
- L8661 | `change` | Added themed color parsing from world.config.json
- L8708 | `change` | Updated theme colors in world.config.json.

### `WorldMapManager.js`
- Events: 1
- L8073 | `change` | Added WorldMapManager.js to bundle order.

### `WorldMapView.js`
- Events: 1
- L8135 | `change` | Added WorldMapView.js to bundle order.

### `write_build_info.py`
- Events: 3
- L3663 | `change` | Extend write_build_info.py to also emit update defaults:
- L6646 | `change` | Issue: write_build_info.py:1-30 creates build-info.js but game doesn't validate it exists or is valid.
- L6698 | `change` | Debug console production gating: debug UI now only initializes when debug build flag is enabled (debug.js, main.js, write_build_info.py).

### `assets/Cavernas_by_Adam_Saltsman.png`
- Events: 3
- L17276 | `command` | Ran Get-Item assets/test.ldtk, assets/levels/level-ldtk-test.json, assets/Cavernas_by_Adam_Saltsman.png | Select-Object FullName,Length
- L17279 | `command` | Ran git ls-files assets/test.ldtk assets/levels/level-ldtk-test.json assets/Cavernas_by_Adam_Saltsman.png
- L17492 | `command` | Ran rg -n "assets/levels/level-ldtk-test.json|assets/test.ldtk|assets/Cavernas_by_Adam_Saltsman.png" scripts/validate_assets.py

### `assets/IFFY_IDLE.png`
- Events: 2
- L18167 | `command` | Ran Get-Item assets/IFFY_IDLE.png | Select-Object FullName,Length,LastWriteTime
- L18178 | `command` | Ran git ls-files assets/IFFY_IDLE.png

### `assets/test.ldtk`
- Events: 8
- L10221 | `command` | Ran @' import json p='assets/test.ldtk' with open(p,'r',encoding='utf-8') as f: d=json.load(f) print('jsonVersion',d.get('jsonVersion'),'worldGrid',d.get('defaultGridSize')) levels=d.get('levels',[]) print('levels',len(levels)) for lv in levels: print('\nLEVEL',lv.get('identifier'),'px',lv.get('pxWid'),lv.get('pxHei'),'worldX',lv.get('worldX'),'worldY',lv.get('worldY')) for li in lv.get('layerInstances') or []: print(' -',li.get('__identifier'),'type',li.get('__type'),'grid',li.get('__gridSize'),'cWid',li.get('__cWid'),'cHei',li.get('__cHei'),'intGridCsv',len(li.get('intGridCsv') or []),'autoTiles',len(li.get('autoLayerTiles') or []),'gridTiles',len(li.get('gridTiles') or [])) '@ | py -
- L10275 | `command` | Ran py scripts/convert_ldtk_to_level_json.py --in assets/test.ldtk --out assets/levels/level-ldtk-test.json --add-spawn --target-grid 32 --merge-threshold 0.5
- L10497 | `command` | Ran @' import json p='assets/test.ldtk' with open(p,'r',encoding='utf-8') as f:d=json.load(f) print('defaultGridSize=',d.get('defaultGridSize')) for lv in d.get('levels') or []: print('LEVEL',lv.get('identifier'),'size',lv.get('pxWid'),lv.get('pxHei')) for li in lv.get('layerInstances') or []: print(' ',li.get('__identifier'),'type',li.get('__type'),'grid',li.get('__gridSize'),'auto',len(li.get('autoLayerTiles') or []),'int',len(li.get('intGridCsv') or []),'tileset',li.get('__tilesetRelPath')) '@ | py -
- L17276 | `command` | Ran Get-Item assets/test.ldtk, assets/levels/level-ldtk-test.json, assets/Cavernas_by_Adam_Saltsman.png | Select-Object FullName,Length
- L17279 | `command` | Ran git ls-files assets/test.ldtk assets/levels/level-ldtk-test.json assets/Cavernas_by_Adam_Saltsman.png
- L17282 | `command` | Ran Get-Content assets/test.ldtk -TotalCount 40
- L17492 | `command` | Ran rg -n "assets/levels/level-ldtk-test.json|assets/test.ldtk|assets/Cavernas_by_Adam_Saltsman.png" scripts/validate_assets.py
- L17498 | `command` | Ran rg -n "BootScene.ldtk|Failed to load assets/test.ldtk|Failed to load Cavernas" js/scenes/boot-scene.js

### `BootScene/.ldtk`
- Events: 1
- L18049 | `command` | Ran rg -n "BootScene\.playerIdle|BootScene\.ldtk|BootScene\.levels|GameScene\.ldtk|GameScene\.playerIdle|critical\(" js/scenes js/core/debug.js

### `GameScene/.ldtk`
- Events: 1
- L18049 | `command` | Ran rg -n "BootScene\.playerIdle|BootScene\.ldtk|BootScene\.levels|GameScene\.ldtk|GameScene\.playerIdle|critical\(" js/scenes js/core/debug.js

### `js/app.bundle.js`
- Events: 52
- L14703 | `command` | Ran rg -n "new Platformer.UpdateManager|handleUpdateClick\(|autoCheck\(\)" js/app.bundle.js
- L14961 | `scm-command` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L14961 | `git-commit` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L15246 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15246 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15324 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15324 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15454 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15454 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15517 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15517 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15572 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15572 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15804 | `scm-command` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15804 | `git-commit` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15970 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L15970 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L16125 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map && git commit -m "menu: add top-left test build marker"
- L16125 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map && git commit -m "menu: add top-left test build marker"
- L16129 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: add top-left test build marker"
- L16129 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: add top-left test build marker"
- L16211 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: remove temporary test marker"
- L16211 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: remove temporary test marker"
- L16244 | `command` | Ran rg -n "Checking for updates|up to date|Up to date|autoCheck|setBottomLeftUpdateStatus|checkForUpdates|check_update" js/scenes/menu-scene.js js/systems/update-manager.js js/core/updater.js js/app.bundle.js
- L16308 | `command` | Ran rg -n "autoCheckRetryCount|Update service not ready|setBottomLeftUpdateStatus\(text, sticky\)" js/systems/update-manager.js js/app.bundle.js
- L16454 | `command` | Ran rg -n "timed out \(8000ms\)|check_update_github start|autoCheck failed:|autoCheck returned empty" js/core/updater.js js/systems/update-manager.js js/app.bundle.js
- L16533 | `command` | Ran rg -n "lastManualUpdateAt = -1|lastManualUpdateAt >= 0" js/systems/update-manager.js js/app.bundle.js
- L16586 | `scm-command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16586 | `git-commit` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16593 | `command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js
- L16741 | `command` | Ran rg -n "startUpdatePolling|Background update polling active|autoCheck\(\{ showChecking: false \}\)|autoCheckInFlight" js/scenes/menu-scene.js js/systems/update-manager.js js/app.bundle.js
- L16783 | `command` | Ran rg -n "Runtime Debug Console|DEBUG|panel|logEl|overflow|height|boxSizing|padding|scroll" js/core/debug.js js/app.bundle.js
- L16844 | `scm-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16844 | `git-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16849 | `command` | Ran git add js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17069 | `command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17219 | `command` | Ran rg -n "Missing cached ldtk-test JSON|falling back to classic level data|diag\.enemies_airborne|diag\.no_projectile_fire|enemies_stalling|player-idle-sheet missing" js/scenes/game-scene.js js/app.bundle.js desktop_launcher.py
- L17242 | `command` | Ran rg -n "tryBuildLevelFromLdtk|Missing cached ldtk-test JSON|ldtk-test|fallback to classic level data" js/scenes/game-scene.js js/app.bundle.js
- L17439 | `command` | Ran rg -n "using Level 5 fallback data|LDtk preload guard failed|level/level-5.js" js/app.bundle.js
- L17442 | `command` | Ran git ls-files js/app.bundle.js js/app.bundle.js.map
- L17468 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17468 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17771 | `command` | Ran rg -n "menu-bgm loaderror|menu-bgm add failed|player-idle-sheet missing, using fallback idle textures|Missing cached ldtk-test JSON; using Level 5 fallback data|LevelFallbackSize\[5\]" js/scenes js/level js/app.bundle.js
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L18067 | `command` | Ran rg -n "using classic fallback level" js/scenes/game-scene.js js/app.bundle.js
- L18123 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18123 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18294 | `command` | Ran rg -n "setupFallbackPlayerIdleSheet|Built fallback idle sheet|Failed to add player-idle-sheet" js/scenes/boot-scene.js js/app.bundle.js
- L18326 | `command` | Ran rg -n "setupFallbackPlayerIdleSheet|Fallback idle sheet|player-idle-sheet missing, using fallback" js/app.bundle.js scripts/validate_assets.py

### `js/app.bundle.js.map`
- Events: 38
- L14961 | `scm-command` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L14961 | `git-commit` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L15246 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15246 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15324 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15324 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15454 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15454 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15517 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15517 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15572 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15572 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15804 | `scm-command` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15804 | `git-commit` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15970 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L15970 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L16125 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map && git commit -m "menu: add top-left test build marker"
- L16125 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map && git commit -m "menu: add top-left test build marker"
- L16129 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: add top-left test build marker"
- L16129 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: add top-left test build marker"
- L16211 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: remove temporary test marker"
- L16211 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: remove temporary test marker"
- L16586 | `scm-command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16586 | `git-commit` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16593 | `command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js
- L16844 | `scm-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16844 | `git-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16849 | `command` | Ran git add js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17069 | `command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17442 | `command` | Ran git ls-files js/app.bundle.js js/app.bundle.js.map
- L17468 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17468 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L18123 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18123 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"

### `js/main.js`
- Events: 6
- L11433 | `command` | Ran rg -n "createJetpackFx|updateJetpackFx|tinyGridMode|setLerp|setRoundPixels|pixelArt|roundPixels|maxSpeed|acceleration|drag" js/scenes/game-scene.js js/main.js js/core/constants.js
- L12617 | `command` | Ran rg -n "DEBUG|debug|Runtime Debug Console|Copy latest error|toggle|button|window\.Platformer" js/core/debug.js js/scenes/game-scene.js js/main.js js/scenes/ui-scene.js
- L13102 | `command` | Ran Get-Content js/main.js -First 220
- L13324 | `command` | Ran Get-Content js/main.js -TotalCount 260
- L16390 | `command` | Ran Get-Content js\main.js -First 260
- L17322 | `command` | Ran Get-Content js/main.js

### `level/level-5.js`
- Events: 2
- L17439 | `command` | Ran rg -n "using Level 5 fallback data|LDtk preload guard failed|level/level-5.js" js/app.bundle.js
- L17495 | `command` | Ran rg -n "level/level-5.js" scripts/build_js_bundle.py

### `scripts/build_js_bundle.py`
- Events: 69
- L10176 | `command` | Ran py scripts/build_js_bundle.py
- L10636 | `command` | Ran py scripts/build_js_bundle.py
- L10871 | `command` | Ran py scripts/build_js_bundle.py
- L10944 | `command` | Ran py scripts/build_js_bundle.py
- L11027 | `command` | Ran py scripts/build_js_bundle.py
- L11340 | `command` | Ran py scripts/build_js_bundle.py
- L11364 | `command` | Ran py scripts/build_js_bundle.py
- L11381 | `command` | Ran py scripts/build_js_bundle.py
- L11517 | `command` | Ran py scripts/build_js_bundle.py
- L11673 | `command` | Ran py scripts/build_js_bundle.py
- L11770 | `command` | Ran py scripts/build_js_bundle.py
- L11830 | `command` | Ran py scripts/build_js_bundle.py
- L11871 | `command` | Ran py scripts/build_js_bundle.py
- L11915 | `command` | Ran py scripts/build_js_bundle.py
- L11973 | `command` | Ran py scripts/build_js_bundle.py
- L12014 | `command` | Ran py scripts/build_js_bundle.py
- L12065 | `command` | Ran py scripts/build_js_bundle.py
- L12150 | `command` | Ran py scripts/build_js_bundle.py
- L12255 | `command` | Ran py scripts/build_js_bundle.py
- L12301 | `command` | Ran py scripts/build_js_bundle.py
- L12370 | `command` | Ran py scripts/build_js_bundle.py
- L12379 | `command` | Ran py scripts/build_js_bundle.py
- L12450 | `command` | Ran py scripts/build_js_bundle.py
- L12497 | `command` | Ran py scripts/build_js_bundle.py
- L12543 | `command` | Ran py scripts/build_js_bundle.py
- L12591 | `command` | Ran py scripts/build_js_bundle.py
- L12792 | `command` | Ran py scripts/build_js_bundle.py
- L13044 | `command` | Ran py scripts/build_js_bundle.py
- L13173 | `command` | Ran py scripts/build_js_bundle.py
- L13327 | `command` | Ran py scripts/build_js_bundle.py
- L13409 | `command` | Ran py scripts/build_js_bundle.py
- L13549 | `command` | Ran py scripts/build_js_bundle.py
- L13807 | `command` | Ran py scripts/build_js_bundle.py
- L13835 | `command` | Ran py scripts/build_js_bundle.py
- L13953 | `command` | Ran py scripts/build_js_bundle.py
- L14058 | `command` | Ran py scripts/build_js_bundle.py
- L14142 | `command` | Ran py scripts/build_js_bundle.py
- L14208 | `command` | Ran py scripts/build_js_bundle.py
- L14241 | `command` | Ran Get-Content scripts/build_js_bundle.py -TotalCount 260
- L14485 | `command` | Ran Get-Content scripts/build_js_bundle.py -TotalCount 260
- L14694 | `command` | Ran py scripts/build_js_bundle.py
- L14961 | `scm-command` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L14961 | `git-commit` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L16117 | `command` | Ran py scripts\build_js_bundle.py
- L16205 | `command` | Ran py scripts\build_js_bundle.py
- L16305 | `command` | Ran py scripts\build_js_bundle.py
- L16457 | `command` | Ran py scripts\build_js_bundle.py
- L16530 | `command` | Ran py scripts\build_js_bundle.py
- L16738 | `command` | Ran py scripts\build_js_bundle.py
- L16820 | `command` | Ran py scripts\build_js_bundle.py
- L16828 | `command` | Ran py scripts\build_js_bundle.py
- L16838 | `command` | Ran py scripts\build_js_bundle.py
- L17066 | `command` | Ran py scripts\build_js_bundle.py
- L17325 | `command` | Ran Get-Content scripts/build_js_bundle.py
- L17430 | `command` | Ran python scripts/build_js_bundle.py
- L17436 | `scm-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17436 | `git-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17468 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17468 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17495 | `command` | Ran rg -n "level/level-5.js" scripts/build_js_bundle.py
- L17765 | `command` | Ran python scripts/build_js_bundle.py
- L17807 | `command` | Ran python scripts/build_js_bundle.py
- L18046 | `command` | Ran python scripts/build_js_bundle.py
- L18070 | `command` | Ran python scripts/build_js_bundle.py
- L18075 | `command` | Ran Get-Content scripts/build_js_bundle.py -TotalCount 80
- L18288 | `command` | Ran python scripts/build_js_bundle.py
- L18320 | `command` | Ran python scripts/build_js_bundle.py

### `scripts/convert_ldtk_to_level_json.py`
- Events: 2
- L10226 | `command` | Ran Get-Content -Raw scripts/convert_ldtk_to_level_json.py
- L10275 | `command` | Ran py scripts/convert_ldtk_to_level_json.py --in assets/test.ldtk --out assets/levels/level-ldtk-test.json --add-spawn --target-grid 32 --merge-threshold 0.5

### `scripts/publish_github_release.py`
- Events: 10
- L4133 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L4214 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L4321 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L4413 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L4430 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L13622 | `command` | Ran Get-Content scripts/publish_github_release.py -TotalCount 320
- L14795 | `command` | Ran Get-Content scripts/publish_github_release.py -TotalCount 500
- L15672 | `command` | Ran rg -n "checksum|sha256|updateAndRestart|downloadedPath|start \"\" \"%TARGET%\"|python311|onefile|_MEI" js/core/updater.js desktop_launcher.py .github/workflows/release.yml scripts/publish_github_release.py
- L16025 | `command` | Ran Get-Content scripts\publish_github_release.py -First 260
- L18391 | `command` | Ran Get-Content scripts/publish_github_release.py

### `scripts/publish_release.py`
- Events: 1
- L14789 | `command` | Ran Get-Content scripts/publish_release.py -TotalCount 420

### `scripts/validate_assets.py`
- Events: 19
- L17267 | `command` | Ran Get-Content scripts/validate_assets.py
- L17436 | `scm-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17436 | `git-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17457 | `command` | Ran python scripts/validate_assets.py
- L17468 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17468 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17492 | `command` | Ran rg -n "assets/levels/level-ldtk-test.json|assets/test.ldtk|assets/Cavernas_by_Adam_Saltsman.png" scripts/validate_assets.py
- L17768 | `command` | Ran python scripts/validate_assets.py
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L18164 | `command` | Ran Get-Content scripts/validate_assets.py
- L18170 | `command` | Ran rg -n "player-idle-raw|player-idle-sheet|setupPlayerIdleAnimation|playerIdleAnim" js/scenes/boot-scene.js js/scenes/game-scene.js scripts/validate_assets.py
- L18175 | `command` | Ran Get-Content scripts/validate_assets.py
- L18291 | `command` | Ran python scripts/validate_assets.py
- L18309 | `command` | Ran rg -n "setupPlayerIdleAnimation|player-idle-sheet|playerIdleAnim|IFFY_IDLE" js/scenes/boot-scene.js js/scenes/game-scene.js scripts/validate_assets.py
- L18315 | `command` | Ran Get-Content scripts/validate_assets.py
- L18326 | `command` | Ran rg -n "setupFallbackPlayerIdleSheet|Fallback idle sheet|player-idle-sheet missing, using fallback" js/app.bundle.js scripts/validate_assets.py

### `scripts/write_build_info.py`
- Events: 5
- L13700 | `command` | Ran Get-Content scripts/write_build_info.py -TotalCount 260
- L14994 | `command` | Ran Get-Content scripts/write_build_info.py -TotalCount 260
- L16031 | `command` | Ran Get-Content scripts\write_build_info.py -First 260
- L18437 | `change` | - `js/core/build-info.js` generated by `scripts/write_build_info.py`.
- L18510 | `change` | - Build metadata: `scripts/write_build_info.py`

### `systems/update-manager.js`
- Events: 1
- L14690 | `change` | "systems/update-manager.js",

### `.github/workflows/release.yml`
- Events: 8
- L13650 | `command` | Ran Get-Content .github/workflows/release.yml -TotalCount 420
- L15005 | `command` | Ran Get-Content .github/workflows/release.yml -TotalCount 320
- L15672 | `command` | Ran rg -n "checksum|sha256|updateAndRestart|downloadedPath|start \"\" \"%TARGET%\"|python311|onefile|_MEI" js/core/updater.js desktop_launcher.py .github/workflows/release.yml scripts/publish_github_release.py
- L15804 | `scm-command` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15804 | `git-commit` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15860 | `change` | .github/workflows/release.yml
- L16043 | `command` | Ran Get-Content .github\workflows\release.yml -First 320
- L17310 | `command` | Ran Get-Content .github/workflows/release.yml

### `assets/levels/level-1.json`
- Events: 1
- L10553 | `command` | Ran Get-Content -Raw assets/levels/level-1.json

### `assets/levels/level-2.json`
- Events: 1
- L10550 | `command` | Ran Get-Content -Raw assets/levels/level-2.json

### `assets/levels/level-3.json`
- Events: 1
- L10559 | `command` | Ran Get-Content -Raw assets/levels/level-3.json

### `assets/levels/level-4.json`
- Events: 1
- L10556 | `command` | Ran Get-Content -Raw assets/levels/level-4.json

### `assets/levels/level-ldtk-test.json`
- Events: 6
- L10275 | `command` | Ran py scripts/convert_ldtk_to_level_json.py --in assets/test.ldtk --out assets/levels/level-ldtk-test.json --add-spawn --target-grid 32 --merge-threshold 0.5
- L10278 | `command` | Ran Get-Content -Raw assets/levels/level-ldtk-test.json
- L17276 | `command` | Ran Get-Item assets/test.ldtk, assets/levels/level-ldtk-test.json, assets/Cavernas_by_Adam_Saltsman.png | Select-Object FullName,Length
- L17279 | `command` | Ran git ls-files assets/test.ldtk assets/levels/level-ldtk-test.json assets/Cavernas_by_Adam_Saltsman.png
- L17289 | `command` | Ran Get-Content assets/levels/level-ldtk-test.json
- L17492 | `command` | Ran rg -n "assets/levels/level-ldtk-test.json|assets/test.ldtk|assets/Cavernas_by_Adam_Saltsman.png" scripts/validate_assets.py

### `build/portable_out/AnimePlatformer.exe`
- Events: 7
- L4133 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L4214 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L4224 | `change` | build\portable_out\AnimePlatformer.exe
- L4321 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L4413 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L4430 | `change` | py scripts\publish_github_release.py --repo "zyynx-hub/Platformer" --channel "stable" --exe "build\portable_out\AnimePlatformer.exe"
- L18426 | `change` | - Also in: `build\portable_out\AnimePlatformer.exe`

### `env:LOCALAPPDATA/AnimePlatformer/update_state.json`
- Events: 1
- L14027 | `command` | Ran Get-Content "$env:LOCALAPPDATA\AnimePlatformer\update_state.json" -Raw

### `js/core/build-info.js`
- Events: 36
- L13706 | `command` | Ran Get-Content js/core/build-info.js -TotalCount 140
- L14961 | `scm-command` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L14961 | `git-commit` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L14978 | `command` | Ran Get-Content js/core/build-info.js -TotalCount 120
- L15246 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15246 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: force old pid kill after timeout during apply handoff"
- L15324 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15324 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: replace PID wait with pure batch loop and forced kill"; git push origin HEAD:main
- L15454 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15454 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove tasklist/find wait loop and force-close old pid"; git push origin HEAD:main
- L15517 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15517 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: avoid killing helper tree when closing old pid"; git push origin HEAD:main
- L15572 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15572 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: remove explicit pid kill, rely on lock-retry apply"; git push origin HEAD:main
- L15610 | `command` | Ran Get-Content js/core/build-info.js -TotalCount 40
- L15804 | `scm-command` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15804 | `git-commit` | Ran git add desktop_launcher.py .github/workflows/release.yml js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: verify restart health and rollback; align CI Python to 3.13"; git push origin HEAD:main
- L15970 | `scm-command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L15970 | `git-commit` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map; git commit -m "updater: scrub PyInstaller env before relaunch and silence helper console"; git push origin HEAD:main
- L16037 | `command` | Ran (Get-Content js\core\build-info.js | Select-String 'BUILD_VERSION').Line
- L16572 | `command` | Ran (Get-Content js\core\build-info.js | Select-String 'BUILD_VERSION').Line
- L16586 | `scm-command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16586 | `git-commit` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16593 | `command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js
- L16844 | `scm-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16844 | `git-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16849 | `command` | Ran git add js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17069 | `command` | Ran git add desktop_launcher.py js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17454 | `command` | Ran Get-Content js/core/build-info.js
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L18123 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18123 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18388 | `command` | Ran Get-Content js/core/build-info.js
- L18437 | `change` | - `js/core/build-info.js` generated by `scripts/write_build_info.py`.
- L18477 | `change` | - `js/core/build-info.js` (generated)

### `js/core/constants.js`
- Events: 2
- L10542 | `command` | Ran Get-Content -Raw js/core/constants.js
- L11433 | `command` | Ran rg -n "createJetpackFx|updateJetpackFx|tinyGridMode|setLerp|setRoundPixels|pixelArt|roundPixels|maxSpeed|acceleration|drag" js/scenes/game-scene.js js/main.js js/core/constants.js

### `js/core/debug.js`
- Events: 18
- L12617 | `command` | Ran rg -n "DEBUG|debug|Runtime Debug Console|Copy latest error|toggle|button|window\.Platformer" js/core/debug.js js/scenes/game-scene.js js/main.js js/scenes/ui-scene.js
- L12620 | `command` | Ran Get-Content js/core/debug.js -First 260
- L12628 | `command` | Ran Get-Content js/core/debug.js -TotalCount 420
- L13099 | `command` | Ran rg -n "platformer_player_hitbox|getPlayerHitboxProfile|setPlayerHitboxProfile|loadPlayerHitboxProfile" js/core/debug.js js/scenes/game-scene.js
- L13111 | `command` | Ran rg -n "applyTinyPlayerHitboxProfile|player_hitbox|platformer_player_hitbox|getPlayerHitboxProfile" js/scenes/game-scene.js js/core/debug.js
- L13117 | `command` | Ran Get-Content js/core/debug.js -TotalCount 560
- L16780 | `command` | Ran Get-Content js/core/debug.js -First 420
- L16783 | `command` | Ran rg -n "Runtime Debug Console|DEBUG|panel|logEl|overflow|height|boxSizing|padding|scroll" js/core/debug.js js/app.bundle.js
- L16844 | `scm-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16844 | `git-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16849 | `command` | Ran git add js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17928 | `command` | Ran rg -n "Platformer\.Debug\.(warn|error|log)\(" js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js js/core/debug.js
- L17931 | `command` | Ran Get-Content js/core/debug.js -TotalCount 260
- L17934 | `command` | Ran rg -n "log\(|warn\(|error\(|critical|fatal|pushLine|format" js/core/debug.js
- L17937 | `command` | Ran Get-Content js/core/debug.js -TotalCount 560 | Select-Object -Last 240
- L18049 | `command` | Ran rg -n "BootScene\.playerIdle|BootScene\.ldtk|BootScene\.levels|GameScene\.ldtk|GameScene\.playerIdle|critical\(" js/scenes js/core/debug.js
- L18123 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18123 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"

### `js/core/settings.js`
- Events: 1
- L13204 | `command` | Ran Get-Content js/core/settings.js -TotalCount 420

### `js/core/updater.js`
- Events: 13
- L13697 | `command` | Ran rg -n "Update|updateBtn|checkForUpdates|autoCheckUpdatesForBottomLeft|applyDownloadedUpdate|start_update_download|update_status|pendingUpdate|Update button|updates" js/scenes/menu-scene.js js/core/updater.js desktop_launcher.py
- L13703 | `command` | Ran Get-Content js/core/updater.js -TotalCount 260
- L14961 | `scm-command` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L14961 | `git-commit` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L15669 | `command` | Ran Get-Content js/core/updater.js -TotalCount 360
- L15672 | `command` | Ran rg -n "checksum|sha256|updateAndRestart|downloadedPath|start \"\" \"%TARGET%\"|python311|onefile|_MEI" js/core/updater.js desktop_launcher.py .github/workflows/release.yml scripts/publish_github_release.py
- L16244 | `command` | Ran rg -n "Checking for updates|up to date|Up to date|autoCheck|setBottomLeftUpdateStatus|checkForUpdates|check_update" js/scenes/menu-scene.js js/systems/update-manager.js js/core/updater.js js/app.bundle.js
- L16250 | `command` | Ran Get-Content js\core\updater.js -First 360
- L16454 | `command` | Ran rg -n "timed out \(8000ms\)|check_update_github start|autoCheck failed:|autoCheck returned empty" js/core/updater.js js/systems/update-manager.js js/app.bundle.js
- L16586 | `scm-command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16586 | `git-commit` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16593 | `command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js
- L16893 | `command` | Ran rg -n "def check_update_github|check_update_github|update service|Can't reach update server|no public release|releases/latest|api.github" desktop_launcher.py js/core/updater.js

### `js/level/level-5.js`
- Events: 10
- L17436 | `scm-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17436 | `git-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17468 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17468 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17489 | `command` | Ran rg -n "preload\(\)|Missing cached ldtk-test JSON|LevelBuilders\[5\]" js/scenes/game-scene.js js/level/level-5.js
- L17631 | `command` | Ran rg -n "Missing cached ldtk-test JSON|tryBuildLevelFromLdtk|createLevelData\(|LevelBuilders" js/scenes/game-scene.js js/level/level-data.js js/level/level-5.js
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"

### `js/level/level-data.js`
- Events: 5
- L10124 | `command` | Ran Get-Content -Raw js/level/level-data.js
- L17295 | `command` | Ran Get-Content js/level/level-data.js
- L17631 | `command` | Ran rg -n "Missing cached ldtk-test JSON|tryBuildLevelFromLdtk|createLevelData\(|LevelBuilders" js/scenes/game-scene.js js/level/level-data.js js/level/level-5.js
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"

### `js/scenes/boot-scene.js`
- Events: 23
- L17256 | `command` | Ran Get-Content js/scenes/boot-scene.js -TotalCount 180
- L17298 | `command` | Ran rg -n "LevelJsonCache|level-1|level-5|cache.json.get\(" js/scenes/boot-scene.js && Get-Content js/scenes/boot-scene.js -Tail 240
- L17298 | `command` | Ran rg -n "LevelJsonCache|level-1|level-5|cache.json.get\(" js/scenes/boot-scene.js && Get-Content js/scenes/boot-scene.js -Tail 240
- L17301 | `command` | Ran rg -n "LevelJsonCache|level-1|level-5|cache.json.get\(" js/scenes/boot-scene.js
- L17304 | `command` | Ran Get-Content js/scenes/boot-scene.js -Tail 280
- L17436 | `scm-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17436 | `git-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17468 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17468 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17498 | `command` | Ran rg -n "BootScene.ldtk|Failed to load assets/test.ldtk|Failed to load Cavernas" js/scenes/boot-scene.js
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17925 | `command` | Ran Get-Content js/scenes/boot-scene.js -TotalCount 220
- L17928 | `command` | Ran rg -n "Platformer\.Debug\.(warn|error|log)\(" js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js js/core/debug.js
- L18123 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18123 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18170 | `command` | Ran rg -n "player-idle-raw|player-idle-sheet|setupPlayerIdleAnimation|playerIdleAnim" js/scenes/boot-scene.js js/scenes/game-scene.js scripts/validate_assets.py
- L18181 | `command` | Ran Get-Content js/scenes/boot-scene.js -TotalCount 460 | Select-Object -Last 190
- L18294 | `command` | Ran rg -n "setupFallbackPlayerIdleSheet|Built fallback idle sheet|Failed to add player-idle-sheet" js/scenes/boot-scene.js js/app.bundle.js
- L18309 | `command` | Ran rg -n "setupPlayerIdleAnimation|player-idle-sheet|playerIdleAnim|IFFY_IDLE" js/scenes/boot-scene.js js/scenes/game-scene.js scripts/validate_assets.py
- L18312 | `command` | Ran Get-Content js/scenes/boot-scene.js | Select-Object -Skip 330 -First 170

### `js/scenes/game-scene.js`
- Events: 78
- L10127 | `command` | Ran Get-Content -Raw js/scenes/game-scene.js
- L10443 | `command` | Ran rg -n "hasSupportAtWorld|mapRows|mapWidth|mapHeight|normalizeTurretTiles|normalizeEnemyTiles" js/scenes/game-scene.js | Select-Object -First 200
- L10539 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 920 | Select-Object -Last 260
- L10545 | `command` | Ran rg -n "setZoom|zoomTo|updateCameraFraming|TILE|jumpVelocity|maxSpeed|gravity" js/scenes/game-scene.js | Select-Object -First 200
- L10687 | `command` | Ran rg -n "createTokyoBackdrop|mapRows = Platformer.createLevelData|for \(let y = 0; y < this.mapHeight|this.solids =|this.createTokyoBackdrop" js/scenes/game-scene.js | Select-Object -First 200
- L10690 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 760
- L11049 | `command` | Ran rg -n "\bPLAYER\b|createPlayerHealthBar\(|updatePlayerHealthBar\(|createJetpackFx\(|updateJetpackFx\(|projectileSpeed|enemyPatrolSpeed|py \+ 10|setDisplaySize\(|body.setSize\(" js/scenes/game-scene.js
- L11148 | `command` | Ran rg -n "buildControlKeyMap\(|createPlayerHealthBar\(|createJetpackFx\(|updateJetpackFx\(|updatePlayerHealthBar\(|updateCameraFraming\(|tryStartDash\(|tryAttack\(|handleEnemyContact\(|update\(\)" js/scenes/game-scene.js
- L11151 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 620 | Select-Object -Last 220
- L11154 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 1900 | Select-Object -Last 420
- L11346 | `command` | Ran rg -n "const \{ PLAYER|Platformer\.Config\.PLAYER|jumpVelocity\*|maxSpeed|setZoom\(|jetpackFlameOffsetY|hpBarCfg" js/scenes/game-scene.js | Select-Object -First 260
- L11373 | `command` | Ran rg -n "buildPlayerTuning|buildJetpackTuning|tinyGridMode|updateCameraFraming|createJetpackFx|updateJetpackFx" js/scenes/game-scene.js
- L11391 | `scm-command` | Ran git diff -- js/scenes/game-scene.js | rg -n "tinyGridMode|playerTuning|jetpackTuning|updateCameraFraming|setDeadzone|createJetpackFx|hpBarCfg|enemySpeedScale|projectile|checkpoint|coin|oneWay|buildPlayerTuning|buildJetpackTuning|modeZoom"
- L11391 | `git-command` | Ran git diff -- js/scenes/game-scene.js | rg -n "tinyGridMode|playerTuning|jetpackTuning|updateCameraFraming|setDeadzone|createJetpackFx|hpBarCfg|enemySpeedScale|projectile|checkpoint|coin|oneWay|buildPlayerTuning|buildJetpackTuning|modeZoom"
- L11394 | `command` | Ran Get-Content -Path js/scenes/game-scene.js -TotalCount 980 | Select-Object -Last 120
- L11433 | `command` | Ran rg -n "createJetpackFx|updateJetpackFx|tinyGridMode|setLerp|setRoundPixels|pixelArt|roundPixels|maxSpeed|acceleration|drag" js/scenes/game-scene.js js/main.js js/core/constants.js
- L11436 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (520..620)
- L11441 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (1720..1888)
- L11444 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (300..360)
- L11559 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (1760..1888)
- L11562 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (130..250)
- L11565 | `command` | Ran rg -n "player\.body\.setSize|setOffset\(|setCircle\(|player\.setDisplaySize|refreshBody|collider\(this.player, this.solids|blocked\.left|blocked\.right" js/scenes/game-scene.js
- L11568 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (246..320)
- L11573 | `command` | Ran rg -n "respawn\(|setPosition\(this\.respawnPoint|alignPlayerBodyToFeet|resolvePlayerEmbedding" js/scenes/game-scene.js
- L11576 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (1460..1565)
- L11579 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (248..285)
- L11582 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (1636..1665)
- L11939 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (248..320)
- L11942 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (586..660)
- L11945 | `command` | Ran rg -n "setOrigin\(|setDisplaySize\(|body\.setSize\(|alignPlayerBodyToFeet|useImportedCharacter" js/scenes/game-scene.js
- L12521 | `command` | Ran rg -n "setPlayerBodyWorldSize\(|alignPlayerBodyToFeet\(|setDisplaySize\(32, 32\)|oyWorld|playerBodyWorldH" js/scenes/game-scene.js
- L12524 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (600..680)
- L12527 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (256..332)
- L12617 | `command` | Ran rg -n "DEBUG|debug|Runtime Debug Console|Copy latest error|toggle|button|window\.Platformer" js/core/debug.js js/scenes/game-scene.js js/main.js js/scenes/ui-scene.js
- L12623 | `command` | Ran Get-Content js/scenes/game-scene.js -First 260
- L12631 | `command` | Ran rg -n "update\(|shutdown\(|create\(|render|graphics|debugHit|hitbox" js/scenes/game-scene.js
- L12634 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (1800..2075)
- L12962 | `command` | Ran rg -n "playerBodyWorldW|hitboxOverlay|alignPlayerBodyToFeet\(|setPlayerBodyWorldSize\(|setupHitboxOverlay\(|platformer:hitboxes-toggle|setDisplaySize\(32, 32\)" js/scenes/game-scene.js
- L12965 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (52..90)
- L12968 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (258..292)
- L12971 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (730..820)
- L12974 | `command` | Ran Get-Content js/scenes/game-scene.js | Select-Object -Index (600..700)
- L13099 | `command` | Ran rg -n "platformer_player_hitbox|getPlayerHitboxProfile|setPlayerHitboxProfile|loadPlayerHitboxProfile" js/core/debug.js js/scenes/game-scene.js
- L13111 | `command` | Ran rg -n "applyTinyPlayerHitboxProfile|player_hitbox|platformer_player_hitbox|getPlayerHitboxProfile" js/scenes/game-scene.js js/core/debug.js
- L13114 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 760
- L13378 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 2100
- L17219 | `command` | Ran rg -n "Missing cached ldtk-test JSON|falling back to classic level data|diag\.enemies_airborne|diag\.no_projectile_fire|enemies_stalling|player-idle-sheet missing" js/scenes/game-scene.js js/app.bundle.js desktop_launcher.py
- L17222 | `command` | Ran Get-Content js/scenes/game-scene.js -First 340
- L17225 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 1200 | Select-Object -Skip 340 -First 520
- L17230 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 1160 | Select-Object -Skip 920 -First 260
- L17242 | `command` | Ran rg -n "tryBuildLevelFromLdtk|Missing cached ldtk-test JSON|ldtk-test|fallback to classic level data" js/scenes/game-scene.js js/app.bundle.js
- L17259 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 1150 | Select-Object -Last 220
- L17286 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 260
- L17436 | `scm-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17436 | `git-command` | Ran git diff -- js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/level/level-5.js
- L17468 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17468 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map && git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `scm-command` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17471 | `git-commit` | Ran git add js/level/level-5.js js/scenes/game-scene.js js/scenes/boot-scene.js scripts/build_js_bundle.py scripts/validate_assets.py js/app.bundle.js js/app.bundle.js.map; git commit -m "fix(level5): prevent classic fallback when LDtk cache misses"
- L17489 | `command` | Ran rg -n "preload\(\)|Missing cached ldtk-test JSON|LevelBuilders\[5\]" js/scenes/game-scene.js js/level/level-5.js
- L17628 | `command` | Ran rg -n "player-idle-sheet missing|playerIdleAnim not found|playerIdle" js/scenes/game-scene.js
- L17631 | `command` | Ran rg -n "Missing cached ldtk-test JSON|tryBuildLevelFromLdtk|createLevelData\(|LevelBuilders" js/scenes/game-scene.js js/level/level-data.js js/level/level-5.js
- L17642 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 2300 | Select-Object -First 360 | Select-Object -Last 120
- L17707 | `command` | Ran rg -n "player-idle-sheet missing|Missing cached ldtk-test JSON|constructor\(\)" js/scenes/game-scene.js
- L17710 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 340 | Select-Object -Last 120
- L17713 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 1080 | Select-Object -Last 90
- L17790 | `command` | Ran rg -n "Resolved embedded player \(spawn\)|Resolved embedded player \(runtime\)|resolvePlayerEmbedding" js/scenes/game-scene.js
- L17793 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 840 | Select-Object -Last 180
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17928 | `command` | Ran rg -n "Platformer\.Debug\.(warn|error|log)\(" js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js js/core/debug.js
- L17998 | `command` | Ran rg -n "GameScene.preload|player-idle-sheet missing|Missing cached ldtk-test JSON|No levels in test.ldtk|No IntGrid layer|Invalid IntGrid dimensions|ldtk-cavernas texture missing|playerIdleAnim not found" js/scenes/game-scene.js
- L18001 | `command` | Ran Get-Content js/scenes/game-scene.js -TotalCount 2200 | Select-Object -Last 140
- L18067 | `command` | Ran rg -n "using classic fallback level" js/scenes/game-scene.js js/app.bundle.js
- L18123 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18123 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/core/debug.js js/scenes/boot-scene.js js/scenes/game-scene.js; git commit -m "chore(logging): mark fallback asset/map failures as CRITICAL"
- L18170 | `command` | Ran rg -n "player-idle-raw|player-idle-sheet|setupPlayerIdleAnimation|playerIdleAnim" js/scenes/boot-scene.js js/scenes/game-scene.js scripts/validate_assets.py
- L18309 | `command` | Ran rg -n "setupPlayerIdleAnimation|player-idle-sheet|playerIdleAnim|IFFY_IDLE" js/scenes/boot-scene.js js/scenes/game-scene.js scripts/validate_assets.py

### `js/scenes/menu-scene.js`
- Events: 31
- L13694 | `command` | Ran Get-Content js/scenes/menu-scene.js -TotalCount 1550
- L13697 | `command` | Ran rg -n "Update|updateBtn|checkForUpdates|autoCheckUpdatesForBottomLeft|applyDownloadedUpdate|start_update_download|update_status|pendingUpdate|Update button|updates" js/scenes/menu-scene.js js/core/updater.js desktop_launcher.py
- L13714 | `command` | Ran rg -n "updateInProgress|startInAppUpdate|setInteractive\(|pointerdown|pendingUpdateUrl|autoCheckUpdatesForBottomLeft|setBottomLeftUpdateStatus\(" js/scenes/menu-scene.js
- L13717 | `command` | Ran Get-Content js/scenes/menu-scene.js | Select-Object -First 560 | Select-Object -Skip 420
- L13720 | `command` | Ran Get-Content js/scenes/menu-scene.js | Select-Object -First 700 | Select-Object -Skip 560
- L14479 | `command` | Ran Get-Content js/scenes/menu-scene.js -TotalCount 420
- L14493 | `command` | Ran rg -n "createMenuUpdateWidget|startInAppUpdate|autoCheckUpdatesForBottomLeft|pendingUpdateUrl|latestReleaseNotes|updateButton" js/scenes/menu-scene.js
- L14499 | `command` | Ran Get-Content js/scenes/menu-scene.js | Select-Object -Index (410..740)
- L14961 | `scm-command` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L14961 | `git-commit` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L16080 | `command` | Ran Get-Content js\scenes\menu-scene.js -First 420
- L16083 | `command` | Ran rg -n "collectMenuUiElements|setMenuUiVisible|setMenuInteractive|createBottomLeftVersionInfo|createMenuUpdateWidget|createWhatsChangedWidget" js\scenes\menu-scene.js
- L16086 | `command` | Ran Get-Content js\scenes\menu-scene.js -TotalCount 1200 | Select-Object -Skip 420 -First 520
- L16125 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map && git commit -m "menu: add top-left test build marker"
- L16125 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map && git commit -m "menu: add top-left test build marker"
- L16129 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: add top-left test build marker"
- L16129 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: add top-left test build marker"
- L16174 | `command` | Ran rg -n "This is a test|testBuildText" js/scenes/menu-scene.js
- L16211 | `scm-command` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: remove temporary test marker"
- L16211 | `git-commit` | Ran git add js/scenes/menu-scene.js js/app.bundle.js js/app.bundle.js.map; git commit -m "menu: remove temporary test marker"
- L16244 | `command` | Ran rg -n "Checking for updates|up to date|Up to date|autoCheck|setBottomLeftUpdateStatus|checkForUpdates|check_update" js/scenes/menu-scene.js js/systems/update-manager.js js/core/updater.js js/app.bundle.js
- L16631 | `command` | Ran Get-Content js/scenes/menu-scene.js -Tail 260
- L16634 | `command` | Ran rg -n "autoCheckUpdatesForBottomLeft|shutdown|destroy|scene.stop|MenuScene" js/scenes/menu-scene.js js/systems/update-manager.js
- L16741 | `command` | Ran rg -n "startUpdatePolling|Background update polling active|autoCheck\(\{ showChecking: false \}\)|autoCheckInFlight" js/scenes/menu-scene.js js/systems/update-manager.js js/app.bundle.js
- L16844 | `scm-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16844 | `git-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16849 | `command` | Ran git add js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L17636 | `command` | Ran Get-Content js/scenes/menu-scene.js -TotalCount 1160 | Select-Object -Last 230
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17928 | `command` | Ran rg -n "Platformer\.Debug\.(warn|error|log)\(" js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js js/core/debug.js

### `js/scenes/ui-scene.js`
- Events: 1
- L12617 | `command` | Ran rg -n "DEBUG|debug|Runtime Debug Console|Copy latest error|toggle|button|window\.Platformer" js/core/debug.js js/scenes/game-scene.js js/main.js js/scenes/ui-scene.js

### `js/scenes/world-map-scene.js`
- Events: 5
- L10144 | `command` | Ran Get-Content js/scenes/world-map-scene.js -TotalCount 760 | Select-Object -Last 220
- L17639 | `command` | Ran Get-Content js/scenes/world-map-scene.js -TotalCount 860 | Select-Object -Last 290
- L17891 | `scm-command` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17891 | `git-commit` | Ran git add js/app.bundle.js js/app.bundle.js.map js/core/build-info.js js/level/level-5.js js/level/level-data.js js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js scripts/validate_assets.py; git commit -m "fix(runtime): clean warning noise and stabilize menu/worldmap audio"
- L17928 | `command` | Ran rg -n "Platformer\.Debug\.(warn|error|log)\(" js/scenes/boot-scene.js js/scenes/game-scene.js js/scenes/menu-scene.js js/scenes/world-map-scene.js js/core/debug.js

### `js/systems/update-manager.js`
- Events: 24
- L14490 | `command` | Ran Get-Content js/systems/update-manager.js -TotalCount 400
- L14777 | `change` | js/systems/update-manager.js
- L14961 | `scm-command` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L14961 | `git-commit` | Ran git add js/scenes/menu-scene.js js/systems/update-manager.js scripts/build_js_bundle.py js/core/updater.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "refactor: move menu update orchestration into UpdateManager module"; git push origin main
- L16244 | `command` | Ran rg -n "Checking for updates|up to date|Up to date|autoCheck|setBottomLeftUpdateStatus|checkForUpdates|check_update" js/scenes/menu-scene.js js/systems/update-manager.js js/core/updater.js js/app.bundle.js
- L16247 | `command` | Ran Get-Content js\systems\update-manager.js -First 320
- L16308 | `command` | Ran rg -n "autoCheckRetryCount|Update service not ready|setBottomLeftUpdateStatus\(text, sticky\)" js/systems/update-manager.js js/app.bundle.js
- L16381 | `change` | js/systems/update-manager.js
- L16387 | `command` | Ran Get-Content js\systems\update-manager.js -First 320
- L16454 | `command` | Ran rg -n "timed out \(8000ms\)|check_update_github start|autoCheck failed:|autoCheck returned empty" js/core/updater.js js/systems/update-manager.js js/app.bundle.js
- L16508 | `change` | js/systems/update-manager.js
- L16533 | `command` | Ran rg -n "lastManualUpdateAt = -1|lastManualUpdateAt >= 0" js/systems/update-manager.js js/app.bundle.js
- L16567 | `change` | js/systems/update-manager.js
- L16586 | `scm-command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16586 | `git-commit` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js; git commit -m "updater: fix auto-check stuck state and add timeout safeguards"
- L16593 | `command` | Ran git add js/core/updater.js js/systems/update-manager.js js/app.bundle.js js/app.bundle.js.map js/core/build-info.js
- L16634 | `command` | Ran rg -n "autoCheckUpdatesForBottomLeft|shutdown|destroy|scene.stop|MenuScene" js/scenes/menu-scene.js js/systems/update-manager.js
- L16637 | `command` | Ran Get-Content js/systems/update-manager.js -First 360
- L16741 | `command` | Ran rg -n "startUpdatePolling|Background update polling active|autoCheck\(\{ showChecking: false \}\)|autoCheckInFlight" js/scenes/menu-scene.js js/systems/update-manager.js js/app.bundle.js
- L16774 | `change` | js/systems/update-manager.js
- L16844 | `scm-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16844 | `git-command` | Ran git diff --stat js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L16849 | `command` | Ran git add js/core/debug.js js/scenes/menu-scene.js js/systems/update-manager.js js/core/build-info.js js/app.bundle.js js/app.bundle.js.map
- L18488 | `change` | - `js/systems/update-manager.js`

### `js/worldmap/WorldMapManager.js`
- Events: 1
- L10141 | `command` | Ran Get-Content -Raw js/worldmap/WorldMapManager.js

### `tools/nuget/nuget.exe`
- Events: 2
- L4772 | `change` | subprocess.CalledProcessError: Command 'tools\nuget\nuget.exe update -self' returned non-zero exit status 1.
- L4989 | `change` | subprocess.CalledProcessError: Command 'tools\nuget\nuget.exe update -self' returned non-zero exit status 1.

### `js/level/world_tutorial/nodes.json`
- Events: 1
- L10138 | `command` | Ran Get-Content -Raw js/level/world_tutorial/nodes.json

### `js/worldmap/data/world-map-data.js`
- Events: 1
- L10135 | `command` | Ran Get-Content -Raw js/worldmap/data/world-map-data.js

### `C:/Users/Robin/Desktop/codex/_release_test_1513.exe`
- Events: 3
- L15905 | `command` | Ran cmd /c "\"C:\Users\Robin\Desktop\codex\_release_test_1513.exe\""
- L15911 | `command` | Ran @' import sys from pathlib import Path try: import pefile except Exception as e: print('NO_PEFILE', e) raise SystemExit(0) for p in [r'C:\Users\Robin\Desktop\codex\AnimePlatformer.exe', r'C:\Users\Robin\Desktop\codex\_release_test_1513.exe']: pe = pefile.PE(p) imports=[] if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'): for entry in pe.DIRECTORY_ENTRY_IMPORT: imports.append(entry.dll.decode('ascii','ignore')) print('---', Path(p).name, 'imports:', imports) '@ | py -
- L15914 | `command` | Ran @' import subprocess, sys files=[r'C:\Users\Robin\Desktop\codex\AnimePlatformer.exe', r'C:\Users\Robin\Desktop\codex\_release_test_1513.exe'] for f in files: print('\n===', f) try: out=subprocess.check_output([sys.executable,'-m','PyInstaller.utils.cliutils.archive_viewer',f], input=b'ls\nq\n', stderr=subprocess.STDOUT) txt=out.decode('utf-8','ignore') lines=[ln for ln in txt.splitlines() if 'python313.dll' in ln.lower() or 'vcruntime' in ln.lower()] print('matches:', lines[:20]) print('total lines', len(txt.splitlines())) except Exception as e: print('ERR',e) '@ | py -

### `C:/Users/Robin/Desktop/codex/AnimePlatformer.exe`
- Events: 4
- L4103 | `change` | [build] Root EXE updated: C:\Users\Robin\Desktop\codex\AnimePlatformer.exe
- L4137 | `change` | [build] Root EXE updated: C:\Users\Robin\Desktop\codex\AnimePlatformer.exe
- L15911 | `command` | Ran @' import sys from pathlib import Path try: import pefile except Exception as e: print('NO_PEFILE', e) raise SystemExit(0) for p in [r'C:\Users\Robin\Desktop\codex\AnimePlatformer.exe', r'C:\Users\Robin\Desktop\codex\_release_test_1513.exe']: pe = pefile.PE(p) imports=[] if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'): for entry in pe.DIRECTORY_ENTRY_IMPORT: imports.append(entry.dll.decode('ascii','ignore')) print('---', Path(p).name, 'imports:', imports) '@ | py -
- L15914 | `command` | Ran @' import subprocess, sys files=[r'C:\Users\Robin\Desktop\codex\AnimePlatformer.exe', r'C:\Users\Robin\Desktop\codex\_release_test_1513.exe'] for f in files: print('\n===', f) try: out=subprocess.check_output([sys.executable,'-m','PyInstaller.utils.cliutils.archive_viewer',f], input=b'ls\nq\n', stderr=subprocess.STDOUT) txt=out.decode('utf-8','ignore') lines=[ln for ln in txt.splitlines() if 'python313.dll' in ln.lower() or 'vcruntime' in ln.lower()] print('matches:', lines[:20]) print('total lines', len(txt.splitlines())) except Exception as e: print('ERR',e) '@ | py -

### `https://github.com/zyynx-hub/Platformer/releases/download/2026.02.16.1334/AnimePlatformer.exe`
- Events: 3
- L14011 | `change` | [13:45:31] [INFO] Updater: Starting in-app update: https://github.com/zyynx-hub/Platformer/releases/download/2026.02.16.1334/AnimePlatformer.exe
- L14095 | `change` | [13:50:09] [INFO] Updater: Starting in-app update: https://github.com/zyynx-hub/Platformer/releases/download/2026.02.16.1334/AnimePlatformer.exe
- L14180 | `change` | [13:53:12] [INFO] Updater: Starting in-app update: https://github.com/zyynx-hub/Platformer/releases/download/2026.02.16.1334/AnimePlatformer.exe

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/__init__.py`
- Events: 1
- L4934 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\__init__.py", line 117, in setup

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/build_meta.py`
- Events: 5
- L4912 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\build_meta.py", line 441, in build_wheel
- L4914 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\build_meta.py", line 429, in _build
- L4924 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\build_meta.py", line 410, in _build_with_temp_dir
- L4927 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\build_meta.py", line 520, in run_setup
- L4930 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\build_meta.py", line 317, in run_setup

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/dist.py`
- Events: 4
- L4878 | `change` | C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\dist.py:765: SetuptoolsDeprecationWarning: License classifiers are deprecated.
- L4945 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\dist.py", line 1107, in run_command
- L4958 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\dist.py", line 1107, in run_command
- L4970 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\dist.py", line 1107, in run_command

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/__init__.py`
- Events: 1
- L4717 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\__init__.py", line 117, in setup

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/build_meta.py`
- Events: 5
- L4695 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\build_meta.py", line 441, in build_wheel
- L4697 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\build_meta.py", line 429, in _build
- L4707 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\build_meta.py", line 410, in _build_with_temp_dir
- L4710 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\build_meta.py", line 520, in run_setup
- L4713 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\build_meta.py", line 317, in run_setup

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/dist.py`
- Events: 4
- L4661 | `change` | C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\dist.py:765: SetuptoolsDeprecationWarning: License classifiers are deprecated.
- L4728 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\dist.py", line 1107, in run_command
- L4741 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\dist.py", line 1107, in run_command
- L4753 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\dist.py", line 1107, in run_command

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/_distutils/cmd.py`
- Events: 2
- L4955 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\cmd.py", line 341, in run_command
- L4967 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\cmd.py", line 341, in run_command

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/_distutils/core.py`
- Events: 2
- L4937 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\core.py", line 186, in setup
- L4939 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\core.py", line 202, in run_commands

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/_distutils/dist.py`
- Events: 4
- L4942 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\dist.py", line 1000, in run_commands
- L4948 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\dist.py", line 1019, in run_command
- L4961 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\dist.py", line 1019, in run_command
- L4973 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\dist.py", line 1019, in run_command

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/command/bdist_wheel.py`
- Events: 1
- L4952 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\command\bdist_wheel.py", line 370, in run

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/_distutils/cmd.py`
- Events: 2
- L4738 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\cmd.py", line 341, in run_command
- L4750 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\cmd.py", line 341, in run_command

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/_distutils/core.py`
- Events: 2
- L4720 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\core.py", line 186, in setup
- L4722 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\core.py", line 202, in run_commands

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/_distutils/dist.py`
- Events: 4
- L4725 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\dist.py", line 1000, in run_commands
- L4731 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\dist.py", line 1019, in run_command
- L4744 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\dist.py", line 1019, in run_command
- L4756 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\dist.py", line 1019, in run_command

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/command/bdist_wheel.py`
- Events: 1
- L4735 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\command\bdist_wheel.py", line 370, in run

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/_distutils/command/build.py`
- Events: 1
- L4964 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\command\build.py", line 135, in run

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/_distutils/command/build_ext.py`
- Events: 3
- L4976 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\command\build_ext.py", line 367, in run
- L4979 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\command\build_ext.py", line 483, in build_extensions
- L4982 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_distutils\command\build_ext.py", line 509, in _build_extensions_serial

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-8c4hzl_n/overlay/Lib/site-packages/setuptools/_vendor/wheel/bdist_wheel.py`
- Events: 1
- L4876 | `change` | C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-8c4hzl_n\overlay\Lib\site-packages\setuptools\_vendor\wheel\bdist_wheel.py:4: FutureWarning: The 'wheel' package is no longer the canonical location of the 'bdist_wheel' command, and will be removed in a future release. Please update to setuptools v70.1 or later which contains an integrated version of this command.

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/_distutils/command/build.py`
- Events: 1
- L4747 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\command\build.py", line 135, in run

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/_distutils/command/build_ext.py`
- Events: 3
- L4759 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\command\build_ext.py", line 367, in run
- L4762 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\command\build_ext.py", line 483, in build_extensions
- L4765 | `change` | File "C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_distutils\command\build_ext.py", line 509, in _build_extensions_serial

### `C:/Users/runneradmin/AppData/Local/Temp/pip-build-env-o_mr7ivd/overlay/Lib/site-packages/setuptools/_vendor/wheel/bdist_wheel.py`
- Events: 1
- L4659 | `change` | C:\Users\runneradmin\AppData\Local\Temp\pip-build-env-o_mr7ivd\overlay\Lib\site-packages\setuptools\_vendor\wheel\bdist_wheel.py:4: FutureWarning: The 'wheel' package is no longer the canonical location of the 'bdist_wheel' command, and will be removed in a future release. Please update to setuptools v70.1 or later which contains an integrated version of this command.
