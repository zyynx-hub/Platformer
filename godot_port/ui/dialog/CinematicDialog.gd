# CinematicDialog.gd
# Cinematic dialog overlay — slow-mo, dark overlay, bottom-screen JRPG-style dialog box
# with typewriter text, character portrait, and click-to-advance input.
# Lives inside SubViewport (426x240) for pixel-art consistency.

extends CanvasLayer

signal dialog_finished

enum State { INACTIVE, ENTERING, TYPING, WAITING, EXITING }

@export var dialog_lines: Array[DialogLine] = []
@export var text_speed: float = Constants.DIALOG_TEXT_SPEED

var _dialog_id: String = ""

@onready var dark_overlay: ColorRect = $DialogRoot/DarkOverlay
@onready var dialog_box: PanelContainer = $DialogRoot/DialogBox
@onready var portrait: TextureRect = $DialogRoot/DialogBox/MarginContainer/HBoxContainer/Portrait
@onready var portrait_placeholder: ColorRect = $DialogRoot/DialogBox/MarginContainer/HBoxContainer/Portrait/PortraitPlaceholder
@onready var name_label: Label = $DialogRoot/DialogBox/MarginContainer/HBoxContainer/VBoxContainer/NameLabel
@onready var dialog_text: RichTextLabel = $DialogRoot/DialogBox/MarginContainer/HBoxContainer/VBoxContainer/DialogText
@onready var continue_label: Label = $DialogRoot/DialogBox/MarginContainer/HBoxContainer/VBoxContainer/ContinueLabel
@onready var talk_sound: AudioStreamPlayer = %TalkSound

var _state: State = State.INACTIVE
var _last_visible_chars: int = 0
var _current_line: int = 0
var _current_voice_pitch: float = 1.0
var _char_progress: float = 0.0
var _total_chars: int = 0
var _blink_time: float = 0.0

func _ready() -> void:
	layer = 15
	process_mode = Node.PROCESS_MODE_ALWAYS
	# Start hidden
	dark_overlay.modulate.a = 0.0
	dialog_box.modulate.a = 0.0
	continue_label.modulate.a = 0.0

func load_dialog(dialog_id: String) -> void:
	_dialog_id = dialog_id
	dialog_lines = DialogDefs.get_lines(dialog_id)

func start() -> void:
	if dialog_lines.is_empty():
		dialog_finished.emit()
		return
	_state = State.ENTERING
	EventBus.cinematic_dialog_started.emit(_dialog_id)
	_play_entrance()

func _process(delta: float) -> void:
	# Compensate for Engine.time_scale so dialog runs at real-time speed
	var real_delta = delta / maxf(Engine.time_scale, 0.001)

	match _state:
		State.TYPING:
			_char_progress += text_speed * real_delta
			var chars_to_show = int(_char_progress)
			if chars_to_show >= _total_chars:
				dialog_text.visible_characters = _total_chars
				_on_line_finished()
			else:
				dialog_text.visible_characters = chars_to_show
				# Play talk blip on each new visible character
				if chars_to_show > _last_visible_chars:
					_play_talk_blip(chars_to_show)
				_last_visible_chars = chars_to_show
		State.WAITING:
			_blink_time += real_delta
			var blink_alpha = 0.3 + 0.7 * abs(sin(_blink_time * Constants.DIALOG_CONTINUE_BLINK_SPEED * PI))
			continue_label.modulate.a = blink_alpha

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		match _state:
			State.TYPING:
				# Instant-complete current line
				dialog_text.visible_characters = _total_chars
				_on_line_finished()
				get_viewport().set_input_as_handled()
			State.WAITING:
				# Advance to next line or finish
				_advance()
				get_viewport().set_input_as_handled()

func _play_talk_blip(char_index: int) -> void:
	var text: String = dialog_text.text
	if char_index <= 0 or char_index > text.length():
		return
	var ch := text[char_index - 1]
	# Skip spaces and punctuation — silent
	if ch in " \t\n.,!?;:-\"'()[]{}":
		return
	var spread := (Constants.DIALOG_TALK_PITCH_MAX - Constants.DIALOG_TALK_PITCH_MIN) * 0.5
	talk_sound.pitch_scale = _current_voice_pitch + randf_range(-spread, spread)
	talk_sound.play()

