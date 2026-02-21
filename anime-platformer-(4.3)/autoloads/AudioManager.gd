## AudioManager — music crossfade + pooled SFX.
## Replaces Platformer.Beeper from the JS build.
extends Node

const BUS_MASTER := "Master"
const BUS_MUSIC  := "Music"
const BUS_SFX    := "SFX"
const BUS_UI     := "UI"

const MUSIC_TRACKS := {
	"menu":    "res://assets/audio/music/menu_bgm.mp3",
	"game":    "res://assets/audio/music/game_bgm.mp3",
	"pause":   "res://assets/audio/music/pause_bgm.mp3",
}

var _music_player_a: AudioStreamPlayer
var _music_player_b: AudioStreamPlayer
var _active_player: AudioStreamPlayer
var _inactive_player: AudioStreamPlayer
var _current_track := ""
var _fade_tween: Tween


func _ready() -> void:
	_music_player_a = AudioStreamPlayer.new()
	_music_player_b = AudioStreamPlayer.new()
	_music_player_a.bus = BUS_MUSIC
	_music_player_b.bus = BUS_MUSIC
	add_child(_music_player_a)
	add_child(_music_player_b)
	_active_player   = _music_player_a
	_inactive_player = _music_player_b
	_apply_settings()
	EventBus.settings_changed.connect(_on_settings_changed)


func play_music(track_id: String, fade_time: float = 1.0) -> void:
	if track_id == _current_track and _active_player.playing:
		return
	_current_track = track_id
	var path: String = MUSIC_TRACKS.get(track_id, "")
	if path.is_empty():
		stop_music(fade_time)
		return
	var stream := load(path) as AudioStream
	if stream == null:
		push_warning("AudioManager: track not found at %s" % path)
		return

	_inactive_player.stream = stream
	_inactive_player.volume_db = -80.0
	_inactive_player.play()

	if _fade_tween:
		_fade_tween.kill()
	_fade_tween = create_tween()
	_fade_tween.set_parallel(true)
	_fade_tween.tween_property(_active_player,   "volume_db", -80.0, fade_time)
	_fade_tween.tween_property(_inactive_player, "volume_db",   0.0, fade_time)
	await _fade_tween.finished
	_active_player.stop()

	var tmp := _active_player
	_active_player   = _inactive_player
	_inactive_player = tmp


func stop_music(fade_time: float = 1.0) -> void:
	_current_track = ""
	if _fade_tween:
		_fade_tween.kill()
	_fade_tween = create_tween()
	_fade_tween.tween_property(_active_player, "volume_db", -80.0, fade_time)
	await _fade_tween.finished
	_active_player.stop()


func play_sfx(stream: AudioStream, volume_db: float = 0.0) -> void:
	if stream == null:
		return
	var player := AudioStreamPlayer.new()
	player.bus = BUS_SFX
	player.stream = stream
	player.volume_db = volume_db
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)


func _apply_settings() -> void:
	var s := SettingsManager.current
	var audio: Dictionary = s.get("audio", {})
	_set_bus_volume(BUS_MASTER, audio.get("master", 80))
	_set_bus_volume(BUS_MUSIC,  audio.get("music",  60))
	_set_bus_volume(BUS_SFX,    audio.get("sfx",    85))
	_set_bus_volume(BUS_UI,     audio.get("ui",     70))


func _set_bus_volume(bus_name: String, percent: int) -> void:
	var idx := AudioServer.get_bus_index(bus_name)
	if idx == -1:
		return
	AudioServer.set_bus_volume_db(idx, linear_to_db(percent / 100.0))


func _on_settings_changed(_s: Dictionary) -> void:
	_apply_settings()