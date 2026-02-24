# BossPhase2State.gd
# Aerial dive attack: rise off-screen -> telegraph line -> dive at player X -> recovery.
# All timing/speed from @export vars on ExodiaKarimBoss.

extends BossState

enum SubState { RISE, TELEGRAPH, DIVE, RECOVERY }

const OFFSCREEN_TOP_Y: float = -185.0

var _sub_state: SubState = SubState.RISE
var _telegraph_timer: float = 0.0
var _recovery_timer: float = 0.0
var _blink_timer: float = 0.0
var _blink_on: bool = false
var _active_tween: Tween = null


func enter() -> void:
	_blink_on = false
	boss.show_danger_indicator()
	_start_rise()


func exit() -> void:
	_kill_tween()
	_hide_telegraph()
	boss.hide_danger_indicator()
	boss.hide_stomp_indicator()
	boss.set_stunnable(false)
	boss.set_composite_flash(0.0)
	boss.restore_head()
	boss.set_hitbox_active(true)
	# Ensure boss is back on-screen
	boss.global_position.y = boss.arena_ground_y


func physics_update(delta: float) -> void:
	match _sub_state:
		SubState.TELEGRAPH:
			_do_telegraph(delta)
		SubState.RECOVERY:
			_do_recovery(delta)


func _start_rise() -> void:
	_sub_state = SubState.RISE
	_kill_tween()
	boss.set_hitbox_active(false)  # No contact damage while off-screen
	_active_tween = boss.create_tween()
	_active_tween.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	_active_tween.tween_property(boss, "global_position:y", OFFSCREEN_TOP_Y, boss.phase2_rise_duration)
	_active_tween.tween_callback(_begin_telegraph)


func _begin_telegraph() -> void:
	_sub_state = SubState.TELEGRAPH
	# Snap X to player position while off-screen
	var player = boss.get_player_ref()
	if player:
		boss.global_position.x = clampf(player.global_position.x, boss.arena_left, boss.arena_right)
	else:
		boss.global_position.x = boss.arena_center_x
	_telegraph_timer = boss.phase2_telegraph_duration
	_show_telegraph()


func _do_telegraph(delta: float) -> void:
	_telegraph_timer -= delta
	if _telegraph_timer <= 0.0:
		_hide_telegraph()
		_start_dive()


func _start_dive() -> void:
	_sub_state = SubState.DIVE
	_kill_tween()
	boss.set_hitbox_active(true)  # Contact damage during dive
	_active_tween = boss.create_tween()
	_active_tween.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	_active_tween.tween_property(boss, "global_position:y", boss.arena_ground_y, boss.phase2_dive_duration)
	_active_tween.tween_callback(_on_dive_impact)


func _on_dive_impact() -> void:
	EventBus.camera_shake_requested.emit(0.4, 6.0)
	boss.play_impact()
	_enter_recovery()


func _enter_recovery() -> void:
	_sub_state = SubState.RECOVERY
	_recovery_timer = boss.phase2_recovery_duration
	_blink_timer = 0.0
	_blink_on = false
	boss.set_stunnable(true)
	boss.show_stomp_indicator()
	boss.set_hitbox_active(false)  # Safe to approach during recovery
	boss.droop_head()


func _do_recovery(delta: float) -> void:
	_recovery_timer -= delta
	if _recovery_timer <= boss.recovery_blink_before_end:
		_blink_timer -= delta
		if _blink_timer <= 0.0:
			_blink_on = not _blink_on
			_blink_timer = 0.15
			boss.set_composite_flash(0.5 if _blink_on else 0.0)
	if _recovery_timer <= 0.0 and boss._stunnable:
		boss.set_stunnable(false)
		boss.hide_stomp_indicator()
		boss.set_composite_flash(0.0)
		boss.restore_head()
		_start_rise()  # Next attack cycle


func _show_telegraph() -> void:
	var line = boss.get_telegraph_line()
	if line:
		# Position relative to boss (who is off-screen) so line renders in arena
		line.position = Vector2(-2, boss.arena_top_y - boss.global_position.y)
		line.size.y = absf(boss.arena_ground_y - boss.arena_top_y) + 40.0
		line.visible = true


func _hide_telegraph() -> void:
	var line = boss.get_telegraph_line()
	if line:
		line.visible = false


func _kill_tween() -> void:
	if _active_tween and _active_tween.is_valid():
		_active_tween.kill()
		_active_tween = null
