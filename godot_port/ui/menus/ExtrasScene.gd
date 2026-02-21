@tool
# ExtrasScene.gd
# Extras menu with achievements, gallery, and stats tabs — night-sky themed

extends Control

const SCENE_MENU := "res://ui/menus/MenuScene.tscn"

# --- Editor nodes (unique names) ---
@onready var achievement_list: VBoxContainer = %AchievementList if has_node("%AchievementList") else null
@onready var gallery_container: GridContainer = %Gallery if has_node("%Gallery") else null
@onready var play_time_label: Label = %PlayTimeLabel if has_node("%PlayTimeLabel") else null
@onready var deaths_label: Label = %DeathsLabel if has_node("%DeathsLabel") else null
@onready var levels_label: Label = %LevelsLabel if has_node("%LevelsLabel") else null
@onready var collectibles_label: Label = %CollectiblesLabel if has_node("%CollectiblesLabel") else null
@onready var jumps_label: Label = %JumpsLabel if has_node("%JumpsLabel") else null
@onready var dashes_label: Label = %DashesLabel if has_node("%DashesLabel") else null
@onready var back_button: Button = %BackButton if has_node("%BackButton") else null
@onready var _gallery_placeholder: Label = %GalleryPlaceholder if has_node("%GalleryPlaceholder") else null

# --- Path-based nodes (not unique-named in .tscn) ---
@onready var title_label: Label = $TitleLabel if has_node("TitleLabel") else null
@onready var tab_container: TabContainer = $TabContainer if has_node("TabContainer") else null

var progress: ProgressData


func _ready() -> void:
	# Styling runs in both editor and runtime (shaders are in .tscn)
	_apply_theme()

	# Editor preview stops here — no gameplay logic in the editor
	if Engine.is_editor_hint():
		return

	# --- Runtime only below ---
	progress = ProgressData.new()
	SubMenuTheme.create_particles(self)
	DragonFlyby.attach_to_scene(self, title_label)

	_populate_achievements()
	_populate_stats()
	_populate_gallery()

	if back_button:
		back_button.pressed.connect(_on_back)

	EventBus.music_play.emit("menu")

	SubMenuTheme.play_entrance(self, title_label, tab_container, [back_button])
	SceneTransition.fade_from_black(0.4)


func _apply_theme() -> void:
	# All styling handled by NightSkyTheme.tres (assigned on root Control in .tscn)
	# Only connect button focus effects (animation tweens — runtime only)
	if Engine.is_editor_hint():
		return
	if back_button:
		SubMenuTheme.connect_button_focus(self, back_button)


# ─── Achievements ────────────────────────────────────────────────────────────

func _populate_achievements() -> void:
	if not achievement_list:
		return
	for child in achievement_list.get_children():
		child.queue_free()

	for def in AchievementDefs.ALL:
		var is_unlocked: bool = progress.is_achievement_unlocked(def["id"])

		if def.get("hidden", false) and not is_unlocked:
			var hidden_label := Label.new()
			hidden_label.text = "??? - Hidden Achievement"
			hidden_label.add_theme_color_override("font_color", Color(0.35, 0.4, 0.55, 0.5))
			achievement_list.add_child(hidden_label)
			continue

		var hbox := HBoxContainer.new()

		var status := Label.new()
		status.text = "[OK] " if is_unlocked else "[  ] "
		status.add_theme_color_override("font_color",
			Color(0.3, 1.0, 0.5) if is_unlocked else Color(0.4, 0.45, 0.6, 0.5))
		hbox.add_child(status)

		var info := Label.new()
		info.text = "%s - %s" % [def["title"], def["description"]]
		info.add_theme_color_override("font_color",
			Color(0.85, 0.9, 1.0) if is_unlocked else Color(0.4, 0.45, 0.6, 0.6))
		hbox.add_child(info)

		achievement_list.add_child(hbox)


# ─── Stats ───────────────────────────────────────────────────────────────────

func _populate_stats() -> void:
	if play_time_label:
		play_time_label.text = "Play Time: %s" % _format_time(progress.total_play_time)
	if deaths_label:
		deaths_label.text = "Deaths: %d" % progress.total_deaths
	if levels_label:
		levels_label.text = "Levels Completed: %d" % progress.levels_completed
	if collectibles_label:
		collectibles_label.text = "Collectibles Found: %d" % progress.collectibles_found
	if jumps_label:
		jumps_label.text = "Total Jumps: %d" % progress.total_jumps
	if dashes_label:
		dashes_label.text = "Total Dashes: %d" % progress.total_dashes


# ─── Gallery ─────────────────────────────────────────────────────────────────

func _populate_gallery() -> void:
	# Placeholder label is defined in ExtrasScene.tscn — toggle visibility
	if _gallery_placeholder:
		_gallery_placeholder.visible = true


func _format_time(seconds: float) -> String:
	var hours := int(seconds) / 3600
	var mins := (int(seconds) % 3600) / 60
	var secs := int(seconds) % 60
	if hours > 0:
		return "%dh %02dm %02ds" % [hours, mins, secs]
	return "%dm %02ds" % [mins, secs]


func _on_back() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	SceneTransition.transition_to(SCENE_MENU)


func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event.is_action_pressed("pause"):
		_on_back()
		get_viewport().set_input_as_handled()
