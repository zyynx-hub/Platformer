@tool
# MysticalLevelController.gd
# Manages cosmic atmosphere, pedestal system, pre-boss cutscene, and boss fight.
# Cutscene uses named segment functions for clear sequence visibility.
# Boss is pre-placed in scene (visible=false), not instantiated at runtime.
# CutsceneAnimPlayer holds reference animations; actual flow is await-driven.

extends Node2D

# --- Existing level nodes ---
@onready var _sky: ColorRect = %Sky
@onready var _vignette: ColorRect = %VignetteOverlay
@onready var _pedestal: Node2D = %StonePedestal
@onready var _slot1: ColorRect = %Slot1
@onready var _slot2: ColorRect = %Slot2
@onready var _slot3: ColorRect = %Slot3
@onready var _cloud_karim: Area2D = %CloudKarim
@onready var _portal_back: Area2D = %PortalBack

# --- Scene-built cutscene nodes ---
@onready var _cutscene_nodes: Node2D = %CutsceneNodes
@onready var _purple_clone: Sprite2D = %PurpleClone
@onready var _green_clone: Sprite2D = %GreenClone
@onready var _red_clone: Sprite2D = %RedClone
@onready var _orange_clone: Sprite2D = %OrangeClone
@onready var _hydra_reveal: Node2D = %HydraReveal
@onready var _white_flash: ColorRect = %WhiteFlash
@onready var _slash_left: Area2D = %SlashLeft
@onready var _slash_right: Area2D = %SlashRight
@onready var _cutscene_rumble: AudioStreamPlayer = %CutsceneRumbleSFX
@onready var _cutscene_impact: AudioStreamPlayer = %CutsceneImpactSFX

# --- Weather (for post-boss rain) ---
@onready var _weather: Node2D = %WeatherController

# --- Pre-placed boss (hidden until cutscene reveals it) ---
@onready var _boss: Node2D = %ExodiaKarim

# ItemAcquiredPopup for post-boss reward
var _ItemPopup: PackedScene = preload("res://ui/popup/ItemAcquiredPopup.tscn")

# Cached viewport size
var _visible_size: Vector2 = Vector2.ZERO
var _cutscene_active: bool = false


func _ready() -> void:
	var vp := get_viewport()
	if vp:
		var inv_scale := Vector2(1.0, 1.0) / vp.canvas_transform.get_scale()
		_visible_size = Vector2(vp.size) * inv_scale
	if Engine.is_editor_hint():
		return

	EventBus.quest_state_changed.connect(_on_quest_state_changed)
	EventBus.cinematic_dialog_ended.connect(_on_cinematic_dialog_ended)
	_update_pedestal_visuals()

	# Setup boss arena from Marker2D nodes
	_boss.setup_arena({
		"arena_left": %ArenaLeft,
		"arena_right": %ArenaRight,
		"arena_top_left": %ArenaTopLeft,
		"arena_top_right": %ArenaTopRight,
		"arena_center": %ArenaCenter,
	})
	_boss._debug_label = %DebugStateLabel

	# If boss was already defeated, hide everything
	var pd := ProgressData.new()
	if pd.get_quest("exodia_boss_defeated"):
		_hide_cloud_and_pedestal()
		_boss.visible = false


func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event is InputEventKey and event.pressed and event.keycode == KEY_F12:
		if not _cutscene_active:
			_hide_cloud_and_pedestal()
			_debug_spawn_boss()


func _process(_delta: float) -> void:
	var vp := get_viewport()
	if not vp:
		return
	var cam_world := vp.canvas_transform.affine_inverse() * (Vector2(vp.size) * 0.5)
	if _sky:
		_sky.offset_left   = cam_world.x - _visible_size.x * 0.5
		_sky.offset_top    = cam_world.y - _visible_size.y * 0.5
		_sky.offset_right  = cam_world.x + _visible_size.x * 0.5
		_sky.offset_bottom = cam_world.y + _visible_size.y * 0.5
		_sky.material.set_shader_parameter("camera_offset", cam_world)
	if _vignette:
		_vignette.offset_left   = cam_world.x - _visible_size.x * 0.5
		_vignette.offset_top    = cam_world.y - _visible_size.y * 0.5
		_vignette.offset_right  = cam_world.x + _visible_size.x * 0.5
		_vignette.offset_bottom = cam_world.y + _visible_size.y * 0.5


# ===== PEDESTAL =====

