@tool
extends Node2D

## Brightness driven by TownController via set_brightness()
var _brightness: float = 0.0

func _draw() -> void:
	# Pole
	draw_rect(Rect2(-1, -30, 2, 30), Color(0.380, 0.365, 0.345))
	# Arm extending right
	draw_rect(Rect2(0, -30, 8, 2), Color(0.380, 0.365, 0.345))
	# Lamp housing
	draw_rect(Rect2(6, -30, 4, 3), Color(0.380, 0.365, 0.345))
	# Bulb (bright when on)
	var bulb_color := Color(0.380, 0.365, 0.345) if _brightness < 0.1 else Color(1.0, 0.792, 0.380)
	draw_rect(Rect2(7, -27, 2, 2), bulb_color)

func set_brightness(b: float) -> void:
	_brightness = b
	# Push to glow cone shader
	var glow := get_node_or_null("GlowCone")
	if glow and glow.material:
		(glow.material as ShaderMaterial).set_shader_parameter("brightness", b)
	queue_redraw()
