## OptionsScene — settings UI.
## Port of js/scenes/options-scene.js.
extends Node2D

const SCENE_MENU := "res://scenes/menu/MenuScene.tscn"

# Audio
@onready var master_slider:  HSlider = $UI/Tabs/Audio/MasterSlider
@onready var music_slider:   HSlider = $UI/Tabs/Audio/MusicSlider
@onready var sfx_slider:     HSlider = $UI/Tabs/Audio/SFXSlider

# Video
@onready var fullscreen_check: CheckButton = $UI/Tabs/Video/FullscreenCheck
@onready var vsync_check:      CheckButton = $UI/Tabs/Video/VsyncCheck
@onready var cam_smooth_slider: HSlider    = $UI/Tabs/Video/CamSmoothSlider

# Gameplay
@onready var difficulty_option: OptionButton = $UI/Tabs/Gameplay/DifficultyOption

# Nav
@onready var back_button: Button = $UI/BackButton
@onready var reset_button: Button = $UI/ResetButton


func _ready() -> void:
	_populate_from_settings()
	_connect_controls()


func _populate_from_settings() -> void:
	var audio: Dictionary = SettingsManager.get_value("audio", "", {})
	if master_slider:  master_slider.value  = SettingsManager.get_value("audio", "master", 80)
	if music_slider:   music_slider.value   = SettingsManager.get_value("audio", "music",  60)
	if sfx_slider:     sfx_slider.value     = SettingsManager.get_value("audio", "sfx",    85)

	if fullscreen_check:
		fullscreen_check.button_pressed = SettingsManager.get_value("video", "fullscreen", false)
	if vsync_check:
		vsync_check.button_pressed      = SettingsManager.get_value("video", "vsync", true)
	if cam_smooth_slider:
		cam_smooth_slider.value         = SettingsManager.get_value("video", "camera_smoothing", 35)

	if difficulty_option:
		difficulty_option.clear()
		difficulty_option.add_item("Easy",   0)
		difficulty_option.add_item("Normal", 1)
		difficulty_option.add_item("Hard",   2)
		var diff := SettingsManager.get_difficulty()
		match diff:
			"easy":   difficulty_option.selected = 0
			"hard":   difficulty_option.selected = 2
			_:        difficulty_option.selected = 1


func _connect_controls() -> void:
	if master_slider:      master_slider.value_changed.connect(func(v): _set_audio("master", int(v)))
	if music_slider:       music_slider.value_changed.connect(func(v):  _set_audio("music",  int(v)))
	if sfx_slider:         sfx_slider.value_changed.connect(func(v):    _set_audio("sfx",    int(v)))
	if fullscreen_check:   fullscreen_check.toggled.connect(_on_fullscreen_toggle)
	if vsync_check:        vsync_check.toggled.connect(_on_vsync_toggle)
	if cam_smooth_slider:  cam_smooth_slider.value_changed.connect(func(v): _set_video("camera_smoothing", int(v)))
	if difficulty_option:  difficulty_option.item_selected.connect(_on_difficulty_selected)
	if back_button:        back_button.pressed.connect(_on_back)
	if reset_button:       reset_button.pressed.connect(_on_reset)


func _set_audio(key: String, value: int) -> void:
	SettingsManager.set_value("audio", key, value)
	SettingsManager.save_settings()


func _set_video(key: String, value: Variant) -> void:
	SettingsManager.set_value("video", key, value)
	SettingsManager.save_settings()


func _on_fullscreen_toggle(pressed: bool) -> void:
	_set_video("fullscreen", pressed)
	DisplayServer.window_set_mode(
		DisplayServer.WINDOW_MODE_FULLSCREEN if pressed else DisplayServer.WINDOW_MODE_WINDOWED
	)


func _on_vsync_toggle(pressed: bool) -> void:
	_set_video("vsync", pressed)
	DisplayServer.window_set_vsync_mode(
		DisplayServer.VSYNC_ENABLED if pressed else DisplayServer.VSYNC_DISABLED
	)


func _on_difficulty_selected(idx: int) -> void:
	var vals := ["easy", "normal", "hard"]
	SettingsManager.set_value("gameplay", "difficulty", vals[idx])
	SettingsManager.save_settings()


func _on_back() -> void:
	get_tree().change_scene_to_file(SCENE_MENU)


func _on_reset() -> void:
	SettingsManager.reset()
	_populate_from_settings()
