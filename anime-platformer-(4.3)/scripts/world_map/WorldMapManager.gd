## WorldMapManager — world graph data, node resolution, shop loading.
## Port of js/worldmap/WorldMapManager.js.
class_name WorldMapManagerClass
extends RefCounted

const DEFAULT_WORLD_ID := "world_tutorial"

# Embedded fallback (mirrors JS embeddedDefaults)
const EMBEDDED_WORLDS := {
	"world_tutorial": {
		"id":         "world_tutorial",
		"name":       "Tutorial World",
		"order_index": 0,
		"start_node_id": "start",
		"nodes": [
			{"id": "start",         "type": "start",    "pos": Vector2(180, 640), "game_level": 5, "title": "Rooftop Start",   "hint": "WASD to move"},
			{"id": "teach_move",    "type": "tutorial", "pos": Vector2(430, 560), "game_level": 5, "title": "Movement Basics", "hint": "Press E to confirm"},
			{"id": "junction_1",   "type": "junction", "pos": Vector2(700, 640), "game_level": 0, "title": "Route Split",     "hint": "Left = Shop, Up = Continue"},
			{"id": "shop_01",       "type": "shop",     "pos": Vector2(930, 640), "game_level": 0, "title": "Supply Kiosk",   "hint": "Press E to confirm"},
			{"id": "teach_jump",   "type": "tutorial", "pos": Vector2(700, 430), "game_level": 5, "title": "Jump Timing",     "hint": "WASD to move"},
			{"id": "teach_hazards","type": "level",    "pos": Vector2(980, 360), "game_level": 5, "title": "Hazard Control",  "hint": "Press E to confirm"},
			{"id": "boss_approach","type": "level",    "pos": Vector2(1260,360), "game_level": 5, "title": "Boss Approach",   "hint": "Press E to confirm"},
			{"id": "boss_tutorial","type": "boss",     "pos": Vector2(1460,280), "game_level": 5, "title": "Boss Tutorial",   "hint": "Press E to confirm"},
		],
		"edges": [
			{"from": "start",         "to": "teach_move"},
			{"from": "teach_move",    "to": "junction_1"},
			{"from": "junction_1",   "to": "shop_01"},
			{"from": "junction_1",   "to": "teach_jump"},
			{"from": "teach_jump",   "to": "teach_hazards"},
			{"from": "teach_hazards","to": "boss_approach"},
			{"from": "boss_approach","to": "boss_tutorial"},
		],
	},
}

const EMBEDDED_SHOPS := {
	"world_tutorial": {
		"shop_01": {
			"id":   "shop_01",
			"name": "Supply Kiosk",
			"items": [
				{"id": "hp_up_1",    "label": "Health Up",      "cost": 10, "stat": "health",      "delta": 1},
				{"id": "speed_up_1", "label": "Speed Up",       "cost":  8, "stat": "speed",        "delta": 0.1},
				{"id": "dash_cd_1",  "label": "Dash Cooldown",  "cost": 12, "stat": "dashCooldown", "delta": -0.08},
			],
		},
	},
}

var _cache: Dictionary = {}
var _shop_cache: Dictionary = {}


func get_world(world_id: String = DEFAULT_WORLD_ID) -> Dictionary:
	var id := world_id if not world_id.is_empty() else DEFAULT_WORLD_ID
	if _cache.has(id):
		return _cache[id]
	var world := _load_embedded(id)
	_cache[id] = world
	return world


func get_node(world: Dictionary, node_id: String) -> Dictionary:
	for n in world.get("nodes", []):
		if n["id"] == node_id:
			return n
	return {}


func get_shop(world_id: String, shop_id: String) -> Dictionary:
	var key := "%s:%s" % [world_id, shop_id]
	if _shop_cache.has(key):
		return _shop_cache[key]
	var embedded_world = EMBEDDED_SHOPS.get(world_id, {})
	var shop: Dictionary = embedded_world.get(shop_id, {})
	_shop_cache[key] = shop
	return shop


func resolve_level(node: Dictionary) -> int:
	return int(node.get("game_level", 1))


func _load_embedded(world_id: String) -> Dictionary:
	var src: Dictionary = EMBEDDED_WORLDS.get(world_id, {})
	if src.is_empty():
		push_warning("WorldMapManager: unknown world '%s'" % world_id)
		return {}
	return src.duplicate(true)