func _on_quest_state_changed(key: String, _val: bool) -> void:
	if key in ["pedestal_butt_plug", "pedestal_dildo", "pedestal_vibrator"]:
		_update_pedestal_visuals()


func _update_pedestal_visuals() -> void:
	var pd := ProgressData.new()
	if _slot1:
		_slot1.visible = pd.get_quest("pedestal_butt_plug")
	if _slot2:
		_slot2.visible = pd.get_quest("pedestal_dildo")
	if _slot3:
		_slot3.visible = pd.get_quest("pedestal_vibrator")


# ===== DIALOG HANDLING =====

func _wait_for_dialog(dialog_id: String) -> void:
	EventBus.dialog_requested.emit(dialog_id)
	while true:
		var ended_id = await EventBus.cinematic_dialog_ended
		if ended_id == dialog_id:
			break


func _on_cinematic_dialog_ended(dialog_id: String) -> void:
	# Cutscene trigger
	if dialog_id == "level_mystical/cloud_karim/all_placed":
		_run_pre_boss_cutscene()
	# Boss phase taunts
	elif dialog_id == "level_mystical/exodia_karim/phase1_taunt":
		_boss.advance_phase()
	elif dialog_id == "level_mystical/exodia_karim/phase2_taunt":
		_boss.advance_phase()
	elif dialog_id == "level_mystical/exodia_karim/phase3_taunt":
		# Phase 3 is the final phase — resume it (no Phase 4)
		_boss._boss_sm.transition_to("BossPhase3")


# ===== PRE-BOSS CUTSCENE (segment-based) =====
# Each segment is a clearly named async function.
# The sequence is readable at a glance below.

func _run_pre_boss_cutscene() -> void:
	if _cutscene_active:
		return
	_cutscene_active = true

	await _seg_01_rumble()
	await _seg_02_purple_walks()
	await _wait_for_dialog("level_mystical/pre_boss/purple_arrives")
	await _seg_03_others_walk()
	await _wait_for_dialog("level_mystical/pre_boss/others_arrive")
	await _seg_04_absorption()
	await _seg_06_assembly()
	await _wait_for_dialog("level_mystical/pre_boss/exodia_forms")
	await _seg_07_fight_start()

	_cutscene_active = false
	_start_boss_fight()


# --- Segment 1: Rumble + shake ---
func _seg_01_rumble() -> void:
	EventBus.camera_shake_requested.emit(0.5, 3.0)
	_cutscene_rumble.play()
	await get_tree().create_timer(0.6).timeout


# --- Segment 2: Purple Karim walks in from right ---
func _seg_02_purple_walks() -> void:
	var cloud_pos := _cloud_karim.global_position if _cloud_karim else Vector2(400, -10)
	_cutscene_nodes.visible = true
	_purple_clone.global_position = Vector2(cloud_pos.x + 250, -16)
	_purple_clone.flip_h = true
	_purple_clone.visible = true

	var tw := _purple_clone.create_tween()
	tw.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_SINE)
	tw.tween_property(_purple_clone, "global_position:x", cloud_pos.x + 60, 1.2)
	await tw.finished
	await get_tree().create_timer(0.3).timeout

	EventBus.camera_cinematic_move.emit(
		Vector2(_purple_clone.global_position.x, _purple_clone.global_position.y - 20),
		Vector2.ONE, 0.7)
	await EventBus.camera_cinematic_done


# --- Segment 3: Green, Red, Orange walk in from left ---
func _seg_03_others_walk() -> void:
	var cloud_pos := _cloud_karim.global_position if _cloud_karim else Vector2(400, -10)
	var group_target := Vector2(cloud_pos.x, -36)
	EventBus.camera_cinematic_move.emit(group_target, Vector2.ONE, 0.6)
	await EventBus.camera_cinematic_done

	_green_clone.global_position = Vector2(cloud_pos.x - 250, -16)
	_green_clone.visible = true
	_red_clone.global_position = Vector2(cloud_pos.x - 300, -16)
	_red_clone.visible = true
	_orange_clone.global_position = Vector2(cloud_pos.x - 350, -16)
	_orange_clone.visible = true

	var tw_green := _green_clone.create_tween()
	tw_green.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_SINE)
	tw_green.tween_property(_green_clone, "global_position:x", cloud_pos.x - 40, 1.0)
	var tw_red := _red_clone.create_tween()
	tw_red.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_SINE)
	tw_red.tween_interval(0.3)
	tw_red.tween_property(_red_clone, "global_position:x", cloud_pos.x - 70, 1.0)
	var tw_orange := _orange_clone.create_tween()
	tw_orange.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_SINE)
	tw_orange.tween_interval(0.6)
	tw_orange.tween_property(_orange_clone, "global_position:x", cloud_pos.x - 100, 1.0)
	await tw_orange.finished
	await get_tree().create_timer(0.4).timeout

	var center := (_purple_clone.global_position + _green_clone.global_position
		+ _red_clone.global_position + _orange_clone.global_position) / 4.0
	center.y -= 20
	EventBus.camera_cinematic_move.emit(center, Vector2.ONE, 0.6)
	await EventBus.camera_cinematic_done


