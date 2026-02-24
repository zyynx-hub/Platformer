# TutorialButton.gd
# Interactive wall button — player presses E to trigger a gate_opened signal.
# Place in level, set gate_id in Inspector to match target ProgressionGate(s).

extends Area2D

@export var gate_id: String = ""

var _player_in_range: bool = false
var _pressed: bool = false
var _time: float = 0.0
var _sprite: Sprite2D

const BUTTON_TEX = preload("res://levels/level_tutorial/sprites/button.png")

func _ready() -> void:
	collision_layer = 0
	collision_mask = 2
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	# Create sprite child
	_sprite = Sprite2D.new()
	_sprite.texture = BUTTON_TEX
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(_sprite)
	# Restore persisted state
	if not gate_id.is_empty():
		var pd := ProgressData.new()
		if pd.get_quest("gate_" + gate_id):
			_pressed = true
			_sprite.modulate = Color(0.5, 0.5, 0.5, 1.0)

func _process(delta: float) -> void:
	_time += delta
	if _player_in_range and not _pressed:
		queue_redraw()

func _draw() -> void:
	if _player_in_range and not _pressed:
		var prompt_y := -16.0 + sin(_time * 4.0) * 1.5
		var pulse := sin(_time * 3.0) * 0.2 + 0.8
		var rect := Rect2(-7, prompt_y - 6, 14, 12)
		draw_rect(rect, Color(0.06, 0.06, 0.12, 0.92))
		draw_rect(rect, Color(0.85, 0.2, 0.2, pulse * 0.8), false, 1.0)
		var font := ThemeDB.fallback_font
		if font:
			draw_string(font, Vector2(-4, prompt_y + 4), "E", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(1.0, 1.0, 1.0, pulse))

func _unhandled_input(event: InputEvent) -> void:
	if _player_in_range and not _pressed and event.is_action_pressed("interact"):
		_press()

func _press() -> void:
	_pressed = true
	if not gate_id.is_empty():
		EventBus.gate_opened.emit(gate_id)
	if _sprite:
		_sprite.modulate = Color(0.5, 0.5, 0.5, 1.0)
	queue_redraw()

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = true

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = false
		queue_redraw()
