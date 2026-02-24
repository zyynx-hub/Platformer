@tool
extends Node2D

@export var church_width: float = 60.0:
	set(v):
		church_width = v
		_update_glow_rect()
		queue_redraw()

@export var church_height: float = 52.0:
	set(v):
		church_height = v
		_update_glow_rect()
		queue_redraw()

@export var wall_color: Color = Color(0.58, 0.55, 0.50):
	set(v):
		wall_color = v
		queue_redraw()

@export var roof_color: Color = Color(0.35, 0.28, 0.22):
	set(v):
		roof_color = v
		queue_redraw()

@export var door_color: Color = Color(0.25, 0.15, 0.08):
	set(v):
		door_color = v
		queue_redraw()

@export var steeple_height: float = 36.0:
	set(v):
		steeple_height = v
		queue_redraw()

@export var cross_color: Color = Color(0.85, 0.78, 0.55):
	set(v):
		cross_color = v
		queue_redraw()

@export var stained_glass_color: Color = Color(0.45, 0.30, 0.65):
	set(v):
		stained_glass_color = v
		queue_redraw()

## Window glow brightness driven by TownController via set_brightness()
var _brightness: float = 0.0

func _ready() -> void:
	_update_glow_rect()

func _draw() -> void:
	var hw := church_width * 0.5
	var hh := church_height

	# --- Main body (anchor at bottom-center, y=0 is ground) ---
	draw_rect(Rect2(-hw, -hh, church_width, hh), wall_color)

	# Base trim
	draw_rect(Rect2(-hw, -3, church_width, 3), wall_color * 0.7)

	# --- Main roof (triangle) ---
	var roof_h := hh * 0.35
	var overhang := 5.0
	var pts := PackedVector2Array([
		Vector2(-hw - overhang, -hh),
		Vector2(0, -hh - roof_h),
		Vector2(hw + overhang, -hh),
	])
	draw_colored_polygon(pts, roof_color)

	# --- Steeple / bell tower ---
	var tower_w := 16.0
	var tower_h := steeple_height
	var tower_base_y := -hh - roof_h + 2  # starts just below roof peak
	var tower_top_y := tower_base_y - tower_h

	# Tower body
	draw_rect(Rect2(-tower_w * 0.5, tower_top_y, tower_w, tower_h), wall_color * 0.9)
	# Tower trim lines
	draw_rect(Rect2(-tower_w * 0.5, tower_top_y, tower_w, 2), roof_color * 0.8)

	# Bell opening (small dark arch in tower)
	var bell_w := 6.0
	var bell_h := 8.0
	var bell_y := tower_top_y + 6
	draw_rect(Rect2(-bell_w * 0.5, bell_y, bell_w, bell_h), Color(0.08, 0.06, 0.04))
	# Arch top for bell opening
	_draw_arch(-bell_w * 0.5, bell_y, bell_w, Color(0.08, 0.06, 0.04))

	# Steeple point on top of tower
	var spire_h := 14.0
	var spire_pts := PackedVector2Array([
		Vector2(-tower_w * 0.5, tower_top_y),
		Vector2(0, tower_top_y - spire_h),
		Vector2(tower_w * 0.5, tower_top_y),
	])
	draw_colored_polygon(spire_pts, roof_color)

	# --- Cross on top ---
	var cross_y := tower_top_y - spire_h
	var cx_w := 2.0
	var cx_arm := 5.0
	var cx_tall := 10.0
	# Vertical bar
	draw_rect(Rect2(-cx_w * 0.5, cross_y - cx_tall, cx_w, cx_tall), cross_color)
	# Horizontal bar
	draw_rect(Rect2(-cx_arm, cross_y - cx_tall * 0.7, cx_arm * 2, cx_w), cross_color)

	# --- Arched front door (larger, centered) ---
	var dw := 14.0
	var dh := 22.0
	# Door frame (slightly larger)
	draw_rect(Rect2(-dw * 0.5 - 1, -dh - 1, dw + 2, dh + 1), wall_color * 0.65)
	# Door body
	draw_rect(Rect2(-dw * 0.5, -dh, dw, dh), door_color)
	# Arch top
	_draw_arch(-dw * 0.5, -dh, dw, door_color)
	# Door line (center split)
	draw_rect(Rect2(-0.5, -dh, 1, dh), door_color * 0.6)
	# Door handle dots
	draw_rect(Rect2(-3, -dh * 0.45, 1, 1), cross_color)
	draw_rect(Rect2(2, -dh * 0.45, 1, 1), cross_color)

	# --- Stained glass window (rose window above door) ---
	var sg_y := -hh * 0.72
	var sg_r := 7.0
	# Frame circle (drawn as octagon for pixel look)
	_draw_octagon(0, sg_y, sg_r + 1.5, wall_color * 0.6)
	# Glass
	var glass_col := stained_glass_color if _brightness < 0.1 else Color(0.85, 0.6, 0.95)
	_draw_octagon(0, sg_y, sg_r, glass_col)
	# Cross mullion
	draw_rect(Rect2(-0.5, sg_y - sg_r, 1, sg_r * 2), wall_color * 0.55)
	draw_rect(Rect2(-sg_r, sg_y - 0.5, sg_r * 2, 1), wall_color * 0.55)

	# --- Side windows (small arched) ---
	var side_win_y := -hh * 0.55
	for side in [-1, 1]:
		var sx: float = float(side) * hw * 0.55
		var sw := 6.0
		var sh := 10.0
		# Frame
		draw_rect(Rect2(sx - sw * 0.5 - 1, side_win_y - sh - 1, sw + 2, sh + 2), wall_color * 0.65)
		# Glass
		var side_glass := Color(0.35, 0.45, 0.60) if _brightness < 0.1 else Color(0.9, 0.75, 0.4)
		draw_rect(Rect2(sx - sw * 0.5, side_win_y - sh, sw, sh), side_glass)
		# Arch
		_draw_arch(sx - sw * 0.5, side_win_y - sh, sw, side_glass)
		# Mullion
		draw_rect(Rect2(sx - 0.5, side_win_y - sh, 1, sh), wall_color * 0.55)

	# --- Stone detail lines (horizontal mortar) ---
	var mortar := wall_color * 0.85
	for i in range(3):
		var ly := -hh * 0.15 - i * (hh * 0.25)
		draw_rect(Rect2(-hw, ly, church_width, 1), mortar)


