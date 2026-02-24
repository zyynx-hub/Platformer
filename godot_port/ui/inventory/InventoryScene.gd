@tool
# InventoryScene.gd
# Inventory overlay — shows collected items in two sections:
#   1. Useables  (Rocket Boots)
#   2. Quest Items (Dildo, Vibrator, Buttplug)
# Opens/closes with [I] key. Always-processing so it works when game is paused.

extends CanvasLayer

@onready var _useables_grid: HBoxContainer = %UseablesGrid
@onready var _quest_grid: HBoxContainer = %QuestGrid

var _was_paused: bool = false

# Maps quest complete key -> item_id for quest item detection
const _QUEST_ITEMS := [
	{ "item_id": "dildo",    "complete_key": "quest_red_karim_complete" },
	{ "item_id": "vibrator", "complete_key": "quest_purple_karim_complete" },
	{ "item_id": "buttplug", "complete_key": "quest_orange_karim_complete" },
]


func _ready() -> void:
	visible = false
	if Engine.is_editor_hint():
		return


func _input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event.is_action_pressed("inventory"):
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
	_populate()
	visible = true


func _close() -> void:
	visible = false
	if not _was_paused:
		get_tree().paused = false


func _populate() -> void:
	# Clear previous entries
	for child in _useables_grid.get_children():
		child.queue_free()
	for child in _quest_grid.get_children():
		child.queue_free()

	var pd := ProgressData.new()

	# --- Useables: Rocket Boots ---
	var has_boots := pd.equipped_item == "rocket_boots"
	_add_item_slot(_useables_grid, "rocket_boots", has_boots)

	# --- Quest Items ---
	var any_quest_item := false
	for entry in _QUEST_ITEMS:
		var owned: bool = pd.get_quest(entry["complete_key"])
		if owned:
			_add_item_slot(_quest_grid, entry["item_id"], true)
			any_quest_item = true

	if not any_quest_item:
		var empty_label := Label.new()
		empty_label.text = "None yet"
		empty_label.add_theme_font_size_override("font_size", 14)
		empty_label.add_theme_color_override("font_color", Color(0.55, 0.55, 0.65, 0.8))
		_quest_grid.add_child(empty_label)


func _add_item_slot(container: HBoxContainer, item_id: String, owned: bool) -> void:
	var item_def := ItemDefs.get_item(item_id)
	if item_def.is_empty():
		return

	var slot := VBoxContainer.new()
	slot.add_theme_constant_override("separation", 4)
	slot.custom_minimum_size = Vector2(72, 88)
	container.add_child(slot)

	# Icon frame
	var frame := PanelContainer.new()
	frame.custom_minimum_size = Vector2(64, 64)
	frame.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	slot.add_child(frame)

	var icon := TextureRect.new()
	icon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	icon.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.custom_minimum_size = Vector2(56, 56)
	icon.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER

	if owned and item_def.has("icon_path"):
		var tex = load(item_def["icon_path"])
		if tex:
			icon.texture = tex
		icon.modulate = Color(1, 1, 1, 1)
	else:
		# Greyed-out slot (not yet obtained)
		icon.modulate = Color(0.3, 0.3, 0.35, 0.5)

	frame.add_child(icon)

	# Name label
	var name_label := Label.new()
	name_label.text = item_def.get("name", item_id)
	name_label.add_theme_font_size_override("font_size", 11)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if owned:
		name_label.add_theme_color_override("font_color", Color(0.9, 0.9, 1.0, 1.0))
	else:
		name_label.add_theme_color_override("font_color", Color(0.45, 0.45, 0.5, 0.7))
	slot.add_child(name_label)
