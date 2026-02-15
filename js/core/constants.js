window.Platformer = window.Platformer || {};

Platformer.Config = {
  GAME_WIDTH: 960,
  GAME_HEIGHT: 540,
  TILE: 32,
  WIN_COIN_TARGET: 10,
  PLAYER: {
    maxSpeed: 220,
    acceleration: 950,
    drag: 1300,
    jumpVelocity: 420,
    maxJumps: 2,
    gravity: 1100,
    coyoteTimeMs: 110,
    jumpBufferMs: 130,
    hurtInvulnMs: 900,
    dashSpeed: 460,
    dashDurationMs: 140,
    dashCooldownMs: 900,
    attackRange: 44,
    attackCooldownMs: 320,
  },
};
