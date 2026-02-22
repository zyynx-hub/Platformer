# ShopPanel.gd
# Full shop UI: 3 item slots sourced from ItemDefs.SHOP.
# - Shows coin balance (always visible)
# - Grey-out unaffordable slots; "Owned" label for purchased items
# - 2-step confirm: first Buy press = "OK?", second = execute purchase
# - Shake+red flash on insufficient funds
# - Pauses game while showing; closes on ui_cancel

extends CanvasLayer

signal shop_closed

# Ordered list of shop items (defined in ItemDefs)
const ITEMS: Array = ItemDefs.SHOP

@onready var _coin_label: Label = %CoinLabel

# Slot 0
@onready var _s0_container: PanelContainer = %Slot0
@onready var _s0_name: Label = %Slot0Name
@onready var _s0_desc: Label = %Slot0Desc
@onready var _s0_cost: Label = %Slot0Cost
@onready var _s0_buy: Button = %Slot0Buy

# Slot 1
@onready var _s1_container: PanelContainer = %Slot1
@onready var _s1_name: Label = %Slot1Name
@onready var _s1_desc: Label = %Slot1Desc
@onready var _s1_cost: Label = %Slot1Cost
@onready var _s1_buy: Button = %Slot1Buy

# Slot 2
@onready var _s2_container: PanelContainer = %Slot2
@onready var _s2_name: Label = %Slot2Name
@onready var _s2_desc: Label = %Slot2Desc
@onready var _s2_cost: Label = %Slot2Cost
@onready var _s2_buy: Button = %Slot2Buy

@onready var _close_btn: Button = %CloseButton

var _containers: Array
var _name_labels: Array
var _desc_labels: Array
var _cost_labels: Array
var _buy_btns: Array
var _pending_slot: int = -1
var _closing: bool = false
var _progress: ProgressData


func _ready() -> void:
	get_tree().paused = true
	_progress = ProgressData.new()

	_containers = [_s0_container, _s1_container, _s2_container]
	_name_labels = [_s0_name, _s1_name, _s2_name]
	_desc_labels = [_s0_desc, _s1_desc, _s2_desc]
	_cost_labels = [_s0_cost, _s1_cost, _s2_cost]
	_buy_btns = [_s0_buy, _s1_buy, _s2_buy]

	_s0_buy.pressed.connect(_on_buy_pressed.bind(0))
	_s1_buy.pressed.connect(_on_buy_pressed.bind(1))
	_s2_buy.pressed.connect(_on_buy_pressed.bind(2))
	_close_btn.pressed.connect(_on_close)

	_populate_slots()
	_refresh_coin_label()
	_refresh_slot_states()

	await get_tree().create_timer(0.15).timeout
	if is_instance_valid(_close_btn):
		_close_btn.grab_focus()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_close()


func _populate_slots() -> void:
	for i in ITEMS.size():
		var item: Dictionary = ITEMS[i]
		_name_labels[i].text = item["name"]
		_desc_labels[i].text = item["desc"]
		_cost_labels[i].text = "%d coins" % item["cost"]


func _refresh_coin_label() -> void:
	_coin_label.text = "%d coins" % _progress.coins


func _refresh_slot_states() -> void:
	for i in ITEMS.size():
		var item: Dictionary = ITEMS[i]
		var owned: bool = _progress.is_purchased(item["id"])
		var affordable: bool = _progress.coins >= item["cost"]

		if owned:
			_cost_labels[i].text = "Owned"
			_buy_btns[i].text = "Buy"
			_buy_btns[i].disabled = true
			_containers[i].modulate = Color(0.5, 0.5, 0.5, 1.0)
		elif not affordable:
			_cost_labels[i].text = "%d coins" % item["cost"]
			_buy_btns[i].disabled = false
			_containers[i].modulate = Color(0.75, 0.75, 0.75, 1.0)
		else:
			_cost_labels[i].text = "%d coins" % item["cost"]
			_buy_btns[i].disabled = false
			_containers[i].modulate = Color(1.0, 1.0, 1.0, 1.0)


func _on_buy_pressed(slot_index: int) -> void:
	var item: Dictionary = ITEMS[slot_index]

	if _pending_slot == slot_index:
		# Second press — confirm purchase
		_pending_slot = -1
		_buy_btns[slot_index].text = "Buy"

		if not _progress.buy_item(item["id"], item["cost"]):
			_flash_denied(slot_index)
			AudioManager.play_ui_sfx("ui_tick")
			return

		AudioManager.play_ui_sfx("ui_confirm")
		EventBus.coins_changed.emit(_progress.coins)
		_refresh_coin_label()
		_refresh_slot_states()
	else:
		# First press — check affordability, then enter confirm mode
		if _progress.coins < item["cost"]:
			_pending_slot = -1
			_flash_denied(slot_index)
			AudioManager.play_ui_sfx("ui_tick")
			return

		# Reset any other pending slot
		for i in _buy_btns.size():
			if i != slot_index:
				_buy_btns[i].text = "Buy"

		_pending_slot = slot_index
		_buy_btns[slot_index].text = "OK?"
		AudioManager.play_ui_sfx("ui_tick")


func _flash_denied(slot_index: int) -> void:
	# Instantly flash cost label and coin label red, then tween back
	var cost_lbl: Label = _cost_labels[slot_index]
	cost_lbl.modulate = Color(1.0, 0.3, 0.3, 1.0)
	_coin_label.modulate = Color(1.0, 0.3, 0.3, 1.0)
	var tween := create_tween().set_parallel(true)
	tween.tween_property(cost_lbl, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.45)
	tween.tween_property(_coin_label, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.45)


func _on_close() -> void:
	if _closing:
		return
	_closing = true
	AudioManager.play_ui_sfx("ui_confirm")
	get_tree().paused = false
	shop_closed.emit()
	queue_free()
