# StateMachine.gd
# Manages player state transitions and dispatches to current state

class_name StateMachine
extends Node

@export var initial_state: NodePath

var current_state: PlayerState
var states: Dictionary = {}

func init(player: Player) -> void:
	for child in get_children():
		if child is PlayerState:
			states[child.name] = child
			child.player = player
			child.state_machine = self

	if initial_state:
		current_state = get_node(initial_state) as PlayerState
	else:
		current_state = get_child(0) as PlayerState

	if current_state:
		current_state.enter()

func update(delta: float, move_input: float) -> void:
	if current_state:
		current_state.physics_update(delta, move_input)

func forward_input(event: InputEvent) -> void:
	if current_state:
		current_state.handle_input(event)

func transition_to(state_name: String) -> void:
	var new_state: PlayerState = states.get(state_name)
	if new_state == null or new_state == current_state:
		return
	current_state.exit()
	current_state = new_state
	current_state.enter()
	# Trigger animation on player
	current_state.player.play_animation(_get_anim_for_state(state_name))

func _get_anim_for_state(state_name: String) -> String:
	match state_name:
		"Idle": return "idle"
		"Run": return "run"
		"Jump": return "jump"
		"Fall": return "fall"
		"Dash": return "dash"
		"WallSlide": return "wall_slide"
		"Hurt": return "hurt"
		"Dead": return "death"
		"Spawn": return "idle"
		_: return "idle"
