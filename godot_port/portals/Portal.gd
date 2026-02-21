# Portal.gd
# Interactable level portal — place in any level, set destination_level_id in Inspector.
# Player presses E near portal to activate. Cinematic pull-in sequence,
# then dissolve and scene transition to destination level.

@tool
extends Area2D

@export var destination_level_id: String = "level_2"
@export var portal_color: Color = Color(0.4, 0.3, 1.0, 1.0):
	set(value):
		portal_color = value
		_apply_portal_color()
@export_range(0.5, 3.0, 0.1) var portal_scale: float = 1.0:
	set(value):
		portal_scale = value
		_apply_portal_scale()

# Scene node references
@onready var _portal_visual: ColorRect = %PortalVisual

# Shader material (for animating activation_progress)
var _shader_material: ShaderMaterial = null

# State
var _player_in_range: bool = false
var _activating: bool = false
var _time: float = 0.0
var _ambient_particle_timer: float = 0.0

# Reusable dot texture for particles
var _dot_tex: ImageTexture = null

# Portal oval dimensions (half-sizes in pixels)
const BASE_HALF_W := 20.0
const BASE_HALF_H := 32.0

func _ready() -> void:
	if _portal_visual:
		_shader_material = _portal_visual.material as ShaderMaterial
	_apply_portal_color()
	_apply_portal_scale()

	if Engine.is_editor_hint():
		return
	# --- Runtime only below ---
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return
	_time += delta

	# Animate shader glow_strength for proximity feedback
	if not _activating and _shader_material:
		var glow: float
		if _player_in_range:
			glow = 0.8 + sin(_time * 4.0) * 0.2
		else:
			glow = 0.6 + sin(_time * 2.0) * 0.1
		_shader_material.set_shader_parameter("glow_strength", glow)

	# Ambient outward particles
	if not _activating:
		_ambient_particle_timer -= delta
		if _ambient_particle_timer <= 0.0:
			_ambient_particle_timer = randf_range(0.15, 0.35)
			_spawn_ambient_particle()

	queue_redraw()

# ===== Proximity detection =====

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = true

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = false

# ===== E-key prompt =====

func _draw() -> void:
	if Engine.is_editor_hint():
		return
	if not _player_in_range or _activating:
		return
	var prompt_y := -38.0 * portal_scale + sin(_time * 4.0) * 1.5
	var pulse := sin(_time * 3.0) * 0.2 + 0.8
	# Keycap background
	var rect := Rect2(-7, prompt_y - 6, 14, 12)
	draw_rect(rect, Color(0.06, 0.06, 0.12, 0.92))
	draw_rect(rect, Color(portal_color.r, portal_color.g, portal_color.b, pulse * 0.8), false, 1.0)
	# "E" letter
	var font := ThemeDB.fallback_font
	draw_string(font, Vector2(-4, prompt_y + 4), "E",
		HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(1.0, 1.0, 1.0, pulse))

# ===== Interaction =====

func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if _player_in_range and not _activating and event.is_action_pressed("interact"):
		_activate()

# ===== Activation cinematic =====

func _activate() -> void:
	_activating = true

	# Validate destination exists
	var level_def := LevelDefs.get_def(destination_level_id)
	if level_def.is_empty() or level_def.get("scene", "") == "":
		push_warning("Portal: destination '%s' not found or has no scene" % destination_level_id)
		_activating = false
		return

	# Signal portal activation (GameScene uses this to block pause/death)
	EventBus.portal_entered.emit(destination_level_id)

	# Find the player
	var players := get_tree().get_nodes_in_group("player")
	if players.is_empty():
		_activating = false
		return
	var player: CharacterBody2D = players[0]

	# Phase 1: Freeze player — transition to Spawn state (zero velocity, no input)
	player.state_machine.transition_to("Spawn")
	player.velocity_x = 0.0
	player.velocity_y = 0.0

	# Phase 2: Tween player toward portal center
	var pull_tween := create_tween()
	pull_tween.set_ease(Tween.EASE_IN_OUT)
	pull_tween.set_trans(Tween.TRANS_SINE)
	pull_tween.tween_property(player, "global_position",
		global_position, Constants.PORTAL_PULL_DURATION)

	# Phase 3: Ramp up shader activation (runs in parallel with pull)
	if _shader_material:
		var shader_tween := create_tween()
		shader_tween.tween_property(_shader_material,
			"shader_parameter/activation_progress", 1.0,
			Constants.PORTAL_ACTIVATION_DURATION)

	# Phase 4: Duck music
	AudioManager.duck_music(Constants.PORTAL_MUSIC_DUCK_DB, 0.5)

	# Phase 5: Spawn inward-spiraling particles
	_spawn_activation_particles()

	# Wait for player to reach portal center
	await pull_tween.finished

	if not is_instance_valid(player):
		return

	# Phase 6: Player dissolve
	var dissolve_tween = player.dissolve(Constants.PORTAL_DISSOLVE_DURATION)
	await dissolve_tween.finished

	# Phase 7: Brief shader flash (ramp glow then fade via transition)
	await get_tree().create_timer(0.15).timeout

	# Phase 8: Scene transition to destination level
	GameData.selected_level_id = destination_level_id
	GameData.selected_level_scene = level_def["scene"]
	SceneTransition.transition_to("res://game/GameScene.tscn")

