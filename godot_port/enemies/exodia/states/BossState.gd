# BossState.gd
# Base class for Exodia Karim boss states (mirrors EnemyState.gd).

class_name BossState
extends Node

var boss: Node  # ExodiaKarimBoss (not typed to avoid circular class_name)
var state_machine: Node  # BossStateMachine

func enter() -> void:
	pass

func exit() -> void:
	pass

func physics_update(_delta: float) -> void:
	pass
