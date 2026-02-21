# DeadState.gd

extends PlayerState

func enter() -> void:
	player.velocity_x = 0.0
	player.velocity_y = 0.0

func physics_update(_delta: float, _move_input: float) -> void:
	# Dead state halts all physics
	pass
