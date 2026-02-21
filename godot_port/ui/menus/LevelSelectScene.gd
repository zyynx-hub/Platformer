@tool
# LevelSelectScene.gd
# Constellation map level selector — night-sky themed

extends Control

const SCENE_MENU := "res://ui/menus/MenuScene.tscn"
const SCENE_GAME := "res://game/GameScene.tscn"

# Star visual sizes (pixels at 1280x720)
const STAR_RADIUS_LOCKED := 6.0
const STAR_RADIUS_UNLOCKED := 10.0
const STAR_RADIUS_COMPLETED := 8.0
const STAR_RADIUS_SELECTED := 14.0

# Colors
const COLOR_LOCKED := Color(0.25, 0.3, 0.45, 0.3)
const COLOR_UNLOCKED := Color(0.6, 0.7, 1.0, 0.9)
const COLOR_COMPLETED := Color(0.4, 0.9, 0.5, 0.85)
const COLOR_SELECTED_GLOW := Color(0.7, 0.85, 1.0, 1.0)
const COLOR_LINE_LOCKED := Color(0.2, 0.25, 0.4, 0.15)
const COLOR_LINE_UNLOCKED := Color(0.4, 0.55, 0.85, 0.4)
const COLOR_LINE_COMPLETED := Color(0.35, 0.8, 0.5, 0.5)

# Town icon
const COLOR_TOWN := Color(1.0, 0.8, 0.4, 0.9)
const COLOR_TOWN_GLOW := Color(1.0, 0.85, 0.5, 1.0)
const TOWN_ICON_SIZE := 10.0

# Animation
const PULSE_SPEED := 2.0
const GLOW_RADIUS := 24.0

# Node references
@onready var title_label: Label = %TitleLabel if has_node("%TitleLabel") else null
@onready var back_button: Button = %BackButton if has_node("%BackButton") else null
@onready var star_canvas: Control = %StarCanvas if has_node("%StarCanvas") else null
@onready var info_panel: PanelContainer = %InfoPanel if has_node("%InfoPanel") else null
@onready var level_name_label: Label = %LevelNameLabel if has_node("%LevelNameLabel") else null
@onready var level_status_label: Label = %LevelStatusLabel if has_node("%LevelStatusLabel") else null
@onready var play_prompt_label: Label = %PlayPromptLabel if has_node("%PlayPromptLabel") else null

# State
var _selected_index: int = 0
var _level_states: Dictionary = {}   # id -> "locked" | "unlocked" | "completed"
var _star_positions: Dictionary = {}  # id -> Vector2 (pixel coords)
var _pulse_time: float = 0.0
var _progress: ProgressData = null


func _ready() -> void:
	_apply_theme()

	if Engine.is_editor_hint():
		return

	# --- Runtime only below ---
	_progress = ProgressData.new()
	_compute_level_states()
	_compute_star_positions()

	SubMenuTheme.create_particles(self)
	DragonFlyby.attach_to_scene(self, title_label)

	if back_button:
		back_button.pressed.connect(_on_back)

	if star_canvas:
		star_canvas.draw.connect(_on_star_canvas_draw)

	_selected_index = _find_default_selection()
	_update_info_panel()

	EventBus.music_play.emit("menu")
	_play_entrance_animation()
	SceneTransition.fade_from_black(0.4)


func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return
	_pulse_time += delta
	if star_canvas:
		star_canvas.queue_redraw()


# --- Level State ---------------------------------------------------------------

func _compute_level_states() -> void:
	for def in LevelDefs.ALL:
		var id: String = def["id"]
		var req: String = def["unlock_requires"]
		if _progress.is_level_completed(id):
			_level_states[id] = "completed"
		elif req.is_empty() or _progress.is_level_completed(req):
			_level_states[id] = "unlocked"
		else:
			_level_states[id] = "locked"


func _compute_star_positions() -> void:
	var viewport_size := Vector2(1280.0, 720.0)
	var margin := Vector2(100.0, 80.0)
	var usable := viewport_size - margin * 2.0
	for def in LevelDefs.ALL:
		var uv: Vector2 = def["star_pos"]
		_star_positions[def["id"]] = margin + Vector2(uv.x * usable.x, uv.y * usable.y)


func _find_default_selection() -> int:
	# Select first unlocked-but-not-completed level, fallback to first
	for i in range(LevelDefs.ALL.size()):
		var id: String = LevelDefs.ALL[i]["id"]
		if _level_states.get(id) == "unlocked":
			return i
	return 0


# --- Drawing -------------------------------------------------------------------

