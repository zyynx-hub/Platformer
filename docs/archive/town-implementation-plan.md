# Town Test Environment — Implementation Plan

## Context

The game currently has two platforming levels (Level 1 + Level 2) with full systems for dialog, items, portals, progression gates, and music. The next milestone is a **flat-ground Town environment** that tests: NPC interaction, building entry/exit, shop menus, dialog choices, a mini-quest with state tracking, and random NPC wandering. This is accessed from the constellation level select map as a new level.

**User decisions:**
- Town accessed via constellation map (new star, always unlocked)
- NPC visuals: existing Karim photo sprite with color modulate tints
- Quest state: persisted to disk via ProgressData, with a reset mechanism
- Interiors: scene-swap inside LevelContainer (player/camera/HUD stay alive)

---

## Phase 1: Town Level Scene + Level Registration

**Goal:** A flat horizontal town with two house exteriors, loadable from the constellation map.

### Files to create

**`godot_port/levels/level_town/TownLevel.tscn`** — Node2D:
```
TownLevel (Node2D)
  Ground (StaticBody2D)         — flat ground collision, full town width
    GroundShape (CollisionShape2D) — WorldBoundaryShape2D or wide RectangleShape2D
    GroundVisual (ColorRect)     — dark earth-tone ground strip (~800x16 px)
  Sky (ColorRect)                — light blue sky background behind everything
  House1Exterior (Node2D)        — positioned at ~(150, ground_y)
    Body (ColorRect)             — house body (48x40 px, warm brown)
    Roof (Polygon2D)             — triangular roof (darker brown)
    DoorMarker (Marker2D)        — door position for Door node
  House2Exterior (Node2D)        — positioned at ~(350, ground_y)
    Body (ColorRect), Roof, DoorMarker — same pattern
  SpawnPoint (Marker2D)          — left side of town
```

Use StaticBody2D + CollisionShape2D (RectangleShape2D) for flat ground instead of LDtk. The ground must provide a floor for `is_on_floor()`. Houses are visual-only (no collision needed — player walks in front of them).

**Camera:** GameScene's `_get_level_bounds()` currently scans for TileMapLayer nodes. Since we skip LDtk, add a fallback: place a **BoundsRect** (ReferenceRect or Marker2D pair) in the scene that GameScene can use when no TileMapLayer is found. Alternatively, add a single-row TileMapLayer just for bounds calculation.

**Decision:** Add two Marker2D nodes (`BoundsMin` + `BoundsMax`) as a simple bounds indicator, and update `_get_level_bounds()` in GameScene.gd to check for these if no TileMapLayer is found.

### Files to modify

**`godot_port/data/LevelDefs.gd`** — add town entry:
```gdscript
{
    "id": "level_town",
    "title": "Town",
    "scene": "res://levels/level_town/TownLevel.tscn",
    "star_pos": Vector2(0.5, 0.35),
    "connections": [],
    "unlock_requires": "",
},
```

**`godot_port/game/GameScene.gd`** — update `_get_level_bounds()` to support Marker2D-based bounds:
```gdscript
# After the TileMapLayer scan, if no bounds found:
if not found:
    var bounds_min = level_container.find_child("BoundsMin", true, false)
    var bounds_max = level_container.find_child("BoundsMax", true, false)
    if bounds_min and bounds_max:
        rect = Rect2(bounds_min.global_position, bounds_max.global_position - bounds_min.global_position)
        found = true
```

**`godot_port/core/AudioManager.gd`** — add town music key (reuse menu_bgm for now):
```gdscript
"level_town": "res://assets/audio/music/menu_bgm.mp3",
```

### Verification
- Add `level_town` to LevelDefs, launch game, navigate constellation map, select Town
- Player spawns on flat ground, can walk left/right, camera follows horizontally
- Two house shapes visible in background

---

## Phase 2: NPC Base System

