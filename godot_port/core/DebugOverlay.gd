# DebugOverlay.gd
# Toggleable in-game debug info (F3)
# Shows player state, velocity, position, FPS, fuel

extends CanvasLayer

@onready var _bg: Panel = %Panel
@onready var _label: Label = %Label
var _active: bool = false

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

func _process(_delta: float) -> void:
	if not _active:
		return

	var player = get_tree().get_first_node_in_group("player")
	if player:
		var state_name := "N/A"
		if player.state_machine and player.state_machine.current_state:
			state_name = player.state_machine.current_state.name
		_label.text = "State: %s\nVel: (%.0f, %.0f)\nPos: (%.0f, %.0f)\nFPS: %d\nFuel: %.1f / %.1f" % [
			state_name,
			player.velocity_x, player.velocity_y,
			player.global_position.x, player.global_position.y,
			Engine.get_frames_per_second(),
			player._rocket_fuel, Constants.ROCKET_FUEL_MAX
		]
	else:
		_label.text = "FPS: %d\nNo player" % Engine.get_frames_per_second()

	_bg.size = _label.size + Vector2(12, 8)
