# Player.gd
# Player controller with state machine, acceleration-based movement,
# variable jump, asymmetric gravity, apex hang, and squash/stretch
#
# States are managed by the StateMachine child node (scripts/player/states/).
# This script holds shared variables, helpers, and equipment logic.

class_name Player
extends CharacterBody2D

# References
@onready var sprite: AnimatedSprite2D = $Sprite2D
@onready var _equipment_sprite: AnimatedSprite2D = $EquipmentSprite
@onready var state_machine: StateMachine = $StateMachine

# Physics state
var velocity_x: float = 0.0
var velocity_y: float = 0.0
var last_grounded_pos: Vector2 = Vector2.ZERO

# Timers (not Timer nodes, just counters)
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var dash_timer: float = 0.0
var dash_cooldown_timer: float = 0.0
var hurt_invuln_timer: float = 0.0
var attack_timer: float = 0.0
var wall_jump_timer: float = 0.0
var var_jump_timer: float = 0.0

const WALL_JUMP_LOCK_TIME: float = 0.15

# State bools
var wants_to_jump: bool = false
var can_jump: bool = true
var is_facing_right: bool = true
var _was_on_floor: bool = false

# Wall jump tracking
var last_wall_normal: Vector2 = Vector2.ZERO
var _jumped: bool = false  # true if airborne from a jump (not walking off edge)

# Squash & stretch
var _squash_target := Vector2(1.0, 1.0)
const SQUASH_LERP_SPEED := 12.0

# Health
var health: float = 3.0
const MAX_HEALTH: float = 3.0

# Equipped item (swaps character sprite sheets to composited versions)
var _equipped_item_id: String = ""
var _sheet_overrides: Dictionary = {}  # base_path → composited_path

# Rocket boots
var _rocket_fuel: float = 0.0
var rocket_thrusting: bool = false
@onready var _flame_sprite: AnimatedSprite2D = $FlameSprite
@onready var _thrust_sound: AudioStreamPlayer = $ThrustSound
@onready var _dash_sound: AudioStreamPlayer = $DashSound

# Dissolve / materialize shader (permanently applied via .tscn — dissolve_amount=0 is a passthrough)
var _dissolve_material: ShaderMaterial = null
var _is_dissolving: bool = false

func _ready() -> void:
	add_to_group("player")
	_setup_animations()
	EventBus.item_picked_up.connect(_on_item_picked_up)
	# Dissolve material is defined in Player.tscn (shared by Sprite2D and EquipmentSprite)
	_dissolve_material = sprite.material
	state_machine.init(self)

# Animation definitions: [name, sheet_path, total_frames, fps, loop, from_frame, to_frame]
const _ANIM_DEFS := [
	["idle", "res://player/sprites/Owlet_Monster_Idle_4.png", 4, 8.0, true, 0, -1],
	["run", "res://player/sprites/Owlet_Monster_Run_6.png", 6, 10.0, true, 0, -1],
	["jump", "res://player/sprites/Owlet_Monster_Jump_8.png", 8, 12.0, false, 0, -1],
	["fall", "res://player/sprites/Owlet_Monster_Jump_8.png", 8, 10.0, true, 5, 7],
	["dash", "res://player/sprites/Owlet_Monster_Run_6.png", 6, 16.0, true, 0, -1],
	["wall_slide", "res://player/sprites/Owlet_Monster_Climb_4.png", 4, 6.0, true, 0, -1],
	["hurt", "res://player/sprites/Owlet_Monster_Hurt_4.png", 4, 10.0, false, 0, -1],
	["death", "res://player/sprites/Owlet_Monster_Death_8.png", 8, 8.0, false, 0, -1],
]

func _setup_animations() -> void:
	var sf = _build_sprite_frames({})
	var current_anim: String = sprite.animation if sprite.sprite_frames and sprite.sprite_frames.has_animation(sprite.animation) else "idle"
	var current_frame: int = sprite.frame
	sprite.sprite_frames = sf
	if sf.has_animation(current_anim):
		sprite.play(current_anim)
		sprite.frame = mini(current_frame, sf.get_frame_count(current_anim) - 1)
	else:
		sprite.play("idle")

