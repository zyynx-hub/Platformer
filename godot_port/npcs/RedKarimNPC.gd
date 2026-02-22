# RedKarimNPC.gd
# Quest giver in House 2. Dialog -> choice panel -> quest progression.

@tool
extends "res://npcs/NPC.gd"

var ChoicePanelScene = preload("res://ui/dialog/ChoicePanel.tscn")
var ItemAcquiredPopupScene = preload("res://ui/popup/ItemAcquiredPopup.tscn")

func _get_active_dialog_id() -> String:
	var progress := ProgressData.new()
	if progress.get_quest("quest_red_karim_complete"):
		return "level_town/red_karim/done"
	if progress.get_quest("quest_green_karim_confronted"):
		return "level_town/red_karim/complete"
	if progress.get_quest("quest_red_karim_accepted"):
		return "level_town/red_karim/waiting"
	return "level_town/red_karim/intro"

func _on_dialog_ended(ended_dialog_id: String) -> void:
	super._on_dialog_ended(ended_dialog_id)
	if ended_dialog_id == "level_town/red_karim/intro":
		# Wait for cinematic to finish, then show choice
		await get_tree().create_timer(0.5).timeout
		_show_quest_choice()
	elif ended_dialog_id == "level_town/red_karim/complete":
		var progress := ProgressData.new()
		progress.set_quest("quest_red_karim_complete")
		# Wait for cinematic, then show reward
		await get_tree().create_timer(0.5).timeout
		_show_reward()

func _show_quest_choice() -> void:
	var panel = ChoicePanelScene.instantiate()
	panel.setup("Will you help Red Karim?", ["Accept the quest", "Decline"])
	panel.choice_made.connect(_on_quest_choice)
	get_tree().current_scene.add_child(panel)

func _on_quest_choice(index: int) -> void:
	if index == 0:
		var progress := ProgressData.new()
		progress.set_quest("quest_red_karim_accepted")
		EventBus.dialog_requested.emit("level_town/red_karim/accept")
	else:
		EventBus.dialog_requested.emit("level_town/red_karim/decline")

func _show_reward() -> void:
	var popup = ItemAcquiredPopupScene.instantiate()
	popup.setup("Dildo", null)
	get_tree().current_scene.add_child(popup)