func _on_star_canvas_draw() -> void:
	# 1. Draw constellation lines
	for def in LevelDefs.ALL:
		var from_pos: Vector2 = _star_positions[def["id"]]
		var from_state: String = _level_states.get(def["id"], "locked")
		for conn_id in def["connections"]:
			# Avoid drawing each line twice
			if LevelDefs.get_index(conn_id) < LevelDefs.get_index(def["id"]):
				continue
			var to_pos: Vector2 = _star_positions[conn_id]
			var to_state: String = _level_states.get(conn_id, "locked")
			var line_color := COLOR_LINE_LOCKED
			if from_state == "completed" and to_state != "locked":
				line_color = COLOR_LINE_COMPLETED
			elif from_state != "locked" and to_state != "locked":
				line_color = COLOR_LINE_UNLOCKED
			star_canvas.draw_line(from_pos, to_pos, line_color, 1.5, true)

	# 2. Draw each star (or special icon for non-level entries)
	for i in range(LevelDefs.ALL.size()):
		var def: Dictionary = LevelDefs.ALL[i]
		var id: String = def["id"]
		var pos: Vector2 = _star_positions[id]
		var state: String = _level_states.get(id, "locked")
		var is_selected := (i == _selected_index)

		# Town gets a house icon instead of a star circle
		if id == "level_town":
			_draw_town_icon(pos, state, is_selected)
			continue

		# Glow ring for selected star
		if is_selected:
			var pulse := (sin(_pulse_time * PULSE_SPEED) * 0.5 + 0.5)
			var glow_alpha := lerpf(0.15, 0.4, pulse)
			star_canvas.draw_circle(pos, GLOW_RADIUS, Color(COLOR_SELECTED_GLOW.r, COLOR_SELECTED_GLOW.g, COLOR_SELECTED_GLOW.b, glow_alpha))

		# Star circle
		var radius := STAR_RADIUS_LOCKED
		var color := COLOR_LOCKED
		match state:
			"unlocked":
				radius = STAR_RADIUS_SELECTED if is_selected else STAR_RADIUS_UNLOCKED
				color = COLOR_UNLOCKED
			"completed":
				radius = STAR_RADIUS_SELECTED if is_selected else STAR_RADIUS_COMPLETED
				color = COLOR_COMPLETED
			"locked":
				radius = STAR_RADIUS_LOCKED

		# Pulse effect for unlocked (not completed) stars
		if state == "unlocked":
			var pulse := sin(_pulse_time * PULSE_SPEED + float(i) * 1.3) * 0.5 + 0.5
			color.a = lerpf(0.7, 1.0, pulse)

		star_canvas.draw_circle(pos, radius, color)

		# White core for non-locked stars
		if state != "locked":
			star_canvas.draw_circle(pos, radius * 0.4, Color(1.0, 1.0, 1.0, color.a * 0.8))


func _draw_town_icon(pos: Vector2, state: String, is_selected: bool) -> void:
	var s := TOWN_ICON_SIZE * (1.3 if is_selected else 1.0)
	var color := COLOR_TOWN if state != "locked" else COLOR_LOCKED
	var pulse := sin(_pulse_time * PULSE_SPEED * 1.2) * 0.5 + 0.5

	# Visual center of house (midpoint between roof peak and body bottom)
	var icon_center := Vector2(pos.x, pos.y - s * 0.5)

	# Warm glow ring when selected
	if is_selected:
		var glow_alpha := lerpf(0.15, 0.45, pulse)
		star_canvas.draw_circle(icon_center, GLOW_RADIUS * 1.1, Color(COLOR_TOWN_GLOW.r, COLOR_TOWN_GLOW.g, COLOR_TOWN_GLOW.b, glow_alpha))

	# Pulse alpha for unlocked
	if state == "unlocked":
		color.a = lerpf(0.7, 1.0, pulse)

	# House body (square)
	var body := Rect2(pos.x - s, pos.y - s * 0.6, s * 2.0, s * 1.4)
	star_canvas.draw_rect(body, color)

	# Roof (triangle)
	var roof := PackedVector2Array([
		Vector2(pos.x - s * 1.3, pos.y - s * 0.6),
		Vector2(pos.x, pos.y - s * 1.8),
		Vector2(pos.x + s * 1.3, pos.y - s * 0.6),
	])
	star_canvas.draw_colored_polygon(roof, color)

	# Door (darker rectangle)
	if state != "locked":
		var door_color := Color(color.r * 0.5, color.g * 0.5, color.b * 0.5, color.a)
		var door := Rect2(pos.x - s * 0.25, pos.y + s * 0.1, s * 0.5, s * 0.7)
		star_canvas.draw_rect(door, door_color)

	# Bright window dot
	if state != "locked":
		var win_color := Color(1.0, 1.0, 0.9, color.a * (0.7 + pulse * 0.3))
		star_canvas.draw_circle(Vector2(pos.x + s * 0.45, pos.y - s * 0.1), s * 0.2, win_color)


