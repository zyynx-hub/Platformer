---
paths: ["godot_port/**/*.gd", "godot_port/**/*.tscn", "godot_port/**/*.gdshader", "godot_port/**/*.tres"]
---

# Godot Workflow

## Verification

Headless parse check (no GPU required):
```bash
"c:/Users/Robin/Desktop/Godot_v4.6.1-stable_win64.exe" --headless --path "c:/Users/Robin/Desktop/codex/godot_port" --quit 2>&1
```

Runtime test: open `project.godot` in Godot 4, press F5. Errors go in Output panel.

## Editor-Runtime Parity (MANDATORY)

**The Godot editor must always match runtime visuals.**

1. **Shaders in .tscn** — embed ShaderMaterial as `[sub_resource]` referencing shader `[ext_resource]`. Never create ShaderMaterial at runtime.
2. **Scripts use @tool** — any scene with visual styling must use `@tool` so styling runs in editor.
3. **`Engine.is_editor_hint()` guard** — runtime-only code (music, SFX, signals, animations, particles) wrapped with `if Engine.is_editor_hint(): return` after styling.
4. **Particles are runtime-only** — GPUParticles2D + ParticleProcessMaterial too complex for .tscn. Create in script, guarded by editor check.

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

- Edit `.gd` scripts directly. May edit `.tscn` files for shader/material embedding.
- Do NOT change node hierarchy in user-built scenes: `Level1.tscn`
- Menu scenes may be edited for shader materials and overlay nodes.
- No build step — Godot hot-reloads scripts on F5.

## .tscn File Rules

When editing .tscn files:
1. No `.new()` calls — shapes/materials must be `[sub_resource]` definitions
2. Define sub_resources BEFORE nodes that reference them
3. `load_steps` = ext_resource count + sub_resource count + 1
4. Root node type must match script's `extends`
5. Use `call_deferred` for `change_scene_to_file` during `_ready()`
6. `unique_name_in_owner = true` on its own line below `[node]` tag (not inside tag brackets)
7. Preserve existing `unique_id` values on nodes
8. New overlay nodes use `mouse_filter = 2` (IGNORE)

## Export

Use Godot's built-in Export dialog. No PyInstaller, no JS bundle, no bat files.

## Key Paths

- **Project**: `c:\Users\Robin\Desktop\codex\godot_port\project.godot`
- **Executable**: `c:\Users\Robin\Desktop\Godot_v4.6.1-stable_win64.exe`
- **Asset source** (old port): `c:\Users\Robin\Desktop\codex\anime-platformer-(4.3)\assets\`
