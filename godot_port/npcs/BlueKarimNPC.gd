# BlueKarimNPC.gd
# Shopkeeper in House 1. Shows shop panel after greeting dialog.

extends "res://npcs/NPC.gd"

var ShopPanelScene = preload("res://ui/shop/ShopPanel.tscn")
var _shop_panel: CanvasLayer = null

func _get_active_dialog_id() -> String:
	return "level_town/blue_karim/greet"

func _on_dialog_ended(ended_dialog_id: String) -> void:
	super._on_dialog_ended(ended_dialog_id)
	if ended_dialog_id == "level_town/blue_karim/greet":
		# Wait for cinematic to fully finish before showing shop
		await get_tree().create_timer(0.5).timeout
		_show_shop()

func _show_shop() -> void:
	if _shop_panel:
		return
	_shop_panel = ShopPanelScene.instantiate()
	_shop_panel.shop_closed.connect(_on_shop_closed)
	get_tree().current_scene.add_child(_shop_panel)

func _on_shop_closed() -> void:
	_shop_panel = null
