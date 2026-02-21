## Enemy — CharacterBody2D AI.
## Ports the enemy logic from js/scenes/game-scene.js.
## Types: E (basic walker), F (slow patrol), G (fast patrol), H (tank, 2hp)
class_name Enemy
extends CharacterBody2D

enum AIState { PATROL, CHASE, ATTACK, STUNNED }

@export var enemy_type: String = "E"
@export var patrol_speed: float = 60.0
@export var hp: int = 1

var ai_state: AIState = AIState.PATROL
var facing_dir: int = -1
var patrol_min_x: float = 0.0
var patrol_max_x: float = 0.0
var use_bounded_patrol: bool = false
var state_until: float = 0.0
var attack_cooldown_until: float = 0.0
var next_jump_at: float = 0.0
var last_x: float = 0.0
var stuck_since: float = 0.0

const GRAVITY := 1100.0
const STUCK_THRESHOLD := 2.0   # seconds before forced turn
const EDGE_CHECK_DIST := 4.0   # pixels ahead for ledge detection


func _ready() -> void:
	last_x      = global_position.x
	stuck_since = Time.get_ticks_msec() / 1000.0
	# Tank type has 2 hp
	if enemy_type == "H":
		hp = 2
	_setup_appearance()


func _physics_process(delta: float) -> void:
	var now: float = Time.get_ticks_msec() / 1000.0

	# Gravity
	if not is_on_floor():
		velocity.y += GRAVITY * delta

	_run_ai(now, delta)
	move_and_slide()

	# Stuck detection — turn around if not moving horizontally
	if absf(global_position.x - last_x) < 0.5 and is_on_floor():
		if now - stuck_since > STUCK_THRESHOLD:
			_turn()
			stuck_since = now
	else:
		stuck_since = now
	last_x = global_position.x


func _run_ai(now: float, _delta: float) -> void:
	match ai_state:
		AIState.PATROL:
			_patrol(now)
		AIState.STUNNED:
			if now >= state_until:
				ai_state = AIState.PATROL


func _patrol(now: float) -> void:
	velocity.x = facing_dir * patrol_speed

	# Wall collision — turn around
	if is_on_wall():
		_turn()
		return

	# Bounded patrol — turn at edges
	if use_bounded_patrol:
		if (facing_dir == -1 and global_position.x <= patrol_min_x) or \
		   (facing_dir ==  1 and global_position.x >= patrol_max_x):
			_turn()
			return

	# Ledge detection — don't walk off edges
	var check_x: float = global_position.x + facing_dir * EDGE_CHECK_DIST
	var check_y: float = global_position.y + 4.0
	var space_state := get_world_2d().direct_space_state
	var query := PhysicsPointQueryParameters2D.new()
	query.position = Vector2(check_x, check_y)
	query.exclude  = [get_rid()]
	var hits := space_state.intersect_point(query)
	if hits.is_empty():
		_turn()

	# Hopper type (F) — occasional jumps
	if enemy_type == "F" and is_on_floor() and now >= next_jump_at:
		velocity.y  = -320.0
		next_jump_at = now + randf_range(1.5, 3.0)


func _turn() -> void:
	facing_dir *= -1
	velocity.x  = 0.0


func take_damage(amount: int = 1) -> void:
	hp -= amount
	if hp <= 0:
		_die()
	else:
		# Brief stun
		ai_state   = AIState.STUNNED
		state_until = Time.get_ticks_msec() / 1000.0 + 0.4


func _die() -> void:
	queue_free()


func _setup_appearance() -> void:
	# Colour-coded placeholder squares matching original JS runtime textures.
	var colour := Color.RED
	match enemy_type:
		"E": colour = Color(1.0, 0.25, 0.25)
		"F": colour = Color(1.0, 0.65, 0.0)
		"G": colour = Color(0.8, 0.0, 1.0)
		"H": colour = Color(0.3, 0.3, 1.0)
	modulate = colour
