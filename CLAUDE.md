# AnimePlatformer — Godot 4

2D side-scrolling anime platformer (escaping theme). Godot 4 rebuild since 2026-02-18.

## Tech Stack

- **Engine**: Godot 4.6.1 (GDScript)
- **Levels**: LDtk (8px grid, IntGrid=collision, AutoLayer=visual)
- **Plugin**: LDtk Importer v2.0.1 (`addons/ldtk-importer/`)
- **Physics**: CharacterBody2D, project gravity=0 (manual in Player.gd)

## Scene Flow

```
Boot → MenuScene → CONTINUE → GameScene (resume at saved position)
                 → NEW GAME → SaveSlotScene → LevelSelectScene → GameScene
                 → OptionsScene → MenuScene
                 → ExtrasScene  → MenuScene
```

## Directory Structure

```
godot_port/
├── core/            # 11 autoloads + VersionChecker (13 scripts + 1 scene)
├── data/            # Definitions: Dialog, Item, Level, Quest, Achievement, Progress + quests/*.json
├── player/          # Player.tscn/.gd, sprites/ (12 sheets), states/ (StateMachine + 9 states)
├── enemies/         # Enemy.tscn base + states/ (EnemyStateMachine + 5 states), slime/ (Slime.tscn), exodia/ (ExodiaKarim boss + BossStateMachine + 7 states)
├── levels/
│   ├── shared/      # Tileset, collision script, env sprites
│   ├── level_1/     # LDtk level, dialogs/, level1_bgm.mp3
│   ├── level_2/     # LDtk level (no gameplay content yet)
│   ├── level_town/  # Flat ground 2200px, 6 houses + church, props/, ambient/, interiors/, dialogs/
│   ├── level_jungle/# Flat ground 1600px, Hydra NPCs, interiors/, dialogs/
│   ├── level_mystical/# Mystical Realm 800px, cosmic sky shader, stone pedestal, Cloud Karim, boss arena markers, WeatherController (rain for cutscene), dialogs/ (cloud_karim/, pre_boss/, exodia_karim/, victory/), audio/ (3 tracks)
│   ├── level_arena/ # Combat test arena (flat ground, platforms, slime enemies)
│   └── level_tutorial/# LDtk Entities Demo (16px grid, Inca tileset), TutorialButton, Teleporter, KeyPickup, dialogs/
├── npcs/            # NPC.tscn base + 10 subclass scripts + Door.tscn
├── gates/           # ProgressionTrigger + ProgressionGate
├── portals/         # Portal.tscn (vortex shader, E-key, destination_level_id)
├── game/            # GameScene.tscn/.gd (SubViewport 426x240, level loader)
├── ui/
│   ├── boot/        # Boot.tscn (entry point, main scene)
│   ├── menus/       # Menu, LevelSelect, Options, Extras, SaveSlot + NightSkyTheme.tres + SubMenuTheme.gd
│   ├── hud/         # HUD.tscn (hearts, dash, fuel, item frame)
│   ├── dialog/      # CinematicDialog, DialogTrigger, ChoicePanel
│   ├── shop/        # ShopPanel (3 items, coin economy)
│   ├── popup/       # ItemAcquiredPopup (shader border + orbs)
│   ├── gameover/    # GameOverScene (retry/quit overlay)
│   ├── quest_log/   # QuestLogScene (Q key, CanvasLayer 21)
│   └── pause/       # PauseScene (ESC, CanvasLayer 20)
├── items/           # Pickup.tscn (E-key, proximity prompt, sparkles)
├── assets/audio/    # music/ (menu_bgm, pause_bgm) + sfx/ (DO NOT overwrite rocket_thrust.wav)
├── assets/sprites/  # ui/ (HUD sprites) + karim/ (fly-by character)
├── shaders/         # 21 .gdshader files (menu, town, weather, portals, effects, hit_flash, mystical_sky)
├── tools/           # Python: quest_tool.py, generate_ui_sounds.py, generate_flame_sprites.py, split_sprites.py
├── addons/ldtk-importer/
└── build/           # Export output (gitignored)
```

## Rules

### Scene-First Construction (CRITICAL)

ALL scene structure in .tscn files using Godot built-in nodes. `@onready var _x = %NodeName` for refs. ShaderMaterials/LabelSettings as `[sub_resource]` in .tscn. Script ONLY for: dynamic particles, procedural loops, animation tweens, per-frame updates. Never build UIs via `.new()` + `add_child()`.

### Editor-Runtime Parity

