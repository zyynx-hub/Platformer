@tool
extends Node2D

func _draw() -> void:
	# Seat — brown plank
	draw_rect(Rect2(-10, -6, 20, 3), Color(0.600, 0.322, 0.196))
	# Backrest
	draw_rect(Rect2(-10, -10, 20, 2), Color(0.380, 0.188, 0.110))
	# Left leg
	draw_rect(Rect2(-9, -4, 2, 4), Color(0.380, 0.188, 0.110))
	# Right leg
	draw_rect(Rect2(7, -4, 2, 4), Color(0.380, 0.188, 0.110))
