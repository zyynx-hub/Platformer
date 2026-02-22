@tool
extends Node2D

@export var blade_count: int = 4
@export var grass_color: Color = Color(0.196, 0.502, 0.212)
@export var blade_height: float = 7.0
@export var sway_phase: float = 0.0

var _time: float = 0.0

func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return
	_time += delta
	queue_redraw()

func _draw() -> void:
	var sway := sin(_time * 2.5 + sway_phase) * 2.5
	var half := float(blade_count - 1) * 1.5
	for i in blade_count:
		var x_off := float(i) * 3.0 - half
		# Alternate heights: even blades slightly taller
		var h := blade_height * (1.0 if i % 2 == 0 else 0.82)
		var tip_x := x_off + sway
		var blade := PackedVector2Array([
			Vector2(x_off - 1.5, 0.0),
			Vector2(x_off + 1.5, 0.0),
			Vector2(tip_x, -h)
		])
		var dark := Color(grass_color.r * 0.58, grass_color.g * 0.58, grass_color.b * 0.58, 1.0)
		draw_colored_polygon(blade, dark)
		# Lighter midrib line for definition
		draw_line(Vector2(x_off, -1.0), Vector2(tip_x, -h + 1.0), grass_color, 1.0)
