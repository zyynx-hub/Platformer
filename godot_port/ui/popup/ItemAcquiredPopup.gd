# ItemAcquiredPopup.gd
# Full-screen overlay showing "You've acquired [item name]" with animated shader border,
# orbiting shader orbs, and particle effects.
# Renders at 1280x720 (CanvasLayer on GameScene root, outside SubViewport).
# Scene structure defined in ItemAcquiredPopup.tscn — script handles animation + dynamics.

extends CanvasLayer

signal popup_finished

var _item_name: String = ""
var _item_icon: Texture2D = null

# Scene node references (set via @onready + %UniqueName)
@onready var _dim_overlay: ColorRect = %DimOverlay
@onready var _flash_overlay: ColorRect = %FlashOverlay
@onready var _rays_container: Control = %RaysContainer
@onready var _box: Control = %Box
@onready var _shader_bg: ColorRect = %ShaderBg
@onready var _content_root: MarginContainer = %ContentMargin
@onready var _icon_container: Control = %IconContainer
@onready var _icon_glow: ColorRect = %IconGlow
@onready var _icon_rect: TextureRect = %IconRect
@onready var _name_label: Label = %NameLabel
@onready var _help_label: Label = %HelpLabel

# Shader material ref (for animating appear_progress)
@onready var _shader_material: ShaderMaterial = %ShaderBg.material as ShaderMaterial

# Orb nodes from scene
@onready var _orb_nodes: Array = [%Orb0, %Orb1, %Orb2]

# Dynamic state
var _dot_tex: ImageTexture = null
var _particle_timer: float = 0.0
var _alive: bool = true
var _exiting: bool = false
var _exit_progress: float = 0.0
var _icon_bob_time: float = 0.0
var _rays_angle: float = 0.0
var _orb_time: float = 0.0
var _orb_trails: Array = []   # Array of Array[Vector2] per orb
var _trail_nodes: Array = []  # Array of Array[Sprite2D] per orb

const DISPLAY_DURATION := 3.5
const FADE_IN_DURATION := 0.55
const FADE_OUT_DURATION := 0.6
const BOX_WIDTH := 460.0
const BOX_HEIGHT := 130.0
const ICON_SIZE := 52.0
const NUM_RAYS := 12
const RAY_LENGTH := 280.0

# Orb orbit
const ORB_COUNT := 3
const ORB_SIZE := 28.0
const ORB_PERIOD := 4.0
const ORB_MARGIN := 14.0
const ORB_CORNER_RADIUS := 14.0
const TRAIL_LENGTH := 7

const ORB_COLORS: Array = [
	[0.3, 0.6, 1.0],
	[0.55, 0.35, 1.0],
	[0.2, 0.75, 0.95],
]

func setup(item_name: String, item_icon: Texture2D) -> void:
	_item_name = item_name
	_item_icon = item_icon

func _ready() -> void:
	# Apply item data from setup()
	_name_label.text = _item_name
	if _item_icon:
		_icon_rect.texture = _item_icon

	# Build dynamic-only elements (rays are repetitive, trails are per-frame)
	_build_light_rays()
	_build_trails()

	# Set animation initial states (shader default is 1.0 for editor preview)
	_shader_material.set_shader_parameter("appear_progress", 0.0)
	_box.scale = Vector2(0.15, 0.15)
	_box.modulate.a = 0.0
	_content_root.modulate.a = 0.0
	_icon_container.scale = Vector2.ZERO

	_play_entrance()

# --- Dynamic element generation (scripted because Godot nodes alone can't handle) ---

func _build_light_rays() -> void:
	# 12 identical rays differing only in rotation — generated in a loop
	for i in range(NUM_RAYS):
		var ray := ColorRect.new()
		var angle := float(i) / float(NUM_RAYS) * TAU
		ray.color = Color(0.3, 0.55, 1.0, 0.06)
		ray.size = Vector2(3.0, RAY_LENGTH)
		ray.pivot_offset = Vector2(1.5, RAY_LENGTH)
		ray.position = Vector2(-1.5, -RAY_LENGTH)
		ray.rotation = angle
		ray.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_rays_container.add_child(ray)

