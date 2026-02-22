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


func _fade_and_leave() -> void:
	_interacting = false
	ProgressData.new().set_quest("three_headed_karim_paid")
	var tween := create_tween()
	tween.set_ease(Tween.EASE_IN)
	tween.tween_property(self, "modulate:a", 0.0, 1.5)
	tween.tween_callback(queue_free)
