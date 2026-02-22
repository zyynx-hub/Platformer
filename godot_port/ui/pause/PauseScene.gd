@tool
# PauseScene.gd
# In-game pause overlay — night-sky themed, freezes game tree
# Includes embedded options panel (audio, display, controls)

extends CanvasLayer

signal resumed
signal quit_to_menu

# --- Pause buttons ---
@onready var background: ColorRect = $Background if has_node("Background") else null
@onready var title_label: Label = $VBoxContainer/TitleLabel if has_node("VBoxContainer/TitleLabel") else null
@onready var resume_button: Button = $VBoxContainer/ResumeButton if has_node("VBoxContainer/ResumeButton") else null
@onready var quest_log_button: Button = $VBoxContainer/QuestLogButton if has_node("VBoxContainer/QuestLogButton") else null
@onready var options_button: Button = $VBoxContainer/OptionsButton if has_node("VBoxContainer/OptionsButton") else null
@onready var quit_button: Button = $VBoxContainer/QuitButton if has_node("VBoxContainer/QuitButton") else null
@onready var vbox: VBoxContainer = $VBoxContainer if has_node("VBoxContainer") else null

# --- Options panel ---
@onready var options_panel: VBoxContainer = $OptionsPanel if has_node("OptionsPanel") else null
@onready var master_slider: HSlider = %PauseMasterSlider if has_node("%PauseMasterSlider") else null
@onready var music_slider: HSlider = %PauseMusicSlider if has_node("%PauseMusicSlider") else null
@onready var sfx_slider: HSlider = %PauseSFXSlider if has_node("%PauseSFXSlider") else null
@onready var fullscreen_check: CheckButton = %PauseFullscreenCheck if has_node("%PauseFullscreenCheck") else null
@onready var vsync_check: CheckButton = %PauseVsyncCheck if has_node("%PauseVsyncCheck") else null
@onready var options_back_button: Button = %OptionsBackButton if has_node("%OptionsBackButton") else null
@onready var options_reset_button: Button = %OptionsResetButton if has_node("%OptionsResetButton") else null


func _ready() -> void:
	layer = 20
	process_mode = Node.PROCESS_MODE_ALWAYS

	if Engine.is_editor_hint():
		return

	# --- Runtime only ---
	if resume_button:
		resume_button.pressed.connect(_on_resume)
		SubMenuTheme.connect_button_focus(resume_button, resume_button)
	if quest_log_button:
		quest_log_button.pressed.connect(_on_quest_log)
	if options_button:
		options_button.pressed.connect(_on_options)
	if quit_button:
		quit_button.pressed.connect(_on_quit)
		SubMenuTheme.connect_button_focus(quit_button, quit_button)

	# Options panel buttons
	if options_back_button:
		options_back_button.pressed.connect(_on_options_back)
	if options_reset_button:
		options_reset_button.pressed.connect(_on_options_reset)

	_connect_options_controls()

	# Entrance animation
	_play_entrance()

	# Focus first button
	if resume_button:
		resume_button.grab_focus.call_deferred()


func _play_entrance() -> void:
	if not vbox:
		return
	# Fade in background
	if background:
		background.modulate.a = 0.0
		var bg_tween := create_tween()
		bg_tween.tween_property(background, "modulate:a", 1.0, 0.15)

	# Scale-pop the VBox
	vbox.pivot_offset = vbox.size / 2.0
	vbox.scale = Vector2(0.8, 0.8)
	vbox.modulate.a = 0.0
	var tween := create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_BACK)
	tween.tween_property(vbox, "scale", Vector2.ONE, 0.2)
	tween.parallel().tween_property(vbox, "modulate:a", 1.0, 0.15)


func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event.is_action_pressed("pause"):
		if options_panel and options_panel.visible:
			_on_options_back()
		else:
			_on_resume()
		get_viewport().set_input_as_handled()


# ─── Pause buttons ────────────────────────────────────────────────────────────

func _on_resume() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	resumed.emit()


func _on_quest_log() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	EventBus.quest_log_requested.emit()


func _on_options() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	if vbox:
		vbox.visible = false
	if options_panel:
		_populate_from_settings()
		options_panel.visible = true
		options_panel.pivot_offset = options_panel.size / 2.0
		options_panel.scale = Vector2(0.9, 0.9)
		options_panel.modulate.a = 0.0
		var tween := create_tween()
		tween.set_ease(Tween.EASE_OUT)
		tween.set_trans(Tween.TRANS_BACK)
		tween.tween_property(options_panel, "scale", Vector2.ONE, 0.15)
		tween.parallel().tween_property(options_panel, "modulate:a", 1.0, 0.1)
	if options_back_button:
		options_back_button.grab_focus.call_deferred()


func _on_quit() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	quit_to_menu.emit()


# ─── Options panel ─────────────────────────────────────────────────────────────

func _on_options_back() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	if options_panel:
		options_panel.visible = false
	if vbox:
		vbox.visible = true
	if resume_button:
		resume_button.grab_focus.call_deferred()


func _on_options_reset() -> void:
	SettingsManager.reset_to_defaults()
	_populate_from_settings()


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


func _connect_options_controls() -> void:
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
