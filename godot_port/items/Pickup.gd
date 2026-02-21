# Pickup.gd
# Generic world collectible — place in a level, set item_id in Inspector
# Player must press E to collect when in range. Shows floating keycap prompt.
# Bobs gently, glows, and sparkles to attract the player's attention.

extends Area2D

@export var item_id: String = "rocket_boots"

var _sprite: Sprite2D
var _time: float = 0.0
var _player_in_range: bool = false

# Ambient sparkle timer
var _sparkle_timer: float = 0.0
var _sparkle_tex: ImageTexture = null

func _ready() -> void:
	var item_def := ItemDefs.get_item(item_id)
	if item_def.is_empty():
		queue_free()
		return

	# Pickup sprite
	_sprite = Sprite2D.new()
	_sprite.texture = load(item_def["pickup_path"])
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(_sprite)

	# Collision for proximity detection (slightly larger than sprite for comfort)
	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 14.0
	shape.shape = circle
	add_child(shape)

	# Detect player overlap
	collision_layer = 0
	collision_mask = 1  # player is on layer 1
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _process(delta: float) -> void:
	_time += delta

	# Gentle bob animation
	_sprite.position.y = sin(_time * 3.0) * 2.0

	# Ambient glow pulse (brighter when player is near)
	var pulse: float
	if _player_in_range:
		pulse = sin(_time * 4.0) * 0.15 + 1.2
	else:
		pulse = sin(_time * 2.0) * 0.08 + 1.0
	_sprite.modulate = Color(pulse, pulse, pulse + 0.05, 1.0)

	# Ambient sparkles around the item
	_sparkle_timer -= delta
	if _sparkle_timer <= 0.0:
		_sparkle_timer = randf_range(0.2, 0.5)
		_spawn_sparkle()

	# Redraw prompt overlay
	queue_redraw()

func _draw() -> void:
	if not _player_in_range:
		return

	# Floating "E" keycap prompt above the item
	var prompt_y := -20.0 + sin(_time * 4.0) * 1.5
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
	if _player_in_range and event.is_action_pressed("interact"):
		_collect()

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = true

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = false

func _collect() -> void:
	var item_def := ItemDefs.get_item(item_id)
	if item_def.is_empty():
		return

	# Notify HUD, player, and popup
	EventBus.item_picked_up.emit({
		"id": item_def["id"],
		"name": item_def["name"],
		"icon": load(item_def["icon_path"]),
		"composited_sheets": item_def.get("composited_sheets", {}),
	})

	queue_free()

# --- Ambient sparkles ---

func _spawn_sparkle() -> void:
	var dot := Sprite2D.new()
	dot.texture = _get_sparkle_tex()
	dot.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	dot.modulate = Color(0.5, 0.75, 1.0, 0.7)
	add_child(dot)
	dot.position = Vector2(randf_range(-8, 8), randf_range(-10, 6))

	var target_y := dot.position.y - randf_range(6, 14)
	var dur := randf_range(0.5, 0.9)

	var tween := create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_QUAD)
	tween.tween_property(dot, "position:y", target_y, dur)
	tween.parallel().tween_property(dot, "modulate:a", 0.0, dur)
	tween.parallel().tween_property(dot, "scale", Vector2(0.4, 0.4), dur)
	tween.tween_callback(dot.queue_free)

func _get_sparkle_tex() -> ImageTexture:
	if _sparkle_tex == null:
		var img := Image.create(2, 2, false, Image.FORMAT_RGBA8)
		img.fill(Color.WHITE)
		_sparkle_tex = ImageTexture.create_from_image(img)
	return _sparkle_tex
