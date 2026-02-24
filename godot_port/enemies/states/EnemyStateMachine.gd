# EnemyStateMachine.gd
# Manages enemy state transitions (mirrors StateMachine.gd).

class_name EnemyStateMachine
extends Node

@export var initial_state: NodePath

var current_state: EnemyState
var states: Dictionary = {}

func init(enemy_node: Enemy) -> void:
	for child in get_children():
		if child is EnemyState:
			states[child.name] = child
			child.enemy = enemy_node
			child.state_machine = self

	if initial_state:
		current_state = get_node(initial_state) as EnemyState
	else:
		current_state = get_child(0) as EnemyState

	if current_state:
		current_state.enter()

func update(delta: float) -> void:
	if current_state:
		current_state.physics_update(delta)

func transition_to(state_name: String) -> void:
	var new_state: EnemyState = states.get(state_name)
	if new_state == null or new_state == current_state:
		return
	current_state.exit()
	current_state = new_state
	current_state.enter()