Shaders embedded in .tscn. Scripts use `@tool` for styling. `Engine.is_editor_hint()` guards runtime-only code. See `.claude/rules/godot-workflow.md` for the detailed pattern and `.tscn` editing rules.

### Project Config

- Viewport: 1280x720, canvas_items stretch, gl_compatibility
- Rendering: `default_texture_filter=0` (Nearest), `snap_2d_*=true`
- Autoloads (11, load order): EventBus → GameData → SettingsManager → AudioManager → SceneTransition → DragonFlyby → DebugOverlay → DayNightCycle → QuestManager → SaveManager → TelemetryManager
- Audio buses: Master → Music, SFX, UI
- All scene changes via `SceneTransition.transition_to()`
- Debug: F1=reset progress, F3=overlay, F4=flush telemetry, F6=weather, F7=time +12%, F9=pause cycle, F10=+100 coins, F11=combat arena, F12=boss debug spawn
- Save: 3-slot system — `%APPDATA%/Godot/app_userdata/AnimePlatformer/progress_slot_N.cfg` + `save_meta.cfg`

## Key Patterns

- **State machine**: GDQuest pattern — StateMachine + PlayerState children, `transition_to("State")`
- **Cross-scene data**: GameData autoload (not static vars), `call_deferred` for scene changes in `_ready()`
- **NPC subclass**: NPC.tscn instance + script override + modulate in .tscn
- **Quest system**: QuestManager autoload loads `data/quests/*.json`. NPC scripts call `get_npc_dialog()` / `execute_dialog_end()`
- **Dialog resources**: `levels/{level_id}/dialogs/{moment}.tres` (DialogSequence), DialogDefs resolves IDs
- **Music**: A/B crossfade, duck/unduck (-18dB cinematic, -14dB death), same-stream detection, suspend/resume
- **Portals**: Area2D + vortex shader, E-key, cinematic pull-in. Arrival at return portal (reverse-lookup)
- **Doors**: EventBus.door_entered → GameScene swaps level (player/camera/HUD persist)
- **Camera pan**: `EventBus.camera_pan_requested(target, pan, hold, return)` → GameScene tweens
- **Enemies**: CharacterBody2D + EnemyStateMachine (Idle/Patrol/Chase/Hurt/Dead), hitbox/hurtbox Area2D, hit flash shader
- **Boss (Exodia)**: extends Enemy, BossStateMachine (Idle/Spawning/Phase1-3/Stunned/Defeated), AnimationPlayer-driven attack patterns (BossAnimPlayer: 12 animations with visible position/scale curves), 5 HP, stomp-to-kill per phase. Pre-placed in MysticalLevel.tscn (visible=false until cutscene). Marker2D arena waypoints (ArenaLeft/Right/TopLeft/TopRight/Center). Scene-built CompositeBody (7 Sprite2D with hit_flash ShaderMaterial). States are thin wrappers: play animation, count passes, transition. Phase 1: single round-trip sweep (L→R→L per cycle, animation_finished signal). Phase 2: pass-through dive cycle (rises off-screen, dives through ground, never lands, telegraph between crossings). Debug state label. Phase taunts gated by cinematic_dialog_ended. F12 debug spawn (auto-equips rocket boots).
- **Player combat**: Stomp-to-kill (jump on enemies from above). Continuous overlap detection in `_physics_process`, damage cooldown. `stomp_bounce()` gives upward velocity after stomp.
- **Auto-generated docs** (never edit): `docs/storyline.md`, `docs/quest-flowchart.md`, `docs/quest-report.html`

## Key Subsystems

