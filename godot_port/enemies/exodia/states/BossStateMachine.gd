# BossStateMachine.gd
# Manages boss state transitions (mirrors EnemyStateMachine.gd).

class_name BossStateMachine
extends Node

@export var initial_state: NodePath

var current_state: BossState
var states: Dictionary = {}

func init(boss_node: Node) -> void:
	for child in get_children():
		if child is BossState:
			states[child.name] = child
			child.boss = boss_node
			child.state_machine = self

	if initial_state:
		current_state = get_node(initial_state) as BossState
	else:
		current_state = get_child(0) as BossState

	if current_state:
		current_state.enter()

func update(delta: float) -> void:
	if current_state:
		current_state.physics_update(delta)

func transition_to(state_name: String) -> void:
	var new_state: BossState = states.get(state_name)
	if new_state == null:
		return
	if current_state:
		current_state.exit()
	current_state = new_state
	current_state.enter()
