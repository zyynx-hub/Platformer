## Player — CharacterBody2D controller.
## Full port of the player logic in js/scenes/game-scene.js.
## State machine: IDLE | RUN | JUMP | FALL | DASH | ATTACK | HURT | DEAD
class_name Player
extends CharacterBody2D

enum State { IDLE, RUN, JUMP, FALL, DASH, ATTACK, HURT, DEAD }

# Tuning (pulled from Constants)
var P := Constants.PLAYER.duplicate()
const GRAVITY := 1100.0

# State
var state: State = State.IDLE
var facing_dir: int = 1        # 1 = right, -1 = left
var jumps_used: int = 0

# Coyote time
var last_grounded_time: float = -999.0
var last_jump_pressed_time: float = -999.0

# Dash
var is_dashing: bool = false
var dash_ends_at: float = 0.0
var last_dash_at: float = -999.0

# Attack
var attack_active_until: float = 0.0
var last_attack_at: float = -999.0

# Hurt
var last_damage_time: float = -999.0
var is_invuln: bool = false

# Respawn
var respawn_point: Vector2 = Vector2(64, 64)
var is_dead: bool = false
var level_complete: bool = false

# Jetpack
var jetpack: JetpackController
var jetpack_active: bool = false
var jetpack_fuel_percent: float = 100.0

# Node refs (set from GameScene after instantiation)
@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var hitbox: CollisionShape2D = $CollisionShape2D
@onready var attack_area: Area2D      = $AttackArea
@onready var jetpack_flame: Node2D    = $JetpackFlame


func _ready() -> void:
	jetpack = JetpackController.new()
	jetpack.jetpack_started.connect(_on_jetpack_started)
	jetpack.jetpack_stopped.connect(_on_jetpack_stopped)
	_set_hitbox_from_profile()


func _physics_process(delta: float) -> void:
	if is_dead or level_complete:
		return

	var now: float = Time.get_ticks_msec() / 1000.0
	var grounded: bool = is_on_floor()

	if grounded:
		last_grounded_time = now
		jumps_used = 0

	# --- Input ---
	var move_left:  bool = Input.is_action_pressed("move_left")
	var move_right: bool = Input.is_action_pressed("move_right")
	var jump_just:  bool = Input.is_action_just_pressed("jump")
	var jump_held:  bool = Input.is_action_pressed("jump")
	var dash_just:  bool = Input.is_action_just_pressed("dash")
	var attack_just:bool = Input.is_action_just_pressed("attack")

	if jump_just:
		last_jump_pressed_time = now

	# --- Dash ---
	if dash_just and _can_dash(now):
		_start_dash(now)

	if is_dashing:
		if now >= dash_ends_at:
			_end_dash()
		else:
			velocity.x = facing_dir * P["dash_speed"]
			velocity.y = 0.0
			_apply_move()
			_update_animation()
			return

	# --- Horizontal movement ---
	var dir: int = 0
	if move_right: dir += 1
	if move_left:  dir -= 1

	if dir != 0:
		facing_dir = dir
		velocity.x = move_toward(velocity.x, dir * P["max_speed"], P["acceleration"] * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, P["drag"] * delta)

	if sprite:
		sprite.flip_h = (facing_dir == -1)

	# --- Jump (coyote + buffer) ---
	var coyote_ok: bool  = (now - last_grounded_time) <= P["coyote_time_sec"]
	var buffer_ok: bool  = (now - last_jump_pressed_time) <= P["jump_buffer_sec"]
	var can_jump: bool   = (coyote_ok or grounded) and jumps_used < P["max_jumps"]

	if buffer_ok and can_jump:
		velocity.y = -P["jump_velocity"]
		jumps_used += 1
		last_jump_pressed_time = -999.0
		last_grounded_time     = -999.0

	# --- Gravity ---
	if not grounded:
		velocity.y += GRAVITY * delta
		velocity.y  = clampf(velocity.y, -P["max_rise_speed"], P["max_fall_speed"])

	# --- Jetpack ---
	var jp_result := jetpack.update(self, grounded, jump_held, jump_held, GRAVITY, delta)
	jetpack_fuel_percent = jp_result["fuel_percent"]
	jetpack_active       = jp_result["is_thrusting"]
	if jetpack_flame:
		jetpack_flame.visible = jetpack_active

	EventBus.jetpack_fuel_changed.emit(jetpack_fuel_percent)

	# --- Attack ---
	if attack_just and _can_attack(now):
		_start_attack(now)
	if now >= attack_active_until and attack_area:
		attack_area.monitoring = false

	# --- Safety clamp vertical ---
	velocity.y = clampf(velocity.y, -P["max_rise_speed"], P["max_fall_speed"])

	_apply_move()
	_update_state(grounded, dir)
	_update_animation()


