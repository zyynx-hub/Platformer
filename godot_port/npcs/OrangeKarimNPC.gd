# OrangeKarimNPC.gd
# Orange Karim — tech-bro in Jungle House Interior.
# Manual dialog selection (like BlueKarimNPC) because it needs to check
# player's equipped item (rocket_boots) which JSON requires can't handle.
# Quest: De Butt Plug Quest (quest_orange_karim).

@tool
extends "res://npcs/NPC.gd"

func _get_active_dialog_id() -> String:
	var pd := ProgressData.new()

	if pd.get_quest("quest_exodia_complete"):
		return "level_jungle/orange_karim/post_exodia"
	if pd.get_quest("quest_orange_karim_complete"):
		return "level_jungle/orange_karim/done"
	if pd.get_quest("quest_orange_karim_active"):
		if _player_has_rocket_boots():
			return "level_jungle/orange_karim/complete"
		return "level_jungle/orange_karim/waiting"
	if pd.get_quest("quest_red_karim_complete"):
		return "level_jungle/orange_karim/intro"
	return "level_jungle/orange_karim/not_ready"

func _on_dialog_ended(ended_dialog_id: String) -> void:
	super._on_dialog_ended(ended_dialog_id)
	var pd := ProgressData.new()

	if ended_dialog_id == "level_jungle/orange_karim/intro":
		pd.set_quest("quest_orange_karim_active")

	elif ended_dialog_id == "level_jungle/orange_karim/complete":
		pd.set_quest("quest_orange_karim_complete")
		# Show Butt Plug reward popup after short delay
		var popup_scene := preload("res://ui/popup/ItemAcquiredPopup.tscn")
		var cb := func():
			var popup = popup_scene.instantiate()
			var item_def := ItemDefs.get_item("buttplug")
			var icon: Texture2D = null
			if not item_def.is_empty() and item_def.has("icon_path"):
				icon = load(item_def["icon_path"])
			popup.setup("Butt Plug", icon)
			get_tree().current_scene.add_child(popup)
		get_tree().create_timer(0.5).timeout.connect(cb, CONNECT_ONE_SHOT)

func _player_has_rocket_boots() -> bool:
	var player := _get_player()
	if player and player.get("_equipped_item_id") != null:
		return player._equipped_item_id == "rocket_boots"
	return false
