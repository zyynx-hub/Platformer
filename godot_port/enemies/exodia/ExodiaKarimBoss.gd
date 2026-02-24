# ExodiaKarimBoss.gd
# 3-phase boss fight. Extends Enemy so Player stomp detection works (collider is Enemy).
# Phase 1: Ground charge. Phase 2: Aerial dive. Phase 3: Combined (faster).
# Each attack has telegraph -> attack -> recovery (stompable) cycle.
# Movement is code-driven (tweens + delta). BossAnimPlayer handles visual-only anims.

extends Enemy

signal phase_completed(phase: int)
signal boss_defeated

# --- Tuning (edit in Inspector) ---

@export_group("Phase 1 - Ground Charge")
@export var phase1_walk_speed: float = 40.0
@export var phase1_charge_speed: float = 300.0
@export var phase1_telegraph_duration: float = 0.8
@export var phase1_recovery_duration: float = 2.0
@export var phase1_stomps_needed: int = 2
@export var phase1_charge_range: float = 100.0

@export_group("Phase 2 - Aerial Dive")
@export var phase2_rise_duration: float = 0.6
@export var phase2_telegraph_duration: float = 0.6
@export var phase2_dive_duration: float = 0.4
@export var phase2_recovery_duration: float = 2.0
@export var phase2_stomps_needed: int = 2

@export_group("Phase 3 - Combined")
@export var phase3_telegraph_duration: float = 0.5
@export var phase3_recovery_duration: float = 1.5
@export var phase3_speed_multiplier: float = 1.3
@export var phase3_stomps_needed: int = 1

@export_group("Recovery & Stomp")
@export var stomp_launch_h: float = 120.0
@export var stomp_launch_v: float = -250.0
@export var recovery_blink_before_end: float = 1.2

# --- Boss state machine (separate from inherited EnemyStateMachine) ---
@onready var _boss_sm: BossStateMachine = $BossStateMachine
@onready var _boss_anim: AnimationPlayer = %BossAnimPlayer

# --- Scene-built visual indicators & SFX ---
@onready var _weapon_sprite: Sprite2D = $CompositeBody/WeaponSprite
@onready var _danger_indicator: ColorRect = $DangerIndicator
@onready var _stomp_indicator: ColorRect = $StompIndicator
@onready var _telegraph_line: ColorRect = $TelegraphLine
@onready var _rumble_sfx: AudioStreamPlayer = $BossRumbleSFX
@onready var _impact_sfx: AudioStreamPlayer = $BossImpactSFX
@onready var _head_sprite: Sprite2D = $CompositeBody/Head

# --- Boss state ---
var _current_phase: int = 0  # 0=idle, 1/2/3=active phases
var _stunnable: bool = false
var _boss_defeated_flag: bool = false
var _phase_stomps: int = 0
var _head_default_y: float = -68.0

# --- Arena bounds (set by MysticalLevelController via setup_arena) ---
var arena_left: float = 195.0
var arena_right: float = 605.0
var arena_ground_y: float = -16.0
var arena_center_x: float = 400.0
var arena_top_y: float = -175.0

# --- Player ref cache ---
var _player_ref: Node2D = null

# --- Slash Area2D refs (set by MysticalLevelController for Phase 3) ---
var slash_left: Area2D = null
var slash_right: Area2D = null

# --- Composite body (scene-built in ExodiaKarim.tscn) ---
@onready var _composite_body: Node2D = $CompositeBody

# --- Debug label (set by MysticalLevelController) ---
var _debug_label: Label = null


func _ready() -> void:
	super._ready()
	_boss_sm.init(self)
	_player_detector.set_deferred("monitoring", false)
	_floor_checker.enabled = false
	_hitbox.body_entered.connect(_on_hitbox_body_entered)
	EventBus.player_died.connect(_on_player_died)
	EventBus.player_respawned.connect(_on_player_respawned)
	if _sprite:
		_sprite.visible = false
	if _head_sprite:
		_head_default_y = _head_sprite.position.y


func _physics_process(delta: float) -> void:
	if _is_dead:
		return
	_boss_sm.update(delta)
	_contact_cooldown = maxf(0.0, _contact_cooldown - delta)
	if _debug_label and _debug_label.visible and _boss_sm.current_state:
		_debug_label.text = _boss_sm.current_state.name


