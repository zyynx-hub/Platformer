# EnemyChaseState.gd
# Move toward player while detected. Return to idle if player leaves range.

extends EnemyState

func enter() -> void:
	enemy.play_animation("walk")

func physics_update(delta: float) -> void:
	var player_pos := enemy.get_player_position()
	if player_pos == Vector2.INF:
		state_machine.transition_to("Idle")
		return

	# Face and move toward player
	var dir: float = sign(player_pos.x - enemy.global_position.x)
	if dir != 0.0:
		enemy.facing_direction = dir
	enemy.velocity_x = enemy.chase_speed * enemy.facing_direction

	# Gravity
	enemy.velocity_y += Constants.GRAVITY * delta
	enemy.velocity_y = minf(enemy.velocity_y, Constants.MAX_FALL_SPEED)

	# Don't walk off ledges while chasing
	if enemy.is_on_floor() and not enemy.has_floor_ahead():
		enemy.velocity_x = 0.0

	enemy.apply_movement()

	# Stop chasing if player leaves detection range
	if not enemy.can_detect_player():
		state_machine.transition_to("Idle")
