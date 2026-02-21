# BrownKarimNPC.gd
# Spooky NPC — says "...", then runs offscreen and vanishes permanently.
# Extends WanderingNPC for idle wandering before interaction.

extends "res://npcs/WanderingNPC.gd"

func _ready() -> void:
	super._ready()
	if Engine.is_editor_hint():
		return
	var progress := ProgressData.new()
	if progress.get_quest("brown_karim_vanished"):
		queue_free()

func _on_dialog_ended(ended_dialog_id: String) -> void:
	if ended_dialog_id == "level_town/brown_karim/spooky":
		# Custom sequence — don't reset interacting
		_spooky_vanish()
	else:
		super._on_dialog_ended(ended_dialog_id)

func _spooky_vanish() -> void:
	# Duck music for eerie silence
	AudioManager.duck_music(-80.0, 0.3)

	# Brief pause beat
	await get_tree().create_timer(0.5).timeout

	# Tween offscreen (accelerating to the right)
	var move_tween := create_tween()
	move_tween.set_ease(Tween.EASE_IN)
	move_tween.set_trans(Tween.TRANS_QUAD)
	move_tween.tween_property(self, "position:x", position.x + 200.0, 1.5)

	# Fade out simultaneously
	var fade_tween := create_tween()
	fade_tween.tween_property(self, "modulate:a", 0.0, 1.5)

	await move_tween.finished

	# Mark as permanently vanished
	var progress := ProgressData.new()
	progress.set_quest("brown_karim_vanished")

	# Restore music
	AudioManager.unduck_music(0.5)

	queue_free()
