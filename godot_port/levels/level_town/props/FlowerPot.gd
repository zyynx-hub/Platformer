@tool
extends Node2D

@export var flower_color: Color = Color(0.9608, 0.3333, 0.3647)
@export var pot_color: Color = Color(0.5412, 0.2824, 0.2118)

func _draw() -> void:
	# Pot — trapezoid (wider at top)
	var pot := PackedVector2Array([
		Vector2(-4, 0), Vector2(4, 0),
		Vector2(3, -7), Vector2(-3, -7)
	])
	draw_colored_polygon(pot, pot_color)
	# Dirt
	draw_rect(Rect2(-3, -8, 6, 2), Color(0.2235, 0.1216, 0.1294))
	# Stem
	draw_rect(Rect2(0, -14, 1, 6), Color(0.1176, 0.4353, 0.3137))
	# Flower head
	draw_circle(Vector2(0, -15), 2.5, flower_color)
	# Flower center
	draw_circle(Vector2(0, -15), 1.0, Color(1.0, 0.9216, 0.3412))