func _build_trails() -> void:
	# Trail afterimage dots per orb (dynamic, updated each frame)
	for i in range(ORB_COUNT):
		_orb_trails.append([])
		var col_data: Array = ORB_COLORS[i % ORB_COLORS.size()]
		var trail_dots: Array = []
		for j in range(TRAIL_LENGTH):
			var dot := _create_trail_dot(Color(col_data[0], col_data[1], col_data[2]))
			_box.add_child(dot)
			dot.visible = false
			trail_dots.append(dot)
		_trail_nodes.append(trail_dots)

func _create_trail_dot(col: Color) -> Sprite2D:
	if _dot_tex == null:
		var img := Image.create(3, 3, false, Image.FORMAT_RGBA8)
		img.fill(Color.WHITE)
		_dot_tex = ImageTexture.create_from_image(img)
	var dot := Sprite2D.new()
	dot.texture = _dot_tex
	dot.modulate = Color(col.r, col.g, col.b, 0.5)
	dot.scale = Vector2(1.0, 1.0)
	return dot

# --- Entrance animation ---

func _play_entrance() -> void:
	# Screen dim
	var dim_tw := create_tween()
	dim_tw.tween_property(_dim_overlay, "color:a", 0.45, FADE_IN_DURATION * 0.6)

	# Screen flash
	var flash_tw := create_tween()
	flash_tw.tween_property(_flash_overlay, "color:a", 0.35, 0.06)
	flash_tw.tween_property(_flash_overlay, "color:a", 0.0, 0.4).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)

	# Box: explosive scale bounce
	var scale_tw := create_tween()
	scale_tw.set_ease(Tween.EASE_OUT)
	scale_tw.set_trans(Tween.TRANS_BACK)
	scale_tw.tween_property(_box, "scale", Vector2(1.06, 1.06), FADE_IN_DURATION * 0.7)
	scale_tw.tween_property(_box, "scale", Vector2(1.0, 1.0), FADE_IN_DURATION * 0.3).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)

	# Box: fade in fast
	var alpha_tw := create_tween()
	alpha_tw.tween_property(_box, "modulate:a", 1.0, FADE_IN_DURATION * 0.25)

	# Shader appear_progress
	var shader_tw := create_tween()
	shader_tw.tween_property(
		_shader_material,
		"shader_parameter/appear_progress",
		1.0,
		FADE_IN_DURATION
	)

	# Light rays fade in
	var rays_tw := create_tween()
	rays_tw.tween_property(_rays_container, "modulate:a", 1.0, FADE_IN_DURATION * 0.5)

	# Content fades in after box lands
	var content_tw := create_tween()
	content_tw.tween_interval(FADE_IN_DURATION * 0.45)
	content_tw.tween_property(_content_root, "modulate:a", 1.0, FADE_IN_DURATION * 0.55)

	# Icon entrance: delayed pop
	var icon_tw := create_tween()
	icon_tw.tween_interval(FADE_IN_DURATION * 0.5)
	icon_tw.tween_property(_icon_container, "scale", Vector2(1.2, 1.2), 0.2).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	icon_tw.tween_property(_icon_container, "scale", Vector2(1.0, 1.0), 0.15).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)

	# Icon glow pulse in
	var glow_tw := create_tween()
	glow_tw.tween_interval(FADE_IN_DURATION * 0.5)
	glow_tw.tween_property(_icon_glow, "color:a", 0.25, 0.25)

	# Orbiting orbs fade in (staggered)
	for i in range(ORB_COUNT):
		var orb_tw := create_tween()
		orb_tw.tween_interval(FADE_IN_DURATION * 0.6 + float(i) * 0.1)
		orb_tw.tween_property(_orb_nodes[i], "modulate:a", 0.9, 0.3)

	# Help text fades in after box settles
	var help_settings: LabelSettings = _help_label.label_settings
	var help_tw := create_tween()
	help_tw.tween_interval(FADE_IN_DURATION + 0.4)
	help_tw.tween_method(func(v: float):
		help_settings.font_color.a = v * 0.7
	, 0.0, 1.0, 0.5)

	# Particle bursts
	_spawn_entrance_particles()
	var ring_tw := create_tween()
	ring_tw.tween_interval(0.12)
	ring_tw.tween_callback(_spawn_ring_burst)

	# Schedule auto-dismiss
	var dismiss_tw := create_tween()
	dismiss_tw.tween_interval(DISPLAY_DURATION)
	dismiss_tw.tween_callback(_play_exit)

