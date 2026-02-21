# Boot.gd
# Launcher scene — transitions to menu

extends Node2D

func _ready() -> void:
	VersionChecker.check(SceneTransition)
	_go_to_menu.call_deferred()

func _go_to_menu() -> void:
	SceneTransition.transition_to("res://ui/menus/MenuScene.tscn", 0.6)
