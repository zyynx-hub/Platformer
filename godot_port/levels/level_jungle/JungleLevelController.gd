@tool
# JungleLevelController.gd
# Attached to JungleLevel root. Manages atmosphere and quest-conditional NPC visibility.
# The jungle uses a persistent green night overlay for its humid, dim atmosphere.

extends Node2D

@onready var _sky: ColorRect = %Sky
@onready var _night_overlay: ColorRect = %NightOverlay
@onready var _vignette: ColorRect = %VignetteOverlay
@onready var _three_headed: Node2D = %ThreeHeadedKarim

# Jungle always has a minimum green atmospheric overlay
const JUNGLE_DARKNESS_MIN := 0.35
const JUNGLE_DARKNESS_MAX := 0.7
# Green-tinted overlay color (replaces the town's indigo)
const JUNGLE_NIGHT_TINT := Color(0.02, 0.10, 0.04, 1.0)

var _boss_spawning: bool = false
# Cached once in _ready() — viewport size and zoom are fixed at runtime
var _visible_size: Vector2 = Vector2.ZERO


func _ready() -> void:
	_apply_jungle_atmosphere()
	var vp := get_viewport()
	if vp:
		var inv_scale := Vector2(1.0, 1.0) / vp.canvas_transform.get_scale()
		_visible_size = Vector2(vp.size) * inv_scale
	if Engine.is_editor_hint():
		return
	EventBus.time_of_day_changed.connect(_on_time_of_day)
	EventBus.quest_state_changed.connect(_on_quest_state_changed)
	_update_npc_visibility(false)


func _process(_delta: float) -> void:
	# Camera-track the sky and vignette overlays (same as TownController)
	var vp := get_viewport()
	if not vp:
		return
	var cam_world := vp.canvas_transform.affine_inverse() * (Vector2(vp.size) * 0.5)
	if _sky:
		_sky.offset_left   = cam_world.x - _visible_size.x * 0.5
		_sky.offset_top    = cam_world.y - _visible_size.y * 0.5
		_sky.offset_right  = cam_world.x + _visible_size.x * 0.5
		_sky.offset_bottom = cam_world.y + _visible_size.y * 0.5
	if _vignette:
		_vignette.offset_left   = cam_world.x - _visible_size.x * 0.5
		_vignette.offset_top    = cam_world.y - _visible_size.y * 0.5
		_vignette.offset_right  = cam_world.x + _visible_size.x * 0.5
		_vignette.offset_bottom = cam_world.y + _visible_size.y * 0.5


func _apply_jungle_atmosphere() -> void:
	# Set fixed green night tint
	if _night_overlay and _night_overlay.material:
		var mat := _night_overlay.material as ShaderMaterial
		mat.set_shader_parameter("night_tint", JUNGLE_NIGHT_TINT)
		mat.set_shader_parameter("darkness", JUNGLE_DARKNESS_MIN)


func _on_time_of_day(t: float) -> void:
	# Push time to sky shader
	if _sky and _sky.material:
		(_sky.material as ShaderMaterial).set_shader_parameter("time_of_day", t)
	# Jungle always stays dark — darkness never goes below JUNGLE_DARKNESS_MIN
	var base_darkness := _calc_base_darkness(t)
	var jungle_darkness := maxf(base_darkness, JUNGLE_DARKNESS_MIN)
	if _night_overlay and _night_overlay.material:
		(_night_overlay.material as ShaderMaterial).set_shader_parameter("darkness", jungle_darkness)


func _calc_base_darkness(t: float) -> float:
	if t < Constants.DAWN_START:
		return JUNGLE_DARKNESS_MAX
	elif t < Constants.DAWN_END:
		var f := (t - Constants.DAWN_START) / (Constants.DAWN_END - Constants.DAWN_START)
		return lerpf(JUNGLE_DARKNESS_MAX, JUNGLE_DARKNESS_MIN, f)
	elif t < Constants.DUSK_START:
		return JUNGLE_DARKNESS_MIN
	elif t < Constants.DUSK_END:
		var f := (t - Constants.DUSK_START) / (Constants.DUSK_END - Constants.DUSK_START)
		return lerpf(JUNGLE_DARKNESS_MIN, JUNGLE_DARKNESS_MAX, f)
	else:
		return JUNGLE_DARKNESS_MAX


func _on_quest_state_changed(key: String, _val: bool) -> void:
	if key in ["hydra_body_1_gone", "hydra_body_2_gone", "hydra_body_3_gone", "three_headed_karim_paid"]:
		_update_npc_visibility(true)


func _update_npc_visibility(play_cutscene: bool) -> void:
	if not _three_headed:
		return
	var pd := ProgressData.new()
	if pd.get_quest("three_headed_karim_paid"):
		_three_headed.visible = false
		return
	var all_gone := (
		pd.get_quest("hydra_body_1_gone") and
		pd.get_quest("hydra_body_2_gone") and
		pd.get_quest("hydra_body_3_gone")
	)
	if all_gone:
		if play_cutscene and not _three_headed.visible and not _boss_spawning:
			_trigger_boss_spawn()
		else:
			_three_headed.visible = true
	else:
		_three_headed.visible = false


func _trigger_boss_spawn() -> void:
	_boss_spawning = true

	# Fade to black — hides the boss appearing
	await SceneTransition.fade_to_black(0.6)

	# While black: position boss at center of wander range and shrink to zero
	_three_headed.global_position = Vector2(900, 0)
	_three_headed.scale = Vector2(0.1, 0.1)
	_three_headed.visible = true

	# Deep bass rumble while screen is still black
	_play_boss_rumble()
	await get_tree().create_timer(0.5).timeout

	# Fade back in — player sees the boss for the first time
	SceneTransition.fade_from_black(0.7)
	await get_tree().create_timer(0.15).timeout

	# Pan camera to boss spawn position, hold, then return to player
	# pan=0.8s, hold=1.8s, return=0.8s — total 3.4s before camera is back
	EventBus.camera_pan_requested.emit(Vector2(900, 0), 0.8, 1.8, 0.8)

	# Wait for camera to arrive at boss (matches pan_duration above)
	await get_tree().create_timer(0.8).timeout

	# Camera is now on the boss — reveal with shake + scale pop
	EventBus.camera_shake_requested.emit(0.9, 5.0)
	var tween := create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_BACK)
	tween.tween_property(_three_headed, "scale", Vector2(1.3, 1.3), 0.55)

	_boss_spawning = false


func _play_boss_rumble() -> void:
	var player := AudioStreamPlayer.new()
	add_child(player)
	player.stream = load("res://assets/audio/sfx/dash_swoosh.wav")
	player.volume_db = 8.0
	player.pitch_scale = 0.13
	player.play()
	get_tree().create_timer(3.0).timeout.connect(func(): player.queue_free())
