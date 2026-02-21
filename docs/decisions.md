# Godot Architecture Decisions

## ADR-001: Manual Gravity (project gravity = 0)

**Date**: 2026-02-18
**Context**: The jetpack system needs direct control over vertical velocity. Project-level gravity would fight the jetpack's anti-gravity thrust, requiring complex compensation.
**Decision**: Set project gravity to 0. Apply gravity manually in Player.gd's `_physics_process`.
**Consequences**: Jetpack can cleanly manage vertical phases (OFF/BRAKE/LIFT). Every entity that needs gravity must apply it explicitly.

## ADR-002: EventBus Autoload for Cross-System Signals

**Date**: 2026-02-18
**Context**: Player, HUD, and future systems (audio, world map) need to communicate without tight coupling.
**Decision**: Single EventBus autoload with typed signals. Systems emit/connect through EventBus rather than direct node references.
**Consequences**: Clean decoupling. Any system can be added/removed without touching others. Risk: EventBus becoming a god object if undisciplined.

## ADR-003: Float Counters Over Timer Nodes

**Date**: 2026-02-18
**Context**: Coyote time (0.11s), jump buffer (0.13s), dash duration (0.14s), and wall-jump lock (0.15s) all need per-frame precision.
**Decision**: Use float countdown variables decremented in `_physics_process` rather than Timer nodes.
**Consequences**: All timing is deterministic within the physics frame. No callback indirection, no Timer lifecycle management. Slightly more manual code per timer.

## ADR-004: LDtk + IntGrid for Level Collision

**Date**: 2026-02-18
**Context**: Need a level editor that separates collision geometry from visual tiles. Godot's built-in TileMap editor works but requires manual collision painting.
**Decision**: Use LDtk with IntGrid layer for collision and AutoLayer for visuals. Post-import script (`tileset_add_collision.gd`) auto-adds physics to IntGrid tiles only.
**Consequences**: Level design happens in LDtk (external tool). Import pipeline requires plugin (heygleeson v2.0.1). Tileset path in LDtk must be relative.

## ADR-005: Node-Based State Machine (GDQuest Pattern)

**Date**: 2026-02-18 (enum), superseded 2026-02-19 (node-based)
**Context**: Player has 8 movement states. Originally used single enum + match in Player.gd (~553 lines). As mechanics grew (rocket boots, equipment, wall jump lock), the monolithic file became hard to maintain and each new mechanic required understanding all state interactions.
**Decision**: Split into node-based state machine. StateMachine node manages transitions, PlayerState base class defines interface, 8 individual state scripts handle their own physics/transitions.
**Consequences**: Player.gd dropped to ~280 lines (shared helpers + equipment). Adding a new state means adding one .gd file and one child node. Trade-off: must ensure `apply_movement()` runs every frame even when states return early (see jump bug fix — `start_jump()` must call `apply_movement()` to prevent stale `is_on_floor()`).
**Key constraint**: Player._physics_process calls `state_machine.update()` explicitly (not StateMachine._physics_process) to preserve execution ordering: timers → rocket boots → state dispatch → sprite sync.

## ADR-006: GameData Autoload for Cross-Scene Data

**Date**: 2026-02-19
**Context**: LevelSelectScene needed to pass selected level ID/scene path to GameScene. Originally used static vars on GameScene (`GameScene.selected_level_id`). Static vars require `class_name` and create coupling — any script accessing them must know about GameScene.
**Decision**: GameData autoload singleton holds session-scoped data (selected level, future: inventory, run stats).
**Consequences**: Clean decoupling — scenes read/write GameData without knowing about each other. Autoload persists across scene changes. Follows same pattern as SettingsManager for persistent data.

## ADR-007: Equipment Sprite Layering (Dual AnimatedSprite2D)

**Date**: 2026-02-19
**Context**: Equipping items (rocket boots) swaps the character's sprite sheets to composited versions. Originally rebuilt SpriteFrames on the main Sprite2D, causing potential flicker and tight coupling between base animation and equipment.
**Decision**: Added EquipmentSprite (AnimatedSprite2D) as sibling to base Sprite2D in Player.tscn. On equipment pickup, build separate SpriteFrames for EquipmentSprite using composited sheets, hide base Sprite2D. Both sprites sync animation name, flip_h, and squash/stretch.
**Consequences**: Base sprite is never modified. Equipment is purely additive (show EquipmentSprite, hide base). When overlay-only sheets are created later, both sprites can be shown simultaneously for true layering. Adding item #2 means building another SpriteFrames set, not touching animation code.

## Overarching Principle

**Prefer explicit, observable state transitions over implicit fallback.** If behavior can fail silently, add prints and guards so failures become diagnosable. This lesson was carried forward from the Phaser build's hardest bugs.
