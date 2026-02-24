# GameData.gd
# Session data singleton — holds state that persists across scene transitions

extends Node

# Level selection (set by LevelSelectScene before transitioning to GameScene)
var selected_level_id: String = "level_1"
var selected_level_scene: String = "res://levels/level_1/Level1.tscn"

# Door / interior state (for returning to town from interiors)
var town_player_position: Vector2 = Vector2.ZERO

# Portal arrival state (spawn at destination portal instead of SpawnPoint)
var arrived_via_portal: bool = false
var portal_source_level: String = ""

# Resume state (Continue from main menu — spawn at saved position)
var resumed_position: Vector2 = Vector2.ZERO