# ===== Ambient particles (outward drifting energy wisps) =====

func _spawn_ambient_particle() -> void:
	var dot := _create_dot()
	add_child(dot)

	# Start on portal edge at random angle
	var angle := randf() * TAU
	var half_w := BASE_HALF_W * portal_scale * 0.7
	var half_h := BASE_HALF_H * portal_scale * 0.7
	dot.position = Vector2(
		cos(angle) * half_w,
		sin(angle) * half_h
	)
	dot.modulate = Color(
		portal_color.r * 0.8 + randf_range(0.0, 0.2),
		portal_color.g * 0.8 + randf_range(0.0, 0.2),
		portal_color.b,
		randf_range(0.4, 0.7)
	)

	# Drift outward and fade
	var outward := Vector2(cos(angle), sin(angle))
	var target_pos := dot.position + outward * randf_range(12, 28)
	var dur := randf_range(0.5, 1.0)

	var tw := create_tween()
	tw.tween_property(dot, "position", target_pos, dur).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	tw.parallel().tween_property(dot, "modulate:a", 0.0, dur)
	tw.parallel().tween_property(dot, "scale", Vector2(0.3, 0.3), dur)
	tw.tween_callback(dot.queue_free)

# ===== Activation particles (inward spiraling burst) =====

func _spawn_activation_particles() -> void:
	for i in range(16):
		var dot := _create_dot()
		add_child(dot)

		# Start from a wider ring (oval shape)
		var angle := float(i) / 16.0 * TAU + randf_range(-0.2, 0.2)
		var start_dist := randf_range(30, 50) * portal_scale
		dot.position = Vector2(cos(angle) * start_dist, sin(angle) * start_dist * 1.5)
		dot.modulate = Color(
			portal_color.r * 0.9,
			portal_color.g * 0.9,
			portal_color.b,
			0.8
		)

		# Spiral inward to center
		var dur := randf_range(0.4, 0.8)
		var delay := float(i) / 16.0 * 0.3

		var tw := create_tween()
		tw.tween_interval(delay)
		tw.tween_property(dot, "position", Vector2.ZERO, dur).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
		tw.parallel().tween_property(dot, "modulate:a", 0.0, dur * 0.8)
		tw.parallel().tween_property(dot, "scale", Vector2(0.2, 0.2), dur)
		tw.tween_callback(dot.queue_free)

# ===== Dot texture helper =====

func _create_dot() -> Sprite2D:
	if _dot_tex == null:
		var img := Image.create(2, 2, false, Image.FORMAT_RGBA8)
		img.fill(Color.WHITE)
		_dot_tex = ImageTexture.create_from_image(img)
	var dot := Sprite2D.new()
	dot.texture = _dot_tex
	dot.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	return dot

# ===== Inspector property helpers =====

func _apply_portal_color() -> void:
	if not is_inside_tree():
		return
	if _portal_visual and _portal_visual.material:
		var mat := _portal_visual.material as ShaderMaterial
		if mat:
			mat.set_shader_parameter("edge_color", portal_color)

func _apply_portal_scale() -> void:
	if not is_inside_tree():
		return
	if _portal_visual:
		_portal_visual.offset_left = -BASE_HALF_W * portal_scale
		_portal_visual.offset_top = -BASE_HALF_H * portal_scale
		_portal_visual.offset_right = BASE_HALF_W * portal_scale
		_portal_visual.offset_bottom = BASE_HALF_H * portal_scale
