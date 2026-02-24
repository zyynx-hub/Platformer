# EnemyDeadState.gd
# Trigger death sequence, then remove.

extends EnemyState

func enter() -> void:
	enemy.velocity_x = 0.0
	enemy.velocity_y = 0.0
	enemy.die()

func physics_update(_delta: float) -> void:
	pass