func _setup_equipment_animations() -> void:
	if _sheet_overrides.is_empty():
		_equipment_sprite.visible = false
		sprite.visible = true
		return

	var sf = _build_sprite_frames(_sheet_overrides)
	_equipment_sprite.sprite_frames = sf
	_equipment_sprite.visible = true
	sprite.visible = false

	# Sync to current animation
	var current_anim: String = sprite.animation if sprite.sprite_frames and sprite.sprite_frames.has_animation(sprite.animation) else "idle"
	if sf.has_animation(current_anim):
		_equipment_sprite.play(current_anim)

func _build_sprite_frames(overrides: Dictionary) -> SpriteFrames:
	var sf = SpriteFrames.new()
	sf.remove_animation("default")

	for def in _ANIM_DEFS:
		var anim_name: String = def[0]
		var base_path: String = def[1]
		var total_frames: int = def[2]
		var fps: float = def[3]
		var looping: bool = def[4]
		var from_frame: int = def[5]
		var to_frame: int = def[6]
		var path: String = overrides.get(base_path, base_path)
		_add_strip_anim(sf, anim_name, path, total_frames, fps, looping, from_frame, to_frame)

	return sf

func _add_strip_anim(sf: SpriteFrames, anim_name: String, path: String, total_frames: int, fps: float, looping: bool, from_frame: int = 0, to_frame: int = -1) -> void:
	sf.add_animation(anim_name)
	sf.set_animation_speed(anim_name, fps)
	sf.set_animation_loop(anim_name, looping)

	var texture = load(path)
	var fw: int = texture.get_width() / total_frames
	var fh: int = texture.get_height()
	var end: int = to_frame if to_frame >= 0 else total_frames - 1

	for i in range(from_frame, end + 1):
		var atlas = AtlasTexture.new()
		atlas.atlas = texture
		atlas.region = Rect2(i * fw, 0, fw, fh)
		sf.add_frame(anim_name, atlas)

func _unhandled_input(event: InputEvent) -> void:
	if state_machine.current_state and state_machine.current_state.name in ["Dead", "Spawn"]:
		return

	if event.is_action_pressed("jump"):
		wants_to_jump = true
		jump_buffer_timer = Constants.JUMP_BUFFER_TIME

	if event.is_action_pressed("dash"):
		try_start_dash()

	if event.is_action_pressed("attack"):
		attack_timer = Constants.ATTACK_COOLDOWN

	state_machine.forward_input(event)

func _physics_process(delta: float) -> void:
	if state_machine.current_state and state_machine.current_state.name in ["Dead", "Spawn"]:
		return

	# Track landing for squash/stretch
	var on_floor_now = is_on_floor()

	# Reset vertical velocity when grounded so it doesn't accumulate
	if on_floor_now:
		velocity_y = 0.0

	# Landing detection
	if on_floor_now and not _was_on_floor:
		_on_land()

	# Update timers
	coyote_timer = maxf(0, coyote_timer - delta)
	jump_buffer_timer = maxf(0, jump_buffer_timer - delta)
	dash_timer = maxf(0, dash_timer - delta)
	var _was_dash_cooling := dash_cooldown_timer > 0.0
	dash_cooldown_timer = maxf(0, dash_cooldown_timer - delta)
	if _was_dash_cooling and dash_cooldown_timer <= 0.0:
		EventBus.dash_cooldown_ended.emit()
	hurt_invuln_timer = maxf(0, hurt_invuln_timer - delta)
	attack_timer = maxf(0, attack_timer - delta)
	wall_jump_timer = maxf(0, wall_jump_timer - delta)
	if var_jump_timer > 0.0:
		var_jump_timer -= delta
		if not Input.is_action_pressed("jump"):
			var_jump_timer = 0.0

	# Clear buffered jump if buffer expired
	if wants_to_jump and jump_buffer_timer <= 0.0:
		wants_to_jump = false

	# Horizontal input
	var move_input: float = 0.0
	move_input += 1.0 if Input.is_action_pressed("move_right") else 0.0
	move_input -= 1.0 if Input.is_action_pressed("move_left") else 0.0

	# Update rocket boots (sets rocket_thrusting before state machine uses it)
	_update_rocket_boots(delta)

	# Dispatch to current state
	state_machine.update(delta, move_input)

	# Sprite facing direction
	if sprite:
		sprite.flip_h = not is_facing_right
	if _equipment_sprite:
		_equipment_sprite.flip_h = not is_facing_right
	if _flame_sprite:
		_flame_sprite.flip_h = not is_facing_right

	# Squash & stretch (visual only)
	_apply_squash_stretch(delta)

	# Track floor state for next frame
	_was_on_floor = is_on_floor()

