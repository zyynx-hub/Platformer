# EnemyHurtState.gd
# Stun on hit, then recover or transition to dead.

extends EnemyState

var _hurt_timer: float = 0.0

func enter() -> void:
	_hurt_timer = enemy.hurt_stun_duration
	enemy.play_animation("hurt")

func physics_update(delta: float) -> void:
	# Gravity
	enemy.velocity_y += Constants.GRAVITY * delta
	enemy.velocity_y = minf(enemy.velocity_y, Constants.MAX_FALL_SPEED)
	# Decelerate knockback
	enemy.velocity_x = move_toward(enemy.velocity_x, 0.0, 400.0 * delta)
	enemy.apply_movement()

	_hurt_timer -= delta
	if _hurt_timer <= 0.0:
		if enemy.health <= 0.0:
			state_machine.transition_to("Dead")
		else:
			state_machine.transition_to("Idle")
