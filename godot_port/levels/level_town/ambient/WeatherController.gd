@tool
# WeatherController.gd
# Manages weather overlays (rain, snow) with smooth transitions.
# Drives: sky overlays (camera-tracked), ground accumulation (world-space),
# and cloud darkening (via sibling CloudLayer shader).

extends Node2D

enum Weather { CLEAR, RAIN, SNOW }

@export var current_weather: Weather = Weather.CLEAR:
	set(value):
		if current_weather == value:
			return
		current_weather = value
		_transition_to(value)

@onready var _rain_overlay: ColorRect = %RainOverlay
@onready var _snow_overlay: ColorRect = %SnowOverlay
@onready var _puddle_overlay: ColorRect = %PuddleOverlay
@onready var _snow_ground: ColorRect = %SnowGroundOverlay

const _TRANSITION_DURATION := 2.0  # seconds to fade precipitation in/out
const _ACCUMULATION_RATE := 0.08   # per second (full puddles/snow in ~12s)
const _DRAIN_RATE := 0.03          # per second when weather clears

var _rain_intensity: float = 0.0
var _snow_intensity: float = 0.0
var _rain_accumulation: float = 0.0
var _snow_accumulation: float = 0.0
var _tween: Tween = null

# Cached references — avoids repeated tree traversal every frame
var _cloud_visual: CanvasItem = null
# Last-pushed values — skip set_shader_parameter when change is negligible
var _last_rain_accum: float = -1.0
var _last_snow_accum: float = -1.0
var _last_cloud_darken: float = -1.0

var _visible_size: Vector2 = Vector2.ZERO

func _ready() -> void:
	var vp := get_viewport()
	if vp:
		var inv_scale := Vector2(1.0, 1.0) / vp.canvas_transform.get_scale()
		_visible_size = Vector2(vp.size) * inv_scale
	_sync_overlays()
	if Engine.is_editor_hint():
		return
	add_to_group("weather_controller")
	_cloud_visual = _find_cloud_visual()

func _process(delta: float) -> void:
	if not Engine.is_editor_hint():
		_update_accumulation(delta)

	# Camera-track sky overlays (same pattern as Sky in TownController)
	var vp := get_viewport()
	if not vp:
		return
	var cam_world := vp.canvas_transform.affine_inverse() * (Vector2(vp.size) * 0.5)

	var left := cam_world.x - _visible_size.x * 0.5
	var top := cam_world.y - _visible_size.y * 0.5
	var right := cam_world.x + _visible_size.x * 0.5
	var bottom := cam_world.y + _visible_size.y * 0.5

	if _rain_overlay:
		_rain_overlay.offset_left = left
		_rain_overlay.offset_top = top
		_rain_overlay.offset_right = right
		_rain_overlay.offset_bottom = bottom
	if _snow_overlay:
		_snow_overlay.offset_left = left
		_snow_overlay.offset_top = top
		_snow_overlay.offset_right = right
		_snow_overlay.offset_bottom = bottom
	# Ground overlays are world-space (fixed position) — no camera tracking needed

func set_weather(w: Weather) -> void:
	current_weather = w

func get_weather() -> Weather:
	return current_weather

func get_weather_name() -> String:
	match current_weather:
		Weather.CLEAR:
			return "clear"
		Weather.RAIN:
			return "rain"
		Weather.SNOW:
			return "snow"
	return "unknown"

func cycle_weather() -> void:
	var next := (current_weather + 1) % 3 as Weather
	set_weather(next)

func _update_accumulation(delta: float) -> void:
	# Rain accumulation (puddles)
	if _rain_intensity > 0.1:
		_rain_accumulation = minf(_rain_accumulation + _ACCUMULATION_RATE * delta, 1.0)
	else:
		_rain_accumulation = maxf(_rain_accumulation - _DRAIN_RATE * delta, 0.0)

	# Snow accumulation (ground snow)
	if _snow_intensity > 0.1:
		_snow_accumulation = minf(_snow_accumulation + _ACCUMULATION_RATE * delta, 1.0)
	else:
		_snow_accumulation = maxf(_snow_accumulation - _DRAIN_RATE * delta, 0.0)

	# Push accumulation to ground shaders — only when value changed meaningfully
	if _puddle_overlay:
		_puddle_overlay.visible = _rain_accumulation > 0.001
		if _puddle_overlay.material and absf(_rain_accumulation - _last_rain_accum) > 0.005:
			(_puddle_overlay.material as ShaderMaterial).set_shader_parameter("accumulation", _rain_accumulation)
			_last_rain_accum = _rain_accumulation
	if _snow_ground:
		_snow_ground.visible = _snow_accumulation > 0.001
		if _snow_ground.material and absf(_snow_accumulation - _last_snow_accum) > 0.005:
			(_snow_ground.material as ShaderMaterial).set_shader_parameter("accumulation", _snow_accumulation)
			_last_snow_accum = _snow_accumulation

	# Push cloud darkening — use cached reference, skip if unchanged
	var cloud_darken := maxf(_rain_intensity, _snow_intensity * 0.6)
	if _cloud_visual and _cloud_visual.material and absf(cloud_darken - _last_cloud_darken) > 0.005:
		(_cloud_visual.material as ShaderMaterial).set_shader_parameter("weather_darken", cloud_darken)
		_last_cloud_darken = cloud_darken

func _find_cloud_visual() -> CanvasItem:
	var parent := get_parent()
	if not parent:
		return null
	var cloud_layer = parent.find_child("CloudLayer", false, false)
	if cloud_layer:
		var visual = cloud_layer.find_child("Visual", false, false)
		if visual:
			return visual as CanvasItem
	return null

func _transition_to(target: Weather) -> void:
	if Engine.is_editor_hint():
		_rain_intensity = 1.0 if target == Weather.RAIN else 0.0
		_snow_intensity = 1.0 if target == Weather.SNOW else 0.0
		_sync_overlays()
		return

	if _tween and _tween.is_valid():
		_tween.kill()
	_tween = create_tween()
	_tween.set_parallel(true)

	var rain_target := 1.0 if target == Weather.RAIN else 0.0
	var snow_target := 1.0 if target == Weather.SNOW else 0.0

	_tween.tween_method(_set_rain_intensity, _rain_intensity, rain_target, _TRANSITION_DURATION)
	_tween.tween_method(_set_snow_intensity, _snow_intensity, snow_target, _TRANSITION_DURATION)

	if not Engine.is_editor_hint():
		EventBus.weather_changed.emit(target)

func _set_rain_intensity(v: float) -> void:
	_rain_intensity = v
	_sync_overlays()

func _set_snow_intensity(v: float) -> void:
	_snow_intensity = v
	_sync_overlays()

func _sync_overlays() -> void:
	if _rain_overlay:
		_rain_overlay.visible = _rain_intensity > 0.001
		if _rain_overlay.material:
			(_rain_overlay.material as ShaderMaterial).set_shader_parameter("intensity", _rain_intensity * 0.6)
	if _snow_overlay:
		_snow_overlay.visible = _snow_intensity > 0.001
		if _snow_overlay.material:
			(_snow_overlay.material as ShaderMaterial).set_shader_parameter("intensity", _snow_intensity * 0.5)
