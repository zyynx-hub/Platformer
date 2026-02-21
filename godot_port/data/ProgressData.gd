# ProgressData.gd
# Game progress: stats, achievements, gallery unlocks
# RefCounted — instantiated on demand, not an autoload

class_name ProgressData
extends RefCounted

const SAVE_PATH := "user://progress.cfg"

# Stats
var total_play_time: float = 0.0
var total_deaths: int = 0
var levels_completed: int = 0
var collectibles_found: int = 0
var total_jumps: int = 0
var total_dashes: int = 0

# Achievements: { id -> unlocked }
var achievements: Dictionary = {}

# Gallery: unlocked image keys
var gallery_unlocked: Array[String] = []

# Per-level completion tracking
var completed_levels: Array[String] = []

# Seen dialog IDs (one-shot triggers don't replay)
var seen_dialogs: Array[String] = []

# Quest state flags
var quest_states: Dictionary = {}

func _init() -> void:
	_init_achievements()
	load_progress()

func _init_achievements() -> void:
	for def in AchievementDefs.ALL:
		if not achievements.has(def["id"]):
			achievements[def["id"]] = false

func load_progress() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		return
	total_play_time = cfg.get_value("stats", "play_time", 0.0)
	total_deaths = cfg.get_value("stats", "deaths", 0)
	levels_completed = cfg.get_value("stats", "levels_completed", 0)
	collectibles_found = cfg.get_value("stats", "collectibles_found", 0)
	total_jumps = cfg.get_value("stats", "jumps", 0)
	total_dashes = cfg.get_value("stats", "dashes", 0)
	if cfg.has_section("achievements"):
		for key in cfg.get_section_keys("achievements"):
			achievements[key] = cfg.get_value("achievements", key, false)
	gallery_unlocked = cfg.get_value("gallery", "unlocked", [] as Array[String])
	completed_levels = cfg.get_value("levels", "completed", [] as Array[String])
	levels_completed = completed_levels.size()
	seen_dialogs = cfg.get_value("dialogs", "seen", [] as Array[String])
	if cfg.has_section("quests"):
		for key in cfg.get_section_keys("quests"):
			quest_states[key] = cfg.get_value("quests", key, false)

func save_progress() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("stats", "play_time", total_play_time)
	cfg.set_value("stats", "deaths", total_deaths)
	cfg.set_value("stats", "levels_completed", levels_completed)
	cfg.set_value("stats", "collectibles_found", collectibles_found)
	cfg.set_value("stats", "jumps", total_jumps)
	cfg.set_value("stats", "dashes", total_dashes)
	for id in achievements.keys():
		cfg.set_value("achievements", id, achievements[id])
	cfg.set_value("gallery", "unlocked", gallery_unlocked)
	cfg.set_value("levels", "completed", completed_levels)
	cfg.set_value("dialogs", "seen", seen_dialogs)
	for key in quest_states:
		cfg.set_value("quests", key, quest_states[key])
	cfg.save(SAVE_PATH)

func unlock_achievement(id: String) -> bool:
	if achievements.has(id) and not achievements[id]:
		achievements[id] = true
		save_progress()
		EventBus.achievement_unlocked.emit(id)
		return true
	return false

func is_achievement_unlocked(id: String) -> bool:
	return achievements.get(id, false)

func unlock_gallery_item(key: String) -> void:
	if key not in gallery_unlocked:
		gallery_unlocked.append(key)
		save_progress()

func is_level_completed(id: String) -> bool:
	return id in completed_levels

func complete_level(id: String) -> void:
	if id not in completed_levels:
		completed_levels.append(id)
		levels_completed = completed_levels.size()
		save_progress()

func is_dialog_seen(dialog_id: String) -> bool:
	return dialog_id in seen_dialogs

func mark_dialog_seen(dialog_id: String) -> void:
	if dialog_id not in seen_dialogs:
		seen_dialogs.append(dialog_id)
		save_progress()

func increment_stat(key: String, amount: Variant = 1) -> void:
	match key:
		"deaths": total_deaths += amount
		"levels_completed": levels_completed += amount
		"collectibles_found": collectibles_found += amount
		"jumps": total_jumps += amount
		"dashes": total_dashes += amount

func get_quest(key: String, default: bool = false) -> bool:
	return quest_states.get(key, default)

func set_quest(key: String, value: bool = true) -> void:
	quest_states[key] = value
	save_progress()
	EventBus.quest_state_changed.emit(key, value)

func reset_all_progress() -> void:
	total_play_time = 0.0
	total_deaths = 0
	levels_completed = 0
	collectibles_found = 0
	total_jumps = 0
	total_dashes = 0
	achievements.clear()
	_init_achievements()
	gallery_unlocked.clear()
	completed_levels.clear()
	seen_dialogs.clear()
	quest_states.clear()
	save_progress()