func _on_line_finished() -> void:
	_state = State.WAITING
	_blink_time = 0.0
	continue_label.visible = true

func _advance() -> void:
	_current_line += 1
	if _current_line >= dialog_lines.size():
		_exit_dialog()
	else:
		_show_line(_current_line)

func _play_entrance() -> void:
	var speed_comp = 1.0 / maxf(Engine.time_scale, 0.001)

	# Fade in dark overlay
	var overlay_tween = create_tween()
	overlay_tween.set_speed_scale(speed_comp)
	overlay_tween.tween_property(dark_overlay, "modulate:a", 1.0, Constants.DIALOG_OVERLAY_FADE_DURATION)

	# Pre-populate first line visuals so portrait slides in with the box
	_current_line = 0
	var first_line = dialog_lines[0]
	name_label.text = first_line.character_name
	if first_line.portrait:
		portrait.texture = first_line.portrait
		portrait_placeholder.visible = false
	else:
		portrait.texture = null
		portrait_placeholder.visible = true
	dialog_text.text = first_line.text
	dialog_text.visible_characters = 0
	continue_label.visible = false

	# Slide dialog box up from below
	var box_start_y = dialog_box.position.y
	dialog_box.position.y = box_start_y + 200.0
	dialog_box.modulate.a = 0.0

	var box_tween = create_tween()
	box_tween.set_speed_scale(speed_comp)
	box_tween.set_ease(Tween.EASE_OUT)
	box_tween.set_trans(Tween.TRANS_BACK)
	box_tween.tween_property(dialog_box, "position:y", box_start_y, Constants.DIALOG_BOX_SLIDE_DURATION)
	box_tween.parallel().tween_property(dialog_box, "modulate:a", 1.0, Constants.DIALOG_BOX_SLIDE_DURATION * 0.5)

	# After entrance completes, start typewriter on first line
	await box_tween.finished
	_total_chars = first_line.text.length()
	_char_progress = 0.0
	_last_visible_chars = 0
	_current_voice_pitch = first_line.voice_pitch
	_state = State.TYPING

func _show_line(index: int) -> void:
	var line = dialog_lines[index]
	name_label.text = line.character_name
	if line.portrait:
		portrait.texture = line.portrait
		portrait_placeholder.visible = false
	else:
		portrait.texture = null
		portrait_placeholder.visible = true
	dialog_text.text = line.text
	_total_chars = line.text.length()
	_char_progress = 0.0
	dialog_text.visible_characters = 0
	_last_visible_chars = 0
	_current_voice_pitch = line.voice_pitch
	continue_label.visible = false
	_state = State.TYPING

func _exit_dialog() -> void:
	_state = State.EXITING
	continue_label.visible = false
	var speed_comp = 1.0 / maxf(Engine.time_scale, 0.001)

	# Slide box down
	var box_tween = create_tween()
	box_tween.set_speed_scale(speed_comp)
	box_tween.set_ease(Tween.EASE_IN)
	box_tween.set_trans(Tween.TRANS_BACK)
	box_tween.tween_property(dialog_box, "position:y", dialog_box.position.y + 200.0, Constants.DIALOG_BOX_SLIDE_DURATION)
	box_tween.parallel().tween_property(dialog_box, "modulate:a", 0.0, Constants.DIALOG_BOX_SLIDE_DURATION * 0.5)

	# Fade out overlay
	var overlay_tween = create_tween()
	overlay_tween.set_speed_scale(speed_comp)
	overlay_tween.tween_property(dark_overlay, "modulate:a", 0.0, Constants.DIALOG_OVERLAY_FADE_DURATION)

	await overlay_tween.finished
	_state = State.INACTIVE
	EventBus.cinematic_dialog_ended.emit(_dialog_id)
	dialog_finished.emit()
