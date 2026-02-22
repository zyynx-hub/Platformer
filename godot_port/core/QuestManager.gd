# QuestManager.gd
# Autoload: loads all data/quests/*.json and drives NPC dialog selection + post-dialog actions.
# Replaces hardcoded quest logic in individual NPC scripts.
#
# API:
#   QuestManager.get_npc_dialog(npc_id)              -> String  (dialog ID to play)
#   QuestManager.execute_dialog_end(npc_id, dialog_id, npc_node) -> void
#   QuestManager.should_remove_npc(npc_id)           -> bool    (true = NPC faded + gone)
#   QuestManager.get_all_quests()                    -> Array   (for QuestLogScene)
#   QuestManager.is_quest_active(quest_id)           -> bool
#   QuestManager.is_quest_complete(quest_id)         -> bool

extends Node

const _ChoicePanel := preload("res://ui/dialog/ChoicePanel.tscn")
const _ItemPopup   := preload("res://ui/popup/ItemAcquiredPopup.tscn")

var _quests: Dictionary = {}  # quest_id -> data dict

# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

func _ready() -> void:
	_load_quests()


func _load_quests() -> void:
	var dir := DirAccess.open("res://data/quests/")
	if not dir:
		push_error("QuestManager: could not open res://data/quests/")
		return
	dir.list_dir_begin()
	var fname := dir.get_next()
	while fname != "":
		if not dir.current_is_dir() and fname.ends_with(".json"):
			var path := "res://data/quests/" + fname
			var text := FileAccess.get_file_as_string(path)
			var data = JSON.parse_string(text)
			if data == null:
				push_error("QuestManager: failed to parse %s" % path)
			else:
				_quests[data["id"]] = data
		fname = dir.get_next()
	dir.list_dir_end()

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

## Returns the dialog ID the NPC should play given current quest state.
## Evaluates dialog_selection rules in order — first match wins.
## Returns "" if npc_id is not found in any quest.
func get_npc_dialog(npc_id: String) -> String:
	var pd := ProgressData.new()
	for quest in _quests.values():
		var npc_data = quest.get("npcs", {}).get(npc_id)
		if npc_data == null:
			continue
		for entry in npc_data.get("dialog_selection", []):
			if _check_requires(entry.get("requires", {}), pd):
				return entry.get("dialog", "")
	return ""


## Executes all on_dialog_end actions for a given NPC + dialog combination.
## npc_node is the NPC scene instance (used for fade_and_remove, popup parenting).
func execute_dialog_end(npc_id: String, dialog_id: String, npc_node: Node) -> void:
	for quest in _quests.values():
		var npc_data = quest.get("npcs", {}).get(npc_id)
		if npc_data == null:
			continue
		var on_end: Dictionary = npc_data.get("on_dialog_end", {})
		if dialog_id in on_end:
			_run_actions(on_end[dialog_id], npc_node)
			return


## Returns true if this NPC should be immediately removed on scene load
## (i.e. it has a fade_and_remove action whose preceding set_key is already true).
func should_remove_npc(npc_id: String) -> bool:
	var pd := ProgressData.new()
	for quest in _quests.values():
		var npc_data = quest.get("npcs", {}).get(npc_id)
		if npc_data == null:
			continue
		for actions in npc_data.get("on_dialog_end", {}).values():
			for action in actions:
				if action.get("action") == "fade_and_remove":
					# The set_key in the same action list is the removal flag
					for a2 in actions:
						if a2.get("action") == "set_key":
							return pd.get_quest(a2["key"])
	return false


## Returns all quests (type == "quest") as an array of dicts.
## Used by QuestLogScene to list quest status.
func get_all_quests() -> Array:
	var result := []
	for quest in _quests.values():
		if quest.get("type") == "quest":
			result.append(quest)
	return result


func is_quest_active(quest_id: String) -> bool:
	var q = _quests.get(quest_id)
	if q == null:
		return false
	var active_key: String = q.get("active_key", "")
	var complete_key: String = q.get("complete_key", "")
	if active_key.is_empty():
		return false
	var pd := ProgressData.new()
	return pd.get_quest(active_key) and not pd.get_quest(complete_key)


func is_quest_complete(quest_id: String) -> bool:
	var q = _quests.get(quest_id)
	if q == null:
		return false
	var complete_key: String = q.get("complete_key", "")
	if complete_key.is_empty():
		return false
	return ProgressData.new().get_quest(complete_key)

# ---------------------------------------------------------------------------
# Internal — condition checking
# ---------------------------------------------------------------------------

func _check_requires(requires: Dictionary, pd: ProgressData) -> bool:
	for key in requires:
		if pd.get_quest(key) != requires[key]:
			return false
	return true

# ---------------------------------------------------------------------------
# Internal — action execution
# ---------------------------------------------------------------------------

func _run_actions(actions: Array, npc_node: Node) -> void:
	for action in actions:
		_run_action(action, npc_node)


func _run_action(action: Dictionary, npc_node: Node) -> void:
	var act: String = action.get("action", "")
	match act:

		"set_key":
			ProgressData.new().set_quest(action["key"])

		"play_dialog":
			EventBus.dialog_requested.emit(action["dialog"])

		"item_popup":
			var item_id: String = action["item_id"]
			var delay: float = action.get("delay", 0.0)
			if delay > 0.0:
				var cb := func(): _show_item_popup(item_id, npc_node)
				get_tree().create_timer(delay).timeout.connect(cb, CONNECT_ONE_SHOT)
			else:
				_show_item_popup(item_id, npc_node)

		"choice_panel":
			var delay: float = action.get("delay", 0.0)
			var captured := action.duplicate()
			if delay > 0.0:
				var cb := func(): _show_choice_panel(captured, npc_node)
				get_tree().create_timer(delay).timeout.connect(cb, CONNECT_ONE_SHOT)
			else:
				_show_choice_panel(action, npc_node)

		"fade_and_remove":
			var duration: float = action.get("duration", 1.0)
			var slide_x: float = action.get("slide_x", 0.0)
			if npc_node.has_method("_do_fade_and_remove"):
				npc_node._do_fade_and_remove(duration, slide_x)
			else:
				push_warning("QuestManager: NPC '%s' has no _do_fade_and_remove" % npc_node.name)

		_:
			push_warning("QuestManager: unknown action '%s'" % act)


func _show_item_popup(item_id: String, npc_node: Node) -> void:
	var popup = _ItemPopup.instantiate()
	popup.setup(item_id, null)
	npc_node.get_tree().current_scene.add_child(popup)


func _show_choice_panel(action: Dictionary, npc_node: Node) -> void:
	var panel = _ChoicePanel.instantiate()
	panel.setup(action["prompt"], action["choices"])
	var on_choice := func(index: int):
		if index == 0:
			_run_actions(action.get("on_accept", []), npc_node)
		else:
			_run_actions(action.get("on_decline", []), npc_node)
	panel.choice_made.connect(on_choice, CONNECT_ONE_SHOT)
	npc_node.get_tree().current_scene.add_child(panel)
