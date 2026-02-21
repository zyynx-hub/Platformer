# SubMenuTheme.gd
# Shared runtime utilities for sub-menu scenes (Options, Extras, LevelSelect, Pause).
# Visual styling is handled by NightSkyTheme.tres — this file only provides:
#   - Firefly particles (runtime-only, cannot be in .tscn)
#   - Button focus/hover effects (animation tweens)
#   - Entrance animations (tweens)
class_name SubMenuTheme


# --- Particles (runtime only) ------------------------------------------------

## Create firefly particles and add to scene. Call at runtime only (not in editor).
static func create_particles(parent: Control) -> GPUParticles2D:
	var particles := GPUParticles2D.new()
	particles.name = "Particles"
	particles.position = Vector2(640, 360)
	_configure_particles(particles)
	parent.add_child(particles)
	return particles


static func _configure_particles(p: GPUParticles2D) -> void:
	var mat := ParticleProcessMaterial.new()
	mat.particle_flag_disable_z = true
	mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	mat.emission_box_extents = Vector3(640, 360, 1)
	mat.direction = Vector3(0, -1, 0)
	mat.initial_velocity_min = 8.0
	mat.initial_velocity_max = 20.0
	mat.gravity = Vector3(0, -15, 0)
	mat.spread = 90.0
	mat.angular_velocity_min = -10.0
	mat.angular_velocity_max = 10.0
	mat.scale_min = 0.5
	mat.scale_max = 1.5
	mat.color = Color(0.6, 0.7, 1.0, 0.4)

	var gradient := Gradient.new()
	gradient.colors = PackedColorArray([
		Color(0.4, 0.5, 0.9, 0),
		Color(0.6, 0.7, 1.0, 0.8),
		Color(0.7, 0.8, 1.0, 0.6),
		Color(0.5, 0.6, 0.9, 0),
	])
	gradient.offsets = PackedFloat32Array([0.0, 0.15, 0.7, 1.0])
	var color_ramp := GradientTexture1D.new()
	color_ramp.gradient = gradient
	mat.color_ramp = color_ramp

	p.process_material = mat
	p.amount = 35
	p.lifetime = 5.0
	p.visibility_rect = Rect2(-640, -360, 1280, 720)


# --- Button Focus Effects ----------------------------------------------------

## Connect hover/focus effects (scale bump + tick SFX) to a button.
static func connect_button_focus(scene: Control, btn: Button) -> void:
	btn.focus_entered.connect(func():
		EventBus.sfx_play.emit("ui_tick", 0.0)
		btn.pivot_offset = btn.size / 2.0
		var tw := scene.create_tween()
		tw.tween_property(btn, "scale", Vector2(1.06, 1.06), 0.12) \
			.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	)
	btn.focus_exited.connect(func():
		var tw := scene.create_tween()
		tw.tween_property(btn, "scale", Vector2.ONE, 0.12) \
			.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	)
	btn.mouse_entered.connect(func():
		btn.grab_focus()
	)


# --- Entrance Animation ------------------------------------------------------

## Play entrance animation: title slides from left with bounce, content fades, buttons slide up from below.
static func play_entrance(scene: Control, title: Label, content: Control, buttons: Array) -> void:
	var tween := scene.create_tween()

	# Title: slide from left with bounce
	if title:
		title.pivot_offset = title.size / 2.0
		var target_left: float = title.offset_left
		title.offset_left = -300.0
		title.modulate.a = 0.0
		tween.tween_property(title, "offset_left", target_left, 0.5) \
			.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
		tween.parallel().tween_property(title, "modulate:a", 1.0, 0.35)

	# Content: quick fade in
	if content:
		content.modulate.a = 0.0
		tween.parallel().tween_property(content, "modulate:a", 1.0, 0.3) \
			.set_delay(0.08)

	# Buttons: slide up from below with bounce
	for i in range(buttons.size()):
		if not buttons[i]:
			continue
		var btn: Button = buttons[i]
		var orig_y: float = btn.position.y
		btn.position.y = orig_y + 60.0
		btn.modulate.a = 0.0
		var delay := 0.15 + i * 0.08
		tween.parallel().tween_property(btn, "position:y", orig_y, 0.4) \
			.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK).set_delay(delay)
		tween.parallel().tween_property(btn, "modulate:a", 1.0, 0.3) \
			.set_delay(delay)
