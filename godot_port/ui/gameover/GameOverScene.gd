@tool
# GameOverScene.gd
# Game over overlay — shown after player death dissolve, before respawn
# Simple dark overlay (like PauseScene) with subtle title glow shader accent.
# Staggered entrance animation: flash → title pop → subtitle fade → buttons.

extends CanvasLayer

signal retry
signal quit_to_menu

@onready var background: ColorRect = $Background if has_node("Background") else null
@onready var flash_overlay: ColorRect = $FlashOverlay if has_node("FlashOverlay") else null
@onready var content_root: Control = $ContentRoot if has_node("ContentRoot") else null
@onready var title_glow: ColorRect = $ContentRoot/TitleGlow if has_node("ContentRoot/TitleGlow") else null
@onready var vbox: VBoxContainer = $ContentRoot/VBoxContainer if has_node("ContentRoot/VBoxContainer") else null
@onready var title_label: Label = $ContentRoot/VBoxContainer/TitleLabel if has_node("ContentRoot/VBoxContainer/TitleLabel") else null
@onready var subtitle_label: Label = $ContentRoot/VBoxContainer/SubtitleLabel if has_node("ContentRoot/VBoxContainer/SubtitleLabel") else null
@onready var try_again_button: Button = $ContentRoot/VBoxContainer/TryAgainButton if has_node("ContentRoot/VBoxContainer/TryAgainButton") else null
@onready var quit_button: Button = $ContentRoot/VBoxContainer/QuitButton if has_node("ContentRoot/VBoxContainer/QuitButton") else null

func _ready() -> void:
	layer = 18
	process_mode = Node.PROCESS_MODE_ALWAYS

	if Engine.is_editor_hint():
		return

	# --- Runtime only ---
	if try_again_button:
		try_again_button.pressed.connect(_on_retry)
		SubMenuTheme.connect_button_focus(try_again_button, try_again_button)
	if quit_button:
		quit_button.pressed.connect(_on_quit)
		SubMenuTheme.connect_button_focus(quit_button, quit_button)

	# Hide elements initially for staggered reveal
	if try_again_button:
		try_again_button.modulate.a = 0.0
	if quit_button:
		quit_button.modulate.a = 0.0
	if title_label:
		title_label.modulate.a = 0.0

	_play_entrance()


func _play_entrance() -> void:
	# Phase 1: Fade in dark background
	if background:
		background.modulate.a = 0.0
		var bg_tween := create_tween()
		bg_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
		bg_tween.tween_property(background, "modulate:a", 1.0, 0.25)

	# Phase 1b: Title glow shader fade-in (subtle accent behind title)
	if title_glow and title_glow.material:
		var glow_mat = title_glow.material
		var glow_set = func(v: float) -> void:
			glow_mat.set_shader_parameter("appear_progress", v)
		var glow_tween := create_tween()
		glow_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
		glow_tween.tween_interval(0.2)
		glow_tween.tween_method(glow_set, 0.0, 1.0, 0.5)

	# Phase 2: Quick screen flash (cyan-blue spike, fades)
	if flash_overlay:
		var flash_tween := create_tween()
		flash_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
		flash_tween.tween_interval(0.1)
		flash_tween.tween_property(flash_overlay, "color:a", 0.25, 0.06)
		flash_tween.tween_property(flash_overlay, "color:a", 0.0, 0.35)

	# Phase 3: Title scale-pop
	if title_label:
		title_label.pivot_offset = title_label.size / 2.0
		title_label.scale = Vector2(0.5, 0.5)
		var title_tween := create_tween()
		title_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
		title_tween.tween_interval(0.1)
		title_tween.set_ease(Tween.EASE_OUT)
		title_tween.set_trans(Tween.TRANS_BACK)
		title_tween.tween_property(title_label, "scale", Vector2.ONE, 0.35)
		title_tween.parallel().tween_property(title_label, "modulate:a", 1.0, 0.2)

	# Phase 4: Subtitle fade-in
	if subtitle_label:
		var sub_tween := create_tween()
		sub_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
		sub_tween.tween_interval(0.45)
		sub_tween.tween_property(subtitle_label, "theme_override_colors/font_color:a", 0.7, 0.4)

	# Phase 5: Buttons scale-pop with stagger
	var buttons := [try_again_button, quit_button]
	for i in range(buttons.size()):
		var btn: Button = buttons[i]
		if not btn:
			continue
		btn.pivot_offset = btn.size / 2.0
		btn.scale = Vector2(0.7, 0.7)
		var btn_tween := create_tween()
		btn_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
		btn_tween.tween_interval(0.6 + i * 0.12)
		btn_tween.set_ease(Tween.EASE_OUT)
		btn_tween.set_trans(Tween.TRANS_BACK)
		btn_tween.tween_property(btn, "modulate:a", 1.0, 0.2)
		btn_tween.parallel().tween_property(btn, "scale", Vector2.ONE, 0.25)

	# Focus first button after animations settle
	if try_again_button:
		var focus_tween := create_tween()
		focus_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
		focus_tween.tween_interval(0.8)
		focus_tween.tween_callback(try_again_button.grab_focus)


func _on_retry() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	retry.emit()


func _on_quit() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	quit_to_menu.emit()
