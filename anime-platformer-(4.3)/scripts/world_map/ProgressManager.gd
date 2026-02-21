## ProgressManager — tracks unlocked nodes, best scores, shop purchases.
## Persists to user://progress.cfg.
class_name ProgressManager
extends RefCounted

const SAVE_PATH := "user://progress.cfg"

# unlocked_nodes: Dictionary{ world_id -> Array[node_id] }
# best_scores:    Dictionary{ "world_id:node_id" -> { coins, time } }
# shop_purchases: Dictionary{ "world_id:shop_id:item_id" -> int count }
var unlocked_nodes: Dictionary = {}
var best_scores:    Dictionary = {}
var shop_purchases: Dictionary = {}


func _init() -> void:
	load_progress()


func load_progress() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		_seed_defaults()
		return
	if cfg.has_section("unlocked"):
		for key in cfg.get_section_keys("unlocked"):
			unlocked_nodes[key] = cfg.get_value("unlocked", key, [])
	if cfg.has_section("scores"):
		for key in cfg.get_section_keys("scores"):
			best_scores[key] = cfg.get_value("scores", key, {})
	if cfg.has_section("shop"):
		for key in cfg.get_section_keys("shop"):
			shop_purchases[key] = cfg.get_value("shop", key, 0)


func save_progress() -> void:
	var cfg := ConfigFile.new()
	for world_id in unlocked_nodes.keys():
		cfg.set_value("unlocked", world_id, unlocked_nodes[world_id])
	for key in best_scores.keys():
		cfg.set_value("scores", key, best_scores[key])
	for key in shop_purchases.keys():
		cfg.set_value("shop", key, shop_purchases[key])
	cfg.save(SAVE_PATH)


func is_node_unlocked(world_id: String, node_id: String) -> bool:
	var list: Array = unlocked_nodes.get(world_id, [])
	return node_id in list


func unlock_node(world_id: String, node_id: String) -> void:
	if not unlocked_nodes.has(world_id):
		unlocked_nodes[world_id] = []
	if node_id not in unlocked_nodes[world_id]:
		unlocked_nodes[world_id].append(node_id)
	save_progress()


func record_score(world_id: String, node_id: String, coins: int, time_sec: float) -> void:
	var key := "%s:%s" % [world_id, node_id]
	var existing: Dictionary = best_scores.get(key, {})
	var improved := false
	if coins > int(existing.get("coins", -1)):
		existing["coins"] = coins
		improved = true
	if time_sec > float(existing.get("time", -1.0)):
		existing["time"] = time_sec
		improved = true
	if improved:
		best_scores[key] = existing
		save_progress()


func get_best_score(world_id: String, node_id: String) -> Dictionary:
	return best_scores.get("%s:%s" % [world_id, node_id], {})


func buy_item(world_id: String, shop_id: String, item_id: String) -> void:
	var key := "%s:%s:%s" % [world_id, shop_id, item_id]
	shop_purchases[key] = shop_purchases.get(key, 0) + 1
	save_progress()


func purchase_count(world_id: String, shop_id: String, item_id: String) -> int:
	return shop_purchases.get("%s:%s:%s" % [world_id, shop_id, item_id], 0)


func _seed_defaults() -> void:
	# Start node always unlocked
	unlock_node("world_tutorial", "start")