# --- Arena setup from Marker2D refs ---

func setup_arena(markers: Dictionary) -> void:
	arena_left = markers.arena_left.global_position.x
	arena_right = markers.arena_right.global_position.x
	arena_center_x = markers.arena_center.global_position.x
	arena_ground_y = markers.arena_center.global_position.y
	arena_top_y = markers.arena_top_left.global_position.y


# --- AnimationPlayer callback targets (called by animation method call tracks) ---

func _on_spawn_finished() -> void:
	var hitbox: Area2D = get_node_or_null("Hitbox")
	if hitbox:
		hitbox.set_deferred("monitoring", true)
	var col: CollisionShape2D = get_node_or_null("CollisionShape")
	if col:
		col.set_deferred("disabled", false)
	begin_phase1()


func _on_dive_landed() -> void:
	# Legacy callback — kept for animation tracks in .tscn (no longer used by states)
	pass


func _on_phase3_sweep_complete() -> void:
	# Legacy callback — kept for animation tracks in .tscn (no longer used by states)
	pass


func _on_recoil_finished() -> void:
	if health <= 0.0:
		_boss_sm.transition_to("BossDefeated")
		return
	_phase_stomps += 1
	var needed := _get_stomps_for_phase(_current_phase)
	if _phase_stomps >= needed:
		_phase_stomps = 0  # Reset for next cycle (Phase 3 loops)
		phase_completed.emit(_current_phase)
	else:
		_resume_current_phase()


func _on_defeated_anim_finished() -> void:
	die()


# --- Assembly animation support (called by assembly method call tracks) ---

func _on_part_landed() -> void:
	EventBus.camera_shake_requested.emit(0.15, 2.5)
	play_impact()


func _on_assembly_finished() -> void:
	EventBus.camera_shake_requested.emit(0.4, 5.0)
	play_rumble()


# --- Damage (only when stunnable) ---

func take_damage(amount: float, _from_position: Vector2 = Vector2.ZERO) -> void:
	if _is_dead or not _stunnable:
		return
	health -= amount
	_play_hit_flash()
	EventBus.enemy_damaged.emit(self, amount)
	EventBus.boss_health_changed.emit(health, max_health)
	EventBus.camera_shake_requested.emit(0.15, 4.0)
	_stunnable = false

	var player: Node2D = get_player_ref()
	if player and player.has_method("stomp_bounce"):
		var dir: float = sign(player.global_position.x - global_position.x)
		if dir == 0.0:
			dir = 1.0
		player.velocity.x = dir * stomp_launch_h
		player.velocity.y = stomp_launch_v
		player.move_and_slide()

	_boss_anim.play("recoil")


func knockback_from(_source_pos: Vector2) -> void:
	pass


func die() -> void:
	if _is_dead:
		return
	_is_dead = true
	_collision_shape.set_deferred("disabled", true)
	_hurtbox.set_deferred("monitoring", false)
	_hitbox.set_deferred("monitoring", false)
	EventBus.boss_fight_ended.emit()
	EventBus.enemy_killed.emit(self)
	boss_defeated.emit()


# --- Fight control ---

func start_fight() -> void:
	_current_phase = 1
	_boss_sm.transition_to("BossSpawning")
	EventBus.boss_fight_started.emit(max_health)


func begin_phase1() -> void:
	_phase_stomps = 0
	_boss_sm.transition_to("BossPhase1")
	EventBus.boss_phase_changed.emit(1)


func enter_stunned() -> void:
	_boss_sm.transition_to("BossStunned")


func set_stunnable(val: bool) -> void:
	_stunnable = val


func advance_phase() -> void:
	_current_phase += 1
	_phase_stomps = 0
	EventBus.boss_phase_changed.emit(_current_phase)
	match _current_phase:
		2:
			_boss_sm.transition_to("BossPhase2")
		3:
			_boss_sm.transition_to("BossPhase3")


func _get_stomps_for_phase(phase: int) -> int:
	match phase:
		1: return phase1_stomps_needed
		2: return phase2_stomps_needed
		3: return phase3_stomps_needed
		_: return 1


func _resume_current_phase() -> void:
	match _current_phase:
		1: _boss_sm.transition_to("BossPhase1")
		2: _boss_sm.transition_to("BossPhase2")
		3: _boss_sm.transition_to("BossPhase3")


# --- Indicator control ---

