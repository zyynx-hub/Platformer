# Door.gd
# E-key interactable door — signals GameScene to swap the active level.
# Place instances in levels, set destination_scene and is_exit_door in Inspector.

@tool
extends Area2D

@export var destination_scene: String = ""
@export var is_exit_door: bool = false

var _player_in_range: bool = false
var _transitioning: bool = false
var _time: float = 0.0

func _ready() -> void:
	if Engine.is_editor_hint():
		return
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return
	_time += delta
	queue_redraw()

func _draw() -> void:
	if Engine.is_editor_hint():
		return
	if not _player_in_range or _transitioning:
		return

	# Floating "E" keycap prompt above door
	var prompt_y := -26.0 + sin(_time * 4.0) * 1.5
	var pulse := sin(_time * 3.0) * 0.2 + 0.8

	# Keycap background
	var rect := Rect2(-7, prompt_y - 6, 14, 12)
	draw_rect(rect, Color(0.06, 0.06, 0.12, 0.92))
	# Border glow
	draw_rect(rect, Color(0.4, 0.75, 1.0, pulse * 0.8), false, 1.0)
	# "E" letter
	var font := ThemeDB.fallback_font
	draw_string(font, Vector2(-4, prompt_y + 4), "E", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(1.0, 1.0, 1.0, pulse))

func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if _player_in_range and not _transitioning and event.is_action_pressed("interact"):
		_enter_door()
		get_viewport().set_input_as_handled()

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = true

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = false

func _enter_door() -> void:
	if destination_scene.is_empty():
		push_warning("Door: no destination_scene set")
		return
	_transitioning = true
	EventBus.door_entered.emit(destination_scene, is_exit_door)
