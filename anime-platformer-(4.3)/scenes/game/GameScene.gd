## GameScene — core gameplay loop.
## Port of js/scenes/game-scene.js.
## Spawns tiles, enemies, coins and checkpoints from the level grid,
## manages the timer, and fires EventBus signals for the HUD.
extends Node2D

const TILE_SIZE := Constants.TILE
const WIN_COINS := Constants.WIN_COIN_TARGET

# Child node refs
@onready var tile_root:       Node2D    = $TileRoot
@onready var enemy_root:      Node2D    = $EnemyRoot
@onready var coin_root:       Node2D    = $CoinRoot
@onready var checkpoint_root: Node2D    = $CheckpointRoot
@onready var player_node:     Player    = $Player
@onready var camera:          Camera2D  = $Camera2D
@onready var hud_layer:       CanvasLayer = $HUDLayer

# Preloaded scenes
const EnemyScene      := preload("res://scenes/game/Enemy.tscn")
const CoinScene       := preload("res://scenes/game/Coin.tscn")
const CheckpointScene := preload("res://scenes/game/Checkpoint.tscn")
const ProjectileScene := preload("res://scenes/game/Projectile.tscn")

# State
var map_rows: Array = []
var map_width:  int = 0
var map_height: int = 0
var level_complete: bool = false
var timer_sec: float = 0.0
var last_timer_second: int = -1
var hazard_shooters: Array = []
var projectile_timer: float = 0.0
var projectile_interval: float = 1.1
var projectile_speed: float = 230.0
var enemy_patrol_speed: float = 60.0
var hazard_damage: int = 1

# Tile bodies (static) pooled here
var solid_bodies:    Array = []
var oneway_bodies:   Array = []
var hazard_bodies:   Array = []

var _progress: ProgressManager


func _ready() -> void:
	_progress = ProgressManager.new()
	_setup_difficulty()
	_load_level()
	_build_tiles()
	_setup_player()
	_setup_camera()
	_setup_collisions()
	_connect_signals()
	AudioManager.play_music("game", 1.0)
	_emit_hud_full()


func _setup_difficulty() -> void:
	var diff := SettingsManager.get_difficulty()
	match diff:
		"easy":
			enemy_patrol_speed  = 48.0
			hazard_damage       = 1
			projectile_interval = 1.5
			projectile_speed    = 180.0
		"hard":
			enemy_patrol_speed  = 95.0
			hazard_damage       = 2
			projectile_interval = 0.85
			projectile_speed    = 270.0
		_:
			enemy_patrol_speed  = 60.0
			hazard_damage       = 1
			projectile_interval = 1.1
			projectile_speed    = 230.0
	timer_sec = float(SettingsManager.timer_seconds())


func _load_level() -> void:
	map_rows   = LevelParser.load_level(GameManager.level)
	map_height = map_rows.size()
	map_width  = map_rows[0].size() if map_height > 0 else 0


func _build_tiles() -> void:
	for y in map_height:
		for x in map_width:
			var ch: String = map_rows[y][x]
			var px: float  = x * TILE_SIZE + TILE_SIZE * 0.5
			var py: float  = y * TILE_SIZE + TILE_SIZE * 0.5

			match ch:
				"#":  _make_solid(px, py)
				"=":  _make_oneway(px, py)
				"^":  _make_hazard(px, py)
				"C":  _make_coin(px, py)
				"K":  _make_checkpoint(px, py)
				"S":  _set_spawn(px, py)
				"E", "F", "G", "H":
					_make_enemy(ch, px, py, x)


func _make_solid(px: float, py: float) -> void:
	var body := StaticBody2D.new()
	var shape := CollisionShape2D.new()
	var rect  := RectangleShape2D.new()
	rect.size  = Vector2(TILE_SIZE, TILE_SIZE)
	shape.shape = rect
	body.add_child(shape)
	body.position = Vector2(px, py)
	tile_root.add_child(body)
	solid_bodies.append(body)
	# Coloured visual
	var draw := ColorRect.new()
	draw.size     = Vector2(TILE_SIZE, TILE_SIZE)
	draw.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
	draw.color    = Color(0.2, 0.22, 0.35)
	body.add_child(draw)


