# Project Status

Last updated: 2026-02-22 (Session 48 — v0.2.7 release)

## Current Workstreams

<!-- Active parallel sessions. Update when starting/finishing a worktree session. -->
<!-- Format: | worktree name | files claimed | status | last update | -->

| Workstream | Claimed Files | Status | Updated |
|------------|---------------|--------|---------|
| (none active) | — | — | — |

## Working

Verified by F5 runtime testing:

- Boot → Menu → Game scene flow (with fade transitions)
- Player run (A/D, arrows) at 120 px/s max, acceleration-based (900 px/s² ground, 585 px/s² air)
- Turn bonus: 60% extra acceleration when reversing direction
- Player jump (W/Up/Space) with force 230, designed for ~5-tile (40px) height, 0.33s to apex
- Variable jump height: timer-based (0.18s hold window), short tap = low hop, hold = full height
- Jump apex hang: half gravity when |vel_y| < 20 px/s (Celeste-style float, only on real jumps)
- Asymmetric gravity: 680 ascent / 1000 descent (1.47x heavier falling)
- Short hop gravity: 2.5x multiplier when jump released early
- Jump horizontal boost: +25 px/s when jumping while moving
- Fast fall: hold S/Down for 500 px/s terminal velocity (vs 360 normal)
- Coyote time (0.11s) and jump buffer (0.13s) — buffer expires correctly, no phantom hops on landing
- Squash & stretch: subtle sprite scale on jump launch (0.85, 1.15) and landing (1.15, 0.85), smooth lerp recovery
- Wall slide (stick to wall, slow fall at 50 px/s max, wall stick force keeps contact reliable)
- Wall slide detach: press opposite direction to release from wall and fall
- Wall slide blocks dash (can't dash while wall sliding)
- Wall slide dampens rocket momentum: 30% velocity cut on contact + full gravity while rising
- Wall jump (Space while wall sliding, launches away)
- Same-wall lock (can't wall-jump same wall twice, resets on ground)
- Wall jump lock timer (0.15s prevents air control override)
- Ceiling bonk (instant velocity cancel via apply_movement sync)
- LDtk IntGrid tile collision (Cavernas tileset, 8px grid)
- Camera follow (Camera2D in SubViewport, zoom=1, manual smooth+pixel snap via SubViewport at 426x240)
- 7 autoloads registered: EventBus → GameData → SettingsManager → AudioManager → SceneTransition → DragonFlyby → DebugOverlay
- Audio bus layout: Master → Music, SFX, UI (default_bus_layout.tres)
- Music playback: menu_bgm crossfades to level music on scene transition (0.8s fade), same-stream detection prevents restart
- Per-level music: Level 1 plays level1_bgm.mp3, other levels fall back to same track. Music continues seamlessly across portal transitions when same stream.
- Music files looping (loop=true in .import settings)
- UI SFX: tick on button focus, confirm on button press
- SFX volume slider controls both SFX and UI buses
- Scene transitions: fade-to-black/fade-from-black via SceneTransition autoload
- Menu entrance animation: title slides from left with bounce (TRANS_BACK), buttons cascade from left with staggered slide-in. Skipped on return from sub-menus. Buttons unlock individually as each finishes animating.
- ExtrasScene: achievements list, gallery placeholder, stats vertical list (ScrollContainer+VBoxContainer)
- Menu → Options, Menu → Extras, Esc to return all working
- Menu night sky background shader (twinkling stars, aurora wisps, dark indigo gradient)
- Menu procedural terrain silhouette (two-layer blocky ground)
- Menu player character on platform (Owlet Monster AnimatedSprite2D, idle animation looping)
- Menu Karim fly-by (sine-wave flight, persists across menu scenes via DragonFlyby autoload, draws behind text)
- Menu firefly particles (blue-white motes drifting upward)
- Menu vignette overlay (warm edge darkening)
- Menu button styling (translucent indigo pills, 12px rounded corners, blue-white font, focus pulse)
- Menu title breathing effect (gentle scale oscillation)
- Menu editor preview matches runtime (@tool script + embedded shader materials)
- In-game version check: VersionChecker.gd fetches remote version.json on boot, MenuScene shows "Update Available" label at bottom-right with click-to-open-browser
- itch.io distribution: push_itch.sh script for headless export + butler push + Discord webhook notification
- OptionsScene: night-sky backdrop (shaders in .tscn), @tool editor preview, styled tabs/sliders/checkbuttons/buttons, entrance animation, firefly particles, vignette
- ExtrasScene: night-sky backdrop (shaders in .tscn), @tool editor preview, styled tabs/labels/buttons, entrance animation, firefly particles, vignette
- LevelSelectScene: constellation map level select (night-sky themed, 5 stars in zig-zag pattern, navigate with arrow keys, locked/unlocked/completed states)
- Dynamic level loading: GameScene loads selected level via GameData autoload (no more hardcoded Level1)
- Per-level completion tracking: ProgressData.completed_levels array with save/load
- Pixel-perfect rendering: SubViewport 426x240 (3x integer scale), camera in physics process mode — no motion blur
- Death/respawn system: dissolve shader (0.5s) → soul particles (0.8s) → materialize (0.4s), kill plane at level bounds, no flicker (permanent shader pattern)
- Rocket boots fire animation: FlameSprite node in Player.tscn (4-frame burn, 15fps, visible during thrust)
- Rocket boots thrust sound: ThrustSound node in Player.tscn (user-provided WAV, looping via .import loop_mode=1)
- HUD fully embedded in HUD.tscn: hearts, dash icon, item frame, fuel bar, item icon — all inspectable in editor
- All rocket boots nodes inspectable in Godot editor (Player.tscn: FlameSprite + ThrustSound, HUD.tscn: FuelBar + ItemIcon)
- Pause menu: ESC toggles overlay at full 1280x720 resolution, RESUME/QUIT TO MENU buttons, music crossfade to pause_bgm, scale-pop entrance animation
- Wall jump: dedicated WALL_JUMP_H_FORCE=160 px/s (was 96), launches player further from wall
- Dash: swoosh sound (procedural 120ms noise sweep) + 5-particle dust puff behind player on activation (3x3 dots, foot-level positioning)
- Item pickup: E-key interaction (no auto-collect), floating keycap prompt, ambient sparkles, glow pulse on proximity
- Item acquired popup: shader-animated border (flowing energy, sparkles, corner glow), bounce entrance, particle burst, auto-dismiss after 3s, rocket boots help text
- Music ducking: ducks on death (-14 dB), stays ducked through Game Over, gradually restores over full respawn sequence (1.45s). Cinematic dialog ducks to -18 dB during zoom-in, restores on zoom-out.
- Dialog talk SFX: Animal Crossing-style per-character voice blips (formant-filtered pulse wave, random pitch variation, per-line voice_pitch control via DialogLine resource)
- Portal system: oval swirl/vortex shader portal, E-key interaction, cinematic pull-in + dissolve + flash + scene transition to destination level. Inspector-configurable: destination_level_id, portal_color, portal_scale. Placed in levels same as Pickup/DialogTrigger.
- Town weather system: shader-based rain/snow overlays with smooth 2s transitions, ground accumulation (puddles/snow), cloud darkening, F6 debug cycling, z_index=99 below NightOverlay
- Town ground polish: noise-varied soil shader (4px blocks, pebbles, root streaks) on GroundVisual + 15 animated GrassTuft props (sine-sway blades, staggered phases, colour variation) placed across 2200px town width
- Town vignette: camera-tracked VignetteOverlay (z_index=102) in TownLevel using existing vignette.gdshader, tracked same as sky in TownController._process()
- Day/night debug hotkeys: F7 fast-forwards time by 12% (≈36 game-minutes), F9 toggles cycle pause — both show flash label. F8 reserved by Godot editor (stop game), remapped to F9.
- Town house window glow: analytic radial gradient shader (window_glow.gdshader, blend_add, UV-centered, modulate.a = brightness from TownController)
- ShopPanel: full buy/sell UI (Session 42). 3 item slots (Extra Heart 80c, Speed Charm 120c, Town Key 60c). Grey-out unaffordable, Owned state, 2-step confirm, red flash on denied. F10 debug adds 100 coins. ProgressData.coins + purchased_items persisted.

## Broken / Untested

- **[gameplay]** Rocket boots thrust — gravity bypass + thrust=600 working. Values may still need tuning.
- **[UI]** HUD instanced inside SubViewport — hearts/dash/item box display at native 426x240. Not yet tested with actual damage (no enemies).
- **[UI]** HUD fuel gauge — ColorRect drains inside item box. Color shifts at 50%/25%. Working with rocket boots.
- **[menu]** Options/Extras particle effects are runtime-only (firefly particles appear at F5, not in editor)
- **[distribution]** GitHub repo `zyynx-hub/platformerv2` only holds `version.json` — game source not tracked in git
- **[gameplay]** Portal in Level 1 — shader visual, particles, E-key interaction, cinematic activation need F5 testing. Level 2 scene exists, transition testable.

## Not Started

- Enemies and combat
- More collectible items
- Checkpoints
- Multiple levels (Level 3-5 are placeholder stars on constellation map; Level 2 has LDtk tilemap + scene)
- ~~Pause menu~~ (working: ESC overlay with RESUME/QUIT, renders at full resolution)
- ~~Game over / death respawn~~ (complete: dissolve/particle/materialize + kill plane, flicker fixed)
- Key rebinding in Options (stretch goal)
- Export / packaging (export preset exists — re-export via Project > Export when pushing updates)

## Session Log

### Session 45 (2026-02-22) — Bug fixes + knowledge save

**Knowledge updates:**
- MEMORY.md: updated directory structure to Session 44, added Quest Log + Jungle Level + HydraBodyNPC/ThreeHeadedKarim subsystem entries, added 5 new Godot gotchas
- Created `.claude/rules/quest-registry.md` — mandatory rule: update docs/quest-registry.md whenever any NPC/quest/dialog/state key changes
- Updated `.claude/rules/session-protocol.md` — added quest-registry update to Doc Integrity section

**Bug fixes (from F5 test output):**
- `CinematicDialog.gd:98` — `maxf(..., 0.05)` clamp on `pitch_scale`. voice_pitch=0.2 with spread=0.3 → raw -0.1 → Godot runtime error. Was spamming 30+ debugger errors per dialog.
- `HydraBodyNPC.gd`, `ThreeHeadedKarimNPC.gd`, `PurpleKarimNPC.gd` — added `@tool`. NPC.gd has @tool; all scripts in chain must also have it.

**Non-actionable pre-existing warnings:** signal unused ×25, ternary mismatch ×2, invalid UID (path fallback, non-fatal).

**Headless:** 0 errors.

**F5 verified (Session 46 follow-up):** #1 quest loop, #2 Q key, #3 QUEST LOG button (ESC close added this session), #4 green atmosphere, #5 house interior, #6 body fades all working.

---

### Session 46 (2026-02-22) — Boss spawn cutscene + hydra body layout fix

**Fixes from F5 test feedback:**
- `QuestLogScene.gd` — added `ui_cancel` (ESC) to close quest log
- `JungleHouseInterior.tscn` — removed HydraBody1 from interior (was invisible to player); interior is now an empty room
- `JungleLevel.tscn` — added HydraBody1 as exterior NPC at x:450, wander 380-520 (between house and body 2). All 3 bodies are now exterior, clear left-to-right order.

**Boss spawn cutscene (ThreeHeadedKarim reveal):**
- `EventBus.gd` — added `camera_shake_requested(duration, intensity)` signal
- `GameScene.gd` — handles camera shake via async loop (Time.get_ticks_msec() tracking, applies camera.offset with decay, clears on finish)
- `JungleLevelController.gd` — replaced instant `visible = all_gone` with `_trigger_boss_spawn()` coroutine:
  - Fade to black (0.6s) via SceneTransition.fade_to_black()
  - Teleport boss to x:900, scale=0.1 while black
  - Play `dash_swoosh.wav` at pitch=0.13 (deep bass rumble) for dramatic effect
  - 0.5s suspense, fade back in (0.8s)
  - Camera shake (0.9s, intensity=5) + scale-pop from 0.1→1.3 (TRANS_BACK overshoot)
  - `_boss_spawning` flag prevents double-trigger during cutscene
  - `play_cutscene=false` on initial load (no cutscene if already triggered in prior session)

**Three-headed Karim sprite (3-body boss look):**
- `JungleLevel.tscn` — added LeftHead and RightHead Sprite2D nodes as children of ThreeHeadedKarim instance
- LeftHead: position (-14,-6), rotation -22.5°, scale 0.75, z_index=-1 (behind center)
- RightHead: position (14,-6), rotation +22.5°, scale 0.75, z_index=-1 (behind center)
- Both use karim_npc.png with same dark purple modulate — creates hydra silhouette of 3 fanned bodies
- Parent modulate:a tween in ThreeHeadedKarimNPC._fade_and_leave() fades all 3 heads together

**Headless:** 0 errors.

**F5 verified (partial):** ESC closes quest log ✓, all 3 exterior hydra bodies ✓, body-by-body fade (after ends_with bug fix) ✓

**Untested (F5):**
- Full boss spawn cutscene end-to-end: fade→rumble→camera pan to boss→shake+scale-pop→camera return
- Three-headed Karim flanking head appearance in-game

---

### Session 48 (2026-02-22) — v0.2.7 release

**Version bump:** `0.2.6.5` → `0.2.7` in `core/Constants.gd` and `version.json`

**Export:** headless Windows export — `build/AnimePlatformer.exe` (100MB) + `AnimePlatformer.pck` (17MB). No errors.

**Butler command:** `butler push godot_port\build zyynx-hub/platformer:windows --userversion 0.2.7`

**Discord:** rich-embed release notification sent (HTTP 204).

---

### Session 47 (2026-02-22) — Bug fixes + camera pan + @tool chain

**Bug fixes:**
- `HydraBodyNPC.gd:20` — `ends_with("/dialog")` → `== dialog_id`. Root cause: EventBus.cinematic_dialog_ended broadcasts to ALL connected NPC instances, so ends_with("/dialog") caused all 3 Hydra Bodies to fade simultaneously when any 1 was talked to.
- `WanderingNPC.gd` + `BlueKarimNPC.gd` + `GreenKarimNPC.gd` + `RedKarimNPC.gd` + `BrownKarimNPC.gd` — added `@tool`. Full NPC inheritance chain now has @tool on every script. Debugger count: 44→43.

**Camera pan feature:**
- `EventBus.gd` — added `camera_pan_requested(target, pan_duration, hold_duration, return_duration)` signal
- `GameScene.gd` — `_on_camera_pan()`: disables follow, tweens to target, holds, tweens back to player, re-enables follow. Uses `position_smoothing_enabled=false` during tween.
- `JungleLevelController.gd` — `_trigger_boss_spawn()` updated: emits camera_pan_requested(900,0, 0.8, 1.8, 0.8), waits 0.8s for arrival, then triggers camera_shake + scale-pop

**Quest log:** ESC (ui_cancel) now closes quest log in addition to Q toggle.

**Hydra body layout:** All 3 Hydra Bodies are now exterior in JungleLevel.tscn (x:450, x:700, x:1200). JungleHouseInterior.tscn is now an empty room.

**Three-headed Karim sprite:** LeftHead + RightHead Sprite2D nodes added as children in JungleLevel.tscn (z_index=-1, ±22.5° rotation, 0.75x scale, same dark purple) for 3-body boss silhouette.

**Headless:** 0 errors.

---

### Session 44 (2026-02-22) — Hydra Karim Quest + Jungle Village

**Full implementation of the Purple Karim's Debt questline and Jungle Village area.**

**New files created (18):**
- `data/QuestDefs.gd` — static quest registry (Red Karim's Problem + Purple Karim's Debt)
- `ui/quest_log/QuestLogScene.tscn + QuestLogScene.gd` — quest log overlay (CanvasLayer 21, Q key, EventBus.quest_log_requested)
- `npcs/PurpleKarimNPC.gd` — quest giver, auto-accept, Vibrator reward on completion
- `npcs/HydraBodyNPC.gd` — @export state_key, speaks once, fades 1.2s, sets state key
- `npcs/ThreeHeadedKarimNPC.gd` — appears after all bodies gone, fades 1.5s after encounter
- `levels/level_jungle/JungleLevelController.gd` — @tool, green night overlay (0.35 min), quest-conditional NPC visibility
- `levels/level_jungle/JungleLevel.tscn` — 1600px flat jungle, sky+night+vignette shaders, HydraBody2/3, ThreeHeadedKarim (hidden), PortalBack
- `levels/level_jungle/interiors/JungleHouseInterior.tscn` — HydraBody1 inside (standing), exit door
- `levels/level_town/dialogs/purple_karim/intro.tres` — 10 lines, one_shot, Dutch dialogue
- `levels/level_town/dialogs/purple_karim/waiting.tres` — 2 lines, repeatable
- `levels/level_town/dialogs/purple_karim/complete.tres` — 4 lines, one_shot
- `levels/level_town/dialogs/purple_karim/done.tres` — 1 line, repeatable
- `levels/level_jungle/dialogs/hydra_body_1/dialog.tres` — 1 line "…", one_shot, voice_pitch 0.3
- `levels/level_jungle/dialogs/hydra_body_2/dialog.tres` — 1 line "…", one_shot
- `levels/level_jungle/dialogs/hydra_body_3/dialog.tres` — 1 line "…", one_shot
- `levels/level_jungle/dialogs/three_headed_karim/encounter.tres` — 6 lines Dutch, one_shot, voice_pitch 0.2

**Modified files (8):**
- `core/EventBus.gd` — added `quest_log_requested` signal
- `project.godot` — added `quest_log` input action (Q key)
- `data/LevelDefs.gd` — added `level_jungle` entry; updated `level_town` connections
- `levels/level_town/TownLevel.tscn` — added PurpleKarim NPC (x=1400, purple modulate, wander 1200-1700) + JunglePortal (x=1950, green, destination=level_jungle); BoundsMax extended to x=2100
- `ui/pause/PauseScene.tscn` — added QUEST LOG button; expanded VBox height; added Controls tab Q label
- `ui/pause/PauseScene.gd` — wired quest_log_button → EventBus.quest_log_requested.emit()
- `game/GameScene.tscn` — added QuestLogScene instance as permanent child
- `docs/quest-registry.md` — added Purple Karim, Hydra Bodies, Three-Headed Karim NPCs, Purple Karim's Debt quest, 8 new dialog entries, 7 new state keys, updated dependency graph

**Architecture notes:**
- Quest Log: opens via Q key (quest_log action) or PauseScene QUEST LOG button. Tracks _was_paused to restore game tree pause state. Procedurally builds quest entry rows (acceptable exception).
- JungleLevelController: reuses town_sky + night_overlay shaders with green tint (Color(0.02,0.10,0.04)). darkness clamped to 0.35 minimum for permanent dim atmosphere.
- HydraBodyNPC: `state_key` export allows single script for all 3 bodies. Only `ends_with("/dialog")` triggers fade.
- ThreeHeadedKarim visibility: always in scene (visible=false), JungleLevelController reacts to quest_state_changed and toggles visibility. No runtime spawning.
- portal_scale is a float (not Vector2) — Portal.gd uses it for BASE_HALF_W/H multiplier.

**Untested (needs F5):**
- Full quest loop: Purple Karim intro → portal → all 3 bodies → Three-Headed → return → reward + quest log Completed
- Q key opens quest log in-game
- QUEST LOG button in pause menu opens same overlay
- Jungle level loads with green atmosphere
- JungleHouseInterior door enter/exit
- Body fade animations
- ThreeHeadedKarim conditional visibility

---

### Session 43 (2026-02-22) — Quest Registry

**Comprehensive quest documentation for long-term maintainability.**

**Created:**
- `docs/quest-registry.md` — canonical source of truth: Location Map, NPC Registry (all 5 NPCs with script/placement/voice_pitch/dialog logic), Quest Registry (Red Karim's Complaint full step table), Events (Brown Karim vanish sequence), Shop Registry (3 items + notes on unimplemented effects), Dialog Registry (all 14 dialog IDs with conditions/one_shot/line count), Quest State Key Registry (all 4 keys), plain-text dependency graph, How-to-Add checklists

**Updated:**
- `docs/quest-flowchart.md` — added reference to quest-registry.md as backing data source
- `docs/status.md` — this entry

**Notes surfaced during audit:**
- `blue_karim/bought.tres` and `blue_karim/no_money.tres` exist as files but are NOT wired in ShopPanel.gd (reserved, unused)
- `town_key` shop item implies a ProgressionGate dependency that does not yet exist in TownLevel.tscn

---

### Session 42 (2026-02-22) — ShopPanel Implementation

**Full shop UI replacing the placeholder.**

**Changed:**
- `data/ProgressData.gd` — added `coins: int`, `purchased_items: Array[String]`, save/load under `[shop]` section, `buy_item()`, `is_purchased()`, reset
- `data/ItemDefs.gd` — added `SHOP: Array` with 3 items (extra_heart 80c, speed_charm 120c, town_key 60c)
- `core/EventBus.gd` — added `coins_changed(new_amount: int)` signal
- `core/DebugOverlay.gd` — added F10 handler: adds 100 coins to save file for testing
- `project.godot` — added `debug_add_coins` input action (F10)
- `ui/shop/ShopPanel.tscn` — rebuilt scene-first: 3 pre-built item slots (PanelContainer + HBox with name/desc VBox + cost label + buy button), coin balance header, StyleBoxFlat styles, 600×420 centered box
- `ui/shop/ShopPanel.gd` — full implementation: populate from ItemDefs.SHOP, grey-out unaffordable, "Owned" state, 2-step confirm (first press = "OK?", second = execute), red flash on denied, `coins_changed` signal emit

**Headless validation:** Clean, no errors.

**Testing:** Press F10 (in-game) to add 100 coins, then talk to Blue Karim in town to open the shop.

### Session 7 (2026-02-19) — Dragon Fly-by Sync + Entrance Animation Polish

**Dragon fly-by now persists across menu scenes and draws behind text.**

**New script:**
- `scripts/core/DragonFlyby.gd` — autoload: time-based Karim fly-by that continues seamlessly across Menu/Options/Extras scene transitions. Creates a local Sprite2D in each scene, inserted before TitleLabel for correct z-order (behind text, in front of background).

**MenuScene.gd changes:**
- Removed local dragon code (`_dragon`, `_setup_dragon`, `_fly_dragon`, `_schedule_dragon_flyby`)
- Added `DragonFlyby.attach_to_scene(self, title_label)` for global dragon
- Added `static var _has_visited` — first visit plays full entrance animation, return from sub-menus skips it entirely (no stall)
- Buttons now unlock individually: each button becomes clickable as soon as its slide-in animation finishes, not all at once at the end
- First button grabs focus immediately when it finishes animating

**OptionsScene.gd / ExtrasScene.gd — dragon integration:**
- Added `DragonFlyby.attach_to_scene(self, title_label)` so the Karim image appears in sub-menus too

**project.godot:**
- Registered 5th autoload: DragonFlyby (after SceneTransition)

**ExtrasScene.tscn — Stats restructured:**
- Replaced nested Stats TabContainer (each stat was a separate tab with raw node names) with ScrollContainer + VBoxContainer
- All 6 stat labels now in a single vertical list with 12px spacing

**SubMenuTheme.gd — CheckButton flicker fix:**
- Set all 5 font color overrides (normal, hover, pressed, hover_pressed, focus) to the same value
- Eliminates text color flicker when toggling CheckButtons on/off

**Headless validation:** Clean parse, no errors.

### Session 6 (2026-02-18) — Sub-Menu Visual Overhaul + Editor Parity

**Made Options and Extras scenes match MenuScene's night-sky aesthetic, with editor preview.**

**New script:**
- `scripts/ui/SubMenuTheme.gd` — shared `class_name SubMenuTheme` utility with static methods for:
  - `create_particles()` — runtime-only firefly particles
  - `style_title()`, `style_button()`, `style_tab_container()`, `style_slider()`, `style_check_button()` — consistent indigo/blue theme
  - `style_labels_recursive()` — recursively applies font colors to all Labels in a tree
  - `connect_button_focus()` — scale bump + tick SFX on hover/focus
  - `play_entrance()` — title slides from left with bounce, content fades in, buttons slide up from below

**OptionsScene.tscn — shader materials embedded:**
- Background ColorRect → ShaderMaterial (menu_background.gdshader)
- GroundOverlay ColorRect added (menu_ground.gdshader, 50% alpha, mouse_filter=IGNORE)
- VignetteOverlay ColorRect added at end (vignette.gdshader, mouse_filter=IGNORE)
- 3 ext_resources (shaders) + 3 sub_resources (ShaderMaterials), load_steps=8

**ExtrasScene.tscn — same shader embedding:**
- Identical shader material pattern as OptionsScene

**OptionsScene.gd — @tool rewrite:**
- `@tool` annotation: `_apply_theme()` runs in editor for preview
- `Engine.is_editor_hint()` guard after styling — runtime-only: particles, settings, signals, entrance animation, music
- Styles TabContainer, HSliders, CheckButtons, Buttons via SubMenuTheme

**ExtrasScene.gd — @tool rewrite:**
- Same @tool pattern as OptionsScene
- Achievement/stats/gallery population runtime-only (guarded by editor check)

**Knowledge docs updated:**
- `godot-workflow.md` — added "Editor–Runtime Parity (MANDATORY)" section with pattern
- `CLAUDE.md` — updated invariants: editor–runtime parity rule, .tscn editing allowed for shaders

**Headless validation:** Clean parse, no errors.

### Session 5 (2026-02-18) — Menu Visual Polish

**Major menu overhaul — from "dead" to alive platformer feel.**

**Shaders created (3 new):**
- `shaders/menu_background.gdshader` — night sky with independently twinkling stars, subtle aurora wisps, dark indigo-to-horizon gradient
- `shaders/vignette.gdshader` — radial edge darkening with configurable tint/strength/softness
- `shaders/menu_ground.gdshader` — procedural two-layer blocky terrain silhouette (far hills + near ground, transparent above)

**MenuScene.gd — full rewrite:**
- Added `@tool` annotation — button styling and shaders render in editor preview
- `Engine.is_editor_hint()` guard prevents runtime logic (music, signals, animations) in editor
- Night-themed button styling: translucent indigo StyleBoxFlat pills, rounded corners, blue-white font
- Title: white text with blue drop shadow, breathing scale animation after intro
- Entrance animation reworked: title slides from off-screen left with TRANS_BACK bounce, buttons cascade in with staggered bouncy slide-in
- Particles reconfigured: blue-white firefly motes drifting upward (was pink sakura, was amber embers)
- Player idle bob: green rectangle on platform gently oscillates Y
- Karim fly-by: Sprite2D loads `assets/sprites/Karim/Screenshot 2026-02-18 165701.png`, flies across upper sky periodically (random direction, sine-wave Y bob, rotation wobble, 8-18s interval)
- Button idle pulse: focused button modulate.a oscillates 0.82-1.0
- Removed `_setup_background_shader()` and `_setup_vignette()` from script (moved to .tscn)

**MenuScene.tscn — restructured:**
- Background ColorRect now has ShaderMaterial (menu_background.gdshader) embedded
- GroundOverlay ColorRect added (full-screen, menu_ground.gdshader, transparent above terrain)
- PlatformBase + PlatformTop ColorRects added (dark indigo stepped blocks under player)
- PlayerSilhouette ColorRect added (green 32x56, unique_name_in_owner for script access)
- VignetteOverlay ColorRect added (full-screen, vignette.gdshader, mouse_filter=ignore)
- TitleLabel repositioned: left-aligned, upper-left (80px margin, y=135)
- ButtonContainer repositioned: left side, anchor_top=0.55

**Assets added:**
- `assets/sprites/Karim/Screenshot 2026-02-18 165701.png` — user-added image for menu fly-by

**Color theme evolution:** Dark purple → Anime sunset (pink/orange/blue) → Night sky (dark indigo/blue). Final theme: dark platformer night sky with stars, terrain, and cool blue UI.

### Session 4 (2026-02-18) — Menu Audio & Polish Fixes

**AudioManager fixes:**
- Music fade start raised from -40 dB to -20 dB (was inaudible)
- Default fade time shortened from 1.5s to 0.8s
- SFX slider now controls both SFX and UI audio buses (UI bus was uncontrolled)
- Removed debug print statements

**MenuScene.gd fixes:**
- Buttons now disabled during intro animation (set `disabled = true`)
- `_intro_done` flag prevents hover sounds and focus effects before animation completes
- `_enable_buttons()` callback at end of tween chain re-enables buttons + gives first button focus
- `mouse_entered` guarded by `_intro_done` check

**User completed editor tasks:**
- Registered 4 autoloads in project.godot (EventBus, SettingsManager, AudioManager, SceneTransition)
- Created audio bus layout (Master → Music, SFX, UI) in default_bus_layout.tres
- Built MenuScene.tscn with TitleLabel + 4 buttons (START/OPTIONS/EXTRAS/QUIT)
- Built ExtrasScene.tscn with Achievements/Gallery/Stats tabs (needs BackButton)
- Music .mp3 imports confirmed loop=true

**User feedback:** Menu looks "dead" — needs visual life (particles, animated background, more polish). This is the top priority for next session.

### Session 3 (2026-02-18) — Menu System Build

**Scripts created (8 new):**
- `scripts/core/SettingsManager.gd` — autoload, persists audio/display settings to `user://settings.cfg`
- `scripts/core/SceneTransition.gd` — autoload, CanvasLayer with fade-to-black/fade-from-black overlay
- `scripts/audio/AudioManager.gd` — autoload, A/B music crossfade, SFX via EventBus signals
- `scripts/scenes/OptionsScene.gd` — Audio sliders, display toggles, controls display
- `scripts/scenes/ExtrasScene.gd` — Achievements, gallery placeholder, stats
- `scripts/data/AchievementDefs.gd` — 8 starter achievement definitions
- `scripts/data/ProgressData.gd` — RefCounted, stats/achievements/gallery persistence to `user://progress.cfg`
- `scripts/tools/generate_ui_sounds.py` — generates ui_tick.wav and ui_confirm.wav procedurally

**Scripts modified (4):**
- `scripts/core/EventBus.gd` — added settings_changed, stat_updated, achievement_unlocked signals
- `scripts/scenes/MenuScene.gd` — full rewrite: entrance animations (title drop, button stagger), focus/hover tweens, 4 buttons (START/OPTIONS/EXTRAS/QUIT), audio events
- `scripts/scenes/GameScene.gd` — added music trigger + SceneTransition calls, modernized signal connections
- `scripts/scenes/Boot.gd` — uses SceneTransition.transition_to instead of raw change_scene

**Assets added:**
- `assets/audio/music/menu_bgm.mp3` — copied from old port
- `assets/audio/music/game_bgm.mp3` — copied from old port
- `assets/audio/music/pause_bgm.mp3` — copied from old port
- `assets/audio/sfx/ui_tick.wav` — procedurally generated (sine burst, 50ms)
- `assets/audio/sfx/ui_confirm.wav` — procedurally generated (two-note chime, 150ms)

**Editor tasks required before F5:**
1. Register 3 autoloads in project.godot: SettingsManager, AudioManager, SceneTransition (in that order, after EventBus)
2. Create audio bus layout: Master → Music, SFX, UI
3. Rebuild MenuScene.tscn with new hierarchy (see CLAUDE.md or plan file)
4. Build OptionsScene.tscn and ExtrasScene.tscn (see plan file for node hierarchies)
5. Set loop=true on all .mp3 imports

### Session 2 (2026-02-18) — Gameplay Loop Working

- Removed HUD from GameScene (was covering game view)
- Added green Polygon2D placeholder for player (8x14 px)
- Shrunk player collision (CapsuleShape2D r=4, h=14) to fit 8px tiles
- Fixed LDtk reimport — recreated testlevel.ldtk with correct Cavernas path
- Created tileset_add_collision.gd post-import script
- Enabled `integer_grid_tilesets=true` for collision/visual separation
- Player spawns and lands on tiles — collision working
- Added Camera2D (zoom=4, smoothing=8) as child of Player
- Fixed velocity_y accumulation bug (reset when grounded)
- Wall slide, wall jump, same-wall lock, ceiling bonk all implemented and verified

### Session 1 (2026-02-18) — Foundation Build

- Wiped godot_port/, created all files from scratch
- project.godot configured (1280x720, gravity=0, inputs, EventBus autoload)
- Constants.gd, EventBus.gd, Player.gd, JetpackController.gd
- Boot.gd, MenuScene.gd, GameScene.gd, HUD.gd
- All .tscn scenes created; 6 critical bugs fixed
- LDtk Importer plugin installed and enabled

### Session 8 (2026-02-18) — itch.io Distribution + Version Check + Bug Fixes

**Added itch.io distribution pipeline, in-game update notification, and fixed two gameplay bugs.**

**New scripts:**
- `scripts/core/VersionChecker.gd` — static utility class (not autoload). HTTP fetches remote `version.json`, compares semver, emits `EventBus.update_available`. Caches result in static vars. Silent failure on network errors.

**Scripts modified:**
- `scripts/core/Constants.gd` — added `APP_VERSION` (now `0.2.0`), `ITCH_URL`, `VERSION_CHECK_URL`
- `scripts/core/EventBus.gd` — added `update_available(version, url, message)` signal
- `scripts/scenes/Boot.gd` — added `VersionChecker.check(SceneTransition)` call before menu transition
- `scripts/scenes/MenuScene.gd` — added permanent version label (bottom-left, faint) + update indicator (bottom-right, hidden until update detected, click opens itch.io page)
- `scripts/scenes/GameScene.gd` — added `_unhandled_input` handler: Escape returns to menu via SceneTransition
- `scripts/player/JetpackController.gd` — fixed super jump bug: jetpack now only arms after jump peak (`velocity_y >= 0.0`), preventing W+Space thrust stacking during ascent

**New files:**
- `version.json` (repo root) — remote version metadata (`latest`, `url`, `message`)
- `scripts/push_itch.sh` — bash script: headless Godot export + butler push with `--userversion`

**Config changes:**
- `.gitignore` — added `godot_port/build/`

**Distribution setup completed:**
- itch.io page live at `https://zyynx-hub.itch.io/platformer`
- GitHub repo `zyynx-hub/platformerv2` hosts `version.json` for remote version checks
- `VERSION_CHECK_URL` points to `https://raw.githubusercontent.com/zyynx-hub/platformerv2/main/version.json`
- Export templates downloaded, Windows Desktop preset configured
- butler CLI installed and authenticated
- v0.1.0 and v0.2.0 successfully pushed to itch.io

**Bug fixes:**
- **Super jump (W+Space stacking):** Jetpack armed immediately on leaving ground, so holding W applied both jump force and jetpack thrust simultaneously. Fix: `armed_after_takeoff` now only sets true when `velocity_y >= 0.0` (after jump peak).
- **No way to leave game:** Added Escape key handler in GameScene to return to menu via SceneTransition.

### Session 9 (2026-02-18) — Jetpack Removal

**Removed jetpack system entirely.** JetpackController.gd deleted, all references stripped from Player.gd, EventBus.gd, Constants.gd, HUD.gd, AchievementDefs.gd, Player.tscn, project.godot. W key now only maps to `jump`.

**Headless validation:** Clean parse, no errors.

### Session 10 (2026-02-18) — Constellation Map Level Select

**Added constellation map level selection screen between menu and gameplay.**

**New scripts:**
- `scripts/data/LevelDefs.gd` — static level registry (class_name LevelDefs), 5 level definitions with star positions, connections, and unlock requirements
- `scripts/scenes/LevelSelectScene.gd` — @tool constellation map: night-sky themed, draw_circle/draw_line rendering, keyboard navigation along constellation edges, locked/unlocked/completed states, info panel

**New scene:**
- `scenes/menu/LevelSelectScene.tscn` — night-sky backdrop (same shader embedding as OptionsScene), StarCanvas for constellation drawing, InfoPanel with level name/status/prompt, BackButton

**Scripts modified:**
- `scripts/scenes/MenuScene.gd` — START button now transitions to LevelSelectScene instead of GameScene
- `scripts/scenes/GameScene.gd` — dynamic level loading via static vars (selected_level_id, selected_level_scene), level completion saves to ProgressData, Escape returns to LevelSelectScene
- `scripts/core/EventBus.gd` — added `level_selected` signal
- `scripts/data/ProgressData.gd` — added `completed_levels` array, `is_level_completed()`, `complete_level()` methods, updated save/load

**Scene modified:**
- `scenes/game/GameScene.tscn` — removed hardcoded Level1 instance (level now loaded dynamically)

**Scene flow updated:** Boot → MenuScene → LevelSelectScene → GameScene

### Session 11 (2026-02-18) — Owlet Monster Character + Camera Overhaul

**Replaced green placeholder with animated Owlet Monster character. Overhauled camera system.**

**Player character (Owlet Monster):**
- Player.tscn: Polygon2D → AnimatedSprite2D, position=(0,-6), texture_filter=1 (NEAREST)
- Player.gd: `_setup_animations()` builds SpriteFrames from horizontal strip PNGs using AtlasTexture
- 8 animations mapped to player states: idle, run, jump, fall, dash, wall_slide, hurt, death
- `flip_h` replaces `scale.x` for facing direction
- `_play_state_animation()` called from `change_state()`

**Menu character:**
- MenuScene.tscn: PlayerSilhouette changed from ColorRect (green box) to TextureRect with Owlet_Monster.png
- 64x64 rect, stretch_mode=5 (KEEP_ASPECT_CENTERED), texture_filter=0

**Camera refactored:**
- Removed Camera2D from Player.tscn (was child of player with built-in smoothing)
- GameScene.gd now owns Camera2D: creates in `_setup_camera()`, zoom=3x
- Manual smooth follow via `lerp()` + `round()` in `_process()` for pixel-perfect positioning
- Manual camera limits (half-viewport clamping) replaces built-in Camera2D limits
- Level bounds calculated from TileMapLayer `get_used_rect()`

**Rendering settings (project.godot):**
- `default_texture_filter=0` (Nearest globally)
- `snap_2d_transforms_to_pixel=true`
- `snap_2d_vertices_to_pixel=true`

**Open bug:** Pixel art still blurry during camera movement despite all fixes. Likely caused by player sprite at sub-pixel world position. Deferred to next session.

**Headless validation:** Clean parse, no errors.

### Session 12 (2026-02-19) — Menu Idle Animation + Version Bump to 0.2.2

**Replaced static menu character with animated idle sprite. Bumped version and pushed to itch.io.**

**MenuScene.tscn:**
- PlayerSilhouette changed from `TextureRect` (static Owlet_Monster.png) to `AnimatedSprite2D`
- Position (896, 512), scale (2, 2), texture_filter=1 (NEAREST)
- Removed `Owlet_Monster.png` ext_resource (no longer needed)

**MenuScene.gd:**
- `_start_player_idle()` rewritten: builds SpriteFrames from `Owlet_Monster_Idle_4.png` strip (4 frames, 8fps, looping)
- Moved `_start_player_idle()` call before `Engine.is_editor_hint()` guard so animation shows in editor preview
- Removed old bobbing tween (`offset_top` up/down)

**Constants.gd:**
- `APP_VERSION` bumped from `0.2.0` to `0.2.2`

**Distribution:**
- Exported and butler-pushed 0.2.2 to itch.io (twice — first push had old export, second had correct build)
- `version.json` on GitHub updated to `0.2.2` — all three version sources now in sync

**Headless validation:** Clean parse, no errors.

### Session 13 (2026-02-19) — SubViewport Pixel-Perfect Rendering + Discord Webhook

**Added SubViewport-based pixel-perfect rendering for GameScene. Added Discord webhook for build notifications.**

**GameScene.tscn restructured:**
- Added SubViewportContainer (1278x720, stretch_shrink=3, texture_filter=NEAREST)
- Added GameViewport SubViewport (auto-sized 426x240, snap_2d_transforms_to_pixel=true, canvas_item_default_texture_filter=Nearest)
- LevelContainer moved inside SubViewport

**GameScene.gd rewritten:**
- Player and Camera2D now spawn inside SubViewport (game_viewport)
- Camera zoom removed (SubViewport handles 3x scaling via container)
- Camera clamping uses NATIVE_SIZE constant (426x240) instead of viewport query
- NEAREST filtering forced on SubViewportContainer in script (belt and suspenders)

**Player.gd:**
- Removed sprite-level position rounding `_process()` (SubViewport snap handles it)
- Removed SPRITE_OFFSET constant

**Discord webhook integration:**
- `.env` file with DISCORD_WEBHOOK_URL (gitignored)
- `push_itch.sh` sends rich embed notification after successful itch.io push
- Sent full project update to Discord channel

**Pixel art blur investigation:**
- SubViewport setup confirmed correct via runtime debug prints (426x240, snap=true, NEAREST)
- Blur persists despite correct setup
- Tried: sprite rounding, camera rounding, SubViewport — all failed
- Remaining candidates: NVIDIA driver bug (581.80 > 572.16 threshold), Windows DPI scaling, editor embedded window

**Headless validation:** Clean parse, no errors.

### Session 14 (2026-02-19) — Player Movement Overhaul

**Complete rewrite of player physics for Celeste-inspired movement feel.**

**Constants.gd — retuned all physics values (final after playtesting):**
- Gravity: 1100 → 680 (ascent) / 1000 (descent, asymmetric)
- Jump force: 420 → 230 (designed for ~5-tile/40px height, 0.33s to apex)
- Run speed: 164 → 120 (renamed PLAYER_WALK_SPEED → PLAYER_RUN_SPEED)
- Max fall: 760 → 360 (fast fall: 500 when holding down)
- Dash speed: 460 → 300
- Wall slide max: 60 → 50
- Decel: 800 (stops in ~0.15s), apex hang threshold: 20, var jump time: 0.18s
- New constants: FALL_GRAVITY, FAST_FALL_SPEED, RUN_ACCEL, RUN_DECEL, TURN_ACCEL_BONUS, AIR_ACCEL_MULT, AIR_DECEL_MULT, JUMP_H_BOOST, VAR_JUMP_TIME, APEX_HANG_THRESHOLD, LOW_JUMP_GRAVITY_MULT

**Player.gd — movement system rewrite:**
- Acceleration-based horizontal movement via `move_toward()` (was instant velocity assignment)
- `_apply_horizontal_movement()` helper: ground vs air accel/decel, turn bonus
- `_get_effective_gravity()` helper: apex hang (half grav near peak), asymmetric descent, short hop multiplier
- Timer-based variable jump (was broken per-frame `velocity_y *= 0.5`)
- Jump horizontal boost (+25 px/s when jumping while moving)
- Squash & stretch on jump launch (0.85, 1.15) and landing (1.15, 0.85) with exponential lerp recovery
- Landing detection via `_was_on_floor` tracking
- Removed debug print statements
- Fast fall support (hold S/Down for higher terminal velocity)
- Hurt state uses `move_toward` for gradual stop instead of instant `velocity_x = 0`

**project.godot:**
- Added `move_down` input action (S key + Down arrow) for fast fall

**Player.tscn — collision shape overhaul:**
- Editor preview: embedded first idle frame (AtlasTexture from Owlet_Monster_Idle_4.png) so sprite is visible in editor for alignment
- User manually adjusted collision in editor: CapsuleShape2D r=7, h=26 at position (-1, -4)
- Sprite position: (0, -7)
- Collision now covers full character body (head + feet aligned with tile surfaces)

**Bug fixes during playtesting:**
- `_jumped` flag: apex hang only activates on real jumps, not when walking off edges (was causing sudden acceleration on drops)
- `last_wall_normal` declaration: was accidentally dropped during rewrite, restored

**Headless validation:** Clean parse, no errors.

### Session 15 (2026-02-19) — HUD System + Item Pickup + Rocket Boots

**Added pixel-art HUD, item/pickup system, and rocket boots collectible with composited sprite approach.**

**HUD system (inside SubViewport at 426x240):**
- `scripts/ui/HUD.gd` — complete rewrite: builds all elements in code (no .tscn nodes)
- 3 heart icons (8x8, top-left): full/half/empty states, red flash on damage
- Dash indicator (8x8 lightning bolt, right of hearts): dims on dash, bright flash when ready
- Item pickup box (18x18 frame, top-right): faint when empty, brightens on pickup with 3s fade
- Instanced in GameScene.gd inside SubViewport as CanvasLayer (layer 10, camera-independent)
- `scenes/ui/HUD.tscn` — stripped to bare CanvasLayer root

**HUD sprites generated (Pillow):**
- `assets/sprites/ui/` — heart_full, heart_empty, heart_half (8x8), dash_icon, dash_icon_dim (8x8), item_frame (18x18)

**EventBus signals added:**
- `dash_cooldown_ended` — emitted by Player.gd when cooldown timer crosses zero
- `item_picked_up(item_data: Dictionary)` — emitted by Pickup.gd on collection

**Item/Pickup system:**
- `scripts/data/ItemDefs.gd` — static item registry (class_name ItemDefs), stores composited_sheets map
- `scripts/items/Pickup.gd` — Area2D collectible, bobbing animation, emits item_picked_up on body_entered
- `scenes/items/Pickup.tscn` — minimal scene with @export item_id

**Rocket boots item:**
- `assets/sprites/items/rocket_boots_icon.png` (16x16) — metallic boots with flames (HUD icon)
- `assets/sprites/items/rocket_boots_pickup.png` (16x16) — same with glow border (world collectible)
- `assets/sprites/items/rocket_boots_equipped.png` (12x4) — flameless boots (compositing source)
- `assets/sprites/items/rocket_boots_composited/` — 6 pre-composited sprite sheets (idle, run, jump, climb, hurt, death) with boots baked into every frame at exact foot positions

**Composited sprite sheet approach (IMPORTANT PATTERN):**
- Equipment visuals use pre-composited sprite sheets, NOT overlay sprites or offset tables
- Python script analyzes foot positions per frame via lowest opaque pixel detection
- Boots are composited into copies of the character's sprite sheets at exact foot positions
- On pickup, Player.gd stores `_sheet_overrides` (base_path → composited_path) and calls `_setup_animations()`
- `_setup_animations()` uses overrides when building SpriteFrames — single AnimatedSprite2D, zero syncing
- `_ANIM_DEFS` constant centralizes animation params: [name, sheet_path, total_frames, fps, loop, from, to]

**Player.gd changes:**
- `_ANIM_DEFS` array replaces hardcoded `_add_strip_anim()` calls
- `_setup_animations()` loops over `_ANIM_DEFS`, applies `_sheet_overrides` per sheet
- Preserves current animation+frame when rebuilding SpriteFrames mid-gameplay
- `_on_item_picked_up()` is 3 lines: store id, store overrides, rebuild animations
- Emits `dash_cooldown_ended` when cooldown timer crosses zero

**Level1.tscn:** Added RocketBootsPickup node at position (152, 114), right of spawn

**Headless validation:** Clean parse, no errors.

### Session 16 (2026-02-19) — Rocket Boots Activation

**Activated rocket boots: thrust physics, fire animation, propulsion sound, fuel gauge.**

**New file:**
- `scripts/tools/generate_flame_sprites.py` — Pillow script: generates `rocket_flame_4.png` (4-frame 12x14 pixel-art fire strip, dual-boot flame with classic fire color ramp)

**New assets:**
- `assets/sprites/items/rocket_flame_4.png` — 48x14 horizontal strip, 4 frames of downward-pointing dual flames
- `assets/audio/sfx/rocket_thrust.wav` — 0.4s loopable 8-bit thruster (75 Hz square wave + 25% noise)

**Constants.gd — 5 new rocket boot constants:**
- ROCKET_THRUST=600 (bumped from 500), ROCKET_MAX_RISE=180, ROCKET_FUEL_MAX=1.5, ROCKET_FUEL_DRAIN=1.0, ROCKET_FUEL_REFILL=0.6

**EventBus.gd:**
- Added `rocket_fuel_changed(fuel, max_fuel)` signal

**Player.gd — thrust system:**
- `_update_rocket_boots(delta)` runs before state machine: checks activation conditions, drains fuel, toggles flame/sound
- Activation: airborne + jump held + var_jump_timer expired + fuel > 0 + rocket_boots equipped
- Thrust applied in `jump_state`/`fall_state`: gravity BYPASSED during thrust (was net-downward when fighting 680 gravity). Pure upward accel clamped to `-MAX_RISE`
- Normal jump completes first (var_jump_timer window), then thrust chains in seamlessly
- `_setup_rocket_effects()` on pickup: creates flame AnimatedSprite2D (pos 0,16, 15fps burn anim) + looping AudioStreamPlayer (SFX bus, -6 dB)
- Fuel refills at 0.6/s on ground, drains at 1.0/s during thrust

**HUD.gd — fuel gauge:**
- ColorRect behind item icon, 16x16, empties from top (remaining fuel sits at bottom)
- Color shifts: blue (>50%) → orange (25-50%) → red (<25%)
- Connected to `rocket_fuel_changed` signal

**generate_ui_sounds.py:**
- Added `generate_rocket_thrust()` — seamless loop via exact wave-period sample count, deterministic LCG noise

**Bug fixes (mid-session playtesting):**
- **Thrust too weak:** ROCKET_THRUST (500) was applied ON TOP of gravity (680), giving net downward force of 180. Fix: gravity now bypassed entirely during thrust. Thrust bumped to 600.
- **Sound plays single blip then silence:** `AudioStreamWAV.loop_end` defaults to 0 = zero-length loop. Fix: calculate and set `loop_end = data.size() / bytes_per_sample` explicitly.

**Headless validation:** Clean parse, no errors.

### Session 17 (2026-02-19) — Scene Embedding + Audio Fix

**Embedded all rocket boots nodes into .tscn files for editor inspectability. Fixed thrust sound WAV import.**

**Player.tscn — new embedded nodes:**
- FlameSprite (AnimatedSprite2D): 4-frame burn animation from `rocket_flame_4.png` strip, 15fps, visible=false, position=(0,16)
- ThrustSound (AudioStreamPlayer): user-provided `rocket_thrust.wav`, volume=-6dB, bus=SFX

**HUD.tscn — full hierarchy embedded (was bare CanvasLayer):**
- HUDRoot (Control, full_rect) > Heart0/1/2 (TextureRect, 8x8) + DashIcon (TextureRect) + ItemFrame (TextureRect, modulate.a=0.2) > FuelBar (ColorRect, visible=false) + ItemIcon (TextureRect, visible=false)

**Player.gd:**
- `_flame_sprite` and `_thrust_sound` changed from `var = null` to `@onready = $FlameSprite` / `$ThrustSound`
- Removed `_setup_rocket_effects()` entirely (no more programmatic node creation or runtime WAV loop hacking)

**HUD.gd:**
- All node vars changed to `@onready` refs from HUD.tscn
- Removed `_build_hud()` method entirely (was 50+ lines of programmatic node creation)
- `_ready()` now just populates `_hearts` array and connects signals

**Audio WAV import fix:**
- User-provided `rocket_thrustv2.wav` was 24-bit PCM — Godot only supports 8/16-bit. Converted to 16-bit via Python.
- WAV had 100ms silent intro causing delayed playback. Trimmed 4190 frames with 5ms fade-in.
- Full import cache clear procedure documented: delete `.sample` + `.md5` + `uid_cache.bin` + `.import`, run `--headless --editor --quit`
- UID mismatch resolved (reimport assigns new UID, must sync Player.tscn ext_resource)
- Loop mode set via `.import` file `edit/loop_mode=1` (Godot-native, no runtime hack)

**Headless validation:** Clean parse, no errors.

### Session 18 (2026-02-19) — Architecture Refactor (Industry Standard)

**Full architectural refactor: node-based state machine, equipment sprite layering, GameData autoload, debug overlay.**

**Refactor 1 — State Machine Split (Player.gd 553→~280 lines):**

New files (10):
- `scripts/player/states/StateMachine.gd` — class_name StateMachine, manages state dictionary, transitions, animation triggers
- `scripts/player/states/PlayerState.gd` — class_name PlayerState base class (enter/exit/physics_update/handle_input)
- `scripts/player/states/IdleState.gd` — gravity + horizontal movement + transitions to Run/Jump/WallSlide/Fall
- `scripts/player/states/RunState.gd` — same as Idle but transitions to Idle when stopped
- `scripts/player/states/JumpState.gd` — rocket thrust or gravity, air movement, transitions to Fall/WallSlide
- `scripts/player/states/FallState.gd` — fast fall, rocket thrust, coyote jump, landing detection
- `scripts/player/states/DashState.gd` — dash velocity, transitions on timer/wall
- `scripts/player/states/WallSlideState.gd` — half gravity slide, wall jump with direction lock
- `scripts/player/states/HurtState.gd` — fall gravity + deceleration, transitions on invuln timer
- `scripts/player/states/DeadState.gd` — zeroes velocity on enter

Modified:
- `Player.gd` — added `class_name Player`, removed enum State + 7 state handlers + change_state + _play_state_animation. Renamed helpers to public (get_effective_gravity, apply_horizontal_movement). Added state_machine ref + play_animation(). Added `add_to_group("player")`.
- `Player.tscn` — added StateMachine node with 8 state child nodes (Idle/Run/Jump/Fall/Dash/WallSlide/Hurt/Dead)

Architecture: Player._physics_process calls `state_machine.update(delta, move_input)` explicitly (not StateMachine._physics_process) to preserve timer→rocket_boots→state→sprite execution order.

**Refactor 2 — Equipment Sprite Layering:**
- Added EquipmentSprite (AnimatedSprite2D) to Player.tscn, sibling to Sprite2D
- Equipment pickup builds separate SpriteFrames for EquipmentSprite, hides base Sprite2D
- play_animation(), flip_h, squash/stretch all sync both sprites
- Sets up node structure for future true overlay layering

**Refactor 3 — GameData Autoload:**
- `scripts/core/GameData.gd` — replaces static vars on GameScene (selected_level_id, selected_level_scene)
- GameScene.gd and LevelSelectScene.gd updated to use GameData.selected_*

**Refactor 4 — Debug Overlay:**
- `scripts/debug/DebugOverlay.gd` — CanvasLayer (layer 99), toggled with F3
- Shows: state name, velocity, position, FPS, fuel
- Reads player via `get_tree().get_first_node_in_group("player")`

**project.godot:**
- Added autoloads: GameData (after EventBus), DebugOverlay (after DragonFlyby)
- Added input action: debug_toggle (F3)

**Warning fixes (post-refactor):**
- `PlayerState.gd` — prefixed unused base class params with underscore (`_delta`, `_move_input`, `_event`)
- `HUD.gd` — removed unused `_hud_root` variable
- `GameScene.gd` — renamed `var Player`/`var HUD` to `PlayerScene`/`HudScene` (shadowed `class_name Player`)

**Bug fix — jump broken after refactor:**
- **Root cause:** `start_jump()` sets `velocity_y = -230` but IdleState/RunState return early without calling `apply_movement()`. `move_and_slide()` never runs that frame, so `is_on_floor()` returns stale `true` next frame. Player._physics_process resets `velocity_y = 0.0` — killing the jump before it starts.
- **Fix:** Added `apply_movement()` at the end of `start_jump()` so `move_and_slide()` runs immediately with jump velocity.
- WallSlideState already handled this correctly (called `apply_movement()` before returning from wall jump).

**Headless validation:** Clean parse, no errors.

### Session 19 (2026-02-19) — Per-Level Music

**Added per-level music support. Level 1 now plays its own track.**

**AudioManager.gd:**
- Added `"level_1": "level1_bgm.mp3"` to music tracks dictionary
- Added `has_music(key)` public helper for key existence checks

**GameScene.gd:**
- Music key now resolves per-level: uses `GameData.selected_level_id` if AudioManager has a matching track, otherwise falls back to `"game"`

**Assets added:**
- `assets/audio/music/level1_bgm.mp3` — Level 1 background music (loop=true in .import)

**Headless validation:** Clean parse, no errors.

### Session 23 (2026-02-19) — Permanent Dissolve Shader Fix

**Fixed respawn flicker by making dissolve shader permanent — no more material add/remove lifecycle.**

**Root cause:** `materialize()` called `apply_dissolve_shader()` which set `dissolve_amount=0.0` (fully visible) before immediately setting it to `1.0`. The GPU could pick up the intermediate `0.0` value, causing a one-frame flash. Additionally, the shader had edge glow at `dissolve_amount=0.0` (bottom pixels got cyan tint), so removing the shader at end of materialize caused another flash.

**Fix approach:** Same pattern as the Camera2D fix — use the built-in module permanently instead of managing its lifecycle.

**player_dissolve.gdshader:**
- Added `edge *= step(0.001, dissolve_amount)` — kills edge glow when fully materialized, making shader a true passthrough at 0.0

**Player.gd:**
- Shader applied once in `_ready()` and never removed — `dissolve_amount=0.0` is now a no-op passthrough
- Removed `apply_dissolve_shader()`, `remove_dissolve_shader()` methods entirely
- `prepare_dissolved()` simplified to one line: set dissolve_amount=1.0
- `dissolve()` simplified: just tweens parameter 0→1 (no material assignment)
- `materialize()` simplified: sets parameter to 1.0, tweens 1→0, sets `_is_dissolving=false` (no material removal)

**GameScene.gd:**
- `_initial_spawn()` uses `prepare_dissolved()` instead of `apply_dissolve_shader()` + manual parameter set
- `_respawn_sequence()` no longer calls `remove_dissolve_shader()` after dissolve phase
- Removed all `[RESPAWN]` debug prints (investigation complete)

**IdleState.gd:**
- Removed debug frame logging (`_debug_frames_since_enter`, enter/frame prints)

**Headless validation:** Clean parse, no errors.

### Session 22 (2026-02-19) — Respawn Flicker Investigation

**Investigated respawn flicker bug. Fixed 3 sub-bugs, flicker persists.**

**New methods in Player.gd:**
- `prepare_dissolved()` — applies dissolve shader at dissolve_amount=1.0 (fully invisible). Called before visible=true to prevent flash.
- `prime_collision()` — directly re-enables CollisionShape2D (bypasses set_deferred delay), runs move_and_slide() with tiny downward velocity to prime is_on_floor(), syncs _was_on_floor to prevent false landing squash/stretch.

**GameScene.gd — respawn Phase 4 fix:**
- Before making player visible, calls `prepare_dissolved()` via `.call()` so dissolve shader hides the sprite
- After materialize, calls `prime_collision()` via `.call()` before transitioning to Idle

**Sub-bug 1 fixed — shader gap:** Player was visible=true for 0.1s with NO dissolve shader before materialize(). prepare_dissolved() closes this gap.

**Sub-bug 2 fixed — stale is_on_floor:** SpawnState disabled collision, move_and_slide never ran at spawn pos. IdleState detected "not on floor" → Fall for 1 frame → back to Idle. prime_collision() primes floor detection.

**Sub-bug 3 fixed — false landing squash:** reset_for_respawn set _was_on_floor=false, first physics frame triggered _on_land() squash animation. prime_collision() syncs _was_on_floor.

**All 3 fixes confirmed via debug logs — no stale floor, no Fall transition, correct shader state. Flicker still persists.**

**GDScript compilation order gotcha (expanded):**
- Calling Player methods with CHANGED signatures on CharacterBody2D-typed var triggers "Identifier not found: GameData" compile error
- `.call("method_name")` bypasses compile-time resolution (safe pattern for new methods)
- Headless `--quit` check passes but editor fails — use `--headless --editor --quit` for accurate validation

**Debug prints in place:** [RESPAWN], [PLAYER], [MAT], [PRIME], [IDLE] — see memory/respawn-flicker.md

**Headless validation:** Clean parse, no errors.

### Session 21 (2026-02-19) — Kill Plane + Respawn Refactor

**Added kill plane (fall-off-map death) and refactored respawn to await-based flow.**

**GameScene.gd — kill plane:**
- Player dies when `global_position.y > _level_bounds.end.y` (same boundary as camera clamp)
- Guarded by `_respawning`, `_respawn_immunity` (0.5s post-respawn grace), and player state check (skips Dead/Spawn)

**GameScene.gd — respawn refactored from nested callbacks to flat await chain:**
- Old: 5-level deep nested lambda callbacks (particle `on_complete` closure never fired for kill-plane deaths)
- New: flat `await tween.finished` / `await timer.timeout` sequence — dissolve → pause → particles+camera pan → reposition → materialize → Idle
- Camera pan uses `EASE_IN_OUT` + `TRANS_SINE` for smooth movement to spawn
- `_spawn_soul_particles` callback parameter now optional (fire-and-forget from respawn)

**GDScript gotchas discovered:**
- `:=` fails with methods on `CharacterBody2D`-typed vars that return engine types (Tween) — use untyped `var` or explicit annotation
- `class_name Player` as type annotation on vars causes autoload resolution failure ("Identifier not found: GameData") — keep as `CharacterBody2D`

**Known bug:** Image flicker artifacts during respawn materialize — deferred to next session.

**Headless validation:** Clean parse, no errors.

### Session 20 (2026-02-19) — New Level + Death Dissolve / Particle Respawn System

**Replaced Level 1 with testlevelv2.ldtk. Added full death dissolve + soul particle flight + materialize respawn system.**

**Level change:**
- Level1.tscn now references `testlevelv2.ldtk` (was `testlevel.ldtk`)
- Fixed LDtk import settings: `integer_grid_tilesets=true`, `tileset_post_import` set to collision script
- Fixed tileset path in LDtk file (was pointing to LDtk install dir, now project-relative)
- SpawnPoint at (78, 372), RocketBootsPickup at (189, 372)

**New files:**
- `shaders/player_dissolve.gdshader` — noise-based dissolve shader with edge glow (value noise, direction bias, smoothstep edge)
- `scripts/player/states/SpawnState.gd` — freeze state during materialize (disables collision, zero velocity)

**Scripts modified:**
- `Player.gd` — added dissolve/materialize/reset_for_respawn methods, dissolve shader preload, collision toggle, input guard for Dead/Spawn states
- `GameScene.gd` — replaced `reload_current_scene()` with in-place respawn sequence: dissolve (0.5s) → particle flight (0.8s) → materialize (0.4s). Initial spawn uses materialize effect. Camera follow disabled during flight. Pause blocked during respawn.
- `StateMachine.gd` — added "Spawn" to animation map
- `Constants.gd` — added DISSOLVE_DURATION, PARTICLE_FLIGHT_DURATION, MATERIALIZE_DURATION, SPAWN_MATERIALIZE_DURATION, SOUL_PARTICLE_COUNT
- `EventBus.gd` — added `player_respawned` signal
- `Player.tscn` — added Spawn state node under StateMachine

**Death → respawn flow (total ~1.9s):**
1. Player dies → dissolve shader evaporates character (0.5s, bottom-up with noise)
2. 9 soul particles fly from death position to spawn via bezier curves (0.8s, staggered launch)
3. Player materializes at spawn point (0.4s, reverse dissolve)
4. Idle state restored, health/fuel/timers reset

**Initial spawn:** Player starts fully dissolved, materializes after 0.15s delay (layered on top of scene fade-from-black)

**Headless validation:** Clean parse, no errors.

### Session 24 (2026-02-20) — Parallel Workflow Infrastructure + Worktree Test

**Set up multi-session parallel workflow for running multiple Claude Code instances simultaneously.**

**New file:**
- `.claude/rules/parallel-workflow.md` — auto-loaded rules for parallel sessions: naming conventions (`feature-*`, `fix-*`, `level-*`, etc.), file conflict zone map (HIGH/MEDIUM/LOW risk), session lifecycle (start/work/merge/cleanup), context efficiency tips, Godot validation in worktrees

**Modified files:**
- `.claude/settings.local.json` — expanded bash permissions from 3 to 19 allowed commands (git operations, python scripts, butler, broadened Godot headless path matching)
- `docs/status.md` — added "Current Workstreams" coordination table for cross-session visibility
- `.claude/rules/session-protocol.md` — added workstream tracking to session start (steps 3-4) and session end (mark DONE/PAUSED)
- `.gitignore` — added `.claude/worktrees/` to prevent worktree contents from showing as untracked

**Worktree test:**
- Updated Claude Code from 2.1.45 to 2.1.49 (required for `-w` flag)
- Created two test worktrees: `bug-fix` and `feature-pause-menu`
- Both started cleanly on their own branches (`worktree-bug-fix`, `worktree-feature-pause-menu`)
- Neither agent made any changes (no tasks given — test run only)
- Cleaned up: force-removed both worktrees + deleted orphan branches
- **Result:** Worktree infrastructure works. Agents start fresh CLI sessions in isolated copies. Ready for real parallel work.

**Respawn flicker bug:** Bug-fix worktree agent did not attempt a fix (no changes made). Bug remains open — still needs F5 verification.

**Headless validation:** Not run this session (no game code changes).

### Session 25 (2026-02-20) — Pause Menu Fix + Wall Jump + Dash Polish

**Fixed pause menu blur/buttons, boosted wall jump, added dash SFX + dust particles.**

**Pause menu fix:**
- Root cause: PauseScene was instantiated inside SubViewport (426x240), causing blurry text and broken mouse input
- Fix: `add_child(_pause_overlay)` on GameScene root instead of `game_viewport.add_child()`
- PauseScene.tscn VBox scaled from 140x100 to 400x280 for 1280x720 resolution
- Font sizes scaled: title 28→48, buttons 14→24, button min size 120x28→300x50

**Wall jump velocity increase:**
- New `WALL_JUMP_H_FORCE = 160.0` constant (was `RUN_SPEED * 0.8 = 96`)
- 67% increase in horizontal launch speed off walls

**Dash swoosh sound:**
- Added `generate_dash_swoosh()` to `generate_ui_sounds.py` — 120ms bandpass noise sweep (800→3000 Hz)
- DashSound AudioStreamPlayer node added to Player.tscn (-3dB, SFX bus)
- Plays on dash activation via `try_start_dash()`

**Dash dust particles:**
- 5 small 2x2 pixel dots spawn behind player's feet on dash
- Drift opposite to dash direction with random spread, fade out over 0.2-0.35s
- Scripted Sprite2D nodes with tween-based animation (same pattern as soul particles)

**Rocket thrust WAV fix:**
- User re-added custom WAV (24-bit stereo) — converted to 16-bit mono PCM via Python
- Cleared import cache, set loop_mode=1, synced UID in Player.tscn
- Added `--all` guard to `generate_ui_sounds.py` to prevent future overwrites of user-provided assets

**Headless validation:** Clean parse, no errors.

### Session 26 (2026-02-20) — Dash Dust Fix + Wall Slide Overhaul

**Fixed dash dust particles and overhauled wall slide mechanics (3 bugs + 1 enhancement).**

**Dash dust fix (Player.gd):**
- `z_index = -1` removed — was rendering dots behind tile layer, making them invisible
- Foot offset `y: 2.0 → 8.0` — was spawning dots 7px above actual feet (capsule bottom at y≈9)
- Dots enlarged 2x2→3x3 and brightened (modulate 0.8α gray → 1.0α light gray)

**Wall slide — random detach fix (WallSlideState.gd):**
- Root cause: `velocity_x = 0.0` meant no horizontal force into wall, `is_on_wall()` would intermittently fail
- Fix: Added `WALL_STICK_FORCE = 10.0` — pushes gently into wall (`-wall_normal.x * 10`) every frame

**Wall slide — dash blocked (Player.gd):**
- `try_start_dash()` now checks `not in ["Dash", "WallSlide"]` (was only blocking Dash state)

**Wall slide — opposite direction detach (WallSlideState.gd):**
- When `move_input` direction matches `wall_normal` (pressing away from wall), player gets 0.5× run speed kick and transitions to Fall

**Wall slide — rocket momentum dampen (WallSlideState.gd):**
- `enter()`: upward velocity cut by 30% (`*= 0.7`) on wall contact
- `physics_update`: full gravity (680) applied while rising, half gravity (340) while sliding down
- Effect: rocket thrust into wall gives brief upward drift then quickly settles into normal slide

**Headless validation:** Clean parse, no errors.

### Session 27 (2026-02-20) — Dialog System Restructure

**Restructured cinematic dialog system for scalability — data-driven .tres resources, filesystem-based organization, trigger zones, and persistence.**

**New files (5):**
- `scripts/data/DialogSequence.gd` — Resource class: `description`, `one_shot`, `lines: Array[DialogLine]`
- `scripts/data/DialogDefs.gd` — Static loader: maps dialog IDs to `.tres` file paths (`"level_1/spawn"` → `res://assets/dialogs/level_1/spawn.tres`), provides `get_lines()`, `has_dialog()`, `is_one_shot()`
- `scripts/dialog/DialogTrigger.gd` — `@tool` Area2D trigger zone: `@export dialog_id`, reads `one_shot` from `.tres`, persists seen state via ProgressData
- `scenes/dialog/DialogTrigger.tscn` — Area2D + 32x32 RectangleShape2D (resizable in editor)
- `assets/dialogs/level_1/spawn.tres` — Level 1 spawn dialog (4 Dutch lines, one_shot=true)

**Modified files (5):**
- `scripts/scenes/CinematicDialog.gd` — Added `load_dialog(dialog_id)` method, emits dialog_id with EventBus signals
- `scenes/ui/CinematicDialog.tscn` — Stripped embedded dialog data (now pure UI shell)
- `scripts/scenes/GameScene.gd` — `_start_cinematic_dialog(dialog_id)` takes ID, `_should_play_dialog()` / `_mark_dialog_played()` helpers, `_on_dialog_requested()` handler for trigger zones
- `scripts/core/EventBus.gd` — Added `dialog_requested(dialog_id)`, updated `cinematic_dialog_started/ended` with dialog_id parameter
- `scripts/data/ProgressData.gd` — Added `seen_dialogs` array, `is_dialog_seen()`, `mark_dialog_seen()`, persisted in `[dialogs]` section of progress.cfg

**Architecture:**
- Dialog content lives in `.tres` files under `assets/dialogs/{level_id}/{moment}.tres`
- Each `.tres` is a DialogSequence resource editable in Godot's Inspector (description, one_shot toggle, lines array)
- DialogDefs resolves IDs to paths: `"level_1/spawn"` → `res://assets/dialogs/level_1/spawn.tres`
- DialogTrigger Area2D nodes placed in levels auto-trigger dialogs when player enters
- `one_shot` controlled per-dialog in the .tres file, persisted across sessions via ProgressData

**Adding a new dialog (zero code needed):**
1. Create `.tres` file in `assets/dialogs/{level_id}/` (type DialogSequence)
2. Set description, one_shot, edit lines in Inspector
3. Place DialogTrigger.tscn in level, set dialog_id (e.g. `"level_1/boss_intro"`)

**Headless validation:** Clean parse, no errors.

### Session 28 (2026-02-20) — Full Directory Restructure

**Reorganized entire godot_port/ directory so related files live together instead of scattered across scripts/, scenes/, assets/.**

**New top-level structure:**
```
godot_port/
├── core/           # 9 autoload + infrastructure scripts (was scripts/core/ + scripts/audio/ + scripts/debug/)
├── data/           # Static definitions & persistence (was scripts/data/)
├── player/         # Player scene + script + states/ + sprites/ (was scripts/player/ + scenes/player/ + assets/sprites/Owlet_*)
├── levels/         # Per-level folders, each self-contained (was scenes/levels/ + assets/dialogs/ + assets/audio/music/level*_bgm)
│   ├── shared/     # Tileset, post-import script, environment sprites
│   └── level_1/    # Level1.tscn + .ldtk + dialogs/ + level1_bgm.mp3
├── game/           # Game orchestrator scene + script (was scenes/game/ + scripts/scenes/GameScene)
├── ui/             # All UI: boot/, menus/, hud/, dialog/, pause/ (was scenes/{Boot,menu,ui,dialog}/ + scripts/scenes/)
├── items/          # Pickup scene + script + sprites/ (was scenes/items/ + scripts/items/ + assets/sprites/items/)
├── tools/          # Python utilities (was scripts/tools/)
├── assets/         # Shared-only media: audio/music/, audio/sfx/, sprites/ui/, sprites/karim/
├── shaders/        # 4 shaders (unchanged)
├── addons/         # LDtk importer (unchanged)
└── build/          # Export output (unchanged)
```

**Key moves:**
- Scripts co-located with their scenes (e.g. `game/GameScene.gd` + `game/GameScene.tscn`)
- Player sprites moved into `player/sprites/` (alongside Player.tscn)
- Level-specific assets (dialog .tres, music .mp3, LDtk files) moved into `levels/level_1/`
- Shared tileset + post-import script moved to `levels/shared/`
- Item sprites moved into `items/sprites/`
- `assets/` now only holds truly shared media (menu music, SFX, UI sprites, Karim)

**Reference updates (all verified via headless parse check):**
- 13 .tscn files: updated ext_resource script/asset paths
- ~15 GDScript files: updated preload/load res:// paths
- project.godot: updated all 7 autoload paths + main_scene
- ~25 .import sidecar files: updated source_file paths
- 2 .ldtk JSON files: updated tileset relPath to `../shared/Cavernas_by_Adam_Saltsman.png`
- spawn.tres: updated script references to new data/ paths
- AudioManager.gd: changed from directory-prefix to full paths per track
- DialogDefs.gd: updated path resolution for `levels/{level_id}/dialogs/{moment}.tres`

**Errors encountered and resolved:**
- `git mv` failed (godot_port/ untracked) — used regular `mv`
- First headless check failed (stale class cache) — deleted entire `.godot/`, ran `--headless --editor --quit` to rebuild
- Missed spawn.tres references — caught with grep sweep
- Editor "Error while saving" on F5 — stale `open_scenes`/`open_scripts` paths in `editor_layout.cfg` and `script_editor_cache.cfg`. Updated to new paths.
- 5x "invalid UID" warnings — stale `uid://` in .tscn ext_resources for moved scripts (MenuScene, Player, CinematicDialog, OptionsScene, ExtrasScene). Stripped UIDs; Godot regenerates on next save.

**Headless validation:** Clean parse, zero errors.
**F5 runtime test:** Working — game boots, menu loads, level plays, dialog triggers.

### Session 30 (2026-02-20) — Progression Gates + Dialog Fixes

**Added progression gate system and fixed multiple cinematic dialog issues.**

**New files (4):**
- `godot_port/gates/ProgressionTrigger.gd` — @tool Area2D, `@export gate_id`, one-shot per session, emits `EventBus.gate_opened`
- `godot_port/gates/ProgressionTrigger.tscn` — Area2D + CollisionShape2D (32x32 RectangleShape2D)
- `godot_port/gates/ProgressionGate.gd` — @tool StaticBody2D, `@export gate_id`, `@export gate_color`, draws colored rect via `_draw()`, fades out + disables collision on signal
- `godot_port/gates/ProgressionGate.tscn` — StaticBody2D + CollisionShape2D (8x32 RectangleShape2D)

**Modified files (6):**
- `core/EventBus.gd` — added `signal gate_opened(gate_id: String)`
- `levels/level_1/Level1.tscn` — added WallhopGateTrigger (pos 188,30) + WallhopGate (pos 220,368, scale 0.9x1.55), both gate_id="wallhop_gate"
- `game/GameScene.gd` — cinematic dialog no longer transitions player to Spawn state (was killing velocity), let pause preserve velocity naturally
- `core/Constants.gd` — DIALOG_SLOWMO_RAMP_DURATION 0.8 → 0.3 (user felt it was too slow)
- `ui/dialog/CinematicDialog.tscn` — portrait expand_mode=1 (IGNORE_SIZE) for proper sizing in layout
- `ui/dialog/CinematicDialog.gd` — added portrait_placeholder @onready ref, toggle visibility in _show_line() (was overlaying gray on portrait)

**Gate approach evolution:**
1. Sprite2D with tileset texture — fractional values didn't fit 8px grid
2. Tile erasing from TileMapLayers — AutoLayer not findable by name, autotile seams don't recalculate at runtime
3. Self-contained colored block (CURRENT) — `_draw()` colored rect, passage open in LDtk, gate provides blocking + visual

**Dialog velocity fix:** Removed Spawn state transition during cinematic — SpawnState.enter() zeros velocity and disables collision. Let `get_tree().paused` preserve velocity naturally.

**Headless validation:** Clean parse, no errors.

### Session 31 (2026-02-20) — Item Pickup Interaction + Acquisition Popup

**Changed item pickup from auto-collect to E-key interaction. Added shader-animated acquisition popup.**

**Modified files (3):**
- `items/Pickup.gd` — rewritten: body_entered/exited for proximity tracking, `_unhandled_input` for interact key, `_draw()` floating "E" keycap prompt (pulsing border, bobs), ambient sparkle particles (2x2 dots drifting upward), glow pulse on proximity
- `game/GameScene.gd` — preloads ItemAcquiredPopup, connects `item_picked_up` signal, instantiates popup with item name/icon, handles overlapping pickups
- `core/Constants.gd` — version bumped to 0.2.4

**New files (3):**
- `shaders/item_acquired.gdshader` — animated glowing border: 3-frequency energy flow around perimeter, corner accent glow, grid-based sparkles, outer glow halo, inner light bleed, entrance flash via `appear_progress` uniform
- `ui/popup/ItemAcquiredPopup.gd` — CanvasLayer (layer 12, 1280x720): builds UI in code (shader ColorRect + MarginContainer + HBox with icon + VBox with subtitle/name labels), bounce entrance (TRANS_BACK overshoot), content delayed fade-in, 16-particle entrance burst, ambient border particles, name shimmer effect, auto-dismiss after 3s with fade-out, rocket boots help text below box
- `ui/popup/ItemAcquiredPopup.tscn` — minimal scene (CanvasLayer + script ref)

**Version bump:**
- `Constants.gd` APP_VERSION: 0.2.3 → 0.2.4
- `version.json`: 0.2.3 → 0.2.4
- Exported and pushed to itch.io via butler

**Headless validation:** Clean parse, no errors.

### Session 32 (2026-02-21) — Scene-First Construction Audit & Fix

**Full project sweep for scene-first construction compliance. Found and fixed 6 categories of violations.**

**New files (2):**
- `core/DebugOverlay.tscn` — CanvasLayer scene (was entirely programmatic in .gd)
- `ui/menus/NightSkyTheme.tres` — shared Godot Theme resource with 14 StyleBoxFlat sub_resources (Button 5 states, TabContainer 4 states, HSlider 3 styles, CheckButton, Label)

**Modified files (16):**
- `core/DebugOverlay.gd` — stripped .new() calls, now uses @onready %Panel/%Label refs
- `project.godot` — DebugOverlay autoload changed from .gd to .tscn
- `ui/menus/MenuScene.tscn` — added VersionLabel, UpdateLabel nodes, NightSkyTheme, title overrides
- `ui/menus/MenuScene.gd` — removed Label.new() for version/update, removed _style_buttons()/_make_style()
- `player/Player.tscn` — added ShaderMaterial sub_resource for dissolve (was runtime .new())
- `player/Player.gd` — removed ShaderMaterial.new(), uses sprite.material from .tscn
- `ui/menus/LevelSelectScene.tscn` — added StyleBoxFlat sub_resource on InfoPanel, NightSkyTheme
- `ui/menus/LevelSelectScene.gd` — removed StyleBoxFlat.new() from _apply_theme()
- `ui/menus/ExtrasScene.tscn` — added GalleryPlaceholder Label node, NightSkyTheme
- `ui/menus/ExtrasScene.gd` — toggle existing node visibility instead of Label.new()
- `ui/menus/OptionsScene.tscn` — added NightSkyTheme
- `ui/menus/OptionsScene.gd` — simplified _apply_theme() to button focus only
- `ui/pause/PauseScene.tscn` — added NightSkyTheme on VBoxContainer (CanvasLayer root can't hold theme)
- `ui/pause/PauseScene.gd` — removed _apply_theme() and SubMenuTheme.style_button() calls
- `ui/menus/SubMenuTheme.gd` — removed ~140 lines of style_* functions (style_title, style_button, _make_btn_style, style_tab_container, style_slider, style_check_button, style_labels_recursive). Kept: create_particles(), connect_button_focus(), play_entrance()

**Acceptable exceptions confirmed (NOT violations):**
- GPUParticles2D (runtime-only per project rule)
- Data-driven loops (achievements, items, animation frames)
- Dynamic font_color for state-dependent values
- ItemAcquiredPopup procedural loops (light rays, trail dots)

**Gotcha discovered:** `unique_name_in_owner = true` in .tscn must be on its own line below `[node]` tag — placing it inside the tag brackets causes "Node not found" errors.

**Headless validation:** Clean parse, no errors.

### Session 33 (2026-02-21) — Music Ducking + Dialog Talk SFX

**Added music volume attenuation during dramatic moments and Animal Crossing-style per-character voice blips for dialog.**

**Feature 1 — Music Ducking:**
- `AudioManager.gd` — added `duck_music(target_db, duration)` and `unduck_music(duration)` methods with dedicated tween
- `GameScene.gd` — ducks to -18 dB during cinematic dialog zoom-in, -14 dB on player death (stays ducked through Game Over), gradual unduck over full respawn duration (1.45s) so music reaches full volume exactly when player materializes. Quit-to-menu also unducks.
- `Constants.gd` — `MUSIC_DUCK_CINEMATIC_DB`, `MUSIC_DUCK_RESPAWN_DB` constants

**Feature 2 — Dialog Talk SFX:**
- `generate_ui_sounds.py` — new `generate_dialog_talk()`: 60ms voiced syllable using pulse wave glottal source, two-formant vowel shaping (F1=600 Hz, F2=1200 Hz), consonant noise burst attack, mouth-shaped envelope
- `CinematicDialog.tscn` — added TalkSound AudioStreamPlayer node (UI bus, -6 dB)
- `CinematicDialog.gd` — plays talk blip per new visible character with random pitch spread, skips spaces/punctuation
- `DialogLine.gd` — added `@export_range(0.4, 2.0) voice_pitch` for per-line pitch control (Inspector slider). Each character in a dialog can have a distinct voice identity.
- Pitch system: `voice_pitch` is the center, random spread of 0.3 applied on top. 0.5 = deep/gruff, 1.0 = default, 1.8 = squeaky.

**Bug fix:**
- `generate_ui_sounds.py` OUTPUT_DIR was stale after Session 28 restructure — went up two levels instead of one, writing WAVs outside godot_port/. Fixed to single parent traversal.

**Headless validation:** Clean parse, no errors.

### Session 34 (2026-02-21) — Portal System

**Added level portal system with swirl/vortex shader and cinematic activation.**

**New files (3):**
- `shaders/portal.gdshader` — procedural oval vortex: polar-coordinate swirl, 3-octave FBM noise, energy bands, bright edge glow, activation_progress uniform for cinematic intensification
- `portals/Portal.tscn` — scene-first Area2D: CollisionShape2D (CapsuleShape2D), PortalVisual (ColorRect + ShaderMaterial), EdgeGlow (ColorRect)
- `portals/Portal.gd` — @tool script: E-key interaction (Pickup.gd pattern), ambient outward particle wisps, edge glow pulse, full cinematic activation (player pull-in → shader ramp → music duck → inward particle burst → dissolve → flash → scene transition)

**Inspector-configurable @export properties:**
- `destination_level_id` — target level ID (e.g. "level_2")
- `portal_color` — tint swirl/glow per instance (live editor preview via setter)
- `portal_scale` — size multiplier (updates visual rects + collision)

**Modified files (4):**
- `core/EventBus.gd` — added `portal_entered(destination_level_id)` signal
- `game/GameScene.gd` — added `_in_portal` flag, connected portal_entered signal, guards on pause + kill-plane
- `core/Constants.gd` — added 6 portal timing constants (pull/activation/dissolve/flash durations, music duck dB)
- `levels/level_1/Level1.tscn` — added ExitPortal instance at (100, 370), destination_level_id="level_2"

**Activation cinematic sequence:**
1. Validate destination via LevelDefs → freeze player (Spawn state)
2. Tween player toward portal center (0.6s)
3. Ramp shader activation_progress to 1.0 (swirl intensifies, core brightens)
4. Duck music to -18 dB
5. 16 inward-spiraling particle dots
6. Player dissolve (0.35s, reuses existing dissolve system)
7. Edge glow flash → SceneTransition to destination GameScene

**Headless validation:** Clean parse, no errors.

### Session 35 (2026-02-21) — Level 2 Setup + Portal Link + Music Continuity

**Connected Level 1 portal to Level 2. Fixed music restart and volume issues across portal transitions.**

**New files (1):**
- `levels/level_2/Level2.tscn` — Node2D scene: instances testlevel2.ldtk tilemap + SpawnPoint Marker2D at (40, 450)

**Modified files (4):**
- `data/LevelDefs.gd` — set level_2 scene path to `"res://levels/level_2/Level2.tscn"` (was empty string)
- `levels/level_2/testlevel2.ldtk` — fixed tileset relPath from LDtk install directory to `../shared/Cavernas_by_Adam_Saltsman.png`
- `levels/level_2/testlevel2.ldtk.import` — enabled `integer_grid_tilesets=true`, set `tileset_post_import` to shared collision script (matching Level 1)
- `core/AudioManager.gd` — three changes:
  1. `"game"` fallback key now points to `level1_bgm.mp3` (was `game_bgm.mp3`)
  2. `play_music()` compares actual stream resource (not just key) to prevent restart when same file plays under different keys
  3. Same-stream path calls `unduck_music()` to restore volume after portal duck

**Deleted files (1):**
- `assets/audio/music/game_bgm.mp3` — old generic soundtrack removed (user request)

**Portal flow verified (headless):**
Level 1 ExitPortal (destination_level_id="level_2") → LevelDefs validates scene path → Portal cinematic → SceneTransition → GameScene loads Level2.tscn → SpawnPoint found → player spawns at (40, 450)

**Music continuity:** Same stream (`level1_bgm.mp3`) continues seamlessly through portal transition. Volume restores from portal duck (-18dB) via `unduck_music()` on the same-stream code path.

**Headless validation:** Clean parse, no errors.

### Session 36 (2026-02-21) — Town Environment (7 Phases)

**Built complete Town test environment with NPC interaction, buildings, shop, quest system, and dialog choices.**

**Phase 1 — Town Level Scene + Level Registration:**
- `levels/level_town/TownLevel.tscn` — flat-ground Node2D town with sky, grass, two house exteriors (warm brown + cool purple), SpawnPoint, BoundsMin/Max Marker2D pairs
- `data/LevelDefs.gd` — added `level_town` entry (always unlocked, star_pos on constellation map)
- `game/GameScene.gd` — added Marker2D-based camera bounds fallback (for levels without TileMapLayer)
- `core/AudioManager.gd` — added `"level_town"` music key (reuses menu_bgm)

**Phase 2 — NPC Base System:**
- `npcs/NPC.tscn` — Area2D scene: pre-downscaled Karim sprite (karim_npc.png), CircleShape2D collision, show_behind_parent for correct draw order
- `npcs/NPC.gd` — @tool base script: E-key interaction (same pattern as Pickup/Portal), floating "E" keycap prompt, face-player on interact, `_get_active_dialog_id()` virtual for subclass override, dialog_requested emission, interact cooldown

**Phase 3 — Door System + Interior Scene Swap:**
- `npcs/Door.tscn` + `npcs/Door.gd` — Area2D E-key door, emits `EventBus.door_entered(destination, is_exit)`
- `core/EventBus.gd` — added `door_entered` signal
- `core/GameData.gd` — added `town_player_position` for exit-door position restoration
- `core/SceneTransition.gd` — added awaitable `fade_to_black()` method
- `game/GameScene.gd` — door handler: fade → remove level children → load destination → reposition player → update camera → fade back. Player/camera/HUD persist.
- `levels/level_town/interiors/House1Interior.tscn` — warm tan room with floor collision, SpawnPoint, ExitDoor
- `levels/level_town/interiors/House2Interior.tscn` — cool purple room, same structure

**Phase 4 — Quest State System:**
- `data/ProgressData.gd` — added `quest_states` Dictionary with `get_quest()`/`set_quest()`/`reset_all_progress()`, saved in `[quests]` section of progress.cfg
- `core/EventBus.gd` — added `quest_state_changed` signal
- `core/DebugOverlay.gd` — F4 resets all progress (flash confirmation)
- `project.godot` — added `debug_reset` input action (F4)
- `npcs/NPC.gd` — added one_shot dialog check in `_interact()` (was missing, DialogTrigger had it but NPC didn't)

**Phase 5 — Dialog Choice Panel:**
- `ui/dialog/ChoicePanel.tscn` + `ui/dialog/ChoicePanel.gd` — CanvasLayer (layer 16, PROCESS_MODE_ALWAYS): dark indigo panel, 2-4 buttons, pauses game, emits `choice_made(index)`, setup() before add_child pattern

**Phase 6 — Individual NPC Scripts + Dialog Resources:**
- `npcs/WanderingNPC.gd` — extends NPC.gd: random wander (40% idle/30% left/30% right), bounded by wander_min_x/wander_max_x exports, 20 px/s
- `npcs/BlueKarimNPC.gd` — shopkeeper: greeting dialog → ShopPanel
- `npcs/GreenKarimNPC.gd` — soldier: conditional dialog per quest state (default/confronted/reformed)
- `npcs/RedKarimNPC.gd` — quest giver: intro → ChoicePanel → accept/decline → completion → reward popup
- `npcs/BrownKarimNPC.gd` — spooky: checks vanished flag on _ready, "..." dialog → music duck → tween offscreen → permanent vanish
- `ui/shop/ShopPanel.tscn` + `ui/shop/ShopPanel.gd` — placeholder shop (3 items display, close button, pauses game)
- 14 dialog .tres files under `levels/level_town/dialogs/` (blue_karim_greet/no_money/bought, green_karim_default/confronted/reformed, red_karim_intro/accept/decline/waiting/complete/done, black_karim_flavor, brown_karim_spooky)

**Phase 7 — Scene Wiring:**
- TownLevel.tscn: Black Karim (dark grey, wandering between houses) + Brown Karim (brown, wandering right side) + 2 doors
- House1Interior.tscn: Blue Karim (blue tint, shopkeeper)
- House2Interior.tscn: Green Karim (green tint) + Red Karim (red tint)
- All NPC colors applied via Sprite modulate in .tscn (scene-first compliant)

**Quest flow:** Red Karim intro → accept quest → talk to Green Karim (confrontation) → return to Red Karim (completion + "Dildo" reward popup)

**All 7 phases verified with F5 testing.**

**Headless validation:** Clean parse, no errors.

### Session 37 (2026-02-21) — Town Polish Sessions 1-5 (Day/Night, Parallax, Props, Streetlights, Birds)

**Built full town atmosphere system across 5 sub-sessions.**

See `C:\Users\Robin\.claude\plans\twinkly-purring-treasure.md` for the full 10-session plan.

- Session 1: DayNightCycle autoload + town_sky.gdshader (gradient sky, sun/moon arcs, twinkling stars, FBM clouds)
- Session 2: Parallax mountains + cloud layers (3 Node2D layers with manual parallax)
- Session 3: 5 procedural prop types (Bench, Tree, Fence, FlowerPot, StreetSign), 16 instances placed
- Session 4: Streetlights (SDF glow cone, blend_add) + NightOverlay (semi-transparent dark shader)
- Session 5: BirdFlock V-formation system (day-only, 10-25s spawns)

### Session 38 (2026-02-21) — Town Polish Bug Fixes

**Fixed multiple visual bugs from Sessions 1-5 polish work.**

- **Parallax2D invisible**: Converted FarMountains/NearMountains/CloudLayer from Parallax2D to Node2D (Parallax2D broken in SubViewport). Manual parallax via canvas_transform in TownController._process()
- **Mountains scroll 1:1**: get_camera_2d() returns null in SubViewport. Fixed by deriving camera position from `vp.canvas_transform.affine_inverse() * screen_center`
- **Camera too low**: BoundsMax.y 200→70 (shows ~70% sky), bird spawn altitude adjusted to (-150,-30)
- **Sun moves with player**: Sky was a regular world-space ColorRect scrolling with camera. Tried SCREEN_UV (broken in SubViewport), CanvasLayer (broken editor preview). Final fix: camera-tracking ColorRect sized to viewport every frame
- **Sun arc inverted**: UV.y=0 is top of screen. Flipped parabola: horizon(0.8) at dawn/dusk, peak(0.2) at noon
- **Night too long**: Was 40% night / 30% day. Rebalanced to exact 50/50: DAWN_START=0.15, DAWN_END=0.25, DUSK_START=0.75, DUSK_END=0.85. Updated all 4 shader files.

**Headless validation:** Clean parse, no errors.

### Session 39 (2026-02-21) — Town Expansion (Session 6: More Houses)

**Replaced hand-coded house exteriors with parametric House.tscn prop. Expanded town from 1200px to 2200px wide.**

**New files (2):**
- `levels/level_town/props/House.tscn` — @tool Node2D scene with GlowWindow child (CanvasItemMaterial blend_add)
- `levels/level_town/props/House.gd` — parametric house: @export width/height/wall_color/roof_color/roof_style(triangle/flat/gambrel)/has_window/has_chimney/door_color. `_draw()` renders body, trim, roof, door, window with mullion, chimney. `set_brightness()` drives window glow at night (same interface as Streetlight).

**Modified files (1):**
- `levels/level_town/TownLevel.tscn` — major expansion:
  - Removed House1Exterior/House2Exterior (hand-coded ColorRect groups)
  - Added 6 House.tscn instances: House1 (brown, x=150), House2 (purple, x=450), House3 (yellow cottage, x=-100, chimney), House4 (dark red tall, x=750, flat roof), House5 (grey-blue wide, x=1100, gambrel, chimney), House6 (green-grey, x=1450)
  - Bounds widened: BoundsMin (-200,-300)→(-400,-300), BoundsMax (1000,70)→(1800,70)
  - Ground collision: 1200px→2200px, center shifted from (400,8)→(700,8)
  - GroundVisual/GrassLine extended: -400 to 1800
  - NightOverlay extended: -400 to 1800
  - Parallax visual rects widened: -800 to 2200 (extra margin for camera travel)
  - 3 new trees (x=1000, 1300, 1600), Tree1 moved to x=-250
  - 2 new benches (x=950, 1250)
  - 2 new flower pots (x=780, 1130)
  - 2 new street signs (x=1050, 1400)
  - 2 new streetlights (x=1100, 1400) — total 6
  - Fences repositioned: left x=-350 (8 segments), right x=1700 (8 segments)
  - BrownKarim wander range expanded: max_x 800→1200

**Headless validation:** Clean parse, no errors.

### Session 41 (2026-02-22) — Town Polish Session 9: Ground Polish

**Added shader-based soil texture and animated grass tufts across the town ground.**

**New files (3):**
- `shaders/town_ground.gdshader` — canvas_item shader for GroundVisual ColorRect: 4×4 px block soil variation (dark/mid/light), occasional grey pebbles, dark root streaks in top 18px
- `levels/level_town/props/GrassTuft.gd` — @tool Node2D: `@export blade_count/grass_color/blade_height/sway_phase`, `_draw()` renders triangular blades with dark fill + lighter midrib, `_process()` updates time and calls `queue_redraw()` (runtime-only via editor guard)
- `levels/level_town/props/GrassTuft.tscn` — minimal Node2D scene with GrassTuft.gd script

**Modified files (1):**
- `levels/level_town/TownLevel.tscn` — added ext_resource for town_ground.gdshader + GrassTuft.tscn, added ShaderMaterial_ground sub_resource, applied shader to GroundVisual, added 15 GrassTuft instances scattered across town (x=-370 to x=1540) with varied blade_count (3-5), sway_phase (0-5.2), and colour variants (bright green, dark green, yellowed, standard)

**Architecture:**
- GrassTuft renders behind houses/trees/NPCs (added before House1 in scene tree order)
- Blades draw upward from y=0 (ground level) — don't overlap GroundVisual (which is y=0 downward)
- Staggered sway_phase ensures tufts sway out of sync for organic feel
- Ground shader preserves base brown; adds noise patches, grey pebbles, root streaks near surface

**Headless validation:** Clean parse, no errors.

### Session 40 (2026-02-21) — Town Polish Session 7: Weather System

**Added shader-based weather overlays (rain + snow) with smooth transitions and debug cycling.**

**New files (6):**
- `shaders/rain.gdshader` — pixel-art rain: 3 depth layers of falling streaks, hash-based columns, wind shear
- `shaders/snow.gdshader` — pixel-art snow: 4 depth layers of drifting flakes, sine-wave horizontal sway
- `shaders/rain_puddles.gdshader` — ground puddle accumulation: dark wet patches + reflective pools, noise-based distribution, accumulation uniform drives formation
- `shaders/snow_ground.gdshader` — ground snow accumulation: white layer with noise-edged top line, sparkle highlights, accumulation uniform drives depth
- `levels/level_town/ambient/WeatherController.tscn` — Node2D (z_index=99) with 4 child overlays: RainOverlay, SnowOverlay (camera-tracked), PuddleOverlay, SnowGroundOverlay (world-space at ground level)
- `levels/level_town/ambient/WeatherController.gd` — @tool script: Weather enum (CLEAR/RAIN/SNOW), smooth 2s precipitation transitions, gradual ground accumulation (0.08/s build, 0.03/s drain), cloud darkening via sibling CloudLayer shader, camera tracking, debug API

**Modified files (5):**
- `core/EventBus.gd` — added `weather_changed(weather_type: int)` signal
- `core/DebugOverlay.gd` — F6 cycles weather (finds WeatherController via group), weather state shown in F3 debug overlay
- `shaders/town_clouds.gdshader` — added `weather_darken` uniform: storm clouds go grey-dark with higher opacity during rain/snow
- `levels/level_town/TownLevel.tscn` — instanced WeatherController between NightOverlay and SpawnPoint
- `project.godot` — added `debug_weather` input action (F6 key)

**Architecture:**
- Rain/snow overlays are camera-tracking ColorRects (same pattern as Sky/NightOverlay)
- Ground overlays (puddles, snow) are world-space at y=0, fixed position (no camera tracking needed)
- z_index=99 puts precipitation BELOW NightOverlay (z_index=100) — rain/snow get naturally dimmed at night
- Ground overlays use z_index=1 to render above the brown ground
- WeatherController is self-contained: camera tracking, state transitions, accumulation, cloud darkening
- Smooth 2s fade transitions for precipitation via parallel tweens on intensity uniforms
- Ground accumulation is gradual: ~12s to full puddles/snow, ~33s to fully drain
- Cloud darkening driven by max(rain_intensity, snow_intensity*0.6) — rain makes darker storm clouds than snow
- Both sky shaders work in pixel coordinates (426x240) for pixel-art crispness

**Headless validation:** Clean parse, no errors.

## Next Session

**Priority 1 — F5 full quest loop test (Purple Karim's Debt):**
- Town → talk Purple Karim → quest Active in Quest Log
- Enter jungle portal → talk all 3 Hydra Bodies (any order, including Body 1 in house)
- All 3 gone → Three-Headed Karim appears → talk → fades → `three_headed_karim_paid = true`
- Return to town via PortalBack → talk Purple Karim → complete dialog → Vibrator popup → Quest Log Completed
- Q key + QUEST LOG button in pause both open overlay

**Priority 2 — Jungle ground visual fix:**
- Godot stripped `town_ground.gdshader` from JungleLevel.tscn (was unreferenced — GroundVisual had no `material = SubResource(...)`)
- GroundVisual is currently plain solid color `Color(0.12, 0.18, 0.08)` — no procedural noise texture
- Fix: add ShaderMaterial with town_ground.gdshader sub_resource AND apply it to GroundVisual node

**Backlog:**
- Ambient Audio: wind/crickets/rain procedural sounds
- Level 2 content: items, dialogs, gates, exit portal
- Enemies and combat
