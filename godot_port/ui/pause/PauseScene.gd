@tool
# PauseScene.gd
# In-game pause overlay — night-sky themed, freezes game tree
# Instantiated by GameScene as a CanvasLayer inside the SubViewport

extends CanvasLayer

signal resumed
signal quit_to_menu

@onready var background: ColorRect = $Background if has_node("Background") else null
@onready var title_label: Label = $VBoxContainer/TitleLabel if has_node("VBoxContainer/TitleLabel") else null
@onready var resume_button: Button = $VBoxContainer/ResumeButton if has_node("VBoxContainer/ResumeButton") else null
@onready var quit_button: Button = $VBoxContainer/QuitButton if has_node("VBoxContainer/QuitButton") else null
@onready var vbox: VBoxContainer = $VBoxContainer if has_node("VBoxContainer") else null

func _ready() -> void:
	layer = 20
	process_mode = Node.PROCESS_MODE_ALWAYS

	if Engine.is_editor_hint():
		return

	# --- Runtime only ---
	# All styling handled by NightSkyTheme.tres (assigned on VBoxContainer in .tscn)
	if resume_button:
		resume_button.pressed.connect(_on_resume)
		SubMenuTheme.connect_button_focus(resume_button, resume_button)
	if quit_button:
		quit_button.pressed.connect(_on_quit)
		SubMenuTheme.connect_button_focus(quit_button, quit_button)

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
		_on_resume()
		get_viewport().set_input_as_handled()


func _on_resume() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	resumed.emit()


func _on_quit() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	quit_to_menu.emit()
