# DebugOverlay.gd
# Toggleable in-game debug info (F3)
# Shows player state, velocity, position, FPS, fuel

extends CanvasLayer

@onready var _bg: Panel = %Panel
@onready var _label: Label = %Label
var _active: bool = false
var _update_acc: float = 0.0

func _ready() -> void:
	visible = false

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("debug_toggle"):
		_active = not _active
		visible = _active
	if event.is_action_pressed("debug_reset"):
		var p := ProgressData.new()
		p.reset_all_progress()
		_label.text = "PROGRESS RESET"
		visible = true
		await get_tree().create_timer(1.5).timeout
		if not _active:
			visible = false
	if event.is_action_pressed("debug_weather"):
		var wc = get_tree().get_first_node_in_group("weather_controller")
		if wc and wc.has_method("cycle_weather"):
			wc.cycle_weather()
			_label.text = "Weather: %s" % wc.get_weather_name()
			visible = true
			await get_tree().create_timer(1.5).timeout
			if not _active:
				visible = false
	if event.is_action_pressed("debug_time_fast"):
		if DayNightCycle:
			var new_t := fmod(DayNightCycle.time_of_day + 0.12, 1.0)
			DayNightCycle.set_time(new_t)
			_label.text = "Time: %.2f (F7 fast-forward)" % DayNightCycle.time_of_day
			visible = true
			await get_tree().create_timer(1.0).timeout
			if not _active:
				visible = false
	if event.is_action_pressed("debug_time_pause"):
		if DayNightCycle:
			var paused := DayNightCycle.toggle_paused()
			_label.text = "Cycle: %s (F9)" % ("PAUSED" if paused else "RUNNING")
			visible = true
			await get_tree().create_timer(1.0).timeout
			if not _active:
				visible = false
	if event.is_action_pressed("debug_add_coins"):
		var p := ProgressData.new()
		p.coins += 100
		p.save_progress()
		_label.text = "Coins: %d (+100) [F10]" % p.coins
		visible = true
		await get_tree().create_timer(1.5).timeout
		if not _active:
			visible = false

func _process(delta: float) -> void:
	if not _active:
		return
	_update_acc += delta
	if _update_acc < 0.1:
		return
	_update_acc = 0.0

	var player = get_tree().get_first_node_in_group("player")
	var time_line := ""
	if DayNightCycle:
		var t := DayNightCycle.time_of_day
		var phase := "night"
		if DayNightCycle.is_dawn():
			phase = "dawn"
		elif DayNightCycle.is_dusk():
			phase = "dusk"
		elif not DayNightCycle.is_night():
			phase = "day"
		time_line = "\nTime: %.2f (%s)" % [t, phase]

	var weather_line := ""
	var wc = get_tree().get_first_node_in_group("weather_controller")
	if wc and wc.has_method("get_weather_name"):
		weather_line = "\nWeather: %s (F6)" % wc.get_weather_name()

	if player:
		var state_name := "N/A"
		if player.state_machine and player.state_machine.current_state:
			state_name = player.state_machine.current_state.name
		_label.text = "State: %s\nVel: (%.0f, %.0f)\nPos: (%.0f, %.0f)\nFPS: %d\nFuel: %.1f / %.1f%s%s" % [
			state_name,
			player.velocity_x, player.velocity_y,
			player.global_position.x, player.global_position.y,
			Engine.get_frames_per_second(),
			player._rocket_fuel, Constants.ROCKET_FUEL_MAX,
			time_line, weather_line
		]
	else:
		_label.text = "FPS: %d\nNo player%s%s" % [Engine.get_frames_per_second(), time_line, weather_line]

	_bg.size = _label.size + Vector2(12, 8)
