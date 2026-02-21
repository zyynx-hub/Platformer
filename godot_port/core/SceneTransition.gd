# SceneTransition.gd
# Full-screen fade overlay that persists across scene changes

extends CanvasLayer

var _overlay: ColorRect
var _is_transitioning := false

func _ready() -> void:
	layer = 100
	process_mode = Node.PROCESS_MODE_ALWAYS

	_overlay = ColorRect.new()
	_overlay.color = Color.BLACK
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay.modulate.a = 0.0
	add_child(_overlay)

func transition_to(scene_path: String, duration: float = 0.5) -> void:
	if _is_transitioning:
		return
	_is_transitioning = true
	_overlay.mouse_filter = Control.MOUSE_FILTER_STOP

	var tween := create_tween()
	tween.tween_property(_overlay, "modulate:a", 1.0, duration * 0.5)
	tween.tween_callback(_change_scene.bind(scene_path))
	tween.tween_property(_overlay, "modulate:a", 0.0, duration * 0.5)
	tween.tween_callback(_on_transition_finished)

func fade_to_black(duration: float = 0.25) -> void:
	_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	var tween := create_tween()
	tween.tween_property(_overlay, "modulate:a", 1.0, duration)
	await tween.finished

func fade_from_black(duration: float = 0.5) -> void:
	_overlay.modulate.a = 1.0
	var tween := create_tween()
	tween.tween_property(_overlay, "modulate:a", 0.0, duration)
	tween.tween_callback(func(): _overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE)

func _change_scene(path: String) -> void:
	get_tree().change_scene_to_file(path)

func _on_transition_finished() -> void:
	_is_transitioning = false
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