# --- Segment 4: Clones sucked into cloud, then white flash ---
func _seg_04_absorption() -> void:
	var cloud_pos := _cloud_karim.global_position if _cloud_karim else Vector2(400, -10)
	await get_tree().create_timer(0.3).timeout

	# Clones visibly pulled toward cloud karim
	var clones: Array[Sprite2D] = [_purple_clone, _green_clone, _red_clone, _orange_clone]
	var last_tween: Tween = null
	for clone in clones:
		var absorb := clone.create_tween()
		absorb.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
		absorb.set_parallel(true)
		absorb.tween_property(clone, "global_position", cloud_pos, 0.8)
		absorb.tween_property(clone, "scale", Vector2(0.1, 0.1), 0.8)
		absorb.tween_property(clone, "modulate:a", 0.0, 0.8)
		last_tween = absorb
	if last_tween:
		await last_tween.finished
	await get_tree().create_timer(0.2).timeout

	for clone in clones:
		clone.visible = false

	# Camera shake as cloud absorbs the energy
	EventBus.camera_shake_requested.emit(1.0, 6.0)
	_cutscene_rumble.play()

	# White flash AFTER absorption
	var flash_in := create_tween()
	flash_in.tween_property(_white_flash, "modulate:a", 1.0, 0.4)
	await flash_in.finished

	# Behind the flash: dissolve cloud and hide everything
	_dissolve_cloud_puffs()
	_hide_cloud_and_pedestal()
	await get_tree().create_timer(0.6).timeout



# --- Segment 5: Boss assembly (BossAnimPlayer plays "assembly") ---
func _seg_06_assembly() -> void:
	# Prepare boss behind the white flash (all parts alpha=0)
	_boss.prepare_for_assembly()
	_boss.visible = true

	# Fade out white flash to reveal the arena
	var flash_out := create_tween()
	flash_out.tween_property(_white_flash, "modulate:a", 0.0, 0.5)
	await flash_out.finished

	EventBus.camera_cinematic_move.emit(Vector2(400, -80), Vector2(1.5, 1.5), 0.6)
	await EventBus.camera_cinematic_done

	_boss.get_anim().play("assembly")
	await _boss.get_anim().animation_finished

	EventBus.camera_shake_requested.emit(0.4, 5.0)
	_cutscene_rumble.play()
	await get_tree().create_timer(0.8).timeout


# --- Segment 7: Boss music + camera release ---
func _seg_07_fight_start() -> void:
	AudioManager.play_music("boss_exodia", 1.2)
	EventBus.camera_cinematic_release.emit(0.8)
	await EventBus.camera_cinematic_done


# ===== BOSS FIGHT =====

func _start_boss_fight() -> void:
	if _portal_back:
		_portal_back.visible = false
		_portal_back.set_deferred("monitoring", false)

	var player = get_tree().get_first_node_in_group("player")
	if player:
		player.hurt_invuln_timer = 1.5

	_boss.slash_left = _slash_left
	_boss.slash_right = _slash_right

	if not _boss.phase_completed.is_connected(_on_boss_phase_completed):
		_boss.phase_completed.connect(_on_boss_phase_completed)
	if not _boss.boss_defeated.is_connected(_on_boss_defeated):
		_boss.boss_defeated.connect(_on_boss_defeated)

	var left_limit: Marker2D = %BossArena.find_child("CameraLeftLimit", false, false)
	var right_limit: Marker2D = %BossArena.find_child("CameraRightLimit", false, false)
	var cam_pad := 20.0
	if left_limit and right_limit:
		EventBus.camera_boss_lock.emit(
			left_limit.global_position.x - cam_pad,
			right_limit.global_position.x + cam_pad,
			-200.0, 50.0)

	await get_tree().create_timer(0.5).timeout
	_boss.start_fight()


func _debug_spawn_boss() -> void:
	# Give player rocket boots if not already equipped
	var item_def: Dictionary = ItemDefs.get_item("rocket_boots")
	if not item_def.is_empty():
		EventBus.item_picked_up.emit(item_def)
	_boss.visible = true
	_start_boss_fight()


