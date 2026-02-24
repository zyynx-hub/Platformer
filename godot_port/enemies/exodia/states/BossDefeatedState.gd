# BossDefeatedState.gd
# Final state — plays defeated animation, then signals death.
# Animation: "defeated" on BossAnimPlayer (fade + stretch).
# Callback: _on_defeated_anim_finished() on ExodiaKarimBoss.

extends BossState


func enter() -> void:
	boss.get_anim().play("defeated")
	# die() is called by _on_defeated_anim_finished callback in the animation


func exit() -> void:
	pass


func physics_update(_delta: float) -> void:
	pass
