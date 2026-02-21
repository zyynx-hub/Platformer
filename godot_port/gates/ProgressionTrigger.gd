# ProgressionTrigger.gd
# Area2D trigger zone — place in levels, set gate_id in Inspector
# When the player enters, emits gate_opened via EventBus
# The matching ProgressionGate listens and opens

@tool
extends Area2D

@export var gate_id: String = ""

var _triggered: bool = false

func _ready() -> void:
	if Engine.is_editor_hint():
		return
	collision_layer = 0
	collision_mask = 1  # player is on layer 1
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if not body is CharacterBody2D:
		return
	if _triggered:
		return
	if gate_id.is_empty():
		push_warning("ProgressionTrigger: no gate_id set")
		return
	_triggered = true
	EventBus.gate_opened.emit(gate_id)
