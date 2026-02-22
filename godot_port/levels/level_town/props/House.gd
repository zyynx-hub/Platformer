@tool
extends Node2D

@export var house_width: float = 48.0:
	set(v):
		house_width = v
		_update_glow_rect()
		queue_redraw()

@export var house_height: float = 40.0:
	set(v):
		house_height = v
		_update_glow_rect()
		queue_redraw()

@export var wall_color: Color = Color(0.749, 0.435, 0.290):
	set(v):
		wall_color = v
		queue_redraw()

@export var roof_color: Color = Color(0.400, 0.196, 0.110):
	set(v):
		roof_color = v
		queue_redraw()

## 0 = triangle, 1 = flat, 2 = gambrel
@export_range(0, 2) var roof_style: int = 0:
	set(v):
		roof_style = v
		queue_redraw()

@export var has_window: bool = true:
	set(v):
		has_window = v
		_update_glow_rect()
		queue_redraw()

@export var has_chimney: bool = false:
	set(v):
		has_chimney = v
		queue_redraw()

@export var door_color: Color = Color(0.220, 0.110, 0.063):
	set(v):
		door_color = v
		queue_redraw()

## Window glow brightness driven by TownController via set_brightness()
var _brightness: float = 0.0

func _ready() -> void:
	_update_glow_rect()

func _draw() -> void:
	var hw := house_width * 0.5
	var hh := house_height

	# Body — anchor at bottom-center (y=0 is ground)
	draw_rect(Rect2(-hw, -hh, house_width, hh), wall_color)

	# Slightly darker trim along the base
	draw_rect(Rect2(-hw, -3, house_width, 3), wall_color * 0.75)

	# Roof
	var roof_h := hh * 0.4
	match roof_style:
		0:  # Triangle
			var pts := PackedVector2Array([
				Vector2(-hw - 4, -hh),
				Vector2(0, -hh - roof_h),
				Vector2(hw + 4, -hh),
			])
			draw_colored_polygon(pts, roof_color)
		1:  # Flat
			draw_rect(Rect2(-hw - 2, -hh - 4, house_width + 4, 4), roof_color)
			# Parapet edge
			draw_rect(Rect2(-hw - 2, -hh - 6, house_width + 4, 2), roof_color * 0.8)
		2:  # Gambrel
			var mid_y := -hh - roof_h * 0.5
			var top_y := -hh - roof_h
			var pts := PackedVector2Array([
				Vector2(-hw - 4, -hh),
				Vector2(-hw * 0.6, mid_y),
				Vector2(0, top_y),
				Vector2(hw * 0.6, mid_y),
				Vector2(hw + 4, -hh),
			])
			draw_colored_polygon(pts, roof_color)

	# Door frame — centered at bottom
	var dw := 10.0
	var dh := 16.0
	draw_rect(Rect2(-dw * 0.5, -dh, dw, dh), door_color)

	# Window — upper portion of wall, offset right of center
	if has_window:
		var win_w := 8.0
		var win_h := 8.0
		var win_x := hw * 0.35
		var win_y := -hh * 0.7
		# Frame
		draw_rect(Rect2(win_x - win_w * 0.5 - 1, win_y - win_h * 0.5 - 1, win_w + 2, win_h + 2), wall_color * 0.7)
		# Glass — lighter
		var glass_color := Color(0.404, 0.502, 0.624) if _brightness < 0.1 else Color(1.0, 0.792, 0.380)
		draw_rect(Rect2(win_x - win_w * 0.5, win_y - win_h * 0.5, win_w, win_h), glass_color)
		# Cross mullion
		draw_rect(Rect2(win_x - 0.5, win_y - win_h * 0.5, 1, win_h), wall_color * 0.65)
		draw_rect(Rect2(win_x - win_w * 0.5, win_y - 0.5, win_w, 1), wall_color * 0.65)

	# Chimney — right side of roof
	if has_chimney:
		var ch_x := hw * 0.45
		var ch_w := 6.0
		var ch_h := roof_h * 0.7
		var ch_top := -hh - ch_h
		draw_rect(Rect2(ch_x - ch_w * 0.5, ch_top, ch_w, ch_h), roof_color * 0.7)
		# Cap
		draw_rect(Rect2(ch_x - ch_w * 0.5 - 1, ch_top - 2, ch_w + 2, 2), roof_color * 0.6)

func set_brightness(b: float) -> void:
	_brightness = b
	# Push to glow window shader if present
	var glow := get_node_or_null("GlowWindow")
	if glow:
		glow.modulate.a = b * 0.6
	queue_redraw()

func _update_glow_rect() -> void:
	var glow := get_node_or_null("GlowWindow")
	if not glow:
		return
	if not has_window:
		glow.visible = false
		return
	glow.visible = true
	var hw := house_width * 0.5
	var win_w := 8.0
	var win_h := 8.0
	var win_x := hw * 0.35
	var win_y := -house_height * 0.7
	# Position glow centered on window, larger for bloom effect
	var pad := 10.0
	glow.offset_left = win_x - win_w * 0.5 - pad
	glow.offset_top = win_y - win_h * 0.5 - pad
	glow.offset_right = win_x + win_w * 0.5 + pad
	glow.offset_bottom = win_y + win_h * 0.5 + pad
