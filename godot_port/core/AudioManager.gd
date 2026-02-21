# AudioManager.gd
# Global audio controller — manages music crossfade and UI/SFX playback

extends Node

const BUS_MASTER := "Master"
const BUS_MUSIC := "Music"
const BUS_SFX := "SFX"
const BUS_UI := "UI"

var _music_streams: Dictionary = {}
var _sfx_streams: Dictionary = {}

var _music_a: AudioStreamPlayer
var _music_b: AudioStreamPlayer
var _ui_player: AudioStreamPlayer
var _active_music: AudioStreamPlayer
var _current_music_key := ""
var _music_target_db := -6.0
var _music_fade_from_db := -20.0
var _fade_tween: Tween
var _duck_tween: Tween
var _duck_db: float = 0.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_music_a = AudioStreamPlayer.new()
	_music_a.bus = BUS_MUSIC
	add_child(_music_a)

	_music_b = AudioStreamPlayer.new()
	_music_b.bus = BUS_MUSIC
	add_child(_music_b)

	_ui_player = AudioStreamPlayer.new()
	_ui_player.bus = BUS_UI
	add_child(_ui_player)

	_active_music = _music_a

	_load_music_streams()
	_load_sfx_streams()
	_apply_volumes()

	EventBus.music_play.connect(_on_music_play)
	EventBus.sfx_play.connect(_on_sfx_play)
	EventBus.audio_stop.connect(_on_audio_stop)
	EventBus.settings_changed.connect(_on_settings_changed)

func play_music(key: String, fade_time: float = 0.8) -> void:
	var stream: AudioStream = _music_streams.get(key)
	if stream == null:
		push_warning("[AudioManager] Unknown music key: %s" % key)
		return
	# Skip if same stream is already playing (handles different keys pointing to same file)
	if _active_music.playing and _active_music.stream == stream:
		_current_music_key = key
		# Restore volume in case music was ducked (e.g. portal transition)
		unduck_music(fade_time)
		return
	_current_music_key = key

	var new_player := _get_inactive_music_player()
	var old_player := _active_music

	new_player.stream = stream
	new_player.volume_db = _music_fade_from_db
	new_player.play()

	if _fade_tween:
		_fade_tween.kill()
	_fade_tween = create_tween()

	if old_player.playing:
		_fade_tween.set_parallel(true)
		_fade_tween.tween_property(old_player, "volume_db", _music_fade_from_db, fade_time)
		_fade_tween.tween_property(new_player, "volume_db", _music_target_db, fade_time)
		_fade_tween.set_parallel(false)
		_fade_tween.tween_callback(old_player.stop)
	else:
		_fade_tween.tween_property(new_player, "volume_db", _music_target_db, fade_time)

	_active_music = new_player

func has_music(key: String) -> bool:
	return _music_streams.has(key)

func duck_music(target_db: float = -18.0, duration: float = 0.3) -> void:
	if _duck_tween:
		_duck_tween.kill()
	_duck_db = target_db
	_duck_tween = create_tween()
	_duck_tween.tween_property(_active_music, "volume_db", target_db, duration)

func unduck_music(duration: float = 0.3) -> void:
	if _duck_tween:
		_duck_tween.kill()
	_duck_db = 0.0
	_duck_tween = create_tween()
	_duck_tween.tween_property(_active_music, "volume_db", _music_target_db, duration)

func stop_music(fade_time: float = 1.0) -> void:
	_current_music_key = ""
	if _active_music and _active_music.playing:
		if _fade_tween:
			_fade_tween.kill()
		_fade_tween = create_tween()
		_fade_tween.tween_property(_active_music, "volume_db", _music_fade_from_db, fade_time)
		_fade_tween.tween_callback(_active_music.stop)

func play_sfx(key: String, volume_db: float = 0.0) -> void:
	var stream: AudioStream = _sfx_streams.get(key)
	if stream == null:
		return
	var player := AudioStreamPlayer.new()
	player.bus = BUS_SFX
	player.stream = stream
	player.volume_db = volume_db
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)

func play_ui_sfx(key: String, volume_db: float = 0.0) -> void:
	var stream: AudioStream = _sfx_streams.get(key)
	if stream == null:
		return
	_ui_player.stream = stream
	_ui_player.volume_db = volume_db
	_ui_player.play()

# --- Private ---

func _load_music_streams() -> void:
	var tracks := {
		"menu": "res://assets/audio/music/menu_bgm.mp3",
		"game": "res://levels/level_1/level1_bgm.mp3",
		"pause": "res://assets/audio/music/pause_bgm.mp3",
		"level_1": "res://levels/level_1/level1_bgm.mp3",
		"level_town": "res://levels/level_1/level1_bgm.mp3",
	}
	for key in tracks:
		var path: String = tracks[key]
		if ResourceLoader.exists(path):
			_music_streams[key] = load(path)

func _load_sfx_streams() -> void:
	var sfx_dir := "res://assets/audio/sfx/"
	var sounds := {
		"ui_tick": "ui_tick.wav",
		"ui_confirm": "ui_confirm.wav",
		"dialog_talk": "dialog_talk.wav",
	}
	for key in sounds:
		var path: String = sfx_dir + sounds[key]
		if ResourceLoader.exists(path):
			_sfx_streams[key] = load(path)

func _get_inactive_music_player() -> AudioStreamPlayer:
	if _active_music == _music_a:
		return _music_b
	return _music_a

func _apply_volumes() -> void:
	_set_bus_volume(BUS_MASTER, SettingsManager.get_value("audio", "master", 80))
	_set_bus_volume(BUS_MUSIC, SettingsManager.get_value("audio", "music", 60))
	var sfx_vol: int = SettingsManager.get_value("audio", "sfx", 85)
	_set_bus_volume(BUS_SFX, sfx_vol)
	_set_bus_volume(BUS_UI, sfx_vol)

func _set_bus_volume(bus_name: String, percent: int) -> void:
	var idx := AudioServer.get_bus_index(bus_name)
	if idx == -1:
		return
	AudioServer.set_bus_volume_db(idx, linear_to_db(percent / 100.0))

func _on_music_play(key: String) -> void:
	play_music(key)

func _on_sfx_play(key: String, volume: float) -> void:
	play_ui_sfx(key, volume)

func _on_audio_stop(_key: String) -> void:
	stop_music()

func _on_settings_changed(_settings: Dictionary) -> void:
	_apply_volumes()
