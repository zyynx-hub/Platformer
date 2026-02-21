# GreenKarimNPC.gd
# Soldier in House 2. Conditional dialog based on quest state.

extends "res://npcs/NPC.gd"

func _get_active_dialog_id() -> String:
	var progress := ProgressData.new()
	if progress.get_quest("quest_red_karim_complete"):
		return "level_town/green_karim/reformed"
	if progress.get_quest("quest_red_karim_accepted") and not progress.get_quest("quest_green_karim_confronted"):
		return "level_town/green_karim/confronted"
	return "level_town/green_karim/default"

func _on_dialog_ended(ended_dialog_id: String) -> void:
	super._on_dialog_ended(ended_dialog_id)
	if ended_dialog_id == "level_town/green_karim/confronted":
		var progress := ProgressData.new()
		progress.set_quest("quest_green_karim_confronted")
