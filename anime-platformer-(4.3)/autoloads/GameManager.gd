## GameManager — scene transitions and shared game state.
## Single source of truth for health, coins, lives, level, progress.
extends Node

# Runtime state (resets on new game)
var health: int    = 3
var max_health: int = 3
var lives: int     = 2
var coins: int     = 0
var coins_target: int = 10
var level: int     = 1
var current_node_id: String = ""
var current_world_id: String = "world_tutorial"
var shield_charges: int = 0
var jetpack_fuel_percent: float = 100.0

# Carry-state flag: when true, health/lives persist across level load
var carry_state: bool = false

const SCENE_BOOT      := "res://scenes/boot/BootScene.tscn"
const SCENE_MENU      := "res://scenes/menu/MenuScene.tscn"
const SCENE_WORLD_MAP := "res://scenes/world_map/WorldMapScene.tscn"
const SCENE_GAME      := "res://scenes/game/GameScene.tscn"
const SCENE_OPTIONS   := "res://scenes/options/OptionsScene.tscn"


func _ready() -> void:
	EventBus.return_to_menu.connect(_on_return_to_menu)
	EventBus.return_to_world_map.connect(_on_return_to_world_map)
	EventBus.game_over.connect(_on_game_over)
	EventBus.level_complete.connect(_on_level_complete)


func start_new_game(from_node_id: String = "", world_id: String = "world_tutorial") -> void:
	var diff := SettingsManager.get_difficulty()
	health      = 3
	max_health  = 3
	lives       = SettingsManager.start_lives()
	coins       = 0
	coins_target = 10
	shield_charges = 0
	jetpack_fuel_percent = 100.0
	carry_state = false
	current_node_id  = from_node_id
	current_world_id = world_id
	var node_level := _resolve_node_level(from_node_id)
	level = node_level if node_level > 0 else 1


func launch_level(p_level: int, node_id: String = "", world_id: String = "") -> void:
	level            = p_level
	current_node_id  = node_id
	current_world_id = world_id if not world_id.is_empty() else current_world_id
	get_tree().change_scene_to_file(SCENE_GAME)


func go_to_menu() -> void:
	get_tree().change_scene_to_file(SCENE_MENU)


func go_to_world_map() -> void:
	get_tree().change_scene_to_file(SCENE_WORLD_MAP)


func apply_damage(amount: int) -> void:
	health = maxi(0, health - amount)
	EventBus.player_damaged.emit(amount, health)
	if health <= 0:
		_handle_death()


func _handle_death() -> void:
	EventBus.player_died.emit()
	lives -= 1
	if lives <= 0:
		EventBus.game_over.emit()
	else:
		# Respawn at checkpoint — GameScene handles actual repositioning
		health = maxi(1, max_health)


func collect_coin() -> void:
	coins += 1
	EventBus.coin_collected.emit(coins)


func _on_return_to_menu() -> void:
	carry_state = false
	go_to_menu()


func _on_return_to_world_map() -> void:
	go_to_world_map()


func _on_game_over() -> void:
	go_to_menu()


func _on_level_complete(data: Dictionary) -> void:
	var bonus_coins: int = data.get("bonus_coins", 0)
	coins += bonus_coins
	carry_state = true
	go_to_world_map()


func _resolve_node_level(node_id: String) -> int:
	# Will be filled once WorldMapManager is loaded; returns 1 as fallback.
	if node_id.is_empty():
		return 1
	return 1
