window.Platformer = window.Platformer || {};

Platformer.JetpackController = class {
  constructor(config, hooks) {
    const defaults = Platformer.Config.JETPACK || {};
    this.cfg = Object.assign({}, defaults, config || {});
    this.hooks = Object.assign({
      onJetpackStart: null,
      onJetpackStop: null,
    }, hooks || {});

    this.fuel = this.cfg.fuelCapacity;
    this.isThrusting = false;
    this.airborne = false;
    this.armedAfterTakeoff = false;
    this.holdTime = 0;
    this.currentAccel = 0;
    this.currentThrustAccel = 0;
    this.rampAlpha = 0;
    this.phase = "OFF";
    this.currentMaxUpSpeed = -Math.abs(this.cfg.maxUpSpeed || 150);
    this.lastDebugAt = -9999;
  }

  reset(fullFuel = true) {
    this.isThrusting = false;
    this.airborne = false;
    this.armedAfterTakeoff = false;
    this.holdTime = 0;
    this.currentAccel = 0;
    this.currentThrustAccel = 0;
    this.rampAlpha = 0;
    this.phase = "OFF";
    this.currentMaxUpSpeed = -Math.abs(this.cfg.maxUpSpeed || 150);
    if (fullFuel) this.fuel = this.cfg.fuelCapacity;
  }

  get fuelPercent() {
    if (!this.cfg.fuelCapacity) return 0;
    return Phaser.Math.Clamp((this.fuel / this.cfg.fuelCapacity) * 100, 0, 100);
  }

  canUseInState(scene) {
    if (!scene) return false;
    if (scene.isDead || scene.levelComplete || scene.isDashing) return false;
    // Guard rails for future state machines.
    if (scene.isOnLadder || scene.isClimbing) return false;
    if (scene.isInWater || scene.isSwimming) return false;
    if (scene.isWallSliding || scene.isWallClinging) return false;
    return true;
  }

  emitStart(scene) {
    if (this.hooks.onJetpackStart) this.hooks.onJetpackStart(scene, this);
    if (scene && scene.events && scene.events.emit) scene.events.emit("jetpack-start", { fuelPercent: this.fuelPercent });
  }

  emitStop(scene, reason) {
    if (this.hooks.onJetpackStop) this.hooks.onJetpackStop(scene, this, reason);
    if (scene && scene.events && scene.events.emit) scene.events.emit("jetpack-stop", { fuelPercent: this.fuelPercent, reason });
  }

  update(ctx) {
    const {
      scene,
      player,
      now,
      dt,
      grounded,
      jumpHeld,
      thrustHeld,
      worldGravity,
      jumpVelocity,
    } = ctx;

    if (!player || !player.body) {
      return { isThrusting: false, fuelPercent: this.fuelPercent, accelApplied: 0, rampAlpha: 0, phase: "OFF" };
    }

    const body = player.body;
    const prevThrust = this.isThrusting;
    const maxAccel = Math.max(0, Number(this.cfg.maxAccel || worldGravity));
    const rampUp = Math.max(0.001, Number(this.cfg.rampUpTime || 0.3));
    const rampUpRate = maxAccel / rampUp;

    if (grounded) {
      this.airborne = false;
      this.armedAfterTakeoff = false;
      this.isThrusting = false;
      this.holdTime = 0;
      this.currentAccel = 0;
      this.currentThrustAccel = 0;
      this.rampAlpha = 0;
      this.phase = "OFF";
      this.fuel = Math.min(this.cfg.fuelCapacity, this.fuel + this.cfg.regenRate * dt);
      player.setAccelerationY(0);
      body.setGravityY(0);
      if (prevThrust) this.emitStop(scene, "landed");
      return { isThrusting: false, fuelPercent: this.fuelPercent, accelApplied: 0, rampAlpha: 0, phase: this.phase };
    }

    if (!this.airborne) {
      this.airborne = true;
      // Prevent accidental thrust from same press as takeoff jump.
      this.armedAfterTakeoff = !jumpHeld;
    } else if (!this.armedAfterTakeoff && !jumpHeld) {
      this.armedAfterTakeoff = true;
    }

    const canUse = this.canUseInState(scene);
    const wantsThrust = canUse && this.armedAfterTakeoff && thrustHeld && this.fuel > 0;

    if (wantsThrust) {
      this.holdTime += dt;
      const vy = Number(body.velocity.y || 0);
      const enteringThrust = !prevThrust;
      const liftThreshold = Math.abs(Number(this.cfg.liftThresholdSpeed || 56));
      const minHoldToLift = Math.max(0, Number(this.cfg.minHoldToLift || 0.2));
      const isNearHover = vy <= liftThreshold;
      const canLift = isNearHover || this.holdTime >= minHoldToLift;
      this.phase = canLift ? "LIFT" : "BRAKE";

      const hoverAccel = worldGravity * Number(this.cfg.hoverAccelFactor || 0.95);
      const liftAccel = worldGravity * Number(this.cfg.liftAccelFactor || 1.1);
      let targetAccel = canLift ? liftAccel : hoverAccel;
      const maxThrustAccel = Math.max(0, Number(this.cfg.maxThrustAccel || maxAccel * 0.35));
      const thrustFactor = Math.max(0, Number(this.cfg.thrustAccelFactor || 0.22));
      const jumpAssistFactor = Math.max(0, Number(this.cfg.jumpAssistAccelFactor || 0.14));

      // While braking a fast fall, cap upward anti-gravity so cancellation feels weighty.
      if (!canLift && vy > 0) {
        const brakeCap = Math.max(0, Number(this.cfg.brakeDecelMax || maxAccel));
        targetAccel = Math.min(targetAccel, brakeCap);
      }

      targetAccel = Phaser.Math.Clamp(targetAccel, 0, maxAccel);
      this.currentAccel = Phaser.Math.Clamp(
        this.currentAccel + rampUpRate * dt,
        0,
        targetAccel
      );
      // Keep a dedicated thrust channel so gravity + thrust work together.
      const phaseMult = canLift ? 1.0 : 0.35;
      let targetThrustAccel = worldGravity * thrustFactor * phaseMult;
      if (vy < 0) {
        // Slight jump extension when thrusting while still rising.
        targetThrustAccel += worldGravity * jumpAssistFactor;
      }
      targetThrustAccel = Phaser.Math.Clamp(targetThrustAccel, 0, maxThrustAccel);
      this.currentThrustAccel = Phaser.Math.Clamp(
        this.currentThrustAccel + (maxThrustAccel / rampUp) * dt,
        0,
        targetThrustAccel
      );
      this.rampAlpha = maxAccel > 0 ? Phaser.Math.Clamp(this.currentAccel / maxAccel, 0, 1) : 0;
      this.isThrusting = this.currentAccel > 1;

      this.fuel = Math.max(0, this.fuel - this.cfg.drainRate * dt);
      if (enteringThrust) {
        const baseMaxUp = -Math.abs(Number(this.cfg.maxUpSpeed || 150));
        const momentumBoost = Math.max(0, Number(this.cfg.momentumBoostSpeed || 72));
        const activationKick = Math.max(0, Number(this.cfg.activationKickSpeed || 34));
        if (vy < 0) {
          // Preserve upward momentum and allow a little extra lift.
          this.currentMaxUpSpeed = Math.min(baseMaxUp, vy - momentumBoost);
          player.setVelocityY(vy - activationKick);
        } else {
          this.currentMaxUpSpeed = baseMaxUp;
        }
      }
      if (!prevThrust && this.isThrusting) this.emitStart(scene);

      player.setAccelerationY(-this.currentThrustAccel);
      // Anti-gravity offset: engine gravity (down) + this offset (up).
      body.setGravityY(-this.currentAccel);

      // Keep upward lift intentionally slow.
      const maxUp = this.currentMaxUpSpeed;
      if (body.velocity.y < maxUp) player.setVelocityY(maxUp);

      if (this.fuel <= 0) {
        this.holdTime = 0;
        this.isThrusting = false;
        this.phase = "OFF";
        this.currentAccel = 0;
        this.currentThrustAccel = 0;
        this.currentMaxUpSpeed = -Math.abs(Number(this.cfg.maxUpSpeed || 150));
        this.rampAlpha = 0;
        player.setAccelerationY(0);
        body.setGravityY(0);
        this.emitStop(scene, "fuel_empty");
      }
    } else {
      this.holdTime = 0;
      this.phase = "OFF";
      this.isThrusting = false;
      this.currentMaxUpSpeed = -Math.abs(Number(this.cfg.maxUpSpeed || 150));
      this.currentAccel = 0;
      this.currentThrustAccel = 0;
      this.rampAlpha = 0;
      player.setAccelerationY(0);
      body.setGravityY(0);
      if (prevThrust) this.emitStop(scene, canUse ? "released" : "state_blocked");
    }

    if (Platformer.DEBUG_JETPACK && Platformer.Debug && now - this.lastDebugAt > 220) {
      this.lastDebugAt = now;
      Platformer.Debug.log(
        "Jetpack.debug",
        `grounded=${grounded} fuel=${this.fuelPercent.toFixed(0)} thrust=${this.isThrusting} vy=${Math.round(body.velocity.y)} accel=${Math.round(this.currentAccel + this.currentThrustAccel)} ramp=${this.rampAlpha.toFixed(2)} phase=${this.phase} maxUp=${Math.round(this.currentMaxUpSpeed)}`
      );
    }

    return {
      isThrusting: this.isThrusting,
      fuelPercent: this.fuelPercent,
      accelApplied: this.currentAccel + this.currentThrustAccel,
      rampAlpha: this.rampAlpha,
      phase: this.phase,
    };
  }
};
