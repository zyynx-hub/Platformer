# RedKarimNPC.gd
# Quest giver in House 2. All dialog logic driven by QuestManager + quest_red_karim.json.

@tool
extends "res://npcs/NPC.gd"

func _get_active_dialog_id() -> String:
	return QuestManager.get_npc_dialog("red_karim")

func _on_dialog_ended(ended_dialog_id: String) -> void:
	super._on_dialog_ended(ended_dialog_id)
	QuestManager.execute_dialog_end("red_karim", ended_dialog_id, self)
