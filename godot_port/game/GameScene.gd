# GameScene.gd
# Game orchestrator — spawns player, loads selected level, manages events
# Uses SubViewport for pixel-perfect rendering (426x240 native, scaled 3x)

class_name GameScene
extends Node2D

@onready var level_container = %LevelContainer
@onready var game_viewport: SubViewport = $SubViewportContainer/GameViewport

var PlayerScene = preload("res://player/Player.tscn")
var HudScene = preload("res://ui/hud/HUD.tscn")
var PauseSceneRes = preload("res://ui/pause/PauseScene.tscn")
var CinematicDialogScene = preload("res://ui/dialog/CinematicDialog.tscn")
var ItemAcquiredPopupScene = preload("res://ui/popup/ItemAcquiredPopup.tscn")
var GameOverSceneRes = preload("res://ui/gameover/GameOverScene.tscn")
var player_instance: CharacterBody2D = null
var spawn_point: Marker2D = null

# Camera (scene node inside SubViewport — smoothing + limits configured at runtime)
@onready var camera: Camera2D = %GameCamera
var _level_bounds := Rect2()

# Respawn state
var _respawning: bool = false
var _camera_follow_enabled: bool = true
var _respawn_immunity: float = 0.0

# Reusable soul dot texture (created once, shared by all particles)
var _soul_dot_texture: ImageTexture = null

# Pause state
var _is_paused: bool = false
var _pause_overlay: CanvasLayer = null
var _level_music_key: String = ""

# Game over state
var _game_over_overlay: CanvasLayer = null

# Cinematic dialog state
var _in_cinematic: bool = false

# Portal state
var _in_portal: bool = false
var _in_door_transition: bool = false
var _cinematic_dialog: CanvasLayer = null
var _original_camera_zoom := Vector2.ONE

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and not _respawning and not _in_cinematic and not _in_portal:
		_toggle_pause()

func _ready() -> void:
	# Load the selected level into the container
	var level_res = load(GameData.selected_level_scene)
	if level_res:
		var level_instance = level_res.instantiate()
		level_container.add_child(level_instance)
	else:
		push_error("Failed to load level scene: %s" % GameData.selected_level_scene)
		return

	# Find spawn point in level
	spawn_point = level_container.find_child("SpawnPoint", true, false)
	if not spawn_point:
		push_error("No SpawnPoint found in level!")
		return

	# Spawn player inside the SubViewport (alongside the level)
	player_instance = PlayerScene.instantiate()
	game_viewport.add_child(player_instance)
	player_instance.global_position = spawn_point.global_position

	# Spawn HUD inside SubViewport (renders at native 426x240, camera-independent)
	var hud_instance = HudScene.instantiate()
	game_viewport.add_child(hud_instance)

	# Set camera limits from level geometry, then snap to player
	_level_bounds = _get_level_bounds()
	if _level_bounds.size != Vector2.ZERO:
		camera.limit_left = int(_level_bounds.position.x)
		camera.limit_top = int(_level_bounds.position.y)
		camera.limit_right = int(_level_bounds.end.x)
		camera.limit_bottom = int(_level_bounds.end.y)
	camera.global_position = player_instance.global_position
	camera.reset_smoothing()
	camera.make_current()

	# Listen to events
	EventBus.level_complete.connect(_on_level_complete)
	EventBus.player_died.connect(_on_player_died)
	EventBus.dialog_requested.connect(_on_dialog_requested)
	EventBus.item_picked_up.connect(_on_item_acquired)
	EventBus.portal_entered.connect(_on_portal_entered)
	EventBus.door_entered.connect(_on_door_entered)
	EventBus.camera_shake_requested.connect(_on_camera_shake)
	EventBus.camera_pan_requested.connect(_on_camera_pan)

	# Force NEAREST filtering on the SubViewportContainer upscale
	$SubViewportContainer.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST

	# Start level-specific music (fall back to generic game music)
	_level_music_key = GameData.selected_level_id if AudioManager.has_music(GameData.selected_level_id) else "game"
	EventBus.music_play.emit(_level_music_key)
	SceneTransition.fade_from_black(0.5)

	# Initial spawn: start dissolved, materialize after brief delay
	_initial_spawn()

