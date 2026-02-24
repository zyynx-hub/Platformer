# KeyPickup.gd
# Collectible key — press E to pick up, emits gate_opened so a matching gate unlocks.
# Self-destructs on load if key was already collected (persisted via ProgressData).

extends Area2D

@export var gate_id: String = ""

var _player_in_range: bool = false
var _time: float = 0.0
var _sprite: Sprite2D

const KEY_TEX = preload("res://levels/level_tutorial/sprites/key.png")

func _ready() -> void:
	collision_layer = 0
	collision_mask = 2
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	# If already collected, remove self
	if not gate_id.is_empty():
		var pd := ProgressData.new()
		if pd.get_quest("gate_" + gate_id):
			queue_free()
			return
	# Create sprite child
	_sprite = Sprite2D.new()
	_sprite.texture = KEY_TEX
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_sprite.position.y = -4.0
	add_child(_sprite)

func _process(delta: float) -> void:
	_time += delta
	# Bob animation
	if _sprite:
		_sprite.position.y = -4.0 + sin(_time * 3.0) * 2.0
	if _player_in_range:
		queue_redraw()

func _draw() -> void:
	if _player_in_range:
		var prompt_y := -22.0 + sin(_time * 4.0) * 1.5
		var pulse := sin(_time * 3.0) * 0.2 + 0.8
		var rect := Rect2(-7, prompt_y - 6, 14, 12)
		draw_rect(rect, Color(0.06, 0.06, 0.12, 0.92))
		draw_rect(rect, Color(1.0, 0.85, 0.1, pulse * 0.8), false, 1.0)
		var font := ThemeDB.fallback_font
		if font:
			draw_string(font, Vector2(-4, prompt_y + 4), "E", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(1.0, 1.0, 1.0, pulse))

func _unhandled_input(event: InputEvent) -> void:
	if _player_in_range and event.is_action_pressed("interact"):
		if not gate_id.is_empty():
			EventBus.gate_opened.emit(gate_id)
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = true

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = false
		queue_redraw()
