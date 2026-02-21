# ShopPanel.gd
# Placeholder shop menu — displays items and a close button.
# Pauses game while showing.

extends CanvasLayer

signal shop_closed

@onready var _close_btn: Button = %CloseButton

func _ready() -> void:
	get_tree().paused = true
	_close_btn.pressed.connect(_on_close)
	await get_tree().create_timer(0.15).timeout
	if is_instance_valid(_close_btn):
		_close_btn.grab_focus()

func _on_close() -> void:
	AudioManager.play_ui_sfx("ui_confirm")
	get_tree().paused = false
	shop_closed.emit()
	queue_free()
