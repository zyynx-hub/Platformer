## Projectile — fired by hazard turrets toward the player.
extends CharacterBody2D

var speed: float = 230.0

func _physics_process(delta: float) -> void:
	move_and_slide()
	# Auto-destroy if it leaves the world bounds
	if global_position.length() > 8000.0:
		queue_free()


func _on_body_entered(body: Node) -> void:
	if body is Player:
		body.apply_damage(1)
	queue_free()
