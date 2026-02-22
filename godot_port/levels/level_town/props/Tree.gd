@tool
extends Node2D

@export var canopy_color: Color = Color(0.196, 0.502, 0.196)
@export var trunk_color: Color = Color(0.357, 0.192, 0.102)
@export var tree_scale: float = 1.0

func _draw() -> void:
	var s := tree_scale
	# Trunk
	draw_rect(Rect2(-2 * s, -18 * s, 4 * s, 18 * s), trunk_color)
	# Canopy — overlapping circles for organic shape
	var dark := canopy_color * 0.8
	dark.a = 1.0
	draw_circle(Vector2(-4 * s, -22 * s), 7 * s, dark)
	draw_circle(Vector2(4 * s, -20 * s), 6 * s, dark)
	draw_circle(Vector2(0, -26 * s), 8 * s, canopy_color)
