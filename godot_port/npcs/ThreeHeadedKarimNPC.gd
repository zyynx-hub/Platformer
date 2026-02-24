# ThreeHeadedKarimNPC.gd
# The merged form of the three Hydra Bodies. Appears when all three bodies are gone.
# After its dialogue, fades away and marks three_headed_karim_paid.

@tool
extends "res://npcs/WanderingNPC.gd"


func _ready() -> void:
	var pd := ProgressData.new()
	if pd.get_quest("three_headed_karim_paid"):
		queue_free()
		return
	super._ready()


func _on_dialog_ended(ended_dialog_id: String) -> void:
	if ended_dialog_id == "level_jungle/three_headed_karim/encounter":
		_fade_and_leave()
	else:
		super._on_dialog_ended(ended_dialog_id)


var _dot_tex: ImageTexture = null


func _fade_and_leave() -> void:
	_interacting = false

	# Phase 1: Duck music for reverence
	AudioManager.duck_music(-18.0, 0.5)

	# Phase 2: Brief dramatic pause
	await get_tree().create_timer(0.3).timeout

	# Phase 3: Spawn upward-rising golden sparkle particles
	_spawn_heavenly_particles()

	# Phase 4: Heavenly ascent — float up, scale up, fade out
	var tween := create_tween()
	tween.set_parallel(true)
	tween.set_ease(Tween.EASE_IN)
	tween.set_trans(Tween.TRANS_QUAD)
	tween.tween_property(self, "position:y", position.y - 120.0, 2.0)
	tween.tween_property(self, "scale", Vector2(1.6, 1.6), 2.0).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_SINE)
	tween.tween_property(self, "modulate:a", 0.0, 2.0)
	tween.set_parallel(false)

	await tween.finished

	# Phase 5: Mark quest state, restore music, and clean up
	ProgressData.new().set_quest("three_headed_karim_paid")
	AudioManager.unduck_music(0.5)
	queue_free()


func _spawn_heavenly_particles() -> void:
	for i in range(12):
		var dot := _create_heavenly_dot()
		# Add to parent so particles persist after NPC is freed
		get_parent().add_child(dot)
		dot.global_position = global_position + Vector2(randf_range(-12, 12), randf_range(-20, 5))

		# Gold/white color variation
		var gold := randf_range(0.7, 1.0)
		dot.modulate = Color(1.0, gold, gold * 0.4, 0.9)

		# Match NPC ascent: 120px rise in 2.0s, with slight variation
		var delay := randf_range(0.0, 0.6)
		var rise_dur := 2.0
		var drift_x := randf_range(-15, 15)
		var rise_y := -120.0 + randf_range(-20, 20)
		var start_pos := dot.position

		# Tween bound to the dot itself so it survives NPC queue_free
		var tw := dot.create_tween()
		tw.tween_interval(delay)
		var move_fn := func(t: float) -> void:
			dot.position = Vector2(
				start_pos.x + sin(t * PI * 2.0) * drift_x * 0.3 + drift_x * t,
				start_pos.y + rise_y * t
			)
			dot.modulate.a = sin(t * PI) * 0.9 + 0.1
			var s := 1.0 + sin(t * PI * 1.5) * 0.3
			dot.scale = Vector2(s, s)
		tw.tween_method(move_fn, 0.0, 1.0, rise_dur)
		tw.tween_callback(dot.queue_free)


func _create_heavenly_dot() -> Sprite2D:
	if _dot_tex == null:
		var img := Image.create(3, 3, false, Image.FORMAT_RGBA8)
		img.fill(Color.WHITE)
		_dot_tex = ImageTexture.create_from_image(img)
	var dot := Sprite2D.new()
	dot.texture = _dot_tex
	dot.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	return dot