# --- Gravity helper ---

func get_effective_gravity() -> float:
	# Apex hang: half gravity near peak of jump (only after a real jump, not walking off edge)
	if _jumped and absf(velocity_y) < Constants.APEX_HANG_THRESHOLD and state_machine.current_state and state_machine.current_state.name in ["Jump", "Fall"]:
		return Constants.GRAVITY * 0.5
	# Falling: heavier descent gravity
	if velocity_y > 0.0:
		return Constants.FALL_GRAVITY
	# Rising but jump released early and var_jump expired: extra gravity for short hop
	if velocity_y < 0.0 and var_jump_timer <= 0.0 and not Input.is_action_pressed("jump"):
		return Constants.GRAVITY * Constants.LOW_JUMP_GRAVITY_MULT
	# Normal ascent
	return Constants.GRAVITY

# --- Horizontal movement helper ---

func apply_horizontal_movement(delta: float, move_input: float, airborne: bool) -> void:
	var target_speed = move_input * Constants.PLAYER_RUN_SPEED
	var accel: float

	if move_input == 0.0:
		# Friction / deceleration
		accel = Constants.RUN_DECEL
		if airborne:
			accel *= Constants.AIR_DECEL_MULT
	else:
		# Acceleration
		accel = Constants.RUN_ACCEL
		if airborne:
			accel *= Constants.AIR_ACCEL_MULT
		# Turn bonus: accelerate faster when reversing direction
		elif sign(move_input) != sign(velocity_x) and velocity_x != 0.0:
			accel *= (1.0 + Constants.TURN_ACCEL_BONUS)

	velocity_x = move_toward(velocity_x, target_speed, accel * delta)

	# Update facing direction
	if move_input > 0.0:
		is_facing_right = true
	elif move_input < 0.0:
		is_facing_right = false

# --- Squash & stretch ---

func _apply_squash_stretch(delta: float) -> void:
	if not sprite:
		return
	var t = 1.0 - exp(-SQUASH_LERP_SPEED * delta)
	sprite.scale.x = lerp(sprite.scale.x, _squash_target.x, t)
	sprite.scale.y = lerp(sprite.scale.y, _squash_target.y, t)
	if _equipment_sprite:
		_equipment_sprite.scale = sprite.scale
	# Recover toward normal
	_squash_target = Vector2(1.0, 1.0)

func _on_land() -> void:
	_squash_target = Vector2(1.15, 0.85)
	_jumped = false

# --- Core functions ---

func apply_movement() -> void:
	velocity = Vector2(velocity_x, velocity_y)
	move_and_slide()
	velocity_x = velocity.x
	velocity_y = velocity.y

func start_jump() -> void:
	velocity_y = -Constants.PLAYER_JUMP_FORCE
	var_jump_timer = Constants.VAR_JUMP_TIME
	_jumped = true
	# Horizontal boost when jumping while moving
	if absf(velocity_x) > Constants.PLAYER_RUN_SPEED * 0.4:
		velocity_x += signf(velocity_x) * Constants.JUMP_H_BOOST
	_squash_target = Vector2(0.85, 1.15)
	state_machine.transition_to("Jump")
	wants_to_jump = false
	coyote_timer = 0.0
	# Run move_and_slide() so is_on_floor() updates this frame;
	# without this, the stale on-floor flag resets velocity_y to 0 next frame.
	apply_movement()

func try_start_dash() -> void:
	if dash_cooldown_timer <= 0.0 and state_machine.current_state and state_machine.current_state.name not in ["Dash", "WallSlide"]:
		state_machine.transition_to("Dash")
		dash_timer = Constants.DASH_DURATION
		dash_cooldown_timer = Constants.DASH_COOLDOWN
		EventBus.dash_started.emit()
		# Swoosh sound
		if _dash_sound:
			_dash_sound.play()
		# Dust puff particles behind the player
		_spawn_dash_dust()

