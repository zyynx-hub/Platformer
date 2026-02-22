@tool
# QuestLogScene.gd
# Quest log overlay — shows all quests with status, reward, narrative description
# Opens with Q key (quest_log action) from anywhere, or via EventBus.quest_log_requested
# Always-processing so it works even when game tree is paused

extends CanvasLayer

@onready var _quest_list: VBoxContainer = %QuestList

var _was_paused: bool = false


func _ready() -> void:
	visible = false
	if Engine.is_editor_hint():
		return
	EventBus.quest_log_requested.connect(_open)


func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event.is_action_pressed("quest_log"):
		if visible:
			_close()
		else:
			_open()
		get_viewport().set_input_as_handled()
	elif visible and event.is_action_pressed("ui_cancel"):
		_close()
		get_viewport().set_input_as_handled()


func _open() -> void:
	_was_paused = get_tree().paused
	if not _was_paused:
		get_tree().paused = true
	_build_entries()
	visible = true


func _close() -> void:
	visible = false
	if not _was_paused:
		get_tree().paused = false


func _build_entries() -> void:
	for child in _quest_list.get_children():
		child.queue_free()
	var pd := ProgressData.new()
	for quest in QuestDefs.ALL:
		_add_quest_entry(quest, pd)


func _add_quest_entry(quest: Dictionary, pd: ProgressData) -> void:
	var is_complete := pd.get_quest(quest["complete_key"])
	var is_active   := pd.get_quest(quest["active_key"])

	var status_text: String
	var status_color: Color
	if is_complete:
		status_text  = "COMPLETED"
		status_color = Color(0.3, 1.0, 0.4)
	elif is_active:
		status_text  = "ACTIVE"
		status_color = Color(1.0, 0.8, 0.2)
	else:
		status_text  = "INACTIVE"
		status_color = Color(0.55, 0.55, 0.55)

	# --- Entry container ---
	var entry := VBoxContainer.new()
	entry.add_theme_constant_override("separation", 4)
	_quest_list.add_child(entry)

	# Row: name + status badge
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	entry.add_child(row)

	var name_label := Label.new()
	name_label.text = quest["name"]
	name_label.add_theme_font_size_override("font_size", 20)
	name_label.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0, 0.95))
	name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(name_label)

	var status_label := Label.new()
	status_label.text = status_text
	status_label.add_theme_font_size_override("font_size", 14)
	status_label.add_theme_color_override("font_color", status_color)
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(status_label)

	# Reward line
	var reward_label := Label.new()
	reward_label.text = "Reward: " + quest["reward"]
	reward_label.add_theme_font_size_override("font_size", 13)
	reward_label.add_theme_color_override("font_color", Color(0.85, 0.85, 0.7, 0.8))
	entry.add_child(reward_label)

	# Narrative description
	var desc_label := Label.new()
	desc_label.text = quest["description"]
	desc_label.add_theme_font_size_override("font_size", 13)
	desc_label.add_theme_color_override("font_color", Color(0.75, 0.75, 0.85, 0.9))
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.custom_minimum_size = Vector2(0, 0)
	entry.add_child(desc_label)

	# Separator
	var sep := HSeparator.new()
	sep.add_theme_constant_override("separation", 8)
	_quest_list.add_child(sep)
