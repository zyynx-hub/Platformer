# WanderingNPC.gd
# NPC with random wandering behavior on flat ground.
# Set wander_min_x and wander_max_x in Inspector to bound movement.

@tool
extends "res://npcs/NPC.gd"

@export var wander_min_x: float = 0.0
@export var wander_max_x: float = 500.0
@export var wander_speed: float = 20.0

enum WanderState { IDLE, WALKING }
var _wander_state: WanderState = WanderState.IDLE
var _wander_dir: float = 0.0
var _wander_timer: float = 0.0

func _ready() -> void:
	super._ready()
	if Engine.is_editor_hint():
		return
	_pick_wander_state()

func _process(delta: float) -> void:
	super._process(delta)
	if Engine.is_editor_hint() or _interacting:
		return
	_wander_timer -= delta
	if _wander_timer <= 0.0:
		_pick_wander_state()
	if _wander_state == WanderState.WALKING:
		position.x += _wander_dir * wander_speed * delta
		position.x = clampf(position.x, wander_min_x, wander_max_x)
		if _sprite:
			_sprite.flip_h = _wander_dir < 0.0

func _pick_wander_state() -> void:
	var roll := randf()
	if roll < 0.4:
		_wander_state = WanderState.IDLE
		_wander_timer = randf_range(2.0, 5.0)
	elif roll < 0.7:
		_wander_state = WanderState.WALKING
		_wander_dir = -1.0
		_wander_timer = randf_range(1.0, 3.0)
	else:
		_wander_state = WanderState.WALKING
		_wander_dir = 1.0
		_wander_timer = randf_range(1.0, 3.0)