func _spawn_dash_dust() -> void:
	var dust_count := 5
	var behind_dir := -1.0 if is_facing_right else 1.0
	var foot_offset := Vector2(behind_dir * 4.0, 8.0)  # behind player, at foot level

	for i in range(dust_count):
		var dot := Sprite2D.new()
		dot.texture = _get_dust_texture()
		dot.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		dot.modulate = Color(0.85, 0.85, 0.9, 1.0)
		get_parent().add_child(dot)
		dot.global_position = global_position + foot_offset + Vector2(randf_range(-2, 2), randf_range(-1, 1))

		# Each particle drifts behind + slightly upward, then fades
		var drift := Vector2(behind_dir * randf_range(8.0, 18.0), randf_range(-6.0, 2.0))
		var target_pos := dot.global_position + drift
		var dur := randf_range(0.2, 0.35)

		var tween := create_tween()
		tween.set_ease(Tween.EASE_OUT)
		tween.set_trans(Tween.TRANS_QUAD)
		tween.tween_property(dot, "global_position", target_pos, dur)
		tween.parallel().tween_property(dot, "modulate:a", 0.0, dur)
		tween.parallel().tween_property(dot, "scale", Vector2(0.5, 0.5), dur)
		tween.tween_callback(dot.queue_free)

var _dust_texture: ImageTexture = null

func _get_dust_texture() -> ImageTexture:
	if _dust_texture == null:
		var img := Image.create(3, 3, false, Image.FORMAT_RGBA8)
		img.fill(Color.WHITE)
		_dust_texture = ImageTexture.create_from_image(img)
	return _dust_texture

func take_damage(amount: float) -> void:
	if hurt_invuln_timer > 0.0:
		return

	health -= amount
	hurt_invuln_timer = Constants.HURT_INVULN_TIME
	state_machine.transition_to("Hurt")
	EventBus.player_damaged.emit(amount)
	EventBus.player_health_changed.emit(health, MAX_HEALTH)

	if health <= 0.0:
		die()

func die() -> void:
	set_collision_disabled(true)
	state_machine.transition_to("Dead")
	EventBus.player_died.emit()

func play_animation(anim_name: String) -> void:
	if not sprite or not sprite.sprite_frames:
		return
	if sprite.animation != anim_name:
		sprite.play(anim_name)
	# Sync equipment sprite to same animation
	if _equipment_sprite and _equipment_sprite.visible and _equipment_sprite.sprite_frames:
		if _equipment_sprite.sprite_frames.has_animation(anim_name):
			_equipment_sprite.play(anim_name)

func update_coyote_timer() -> void:
	if is_on_floor():
		coyote_timer = Constants.COYOTE_TIME
		last_grounded_pos = global_position
		last_wall_normal = Vector2.ZERO
	else:
		coyote_timer -= get_physics_process_delta_time()

# --- Equipped item (swaps sprite sheets to composited versions) ---

func _on_item_picked_up(item_data: Dictionary) -> void:
	_equipped_item_id = item_data.get("id", "")
	_sheet_overrides = item_data.get("composited_sheets", {})
	# Build equipment sprite with composited sheets (base sprite stays unchanged)
	_setup_equipment_animations()
	# Initialize rocket boots fuel
	if _equipped_item_id == "rocket_boots":
		_rocket_fuel = Constants.ROCKET_FUEL_MAX
		EventBus.rocket_fuel_changed.emit(_rocket_fuel, Constants.ROCKET_FUEL_MAX)

# --- Rocket boots ---

func _update_rocket_boots(delta: float) -> void:
	if _equipped_item_id != "rocket_boots":
		return

	var should_thrust := (
		state_machine.current_state != null
		and state_machine.current_state.name in ["Jump", "Fall"]
		and Input.is_action_pressed("jump")
		and var_jump_timer <= 0.0
		and _rocket_fuel > 0.0
	)

	# Start thrust
	if should_thrust and not rocket_thrusting:
		rocket_thrusting = true
		if _flame_sprite:
			_flame_sprite.visible = true
			_flame_sprite.play("burn")
		if _thrust_sound and not _thrust_sound.playing:
			_thrust_sound.play()

	# Stop thrust
	if not should_thrust and rocket_thrusting:
		rocket_thrusting = false
		if _flame_sprite:
			_flame_sprite.visible = false
		if _thrust_sound:
			_thrust_sound.stop()

	# Drain fuel while thrusting
	if rocket_thrusting:
		_rocket_fuel -= Constants.ROCKET_FUEL_DRAIN * delta
		if _rocket_fuel <= 0.0:
			_rocket_fuel = 0.0
			rocket_thrusting = false
			if _flame_sprite:
				_flame_sprite.visible = false
			if _thrust_sound:
				_thrust_sound.stop()
		EventBus.rocket_fuel_changed.emit(_rocket_fuel, Constants.ROCKET_FUEL_MAX)

	# Refuel on ground
	if is_on_floor() and _rocket_fuel < Constants.ROCKET_FUEL_MAX:
		var prev := _rocket_fuel
		_rocket_fuel = minf(_rocket_fuel + Constants.ROCKET_FUEL_REFILL * delta, Constants.ROCKET_FUEL_MAX)
		if _rocket_fuel != prev:
			EventBus.rocket_fuel_changed.emit(_rocket_fuel, Constants.ROCKET_FUEL_MAX)