# --- Exit animation (staggered, smooth wind-down) ---

func _play_exit() -> void:
	_exiting = true

	# Animate exit_progress 0→1 for smooth wind-down of _process effects
	var progress_tw := create_tween()
	progress_tw.set_ease(Tween.EASE_IN)
	progress_tw.set_trans(Tween.TRANS_SINE)
	progress_tw.tween_property(self, "_exit_progress", 1.0, FADE_OUT_DURATION)

	# Phase 1: Content fades first (text, icon)
	var content_tw := create_tween()
	content_tw.set_ease(Tween.EASE_IN_OUT)
	content_tw.set_trans(Tween.TRANS_SINE)
	content_tw.tween_property(_content_root, "modulate:a", 0.0, FADE_OUT_DURATION * 0.45)

	# Phase 2: Orbs shrink + fade (staggered)
	for i in range(ORB_COUNT):
		var orb_tw := create_tween()
		var delay := 0.08 + float(i) * 0.06
		orb_tw.tween_interval(delay)
		orb_tw.set_ease(Tween.EASE_IN)
		orb_tw.set_trans(Tween.TRANS_QUAD)
		orb_tw.tween_property(_orb_nodes[i], "modulate:a", 0.0, FADE_OUT_DURATION * 0.5)
		orb_tw.parallel().tween_property(_orb_nodes[i], "scale", Vector2(0.1, 0.1), FADE_OUT_DURATION * 0.5)
		var dots: Array = _trail_nodes[i]
		for j in range(dots.size()):
			var dot_tw := create_tween()
			dot_tw.tween_interval(delay)
			dot_tw.tween_property(dots[j], "modulate:a", 0.0, FADE_OUT_DURATION * 0.4)

	# Phase 3: Rays fade out smoothly
	var rays_tw := create_tween()
	rays_tw.set_ease(Tween.EASE_IN_OUT)
	rays_tw.set_trans(Tween.TRANS_SINE)
	rays_tw.tween_interval(FADE_OUT_DURATION * 0.15)
	rays_tw.tween_property(_rays_container, "modulate:a", 0.0, FADE_OUT_DURATION * 0.6)

	# Phase 4: Box scale down + fade
	var box_tw := create_tween()
	box_tw.set_ease(Tween.EASE_IN_OUT)
	box_tw.set_trans(Tween.TRANS_SINE)
	box_tw.tween_property(_box, "modulate:a", 0.0, FADE_OUT_DURATION)
	var box_scale_tw := create_tween()
	box_scale_tw.set_ease(Tween.EASE_IN)
	box_scale_tw.set_trans(Tween.TRANS_CUBIC)
	box_scale_tw.tween_property(_box, "scale", Vector2(0.85, 0.85), FADE_OUT_DURATION)

	# Phase 5: Dim lifts last (lingers after box is gone)
	var dim_tw := create_tween()
	dim_tw.set_ease(Tween.EASE_IN_OUT)
	dim_tw.set_trans(Tween.TRANS_SINE)
	dim_tw.tween_interval(FADE_OUT_DURATION * 0.2)
	dim_tw.tween_property(_dim_overlay, "color:a", 0.0, FADE_OUT_DURATION * 0.8)

	# Cleanup
	var done_tw := create_tween()
	done_tw.tween_interval(FADE_OUT_DURATION + 0.15)
	done_tw.tween_callback(func():
		_alive = false
		popup_finished.emit()
		queue_free()
	)

# --- Per-frame animation ---

