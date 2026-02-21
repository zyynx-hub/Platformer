## Constants — all tuning values in one place.
## Direct port of js/core/constants.js.
class_name Constants
extends RefCounted

const GAME_WIDTH  := 960
const GAME_HEIGHT := 540
const TILE        := 8
const WIN_COIN_TARGET := 10

# Player physics (all in pixels/second or pixels/second²)
const PLAYER := {
	"max_speed":        164.0,
	"acceleration":    1080.0,
	"drag":            3200.0,
	"jump_velocity":    420.0,
	"max_jumps":          1,
	"gravity":         1100.0,
	"coyote_time_sec":   0.110,
	"jump_buffer_sec":   0.130,
	"hurt_invuln_sec":   0.900,
	"dash_speed":        460.0,
	"dash_duration_sec": 0.140,
	"dash_cooldown_sec": 0.900,
	"attack_range":       44.0,
	"attack_cooldown_sec":0.320,
	"max_rise_speed":    520.0,
	"max_fall_speed":    760.0,
}

# Jetpack tuning (direct port of Platformer.Config.JETPACK)
const JETPACK := {
	"fuel_capacity":          1.25,
	"drain_rate":             1.0,
	"regen_rate":             0.72,
	"hover_accel_factor":     0.95,
	"lift_accel_factor":      1.34,
	"thrust_accel_factor":    0.52,
	"jump_assist_accel_factor":0.34,
	"ramp_up_time":           0.16,
	"ramp_down_time":         0.22,
	"min_hold_to_lift":       0.2,
	"lift_threshold_speed":  56.0,
	"max_up_speed":          220.0,
	"momentum_boost_speed":   72.0,
	"activation_kick_speed":  34.0,
	"max_accel":            1320.0,
	"max_thrust_accel":     1300.0,
	"brake_decel_max":       760.0,
}

# Enemy speed multiplier by difficulty
const ENEMY_SPEED := {
	"easy":   48.0,
	"normal": 60.0,
	"hard":   95.0,
}

# Level timer by difficulty (seconds)
const LEVEL_TIMER := {
	"easy":   120,
	"normal":  90,
	"hard":    70,
}

# Projectile settings by difficulty
const PROJECTILE_INTERVAL := {
	"easy":   1.5,
	"normal": 1.1,
	"hard":   0.85,
}
const PROJECTILE_SPEED := {
	"easy":   180.0,
	"normal": 230.0,
	"hard":   270.0,
}

# Tile characters
const TILE_SOLID      := "#"
const TILE_ONE_WAY    := "="
const TILE_HAZARD     := "^"
const TILE_COIN       := "C"
const TILE_SPAWN      := "S"
const TILE_CHECKPOINT := "K"
const TILE_EMPTY      := "."
const TILE_ENEMY_E    := "E"
const TILE_ENEMY_F    := "F"
const TILE_ENEMY_G    := "G"
const TILE_ENEMY_H    := "H"
