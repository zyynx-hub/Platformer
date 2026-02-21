# JumpState.gd

extends PlayerState

func physics_update(delta: float, move_input: float) -> void:
	if player.rocket_thrusting:
		player.velocity_y -= Constants.ROCKET_THRUST * delta
		player.velocity_y = clampf(player.velocity_y, -Constants.ROCKET_MAX_RISE, Constants.MAX_FALL_SPEED)
	else:
		player.velocity_y += player.get_effective_gravity() * delta
		player.velocity_y = minf(player.velocity_y, Constants.MAX_FALL_SPEED)

	# Air movement (locked briefly after wall jump)
	if player.wall_jump_timer <= 0.0:
		player.apply_horizontal_movement(delta, move_input, true)

	# Transition to fall when descending
	if player.velocity_y > 0.0:
		state_machine.transition_to("Fall")
		return

	# Wall slide check
	if player.is_on_wall() and player.get_wall_normal() != player.last_wall_normal:
		state_machine.transition_to("WallSlide")
		return

	player.apply_movement()