func _process(delta: float) -> void:
	if not _alive:
		return

	var vitality := 1.0 - _exit_progress

	# Name label shimmer
	if _name_label and _name_label.label_settings:
		var t := fmod(Time.get_ticks_msec() / 1000.0, 20.0)
		var shimmer := sin(t * 3.0) * 0.08 * vitality
		_name_label.label_settings.font_color = Color(
			0.88 + shimmer,
			0.94 + shimmer * 0.5,
			1.0,
			1.0
		)

	# Icon gentle bob
	_icon_bob_time += delta
	if _icon_rect:
		_icon_rect.position.y = 4.0 + sin(_icon_bob_time * 2.5) * 1.5 * vitality

	# Icon glow pulse
	if _icon_glow:
		var glow_pulse := sin(_icon_bob_time * 3.0) * 0.08 + 0.2
		_icon_glow.color.a = glow_pulse * vitality

	# Rotate light rays
	_rays_angle += delta * 0.15
	if _rays_container:
		_rays_container.rotation = _rays_angle
		for i in range(_rays_container.get_child_count()):
			var ray: ColorRect = _rays_container.get_child(i)
			var phase := float(i) / float(NUM_RAYS) * TAU
			ray.color.a = (0.04 + sin(_rays_angle * 3.0 + phase) * 0.025) * vitality

	# Orbiting orbs (keep moving during exit, speed up as they shrink)
	var orb_speed_mult := 1.0 + _exit_progress * 2.0
	_orb_time += delta * orb_speed_mult
	if not _exiting or vitality > 0.05:
		_update_orbs()

	# Ambient border particles (stop spawning during exit)
	if not _exiting:
		_particle_timer -= delta
		if _particle_timer <= 0.0:
			_particle_timer = randf_range(0.04, 0.12)
			_spawn_border_particle()

# --- Orbiting orb system ---

func _update_orbs() -> void:
	var box_center := Vector2(BOX_WIDTH / 2.0, BOX_HEIGHT / 2.0)

	for i in range(ORB_COUNT):
		var t: float = (_orb_time / ORB_PERIOD) + float(i) / float(ORB_COUNT)
		var pos := _point_on_rounded_rect(t, Vector2(BOX_WIDTH, BOX_HEIGHT), ORB_CORNER_RADIUS, ORB_MARGIN)
		var draw_pos := pos + box_center

		_orb_nodes[i].position = draw_pos - Vector2(ORB_SIZE / 2.0, ORB_SIZE / 2.0)

		var pulse := 1.0 + 0.12 * sin(_orb_time * 3.0 + float(i) * 2.1)
		_orb_nodes[i].scale = Vector2(pulse, pulse)

		var trail: Array = _orb_trails[i]
		trail.push_front(draw_pos)
		if trail.size() > TRAIL_LENGTH:
			trail.resize(TRAIL_LENGTH)

		var dots: Array = _trail_nodes[i]
		for j in range(dots.size()):
			var dot: Sprite2D = dots[j]
			if j < trail.size():
				dot.visible = true
				dot.position = trail[j]
				var fade := 1.0 - float(j) / float(TRAIL_LENGTH)
				dot.modulate.a = fade * 0.4
				dot.scale = Vector2(fade * 1.2 + 0.3, fade * 1.2 + 0.3)
			else:
				dot.visible = false

func _point_on_rounded_rect(t: float, rect_size: Vector2, corner_r: float, margin: float) -> Vector2:
	var r := corner_r + margin
	var w := rect_size.x + margin * 2.0
	var h := rect_size.y + margin * 2.0

	var straight_h := w - 2.0 * r
	var straight_v := h - 2.0 * r
	var arc_len := PI * r / 2.0
	var perimeter := 2.0 * straight_h + 2.0 * straight_v + 4.0 * arc_len

	var d := fmod(t, 1.0) * perimeter
	if d < 0.0:
		d += perimeter

	var half_w := w / 2.0
	var half_h := h / 2.0

	if d < straight_h:
		return Vector2(-half_w + r + d, -half_h)
	d -= straight_h

	if d < arc_len:
		var angle := -PI / 2.0 + (d / arc_len) * (PI / 2.0)
		var center := Vector2(half_w - r, -half_h + r)
		return center + Vector2(cos(angle), sin(angle)) * r
	d -= arc_len

	if d < straight_v:
		return Vector2(half_w, -half_h + r + d)
	d -= straight_v

	if d < arc_len:
		var angle := 0.0 + (d / arc_len) * (PI / 2.0)
		var center := Vector2(half_w - r, half_h - r)
		return center + Vector2(cos(angle), sin(angle)) * r
	d -= arc_len

	if d < straight_h:
		return Vector2(half_w - r - d, half_h)
	d -= straight_h

	if d < arc_len:
		var angle := PI / 2.0 + (d / arc_len) * (PI / 2.0)
		var center := Vector2(-half_w + r, half_h - r)
		return center + Vector2(cos(angle), sin(angle)) * r
	d -= arc_len

	if d < straight_v:
		return Vector2(-half_w, half_h - r - d)
	d -= straight_v

	var angle := PI + (d / arc_len) * (PI / 2.0)
	var center := Vector2(-half_w + r, -half_h + r)
	return center + Vector2(cos(angle), sin(angle)) * r