**Goal:** Reusable NPC with E-key interaction, face-player, dialog trigger, and tinted Karim sprite.

### Files to create

**`godot_port/npcs/NPC.tscn`** — Area2D scene (scene-first):
```
NPC (Area2D)
  Sprite (Sprite2D)              — Karim texture, scale ~0.04, texture_filter=NEAREST
  CollisionShape2D               — CircleShape2D radius 16
```

**`godot_port/npcs/NPC.gd`** — base NPC script:
```gdscript
@tool
extends Area2D

@export var npc_name: String = "NPC"
@export var npc_color: Color = Color.WHITE   # Modulate tint for Karim sprite variants
@export var face_player_on_interact: bool = true

var _player_in_range: bool = false
var _interacting: bool = false
var _time: float = 0.0

@onready var _sprite: Sprite2D = $Sprite
```

**Key methods (mirror Pickup.gd / Portal.gd pattern):**
- `_on_body_entered/exited` — track player proximity
- `_draw()` — floating "E" keycap prompt when in range and not interacting
- `_unhandled_input` — detect "interact" action press
- `_interact()` — face player, call `_get_active_dialog_id()`, emit `EventBus.dialog_requested`
- `_get_active_dialog_id() -> String` — virtual, returns `dialog_id` by default. Subclass scripts override for conditional dialog.
- `_face_player()` — flip sprite.flip_h based on player x position
- `_on_dialog_ended(id)` — connected to `EventBus.cinematic_dialog_ended`, resets `_interacting = false`

**Sprite approach:** Load `res://assets/sprites/karim/Screenshot 2026-02-18 165701.png` as the Sprite2D texture in the .tscn. Scale ~0.04 to be roughly character-sized at 426x240 viewport. Each NPC instance sets `npc_color` in Inspector; `_ready()` applies `_sprite.modulate = npc_color`.

### Files to modify

None — NPC.gd/NPC.tscn are standalone, placed in levels as instances.

---

## Phase 3: Door System + Interior Scene Swap

**Goal:** Player presses E near a door to swap the active level inside LevelContainer. Player/camera/HUD persist.

### Design: Scene Swap in LevelContainer

Instead of full SceneTransition (which reloads everything), the door:
1. Fades to black via `SceneTransition` overlay (fade in only, no scene change)
2. Removes current level from LevelContainer
3. Instances the destination level into LevelContainer
4. Repositions player to the new level's SpawnPoint
5. Updates camera limits
6. Fades from black

This keeps player, camera, HUD, and music alive.

### Files to create

**`godot_port/npcs/Door.tscn`** — Area2D scene:
```
Door (Area2D)
  CollisionShape2D   — RectangleShape2D (8x16, door-sized)
  DoorVisual (ColorRect) — dark rectangle representing the door
```

**`godot_port/npcs/Door.gd`**:
```gdscript
@tool
extends Area2D

@export var destination_scene: String = ""   # e.g. "res://levels/level_town/interiors/House1Interior.tscn"
@export var is_exit_door: bool = false

var _player_in_range := false
var _transitioning := false
```

**Key methods:**
- Same E-key proximity pattern as NPC.gd
- `_enter_door()` — emits a new signal `EventBus.door_entered(destination_scene, is_exit_door)`
- GameScene handles the actual scene swap (Door just signals intent)

### Files to modify

**`godot_port/core/EventBus.gd`** — add:
```gdscript
signal door_entered(destination_scene: String, is_exit_door: bool)
```

**`godot_port/game/GameScene.gd`** — add door handling:
- Connect `EventBus.door_entered` in `_ready()`
- `_on_door_entered(destination_scene, is_exit_door)`:
  1. If entering: save current level scene path + player position in GameData
  2. Fade overlay to black (0.25s) using SceneTransition overlay tween (not `transition_to`)
  3. Remove all children from level_container
  4. Load + instance destination scene into level_container
  5. Find SpawnPoint, reposition player
  6. Recalculate `_level_bounds` + update camera limits
  7. Fade from black (0.25s)
  8. If exit door: restore saved player position instead of SpawnPoint

