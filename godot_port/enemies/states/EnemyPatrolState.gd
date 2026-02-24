# EnemyPatrolState.gd
# Walk back and forth, flip at walls and ledges. Chase if player detected.

extends EnemyState

func enter() -> void:
	enemy.play_animation("walk")

func physics_update(delta: float) -> void:
	# Move in facing direction
	enemy.velocity_x = enemy.patrol_speed * enemy.facing_direction
	# Gravity
	enemy.velocity_y += Constants.GRAVITY * delta
	enemy.velocity_y = minf(enemy.velocity_y, Constants.MAX_FALL_SPEED)
	enemy.apply_movement()

	# Turn at walls or ledges
	if enemy.is_on_wall() or (enemy.is_on_floor() and not enemy.has_floor_ahead()):
		enemy.flip_direction()
		state_machine.transition_to("Idle")
		return

	# Check for player
	if enemy.can_detect_player():
		state_machine.transition_to("Chase")
