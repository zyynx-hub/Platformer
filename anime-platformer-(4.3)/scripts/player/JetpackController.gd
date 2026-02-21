## JetpackController — direct port of js/systems/jetpack.js.
## Attach to Player; call update() every physics frame.
class_name JetpackController
extends RefCounted

var cfg: Dictionary
var fuel: float
var is_thrusting: bool    = false
var airborne: bool        = false
var armed_after_takeoff: bool = false
var hold_time: float      = 0.0
var current_accel: float  = 0.0
var current_thrust_accel: float = 0.0
var ramp_alpha: float     = 0.0
var phase: String         = "OFF"
var current_max_up_speed: float = -220.0

signal jetpack_started()
signal jetpack_stopped(reason: String)


func _init(config: Dictionary = {}) -> void:
	cfg = Constants.JETPACK.duplicate()
	for k in config.keys():
		cfg[k] = config[k]
	fuel = cfg["fuel_capacity"]
	current_max_up_speed = -absf(cfg["max_up_speed"])


func reset(full_fuel: bool = true) -> void:
	is_thrusting   = false
	airborne       = false
	armed_after_takeoff = false
	hold_time      = 0.0
	current_accel  = 0.0
	current_thrust_accel = 0.0
	ramp_alpha     = 0.0
	phase          = "OFF"
	current_max_up_speed = -absf(cfg["max_up_speed"])
	if full_fuel:
		fuel = cfg["fuel_capacity"]


func fuel_percent() -> float:
	if cfg["fuel_capacity"] <= 0.0:
		return 0.0
	return clampf(fuel / cfg["fuel_capacity"] * 100.0, 0.0, 100.0)


## Call every physics frame. Returns a result dictionary.
## player_body: the CharacterBody2D
## grounded: bool
## jump_held: bool (same key as jump — used as jetpack trigger in JS)
## thrust_held: bool
## world_gravity: float (project gravity, e.g. 1100)
## delta: float
func update(player_body: CharacterBody2D, grounded: bool,
		jump_held: bool, thrust_held: bool,
		world_gravity: float, delta: float) -> Dictionary:

	var prev_thrust := is_thrusting
	var max_accel: float  = maxf(0.0, cfg["max_accel"])
	var ramp_up:   float  = maxf(0.001, cfg["ramp_up_time"])
	var ramp_rate: float  = max_accel / ramp_up

	if grounded:
		airborne        = false
		armed_after_takeoff = false
		is_thrusting    = false
		hold_time       = 0.0
		current_accel   = 0.0
		current_thrust_accel = 0.0
		ramp_alpha      = 0.0
		phase           = "OFF"
		fuel = minf(cfg["fuel_capacity"], fuel + cfg["regen_rate"] * delta)
		if prev_thrust:
			jetpack_stopped.emit("landed")
		return _result()

	if not airborne:
		airborne = true
		armed_after_takeoff = not jump_held
	elif not armed_after_takeoff and not jump_held:
		armed_after_takeoff = true

	var wants_thrust: bool = armed_after_takeoff and thrust_held and fuel > 0.0
	var vy: float = player_body.velocity.y

	if wants_thrust:
		hold_time += delta
		var entering_thrust := not prev_thrust
		var lift_threshold: float = absf(cfg["lift_threshold_speed"])
		var min_hold: float       = maxf(0.0, cfg["min_hold_to_lift"])
		var is_near_hover: bool   = vy <= lift_threshold
		var can_lift: bool        = is_near_hover or hold_time >= min_hold
		phase = "LIFT" if can_lift else "BRAKE"

		var hover_accel: float = world_gravity * cfg["hover_accel_factor"]
		var lift_accel:  float = world_gravity * cfg["lift_accel_factor"]
		var target_accel: float = lift_accel if can_lift else hover_accel
		var max_thrust_accel: float = maxf(0.0, cfg["max_thrust_accel"])
		var thrust_factor:  float = maxf(0.0, cfg["thrust_accel_factor"])
		var assist_factor:  float = maxf(0.0, cfg["jump_assist_accel_factor"])

		if not can_lift and vy > 0.0:
			target_accel = minf(target_accel, maxf(0.0, cfg["brake_decel_max"]))

		target_accel   = clampf(target_accel, 0.0, max_accel)
		current_accel  = clampf(current_accel + ramp_rate * delta, 0.0, target_accel)

		var phase_mult: float = 1.0 if can_lift else 0.35
		var target_thrust: float = world_gravity * thrust_factor * phase_mult
		if vy < 0.0:
			target_thrust += world_gravity * assist_factor
		target_thrust = clampf(target_thrust, 0.0, max_thrust_accel)
		current_thrust_accel = clampf(
			current_thrust_accel + (max_thrust_accel / ramp_up) * delta,
			0.0, target_thrust
		)
		ramp_alpha   = clampf(current_accel / max_accel, 0.0, 1.0) if max_accel > 0.0 else 0.0
		is_thrusting = current_accel > 1.0

		fuel = maxf(0.0, fuel - cfg["drain_rate"] * delta)

		if entering_thrust:
			var base_max_up: float     = -absf(cfg["max_up_speed"])
			var momentum_boost: float  = maxf(0.0, cfg["momentum_boost_speed"])
			var activation_kick: float = maxf(0.0, cfg["activation_kick_speed"])
			if vy < 0.0:
				current_max_up_speed = minf(base_max_up, vy - momentum_boost)
				player_body.velocity.y = vy - activation_kick
			else:
				current_max_up_speed = base_max_up

		if not prev_thrust and is_thrusting:
			jetpack_started.emit()

		# Anti-gravity: apply upward acceleration via velocity manipulation
		# In Godot we accumulate it into velocity directly.
		var anti_grav: float = current_accel + current_thrust_accel
		player_body.velocity.y -= anti_grav * delta

		# Clamp head collision
		if player_body.is_on_ceiling() and player_body.velocity.y < 0.0:
			player_body.velocity.y = 0.0

		# Clamp max upward speed
		if player_body.velocity.y < current_max_up_speed:
			player_body.velocity.y = current_max_up_speed

		if fuel <= 0.0:
			_cut_thrust(player_body, "fuel_empty")
	else:
		if prev_thrust:
			jetpack_stopped.emit("released" if armed_after_takeoff else "state_blocked")
		_cut_thrust(player_body, "")

	return _result()


func _cut_thrust(player_body: CharacterBody2D, _reason: String) -> void:
	hold_time            = 0.0
	phase                = "OFF"
	is_thrusting         = false
	current_max_up_speed = -absf(cfg["max_up_speed"])
	current_accel        = 0.0
	current_thrust_accel = 0.0
	ramp_alpha           = 0.0
	# Restore normal gravity — Godot handles this via the project gravity
	# already applied in move_and_slide, nothing extra needed.


func _result() -> Dictionary:
	return {
		"is_thrusting":   is_thrusting,
		"fuel_percent":   fuel_percent(),
		"accel_applied":  current_accel + current_thrust_accel,
		"ramp_alpha":     ramp_alpha,
		"phase":          phase,
	}