# --- Input / Navigation -------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event.is_action_pressed("pause"):
		_on_back()
		get_viewport().set_input_as_handled()
		return

	if event.is_action_pressed("interact") or event.is_action_pressed("ui_accept"):
		_on_level_confirm()
		get_viewport().set_input_as_handled()
		return

	var dir := Vector2.ZERO
	if event.is_action_pressed("move_left"):
		dir = Vector2.LEFT
	elif event.is_action_pressed("move_right"):
		dir = Vector2.RIGHT
	elif event.is_action_pressed("ui_up"):
		dir = Vector2.UP
	elif event.is_action_pressed("ui_down"):
		dir = Vector2.DOWN

	if dir != Vector2.ZERO:
		_navigate(dir)
		get_viewport().set_input_as_handled()


func _navigate(dir: Vector2) -> void:
	var current_def: Dictionary = LevelDefs.ALL[_selected_index]
	var current_pos: Vector2 = _star_positions[current_def["id"]]

	var best_index := -1
	var best_score := INF
	for conn_id in current_def["connections"]:
		var idx := LevelDefs.get_index(conn_id)
		if idx < 0:
			continue
		var cand_pos: Vector2 = _star_positions[conn_id]
		var delta: Vector2 = cand_pos - current_pos
		var dot := delta.normalized().dot(dir)
		if dot > 0.3:
			var score := delta.length() * (1.0 - dot)
			if score < best_score:
				best_score = score
				best_index = idx

	if best_index >= 0 and best_index != _selected_index:
		_selected_index = best_index
		EventBus.sfx_play.emit("ui_tick", 0.0)
		_update_info_panel()


func _on_level_confirm() -> void:
	var def: Dictionary = LevelDefs.ALL[_selected_index]
	var state: String = _level_states.get(def["id"], "locked")

	if state == "locked":
		return
	if def["scene"] == "":
		if level_status_label:
			level_status_label.text = "Coming Soon..."
			level_status_label.add_theme_color_override("font_color", Color(0.5, 0.55, 0.7, 0.5))
		return

	EventBus.sfx_play.emit("ui_confirm", 0.0)
	GameData.selected_level_id = def["id"]
	GameData.selected_level_scene = def["scene"]
	SceneTransition.transition_to(SCENE_GAME)


func _on_back() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	SceneTransition.transition_to(SCENE_MENU)


# --- Info Panel ----------------------------------------------------------------

func _update_info_panel() -> void:
	var def: Dictionary = LevelDefs.ALL[_selected_index]
	var state: String = _level_states.get(def["id"], "locked")

	if level_name_label:
		level_name_label.text = "???" if state == "locked" else def["title"]

	if level_status_label:
		match state:
			"locked":
				level_status_label.text = "Locked"
				level_status_label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.6, 0.6))
			"unlocked":
				level_status_label.text = "Ready"
				level_status_label.add_theme_color_override("font_color", COLOR_UNLOCKED)
			"completed":
				level_status_label.text = "Completed"
				level_status_label.add_theme_color_override("font_color", COLOR_COMPLETED)

	if play_prompt_label:
		if state == "locked":
			play_prompt_label.visible = false
		elif def["scene"] == "":
			play_prompt_label.text = "Coming Soon"
			play_prompt_label.visible = true
			play_prompt_label.add_theme_color_override("font_color", Color(0.5, 0.55, 0.7, 0.5))
		else:
			play_prompt_label.text = "Press ENTER or SPACE to play"
			play_prompt_label.visible = true
			play_prompt_label.add_theme_color_override("font_color", Color(0.7, 0.8, 1.0, 0.7))


# --- Theme / Styling -----------------------------------------------------------

func _apply_theme() -> void:
	# All styling handled by NightSkyTheme.tres (assigned on root Control in .tscn)
	# Only connect button focus effects (animation tweens — runtime only)
	if Engine.is_editor_hint():
		return
	if back_button:
		SubMenuTheme.connect_button_focus(self, back_button)


# --- Entrance Animation -------------------------------------------------------

func _play_entrance_animation() -> void:
	SubMenuTheme.play_entrance(self, title_label, info_panel, [back_button])

	# Stars cascade in
	if star_canvas:
		star_canvas.modulate.a = 0.0
		var tw := create_tween()
		tw.tween_property(star_canvas, "modulate:a", 1.0, 0.6).set_delay(0.3)
