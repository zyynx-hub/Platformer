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
@onready var _boss_bar: Control = $HUDRoot/BossHealthBar
@onready var _boss_bar_fill: ColorRect = $HUDRoot/BossHealthBar/BarFill
@onready var _boss_phase_label: Label = $HUDRoot/BossHealthBar/PhaseLabel
var _hearts: Array[TextureRect] = []

# State
var _prev_health: float = 3.0
const MAX_HEARTS := 3

# Boss health bar state
var _boss_max_health: float = 5.0
var _boss_current_phase: int = 1
const BOSS_BAR_FILL_MAX: float = 100.0  # inner fill width in px
const PHASE_COLORS := {
	1: Color(0.3, 0.9, 0.3, 1),
	2: Color(1.0, 0.7, 0.2, 1),
	3: Color(1.0, 0.3, 0.5, 1),
}

func _ready() -> void:
	_hearts = [$HUDRoot/Heart0, $HUDRoot/Heart1, $HUDRoot/Heart2]
	_connect_signals()
	_restore_equipped_item()

func _connect_signals() -> void:
	EventBus.player_health_changed.connect(_on_health_changed)
	EventBus.dash_started.connect(_on_dash_started)
	EventBus.dash_cooldown_ended.connect(_on_dash_cooldown_ended)
	EventBus.item_picked_up.connect(_on_item_picked_up)
	EventBus.rocket_fuel_changed.connect(_on_rocket_fuel_changed)
	EventBus.boss_fight_started.connect(_on_boss_fight_started)
	EventBus.boss_health_changed.connect(_on_boss_health_changed)
	EventBus.boss_phase_changed.connect(_on_boss_phase_changed)
	EventBus.boss_fight_ended.connect(_on_boss_fight_ended)

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

func _restore_equipped_item() -> void:
	var pd := ProgressData.new()
	if pd.equipped_item.is_empty():
		return
	var item_def := ItemDefs.get_item(pd.equipped_item)
	if item_def.is_empty():
		return
	_item_icon.texture = load(item_def["icon_path"])
	_item_icon.visible = true
	_item_frame.modulate.a = 1.0
	_fuel_bar.visible = (pd.equipped_item == "rocket_boots")

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

# --- Boss Health Bar ---

func _on_boss_fight_started(boss_max_hp: float) -> void:
	_boss_max_health = boss_max_hp
	_boss_current_phase = 1
	_boss_bar_fill.offset_right = 1.0 + BOSS_BAR_FILL_MAX
	_boss_bar_fill.color = PHASE_COLORS[1]
	_boss_phase_label.text = "PHASE 1"
	_boss_bar.modulate.a = 1.0
	_boss_bar.visible = true


func _on_boss_health_changed(hp: float, max_hp: float) -> void:
	_boss_max_health = max_hp
	var ratio := clampf(hp / maxf(max_hp, 0.001), 0.0, 1.0)
	_boss_bar_fill.offset_right = 1.0 + BOSS_BAR_FILL_MAX * ratio
	# Flash white on damage then return to phase color
	_boss_bar_fill.color = Color.WHITE
	var tw := _boss_bar_fill.create_tween()
	tw.tween_property(_boss_bar_fill, "color", _get_phase_color(), 0.2)


func _on_boss_phase_changed(phase: int) -> void:
	_boss_current_phase = phase
	_boss_phase_label.text = "PHASE " + str(phase)
	_boss_bar_fill.color = _get_phase_color()


func _on_boss_fight_ended() -> void:
	var tw := create_tween()
	tw.tween_property(_boss_bar, "modulate:a", 0.0, 0.8)
	tw.tween_callback(_boss_bar.set.bind("visible", false))


func _get_phase_color() -> Color:
	if PHASE_COLORS.has(_boss_current_phase):
		return PHASE_COLORS[_boss_current_phase]
	return Color.WHITE
