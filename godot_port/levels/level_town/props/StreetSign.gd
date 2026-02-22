@tool
extends Node2D

@export var sign_color: Color = Color(0.380, 0.365, 0.345)

func _draw() -> void:
	# Pole
	draw_rect(Rect2(-1, -22, 2, 22), Color(0.380, 0.365, 0.345))
	# Sign board
	draw_rect(Rect2(-8, -24, 16, 6), sign_color)
	# Border
	draw_rect(Rect2(-8, -24, 16, 1), Color(0.200, 0.188, 0.176))
	draw_rect(Rect2(-8, -19, 16, 1), Color(0.200, 0.188, 0.176))
