@tool
# MenuScene.gd
# Main menu with night sky aesthetic — animated entrance, firefly particles, shaders

extends Control

# --- Node references (unique names set in editor) ---
@onready var title_label = %TitleLabel if has_node("%TitleLabel") else null
@onready var start_button = %StartButton if has_node("%StartButton") else null
@onready var options_button = %OptionsButton if has_node("%OptionsButton") else null
@onready var extras_button = %ExtrasButton if has_node("%ExtrasButton") else null
@onready var quit_button = %QuitButton if has_node("%QuitButton") else null
@onready var particles = $GPUParticles2D if has_node("GPUParticles2D") else null
@onready var player_sil = %PlayerSilhouette if has_node("%PlayerSilhouette") else null
@onready var _version_label: Label = %VersionLabel if has_node("%VersionLabel") else null
@onready var _update_label: Label = %UpdateLabel if has_node("%UpdateLabel") else null

# --- Entrance animation ---
const TITLE_SLIDE_DURATION := 0.5
const TITLE_FADE_DURATION := 0.35
const TITLE_OFFSCREEN_X := -500.0
const BUTTON_STAGGER_DELAY := 0.1
const BUTTON_SLIDE_DURATION := 0.35
const BUTTON_OFFSCREEN_X := -350.0  # slide from left

# --- Focus effects ---
const FOCUS_SCALE := Vector2(1.08, 1.08)
const FOCUS_SLIDE_X := 8.0
const FOCUS_ANIM_DURATION := 0.15

# --- Title breathing ---
const TITLE_BREATHE_MAX := 1.02
const TITLE_BREATHE_DURATION := 2.5

# --- Button idle pulse ---
const BUTTON_PULSE_LO := 0.82
const BUTTON_PULSE_HI := 1.0
const BUTTON_PULSE_DURATION := 1.2

# --- State ---
var _buttons: Array[Button] = []
var _button_origins: Dictionary = {}
var _focus_tweens: Dictionary = {}
var _intro_done := false
var _title_breathe_tween: Tween = null
var _button_pulse_tween: Tween = null
var _focused_button: Button = null
var _update_url := ""

# Skip intro animation on return from sub-menus
static var _has_visited := false


func _ready() -> void:
	# Collect valid buttons
	_buttons.clear()
	for btn in [start_button, options_button, extras_button, quit_button]:
		if btn:
			_buttons.append(btn)

	# Player idle animation (visual — runs in both editor and runtime)
	_start_player_idle()

	# Editor preview stops here — no gameplay logic in the editor
	if Engine.is_editor_hint():
		return

	# --- Runtime only below ---

	# Connect button signals
	if start_button:
		start_button.pressed.connect(_on_start_pressed)
	if options_button:
		options_button.pressed.connect(_on_options_pressed)
	if extras_button:
		extras_button.pressed.connect(_on_extras_pressed)
	if quit_button:
		quit_button.pressed.connect(_on_quit_pressed)

	# Connect hover/focus for all buttons
	for btn in _buttons:
		btn.focus_entered.connect(_on_button_focus_entered.bind(btn))
		btn.focus_exited.connect(_on_button_focus_exited.bind(btn))
		btn.mouse_entered.connect(_on_button_mouse_entered.bind(btn))

	# Reconfigure particles for runtime
	_setup_particles()

	# Dragon fly-by (global autoload — persists across menu scenes)
	DragonFlyby.attach_to_scene(self, title_label)

	# Version update indicator
	_setup_update_indicator()

	# Start menu music
	EventBus.music_play.emit("menu")

	if _has_visited:
		# Return from sub-menu: skip animation, enable everything immediately
		_intro_done = true
		for btn in _buttons:
			_button_origins[btn] = Vector2(btn.position.x, btn.position.y)
		if _buttons.size() > 0:
			_buttons[0].grab_focus()
		_start_title_breathe()
		SceneTransition.fade_from_black(0.4)
	else:
		# First visit: full entrance animation with per-button unlocking
		_has_visited = true
		for btn in _buttons:
			btn.focus_mode = Control.FOCUS_NONE
		_play_entrance_animation()
		SceneTransition.fade_from_black(0.5)


# --- Visual Setup -------------------------------------------------------------