func _apply_move() -> void:
	move_and_slide()


func _update_state(grounded: bool, dir: int) -> void:
	if is_dashing:
		state = State.DASH
	elif not grounded and velocity.y < 0.0:
		state = State.JUMP
	elif not grounded and velocity.y > 0.0:
		state = State.FALL
	elif dir != 0:
		state = State.RUN
	else:
		state = State.IDLE


func _update_animation() -> void:
	if sprite == null:
		return
	match state:
		State.IDLE:    sprite.play("idle")
		State.RUN:     sprite.play("run")
		State.JUMP:    sprite.play("jump")
		State.FALL:    sprite.play("fall")
		State.DASH:    sprite.play("dash")
		State.ATTACK:  sprite.play("attack")
		State.HURT:    sprite.play("hurt")
		State.DEAD:    sprite.play("dead")


func _can_dash(now: float) -> bool:
	if is_dashing: return false
	if level_complete or is_dead: return false
	return (now - last_dash_at) >= P["dash_cooldown_sec"]


func _start_dash(now: float) -> void:
	is_dashing  = true
	last_dash_at = now
	dash_ends_at = now + P["dash_duration_sec"]
	velocity.y   = 0.0
	state        = State.DASH
	EventBus.hud_dash_cooldown.emit(0.0)


func _end_dash() -> void:
	is_dashing = false


func _can_attack(now: float) -> bool:
	if is_dashing or is_dead or level_complete: return false
	return (now - last_attack_at) >= P["attack_cooldown_sec"]


func _start_attack(now: float) -> void:
	last_attack_at      = now
	attack_active_until = now + 0.15
	state = State.ATTACK
	if attack_area:
		attack_area.monitoring = true


func apply_damage(amount: int) -> void:
	var now: float = Time.get_ticks_msec() / 1000.0
	if is_invuln or is_dead:
		return
	is_invuln = true
	last_damage_time = now
	state = State.HURT
	GameManager.apply_damage(amount)
	var tween := create_tween()
	tween.tween_interval(P["hurt_invuln_sec"])
	tween.tween_callback(func(): is_invuln = false)


func die() -> void:
	if is_dead:
		return
	is_dead = true
	state   = State.DEAD
	velocity = Vector2.ZERO
	if sprite:
		sprite.play("dead")


func respawn() -> void:
	is_dead    = false
	is_invuln  = false
	state      = State.IDLE
	velocity   = Vector2.ZERO
	global_position = respawn_point
	jetpack.reset(true)
	EventBus.player_respawned.emit()


func _set_hitbox_from_profile() -> void:
	if hitbox == null:
		return
	var shape := RectangleShape2D.new()
	shape.size = Vector2(9.0, 24.0)
	hitbox.shape = shape
	hitbox.position = Vector2(0.0, -3.0)


func _on_jetpack_started() -> void:
	EventBus.jetpack_started.emit()


func _on_jetpack_stopped(reason: String) -> void:
	EventBus.jetpack_stopped.emit(reason)
