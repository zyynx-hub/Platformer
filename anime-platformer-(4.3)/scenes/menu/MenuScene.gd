## MenuScene — main menu with Play, Options, Quit.
## Port of js/scenes/menu-scene.js (core flow; visual flourishes deferred).
extends Node2D

const SCENE_WORLD_MAP := "res://scenes/world_map/WorldMapScene.tscn"
const SCENE_OPTIONS   := "res://scenes/options/OptionsScene.tscn"

@onready var play_button:    Button = $UI/VBox/PlayButton
@onready var options_button: Button = $UI/VBox/OptionsButton
@onready var quit_button:    Button = $UI/VBox/QuitButton
@onready var version_label:  Label  = $UI/VersionLabel
@onready var bg_runner:      AnimatedSprite2D = $BackgroundRunner


func _ready() -> void:
	AudioManager.play_music("menu", 1.0)
	play_button.pressed.connect(_on_play)
	options_button.pressed.connect(_on_options)
	quit_button.pressed.connect(_on_quit)
	if version_label:
		version_label.text = "v0.1.0-godot"
	if bg_runner:
		bg_runner.play("run")


func _on_play() -> void:
	GameManager.start_new_game("start", "world_tutorial")
	get_tree().change_scene_to_file(SCENE_WORLD_MAP)


func _on_options() -> void:
	get_tree().change_scene_to_file(SCENE_OPTIONS)


func _on_quit() -> void:
	get_tree().quit()
