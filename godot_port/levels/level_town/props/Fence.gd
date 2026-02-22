@tool
extends Node2D

@export_range(2, 12) var segment_count: int = 4
@export var fence_color: Color = Color(0.420, 0.220, 0.130)

func _draw() -> void:
	var spacing := 8.0
	var total_w := spacing * (segment_count - 1)
	var start_x := -total_w / 2.0

	# Horizontal rails
	var dark := fence_color * 0.85
	dark.a = 1.0
	draw_rect(Rect2(start_x - 1, -10, total_w + 2, 2), dark)
	draw_rect(Rect2(start_x - 1, -5, total_w + 2, 2), dark)

	# Vertical posts
	for i in range(segment_count):
		var x := start_x + i * spacing
		draw_rect(Rect2(x - 1, -12, 2, 12), fence_color)
