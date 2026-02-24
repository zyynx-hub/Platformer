# SaveManager.gd
# Autoload: manages save slots — controls which file ProgressData reads/writes.
# Slot metadata stored in user://save_meta.cfg. Slot data in user://progress_slot_N.cfg.

extends Node

const MAX_SLOTS := 3
const META_PATH := "user://save_meta.cfg"

var slot_meta: Dictionary = {}  # slot_index (int) -> { last_played, level_progress, play_time }
var active_slot: int = -1


func _ready() -> void:
	# Disable auto-quit so we can save before the engine exits
	get_tree().auto_accept_quit = false
	get_tree().root.close_requested.connect(_on_window_close)

	_load_meta()
	# Migrate legacy single-file save to slot 0
	if slot_meta.is_empty() and FileAccess.file_exists("user://progress.cfg"):
		var data := FileAccess.get_file_as_bytes("user://progress.cfg")
		var f := FileAccess.open(_slot_path(0), FileAccess.WRITE)
		if f:
			f.store_buffer(data)
			f.close()
		activate_slot(0)
		var pd := ProgressData.new()
		_update_slot_meta(0, pd)
	else:
		var last := get_last_played_slot()
		if last >= 0:
			activate_slot(last)


func activate_slot(slot: int) -> void:
	active_slot = slot
	ProgressData.SAVE_PATH = _slot_path(slot)


func has_any_saves() -> bool:
	return slot_meta.size() > 0


func get_last_played_slot() -> int:
	var best_slot := -1
	var best_time := 0.0
	for slot_key in slot_meta:
		var meta: Dictionary = slot_meta[slot_key]
		var t: float = meta.get("last_played", 0.0)
		if t > best_time:
			best_time = t
			best_slot = int(slot_key)
	return best_slot


func is_slot_occupied(slot: int) -> bool:
	return slot_meta.has(slot)


func get_slot_meta(slot: int) -> Dictionary:
	return slot_meta.get(slot, {})


func create_new_save(slot: int) -> void:
	var path := _slot_path(slot)
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)
	activate_slot(slot)
	var pd := ProgressData.new()
	pd.reset_all_progress()
	_update_slot_meta(slot, pd)


func delete_slot(slot: int) -> void:
	slot_meta.erase(slot)
	_save_meta()
	var path := _slot_path(slot)
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)
	# If we deleted the active slot, deactivate
	if active_slot == slot:
		active_slot = -1
		ProgressData.SAVE_PATH = "user://progress.cfg"


func update_current_slot_meta() -> void:
	if active_slot < 0:
		return
	var pd := ProgressData.new()
	_update_slot_meta(active_slot, pd)


func _on_window_close() -> void:
	# Alt+F4 / X button — save resume state if in gameplay, then quit
	var scene = get_tree().current_scene
	if scene and scene.has_method("_save_resume_state"):
		scene._save_resume_state()
	get_tree().quit()


# --- Internal ----------------------------------------------------------------

func _slot_path(slot: int) -> String:
	return "user://progress_slot_%d.cfg" % slot


func _update_slot_meta(slot: int, pd: ProgressData) -> void:
	slot_meta[slot] = {
		"last_played": Time.get_unix_time_from_system(),
		"level_progress": pd.completed_levels.size(),
		"play_time": pd.total_play_time,
		"last_level_id": pd.last_level_id,
	}
	_save_meta()


func _load_meta() -> void:
	slot_meta.clear()
	var cfg := ConfigFile.new()
	if cfg.load(META_PATH) != OK:
		return
	for section in cfg.get_sections():
		var slot := int(section)
		slot_meta[slot] = {}
		for key in cfg.get_section_keys(section):
			slot_meta[slot][key] = cfg.get_value(section, key)


func _save_meta() -> void:
	var cfg := ConfigFile.new()
	for slot in slot_meta:
		for key in slot_meta[slot]:
			cfg.set_value(str(slot), key, slot_meta[slot][key])
	cfg.save(META_PATH)
