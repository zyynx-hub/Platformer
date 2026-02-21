# ChoicePanel.gd
# Dialog choice overlay — presents 2-4 options, emits choice_made(index).
# Pauses the game while showing. NPC scripts instantiate after dialog ends.
# Call setup() before add_child().

extends CanvasLayer

signal choice_made(index: int)

@onready var _prompt: Label = %PromptLabel
@onready var _options: Array = [%Option0, %Option1, %Option2, %Option3]

var _prompt_text: String = ""
var _option_texts: Array = []

## Call before add_child() to configure the prompt and options.
func setup(prompt: String, options: Array) -> void:
	_prompt_text = prompt
	_option_texts = options

func _ready() -> void:
	get_tree().paused = true

	_prompt.text = _prompt_text

	for i in range(_option_texts.size()):
		_options[i].text = _option_texts[i]
		_options[i].visible = true
		_options[i].pressed.connect(_on_option_pressed.bind(i))

	# Hide unused buttons
	for i in range(_option_texts.size(), 4):
		_options[i].visible = false

	# Focus first option after brief delay
	await get_tree().create_timer(0.15).timeout
	if is_instance_valid(_options[0]):
		_options[0].grab_focus()

func _on_option_pressed(index: int) -> void:
	AudioManager.play_ui_sfx("ui_confirm")
	get_tree().paused = false
	choice_made.emit(index)
	queue_free()
