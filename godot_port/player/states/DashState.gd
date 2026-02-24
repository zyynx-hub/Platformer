# DashState.gd

extends PlayerState

const _DASH_ENEMY_PUSH := 60.0
const _DASH_ENEMY_POP := -30.0

func physics_update(_delta: float, _move_input: float) -> void:
	var dash_dir := 1.0 if player.is_facing_right else -1.0
	player.velocity_x = dash_dir * Constants.DASH_SPEED
	player.velocity_y = 0.0

	if player.dash_timer <= 0.0 or player.is_on_wall():
		state_machine.transition_to("Fall")
		return

	player.apply_movement()

	# Check if dash hit an enemy
	if player.is_on_wall():
		for i in player.get_slide_collision_count():
			var collider = player.get_slide_collision(i).get_collider()
			if collider is Enemy and not collider._is_dead:
				collider.velocity_x = dash_dir * _DASH_ENEMY_PUSH
				collider.velocity_y = _DASH_ENEMY_POP
		player.velocity_x = 0.0
		player._skip_enemy_contact = true  # don't deal contact damage from dash
		state_machine.transition_to("Fall")
		return
