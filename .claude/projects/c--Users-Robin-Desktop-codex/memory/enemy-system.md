# Enemy System

## Architecture

- **Base**: `enemies/Enemy.tscn` — CharacterBody2D with EnemyStateMachine, hitbox/hurtbox Area2D, hit flash shader
- **States**: EnemyStateMachine (Idle → Patrol → Chase → Hurt → Dead), GDQuest pattern mirroring player
- **Subclassing**: Inherit Enemy.tscn, override exports in Inspector (health, speed, damage)
- **First enemy**: Slime (`enemies/slime/Slime.tscn`) — squash-stretch bob tween

## Collision Layers

| Layer | Bit | Name |
|-------|-----|------|
| 1 | 1 | World |
| 2 | 2 | Player |
| 3 | 4 | Enemy |
| 4 | 8 | PlayerAttack |
| 5 | 16 | EnemyAttack |

**Enemy body**: collision_layer=4 (Enemy only, NOT World — or player stands on enemy), collision_mask=1 (collides with World)
**Hurtbox**: layer=4, mask=8 (detects PlayerAttack)
**Hitbox**: layer=16, mask=2 (detects Player body)
**PlayerDetector**: layer=0, mask=2 (detects Player)

### Critical: Enemy must NOT be on World layer
If Enemy collision_layer includes bit 1 (World), the player's CharacterBody2D treats the enemy as solid ground. Player will stand on enemy head and "glide" with it. Fixed in Session 57 by setting collision_layer=4 (Enemy only).

## Combat: Stomp-to-Kill

Replaced melee (AttackState + AttackHitbox) and ranged (Projectile) attacks in Session 57.

### Detection (continuous, not signal-based)
`body_entered` signal only fires once on initial overlap — unreliable for stomp detection where the player is already overlapping. Instead, `_check_player_contact()` runs every `_physics_process` frame using `_hitbox.get_overlapping_bodies()` with a cooldown timer.

### Stomp Conditions
```
player.velocity_y > 0.0                           # player is falling
player.global_position.y < enemy.global_position.y - 4.0  # player feet above enemy upper half
```

### On Stomp
1. `enemy.take_damage(Constants.STOMP_DAMAGE)` — NO from_position (no knockback, prevents ground phasing)
2. `player.stomp_bounce()` — sets velocity_y = -STOMP_BOUNCE_FORCE, enables apex hang, stretch visual

### On Side Contact
- `player.take_damage(contact_damage)` — standard player hurt

### Constants
- `STOMP_DAMAGE = 1.0` (2 stomps kill default slime with max_health=2)
- `STOMP_BOUNCE_FORCE = 200.0` (upward velocity after stomp)

### Cooldowns
- 0.3s after stomp (prevents double-hit)
- 0.5s after contact damage (prevents rapid player damage)

## Hit Flash
- `hit_flash.gdshader` with `flash_amount` parameter
- ShaderMaterial is `resource_local_to_scene = true` (each enemy instance has own material)
- Tween flash_amount from 1.0 → 0.0 over 0.15s on hit

## Death
- Disable collision shapes + hurtbox/hitbox monitoring
- Flash white, fade modulate.a to 0 over 0.4s, queue_free
- Emits `EventBus.enemy_killed`

## Known Bugs
- **Enemy phasing through ground**: During stomp+contact-damage overlap, enemy can clip through floor. Stomp no longer applies knockback (fixed), but the bug may still occur in edge cases.

## Deleted Files (Session 57)
- `player/states/AttackState.gd` — melee attack state
- `player/AttackHitbox.gd` — melee hitbox area
- `player/Projectile.tscn` / `player/Projectile.gd` — ranged projectile

## GDScript Lessons
- `sign()` returns Variant in Godot 4 — use `var dir: float = sign(...)` not `:=`
- Base class vars must be typed for subclass method calls to resolve (EnemyState.enemy: Enemy)
- `monitorable` on Area2D must match `monitoring` — if one is off, other Area2Ds can't detect it