# --- Particle effects (dynamic, can't be scene nodes) ---

func _spawn_entrance_particles() -> void:
	for i in range(28):
		var dot := _create_dot()
		_box.add_child(dot)

		var side := i % 4
		var t_val := randf()
		var pos := Vector2.ZERO
		match side:
			0: pos = Vector2(t_val * BOX_WIDTH, 0)
			1: pos = Vector2(t_val * BOX_WIDTH, BOX_HEIGHT)
			2: pos = Vector2(0, t_val * BOX_HEIGHT)
			3: pos = Vector2(BOX_WIDTH, t_val * BOX_HEIGHT)
		dot.position = pos

		var hue_shift := randf_range(-0.08, 0.08)
		dot.modulate = Color(
			0.45 + hue_shift + randf_range(0.0, 0.3),
			0.65 + randf_range(0.0, 0.2),
			1.0,
			0.85
		)
		dot.scale = Vector2(randf_range(0.6, 1.2), randf_range(0.6, 1.2))

		var dir := (pos - Vector2(BOX_WIDTH / 2.0, BOX_HEIGHT / 2.0)).normalized()
		var target := pos + dir * randf_range(40, 90)
		var dur := randf_range(0.5, 1.0)
		var delay := randf_range(0.0, 0.15)

		var tw := create_tween()
		tw.tween_interval(delay)
		tw.tween_property(dot, "position", target, dur).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
		tw.parallel().tween_property(dot, "modulate:a", 0.0, dur)
		tw.parallel().tween_property(dot, "scale", Vector2(0.15, 0.15), dur)
		tw.tween_callback(dot.queue_free)

func _spawn_ring_burst() -> void:
	var center := Vector2(BOX_WIDTH / 2.0, BOX_HEIGHT / 2.0)
	for i in range(20):
		var dot := _create_dot()
		_box.add_child(dot)
		dot.position = center
		dot.modulate = Color(0.6, 0.8, 1.0, 0.6)
		dot.scale = Vector2(0.5, 0.5)

		var angle := float(i) / 20.0 * TAU + randf_range(-0.15, 0.15)
		var dist := randf_range(60, 130)
		var target := center + Vector2(cos(angle), sin(angle)) * dist
		var dur := randf_range(0.4, 0.8)

		var tw := create_tween()
		tw.tween_property(dot, "position", target, dur).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CIRC)
		tw.parallel().tween_property(dot, "modulate:a", 0.0, dur)
		tw.parallel().tween_property(dot, "scale", Vector2(0.1, 0.1), dur)
		tw.tween_callback(dot.queue_free)

func _spawn_border_particle() -> void:
	var dot := _create_dot()
	_box.add_child(dot)

	var side := randi() % 4
	var t_val := randf()
	var pos := Vector2.ZERO
	match side:
		0: pos = Vector2(t_val * BOX_WIDTH, randf_range(-3, 3))
		1: pos = Vector2(t_val * BOX_WIDTH, BOX_HEIGHT + randf_range(-3, 3))
		2: pos = Vector2(randf_range(-3, 3), t_val * BOX_HEIGHT)
		3: pos = Vector2(BOX_WIDTH + randf_range(-3, 3), t_val * BOX_HEIGHT)
	dot.position = pos

	dot.modulate = Color(
		0.4 + randf_range(0.0, 0.35),
		0.6 + randf_range(0.0, 0.25),
		1.0,
		randf_range(0.4, 0.75)
	)

	var target := pos + Vector2(randf_range(-12, 12), randf_range(-25, -10))
	var dur := randf_range(0.4, 0.85)

	var tw := create_tween()
	tw.tween_property(dot, "position", target, dur).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	tw.parallel().tween_property(dot, "modulate:a", 0.0, dur)
	tw.tween_callback(dot.queue_free)

func _create_dot() -> Sprite2D:
	if _dot_tex == null:
		var img := Image.create(3, 3, false, Image.FORMAT_RGBA8)
		img.fill(Color.WHITE)
		_dot_tex = ImageTexture.create_from_image(img)
	var dot := Sprite2D.new()
	dot.texture = _dot_tex
	dot.modulate = Color(0.5, 0.75, 1.0, 0.7)
	dot.scale = Vector2(0.7, 0.7)
	return dot
