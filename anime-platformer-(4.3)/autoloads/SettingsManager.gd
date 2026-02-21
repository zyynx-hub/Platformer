## SettingsManager — persistent settings via ConfigFile.
## Replaces Platformer.Settings (localStorage) from the JS build.
extends Node

const SAVE_PATH := "user://settings.cfg"

var current: Dictionary = {}

const DEFAULTS := {
	"version": 6,
	"gameplay": {
		"difficulty": "normal",
	},
	"controls": {
		"move_left": "A",
		"move_right": "D",
		"jump": "W",
		"dash": "Shift",
		"attack": "J",
		"interact": "E",
		"pause": "Escape",
	},
	"accessibility": {
		"text_size": "medium",
		"colorblind_mode": "off",
		"reduce_screen_shake": 50,
		"reduced_motion": false,
		"flash_reduction": false,
		"subtitles": true,
		"audio_cues": true,
	},
	"video": {
		"fullscreen": false,
		"resolution_scale": 100,
		"pixel_perfect": true,
		"vsync": true,
		"fps_cap": 60,
		"camera_smoothing": 35,
		"brightness": 1.0,
	},
	"audio": {
		"master": 80,
		"music": 60,
		"sfx": 85,
		"ui": 70,
		"mute_when_unfocused": false,
	},
	"convenience": {
		"auto_save": true,
		"checkpoint_frequency": "standard",
		"speedrun_mode": false,
		"intro_seen": false,
	},
	"debug": {
		"hitboxes_enabled": false,
		"player_hitbox": {"w": 9, "h": 24, "ox": 0, "oy": -3},
	},
}


func _ready() -> void:
	load_settings()


func load_settings() -> void:
	current = _deep_clone(DEFAULTS)
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		return
	for section in cfg.get_sections():
		if not current.has(section):
			current[section] = {}
		for key in cfg.get_section_keys(section):
			current[section][key] = cfg.get_value(section, key)
	# intro_seen is session-only — never persist across launches
	current["convenience"]["intro_seen"] = false


func save_settings() -> void:
	var cfg := ConfigFile.new()
	for section in current.keys():
		var block = current[section]
		if typeof(block) == TYPE_DICTIONARY:
			for key in block.keys():
				cfg.set_value(section, key, block[key])
	cfg.save(SAVE_PATH)
	EventBus.settings_changed.emit(current)


func get_value(section: String, key: String, default: Variant = null) -> Variant:
	if current.has(section) and current[section].has(key):
		return current[section][key]
	return default


func set_value(section: String, key: String, value: Variant) -> void:
	if not current.has(section):
		current[section] = {}
	current[section][key] = value


func reset() -> void:
	current = _deep_clone(DEFAULTS)
	current["convenience"]["intro_seen"] = false
	save_settings()


func text_scale() -> float:
	match get_value("accessibility", "text_size", "medium"):
		"small": return 0.9
		"large": return 1.2
	return 1.0


func get_difficulty() -> String:
	return get_value("gameplay", "difficulty", "normal")


func start_lives() -> int:
	match get_difficulty():
		"easy": return 3
		"hard": return 1
	return 2


func timer_seconds() -> int:
	match get_difficulty():
		"easy": return 120
		"hard": return 70
	return 90


func _deep_clone(obj: Variant) -> Variant:
	if typeof(obj) == TYPE_DICTIONARY:
		var out := {}
		for k in obj.keys():
			out[k] = _deep_clone(obj[k])
		return out
	if typeof(obj) == TYPE_ARRAY:
		var out: Array = []
		for v in obj:
			out.append(_deep_clone(v))
		return out
	return obj
