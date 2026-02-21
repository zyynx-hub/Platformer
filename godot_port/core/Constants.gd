# Constants.gd
# Physics and gameplay constants for 2D platformer

class_name Constants

# ===== VERSION =====
const APP_VERSION := "0.2.5"
const ITCH_URL := "https://zyynx-hub.itch.io/platformer"
const VERSION_CHECK_URL := "https://raw.githubusercontent.com/zyynx-hub/platformerv2/main/version.json"

# ===== PHYSICS — designed for 426x240 SubViewport, 8px tiles =====
# Jump design: ~5-tile (40px) height, 0.33s to apex
const GRAVITY = 680.0              # ascent gravity
const FALL_GRAVITY = 1000.0        # descent gravity (1.47x ascent — snappy landings)
const MAX_FALL_SPEED = 360.0       # terminal velocity (normal)
const FAST_FALL_SPEED = 500.0      # terminal velocity (holding down)
const MAX_RISE_SPEED = 520.0       # rarely hit

# ===== PLAYER MOVEMENT — acceleration-based =====
const PLAYER_RUN_SPEED = 120.0     # max horizontal speed
const RUN_ACCEL = 900.0            # ground acceleration (px/s²) — max in ~0.13s
const RUN_DECEL = 800.0            # ground friction when no input — stops in ~0.15s
const TURN_ACCEL_BONUS = 0.6       # 60% extra accel when reversing direction
const AIR_ACCEL_MULT = 0.65        # air acceleration = 65% of ground
const AIR_DECEL_MULT = 0.5         # air deceleration = 50% of ground (preserve momentum)
const JUMP_H_BOOST = 25.0          # horizontal speed bonus when jumping while moving
const PLAYER_SIZE = Vector2(8, 14)

# ===== JUMP =====
const PLAYER_JUMP_FORCE = 230.0
const VAR_JUMP_TIME = 0.18         # hold jump for up to 0.18s for full height
const APEX_HANG_THRESHOLD = 20.0   # half gravity when |vel_y| < this (apex float)
const LOW_JUMP_GRAVITY_MULT = 2.5  # extra gravity when jump released early

# ===== TIMINGS =====
const COYOTE_TIME = 0.11  # seconds
const JUMP_BUFFER_TIME = 0.13  # seconds
const HURT_INVULN_TIME = 0.9  # seconds

# ===== DASH =====
const DASH_SPEED = 300.0
const DASH_DURATION = 0.14  # seconds
const DASH_COOLDOWN = 0.9  # seconds

# ===== ATTACK =====
const ATTACK_COOLDOWN = 0.32  # seconds

# ===== WALL SLIDE / WALL JUMP =====
const WALL_SLIDE_MAX_SPEED = 50.0  # max downward speed while sliding
const WALL_JUMP_H_FORCE = 160.0    # horizontal launch speed off wall (was RUN_SPEED*0.8 = 96)

# ===== ROCKET BOOTS =====
const ROCKET_THRUST = 600.0         # upward acceleration while thrusting (px/s², gravity bypassed)
const ROCKET_MAX_RISE = 180.0       # max upward speed while thrusting (px/s)
const ROCKET_FUEL_MAX = 1.5         # max fuel in seconds
const ROCKET_FUEL_DRAIN = 1.0       # fuel drained per second of thrust
const ROCKET_FUEL_REFILL = 0.6      # fuel refilled per second on ground

# ===== DEATH / RESPAWN =====
const DISSOLVE_DURATION := 0.5
const PARTICLE_FLIGHT_DURATION := 0.8
const MATERIALIZE_DURATION := 0.4
const SPAWN_MATERIALIZE_DURATION := 0.45
const SOUL_PARTICLE_COUNT := 9

# ===== CINEMATIC DIALOG =====
const DIALOG_SLOWMO_SCALE := 0.1
const DIALOG_SLOWMO_RAMP_DURATION := 0.3  # time to ramp from 1.0 to slowmo
const DIALOG_CAMERA_ZOOM := Vector2(2.0, 2.0)
const DIALOG_CAMERA_RESTORE_DURATION := 0.5
const DIALOG_OVERLAY_FADE_DURATION := 0.4
const DIALOG_BOX_SLIDE_DURATION := 0.3
const DIALOG_TEXT_SPEED := 30.0        # characters per second
const DIALOG_CONTINUE_BLINK_SPEED := 0.8  # Hz
const DIALOG_TALK_PITCH_MIN := 0.8        # pitch_scale range for talk blips
const DIALOG_TALK_PITCH_MAX := 1.4
const DIALOG_TALK_VOLUME_DB := -6.0

# ===== MUSIC DUCKING =====
const MUSIC_DUCK_CINEMATIC_DB := -18.0    # during dialog zoom-in
const MUSIC_DUCK_RESPAWN_DB := -14.0      # during respawn camera pan

# ===== PORTAL =====
const PORTAL_PULL_DURATION := 0.6
const PORTAL_ACTIVATION_DURATION := 0.8
const PORTAL_DISSOLVE_DURATION := 0.35
const PORTAL_FLASH_IN := 0.1
const PORTAL_FLASH_OUT := 0.2
const PORTAL_MUSIC_DUCK_DB := -18.0

# ===== VIEWPORT =====
const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 720
const TILE_SIZE = 32
