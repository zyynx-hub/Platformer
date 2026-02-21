# WallSlideState.gd

extends PlayerState

const WALL_STICK_FORCE := 10.0  # gentle push into wall to maintain is_on_wall()
const WALL_SLIDE_FRICTION := 0.7  # upward velocity kept on wall contact (30% cut)

func enter() -> void:
	# Dampen upward momentum on wall contact — keeps a short slide-up but kills rocket speed
	if player.velocity_y < 0.0:
		player.velocity_y *= WALL_SLIDE_FRICTION

func physics_update(delta: float, move_input: float) -> void:
	var wall_normal := player.get_wall_normal()

	# Press opposite direction to detach from wall
	if move_input != 0.0 and sign(move_input) == sign(wall_normal.x):
		player.velocity_x = move_input * Constants.PLAYER_RUN_SPEED * 0.5
		state_machine.transition_to("Fall")
		player.apply_movement()
		return

	# Stronger gravity when still rising (quick decel), half gravity when sliding down
	var wall_gravity := Constants.GRAVITY if player.velocity_y < 0.0 else Constants.GRAVITY * 0.5
	player.velocity_y = minf(player.velocity_y + wall_gravity * delta, Constants.WALL_SLIDE_MAX_SPEED)
	# Push gently into the wall so is_on_wall() stays true across frames
	player.velocity_x = -wall_normal.x * WALL_STICK_FORCE

	# Wall jump
	if player.wants_to_jump:
		player.velocity_x = wall_normal.x * Constants.WALL_JUMP_H_FORCE
		player.velocity_y = -Constants.PLAYER_JUMP_FORCE
		player.is_facing_right = wall_normal.x > 0.0
		player.last_wall_normal = wall_normal
		player.wall_jump_timer = player.WALL_JUMP_LOCK_TIME
		player.var_jump_timer = Constants.VAR_JUMP_TIME
		player._jumped = true
		player._squash_target = Vector2(0.85, 1.15)
		state_machine.transition_to("Jump")
		player.wants_to_jump = false
		player.apply_movement()
		return

	if not player.is_on_wall():
		state_machine.transition_to("Fall")
		return

	if player.is_on_floor():
		state_machine.transition_to("Idle")
		return

	player.apply_movement()
