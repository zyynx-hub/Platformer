# AnimePlatformer — Godot 4

2D side-scrolling anime platformer (escaping theme). Blank-slate rebuild in Godot 4 since 2026-02-18.

## Tech Stack

- **Engine**: Godot 4.6.1 (GDScript)
- **Levels**: LDtk (8px grid, IntGrid for collision, AutoLayer for visuals)
- **Plugin**: LDtk Importer v2.0.1 (heygleeson) under `addons/ldtk-importer/`
- **Physics**: CharacterBody2D with manual gravity (project gravity = 0)

## Scene Flow

```
Boot → MenuScene → LevelSelectScene → GameScene (loads selected level + Player)
                 → OptionsScene → MenuScene
                 → ExtrasScene  → MenuScene
```

## Directory Structure (actual)

```
godot_port/
├── project.godot
├── core/                              # All autoloads + infrastructure (9 scripts + 1 scene)
│   ├── AudioManager.gd                # Autoload: music A/B crossfade + SFX playback
│   ├── Constants.gd                   # Physics values + APP_VERSION
│   ├── DebugOverlay.tscn              # Autoload scene: CanvasLayer → Panel → Label
│   ├── DebugOverlay.gd                # Autoload: toggleable F3 overlay (state, velocity, FPS, fuel)
│   ├── DragonFlyby.gd                 # Autoload: Karim fly-by (persists across menu scenes)
│   ├── EventBus.gd                    # Autoload: signal relay
│   ├── GameData.gd                    # Autoload: session data (selected level, etc.)
│   ├── SceneTransition.gd             # Autoload: fade-to-black scene transitions
│   ├── SettingsManager.gd             # Autoload: audio/display settings persistence
│   └── VersionChecker.gd              # Static utility: HTTP version check + semver compare
├── data/                              # Static definitions + persistence (7 scripts)
│   ├── AchievementDefs.gd             # 7 starter achievements
│   ├── DialogDefs.gd                  # Dialog loader (resolves IDs to levels/{id}/dialogs/*.tres)
│   ├── DialogLine.gd                  # class_name DialogLine extends Resource
│   ├── DialogSequence.gd              # class_name DialogSequence (description, one_shot, lines[])
│   ├── ItemDefs.gd                    # Static item definitions (composited sprite sheet paths)
│   ├── LevelDefs.gd                   # 5 levels, constellation positions, connections
│   └── ProgressData.gd                # Stats/achievements/level-completion persistence
├── player/                            # Player: scene + script + states + sprites (co-located)
│   ├── Player.tscn                    # AnimatedSprite2D + EquipmentSprite + StateMachine, CapsuleShape2D
│   ├── Player.gd                      # class_name Player, CharacterBody2D, equipment, rocket boots
│   ├── sprites/                       # All 12 Owlet_Monster_*.png character sheets
│   └── states/                        # StateMachine.gd, PlayerState.gd, + 9 state scripts
├── levels/                            # Per-level folders, each self-contained
│   ├── shared/                        # Shared tileset + level environment assets
│   │   ├── Cavernas_by_Adam_Saltsman.png  # 8px tileset
│   │   ├── tileset_add_collision.gd   # Post-import: collision on IntGrid tiles
│   │   ├── Rock1.png, Rock2.png       # Environment sprites
│   │   ├── Double_Jump_Dust_5.png     # Particle sprite
│   │   └── Walk_Run_Push_Dust_6.png   # Particle sprite
│   └── level_1/                       # Level 1 — everything in ONE folder
│       ├── Level1.tscn                # User-built scene (SpawnPoint + RocketBootsPickup)
│       ├── testlevel.ldtk             # LDtk source file
│       ├── testlevelv2.ldtk           # Alternate LDtk level
│       ├── levels/AutoLayer.scn       # LDtk-generated
│       ├── tilesets/tileset_8px.res    # LDtk-generated
│       ├── dialogs/spawn.tres         # Level 1 spawn dialog (DialogSequence)
│       └── level1_bgm.mp3            # Level 1 background music (also used as "game" fallback)
│   └── level_2/                       # Level 2 — Rooftops
│       ├── Level2.tscn                # User-built scene (SpawnPoint)
│       ├── testlevel2.ldtk            # LDtk source file
│       ├── levels/AutoLayer.scn       # LDtk-generated
│       └── tilesets/tileset_8px.res   # LDtk-generated
├── gates/                             # Progression gate system
│   ├── ProgressionTrigger.tscn + .gd  # Area2D trigger (set gate_id in Inspector)
│   └── ProgressionGate.tscn + .gd     # StaticBody2D blocker (draws colored rect, fades on signal)
├── portals/                           # Level portal system
│   ├── Portal.tscn + Portal.gd        # Area2D portal (set destination_level_id, portal_color, portal_scale in Inspector)
├── game/                              # Game orchestrator (scene + script)
│   ├── GameScene.tscn                 # SubViewport 426x240, LevelContainer, GameCamera
│   └── GameScene.gd                   # class_name GameScene, level loading, respawn, cinematic
├── ui/                                # All UI scenes + scripts (co-located)
│   ├── boot/
│   │   ├── Boot.tscn                  # Entry point (main scene)
│   │   └── Boot.gd                    # Launcher, deferred transition to MenuScene
│   ├── menus/
│   │   ├── MenuScene.tscn + .gd       # Night sky menu: shaders, particles, button styling
│   │   ├── LevelSelectScene.tscn + .gd # Constellation map level select
│   │   ├── OptionsScene.tscn + .gd    # Audio/display/controls settings
│   │   ├── ExtrasScene.tscn + .gd     # Achievements/gallery/stats
│   │   ├── SubMenuTheme.gd            # Shared: particles, button focus, entrance animation
│   │   └── NightSkyTheme.tres         # Shared Theme resource (Button/Tab/Slider/Label styles)
│   ├── hud/
│   │   ├── HUD.tscn                   # CanvasLayer HUD (hearts, dash, item box, fuel gauge)
│   │   └── HUD.gd
│   ├── dialog/
│   │   ├── CinematicDialog.tscn + .gd # CanvasLayer dialog UI (typewriter, layer 15)
│   │   ├── DialogTrigger.tscn + .gd   # Area2D trigger zone (set dialog_id in Inspector)
│   ├── popup/
│   │   ├── ItemAcquiredPopup.tscn + .gd # CanvasLayer popup (scene-built UI, shader border + orbs, layer 12)
│   ├── gameover/
│   │   ├── GameOverScene.tscn + .gd   # Game over overlay (CanvasLayer layer 18, retry/quit)
│   └── pause/
│       ├── PauseScene.tscn + .gd      # Pause overlay (CanvasLayer layer 20)
├── items/                             # Collectibles (scene + script + sprites)
│   ├── Pickup.tscn                    # Area2D world item (set item_id in Inspector)
│   ├── Pickup.gd                      # E-key interact, proximity prompt, sparkles
│   └── sprites/                       # rocket_boots_icon, pickup, flame, composited/
├── assets/                            # Shared media only
│   ├── audio/
│   │   ├── music/                     # menu_bgm, pause_bgm (shared music; game_bgm removed, fallback uses level1_bgm)
│   │   └── sfx/                       # ui_tick, ui_confirm, dash_swoosh, dialog_talk, rocket_thrust (DO NOT overwrite rocket_thrust)
│   └── sprites/
│       ├── ui/                        # HUD sprites: hearts, dash icons, item_frame
│       └── karim/                     # Menu fly-by character
├── shaders/                           # 8 shaders
│   ├── menu_background.gdshader       # Night sky with twinkling stars and aurora
│   ├── menu_ground.gdshader           # Procedural blocky terrain silhouette
│   ├── vignette.gdshader              # Radial edge darkening overlay
│   ├── player_dissolve.gdshader       # Noise dissolve with edge glow (death/spawn)
│   ├── item_acquired.gdshader         # Animated glowing border for item popup
│   ├── orb_glow.gdshader              # SDF orb with FBM noise + chromatic shift (blend_add)
│   ├── game_over_title.gdshader       # Pulsing aura glow behind Game Over title (blend_add)
│   └── portal.gdshader                # Swirl/vortex shader for level portals (polar UV rotation + FBM noise)
├── tools/                             # Python utilities
│   ├── generate_ui_sounds.py          # Procedural UI SFX (rocket_thrust.wav guarded by --all)
│   ├── generate_flame_sprites.py      # Pillow: rocket_flame_4.png
│   └── split_sprites.py              # Sprite sheet splitter
├── addons/ldtk-importer/              # Third-party plugin
└── build/                             # Export output (gitignored)
```

