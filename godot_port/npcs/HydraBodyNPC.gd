# HydraBodyNPC.gd
# One of three Hydra Bodies. Says "..." once, then fades away permanently.
# state_key set in Inspector per body instance (hydra_body_1_gone / 2 / 3).

@tool
extends "res://npcs/WanderingNPC.gd"

@export var state_key: String = "hydra_body_1_gone"


func _ready() -> void:
	var pd := ProgressData.new()
	if pd.get_quest(state_key):
		queue_free()
		return
	super._ready()


func _on_dialog_ended(ended_dialog_id: String) -> void:
	if ended_dialog_id == dialog_id:
		_fade_and_vanish()
	else:
		super._on_dialog_ended(ended_dialog_id)


func _fade_and_vanish() -> void:
	_interacting = false
	ProgressData.new().set_quest(state_key)
	var tween := create_tween()
	tween.set_ease(Tween.EASE_IN)
	tween.tween_property(self, "modulate:a", 0.0, 1.2)
	tween.tween_callback(queue_free)
