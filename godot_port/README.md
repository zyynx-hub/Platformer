# AnimePlatformer — Godot 4 Project

2D side-scrolling anime platformer. Blank-slate rebuild since 2026-02-18.

## How to Open

1. Download [Godot 4.6.1](https://godotengine.org) (standard version, not .NET)
2. Open Godot -> **Import** -> navigate to this directory -> select `project.godot`
3. Press **F5** to run

## Project Config

- **Viewport**: 1280x720, canvas_items stretch mode
- **Renderer**: gl_compatibility
- **Gravity**: 0 (applied manually in Player.gd)
- **Autoload**: EventBus (`scripts/core/EventBus.gd`)
- **Plugin**: LDtk Importer v2.0.1 (heygleeson)

## Input Actions

| Action | Keys |
|---|---|
| move_left | A, Left Arrow |
| move_right | D, Right Arrow |
| jump | W, Up Arrow, Space |
| dash | Shift |
| attack | J |
| interact | E, Enter |
| pause | Escape |

## Scene Flow

```
Boot.tscn → MenuScene.tscn → GameScene.tscn (loads Level1 + Player)
```

## File Organization

| Directory | Contents |
|---|---|
| `scripts/core/` | Constants.gd (physics), EventBus.gd (signals) |
| `scripts/player/` | Player.gd (movement) |
| `scripts/scenes/` | Boot.gd, MenuScene.gd, GameScene.gd |
| `scripts/ui/` | HUD.gd (health bar) |
| `scripts/ldtk/` | tileset_add_collision.gd (post-import collision) |
| `scenes/` | All .tscn scene files |
| `assets/sprites/` | Cavernas tileset (only sprite so far) |
| `addons/ldtk-importer/` | Third-party LDtk import plugin |

## LDtk Integration

- Level file: `scenes/levels/testlevel.ldtk`
- Tileset: `assets/sprites/Cavernas_by_Adam_Saltsman.png`
- IntGrid layer = collision geometry (gets physics via post-import script)
- AutoLayer = visual tiles (no collision)
- Tileset path in LDtk must be relative: `../../assets/sprites/Cavernas_by_Adam_Saltsman.png`
