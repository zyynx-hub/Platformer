# Enemy.gd
# Base enemy — CharacterBody2D with state machine, hitbox/hurtbox, and detection.
# Subclass by inheriting Enemy.tscn and overriding exports in Inspector.

class_name Enemy
extends CharacterBody2D

# --- Config (override per enemy type in Inspector) ---
@export var max_health: float = 2.0
@export var contact_damage: float = 1.0
@export var patrol_speed: float = 30.0
@export var chase_speed: float = 50.0
@export var idle_duration: float = 1.5
@export var hurt_stun_duration: float = 0.3
@export var knockback_force: float = 100.0

# --- Node refs (all defined in .tscn) ---
@onready var _sprite: Sprite2D = $Sprite
@onready var _state_machine: EnemyStateMachine = $StateMachine
@onready var _hurtbox: Area2D = $Hurtbox
@onready var _hitbox: Area2D = $Hitbox
@onready var _player_detector: Area2D = $PlayerDetector
@onready var _floor_checker: RayCast2D = $FloorChecker
@onready var _collision_shape: CollisionShape2D = $CollisionShape

# --- Physics state ---
var velocity_x: float = 0.0
var velocity_y: float = 0.0
var facing_direction: float = 1.0  # 1.0 = right, -1.0 = left

# --- Combat state ---
var health: float = 2.0
var _is_dead: bool = false
var _contact_cooldown: float = 0.0  # prevents repeated stomp/contact hits

func _ready() -> void:
	add_to_group("enemies")
	health = max_health
	_state_machine.init(self)

func _physics_process(delta: float) -> void:
	if _is_dead:
		return
	_state_machine.update(delta)
	# Sprite facing
	if _sprite:
		_sprite.flip_h = facing_direction < 0.0
	# Continuous stomp / contact detection
	_contact_cooldown = maxf(0.0, _contact_cooldown - delta)
	if _contact_cooldown <= 0.0:
		_check_player_contact()

# --- Movement ---

func apply_movement() -> void:
	var was_on_floor := is_on_floor()
	var prev_y := global_position.y
	velocity = Vector2(velocity_x, velocity_y)
	move_and_slide()
	velocity_x = velocity.x
	velocity_y = velocity.y
	# Guard: if grounded and move_and_slide pushed us downward (player falling through),
	# snap back to prevent phasing through the floor.
	if was_on_floor and global_position.y > prev_y + 1.0:
		global_position.y = prev_y
		velocity_y = 0.0

func flip_direction() -> void:
	facing_direction *= -1.0
	_floor_checker.target_position.x = absf(_floor_checker.target_position.x) * facing_direction

# --- Detection ---

func can_detect_player() -> bool:
	return _player_detector.has_overlapping_bodies()

func get_player_position() -> Vector2:
	var bodies := _player_detector.get_overlapping_bodies()
	for body in bodies:
		if body.is_in_group("player"):
			return body.global_position
	return Vector2.INF

func has_floor_ahead() -> bool:
	return _floor_checker.is_colliding()

# --- Damage reception ---

func take_damage(amount: float, from_position: Vector2 = Vector2.ZERO) -> void:
	if _is_dead:
		return
	health -= amount
	# Hit flash
	_play_hit_flash()
	EventBus.enemy_damaged.emit(self, amount)
	EventBus.camera_shake_requested.emit(0.08, 1.5)
	# Die immediately when health depleted (don't rely on hurt timer)
	if health <= 0.0:
		die()
		return
	# Knockback away from damage source
	if from_position != Vector2.ZERO:
		var kb_dir: float = sign(global_position.x - from_position.x)
		if kb_dir == 0.0:
			kb_dir = 1.0
		velocity_x = kb_dir * knockback_force
		velocity_y = -50.0
	_state_machine.transition_to("Hurt")

func _play_hit_flash() -> void:
	if not _sprite or not _sprite.material:
		return
	_sprite.material.set_shader_parameter("flash_amount", 1.0)
	var tween := create_tween()
	tween.tween_property(_sprite.material, "shader_parameter/flash_amount", 0.0, 0.15)

## Push away from a position without taking damage (used when player takes contact hit).
func knockback_from(source_pos: Vector2) -> void:
	if _is_dead:
		return
	var kb_dir: float = sign(global_position.x - source_pos.x)
	if kb_dir == 0.0:
		kb_dir = 1.0
	velocity_x = kb_dir * knockback_force
	velocity_y = -50.0
	_contact_cooldown = 0.5
	_state_machine.transition_to("Hurt")

# --- Contact damage when enemy walks into player (slide collisions) ---

func _check_player_contact() -> void:
	for i in get_slide_collision_count():
		var collider := get_slide_collision(i).get_collider()
		if not collider.is_in_group("player"):
			continue
		if not collider.has_method("take_damage"):
			continue
		# Always push self back on contact
		knockback_from(collider.global_position)
		if collider.hurt_invuln_timer <= 0.0:
			collider.take_damage(contact_damage, global_position)
		return

# --- Death ---

func die() -> void:
	if _is_dead:
		return
	_is_dead = true
	# Disable all collision
	_collision_shape.set_deferred("disabled", true)
	_hurtbox.set_deferred("monitoring", false)
	_hitbox.set_deferred("monitoring", false)
	EventBus.enemy_killed.emit(self)
	# Death visual: flash white then fade out
	if _sprite and _sprite.material:
		_sprite.material.set_shader_parameter("flash_amount", 1.0)
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.4)
	tween.tween_callback(queue_free)

## Override in subclass for AnimatedSprite2D enemies.
func play_animation(_anim_name: String) -> void:
	pass
