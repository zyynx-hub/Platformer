# PlayerState.gd
# Base class for all player states

class_name PlayerState
extends Node

var player: Player
var state_machine: StateMachine

func enter() -> void:
	pass

func exit() -> void:
	pass

func physics_update(_delta: float, _move_input: float) -> void:
	pass

func handle_input(_event: InputEvent) -> void:
	pass
