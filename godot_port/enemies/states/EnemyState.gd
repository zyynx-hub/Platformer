# EnemyState.gd
# Base class for all enemy states (mirrors PlayerState).

class_name EnemyState
extends Node

var enemy: Enemy
var state_machine: EnemyStateMachine

func enter() -> void:
	pass

func exit() -> void:
	pass

func physics_update(_delta: float) -> void:
	pass
