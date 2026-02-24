# BossPhase1State.gd
# Ground charge attack: walk toward player -> telegraph -> charge at wall -> recovery.
# All timing/speed from @export vars on ExodiaKarimBoss.

extends BossState

enum SubState { APPROACH, TELEGRAPH, CHARGE, RECOVERY }

var _sub_state: SubState = SubState.APPROACH
var _telegraph_timer: float = 0.0
var _recovery_timer: float = 0.0
var _blink_timer: float = 0.0
var _blink_on: bool = false
var _charge_direction: float = 1.0
var _active_tween: Tween = null


func enter() -> void:
	_sub_state = SubState.APPROACH
	_blink_on = false
	boss.show_danger_indicator()
	boss.set_hitbox_active(true)
	# Ensure boss is at ground level
	boss.global_position.y = boss.arena_ground_y


func exit() -> void:
	_kill_tween()
	boss.hide_danger_indicator()
	boss.hide_stomp_indicator()
	boss.set_stunnable(false)
	boss.set_composite_flash(0.0)
	boss.restore_head()
	boss.set_hitbox_active(true)


func physics_update(delta: float) -> void:
	match _sub_state:
		SubState.APPROACH:
			_do_approach(delta)
		SubState.TELEGRAPH:
			_do_telegraph(delta)
		SubState.CHARGE:
			pass  # tween handles movement
		SubState.RECOVERY:
			_do_recovery(delta)


func _do_approach(delta: float) -> void:
	var player = boss.get_player_ref()
	if not player:
		return
	var dir := signf(player.global_position.x - boss.global_position.x)
	if dir == 0.0:
		dir = 1.0
	boss.global_position.x += dir * boss.phase1_walk_speed * delta
	boss.global_position.x = clampf(boss.global_position.x, boss.arena_left, boss.arena_right)
	# Keep at ground level
	boss.global_position.y = boss.arena_ground_y

	var dist := absf(player.global_position.x - boss.global_position.x)
	if dist <= boss.phase1_charge_range:
		_start_telegraph()


func _start_telegraph() -> void:
	_sub_state = SubState.TELEGRAPH
	_telegraph_timer = boss.phase1_telegraph_duration
	# Lock chargde direction toward player
	var player = boss.get_player_ref()
	if player:
		_charge_direction = signf(player.global_position.x - boss.global_position.x)
	if _charge_direction == 0.0:
		_charge_direction = 1.0
	boss.play_rumble()


func _do_telegraph(delta: float) -> void:
	_telegraph_timer -= delta
	# Flashing during telegraph
	var flash: float = 0.5 if fmod(_telegraph_timer, 0.2) > 0.1 else 0.0
	boss.set_composite_flash(flash)
	if _telegraph_timer <= 0.0:
		boss.set_composite_flash(0.0)
		_start_charge()


func _start_charge() -> void:
	_sub_state = SubState.CHARGE
	_kill_tween()
	var target_x: float = boss.arena_right if _charge_direction > 0.0 else boss.arena_left
	var dist: float = absf(target_x - boss.global_position.x)
	var duration: float = dist / boss.phase1_charge_speed
	if duration < 0.05:
		duration = 0.05  # Minimum to avoid zero-length tween
	_active_tween = boss.create_tween()
	_active_tween.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	_active_tween.tween_property(boss, "global_position:x", target_x, duration)
	_active_tween.tween_callback(_on_charge_hit_wall)


func _on_charge_hit_wall() -> void:
	EventBus.camera_shake_requested.emit(0.3, 5.0)
	boss.play_impact()
	_enter_recovery()


func _enter_recovery() -> void:
	_sub_state = SubState.RECOVERY
	_recovery_timer = boss.phase1_recovery_duration
	_blink_timer = 0.0
	_blink_on = false
	boss.set_stunnable(true)
	boss.show_stomp_indicator()
	boss.set_hitbox_active(false)  # No contact damage during recovery
	boss.droop_head()


func _do_recovery(delta: float) -> void:
	_recovery_timer -= delta
	# Blink warning before recovery ends
	if _recovery_timer <= boss.recovery_blink_before_end:
		_blink_timer -= delta
		if _blink_timer <= 0.0:
			_blink_on = not _blink_on
			_blink_timer = 0.15
			boss.set_composite_flash(0.5 if _blink_on else 0.0)
	# Auto-recover if not stomped
	if _recovery_timer <= 0.0 and boss._stunnable:
		boss.set_stunnable(false)
		boss.hide_stomp_indicator()
		boss.set_composite_flash(0.0)
		boss.restore_head()
		boss.set_hitbox_active(true)
		_sub_state = SubState.APPROACH


func _kill_tween() -> void:
	if _active_tween and _active_tween.is_valid():
		_active_tween.kill()
		_active_tween = null