func _physics_process(delta: float) -> void:
	if not player_instance or not camera:
		return

	# Kill plane: die if player falls below level bounds
	_respawn_immunity = maxf(0.0, _respawn_immunity - delta)
	if not _respawning and not _in_portal and _respawn_immunity <= 0.0 and _level_bounds.size != Vector2.ZERO:
		var pstate = player_instance.state_machine.current_state
		if pstate and pstate.name not in ["Dead", "Spawn"]:
			if player_instance.global_position.y > _level_bounds.end.y:
				player_instance.die()

	if not _camera_follow_enabled:
		return
	# Camera2D handles smoothing, limits, and pixel snap (SubViewport snap_2d_transforms_to_pixel)
	camera.global_position = player_instance.global_position

# --- Pause ---

func _toggle_pause() -> void:
	if _is_paused:
		_unpause()
	else:
		_pause()

func _pause() -> void:
	_is_paused = true
	get_tree().paused = true
	EventBus.game_paused.emit()

	# Crossfade to pause music
	if AudioManager.has_music("pause"):
		EventBus.music_play.emit("pause")

	# Instantiate pause overlay on GameScene root (renders at full 1280x720, not SubViewport 426x240)
	_pause_overlay = PauseSceneRes.instantiate()
	_pause_overlay.resumed.connect(_unpause)
	_pause_overlay.quit_to_menu.connect(_quit_to_menu)
	add_child(_pause_overlay)

func _unpause() -> void:
	_is_paused = false
	get_tree().paused = false
	EventBus.game_resumed.emit()

	# Restore level music
	EventBus.music_play.emit(_level_music_key)

	if _pause_overlay:
		_pause_overlay.queue_free()
		_pause_overlay = null

func _quit_to_menu() -> void:
	get_tree().paused = false
	if _pause_overlay:
		_pause_overlay.queue_free()
		_pause_overlay = null
	SceneTransition.transition_to("res://ui/menus/LevelSelectScene.tscn")

# --- Initial spawn materialize ---

func _initial_spawn() -> void:
	# Start player in Spawn state, fully dissolved (shader is permanent, just set parameter)
	player_instance.state_machine.transition_to("Spawn")
	player_instance.call("prepare_dissolved")

	# Delay briefly so the scene fade reveals the level, then materialize player
	var tween := create_tween()
	tween.tween_interval(0.15)
	var materialize_cb = func():
		player_instance.materialize(Constants.SPAWN_MATERIALIZE_DURATION, func():
			player_instance.call("prime_collision")
			player_instance.state_machine.transition_to("Idle")
			EventBus.player_spawned.emit()
			# Start cinematic dialog after first spawn
			var spawn_dialog_id = GameData.selected_level_id + "/spawn"
			if _should_play_dialog(spawn_dialog_id):
				_mark_dialog_played(spawn_dialog_id)
				_start_cinematic_dialog(spawn_dialog_id)
		)
	tween.tween_callback(materialize_cb)

# --- Cinematic dialog ---

func _should_play_dialog(dialog_id: String) -> bool:
	if not DialogDefs.has_dialog(dialog_id):
		return false
	if DialogDefs.is_one_shot(dialog_id):
		var progress := ProgressData.new()
		if progress.is_dialog_seen(dialog_id):
			return false
	return true

func _mark_dialog_played(dialog_id: String) -> void:
	if DialogDefs.is_one_shot(dialog_id):
		var progress := ProgressData.new()
		progress.mark_dialog_seen(dialog_id)

func _on_dialog_requested(dialog_id: String) -> void:
	if _in_cinematic or _respawning:
		return
	# DialogTrigger already handles persistence, just play it
	_start_cinematic_dialog(dialog_id)

