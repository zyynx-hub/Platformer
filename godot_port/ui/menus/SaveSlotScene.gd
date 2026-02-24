# SaveSlotScene.gd
# Save slot selection screen — 3 slots, create/load/delete saves.

extends Control

const SCENE_MENU := "res://ui/menus/MenuScene.tscn"
const SCENE_LEVEL_SELECT := "res://ui/menus/LevelSelectScene.tscn"

@onready var title_label: Label = %TitleLabel
@onready var slot_container: HBoxContainer = %SlotContainer
@onready var back_button: Button = %BackButton
@onready var confirm_panel: PanelContainer = %ConfirmPanel
@onready var confirm_label: Label = %ConfirmLabel
@onready var confirm_yes: Button = %ConfirmYes
@onready var confirm_no: Button = %ConfirmNo

var _slot_buttons: Array[Button] = []
var _delete_buttons: Array[Button] = []
var _slot_info_labels: Array[Label] = []
var _pending_slot: int = -1


func _ready() -> void:
	# Collect slot UI nodes
	for i in range(SaveManager.MAX_SLOTS):
		_slot_buttons.append(get_node("%%SlotButton%d" % i) as Button)
		_delete_buttons.append(get_node("%%DeleteButton%d" % i) as Button)
		_slot_info_labels.append(get_node("%%SlotInfo%d" % i) as Label)

	_refresh_slot_display()

	# Connect slot signals
	for i in range(SaveManager.MAX_SLOTS):
		_slot_buttons[i].pressed.connect(_on_slot_pressed.bind(i))
		_delete_buttons[i].pressed.connect(_on_delete_pressed.bind(i))

	# Connect confirm panel
	confirm_yes.pressed.connect(_on_confirm_yes)
	confirm_no.pressed.connect(_on_confirm_no)
	back_button.pressed.connect(_on_back)

	# Button focus effects (SubMenuTheme shared utility)
	for btn in _slot_buttons + [back_button]:
		SubMenuTheme.connect_button_focus(self, btn)
	for btn in _delete_buttons:
		SubMenuTheme.connect_button_focus(self, btn)
	SubMenuTheme.connect_button_focus(self, confirm_yes)
	SubMenuTheme.connect_button_focus(self, confirm_no)

	# Firefly particles
	SubMenuTheme.create_particles(self)

	# Entrance animation
	SubMenuTheme.play_entrance(self, title_label, slot_container, [back_button])
	SceneTransition.fade_from_black(0.4)

	# Menu music (keep playing if already on)
	EventBus.music_play.emit("menu")

	# Focus first slot button
	_slot_buttons[0].grab_focus.call_deferred()


func _refresh_slot_display() -> void:
	for i in range(SaveManager.MAX_SLOTS):
		if SaveManager.is_slot_occupied(i):
			var meta := SaveManager.get_slot_meta(i)
			var levels: int = meta.get("level_progress", 0)
			var play_time: float = meta.get("play_time", 0.0)
			var level_name := _get_level_title(meta.get("last_level_id", ""))
			var info := "Levels: %d\nTime: %s" % [levels, _format_time(play_time)]
			if not level_name.is_empty():
				info += "\nLast: %s" % level_name
			_slot_info_labels[i].text = info
			_slot_buttons[i].text = "SELECT"
			_delete_buttons[i].visible = true
		else:
			_slot_info_labels[i].text = "Empty"
			_slot_buttons[i].text = "NEW SAVE"
			_delete_buttons[i].visible = false


func _on_slot_pressed(slot: int) -> void:
	if SaveManager.is_slot_occupied(slot):
		# Existing save — activate and resume if possible
		EventBus.sfx_play.emit("ui_confirm", 0.0)
		SaveManager.activate_slot(slot)
		SaveManager.update_current_slot_meta()
		var pd := ProgressData.new()
		if not pd.last_level_scene.is_empty():
			GameData.selected_level_id = pd.last_level_id
			GameData.selected_level_scene = pd.last_level_scene
			GameData.resumed_position = Vector2(pd.last_player_x, pd.last_player_y)
			SceneTransition.transition_to("res://game/GameScene.tscn")
		else:
			SceneTransition.transition_to(SCENE_LEVEL_SELECT)
	else:
		# Empty slot — show confirmation
		EventBus.sfx_play.emit("ui_tick", 0.0)
		_pending_slot = slot
		confirm_label.text = "Start new game in Slot %d?" % (slot + 1)
		confirm_panel.visible = true
		confirm_no.grab_focus.call_deferred()


func _on_confirm_yes() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	confirm_panel.visible = false
	SaveManager.create_new_save(_pending_slot)
	SceneTransition.transition_to(SCENE_LEVEL_SELECT)


func _on_confirm_no() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	confirm_panel.visible = false
	if _pending_slot >= 0 and _pending_slot < _slot_buttons.size():
		_slot_buttons[_pending_slot].grab_focus.call_deferred()
	_pending_slot = -1


func _on_delete_pressed(slot: int) -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	SaveManager.delete_slot(slot)
	_refresh_slot_display()
	_slot_buttons[slot].grab_focus.call_deferred()


func _on_back() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	SceneTransition.transition_to(SCENE_MENU)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if confirm_panel.visible:
			_on_confirm_no()
		else:
			_on_back()
		get_viewport().set_input_as_handled()


func _format_time(seconds: float) -> String:
	var total := int(seconds)
	var hours := total / 3600
	var mins := (total % 3600) / 60
	var secs := total % 60
	if hours > 0:
		return "%dh %02dm" % [hours, mins]
	return "%dm %02ds" % [mins, secs]


func _get_level_title(level_id: String) -> String:
	if level_id.is_empty():
		return ""
	for def in LevelDefs.ALL:
		if def["id"] == level_id:
			return def["title"]
	return level_id