func _setup_particles() -> void:
	if not particles:
		return
	# Firefly particles — blue-white motes drifting upward
	var mat := ParticleProcessMaterial.new()
	mat.particle_flag_disable_z = true
	mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	mat.emission_box_extents = Vector3(640, 360, 1)
	mat.direction = Vector3(0, -1, 0)
	mat.initial_velocity_min = 8.0
	mat.initial_velocity_max = 20.0
	mat.gravity = Vector3(0, -15, 0)
	mat.spread = 90.0
	mat.angular_velocity_min = -10.0
	mat.angular_velocity_max = 10.0
	mat.scale_min = 0.5
	mat.scale_max = 1.5
	mat.color = Color(0.6, 0.7, 1.0, 0.4)

	var gradient := Gradient.new()
	gradient.colors = PackedColorArray([
		Color(0.4, 0.5, 0.9, 0),
		Color(0.6, 0.7, 1.0, 0.8),
		Color(0.7, 0.8, 1.0, 0.6),
		Color(0.5, 0.6, 0.9, 0),
	])
	gradient.offsets = PackedFloat32Array([0.0, 0.15, 0.7, 1.0])
	var color_ramp := GradientTexture1D.new()
	color_ramp.gradient = gradient
	mat.color_ramp = color_ramp

	particles.process_material = mat
	particles.amount = 40
	particles.lifetime = 5.0
	particles.visibility_rect = Rect2(-640, -360, 1280, 720)


func _start_player_idle() -> void:
	if not player_sil:
		return
	# Build SpriteFrames with the idle animation from the strip sheet
	var sf := SpriteFrames.new()
	sf.remove_animation("default")
	sf.add_animation("idle")
	sf.set_animation_speed("idle", 8.0)
	sf.set_animation_loop("idle", true)

	var texture := load("res://player/sprites/Owlet_Monster_Idle_4.png")
	var fw: int = texture.get_width() / 4
	var fh: int = texture.get_height()
	for i in range(4):
		var atlas := AtlasTexture.new()
		atlas.atlas = texture
		atlas.region = Rect2(i * fw, 0, fw, fh)
		sf.add_frame("idle", atlas)

	player_sil.sprite_frames = sf
	player_sil.play("idle")


# --- Entrance Animation -------------------------------------------------------

func _play_entrance_animation() -> void:
	var tween := create_tween()

	# Title: slide in from off-screen left with bounce
	if title_label:
		title_label.pivot_offset = title_label.size / 2.0
		var target_x: float = title_label.offset_left
		title_label.offset_left = TITLE_OFFSCREEN_X
		title_label.modulate.a = 0.0
		tween.tween_property(title_label, "offset_left", target_x, TITLE_SLIDE_DURATION) \
			.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
		tween.parallel().tween_property(title_label, "modulate:a", 1.0, TITLE_FADE_DURATION)

	# Buttons: cascading slide from off-screen left with bounce
	tween.tween_interval(0.1)
	for i in range(_buttons.size()):
		var btn := _buttons[i]
		btn.pivot_offset = btn.size / 2.0
		var target_x: float = btn.position.x
		_button_origins[btn] = Vector2(target_x, btn.position.y)
		btn.position.x = BUTTON_OFFSCREEN_X
		btn.modulate.a = 0.0
		var delay := i * BUTTON_STAGGER_DELAY
		tween.parallel().tween_property(btn, "position:x", target_x, BUTTON_SLIDE_DURATION) \
			.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK).set_delay(delay)
		tween.parallel().tween_property(btn, "modulate:a", 1.0, BUTTON_SLIDE_DURATION * 0.6) \
			.set_delay(delay)
		# Enable this button as soon as its slide-in completes
		tween.parallel().tween_callback(_enable_single_button.bind(btn, i == 0)) \
			.set_delay(delay + BUTTON_SLIDE_DURATION)

	# Start ambient effects after all buttons are done
	tween.tween_callback(_start_title_breathe)


## Unlock one button after its slide-in. The first button also enables interaction and grabs focus.
func _enable_single_button(btn: Button, is_first: bool) -> void:
	btn.focus_mode = Control.FOCUS_ALL
	if is_first:
		_intro_done = true
		btn.grab_focus()


# --- Title Breathing Effect ---------------------------------------------------

func _start_title_breathe() -> void:
	if not title_label:
		return
	title_label.pivot_offset = title_label.size / 2.0
	_title_breathe_loop()


