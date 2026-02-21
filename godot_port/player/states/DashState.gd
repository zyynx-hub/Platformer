# DashState.gd

extends PlayerState

func physics_update(_delta: float, _move_input: float) -> void:
	var dash_dir := 1.0 if player.is_facing_right else -1.0
	player.velocity_x = dash_dir * Constants.DASH_SPEED
	player.velocity_y = 0.0

	if player.dash_timer <= 0.0 or player.is_on_wall():
		state_machine.transition_to("Fall")
		return

	player.apply_movement()
