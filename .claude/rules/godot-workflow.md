# Godot Workflow

## Verification

Headless parse check (no GPU required):
```bash
"c:/Users/Robin/Desktop/Godot_v4.6.1-stable_win64.exe" --headless --path "c:/Users/Robin/Desktop/codex/godot_port" --quit 2>&1
```

Runtime test: user opens project.godot in Godot 4, presses F5. Errors go in Output panel.

## Editor–Runtime Parity (MANDATORY)

**The Godot editor must always match runtime visuals.** This means:

1. **Shaders go in .tscn** — embed ShaderMaterial as `[sub_resource]` referencing shader `[ext_resource]`. Never create ShaderMaterial at runtime via script.
2. **Scripts are @tool** — any scene with visual styling (buttons, labels, tabs, sliders) must use `@tool` so the styling runs in the editor.
3. **`Engine.is_editor_hint()` guard** — runtime-only code (music, SFX, signals, animations, particles, scene transitions) must be wrapped with `if Engine.is_editor_hint(): return` after the styling call.
4. **Particles are runtime-only** — GPUParticles2D with ParticleProcessMaterial are too complex for .tscn sub_resources. Create them in script, guarded by the editor check.

Pattern for any UI scene:
```gdscript
@tool
extends Control

func _ready() -> void:
    _apply_theme()          # Runs in BOTH editor and runtime
    if Engine.is_editor_hint():
        return
    # --- Runtime only below ---
    _setup_particles()
    _connect_signals()
    _play_entrance_animation()
```

## Editing Rules

- I edit `.gd` scripts directly and may edit `.tscn` files for shader/material embedding
- User-built scene **structure** (do NOT change node hierarchy): `Level1.tscn`
- Menu scenes (MenuScene, OptionsScene, ExtrasScene) may be edited for shader materials and overlay nodes
- No build step — Godot hot-reloads scripts on F5

## Common .tscn Pitfalls

When touching a .tscn file:
1. No `.new()` calls — shapes/materials must be `[sub_resource]` definitions
2. Define sub_resources BEFORE nodes that reference them
3. `load_steps` must equal ext_resource + sub_resource count + 1
4. Root node type must match script's `extends` declaration
5. Use `call_deferred` for `change_scene_to_file` during `_ready()`
6. Set `unique_name_in_owner = true` in Inspector for `%NodeName` access
7. Preserve existing `unique_id` values on nodes
8. New overlay nodes (GroundOverlay, VignetteOverlay) use `mouse_filter = 2` (IGNORE)

## Export (when ready)

Use Godot's built-in Export dialog. No PyInstaller, no JS bundle, no bat files.

## Key Paths

- **Project**: `c:\Users\Robin\Desktop\codex\godot_port\project.godot`
- **Executable**: `c:\Users\Robin\Desktop\Godot_v4.6.1-stable_win64.exe`
- **Asset source** (old port): `c:\Users\Robin\Desktop\codex\anime-platformer-(4.3)\assets\`