func _start_cinematic_dialog(dialog_id: String) -> void:
	_in_cinematic = true
	# Player keeps moving during slowmo ramp; get_tree().paused freezes them naturally

	# Save camera state
	_original_camera_zoom = camera.zoom

	# Phase 1: Slowmo ramp + camera zoom in (concurrent)
	# speed_scale compensates for the shrinking delta as time_scale drops
	var slowmo_tween = create_tween()
	slowmo_tween.set_speed_scale(2.0)
	slowmo_tween.set_ease(Tween.EASE_IN)
	slowmo_tween.set_trans(Tween.TRANS_QUAD)
	slowmo_tween.tween_method(_set_time_scale, 1.0, Constants.DIALOG_SLOWMO_SCALE, Constants.DIALOG_SLOWMO_RAMP_DURATION)

	var zoom_tween = create_tween()
	zoom_tween.set_speed_scale(2.0)
	zoom_tween.set_ease(Tween.EASE_IN_OUT)
	zoom_tween.set_trans(Tween.TRANS_SINE)
	zoom_tween.tween_property(camera, "zoom", Constants.DIALOG_CAMERA_ZOOM, Constants.DIALOG_SLOWMO_RAMP_DURATION)

	# Duck music during cinematic
	AudioManager.duck_music(Constants.MUSIC_DUCK_CINEMATIC_DB, Constants.DIALOG_SLOWMO_RAMP_DURATION)

	await slowmo_tween.finished

	# Phase 2: Freeze the game — only PROCESS_MODE_ALWAYS nodes keep running
	get_tree().paused = true

	# Phase 3: Start dialog overlay (has PROCESS_MODE_ALWAYS)
	_cinematic_dialog = CinematicDialogScene.instantiate()
	_cinematic_dialog.load_dialog(dialog_id)
	_cinematic_dialog.dialog_finished.connect(_on_cinematic_finished)
	add_child(_cinematic_dialog)
	_cinematic_dialog.start()

func _on_cinematic_finished() -> void:
	# Unfreeze and restore time scale
	get_tree().paused = false
	Engine.time_scale = 1.0

	# Smooth camera zoom back to original + restore music
	var zoom_tween = create_tween()
	zoom_tween.set_ease(Tween.EASE_IN_OUT)
	zoom_tween.set_trans(Tween.TRANS_SINE)
	zoom_tween.tween_property(camera, "zoom", _original_camera_zoom, Constants.DIALOG_CAMERA_RESTORE_DURATION)
	AudioManager.unduck_music(Constants.DIALOG_CAMERA_RESTORE_DURATION)
	await zoom_tween.finished

	# Player resumes naturally — velocity preserved through pause

	_in_cinematic = false
	if _cinematic_dialog:
		_cinematic_dialog.queue_free()
		_cinematic_dialog = null

func _set_time_scale(value: float) -> void:
	Engine.time_scale = value

# --- Death and respawn ---

func _on_player_died() -> void:
	_respawn_sequence()

func _respawn_sequence() -> void:
	if _respawning:
		return
	_respawning = true

	var death_pos: Vector2 = player_instance.global_position
	var target_pos: Vector2 = spawn_point.global_position

	# Duck music for entire death → respawn sequence
	AudioManager.duck_music(Constants.MUSIC_DUCK_RESPAWN_DB, Constants.DISSOLVE_DURATION)

	# Phase 1: Dissolve player at death position
	var dissolve_tween = player_instance.dissolve(Constants.DISSOLVE_DURATION)
	await dissolve_tween.finished

	# Phase 2: Show Game Over overlay, pause game, wait for player choice
	_game_over_overlay = GameOverSceneRes.instantiate()
	_game_over_overlay.retry.connect(_on_game_over_retry.bind(death_pos, target_pos))
	_game_over_overlay.quit_to_menu.connect(_on_game_over_quit)
	add_child(_game_over_overlay)
	get_tree().paused = true

func _on_game_over_retry(death_pos: Vector2, target_pos: Vector2) -> void:
	get_tree().paused = false
	if _game_over_overlay:
		_game_over_overlay.queue_free()
		_game_over_overlay = null
	_continue_respawn(death_pos, target_pos)

func _on_game_over_quit() -> void:
	get_tree().paused = false
	AudioManager.unduck_music(0.3)
	if _game_over_overlay:
		_game_over_overlay.queue_free()
		_game_over_overlay = null
	_respawning = false
	SceneTransition.transition_to("res://ui/menus/LevelSelectScene.tscn")