- **Death/Respawn**: dissolve shader → soul particles → materialize (flat await chain)
- **Rocket Boots**: composited sprite swap → thrust + fire anim + looping sound + HUD fuel gauge
- **HUD**: CanvasLayer 10 in SubViewport, all nodes in .tscn, @onready refs
- **Camera**: SubViewport 426x240, Camera2D with smoothing, limits from Marker2D/TileMapLayer
- **Dialog**: DialogTrigger Area2D, portrait, voice_pitch, typewriter UI (CinematicDialog layer 15)
- **ShopPanel**: CanvasLayer 17, 3 slots, 2-step confirm, ProgressData.coins
- **Day/Night**: DayNightCycle autoload, 5-min cycle, throttled signal (0.001 threshold)
- **Weather**: WeatherController CLEAR/RAIN/SNOW, 2s transitions, ground accumulation
- **Quest Log**: CanvasLayer 21, Q key, build-once pattern
- **Jungle**: Green palette, JungleLevelController manages NPC visibility based on quest state
- **Boss cutscene**: Pre-boss: 7 named segment functions (rumble, purple walks, others walk, absorption, white flash, assembly, fight start). CutsceneAnimPlayer holds reference animations. Await-driven flow with dialog pauses (purple_arrives, others_arrive, exodia_forms). Post-boss: 8-segment await chain (sad music + rain → defeat monologue → explosion → 4 Karims materialize → weather clears → victory dialog → Karims leave → reward). Boss assembly uses BossAnimPlayer "assembly" animation (7 value tracks for staged part drops).
- **Church → Heaven**: Town church door → MysticalLevel, portal back to town (ChurchPortal spawn anchor)
- **Save System**: SaveManager autoload, 3 slots, dynamic `ProgressData.SAVE_PATH` (static var). 5s periodic autosave + close_requested signal. Resume-to-exact-position via GameData.resumed_position. Legacy migration from single progress.cfg.
- **Telemetry**: TelemetryManager autoload, anonymous UUID in `user://telemetry.cfg`, batched POST to Supabase every 10s, silent failures, opt-out via SettingsManager. Analytics tab in Game Bible dashboard (`quest_tool.py --dashboard`).

## Gotchas

### State Machine (CRITICAL)
- `apply_movement()` must run every frame — stale `is_on_floor()` kills jumps
- States return early on transitions — ensure `apply_movement()` called if velocity was just set
- var naming vs class_name conflict — use `PlayerScene` / `HudScene` for preloaded scene vars

### GDScript
- Inline lambdas in method args break parser — extract to local var first
- `:=` fails on Variant/base-typed values — use `var` or explicit type
- `class_name` as type annotation breaks autoload resolution

### Godot Engine
- `find_child("Name", true, false)` for dynamically loaded scenes
- Never write `uid://` in .tscn — Godot auto-generates
- Full-screen Control eats clicks — `mouse_filter=IGNORE`
- `@tool` must propagate full inheritance chain
- `cinematic_dialog_ended` broadcasts to ALL NPCs — exact match `ended_dialog_id`
- `pitch_scale` > 0 — clamp: `maxf(pitch + randf_range(-spread, spread), 0.05)`
- `portal_scale` is float, not Vector2
- Parallax2D broken in SubViewport — use manual Node2D parallax
- `get_camera_2d()` null in SubViewport — use `vp.canvas_transform.affine_inverse()`
- SCREEN_UV broken in SubViewport — use UV with camera-tracking ColorRect
- Unused ShaderMaterial sub_resources stripped — apply to node before saving
- canvas_item shader: no `return` in fragment() — use premultiplied alpha
- CanvasLayer can't hold `theme` — assign on first Control child
- LDtk autotile connections don't recalculate at runtime — use blocking nodes for gates
- ColorRect base color bleeds through shader — set `color = Color(1,1,1,0)`

### Tweens & Animation Timing
- `set_quest()` before animation causes instant hide — defer quest state to AFTER visuals complete
- `create_tween()` binds to caller — use `target.create_tween()` for cross-parent nodes

### File Operations
- Delete `.godot/` after bulk moves (stale caches cause "class not found")
- Strip stale `uid://` from ext_resource lines after moves

## Distribution

- **Version**: 0.2.7 (`APP_VERSION` in Constants.gd)
- **itch.io**: `zyynx-hub.itch.io/platformer` (restricted, playtest access)
- **Push**: `butler push godot_port\build zyynx-hub/platformer:windows --userversion X.Y.Z`
- **Version check**: VersionChecker.gd fetches `version.json` from GitHub, shows update in menu
- **Workflow**: bump Constants.gd → re-export in Godot → butler push → update `version.json`

## Running the Game

1. Open `godot_port/project.godot` in Godot 4, press **F5**
2. Headless validation: see `.claude/rules/godot-workflow.md`
3. Errors appear in Output panel — paste them here to fix

## Documentation

- [docs/status.md](docs/status.md) — current state, session log, next priorities
- [docs/quest-registry.md](docs/quest-registry.md) — NPC positions, quest flows, state keys
- [docs/decisions.md](docs/decisions.md) — architectural decision records

## Legacy

Original Phaser 3 source preserved in git history. Phaser docs at `docs/archive/phaser/`.
Old v1 Godot port at `anime-platformer-(4.3)/` kept as asset source.
All active development in `godot_port/`.
