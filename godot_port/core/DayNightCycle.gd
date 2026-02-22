# DayNightCycle.gd
# Autoload: real-time day/night cycle for the town and any level that opts in.
# time_of_day: 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset

extends Node

var time_of_day: float = 0.35  # start at mid-morning
var cycle_duration: float = Constants.DAY_NIGHT_CYCLE_DURATION
var _paused: bool = false
var _last_emitted: float = -1.0  # throttle: only emit when time changes >= 0.001

func _process(delta: float) -> void:
	if _paused:
		return
	time_of_day += delta / cycle_duration
	if time_of_day >= 1.0:
		time_of_day -= 1.0
	# Emit at most ~3-4 times per second (threshold = 0.001 of a 5-min cycle)
	if absf(time_of_day - _last_emitted) >= 0.001:
		_last_emitted = time_of_day
		EventBus.time_of_day_changed.emit(time_of_day)

func set_paused(paused: bool) -> void:
	_paused = paused

func toggle_paused() -> bool:
	_paused = not _paused
	return _paused

func set_time(t: float) -> void:
	time_of_day = clampf(t, 0.0, 0.9999)
	EventBus.time_of_day_changed.emit(time_of_day)

func is_night() -> bool:
	return time_of_day < Constants.DAWN_START or time_of_day > Constants.DUSK_END

func is_dawn() -> bool:
	return time_of_day >= Constants.DAWN_START and time_of_day <= Constants.DAWN_END

func is_dusk() -> bool:
	return time_of_day >= Constants.DUSK_START and time_of_day <= Constants.DUSK_END

## Returns 0.0 at midnight, 1.0 at noon
func get_ambient_brightness() -> float:
	if time_of_day < 0.25:
		return smoothstep(0.0, 0.25, time_of_day)
	elif time_of_day < 0.5:
		return 1.0
	elif time_of_day < 0.75:
		return 1.0
	else:
		return smoothstep(1.0, 0.75, time_of_day)

func smoothstep(edge0: float, edge1: float, x: float) -> float:
	var t := clampf((x - edge0) / (edge1 - edge0), 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)
