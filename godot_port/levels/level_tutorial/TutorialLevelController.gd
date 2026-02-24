# TutorialLevelController.gd
# Level-specific wiring for the tutorial level.
# Handles: enemy-kill-to-gate, spotlight flickering.

extends Node2D

@onready var _fighter: Node2D = $Enemies/FighterEnemy
@onready var _spotlight_flicker: PointLight2D = $Lights/SpotLight2

func _ready() -> void:
	EventBus.enemy_killed.connect(_on_enemy_killed)
	# Flickering spotlight
	if _spotlight_flicker:
		_start_flicker(_spotlight_flicker)

func _on_enemy_killed(enemy: Node2D) -> void:
	if enemy == _fighter:
		EventBus.gate_opened.emit("tut_fighter_kill")

func _start_flicker(light: PointLight2D) -> void:
	var tween := light.create_tween().set_loops()
	tween.tween_property(light, "energy", 0.4, 0.08)
	tween.tween_property(light, "energy", 1.0, 0.12)
	tween.tween_property(light, "energy", 0.6, 0.06)
	tween.tween_property(light, "energy", 1.0, 0.1)
	tween.tween_interval(0.3)
