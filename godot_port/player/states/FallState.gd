# FallState.gd

extends PlayerState

func physics_update(delta: float, move_input: float) -> void:
	# Fast fall: holding down increases terminal velocity
	var max_fall := Constants.MAX_FALL_SPEED
	if Input.is_action_pressed("move_down"):
		max_fall = Constants.FAST_FALL_SPEED

	if player.rocket_thrusting:
		player.velocity_y -= Constants.ROCKET_THRUST * delta
		player.velocity_y = clampf(player.velocity_y, -Constants.ROCKET_MAX_RISE, max_fall)
	else:
		player.velocity_y += player.get_effective_gravity() * delta
		player.velocity_y = minf(player.velocity_y, max_fall)

	# Air movement (locked briefly after wall jump)
	if player.wall_jump_timer <= 0.0:
		player.apply_horizontal_movement(delta, move_input, true)

	# Wall check
	if player.is_on_wall() and player.get_wall_normal() != player.last_wall_normal:
		state_machine.transition_to("WallSlide")
		return

	# Buffered jump (coyote)
	if player.wants_to_jump and player.coyote_timer > 0.0:
		player.start_jump()
		return

	# Landed
	if player.is_on_floor():
		state_machine.transition_to("Idle")
		return

	player.apply_movement()
