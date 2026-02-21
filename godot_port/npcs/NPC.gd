# NPC.gd
# Base NPC — Area2D with E-key interaction, face-player, and dialog trigger.
# Place instances in levels, set npc_name/dialog_id in Inspector.
# Set color tint directly on the Sprite node's modulate in the .tscn.
# Subclass scripts override _get_active_dialog_id() for conditional dialog.

@tool
extends Area2D

@export var npc_name: String = "NPC"
@export var dialog_id: String = ""
@export var face_player_on_interact: bool = true

@onready var _sprite: Sprite2D = %Sprite

var _player_in_range: bool = false
var _interacting: bool = false
var _interact_cooldown: float = 0.0
var _time: float = 0.0

func _ready() -> void:
	if Engine.is_editor_hint():
		return
	# --- Runtime only below ---
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	EventBus.cinematic_dialog_ended.connect(_on_dialog_ended)

func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return
	_time += delta
	if _interact_cooldown > 0.0:
		_interact_cooldown -= delta
	queue_redraw()

func _draw() -> void:
	if Engine.is_editor_hint():
		return
	if not _player_in_range or _interacting:
		return

	# Floating "E" keycap prompt above the NPC sprite (sprite top is at y=-32)
	var prompt_y := -38.0 + sin(_time * 4.0) * 1.5
	var pulse := sin(_time * 3.0) * 0.2 + 0.8

	# Keycap background
	var rect := Rect2(-7, prompt_y - 6, 14, 12)
	draw_rect(rect, Color(0.06, 0.06, 0.12, 0.92))
	# Border glow
	draw_rect(rect, Color(0.4, 0.75, 1.0, pulse * 0.8), false, 1.0)
	# "E" letter
	var font := ThemeDB.fallback_font
	draw_string(font, Vector2(-4, prompt_y + 4), "E", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(1.0, 1.0, 1.0, pulse))

func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if _player_in_range and not _interacting and _interact_cooldown <= 0.0 and event.is_action_pressed("interact"):
		_interact()
		get_viewport().set_input_as_handled()

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = true

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D:
		_player_in_range = false

# --- Interaction ---

func _interact() -> void:
	_interacting = true

	# Make both NPC and player face each other
	var player := _get_player()
	if player:
		if face_player_on_interact and _sprite:
			_sprite.flip_h = player.global_position.x < global_position.x
		# Player faces toward the NPC
		player.is_facing_right = global_position.x > player.global_position.x

	var active_id := _get_active_dialog_id()
	if active_id.is_empty():
		_interacting = false
		return

	if not DialogDefs.has_dialog(active_id):
		push_warning("NPC '%s': dialog '%s' not found" % [npc_name, active_id])
		_interacting = false
		return

	# One-shot dialogs: skip if already seen, otherwise mark as seen
	if DialogDefs.is_one_shot(active_id):
		var progress := ProgressData.new()
		if progress.is_dialog_seen(active_id):
			_interacting = false
			return
		progress.mark_dialog_seen(active_id)

	EventBus.dialog_requested.emit(active_id)

## Override in subclass scripts for conditional dialog based on quest state.
func _get_active_dialog_id() -> String:
	return dialog_id

func _get_player() -> Node2D:
	var players := get_tree().get_nodes_in_group("player")
	if players.is_empty():
		return null
	return players[0]

func _on_dialog_ended(_ended_dialog_id: String) -> void:
	_interacting = false
	_interact_cooldown = 0.5
