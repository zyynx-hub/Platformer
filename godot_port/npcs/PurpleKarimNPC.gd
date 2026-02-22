# PurpleKarimNPC.gd
# Quest giver on Town Street. All dialog logic driven by QuestManager + quest_purple_karim.json.

@tool
extends "res://npcs/WanderingNPC.gd"

func _get_active_dialog_id() -> String:
	return QuestManager.get_npc_dialog("purple_karim")

func _on_dialog_ended(ended_dialog_id: String) -> void:
	super._on_dialog_ended(ended_dialog_id)
	QuestManager.execute_dialog_end("purple_karim", ended_dialog_id, self)
