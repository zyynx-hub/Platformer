# IdleState.gd

extends PlayerState

func physics_update(delta: float, move_input: float) -> void:
	player.velocity_y += player.get_effective_gravity() * delta
	player.velocity_y = minf(player.velocity_y, Constants.MAX_FALL_SPEED)

	player.apply_horizontal_movement(delta, move_input, false)

	if absf(player.velocity_x) > 5.0 and move_input != 0.0:
		state_machine.transition_to("Run")

	# Jump
	if player.wants_to_jump and (player.is_on_floor() or player.coyote_timer > 0.0):
		player.start_jump()
		return

	# Leave floor
	if not player.is_on_floor():
		if player.is_on_wall() and player.get_wall_normal() != player.last_wall_normal:
			state_machine.transition_to("WallSlide")
		else:
			state_machine.transition_to("Fall")

	player.apply_movement()
	player.update_coyote_timer()