## Draw a small semicircular arch at the top of a rectangle
func _draw_arch(x: float, top_y: float, w: float, col: Color) -> void:
	var cx := x + w * 0.5
	var r := w * 0.5
	# Approximate arch with 3 rects (pixel-art friendly)
	draw_rect(Rect2(cx - r, top_y - 1, r * 2, 1), col)
	draw_rect(Rect2(cx - r + 1, top_y - 2, r * 2 - 2, 1), col)
	draw_rect(Rect2(cx - r + 2, top_y - 3, r * 2 - 4, 1), col)


## Draw an octagon (pixel-art circle) centered at (cx, cy) with radius r
func _draw_octagon(cx: float, cy: float, r: float, col: Color) -> void:
	var d := r * 0.414  # tan(22.5°) ≈ 0.414
	var pts_arr := PackedVector2Array([
		Vector2(cx - d, cy - r),
		Vector2(cx + d, cy - r),
		Vector2(cx + r, cy - d),
		Vector2(cx + r, cy + d),
		Vector2(cx + d, cy + r),
		Vector2(cx - d, cy + r),
		Vector2(cx - r, cy + d),
		Vector2(cx - r, cy - d),
	])
	draw_colored_polygon(pts_arr, col)


func set_brightness(b: float) -> void:
	_brightness = b
	var glow := get_node_or_null("GlowWindow")
	if glow:
		glow.modulate.a = b * 0.6
	queue_redraw()


func _update_glow_rect() -> void:
	var glow := get_node_or_null("GlowWindow")
	if not glow:
		return
	# Position glow over the rose window
	var sg_y := -church_height * 0.72
	var sg_r := 7.0
	var pad := 12.0
	glow.offset_left = -sg_r - pad
	glow.offset_top = sg_y - sg_r - pad
	glow.offset_right = sg_r + pad
	glow.offset_bottom = sg_y + sg_r + pad
