# SpawnState.gd
# Freezes the player during materialize animation.
# Transitions to Idle when GameScene signals materialize is complete.

extends PlayerState

func enter() -> void:
	player.velocity_x = 0.0
	player.velocity_y = 0.0
	player.set_collision_disabled(true)

func exit() -> void:
	player.set_collision_disabled(false)

func physics_update(_delta: float, _move_input: float) -> void:
	# Keep is_on_floor() fresh but no gravity or movement
	player.apply_movement()
