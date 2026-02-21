## BootScene — validates critical assets then transitions to MenuScene.
## Port of js/scenes/boot-scene.js.
extends Node

const SCENE_MENU := "res://scenes/menu/MenuScene.tscn"

const CRITICAL_ASSETS := [
	"res://assets/sprites/tileset/Cavernas_by_Adam_Saltsman.png",
	"res://assets/sprites/player/IFFY_IDLE.png",
	"res://assets/levels/level-5.json",
]


func _ready() -> void:
	_validate_assets()
	# Small delay so the splash frame renders, then go to menu.
	await get_tree().create_timer(0.5).timeout
	get_tree().change_scene_to_file(SCENE_MENU)


func _validate_assets() -> void:
	for path in CRITICAL_ASSETS:
		if not FileAccess.file_exists(path) and not ResourceLoader.exists(path):
			push_warning("BootScene: CRITICAL asset missing — %s" % path)
