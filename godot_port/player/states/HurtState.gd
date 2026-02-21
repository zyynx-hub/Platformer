# HurtState.gd

extends PlayerState

func physics_update(delta: float, _move_input: float) -> void:
	player.velocity_y += Constants.FALL_GRAVITY * delta
	player.velocity_y = minf(player.velocity_y, Constants.MAX_FALL_SPEED)

	player.velocity_x = move_toward(player.velocity_x, 0.0, Constants.RUN_DECEL * delta)

	if player.hurt_invuln_timer <= 0.0:
		if player.is_on_floor():
			state_machine.transition_to("Idle")
		else:
			state_machine.transition_to("Fall")
		return

	player.apply_movement()
