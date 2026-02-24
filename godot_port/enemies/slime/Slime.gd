# Slime.gd
# First enemy type — gentle squash-stretch bob for visual personality.

extends Enemy

func _ready() -> void:
	super._ready()
	# Looping squash-stretch bob
	var tween := create_tween().set_loops()
	tween.tween_property(_sprite, "scale", Vector2(1.1, 0.9), 0.4).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	tween.tween_property(_sprite, "scale", Vector2(0.9, 1.1), 0.4).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
