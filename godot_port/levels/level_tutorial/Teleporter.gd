# Teleporter.gd
# Bidirectional teleporter — warps the player instantly to the paired destination.
# Place two instances, point each destination NodePath at the other.

extends Area2D

@export var destination: NodePath = ""

var _cooldown: float = 0.0
var _sprite: Sprite2D

const TP_TEX = preload("res://levels/level_tutorial/sprites/teleporter.png")

func _ready() -> void:
	collision_layer = 0
	collision_mask = 2
	body_entered.connect(_on_body_entered)
	# Create sprite child
	_sprite = Sprite2D.new()
	_sprite.texture = TP_TEX
	_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(_sprite)
	# Gentle pulse animation
	var tween := _sprite.create_tween().set_loops()
	tween.tween_property(_sprite, "modulate:a", 0.7, 0.6).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	tween.tween_property(_sprite, "modulate:a", 1.0, 0.6).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)

func _process(delta: float) -> void:
	_cooldown = maxf(0.0, _cooldown - delta)

func _on_body_entered(body: Node2D) -> void:
	if not body is CharacterBody2D or _cooldown > 0.0:
		return
	var dest := get_node_or_null(destination)
	if not dest:
		push_warning("Teleporter: no destination node at '%s'" % destination)
		return
	body.global_position = dest.global_position
	body.velocity = Vector2.ZERO
	# Prevent immediate re-trigger on both ends
	_cooldown = 0.5
	if dest.has_method("set_cooldown"):
		dest.set_cooldown(0.5)

func set_cooldown(t: float) -> void:
	_cooldown = t