**`godot_port/core/GameData.gd`** — add:
```gdscript
# Building entry/exit state
var town_level_scene_path: String = ""
var town_player_position: Vector2 = Vector2.ZERO
```

**`godot_port/core/SceneTransition.gd`** — add helper (or do inline in GameScene):
```gdscript
func fade_to_black(duration: float = 0.25) -> void:
    # Tween overlay alpha 0→1, no scene change
```
(SceneTransition already has `_overlay` and tween infrastructure. May just need a public method to fade without changing scenes.)

### Interior scenes to create

**`godot_port/levels/level_town/interiors/House1Interior.tscn`**:
```
House1Interior (Node2D)
  Floor (StaticBody2D + CollisionShape2D)  — flat floor
  Walls (StaticBody2D + CollisionShape2D)  — left + right walls
  Background (ColorRect)                    — room background color (warm interior)
  SpawnPoint (Marker2D)                     — near exit door
  ExitDoor (Door instance)                  — is_exit_door=true
  BoundsMin (Marker2D)                      — camera bounds
  BoundsMax (Marker2D)
  -- Blue Karim NPC added in Phase 5
```

**`godot_port/levels/level_town/interiors/House2Interior.tscn`** — same structure, for Green + Red Karim.

---

## Phase 4: Quest State System

**Goal:** Persist quest flags to disk with a reset mechanism.

### Files to modify

**`godot_port/data/ProgressData.gd`** — add quest state:
```gdscript
var quest_states: Dictionary = {}   # String → bool

func get_quest(key: String, default: bool = false) -> bool:
    return quest_states.get(key, default)

func set_quest(key: String, value: bool = true) -> void:
    quest_states[key] = value
    save_progress()

func reset_all_progress() -> void:
    # Clears everything: seen_dialogs, quest_states, completed_levels, stats
    seen_dialogs.clear()
    quest_states.clear()
    completed_levels.clear()
    # Reset stats to 0...
    save_progress()
```

Save/load in `[quests]` section of `progress.cfg`:
```gdscript
# In save_progress():
for key in quest_states:
    config.set_value("quests", key, quest_states[key])

# In load_progress():
if config.has_section("quests"):
    for key in config.get_section_keys("quests"):
        quest_states[key] = config.get_value("quests", key, false)
```

**`godot_port/core/EventBus.gd`** — add:
```gdscript
signal quest_state_changed(key: String, value: bool)
```

**Quest keys:**
- `quest_red_karim_accepted`
- `quest_green_karim_confronted`
- `quest_red_karim_complete`
- `brown_karim_vanished`

**Reset mechanism:** Add a debug key (F4) or button in ExtrasScene that calls `ProgressData.reset_all_progress()`. For testing, F4 is fastest.

### Files to modify for reset

**`godot_port/core/DebugOverlay.gd`** — add F4 handler:
```gdscript
if event.is_action_pressed("debug_reset"):
    var p := ProgressData.new()
    p.reset_all_progress()
    # Show confirmation in overlay text
```

**`godot_port/project.godot`** — add input action `debug_reset` mapped to F4.

---

## Phase 5: Dialog Choice Panel

**Goal:** A choice overlay (2-4 buttons) that appears after dialog ends, for Red Karim's quest accept/reject.

### Files to create

**`godot_port/ui/dialog/ChoicePanel.tscn`** — CanvasLayer (layer 16, scene-first):
```
ChoicePanel (CanvasLayer, layer=16, process_mode=ALWAYS)
  ChoiceRoot (Control, full_rect, mouse_filter=IGNORE)
    DarkOverlay (ColorRect, full_rect, Color(0,0,0,0.5))
    PromptBox (PanelContainer, centered, styled dark indigo like dialog box)
      MarginContainer (16px)
        VBox (VBoxContainer, separation=12)
          PromptLabel (Label)            — question text
          Option0 (Button)               — first choice
          Option1 (Button)               — second choice
          Option2 (Button, visible=false) — optional third
          Option3 (Button, visible=false) — optional fourth
```

