@tool
# TownController.gd
# Attached to TownLevel root. Pushes day/night uniforms to shaders.

extends Node2D

@onready var _sky: ColorRect = %Sky
@onready var _far_mountains: Node2D = %FarMountains
@onready var _near_mountains: Node2D = %NearMountains
@onready var _cloud_layer: Node2D = %CloudLayer
@onready var _night_overlay: ColorRect = %NightOverlay
@onready var _vignette: ColorRect = %VignetteOverlay

# Manual parallax scroll factors (replaces Parallax2D which doesn't work inside SubViewport)
const _SCROLL_FAR := 0.1
const _SCROLL_NEAR := 0.25
const _SCROLL_CLOUDS := 0.05

func _ready() -> void:
	_push_time(DayNightCycle.time_of_day if not Engine.is_editor_hint() else 0.35)
	if Engine.is_editor_hint():
		return
	EventBus.time_of_day_changed.connect(_push_time)

func _process(_delta: float) -> void:
	# Runs in both editor and runtime — tracks the active camera (editor or game)
	var vp := get_viewport()
	if not vp:
		return
	var ct := vp.canvas_transform
	var screen_center := Vector2(vp.size) * 0.5
	var cam_world := ct.affine_inverse() * screen_center
	var cx := cam_world.x

	# Sky and vignette: camera-locked, sized to fill visible viewport so UV maps 0-1 across screen
	var inv_scale := Vector2(1.0, 1.0) / ct.get_scale()
	var visible_size := Vector2(vp.size) * inv_scale
	if _sky:
		_sky.offset_left = cam_world.x - visible_size.x * 0.5
		_sky.offset_top = cam_world.y - visible_size.y * 0.5
		_sky.offset_right = cam_world.x + visible_size.x * 0.5
		_sky.offset_bottom = cam_world.y + visible_size.y * 0.5
	if _vignette:
		_vignette.offset_left = cam_world.x - visible_size.x * 0.5
		_vignette.offset_top = cam_world.y - visible_size.y * 0.5
		_vignette.offset_right = cam_world.x + visible_size.x * 0.5
		_vignette.offset_bottom = cam_world.y + visible_size.y * 0.5

	# Background layers: parallax on X only (town is flat, normal Y scroll is fine)
	if _far_mountains:
		_far_mountains.position.x = cx * (1.0 - _SCROLL_FAR)
	if _near_mountains:
		_near_mountains.position.x = cx * (1.0 - _SCROLL_NEAR)
	if _cloud_layer:
		_cloud_layer.position.x = cx * (1.0 - _SCROLL_CLOUDS)

func _push_time(t: float) -> void:
	# Sky + parallax layers
	_set_shader_time(_sky, t)
	if _far_mountains:
		_set_shader_time(_far_mountains.get_node("Visual"), t)
	if _near_mountains:
		_set_shader_time(_near_mountains.get_node("Visual"), t)
	if _cloud_layer:
		_set_shader_time(_cloud_layer.get_node("Visual"), t)

	# Night overlay darkness
	var darkness := _calc_darkness(t)
	if _night_overlay and _night_overlay.material:
		(_night_overlay.material as ShaderMaterial).set_shader_parameter("darkness", darkness)

	# Streetlight brightness (inverse of ambient light)
	var brightness := _calc_light_brightness(t)
	for child in get_children():
		if child.has_method("set_brightness"):
			child.set_brightness(brightness)

func _set_shader_time(node: CanvasItem, t: float) -> void:
	if node and node.material:
		(node.material as ShaderMaterial).set_shader_parameter("time_of_day", t)

## Returns 0.0 during day, up to 0.65 at midnight
func _calc_darkness(t: float) -> float:
	if t < Constants.DAWN_START:
		return 0.65
	elif t < Constants.DAWN_END:
		var f := (t - Constants.DAWN_START) / (Constants.DAWN_END - Constants.DAWN_START)
		return lerpf(0.65, 0.0, f)
	elif t < Constants.DUSK_START:
		return 0.0
	elif t < Constants.DUSK_END:
		var f := (t - Constants.DUSK_START) / (Constants.DUSK_END - Constants.DUSK_START)
		return lerpf(0.0, 0.65, f)
	else:
		return 0.65

## Returns 0.0 during day, 1.0 at full night
func _calc_light_brightness(t: float) -> float:
	if t < Constants.DAWN_START:
		return 1.0
	elif t < Constants.DAWN_END:
		var f := (t - Constants.DAWN_START) / (Constants.DAWN_END - Constants.DAWN_START)
		return lerpf(1.0, 0.0, f)
	elif t < Constants.DUSK_START:
		return 0.0
	elif t < Constants.DUSK_END:
		var f := (t - Constants.DUSK_START) / (Constants.DUSK_END - Constants.DUSK_START)
		return lerpf(0.0, 1.0, f)
	else:
		return 1.0