func _continue_respawn(death_pos: Vector2, target_pos: Vector2) -> void:
	# Gradually restore music over the entire respawn sequence
	var respawn_duration := 0.15 + Constants.PARTICLE_FLIGHT_DURATION + 0.1 + Constants.MATERIALIZE_DURATION
	AudioManager.unduck_music(respawn_duration)

	# Phase 3: Brief pause before particle flight
	_camera_follow_enabled = false
	await get_tree().create_timer(0.15).timeout

	# Phase 4: Soul particles + camera pan (both run for PARTICLE_FLIGHT_DURATION)
	_spawn_soul_particles(death_pos, target_pos, Constants.PARTICLE_FLIGHT_DURATION)

	var cam_start := camera.global_position
	camera.position_smoothing_enabled = false
	var cam_pan := func(t: float) -> void:
		camera.global_position = cam_start.lerp(target_pos, t)
	var cam_tween := create_tween()
	cam_tween.set_ease(Tween.EASE_IN_OUT)
	cam_tween.set_trans(Tween.TRANS_SINE)
	cam_tween.tween_method(cam_pan, 0.0, 1.0, Constants.PARTICLE_FLIGHT_DURATION)
	await cam_tween.finished

	# Phase 5: Reposition player (still invisible via permanent dissolve shader)
	player_instance.reset_for_respawn(target_pos)
	player_instance.call("prepare_dissolved")
	camera.position_smoothing_enabled = true
	camera.reset_smoothing()
	_camera_follow_enabled = true

	# Phase 6: Brief pause, then materialize
	await get_tree().create_timer(0.1).timeout
	var mat_tween = player_instance.materialize(Constants.MATERIALIZE_DURATION)
	await mat_tween.finished

	# Respawn complete — prime collision before Idle so is_on_floor() isn't stale
	player_instance.call("prime_collision")
	player_instance.state_machine.transition_to("Idle")
	_respawning = false
	_respawn_immunity = 0.5
	EventBus.player_respawned.emit()

# --- Soul particle flight ---

func _spawn_soul_particles(from: Vector2, to: Vector2, duration: float, on_complete: Callable = Callable()) -> void:
	var particle_count := Constants.SOUL_PARTICLE_COUNT
	var completed_count := 0

	# Direction and perpendicular for bezier control points
	var dir := to - from
	var perp := Vector2(-dir.y, dir.x).normalized()
	var dist := dir.length()

	for i in range(particle_count):
		var dot := _create_soul_dot()
		game_viewport.add_child(dot)
		dot.global_position = from

		# Stagger launch: each particle starts 0-40% into the duration
		var launch_delay := (float(i) / particle_count) * duration * 0.4
		var flight_time := duration - launch_delay

		# Unique bezier control point: random perpendicular offset
		var rng_offset := (randf() - 0.5) * dist * 0.6
		var rng_height := randf_range(0.3, 0.7)
		var control_point := from + dir * rng_height + perp * rng_offset

		var move_func := func(t: float) -> void:
			dot.global_position = _bezier_point(from, control_point, to, t)
			dot.modulate.a = sin(t * PI) * 1.2 + 0.3
			var s := 1.0 + sin(t * PI * 3.0) * 0.3
			dot.scale = Vector2(s, s)

		var done_func := func() -> void:
			dot.queue_free()
			completed_count += 1
			if completed_count >= particle_count and on_complete.is_valid():
				on_complete.call()

		var tween := create_tween()
		tween.tween_interval(launch_delay)
		tween.tween_method(move_func, 0.0, 1.0, flight_time)
		tween.tween_callback(done_func)

func _create_soul_dot() -> Sprite2D:
	var dot := Sprite2D.new()
	# Create shared texture once
	if _soul_dot_texture == null:
		var img := Image.create(3, 3, false, Image.FORMAT_RGBA8)
		img.fill(Color.WHITE)
		_soul_dot_texture = ImageTexture.create_from_image(img)
	dot.texture = _soul_dot_texture
	dot.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	# Luminous cyan-white (matches dissolve shader edge_color)
	dot.modulate = Color(0.6, 0.85, 1.0, 1.0)
	return dot

func _bezier_point(p0: Vector2, p1: Vector2, p2: Vector2, t: float) -> Vector2:
	var q0 := p0.lerp(p1, t)
	var q1 := p1.lerp(p2, t)
	return q0.lerp(q1, t)

# --- Level bounds ---

func _get_level_bounds() -> Rect2:
	var rect := Rect2()
	var found := false

	for node in _collect_children(level_container):
		if node is TileMapLayer and node.tile_set:
			var used: Rect2i = node.get_used_rect()
			if used.size == Vector2i.ZERO:
				continue
			var ts := Vector2(node.tile_set.tile_size)
			var world_rect := Rect2(
				node.global_position + Vector2(used.position) * ts,
				Vector2(used.size) * ts
			)
			if not found:
				rect = world_rect
				found = true
			else:
				rect = rect.merge(world_rect)

	# Fallback: Marker2D-based bounds for levels without TileMapLayer (e.g. Town)
	if not found:
		var bounds_min = level_container.find_child("BoundsMin", true, false)
		var bounds_max = level_container.find_child("BoundsMax", true, false)
		if bounds_min and bounds_max:
			rect = Rect2(
				bounds_min.global_position,
				bounds_max.global_position - bounds_min.global_position
			)
			found = true

	return rect