**`godot_port/ui/dialog/ChoicePanel.gd`**:
```gdscript
extends CanvasLayer

signal choice_made(index: int)

@onready var _prompt: Label = %PromptLabel
@onready var _options: Array = [%Option0, %Option1, %Option2, %Option3]

func setup(prompt: String, option_texts: Array) -> void:
    # Store for use in _ready
    ...

func _ready() -> void:
    layer = 16
    process_mode = Node.PROCESS_MODE_ALWAYS
    # Apply text, show/hide buttons, connect pressed signals
    # Focus first option after 0.2s delay
    # Style buttons with NightSkyTheme pattern

func _on_option_pressed(index: int) -> void:
    AudioManager.play_ui_sfx("ui_confirm")
    choice_made.emit(index)
    queue_free()
```

**Usage:** NPC scripts instantiate ChoicePanel after their dialog ends, connect to `choice_made`, act on the result.

---

## Phase 6: Individual NPC Scripts + Dialog Resources

### 6a. Blue Karim — Shopkeeper (House 1)

**`godot_port/npcs/BlueKarimNPC.gd`** — extends NPC pattern:
- On interact: plays `level_town/blue_karim_greet` dialog
- After dialog ends: spawns ShopPanel

**`godot_port/ui/shop/ShopPanel.tscn`** — CanvasLayer (layer 16, scene-first):
```
ShopPanel (CanvasLayer, layer=16, process_mode=ALWAYS)
  ShopRoot (Control)
    DarkOverlay (ColorRect)
    ShopBox (PanelContainer, centered, styled)
      MarginContainer
        VBox
          TitleLabel ("Karim's Shop")
          Item0 (HBoxContainer: NameLabel + PriceLabel + BuyButton)
          Item1 (HBoxContainer)
          Item2 (HBoxContainer)
          CloseButton ("Close")
```

**`godot_port/ui/shop/ShopPanel.gd`**:
- 3 placeholder items: Potion (50g), Magical Fruit (120g), Lava Boots (300g)
- Buy button shows "not enough gold" dialog or "good choice" dialog (no actual inventory deduction for now)
- Close button emits `shop_closed` signal and queue_free

### 6b. Green Karim — Soldier (House 2)

**`godot_port/npcs/GreenKarimNPC.gd`**:
- `_get_active_dialog_id()` checks quest state:
  - Default: `level_town/green_karim_default`
  - If `quest_red_karim_accepted` and not `quest_green_karim_confronted`: `level_town/green_karim_confronted`
  - If `quest_red_karim_complete`: `level_town/green_karim_reformed`
- After confrontation dialog ends: sets `quest_green_karim_confronted = true`

### 6c. Red Karim — Quest Giver (House 2)

**`godot_port/npcs/RedKarimNPC.gd`**:
- `_get_active_dialog_id()` returns based on quest progression:
  - No quest: `level_town/red_karim_intro` → then shows ChoicePanel
  - Quest accepted, not confronted: `level_town/red_karim_waiting`
  - Quest confronted, not complete: `level_town/red_karim_complete` → shows reward popup
  - Quest complete: `level_town/red_karim_done`
- Accept choice: sets `quest_red_karim_accepted = true`
- Completion: sets `quest_red_karim_complete = true`, shows ItemAcquiredPopup with "Dildo" text

### 6d. Black Karim — Outdoor Wanderer

