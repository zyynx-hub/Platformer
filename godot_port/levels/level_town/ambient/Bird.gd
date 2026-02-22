@tool
extends Node2D

## Wing flap cycle (0-1), driven by BirdFlock
var flap_phase: float = 0.0
var bird_size: float = 4.0
var bird_color: Color = Color(0.1, 0.1, 0.15)

func _draw() -> void:
	# V-shape bird silhouette — wing angle based on flap_phase
	var wing_y := sin(flap_phase * TAU) * bird_size * 0.6
	var half_w := bird_size * 0.5
	# Left wing
	draw_line(Vector2(0, 0), Vector2(-half_w, wing_y), bird_color, 1.0)
	# Right wing
	draw_line(Vector2(0, 0), Vector2(half_w, wing_y), bird_color, 1.0)