func _make_oneway(px: float, py: float) -> void:
	var body  := StaticBody2D.new()
	body.set_collision_layer_value(2, true)
	var shape := CollisionShape2D.new()
	var rect  := RectangleShape2D.new()
	rect.size  = Vector2(TILE_SIZE, 3.0)
	shape.shape = rect
	body.add_child(shape)
	body.position = Vector2(px, py - TILE_SIZE * 0.3)
	tile_root.add_child(body)
	oneway_bodies.append(body)


func _make_hazard(px: float, py: float) -> void:
	var body  := StaticBody2D.new()
	var shape := CollisionShape2D.new()
	var rect  := RectangleShape2D.new()
	rect.size  = Vector2(TILE_SIZE, TILE_SIZE)
	shape.shape = rect
	body.add_child(shape)
	body.position = Vector2(px, py)
	body.set_meta("is_hazard", true)
	tile_root.add_child(body)
	hazard_bodies.append(body)
	hazard_shooters.append(body)
	var draw := ColorRect.new()
	draw.size     = Vector2(TILE_SIZE, TILE_SIZE)
	draw.position = -Vector2(TILE_SIZE, TILE_SIZE) * 0.5
	draw.color    = Color(1.0, 0.3, 0.0)
	body.add_child(draw)


func _make_coin(px: float, py: float) -> void:
	var area  := Area2D.new()
	var shape := CollisionShape2D.new()
	var circ  := CircleShape2D.new()
	circ.radius = TILE_SIZE * 0.4
	shape.shape = circ
	area.add_child(shape)
	area.position = Vector2(px, py)
	area.set_meta("is_coin", true)
	area.body_entered.connect(_on_coin_body_entered.bind(area))
	coin_root.add_child(area)
	var draw := ColorRect.new()
	draw.size     = Vector2(TILE_SIZE * 0.8, TILE_SIZE * 0.8)
	draw.position = -Vector2(TILE_SIZE * 0.4, TILE_SIZE * 0.4)
	draw.color    = Color.YELLOW
	area.add_child(draw)


func _make_checkpoint(px: float, py: float) -> void:
	var area  := Area2D.new()
	var shape := CollisionShape2D.new()
	var rect  := RectangleShape2D.new()
	rect.size  = Vector2(TILE_SIZE, TILE_SIZE * 2)
	shape.shape = rect
	area.add_child(shape)
	area.position    = Vector2(px, py)
	area.set_meta("activated", false)
	area.body_entered.connect(_on_checkpoint_body_entered.bind(area))
	checkpoint_root.add_child(area)
	var draw := ColorRect.new()
	draw.size     = Vector2(TILE_SIZE, TILE_SIZE * 2)
	draw.position = -Vector2(TILE_SIZE * 0.5, TILE_SIZE)
	draw.color    = Color(0.2, 0.8, 0.2, 0.7)
	area.add_child(draw)


func _set_spawn(px: float, py: float) -> void:
	if player_node:
		player_node.respawn_point = Vector2(px, py)
		player_node.global_position = Vector2(px, py)


func _make_enemy(enemy_type: String, px: float, py: float, grid_x: int) -> void:
	var speed_mult := {
		"E": 1.0, "F": 0.9, "G": 1.2, "H": 0.75
	}
	var enemy: Enemy = EnemyScene.instantiate()
	enemy.enemy_type    = enemy_type
	enemy.patrol_speed  = enemy_patrol_speed * speed_mult.get(enemy_type, 1.0)
	enemy.global_position = Vector2(px, py)
	# Compute bounded patrol from the grid row
	var min_x := px - 4.0 * TILE_SIZE
	var max_x := px + 4.0 * TILE_SIZE
	enemy.patrol_min_x = min_x
	enemy.patrol_max_x = max_x
	enemy.use_bounded_patrol = (max_x - min_x) >= TILE_SIZE * 2
	enemy.next_jump_at = Time.get_ticks_msec() / 1000.0 + 0.8 + grid_x * 0.003
	enemy_root.add_child(enemy)