**`godot_port/npcs/WanderingNPC.gd`** — extends NPC.gd with wandering:
- Random direction changes (40% idle, 30% left, 30% right)
- Slow speed (~20 px/s vs player's 120)
- Timer-based: idle 2-5s, walk 1-3s
- Direct position manipulation (Area2D, no physics needed on flat ground)
- `@export var wander_min_x: float` and `wander_max_x: float` to bound movement
- Stops wandering during interaction

Dialog: `level_town/black_karim_flavor` (one_shot=false, replays every time)

### 6e. Brown Karim — Spooky Disappearance

**`godot_port/npcs/BrownKarimNPC.gd`**:
- On `_ready()`: check `ProgressData.get_quest("brown_karim_vanished")`, if true → `queue_free()`
- On interact:
  1. Stop music: `AudioManager.stop_music(0.3)`
  2. Play dialog `level_town/brown_karim_spooky` (just "...")
  3. After dialog: brief 0.5s pause beat
  4. Tween NPC offscreen (1.5s, accelerating)
  5. Tween modulate.a to 0
  6. Set `quest_state("brown_karim_vanished", true)`
  7. Resume town music: `AudioManager.play_music("level_town")`
  8. `queue_free()`

Uses `WanderingNPC.gd` as base (has wandering behavior) with override for the spooky interaction.

### Dialog .tres files to create

All under `godot_port/levels/level_town/dialogs/`:

| File | Lines | one_shot |
|------|-------|----------|
| `blue_karim_greet.tres` | 2 lines (shopkeeper greeting) | false |
| `blue_karim_no_money.tres` | 1 line (not enough gold) | false |
| `blue_karim_bought.tres` | 1 line (good choice) | false |
| `green_karim_default.tres` | 3 lines (war stories) | false |
| `green_karim_confronted.tres` | 4 lines (player + green back-and-forth) | true |
| `green_karim_reformed.tres` | 1 line (post-quest flavor) | false |
| `red_karim_intro.tres` | 4 lines (complaint + ask for help) | false |
| `red_karim_accept.tres` | 2 lines (thank you) | true |
| `red_karim_decline.tres` | 2 lines (rejection response) | false |
| `red_karim_waiting.tres` | 1 line (waiting for confrontation) | false |
| `red_karim_complete.tres` | 3 lines (gratitude + reward) | true |
| `red_karim_done.tres` | 1 line (post-quest flavor) | false |
| `black_karim_flavor.tres` | 2 lines (Elden Ring / League) | false |
| `brown_karim_spooky.tres` | 1 line ("...") | true |

---

## Phase 7: Placing Everything in Scenes

### TownLevel.tscn — add instances:
- Door1 (Door.tscn) at House 1 door position → `destination_scene = House1Interior`
- Door2 (Door.tscn) at House 2 door position → `destination_scene = House2Interior`
- BlackKarim (NPC.tscn + WanderingNPC.gd) with black color, positioned in town
- BrownKarim (NPC.tscn + BrownKarimNPC.gd) with brown color, positioned in town

### House1Interior.tscn — add instances:
- BlueKarim (NPC.tscn + BlueKarimNPC.gd) with blue color
- ExitDoor (Door.tscn) with `is_exit_door = true`

### House2Interior.tscn — add instances:
- GreenKarim (NPC.tscn + GreenKarimNPC.gd) with green color
- RedKarim (NPC.tscn + RedKarimNPC.gd) with red color
- ExitDoor (Door.tscn) with `is_exit_door = true`

---

## Summary: All New Files

```
godot_port/
├── npcs/                           # NEW DIRECTORY
│   ├── NPC.tscn                    # Base NPC scene (Area2D + Sprite + Collision)
│   ├── NPC.gd                      # Base: E-key interact, face player, dialog
│   ├── Door.tscn                   # Door interaction scene
│   ├── Door.gd                     # Door: scene swap via EventBus signal
│   ├── WanderingNPC.gd             # NPC + random organic wandering
│   ├── BlueKarimNPC.gd             # Shopkeeper: dialog → shop menu
│   ├── GreenKarimNPC.gd            # Soldier: conditional dialog per quest
│   ├── RedKarimNPC.gd              # Quest giver: dialog → choice → quest
│   └── BrownKarimNPC.gd            # Spooky: music stop → "..." → run → vanish
├── ui/
│   ├── dialog/
│   │   ├── ChoicePanel.tscn        # 2-4 option choice overlay (scene-first)
│   │   └── ChoicePanel.gd
│   └── shop/
│       ├── ShopPanel.tscn          # Placeholder shop menu (scene-first)
│       └── ShopPanel.gd
├── levels/level_town/
│   ├── TownLevel.tscn              # Flat town with houses + NPCs + doors
│   ├── dialogs/                    # 14 dialog .tres files (see table above)
│   └── interiors/
│       ├── House1Interior.tscn     # Shop interior
│       └── House2Interior.tscn     # Couple's house interior
```

## Files to Modify

| File | Changes |
|------|---------|
| `core/EventBus.gd` | Add `door_entered`, `quest_state_changed` signals |
| `core/GameData.gd` | Add `town_level_scene_path`, `town_player_position` |
| `core/AudioManager.gd` | Add `"level_town"` music key |
| `data/LevelDefs.gd` | Add `level_town` entry |
| `data/ProgressData.gd` | Add `quest_states` dict, `get_quest()`, `set_quest()`, `reset_all_progress()`, save/load quest section |
| `game/GameScene.gd` | Add Marker2D bounds fallback, door scene-swap handler |
| `core/SceneTransition.gd` | Add `fade_to_black()` and `fade_from_black()` public methods (if not already exposed separately) |
| `core/DebugOverlay.gd` | Add F4 progress reset handler |
| `project.godot` | Add `debug_reset` input action (F4) |
| `CLAUDE.md` | Update directory tree |
| `docs/status.md` | Session log |

## Implementation Order

1. **Phase 1** — TownLevel.tscn + LevelDefs + bounds fallback → verify player walks on flat ground
2. **Phase 2** — NPC.tscn + NPC.gd → place a test NPC in town, verify E-key + dialog
3. **Phase 4** — Quest state in ProgressData + F4 reset → verify persistence
4. **Phase 3** — Door.tscn + Door.gd + scene swap in GameScene → enter/exit House 1
5. **Phase 5** — ChoicePanel.tscn → test standalone choice overlay
6. **Phase 6** — All 5 NPC scripts + shop + 14 dialog .tres files
7. **Phase 7** — Wire everything into scenes, full integration test

## Progress Tracking

Each phase is implemented one at a time. After implementation, user verifies with F5. Only after successful verification does the next phase begin. Progress is tracked via TodoWrite and updated in `docs/status.md` after each completed phase.

**Checkpoint pattern:**
1. Implement phase
2. Run headless validation
3. User tests with F5
4. If issues → fix before moving on
5. Mark phase complete in todos + status.md
6. Begin next phase

## Verification

After each phase, run headless validation:
```bash
"c:/Users/Robin/Desktop/Godot_v4.6.1-stable_win64.exe" --headless --path "c:/Users/Robin/Desktop/codex/godot_port" --quit 2>&1
```

Full test (F5 in Godot):
1. Boot → Menu → Level Select → Town star → load TownLevel
2. Walk left/right, camera scrolls horizontally
3. Approach house door, E-key prompt appears, press E → fade to black → interior loads
4. Inside house, NPC present, E-key → dialog plays with typewriter
5. Exit door → fade → back in town at same position
6. Blue Karim: dialog → shop menu → close
7. Red Karim: dialog → choice panel → accept quest
8. Green Karim: conditional dialog based on quest state
9. Red Karim again: quest complete → reward popup
10. Black Karim: wandering + flavor dialog
11. Brown Karim: music stops, "...", runs offscreen, permanently gone
12. F4 → reset all progress, re-enter town → Brown Karim back
