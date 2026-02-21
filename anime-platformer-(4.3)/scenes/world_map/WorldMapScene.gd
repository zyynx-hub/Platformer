## WorldMapScene — world map node traversal and level launch.
## Port of js/scenes/world-map-scene.js.
extends Node2D

const SCENE_GAME    := "res://scenes/game/GameScene.tscn"
const SCENE_MENU    := "res://scenes/menu/MenuScene.tscn"
const SCENE_OPTIONS := "res://scenes/options/OptionsScene.tscn"

var _wm: WorldMapManagerClass
var _progress: ProgressManager
var _world: Dictionary = {}
var _current_node_id: String = "start"
var _node_buttons: Dictionary = {}

@onready var node_container: Node2D   = $NodeContainer
@onready var info_panel:     Control  = $UI/InfoPanel
@onready var node_title:     Label    = $UI/InfoPanel/Title
@onready var node_hint:      Label    = $UI/InfoPanel/Hint
@onready var launch_button:  Button   = $UI/InfoPanel/LaunchButton
@onready var back_button:    Button   = $UI/BackButton
@onready var avatar:         Node2D   = $Avatar


func _ready() -> void:
	_wm       = WorldMapManagerClass.new()
	_progress = ProgressManager.new()
	_world    = _wm.get_world(GameManager.current_world_id)
	_current_node_id = GameManager.current_node_id
	if _current_node_id.is_empty():
		_current_node_id = _world.get("start_node_id", "start")

	AudioManager.play_music("menu", 1.0)
	_build_map()
	_select_node(_current_node_id)

	if launch_button:
		launch_button.pressed.connect(_on_launch)
	if back_button:
		back_button.pressed.connect(_on_back)


func _build_map() -> void:
	# Unlock start node always
	_progress.unlock_node(GameManager.current_world_id, "start")
	# Draw edges first
	_draw_edges()
	# Draw node buttons
	for node_data in _world.get("nodes", []):
		_make_node_button(node_data)


func _draw_edges() -> void:
	# Edges drawn as Line2D in the node_container
	for edge in _world.get("edges", []):
		var from_node := _get_node_pos(edge["from"])
		var to_node   := _get_node_pos(edge["to"])
		var line      := Line2D.new()
		line.points   = [from_node, to_node]
		line.width    = 2.0
		line.default_color = Color(0.5, 0.5, 0.7, 0.8)
		node_container.add_child(line)


func _make_node_button(node_data: Dictionary) -> void:
	var nid: String = node_data["id"]
	var pos: Vector2 = node_data.get("pos", Vector2.ZERO)
	var unlocked: bool = _progress.is_node_unlocked(GameManager.current_world_id, nid)

	var btn := Button.new()
	btn.text        = node_data.get("title", nid)
	btn.position    = pos - Vector2(40, 15)
	btn.size        = Vector2(80, 30)
	btn.disabled    = not unlocked
	btn.pressed.connect(_on_node_pressed.bind(nid))
	node_container.add_child(btn)
	_node_buttons[nid] = btn

	# Colour by type
	var colour := Color.WHITE
	match node_data.get("type", ""):
		"start":    colour = Color(0.2, 0.9, 0.2)
		"shop":     colour = Color(0.9, 0.8, 0.1)
		"boss":     colour = Color(0.9, 0.2, 0.2)
		"junction": colour = Color(0.6, 0.6, 0.9)
	if unlocked:
		btn.add_theme_color_override("font_color", colour)
	else:
		btn.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4))


func _get_node_pos(node_id: String) -> Vector2:
	for node_data in _world.get("nodes", []):
		if node_data["id"] == node_id:
			return node_data.get("pos", Vector2.ZERO)
	return Vector2.ZERO


func _select_node(node_id: String) -> void:
	_current_node_id = node_id
	var node_data := _wm.get_node(_world, node_id)
	if node_data.is_empty():
		return
	if node_title:  node_title.text = node_data.get("title", node_id)
	if node_hint:   node_hint.text  = node_data.get("hint",  "")
	if launch_button:
		var ntype: String = node_data.get("type", "")
		launch_button.text    = "Enter Shop" if ntype == "shop" else "Play Level"
		launch_button.visible = ntype not in ["junction"]
	if avatar:
		var pos: Vector2 = node_data.get("pos", Vector2.ZERO)
		var tween := create_tween()
		tween.tween_property(avatar, "position", pos + Vector2(0, -20), 0.3)


func _on_node_pressed(node_id: String) -> void:
	_select_node(node_id)


func _on_launch() -> void:
	var node_data := _wm.get_node(_world, _current_node_id)
	if node_data.is_empty():
		return
	var ntype: String = node_data.get("type", "")
	if ntype == "shop":
		EventBus.world_map_shop_open.emit(_current_node_id)
		return
	var level: int = _wm.resolve_level(node_data)
	# Unlock adjacent nodes
	for edge in _world.get("edges", []):
		if edge["from"] == _current_node_id:
			_progress.unlock_node(GameManager.current_world_id, edge["to"])
	GameManager.launch_level(level, _current_node_id, GameManager.current_world_id)


func _on_back() -> void:
	get_tree().change_scene_to_file(SCENE_MENU)


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_on_back()