func _setup_player() -> void:
	if player_node == null:
		return
	player_node.level_complete = false
	player_node.is_dead        = false
	# Connect death/damage
	EventBus.player_died.connect(_on_player_died)


func _setup_camera() -> void:
	if camera == null or player_node == null:
		return
	camera.enabled = true
	camera.position_smoothing_enabled = true
	var smooth_frac: float = SettingsManager.get_value("video", "camera_smoothing", 35) / 100.0
	camera.position_smoothing_speed   = lerpf(1.0, 20.0, smooth_frac)
	var world_w: float = map_width  * TILE_SIZE
	var world_h: float = map_height * TILE_SIZE
	var lim := camera.get_limit
	camera.limit_left   = 0
	camera.limit_top    = 0
	camera.limit_right  = int(world_w)
	camera.limit_bottom = int(world_h + 180)


func _setup_collisions() -> void:
	pass  # Handled by physics layers set on bodies above.


func _connect_signals() -> void:
	EventBus.hud_update_requested.connect(_emit_hud_full)


func _physics_process(delta: float) -> void:
	if level_complete:
		return
	_tick_timer(delta)
	_tick_projectiles(delta)
	_check_win()


func _tick_timer(delta: float) -> void:
	timer_sec = maxf(0.0, timer_sec - delta)
	var sec := int(timer_sec)
	if sec != last_timer_second:
		last_timer_second = sec
		EventBus.hud_timer_changed.emit(sec)
		EventBus.level_timer_tick.emit(sec)
	if timer_sec <= 0.0 and not level_complete:
		_on_time_up()


func _tick_projectiles(delta: float) -> void:
	if hazard_shooters.is_empty():
		return
	projectile_timer += delta
	if projectile_timer < projectile_interval:
		return
	projectile_timer = 0.0
	for shooter in hazard_shooters:
		if not is_instance_valid(shooter):
			continue
		if player_node == null:
			continue
		var dir: Vector2 = (player_node.global_position - shooter.global_position).normalized()
		if ProjectileScene:
			var proj = ProjectileScene.instantiate()
			add_child(proj)
			proj.global_position = shooter.global_position
			proj.velocity        = dir * projectile_speed


func _check_win() -> void:
	if GameManager.coins >= WIN_COINS:
		_complete_level()


func _complete_level() -> void:
	if level_complete:
		return
	level_complete = true
	if player_node:
		player_node.level_complete = true
	AudioManager.stop_music(0.5)
	EventBus.level_complete.emit({
		"level":  GameManager.level,
		"coins":  GameManager.coins,
		"time":   timer_sec,
		"bonus_coins": 0,
	})


func _on_time_up() -> void:
	# Time out = level failed; treat as death
	EventBus.game_over.emit()


func _on_player_died() -> void:
	await get_tree().create_timer(1.0).timeout
	if GameManager.lives > 0:
		player_node.respawn()
		GameManager.health     = 3
		EventBus.hud_health_changed.emit(GameManager.health, GameManager.max_health)
	else:
		EventBus.game_over.emit()


func _on_coin_body_entered(body: Node, area: Area2D) -> void:
	if body == player_node:
		area.queue_free()
		GameManager.collect_coin()
		EventBus.hud_coins_changed.emit(GameManager.coins, WIN_COINS)


func _on_checkpoint_body_entered(body: Node, area: Area2D) -> void:
	if body == player_node and not area.get_meta("activated", false):
		area.set_meta("activated", true)
		player_node.respawn_point = area.global_position
		EventBus.checkpoint_activated.emit(area.global_position)
		# Visual feedback
		for child in area.get_children():
			if child is ColorRect:
				child.color = Color(0.1, 1.0, 0.3, 0.9)


func _emit_hud_full() -> void:
	EventBus.hud_health_changed.emit(GameManager.health, GameManager.max_health)
	EventBus.hud_coins_changed.emit(GameManager.coins, WIN_COINS)
	EventBus.hud_timer_changed.emit(int(timer_sec))
	EventBus.jetpack_fuel_changed.emit(100.0)
	EventBus.hud_shield_changed.emit(GameManager.shield_charges)


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		EventBus.game_paused.emit()
		get_tree().paused = true