func _collect_children(node: Node) -> Array:
	var result := []
	for child in node.get_children():
		result.append(child)
		result.append_array(_collect_children(child))
	return result

func _on_level_complete() -> void:
	var progress := ProgressData.new()
	progress.complete_level(GameData.selected_level_id)
	SceneTransition.transition_to("res://ui/menus/LevelSelectScene.tscn")

# --- Item acquisition popup ---

var _item_popup: CanvasLayer = null

func _on_item_acquired(item_data: Dictionary) -> void:
	# Dismiss existing popup if one is showing
	if _item_popup:
		_item_popup.queue_free()
		_item_popup = null

	_item_popup = ItemAcquiredPopupScene.instantiate()
	_item_popup.setup(
		item_data.get("name", "???"),
		item_data.get("icon", null)
	)
	_item_popup.popup_finished.connect(func():
		_item_popup = null
	)
	add_child(_item_popup)

func _on_camera_pan(target: Vector2, pan_duration: float, hold_duration: float, return_duration: float) -> void:
	_camera_follow_enabled = false
	camera.position_smoothing_enabled = false

	# Pan to target
	var to_tween := create_tween()
	to_tween.set_ease(Tween.EASE_IN_OUT)
	to_tween.set_trans(Tween.TRANS_SINE)
	to_tween.tween_property(camera, "global_position", target, pan_duration)
	await to_tween.finished

	# Hold on target
	await get_tree().create_timer(hold_duration).timeout

	# Pan back to player
	var back_tween := create_tween()
	back_tween.set_ease(Tween.EASE_IN_OUT)
	back_tween.set_trans(Tween.TRANS_SINE)
	back_tween.tween_property(camera, "global_position", player_instance.global_position, return_duration)
	await back_tween.finished

	camera.position_smoothing_enabled = true
	_camera_follow_enabled = true

func _on_camera_shake(duration: float, intensity: float) -> void:
	var start := Time.get_ticks_msec()
	while true:
		var elapsed := (Time.get_ticks_msec() - start) / 1000.0
		if elapsed >= duration:
			break
		var t := 1.0 - (elapsed / duration)
		camera.offset = Vector2(
			randf_range(-intensity, intensity) * t,
			randf_range(-intensity, intensity) * t
		)
		await get_tree().process_frame
	camera.offset = Vector2.ZERO

func _on_portal_entered(_destination_level_id: String) -> void:
	_in_portal = true

# --- Door scene swap ---

func _on_door_entered(destination_scene: String, is_exit_door: bool) -> void:
	if _in_door_transition or _respawning or _in_cinematic or _in_portal:
		return
	_in_door_transition = true

	# Save position when entering a building
	if not is_exit_door:
		GameData.town_player_position = player_instance.global_position

	# Fade to black
	await SceneTransition.fade_to_black(0.25)

	# Remove current level
	for child in level_container.get_children():
		child.queue_free()
	await get_tree().process_frame

	# Load destination
	var new_level_res = load(destination_scene)
	if not new_level_res:
		push_error("Door: failed to load '%s'" % destination_scene)
		SceneTransition.fade_from_black(0.25)
		_in_door_transition = false
		return
	var level_instance = new_level_res.instantiate()
	level_container.add_child(level_instance)

	# Reposition player
	if is_exit_door and GameData.town_player_position != Vector2.ZERO:
		player_instance.global_position = GameData.town_player_position
	else:
		var new_spawn = level_container.find_child("SpawnPoint", true, false)
		if new_spawn:
			player_instance.global_position = new_spawn.global_position
	player_instance.velocity = Vector2.ZERO

	# Update spawn point reference (for respawn)
	spawn_point = level_container.find_child("SpawnPoint", true, false)

	# Recalculate camera bounds
	_level_bounds = _get_level_bounds()
	if _level_bounds.size != Vector2.ZERO:
		camera.limit_left = int(_level_bounds.position.x)
		camera.limit_top = int(_level_bounds.position.y)
		camera.limit_right = int(_level_bounds.end.x)
		camera.limit_bottom = int(_level_bounds.end.y)
	camera.global_position = player_instance.global_position
	camera.reset_smoothing()

	# Fade from black
	SceneTransition.fade_from_black(0.25)
	_in_door_transition = false
