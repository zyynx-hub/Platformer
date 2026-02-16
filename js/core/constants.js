window.Platformer = window.Platformer || {};

Platformer.Config = {
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,
  TILE: 8,
  WIN_COIN_TARGET: 10,
  PLAYER: {
    maxSpeed: 164,
    acceleration: 1080,
    drag: 3200,
    jumpVelocity: 420,
    maxJumps: 1,
    gravity: 1100,
    coyoteTimeMs: 110,
    jumpBufferMs: 130,
    hurtInvulnMs: 900,
    dashSpeed: 460,
    dashDurationMs: 140,
    dashCooldownMs: 900,
    attackRange: 44,
    attackCooldownMs: 320,
    // Hard safety clamps for vertical velocity to avoid physics spikes.
    maxRiseSpeed: 520,
    maxFallSpeed: 760,
  },
  JETPACK: {
    // Fuel pool in seconds of continuous use.
    fuelCapacity: 1.25,
    // Fuel seconds consumed per second while thrusting.
    drainRate: 1.0,
    // Fuel seconds regenerated per second while grounded.
    regenRate: 0.72,
    // Gravity-like control knobs.
    hoverAccelFactor: 0.95,
    liftAccelFactor: 1.34,
    // Extra upward thrust acceleration (in addition to anti-gravity).
    thrustAccelFactor: 0.52,
    // Small extra assist while still moving upward after jump.
    jumpAssistAccelFactor: 0.34,
    rampUpTime: 0.16,
    rampDownTime: 0.22,
    minHoldToLift: 0.2,
    liftThresholdSpeed: 56,
    // Keep ascent intentionally slow vs jump.
    maxUpSpeed: 220,
    // Preserve/extend existing upward momentum when jetpack is activated mid-air.
    momentumBoostSpeed: 72,
    activationKickSpeed: 34,
    // Safety caps.
    maxAccel: 1320,
    maxThrustAccel: 1300,
    brakeDecelMax: 760,
  },
};

/*
How to tune gravity-like jetpack:
- hoverAccelFactor: 0.90-1.05. Near 1.0 feels like hover / soft fall braking.
- liftAccelFactor: 1.05-1.25. Slightly above 1 for gentle upward climb.
- thrustAccelFactor: 0.12-0.35 for extra upward push while held.
- jumpAssistAccelFactor: 0.08-0.22 to slightly extend jump when thrust starts mid-air.
- rampUpTime: 0.25-0.60 for smoother spool-up.
- rampDownTime: 0.15-0.40 for natural release dropoff.
- minHoldToLift: 0.15-0.30 to require commitment before ascent.
- liftThresholdSpeed: 30-80 so lift can start once fall is mostly canceled.
- maxUpSpeed: keep low (about 20-40% of jump velocity).
- momentumBoostSpeed / activationKickSpeed: increase for stronger mid-air activation momentum.
- maxAccel / maxThrustAccel / brakeDecelMax: lower values feel heavier and less snappy.
*/

// Keeps legacy world map available for fallback/debug.
Platformer.DEBUG_WORLD_MAP = false;
Platformer.DEBUG_JETPACK = false;