func _on_boss_phase_completed(phase: int) -> void:
	var dialog_id := ""
	match phase:
		1: dialog_id = "level_mystical/exodia_karim/phase1_taunt"
		2: dialog_id = "level_mystical/exodia_karim/phase2_taunt"
		3: dialog_id = "level_mystical/exodia_karim/phase3_taunt"
	if dialog_id != "":
		EventBus.dialog_requested.emit(dialog_id)


func _on_boss_defeated() -> void:
	_run_post_boss_cutscene()


# ===== POST-BOSS CUTSCENE (segment-based, mirrors pre-boss pattern) =====

func _run_post_boss_cutscene() -> void:
	if _cutscene_active:
		return
	_cutscene_active = true

	await _seg_post_01_freeze_and_mood()
	await _seg_post_02_defeat_dialog()
	await _seg_post_03_explosion()
	await _seg_post_04_karim_materialization()
	await _seg_post_05_weather_clears()
	await _seg_post_06_victory_dialog()
	await _seg_post_07_karims_leave()
	await _seg_post_08_reward_and_cleanup()

	_cutscene_active = false


# --- Post Seg 1: Freeze boss state, crossfade to sad music, start rain, dim sky ---
func _seg_post_01_freeze_and_mood() -> void:
	# Boss is already dead/invisible from defeated animation — just set the mood
	AudioManager.play_music("post_boss_sad", 2.0)

	# Start rain
	if _weather:
		_weather.set_weather(1)  # Weather.RAIN

	# Dim the sky for a somber atmosphere
	var dim_tween := create_tween()
	dim_tween.tween_property(_sky, "modulate", Color(0.6, 0.6, 0.7, 1), 1.5)
	await dim_tween.finished

	await get_tree().create_timer(1.0).timeout


# --- Post Seg 2: Camera pan to boss position, defeat monologue ---
func _seg_post_02_defeat_dialog() -> void:
	# Pan camera to where the boss was (arena center)
	var boss_pos := Vector2(400, -40)
	EventBus.camera_cinematic_move.emit(boss_pos, Vector2(1.3, 1.3), 0.8)
	await EventBus.camera_cinematic_done

	await _wait_for_dialog("level_mystical/exodia_karim/defeat")
	await get_tree().create_timer(0.5).timeout


# --- Post Seg 3: Explosion effect, white flash, boss removed ---
func _seg_post_03_explosion() -> void:
	# Camera shake + impact SFX
	EventBus.camera_shake_requested.emit(1.5, 8.0)
	_cutscene_impact.play()

	# White flash
	var flash_in := create_tween()
	flash_in.tween_property(_white_flash, "modulate:a", 1.0, 0.4)
	await flash_in.finished

	# Behind the flash: remove boss permanently
	if _boss:
		_boss.visible = false
		_boss.set_process(false)
		_boss.set_physics_process(false)

	# Set defeated quest flag
	var pd := ProgressData.new()
	pd.set_quest("exodia_boss_defeated", true)
	pd.save_progress()

	# Hold flash briefly
	await get_tree().create_timer(0.4).timeout

	# Fade out flash
	var flash_out := create_tween()
	flash_out.tween_property(_white_flash, "modulate:a", 0.0, 0.5)
	await flash_out.finished

	await get_tree().create_timer(0.3).timeout


# --- Post Seg 4: 4 Karim clones materialize (reverse of absorption) ---
func _seg_post_04_karim_materialization() -> void:
	var center_x := 400.0
	var ground_y := -16.0

	# Position clones around center, reset their properties from absorption
	var clones: Array[Sprite2D] = [_purple_clone, _green_clone, _red_clone, _orange_clone]
	var offsets: Array[float] = [60.0, -40.0, -70.0, -100.0]

	for i in range(clones.size()):
		var clone := clones[i]
		clone.global_position = Vector2(center_x, ground_y)
		clone.scale = Vector2(0.1, 0.1)
		clone.modulate.a = 0.0
		clone.visible = true

	_cutscene_nodes.visible = true

	# Staggered materialization
	var last_tween: Tween = null
	for i in range(clones.size()):
		var clone := clones[i]
		var target_x := center_x + offsets[i]

		var mat_tw := clone.create_tween()
		mat_tw.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
		mat_tw.set_parallel(true)
		mat_tw.tween_property(clone, "scale", Vector2.ONE, 0.5)
		mat_tw.tween_property(clone, "modulate:a", 1.0, 0.4)
		mat_tw.tween_property(clone, "global_position:x", target_x, 0.5)
		mat_tw.set_parallel(false)
		mat_tw.tween_callback(func():
			EventBus.camera_shake_requested.emit(0.15, 2.0)
		)
		last_tween = mat_tw

		if i < clones.size() - 1:
			await get_tree().create_timer(0.3).timeout

	if last_tween:
		await last_tween.finished

	await get_tree().create_timer(0.5).timeout