func _title_breathe_loop() -> void:
	if not title_label or not is_instance_valid(title_label):
		return
	if _title_breathe_tween:
		_title_breathe_tween.kill()
	_title_breathe_tween = create_tween()
	_title_breathe_tween.tween_property(title_label, "scale", Vector2(TITLE_BREATHE_MAX, TITLE_BREATHE_MAX), TITLE_BREATHE_DURATION) \
		.set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	_title_breathe_tween.tween_property(title_label, "scale", Vector2.ONE, TITLE_BREATHE_DURATION) \
		.set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	_title_breathe_tween.tween_callback(_title_breathe_loop)


# --- Button Focus Effects -----------------------------------------------------

func _on_button_mouse_entered(btn: Button) -> void:
	if _intro_done:
		btn.grab_focus()


func _on_button_focus_entered(btn: Button) -> void:
	if not _intro_done:
		return
	EventBus.sfx_play.emit("ui_tick", 0.0)
	_focused_button = btn

	if _focus_tweens.has(btn):
		_focus_tweens[btn].kill()

	var origin: Vector2 = _button_origins.get(btn, btn.position)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(btn, "scale", FOCUS_SCALE, FOCUS_ANIM_DURATION) \
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tw.tween_property(btn, "position:x", origin.x + FOCUS_SLIDE_X, FOCUS_ANIM_DURATION) \
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	_focus_tweens[btn] = tw

	_start_button_pulse(btn)


func _on_button_focus_exited(btn: Button) -> void:
	if _focus_tweens.has(btn):
		_focus_tweens[btn].kill()

	if _focused_button == btn:
		_stop_button_pulse(btn)
		_focused_button = null

	var origin: Vector2 = _button_origins.get(btn, btn.position)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(btn, "scale", Vector2.ONE, FOCUS_ANIM_DURATION) \
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tw.tween_property(btn, "position:x", origin.x, FOCUS_ANIM_DURATION) \
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tw.tween_property(btn, "modulate:a", 1.0, FOCUS_ANIM_DURATION)
	_focus_tweens[btn] = tw


# --- Button Idle Pulse --------------------------------------------------------

func _start_button_pulse(btn: Button) -> void:
	_stop_button_pulse(btn)
	_button_pulse_tween = create_tween().set_loops()
	_button_pulse_tween.tween_property(
		btn, "modulate:a", BUTTON_PULSE_LO, BUTTON_PULSE_DURATION
	).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	_button_pulse_tween.tween_property(
		btn, "modulate:a", BUTTON_PULSE_HI, BUTTON_PULSE_DURATION
	).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)


func _stop_button_pulse(btn: Button) -> void:
	if _button_pulse_tween:
		_button_pulse_tween.kill()
		_button_pulse_tween = null
	btn.modulate.a = 1.0


# --- Button Actions -----------------------------------------------------------

func _on_start_pressed() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	SceneTransition.transition_to("res://ui/menus/LevelSelectScene.tscn")


func _on_options_pressed() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	SceneTransition.transition_to("res://ui/menus/OptionsScene.tscn")


func _on_extras_pressed() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	SceneTransition.transition_to("res://ui/menus/ExtrasScene.tscn")


func _on_quit_pressed() -> void:
	EventBus.sfx_play.emit("ui_confirm", 0.0)
	get_tree().quit()


# --- Update Indicator ---------------------------------------------------------

func _setup_update_indicator() -> void:
	# Version label text (node defined in MenuScene.tscn)
	if _version_label:
		_version_label.text = "v%s" % Constants.APP_VERSION

	# Update label signals (node defined in MenuScene.tscn, hidden by default)
	if _update_label:
		_update_label.gui_input.connect(_on_update_label_input)
	EventBus.update_available.connect(_on_update_available)

	# Check if update was already detected before this scene loaded
	if VersionChecker.has_update:
		_on_update_available(VersionChecker.latest_version, VersionChecker.latest_url, VersionChecker.latest_message)


func _on_update_available(version: String, url: String, message: String) -> void:
	_update_url = url
	if not _update_label or not is_instance_valid(_update_label):
		return
	var text := "Update Available (v%s)" % version
	if not message.is_empty():
		text += " — %s" % message
	_update_label.text = text
	_update_label.visible = true
	_update_label.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(_update_label, "modulate:a", 1.0, 0.8)


func _on_update_label_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if not _update_url.is_empty():
			OS.shell_open(_update_url)
