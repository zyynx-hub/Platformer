window.Platformer = window.Platformer || {};

Platformer.PlayerMapController = class PlayerMapController {
  constructor(scene, sprite, bounds, blockedRegions) {
    this.scene = scene;
    this.sprite = sprite;
    this.bounds = bounds;
    this.blockedRegions = blockedRegions || [];
    this.velocity = new Phaser.Math.Vector2(0, 0);
    this.maxSpeed = 220;
    this.accel = 980;
    this.drag = 1100;
  }

  isBlocked(nextX, nextY) {
    return this.blockedRegions.some((r) => {
      return nextX >= r.x && nextX <= (r.x + r.width) && nextY >= r.y && nextY <= (r.y + r.height);
    });
  }

  update(input, deltaMs) {
    const dt = Math.max(0.001, deltaMs / 1000);
    const dir = new Phaser.Math.Vector2(
      (input.left ? -1 : 0) + (input.right ? 1 : 0),
      (input.up ? -1 : 0) + (input.down ? 1 : 0)
    );
    if (dir.lengthSq() > 0) dir.normalize();

    const targetVX = dir.x * this.maxSpeed;
    const targetVY = dir.y * this.maxSpeed;

    this.velocity.x = Phaser.Math.Linear(this.velocity.x, targetVX, Phaser.Math.Clamp(this.accel * dt / this.maxSpeed, 0, 1));
    this.velocity.y = Phaser.Math.Linear(this.velocity.y, targetVY, Phaser.Math.Clamp(this.accel * dt / this.maxSpeed, 0, 1));

    if (dir.lengthSq() === 0) {
      const dragStep = this.drag * dt;
      this.velocity.x = Math.abs(this.velocity.x) <= dragStep ? 0 : this.velocity.x - Math.sign(this.velocity.x) * dragStep;
      this.velocity.y = Math.abs(this.velocity.y) <= dragStep ? 0 : this.velocity.y - Math.sign(this.velocity.y) * dragStep;
    }

    let nx = this.sprite.x + this.velocity.x * dt;
    let ny = this.sprite.y + this.velocity.y * dt;

    nx = Phaser.Math.Clamp(nx, this.bounds.x + 14, this.bounds.x + this.bounds.width - 14);
    ny = Phaser.Math.Clamp(ny, this.bounds.y + 14, this.bounds.y + this.bounds.height - 14);

    if (!this.isBlocked(nx, this.sprite.y)) {
      this.sprite.x = nx;
    } else {
      this.velocity.x = 0;
    }
    if (!this.isBlocked(this.sprite.x, ny)) {
      this.sprite.y = ny;
    } else {
      this.velocity.y = 0;
    }

    if (Math.abs(this.velocity.x) > 8) {
      this.sprite.setFlipX(this.velocity.x < 0);
    }

    return {
      speed: this.velocity.length(),
      moving: Math.abs(this.velocity.x) > 8 || Math.abs(this.velocity.y) > 8,
    };
  }
};