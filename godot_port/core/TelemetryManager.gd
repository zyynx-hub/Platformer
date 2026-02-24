# TelemetryManager.gd
# Autoload: anonymous event telemetry — buffers events, batch-sends to Supabase.
# Silent on failure. Respects SettingsManager opt-out. Works offline.

extends Node

const TELEMETRY_CFG_PATH := "user://telemetry.cfg"

var _player_id: String = ""
var _session_id: String = ""
var _buffer: Array[Dictionary] = []
var _http: HTTPRequest = null
var _send_timer: float = 0.0
var _sending: bool = false

var _current_level_id: String = ""
var _session_deaths: Dictionary = {}  # level_id -> int


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_or_create_player_id()
	_session_id = _generate_uuid()

	_http = HTTPRequest.new()
	_http.timeout = 8.0
	_http.request_completed.connect(_on_request_completed)
	add_child(_http)

	_connect_signals()
	track("session_start")


func _physics_process(delta: float) -> void:
	if not _is_enabled():
		return
	_send_timer += delta
	if _send_timer >= Constants.TELEMETRY_BATCH_INTERVAL and not _sending and _buffer.size() > 0:
		_send_timer = 0.0
		_flush_buffer()


func _unhandled_input(event: InputEvent) -> void:
	if OS.is_debug_build() and event is InputEventKey and event.pressed and event.keycode == KEY_F4:
		print("[Telemetry] Force flush: %d events in buffer" % _buffer.size())
		_flush_buffer()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

func track(event_name: String, data: Dictionary = {}) -> void:
	if not _is_enabled():
		return
	var event := {
		"player_id": _player_id,
		"session_id": _session_id,
		"event_name": event_name,
		"event_data": data,
		"game_version": Constants.APP_VERSION,
		"level_id": _current_level_id,
	}
	_buffer.append(event)
	if _buffer.size() > Constants.TELEMETRY_MAX_BUFFER:
		_buffer = _buffer.slice(-Constants.TELEMETRY_MAX_BUFFER)


# ---------------------------------------------------------------------------
# Signal handlers
# ---------------------------------------------------------------------------

func _connect_signals() -> void:
	EventBus.level_selected.connect(_on_level_selected)
	EventBus.level_complete.connect(_on_level_complete)
	EventBus.player_died.connect(_on_player_died)
	EventBus.player_spawned.connect(_on_player_spawned)
	EventBus.quest_state_changed.connect(_on_quest_state_changed)
	EventBus.boss_fight_started.connect(_on_boss_fight_started)
	EventBus.boss_fight_ended.connect(_on_boss_fight_ended)
	EventBus.boss_phase_changed.connect(_on_boss_phase_changed)
	EventBus.achievement_unlocked.connect(_on_achievement_unlocked)
	EventBus.portal_entered.connect(_on_portal_entered)
	EventBus.door_entered.connect(_on_door_entered)
	EventBus.enemy_killed.connect(_on_enemy_killed)


func _on_level_selected(level_id: String, _scene_path: String) -> void:
	_current_level_id = level_id
	_session_deaths[level_id] = _session_deaths.get(level_id, 0)


func _on_player_spawned() -> void:
	if not GameData.selected_level_id.is_empty():
		var prev_level := _current_level_id
		_current_level_id = GameData.selected_level_id
		if _current_level_id != prev_level:
			_session_deaths[_current_level_id] = _session_deaths.get(_current_level_id, 0)
			track("level_started", {"level_id": _current_level_id})
			return
	track("player_spawned")


func _on_level_complete() -> void:
	track("level_completed", {
		"level_id": _current_level_id,
		"deaths_this_session": _session_deaths.get(_current_level_id, 0),
	})


func _on_player_died() -> void:
	var count: int = _session_deaths.get(_current_level_id, 0) + 1
	_session_deaths[_current_level_id] = count
	track("player_died", {"death_count": count})


func _on_quest_state_changed(key: String, value: bool) -> void:
	track("quest_progressed", {"quest_key": key, "value": value})


func _on_boss_fight_started(max_health: float) -> void:
	track("boss_fight_started", {"max_health": max_health})


func _on_boss_fight_ended() -> void:
	track("boss_fight_ended")


func _on_boss_phase_changed(phase: int) -> void:
	track("boss_phase_changed", {"phase": phase})


func _on_achievement_unlocked(achievement_id: String) -> void:
	track("achievement_unlocked", {"achievement_id": achievement_id})


func _on_portal_entered(destination_level_id: String) -> void:
	track("portal_used", {
		"from_level": _current_level_id,
		"to_level": destination_level_id,
	})


func _on_door_entered(destination_scene: String, is_exit_door: bool) -> void:
	track("door_entered", {
		"destination": destination_scene,
		"is_exit": is_exit_door,
	})


func _on_enemy_killed(_enemy: Node2D) -> void:
	track("enemy_killed")


# ---------------------------------------------------------------------------
# Player ID — persistent anonymous UUID
# ---------------------------------------------------------------------------

func _load_or_create_player_id() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(TELEMETRY_CFG_PATH) == OK:
		_player_id = cfg.get_value("telemetry", "player_id", "")
	if _player_id.is_empty():
		_player_id = _generate_uuid()
		cfg.set_value("telemetry", "player_id", _player_id)
		cfg.save(TELEMETRY_CFG_PATH)


func _generate_uuid() -> String:
	var bytes := PackedByteArray()
	for i in range(16):
		bytes.append(randi() % 256)
	bytes[6] = (bytes[6] & 0x0F) | 0x40
	bytes[8] = (bytes[8] & 0x3F) | 0x80
	return "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x" % [
		bytes[0], bytes[1], bytes[2], bytes[3],
		bytes[4], bytes[5], bytes[6], bytes[7],
		bytes[8], bytes[9], bytes[10], bytes[11],
		bytes[12], bytes[13], bytes[14], bytes[15],
	]


# ---------------------------------------------------------------------------
# Opt-out check
# ---------------------------------------------------------------------------

func _is_enabled() -> bool:
	return SettingsManager.get_value("telemetry", "enabled", true)


# ---------------------------------------------------------------------------
# HTTP batch sender
# ---------------------------------------------------------------------------

func _flush_buffer() -> void:
	if _buffer.is_empty() or _sending:
		return
	if Constants.SUPABASE_URL.is_empty() or Constants.SUPABASE_ANON_KEY.is_empty():
		return

	_sending = true
	var batch := _buffer.duplicate()
	_buffer.clear()

	var url := Constants.SUPABASE_URL + "/rest/v1/events"
	var headers := PackedStringArray([
		"apikey: " + Constants.SUPABASE_ANON_KEY,
		"Authorization: Bearer " + Constants.SUPABASE_ANON_KEY,
		"Content-Type: application/json",
		"Prefer: return=minimal",
	])

	var payload: Array = []
	for event in batch:
		var row: Dictionary = event.duplicate()
		row["event_data"] = JSON.stringify(row["event_data"])
		payload.append(row)

	var body := JSON.stringify(payload)
	var err := _http.request(url, headers, HTTPClient.METHOD_POST, body)
	if err != OK:
		_sending = false


func _on_request_completed(_result: int, _response_code: int, _headers: PackedStringArray, _body: PackedByteArray) -> void:
	_sending = false
