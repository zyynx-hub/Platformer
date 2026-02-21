# HUD.gd
# Minimal pixel-art HUD: hearts, dash indicator, item pickup box
# Lives inside SubViewport (426x240) as a CanvasLayer so it stays screen-fixed

extends CanvasLayer

# Textures
var _heart_full: Texture2D = preload("res://assets/sprites/ui/heart_full.png")
var _heart_empty: Texture2D = preload("res://assets/sprites/ui/heart_empty.png")
var _heart_half: Texture2D = preload("res://assets/sprites/ui/heart_half.png")
var _dash_ready: Texture2D = preload("res://assets/sprites/ui/dash_icon.png")
var _dash_dim: Texture2D = preload("res://assets/sprites/ui/dash_icon_dim.png")

# Node references (from HUD.tscn)
@onready var _dash_icon: TextureRect = $HUDRoot/DashIcon
@onready var _item_frame: TextureRect = $HUDRoot/ItemFrame
@onready var _item_icon: TextureRect = $HUDRoot/ItemFrame/ItemIcon
@onready var _fuel_bar: ColorRect = $HUDRoot/ItemFrame/FuelBar
var _hearts: Array[TextureRect] = []

# State
var _prev_health: float = 3.0
const MAX_HEARTS := 3

func _ready() -> void:
	_hearts = [$HUDRoot/Heart0, $HUDRoot/Heart1, $HUDRoot/Heart2]
	_connect_signals()

func _connect_signals() -> void:
	EventBus.player_health_changed.connect(_on_health_changed)
	EventBus.dash_started.connect(_on_dash_started)
	EventBus.dash_cooldown_ended.connect(_on_dash_cooldown_ended)
	EventBus.item_picked_up.connect(_on_item_picked_up)
	EventBus.rocket_fuel_changed.connect(_on_rocket_fuel_changed)

# --- Health ---

func _on_health_changed(health: float, _max_health: float) -> void:
	for i in range(_hearts.size()):
		var threshold_full := float(i + 1)
		var threshold_half := float(i) + 0.5
		if health >= threshold_full:
			_hearts[i].texture = _heart_full
		elif health >= threshold_half:
			_hearts[i].texture = _heart_half
		else:
			_hearts[i].texture = _heart_empty

		# Flash red on hearts that just lost health
		if health < _prev_health and _prev_health >= threshold_full and health < threshold_full:
			_flash_heart(_hearts[i])

	_prev_health = health

func _flash_heart(heart: TextureRect) -> void:
	heart.modulate = Color(1.5, 0.3, 0.3, 1.0)
	var tween := create_tween()
	tween.tween_property(heart, "modulate", Color.WHITE, 0.3)

# --- Dash ---

func _on_dash_started() -> void:
	_dash_icon.texture = _dash_dim

func _on_dash_cooldown_ended() -> void:
	_dash_icon.texture = _dash_ready
	# Brief brightness flash when dash becomes available
	_dash_icon.modulate = Color(2.0, 2.0, 2.0, 1.0)
	var tween := create_tween()
	tween.tween_property(_dash_icon, "modulate", Color.WHITE, 0.3)

# --- Item pickup ---

func _on_item_picked_up(item_data: Dictionary) -> void:
	if item_data.has("icon"):
		_item_icon.texture = item_data["icon"]
		_item_icon.visible = true

	# Brighten the frame and show fuel bar
	_item_frame.modulate.a = 1.0
	_fuel_bar.visible = true

# --- Rocket fuel gauge ---

func _on_rocket_fuel_changed(fuel: float, max_fuel: float) -> void:
	var ratio := fuel / maxf(max_fuel, 0.001)
	# Resize bar: full = 16px tall, empties from top (remaining fuel sits at bottom)
	_fuel_bar.size.y = 16.0 * ratio
	_fuel_bar.position.y = 1.0 + 16.0 * (1.0 - ratio)
	# Color shift: blue when healthy, orange/red when low
	if ratio < 0.25:
		_fuel_bar.color = Color(1.0, 0.3, 0.1, 0.45)
	elif ratio < 0.5:
		_fuel_bar.color = Color(1.0, 0.65, 0.2, 0.4)
	else:
		_fuel_bar.color = Color(0.2, 0.6, 1.0, 0.35)
