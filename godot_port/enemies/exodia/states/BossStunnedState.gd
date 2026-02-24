# BossStunnedState.gd
# Fallback stunned state. Primary recovery is now handled per-phase
# (each phase state manages its own recovery sub-state).
# Kept for backward compatibility — enter_stunned() still exists on boss.

extends BossState

var _recovery_timer: float = 0.0
var _blink_timer: float = 0.0
var _blink_on: bool = false
var _active_tween: Tween = null


func enter() -> void:
	_recovery_timer = 3.5
	_blink_timer = 0.0
	_blink_on = false

	# Tween boss to arena center at ground level
	_kill_tween()
	_active_tween = boss.create_tween()
	_active_tween.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	_active_tween.set_parallel(true)
	_active_tween.tween_property(boss, "global_position:x", boss.arena_center_x, 0.3)
	_active_tween.tween_property(boss, "global_position:y", boss.arena_ground_y, 0.3)

	boss.set_stunnable(true)
	boss.show_stomp_indicator()
	boss.set_hitbox_active(false)
	boss.droop_head()


func exit() -> void:
	_kill_tween()
	boss.set_stunnable(false)
	boss.hide_stomp_indicator()
	boss.set_composite_flash(0.0)
	boss.restore_head()
	boss.set_hitbox_active(true)


func physics_update(delta: float) -> void:
	_recovery_timer -= delta

	# Blink warning
	if _recovery_timer <= boss.recovery_blink_before_end:
		_blink_timer -= delta
		if _blink_timer <= 0.0:
			_blink_on = not _blink_on
			_blink_timer = 0.15
			boss.set_composite_flash(0.5 if _blink_on else 0.0)

	# Auto-recover: repeat same phase
	if _recovery_timer <= 0.0:
		boss.set_stunnable(false)
		match boss._current_phase:
			1:
				state_machine.transition_to("BossPhase1")
			2:
				state_machine.transition_to("BossPhase2")
			3:
				state_machine.transition_to("BossPhase3")


func _kill_tween() -> void:
	if _active_tween and _active_tween.is_valid():
		_active_tween.kill()
		_active_tween = null
