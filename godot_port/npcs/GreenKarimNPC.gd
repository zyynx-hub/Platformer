# GreenKarimNPC.gd
# Soldier in House 2. All dialog logic driven by QuestManager + quest_red_karim.json.

@tool
extends "res://npcs/NPC.gd"

func _get_active_dialog_id() -> String:
	return QuestManager.get_npc_dialog("green_karim")

func _on_dialog_ended(ended_dialog_id: String) -> void:
	super._on_dialog_ended(ended_dialog_id)
	QuestManager.execute_dialog_end("green_karim", ended_dialog_id, self)
