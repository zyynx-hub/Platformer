# SettingsManager.gd
# Persists audio/display settings via ConfigFile

extends Node

const SAVE_PATH := "user://settings.cfg"

var current: Dictionary = {}

const DEFAULTS := {
	"audio": {
		"master": 80,
		"music": 60,
		"sfx": 85,
	},
	"display": {
		"fullscreen": false,
		"vsync": true,
	},
}

func _ready() -> void:
	load_settings()
	apply_display_settings()

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

func reset_to_defaults() -> void:
	current = _deep_clone(DEFAULTS)
	save_settings()
	apply_display_settings()

func apply_display_settings() -> void:
	var fs: bool = get_value("display", "fullscreen", false)
	DisplayServer.window_set_mode(
		DisplayServer.WINDOW_MODE_FULLSCREEN if fs else DisplayServer.WINDOW_MODE_WINDOWED
	)
	var vs: bool = get_value("display", "vsync", true)
	DisplayServer.window_set_vsync_mode(
		DisplayServer.VSYNC_ENABLED if vs else DisplayServer.VSYNC_DISABLED
	)

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
