## HUD — in-game heads-up display.
## Lives in a CanvasLayer so it's always on top of the game world.
extends Control

@onready var health_bar:       ProgressBar = $HealthBar
@onready var coin_label:       Label       = $CoinLabel
@onready var timer_label:      Label       = $TimerLabel
@onready var jetpack_bar:      ProgressBar = $JetpackBar
@onready var dash_cd_bar:      ProgressBar = $DashCdBar
@onready var shield_label:     Label       = $ShieldLabel
@onready var pause_menu:       Control     = $PauseMenu


func _ready() -> void:
	EventBus.hud_health_changed.connect(_on_health_changed)
	EventBus.hud_coins_changed.connect(_on_coins_changed)
	EventBus.hud_timer_changed.connect(_on_timer_changed)
	EventBus.jetpack_fuel_changed.connect(_on_jetpack_fuel)
	EventBus.hud_dash_cooldown.connect(_on_dash_cd)
	EventBus.hud_shield_changed.connect(_on_shield_changed)
	EventBus.game_paused.connect(_on_pause)
	EventBus.game_resumed.connect(_on_resume)
	if pause_menu:
		pause_menu.hide()


func _on_health_changed(hp: int, max_hp: int) -> void:
	if health_bar:
		health_bar.max_value = max_hp
		health_bar.value     = hp


func _on_coins_changed(coins: int, target: int) -> void:
	if coin_label:
		coin_label.text = "%d / %d" % [coins, target]


func _on_timer_changed(seconds: int) -> void:
	if timer_label:
		var m := seconds / 60
		var s := seconds % 60
		timer_label.text = "%d:%02d" % [m, s]
		if seconds <= 15:
			timer_label.modulate = Color.RED
		elif seconds <= 30:
			timer_label.modulate = Color.YELLOW
		else:
			timer_label.modulate = Color.WHITE


func _on_jetpack_fuel(percent: float) -> void:
	if jetpack_bar:
		jetpack_bar.value = percent


func _on_dash_cd(fraction: float) -> void:
	if dash_cd_bar:
		dash_cd_bar.value = fraction * 100.0


func _on_shield_changed(charges: int) -> void:
	if shield_label:
		shield_label.text = "Shield: %d" % charges


func _on_pause() -> void:
	if pause_menu:
		pause_menu.show()


func _on_resume() -> void:
	if pause_menu:
		pause_menu.hide()
