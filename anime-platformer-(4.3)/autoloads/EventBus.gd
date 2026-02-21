## EventBus — global signal relay.
## Scenes communicate through here instead of direct references.
extends Node

# Scene flow
signal scene_change_requested(scene_path: String, data: Dictionary)
signal game_started(data: Dictionary)
signal game_paused()
signal game_resumed()
signal game_over()
signal level_complete(data: Dictionary)
signal return_to_menu()
signal return_to_world_map()

# Player / gameplay
signal player_damaged(amount: int, new_health: int)
signal player_died()
signal player_respawned()
signal coin_collected(total: int)
signal checkpoint_activated(position: Vector2)
signal level_timer_tick(seconds_left: int)
signal threat_changed(level: String)

# Jetpack
signal jetpack_started()
signal jetpack_stopped(reason: String)
signal jetpack_fuel_changed(percent: float)

# HUD
signal hud_update_requested()
signal hud_health_changed(hp: int, max_hp: int)
signal hud_coins_changed(coins: int, target: int)
signal hud_timer_changed(seconds: int)
signal hud_dash_cooldown(fraction: float)
signal hud_shield_changed(charges: int)

# World map
signal world_map_node_selected(node_id: String)
signal world_map_level_launch(node_id: String, level: int)
signal world_map_shop_open(shop_id: String)

# Settings
signal settings_changed(settings: Dictionary)
signal audio_settings_changed()
signal video_settings_changed()
