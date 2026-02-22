extends Node2D

## Spawns flocks of bird silhouettes that fly across the sky.
## Active during day/dawn/dusk, dormant at night.

const BIRD_SCRIPT := preload("res://levels/level_town/ambient/Bird.gd")

var _spawn_timer: float = 0.0
var _next_spawn: float = 5.0  # first flock comes quickly

func _ready() -> void:
	if Engine.is_editor_hint():
		return

func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return

	# Animate existing birds (wing flap)
	for child in get_children():
		if child.has_method("queue_redraw"):
			child.flap_phase += delta * (2.5 + child.bird_size * 0.1)
			child.queue_redraw()

	# Spawn timer
	_spawn_timer += delta
	if _spawn_timer >= _next_spawn:
		_spawn_timer = 0.0
		_try_spawn_flock()
		_next_spawn = randf_range(10.0, 25.0)

func _try_spawn_flock() -> void:
	# No birds at night
	if DayNightCycle.is_night():
		return

	# Flock size: more birds at dawn/dusk
	var flock_size := 2
	if DayNightCycle.is_dawn() or DayNightCycle.is_dusk():
		flock_size = randi_range(3, 5)
	else:
		flock_size = randi_range(2, 3)

	# Direction: left or right
	var going_right := randf() > 0.5
	var start_x := -50.0 if going_right else 1100.0
	var end_x := 1100.0 if going_right else -50.0
	var speed := randf_range(40.0, 80.0)
	var duration := absf(end_x - start_x) / speed

	# Altitude
	var base_y := randf_range(-150.0, -30.0)

	for i in range(flock_size):
		var bird := Node2D.new()
		bird.set_script(BIRD_SCRIPT)
		bird.bird_size = randf_range(3.0, 6.0)
		bird.flap_phase = randf()  # random start phase

		# Slightly darker at dusk/dawn
		var brightness := 0.12 if DayNightCycle.is_dawn() or DayNightCycle.is_dusk() else 0.08
		bird.bird_color = Color(brightness, brightness, brightness + 0.05)

		# V-formation offset
		var offset_x: float = i * (8.0 if going_right else -8.0)
		var offset_y: float = absf(float(i) - flock_size / 2.0) * 5.0
		bird.position = Vector2(start_x + offset_x, base_y + offset_y)

		add_child(bird)

		# Fly across with sine-wave bob
		var tween := create_tween()
		var bob_y := randf_range(3.0, 8.0)
		tween.tween_property(bird, "position:x", end_x + offset_x, duration)
		tween.parallel().tween_method(
			func(t: float) -> void:
				if is_instance_valid(bird):
					bird.position.y = base_y + offset_y + sin(t * TAU * 2.0) * bob_y,
			0.0, 1.0, duration
		)
		tween.tween_callback(bird.queue_free)
