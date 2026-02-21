# ProgressionGate.gd
# Self-contained gate that blocks a passage with collision + colored visual.
# Leave the passage OPEN in LDtk — this node provides the blocking.
# When a matching ProgressionTrigger fires, the gate fades out and lets the player through.
# Set gate_id in Inspector to match the trigger's gate_id.

@tool
extends StaticBody2D

@export var gate_id: String = ""
@export var gate_color: Color = Color(0.12, 0.10, 0.18, 1.0)

var _opened: bool = false

func _ready() -> void:
	if Engine.is_editor_hint():
		return
	EventBus.gate_opened.connect(_on_gate_opened)

func _draw() -> void:
	var shape_node = get_node_or_null("CollisionShape2D") as CollisionShape2D
	if not shape_node or not shape_node.shape is RectangleShape2D:
		return
	var rect_shape = shape_node.shape as RectangleShape2D
	var half = rect_shape.size * 0.5
	draw_rect(Rect2(-half, rect_shape.size), gate_color)

func _on_gate_opened(id: String) -> void:
	if id != gate_id or _opened:
		return
	_opened = true
	var tween = create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.5)
	tween.tween_callback(_disable_collision)

func _disable_collision() -> void:
	var collision = get_node_or_null("CollisionShape2D")
	if collision:
		collision.set_deferred("disabled", true)
