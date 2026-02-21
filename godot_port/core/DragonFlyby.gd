# DragonFlyby.gd
# Autoload: manages the Karim dragon fly-by across all menu scenes.
# Time-based animation so the flight continues seamlessly across scene transitions.
# Call attach_to_scene() from any menu scene to display the dragon.

extends Node

# --- Flight parameters ---
var _is_flying := false
var _flight_start_msec: int = 0
var _flight_duration := 0.0
var _start_x := 0.0
var _end_x := 0.0
var _fly_y := 0.0
var _wave_height := 0.0
var _going_right := true
var _next_fly_msec: int = 0

# --- Active sprite (lives in the current scene, freed on scene change) ---
var _dragon: Sprite2D = null
var _dragon_tex: Texture2D = null


func _ready() -> void:
	_dragon_tex = load("res://assets/sprites/karim/Screenshot 2026-02-18 165701.png")
	_next_fly_msec = Time.get_ticks_msec() + 3000


## Create a Sprite2D in the given scene, inserted before `behind_node` for z-order.
## Call from any menu scene's _ready() after the editor-hint guard.
func attach_to_scene(scene: Control, behind_node: Node = null) -> void:
	if not _dragon_tex:
		return
	# Previous sprite was freed with the old scene; create a new one
	_dragon = Sprite2D.new()
	_dragon.texture = _dragon_tex
	_dragon.scale = Vector2(0.18, 0.18)
	_dragon.visible = _is_flying
	scene.add_child(_dragon)
	# Move before the title/text node so it draws behind UI
	if behind_node and behind_node.get_parent() == scene:
		scene.move_child(_dragon, behind_node.get_index())
	if _is_flying:
		_update_position()


func _process(_delta: float) -> void:
	if Engine.is_editor_hint():
		return
	# Detect stale sprite reference (scene was freed)
	if _dragon and not is_instance_valid(_dragon):
		_dragon = null

	var now := Time.get_ticks_msec()

	if _is_flying:
		var elapsed := (now - _flight_start_msec) / 1000.0
		if elapsed >= _flight_duration:
			_end_flight()
		else:
			_update_position()
	else:
		if now >= _next_fly_msec:
			_start_flight()


func _start_flight() -> void:
	_is_flying = true
	_flight_start_msec = Time.get_ticks_msec()
	_going_right = randf() > 0.5
	_fly_y = randf_range(80.0, 280.0)
	_flight_duration = randf_range(5.0, 8.0)
	_wave_height = randf_range(20.0, 40.0)

	if _going_right:
		_start_x = -80.0
		_end_x = 1360.0
	else:
		_start_x = 1360.0
		_end_x = -80.0

	if _dragon and is_instance_valid(_dragon):
		_dragon.visible = true
		_update_position()


func _end_flight() -> void:
	_is_flying = false
	if _dragon and is_instance_valid(_dragon):
		_dragon.visible = false
		_dragon.rotation_degrees = 0.0
	_next_fly_msec = Time.get_ticks_msec() + int(randf_range(8.0, 18.0) * 1000)


func _update_position() -> void:
	if not _dragon or not is_instance_valid(_dragon):
		return
	var elapsed := (Time.get_ticks_msec() - _flight_start_msec) / 1000.0
	var t := clampf(elapsed / _flight_duration, 0.0, 1.0)

	# Sine ease in-out for X (matches original TRANS_SINE + EASE_IN_OUT)
	var smooth_t := (1.0 - cos(t * PI)) / 2.0
	var x := lerpf(_start_x, _end_x, smooth_t)

	# Sine-wave Y bob
	var y := _fly_y + sin(t * TAU * 2.0) * _wave_height

	_dragon.position = Vector2(x, y)

	# Wobble rotation (period = 0.6s, amplitude = 8 degrees)
	_dragon.rotation_degrees = sin(elapsed * TAU / 0.6) * 8.0

	# Face direction
	_dragon.scale.x = 0.18 if _going_right else -0.18
