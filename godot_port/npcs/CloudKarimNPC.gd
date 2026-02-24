# CloudKarimNPC.gd
# Cloud Karim — mystical guide in the Mystical Realm.
# Manual dialog selection (like OrangeKarimNPC) because it handles:
#   - Pedestal item placement detection
#   - Dynamic ChoicePanel tip filtering (only unplaced items)
#   - Boss cutscene trigger when all 3 items placed
# Quest: The Grand Quest of Exodia Karim (quest_exodia_karim).

@tool
extends "res://npcs/NPC.gd"

const _ChoicePanel := preload("res://ui/dialog/ChoicePanel.tscn")

## Items that can be placed on the pedestal.
## Each entry maps: quest_complete_key -> pedestal_key
const PEDESTAL_ITEMS := {
	"quest_red_karim_complete": {
		"pedestal_key": "pedestal_dildo",
		"name": "Dildo",
		"tip_dialog": "level_mystical/cloud_karim/tip_dildo",
	},
	"quest_purple_karim_complete": {
		"pedestal_key": "pedestal_vibrator",
		"name": "Vibrator",
		"tip_dialog": "level_mystical/cloud_karim/tip_vibrator",
	},
	"quest_orange_karim_complete": {
		"pedestal_key": "pedestal_butt_plug",
		"name": "Butt Plug",
		"tip_dialog": "level_mystical/cloud_karim/tip_butt_plug",
	},
}


var _bob_time: float = 0.0
var _base_y: float = 0.0
var _in_tip_flow: bool = false
const BOB_SPEED := 1.8
const BOB_AMOUNT := 2.0


func _ready() -> void:
	_base_y = position.y
	if Engine.is_editor_hint():
		return
	var pd := ProgressData.new()
	# Cloud Karim is permanently gone after Exodia quest completes
	if pd.get_quest("quest_exodia_complete"):
		queue_free()
		return
	super._ready()


func _process(delta: float) -> void:
	super._process(delta)
	# Gentle floating bob on the whole NPC
	_bob_time += delta
	position.y = _base_y + sin(_bob_time * BOB_SPEED) * BOB_AMOUNT


func _interact() -> void:
	_interacting = true
	var player := _get_player()
	if not player:
		_interacting = false
		return

	# Pan camera to midpoint between player and Cloud Karim for full overview
	var midpoint := (global_position + player.global_position) / 2.0
	midpoint.y -= 30
	EventBus.camera_pan_requested.emit(midpoint, 0.5, 0.5, 0.5)
	await get_tree().create_timer(0.5).timeout

	var active_id := _get_active_dialog_id()
	if active_id.is_empty():
		_interacting = false
		return

	if not DialogDefs.has_dialog(active_id):
		push_warning("NPC '%s': dialog '%s' not found" % [npc_name, active_id])
		_interacting = false
		return

	if DialogDefs.is_one_shot(active_id):
		var progress := ProgressData.new()
		if progress.is_dialog_seen(active_id):
			_interacting = false
			return
		progress.mark_dialog_seen(active_id)

	EventBus.dialog_requested.emit(active_id)


func _get_active_dialog_id() -> String:
	var pd := ProgressData.new()

	# All 3 placed and quest not yet complete -> trigger boss cutscene
	if _all_pedestals_placed(pd) and not pd.get_quest("quest_exodia_complete"):
		return "level_mystical/cloud_karim/all_placed"

	# Quest active -> offer tips or handle item placement
	if pd.get_quest("quest_exodia_active"):
		# Check if player has unplaced items to auto-place
		var placeable := _get_placeable_items(pd)
		if not placeable.is_empty():
			return "level_mystical/cloud_karim/item_placed"
		# No items to place -> offer tips
		return "level_mystical/cloud_karim/tip_menu"

	# First meeting -> intro
	return "level_mystical/cloud_karim/intro"


func _on_dialog_ended(ended_dialog_id: String) -> void:
	var pd := ProgressData.new()

	# Tip menu → show ChoicePanel, keep _interacting true to block re-interact
	if ended_dialog_id == "level_mystical/cloud_karim/tip_menu":
		_in_tip_flow = true
		_show_tip_choice(pd)
		return

	# Tip dialog finished → end the tip flow
	if _in_tip_flow and ended_dialog_id.begins_with("level_mystical/cloud_karim/tip_"):
		_in_tip_flow = false
		_interacting = false
		_interact_cooldown = 0.5
		return

	super._on_dialog_ended(ended_dialog_id)

	if ended_dialog_id == "level_mystical/cloud_karim/intro":
		pd.set_quest("quest_exodia_active")

	elif ended_dialog_id == "level_mystical/cloud_karim/item_placed":
		# Place the first available item on the pedestal
		var placeable := _get_placeable_items(pd)
		if not placeable.is_empty():
			var item = placeable[0]
			pd.set_quest(item["pedestal_key"])

	elif ended_dialog_id == "level_mystical/cloud_karim/all_placed":
		# MysticalLevelController listens for this dialog end and runs the cutscene
		pass


func _show_tip_choice(pd: ProgressData) -> void:
	var unplaced := _get_unplaced_items(pd)
	if unplaced.is_empty():
		return

	var option_names: Array = []
	var option_dialogs: Array = []
	for item in unplaced:
		option_names.append(item["name"])
		option_dialogs.append(item["tip_dialog"])

	var panel = _ChoicePanel.instantiate()
	panel.setup("Over welk object wil je een tip?", option_names)
	var on_choice := func(index: int):
		if index >= 0 and index < option_dialogs.size():
			_start_centered_dialog(option_dialogs[index])
	panel.choice_made.connect(on_choice, CONNECT_ONE_SHOT)
	get_tree().current_scene.add_child(panel)


func _start_centered_dialog(dialog_id: String) -> void:
	var player := _get_player()
	if player:
		var midpoint := (global_position + player.global_position) / 2.0
		midpoint.y -= 30
		EventBus.camera_pan_requested.emit(midpoint, 0.5, 0.5, 0.5)
		await get_tree().create_timer(0.5).timeout
	EventBus.dialog_requested.emit(dialog_id)


## Items the player has obtained (quest complete) but not yet placed on pedestal.
func _get_placeable_items(pd: ProgressData) -> Array:
	var result := []
	for quest_key in PEDESTAL_ITEMS:
		var item = PEDESTAL_ITEMS[quest_key]
		if pd.get_quest(quest_key) and not pd.get_quest(item["pedestal_key"]):
			result.append(item)
	return result


## Items not yet placed on the pedestal (regardless of whether player has them).
func _get_unplaced_items(pd: ProgressData) -> Array:
	var result := []
	for quest_key in PEDESTAL_ITEMS:
		var item = PEDESTAL_ITEMS[quest_key]
		if not pd.get_quest(item["pedestal_key"]):
			result.append(item)
	return result


func _all_pedestals_placed(pd: ProgressData) -> bool:
	return (
		pd.get_quest("pedestal_butt_plug") and
		pd.get_quest("pedestal_dildo") and
		pd.get_quest("pedestal_vibrator")
	)
