# EnemyIdleState.gd
# Stand still, wait, then patrol. Chase if player detected.

extends EnemyState

var _idle_timer: float = 0.0

func enter() -> void:
	enemy.velocity_x = 0.0
	_idle_timer = enemy.idle_duration
	enemy.play_animation("idle")

func physics_update(delta: float) -> void:
	# Gravity
	enemy.velocity_y += Constants.GRAVITY * delta
	enemy.velocity_y = minf(enemy.velocity_y, Constants.MAX_FALL_SPEED)
	enemy.apply_movement()

	# Check for player
	if enemy.can_detect_player():
		state_machine.transition_to("Chase")
		return

	# Resume patrol after idle timer
	_idle_timer -= delta
	if _idle_timer <= 0.0:
		state_machine.transition_to("Patrol")
