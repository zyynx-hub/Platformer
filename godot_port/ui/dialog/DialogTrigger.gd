# DialogTrigger.gd
# Area2D trigger zone — place in levels, set dialog_id in Inspector
# When the player enters, emits dialog_requested via EventBus
# GameScene handles the cinematic orchestration
# one_shot is controlled per-dialog in the .tres file (DialogSequence.one_shot)

@tool
extends Area2D

@export var dialog_id: String = ""

var _triggered: bool = false

func _ready() -> void:
	if Engine.is_editor_hint():
		return
	collision_layer = 0
	collision_mask = 1  # player is on layer 1
	body_entered.connect(_on_body_entered)

	# Check if already seen (persisted across sessions)
	if DialogDefs.is_one_shot(dialog_id):
		var progress := ProgressData.new()
		if progress.is_dialog_seen(dialog_id):
			_triggered = true

func _on_body_entered(body: Node2D) -> void:
	if not body is CharacterBody2D:
		return
	if _triggered:
		return
	if dialog_id.is_empty():
		push_warning("DialogTrigger: no dialog_id set")
		return
	if not DialogDefs.has_dialog(dialog_id):
		push_warning("DialogTrigger: no .tres found for '%s'" % dialog_id)
		return
	_triggered = true
	if DialogDefs.is_one_shot(dialog_id):
		var progress := ProgressData.new()
		progress.mark_dialog_seen(dialog_id)
	EventBus.dialog_requested.emit(dialog_id)
