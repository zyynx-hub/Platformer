# PurpleKarimNPC.gd
# Purple Karim — quest giver for "Purple Karim's Debt"
# Auto-accepts quest after intro dialog (no choice panel)
# Delivers Vibrator reward after three_headed_karim_paid = true

@tool
extends "res://npcs/WanderingNPC.gd"

var ItemAcquiredPopupScene = preload("res://ui/popup/ItemAcquiredPopup.tscn")


func _get_active_dialog_id() -> String:
	var pd := ProgressData.new()
	if pd.get_quest("quest_purple_karim_complete"):
		return "level_town/purple_karim/done"
	if pd.get_quest("three_headed_karim_paid"):
		return "level_town/purple_karim/complete"
	if pd.get_quest("quest_purple_karim_active"):
		return "level_town/purple_karim/waiting"
	return "level_town/purple_karim/intro"


func _on_dialog_ended(ended_dialog_id: String) -> void:
	super._on_dialog_ended(ended_dialog_id)
	var pd := ProgressData.new()
	if ended_dialog_id == "level_town/purple_karim/intro":
		# Auto-accept: no choice panel, quest starts immediately
		pd.set_quest("quest_purple_karim_active")
	elif ended_dialog_id == "level_town/purple_karim/complete":
		pd.set_quest("quest_purple_karim_complete")
		await get_tree().create_timer(0.5).timeout
		_show_reward()


func _show_reward() -> void:
	var popup = ItemAcquiredPopupScene.instantiate()
	popup.setup("Vibrator", null)
	get_tree().current_scene.add_child(popup)
