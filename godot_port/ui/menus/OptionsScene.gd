@tool
# OptionsScene.gd
# Options menu with audio, display, and controls tabs — night-sky themed

extends Control

const SCENE_MENU := "res://ui/menus/MenuScene.tscn"

# --- Editor nodes (unique names) ---
@onready var master_slider: HSlider = %MasterSlider if has_node("%MasterSlider") else null
@onready var music_slider: HSlider = %MusicSlider if has_node("%MusicSlider") else null
@onready var sfx_slider: HSlider = %SFXSlider if has_node("%SFXSlider") else null
@onready var fullscreen_check: CheckButton = %FullscreenCheck if has_node("%FullscreenCheck") else null
@onready var vsync_check: CheckButton = %VsyncCheck if has_node("%VsyncCheck") else null
@onready var back_button: Button = %BackButton if has_node("%BackButton") else null
@onready var reset_button: Button = %ResetButton if has_node("%ResetButton") else null

# --- Path-based nodes (not unique-named in .tscn) ---
@onready var title_label: Label = $TitleLabel if has_node("TitleLabel") else null
@onready var tab_container: TabContainer = $TabContainer if has_node("TabContainer") else null


func _ready() -> void:
	# Styling runs in both editor and runtime (shaders are in .tscn)
	_apply_theme()

	# Editor preview stops here — no gameplay logic in the editor
	if Engine.is_editor_hint():
		return

	# --- Runtime only below ---
	SubMenuTheme.create_particles(self)
	DragonFlyby.attach_to_scene(self, title_label)

	_populate_from_settings()
	_connect_controls()

	EventBus.music_play.emit("menu")

	SubMenuTheme.play_entrance(self, title_label, tab_container, [back_button, reset_button])
	SceneTransition.fade_from_black(0.4)


func _apply_theme() -> void:
	# All styling handled by NightSkyTheme.tres (assigned on root Control in .tscn)
	# Only connect button focus effects (animation tweens — runtime only)
	if Engine.is_editor_hint():
		return
	for btn in [back_button, reset_button]:
		if btn:
			SubMenuTheme.connect_button_focus(self, btn)


# ─── Settings ────────────────────────────────────────────────────────────────

func _populate_from_settings() -> void:
	if master_slider:
		master_slider.value = SettingsManager.get_value("audio", "master", 80)
	if music_slider:
		music_slider.value = SettingsManager.get_value("audio", "music", 60)
	if sfx_slider:
		sfx_slider.value = SettingsManager.get_value("audio", "sfx", 85)
	if fullscreen_check:
		fullscreen_check.button_pressed = SettingsManager.get_value("display", "fullscreen", false)
	if vsync_check:
		vsync_check.button_pressed = SettingsManager.get_value("display", "vsync", true)


func _connect_controls() -> void:
	if master_slider:
		master_slider.value_changed.connect(func(v): _set_audio("master", int(v)))
	if music_slider:
		music_slider.value_changed.connect(func(v): _set_audio("music", int(v)))
	if sfx_slider:
		sfx_slider.value_changed.connect(func(v): _set_audio("sfx", int(v)))
	if fullscreen_check:
		fullscreen_check.toggled.connect(_on_fullscreen_toggle)
	if vsync_check:
		vsync_check.toggled.connect(_on_vsync_toggle)
	if back_button:
		back_button.pressed.connect(_on_back)
	if reset_button:
		reset_button.pressed.connect(_on_reset)


func _set_audio(key: String, value: int) -> void:
	SettingsManager.set_value("audio", key, value)
	SettingsManager.save_settings()


func _on_fullscreen_toggle(pressed: bool) -> void:
	SettingsManager.set_value("display", "fullscreen", pressed)
	SettingsManager.save_settings()
	SettingsManager.apply_display_settings()


func _on_vsync_toggle(pressed: bool) -> void:
	SettingsManager.set_value("display", "vsync", pressed)
	SettingsManager.save_settings()
	SettingsManager.apply_display_settings()


func _on_back() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	SceneTransition.transition_to(SCENE_MENU)


func _on_reset() -> void:
	SettingsManager.reset_to_defaults()
	_populate_from_settings()


func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event.is_action_pressed("pause"):
		_on_back()
		get_viewport().set_input_as_handled()