## Distribution (itch.io)

- **Current version**: 0.2.4
- **itch.io page**: `https://zyynx-hub.itch.io/platformer` (restricted, playtest access)
- **GitHub repo**: `https://github.com/zyynx-hub/platformerv2` — only hosts `version.json` for update checks
- **Version file**: `version.json` at repo root — remote check target (raw URL in Constants.gd)
- **Push script**: `scripts/push_itch.sh` — headless export + butler push
- **Version check**: `VersionChecker.gd` fetches `version.json` from GitHub on boot, shows "Update Available" in menu bottom-right if remote > local
- **Version label**: Permanent "v0.2.4" label at menu bottom-left (always visible)
- **Build output**: `godot_port/build/` (gitignored)
- **Update workflow**: bump `APP_VERSION` in Constants.gd → re-export in Godot → `butler push godot_port\build zyynx-hub/platformer:windows --userversion X.Y.Z` → update `version.json` on GitHub

## Running the Game

1. Open `godot_port/project.godot` in Godot 4
2. Press **F5** to run
3. Errors appear in the Output panel — paste them here to fix

## Headless Validation

```bash
"c:/Users/Robin/Desktop/Godot_v4.6.1-stable_win64.exe" --headless --path "c:/Users/Robin/Desktop/codex/godot_port" --quit 2>&1
```

