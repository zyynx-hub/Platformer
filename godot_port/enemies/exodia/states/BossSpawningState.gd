# BossSpawningState.gd
# Brief spawn-in animation before Phase 1 begins.
# Boss is invulnerable and hitbox disabled during this state.
# Animation: "spawn_in" on BossAnimPlayer (scale-pop + fade-in).
# Callback: _on_spawn_finished() on ExodiaKarimBoss re-enables hitbox + collision.

extends BossState


func enter() -> void:
	# Disable hitbox so player takes no contact damage during spawn-in
	var hitbox: Area2D = boss.get_node_or_null("Hitbox")
	if hitbox:
		hitbox.set_deferred("monitoring", false)
	boss.hide_danger_indicator()
	boss.hide_stomp_indicator()
	boss.hide_weapon()

	boss.get_anim().play("spawn_in")


func exit() -> void:
	pass


func physics_update(_delta: float) -> void:
	pass