# --- Collision toggle ---

func set_collision_disabled(disabled: bool) -> void:
	$CollisionShape2D.set_deferred("disabled", disabled)

# --- Dissolve / materialize shader system ---

## Set dissolve_amount to fully-dissolved (invisible).
## Shader is permanently applied, so this is just a parameter change — no flicker.
func prepare_dissolved() -> void:
	_dissolve_material.set_shader_parameter("dissolve_amount", 1.0)

func dissolve(duration: float, on_complete: Callable = Callable()) -> Tween:
	_is_dissolving = true
	# Hide flame and stop thrust immediately
	if _flame_sprite:
		_flame_sprite.visible = false
	if _thrust_sound:
		_thrust_sound.stop()
	rocket_thrusting = false

	var tween := create_tween()
	tween.tween_property(_dissolve_material, "shader_parameter/dissolve_amount", 1.0, duration)
	if on_complete.is_valid():
		tween.tween_callback(on_complete)
	return tween

func materialize(duration: float, on_complete: Callable = Callable()) -> Tween:
	_is_dissolving = true
	_dissolve_material.set_shader_parameter("dissolve_amount", 1.0)

	var tween := create_tween()
	tween.tween_property(_dissolve_material, "shader_parameter/dissolve_amount", 0.0, duration)
	tween.tween_callback(func():
		_is_dissolving = false
	)
	if on_complete.is_valid():
		tween.tween_callback(on_complete)
	return tween

func reset_for_respawn(spawn_pos: Vector2) -> void:
	# Position
	global_position = spawn_pos

	# Physics
	velocity_x = 0.0
	velocity_y = 0.0
	velocity = Vector2.ZERO

	# Health
	health = MAX_HEALTH
	EventBus.player_health_changed.emit(health, MAX_HEALTH)

	# Timers
	coyote_timer = 0.0
	jump_buffer_timer = 0.0
	dash_timer = 0.0
	dash_cooldown_timer = 0.0
	hurt_invuln_timer = 0.0
	attack_timer = 0.0
	wall_jump_timer = 0.0
	var_jump_timer = 0.0

	# State bools
	wants_to_jump = false
	can_jump = true
	_was_on_floor = false
	_jumped = false

	# Squash/stretch reset
	_squash_target = Vector2(1.0, 1.0)
	sprite.scale = Vector2(1.0, 1.0)
	if _equipment_sprite:
		_equipment_sprite.scale = Vector2(1.0, 1.0)

	# Rocket boots: refuel
	if _equipped_item_id == "rocket_boots":
		_rocket_fuel = Constants.ROCKET_FUEL_MAX
		EventBus.rocket_fuel_changed.emit(_rocket_fuel, Constants.ROCKET_FUEL_MAX)

	# Flame sprite
	if _flame_sprite:
		_flame_sprite.visible = false
	rocket_thrusting = false

	# Facing
	is_facing_right = true
	if sprite:
		sprite.flip_h = false
	if _equipment_sprite:
		_equipment_sprite.flip_h = false

	# Transition to Spawn state (frozen, waiting for materialize)
	state_machine.transition_to("Spawn")

## Re-enable collision directly and run move_and_slide() to prime is_on_floor().
## Must be called before transitioning out of Spawn to prevent stale floor detection
## (SpawnState.exit uses set_deferred which delays one frame — too late for IdleState).
func prime_collision() -> void:
	$CollisionShape2D.disabled = false
	velocity_y = 1.0  # tiny downward push to ensure floor contact detection
	apply_movement()
	_was_on_floor = is_on_floor()  # sync so landing detection doesn't trigger false squash/stretch