func show_danger_indicator() -> void:
	if _danger_indicator:
		_danger_indicator.visible = true

func hide_danger_indicator() -> void:
	if _danger_indicator:
		_danger_indicator.visible = false

func show_stomp_indicator() -> void:
	if _stomp_indicator:
		_stomp_indicator.visible = true

func hide_stomp_indicator() -> void:
	if _stomp_indicator:
		_stomp_indicator.visible = false

func show_weapon() -> void:
	if _weapon_sprite:
		_weapon_sprite.visible = true

func hide_weapon() -> void:
	if _weapon_sprite:
		_weapon_sprite.visible = false

func get_telegraph_line() -> ColorRect:
	return _telegraph_line

func play_rumble() -> void:
	if _rumble_sfx:
		_rumble_sfx.play()

func play_impact() -> void:
	if _impact_sfx:
		_impact_sfx.play()

func get_player_ref() -> Node2D:
	if not is_instance_valid(_player_ref):
		_player_ref = get_tree().get_first_node_in_group("player")
	return _player_ref

func get_anim() -> AnimationPlayer:
	return _boss_anim


# --- Head droop (recovery visual — boss dazed, head drops) ---

func droop_head() -> void:
	if _head_sprite:
		var tw := _head_sprite.create_tween()
		tw.tween_property(_head_sprite, "position:y", _head_default_y + 20.0, 0.2)


func restore_head() -> void:
	if _head_sprite:
		var tw := _head_sprite.create_tween()
		tw.tween_property(_head_sprite, "position:y", _head_default_y, 0.15)


# --- Hitbox control (disable contact damage during recovery) ---

func set_hitbox_active(active: bool) -> void:
	if _hitbox:
		_hitbox.set_deferred("monitoring", active)


# --- Area2D contact damage ---

func _on_hitbox_body_entered(body: Node2D) -> void:
	if _is_dead or _contact_cooldown > 0.0:
		return
	if body.is_in_group("player") and body.has_method("take_damage"):
		if body.hurt_invuln_timer <= 0.0:
			body.take_damage(contact_damage, global_position)
			_contact_cooldown = 0.5


# --- Player death: immediately freeze boss ---

func _on_player_died() -> void:
	if _boss_defeated_flag or _is_dead:
		return
	_stunnable = false
	if _boss_anim.is_playing():
		_boss_anim.stop()
	set_hitbox_active(false)
	hide_danger_indicator()
	hide_stomp_indicator()
	hide_weapon()
	set_composite_flash(0.0)
	# Go idle so boss does nothing during Game Over / respawn sequence
	_boss_sm.transition_to("BossIdle")
	# Snap to arena center so boss isn't off-screen (Phase 2 rise)
	global_position = Vector2(arena_center_x, arena_ground_y)


# --- Player respawn: full reset to Phase 1 ---

func _on_player_respawned() -> void:
	if _boss_defeated_flag or _is_dead:
		return
	# Full reset
	_current_phase = 1
	_phase_stomps = 0
	health = max_health
	_stunnable = false
	global_position = Vector2(arena_center_x, arena_ground_y)
	restore_head()
	set_composite_flash(0.0)

	# Refresh HUD — shows full health bar, Phase 1
	EventBus.boss_fight_started.emit(max_health)

	# Brief invulnerability so player can orient after materialization
	var player := get_player_ref()
	if player:
		player.hurt_invuln_timer = 1.5

	# Start fresh from Phase 1
	begin_phase1()


# --- Composite body helpers ---

func _get_composite_parts() -> Array[Node]:
	if _composite_body:
		return _composite_body.get_children()
	return []


func _play_hit_flash() -> void:
	var parts := _get_composite_parts()
	for part in parts:
		if part is Sprite2D and part.material:
			part.material.set_shader_parameter("flash_amount", 1.0)
			var tw := part.create_tween()
			tw.tween_property(part.material, "shader_parameter/flash_amount", 0.0, 0.15)
	if parts.is_empty():
		super._play_hit_flash()


func prepare_for_assembly() -> void:
	for part in _get_composite_parts():
		if part is Sprite2D:
			part.modulate.a = 0.0


func set_composite_flash(amount: float) -> void:
	for part in _get_composite_parts():
		if part is Sprite2D and part.material:
			part.material.set_shader_parameter("flash_amount", amount)