# --- Post Seg 5: Rain stops, music crossfades back to mystical theme ---
func _seg_post_05_weather_clears() -> void:
	# Stop rain
	if _weather:
		_weather.set_weather(0)  # Weather.CLEAR

	# Crossfade to mystical level music
	AudioManager.play_music("level_mystical", 1.5)

	# Restore sky brightness
	var bright_tween := create_tween()
	bright_tween.tween_property(_sky, "modulate", Color(1, 1, 1, 1), 2.0)
	await bright_tween.finished


# --- Post Seg 6: Camera release + victory dialog ---
func _seg_post_06_victory_dialog() -> void:
	EventBus.camera_cinematic_release.emit(0.8)
	await EventBus.camera_cinematic_done

	await _wait_for_dialog("level_mystical/victory/reunion")
	await get_tree().create_timer(0.3).timeout


# --- Post Seg 7: 4 Karims walk off-screen ---
func _seg_post_07_karims_leave() -> void:
	# Purple walks right, others walk left (mirrors their entrance)
	var leave_purple := _purple_clone.create_tween()
	leave_purple.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_SINE)
	leave_purple.set_parallel(true)
	leave_purple.tween_property(_purple_clone, "global_position:x",
		_purple_clone.global_position.x + 300, 1.5)
	leave_purple.tween_property(_purple_clone, "modulate:a", 0.0, 1.5)

	await get_tree().create_timer(0.4).timeout

	var others: Array[Sprite2D] = [_green_clone, _red_clone, _orange_clone]
	var last_tween: Tween = null
	for i in range(others.size()):
		var clone := others[i]
		clone.flip_h = true
		var leave_tw := clone.create_tween()
		leave_tw.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_SINE)
		leave_tw.set_parallel(true)
		leave_tw.tween_property(clone, "global_position:x",
			clone.global_position.x - 300, 1.5)
		leave_tw.tween_property(clone, "modulate:a", 0.0, 1.5)
		last_tween = leave_tw

		if i < others.size() - 1:
			await get_tree().create_timer(0.4).timeout

	if last_tween:
		await last_tween.finished

	# Cleanup clones
	var clones: Array[Sprite2D] = [_purple_clone, _green_clone, _red_clone, _orange_clone]
	for clone in clones:
		clone.visible = false

	_cutscene_nodes.visible = false


# --- Post Seg 8: Quest complete, item popup, portal, camera unlock ---
func _seg_post_08_reward_and_cleanup() -> void:
	# Set quest complete
	var pd := ProgressData.new()
	pd.set_quest("quest_exodia_complete", true)
	pd.save_progress()

	# Show item acquired popup
	var popup = _ItemPopup.instantiate()
	popup.setup("Master of Pleasure", null)
	get_tree().current_scene.add_child(popup)
	await popup.popup_finished

	# Show return portal
	if _portal_back:
		_portal_back.visible = true
		_portal_back.set_deferred("monitoring", true)

	# Unlock camera (restore original limits)
	EventBus.camera_boss_unlock.emit()


# ===== HELPERS =====

func _hide_cloud_and_pedestal() -> void:
	if _cloud_karim:
		_cloud_karim.visible = false
		_cloud_karim.set_deferred("monitoring", false)
		_cloud_karim.set_process(false)
		_cloud_karim.set_physics_process(false)
	if _pedestal:
		_pedestal.visible = false


func _dissolve_cloud_puffs() -> void:
	if not _cloud_karim:
		return
	var puff_groups := [
		["Puff5", "Puff6"],
		["Puff3", "Puff4"],
		["Puff1", "Puff2"],
		["Puff7"],
	]
	var delay := 0.0
	for group in puff_groups:
		for puff_name in group:
			var puff = _cloud_karim.find_child(puff_name, false, false)
			if puff:
				var tw := puff.create_tween()
				tw.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
				tw.tween_interval(delay)
				tw.tween_property(puff, "modulate:a", 0.0, 0.4)
		delay += 0.15
