# EventBus.gd
# Global signal relay for decoupled communication

extends Node

# ===== PLAYER EVENTS =====
signal player_spawned
signal player_damaged(amount: float)
signal player_died
signal player_respawned
signal player_health_changed(health: float, max_health: float)

# ===== GAMEPLAY EVENTS =====
signal game_paused
signal game_resumed
signal level_complete
signal level_selected(level_id: String, scene_path: String)

# ===== DASH EVENTS =====
signal dash_started
signal dash_cooldown_ended

# ===== AUDIO EVENTS =====
signal music_play(music_key: String)
signal sfx_play(sfx_key: String, volume: float)
signal audio_stop(audio_key: String)

# ===== UI EVENTS =====
signal hud_update
signal item_picked_up(item_data: Dictionary)
signal rocket_fuel_changed(fuel: float, max_fuel: float)

# ===== SETTINGS EVENTS =====
signal settings_changed(settings: Dictionary)

# ===== PROGRESS EVENTS =====
signal stat_updated(stat_key: String, value: Variant)
signal achievement_unlocked(achievement_id: String)
signal coins_changed(new_amount: int)

# ===== DIALOG EVENTS =====
signal dialog_requested(dialog_id: String)
signal cinematic_dialog_started(dialog_id: String)
signal cinematic_dialog_ended(dialog_id: String)

# ===== GATE EVENTS =====
signal gate_opened(gate_id: String)

# ===== PORTAL EVENTS =====
signal portal_entered(destination_level_id: String)

# ===== QUEST EVENTS =====
signal quest_state_changed(key: String, value: bool)
signal quest_log_requested

# ===== CAMERA EVENTS =====
signal camera_shake_requested(duration: float, intensity: float)
signal camera_pan_requested(target: Vector2, pan_duration: float, hold_duration: float, return_duration: float)

# ===== DOOR EVENTS =====
signal door_entered(destination_scene: String, is_exit_door: bool)

# ===== DAY/NIGHT EVENTS =====
signal time_of_day_changed(time: float)

# ===== WEATHER EVENTS =====
signal weather_changed(weather_type: int)

# ===== UPDATE EVENTS =====
signal update_available(version: String, url: String, message: String)