## Key Invariants

- **Scene-first construction**: ALL scene structure must be built in .tscn files using Godot's built-in nodes. Use `@onready var _x = %NodeName` for script refs. ShaderMaterials/LabelSettings as `[sub_resource]` in .tscn. Script ONLY for: dynamic particles, procedural loops, animation tweens, per-frame updates. Never build entire UIs programmatically via `.new()` + `add_child()`.
- Godot hot-reloads scripts on F5 — no build step
- Project gravity = 0; gravity applied manually in Player.gd
- Seven autoloads (load order): EventBus → GameData → SettingsManager → AudioManager → SceneTransition → DragonFlyby → DebugOverlay
- **Editor–runtime parity**: shaders embedded in .tscn, scripts use @tool for styling, `Engine.is_editor_hint()` guards runtime-only code. Editor preview must always match runtime.
- User-built scene structure (do not change node hierarchy): Level1.tscn
- Menu .tscn files may be edited for shader/material embedding and overlay nodes
- LDtk IntGrid tiles get collision; AutoLayer tiles are visual only
- All scene changes go through `SceneTransition.transition_to()` for fade effects
- Audio bus layout required: Master → Music, SFX, UI

## Documentation

- [docs/status.md](docs/status.md) — what works, what's broken, what's next
- [docs/decisions.md](docs/decisions.md) — architectural decision records
- [docs/phaser-archive.md](docs/phaser-archive.md) — legacy Phaser build context

## Legacy

The original Phaser 3 + PyWebView source code has been removed from disk (preserved in git history).
Phaser-era documentation is archived at `docs/archive/phaser/`.
The abandoned v1 Godot port at `anime-platformer-(4.3)/` is kept as an asset source (has audio, sprites, levels).
All active development is in `godot_port/`.
