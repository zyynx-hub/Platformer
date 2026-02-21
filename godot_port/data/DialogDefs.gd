# DialogDefs.gd
# Dialog loader — resolves dialog IDs to .tres files in res://levels/{level_id}/dialogs/
#
# ID format supports flat and nested paths:
#   "{level_id}/{moment}"          → res://levels/{level_id}/dialogs/{moment}.tres
#   "{level_id}/{npc_id}/{moment}" → res://levels/{level_id}/dialogs/{npc_id}/{moment}.tres
#
# Examples:
#   "level_1/spawn"             → res://levels/level_1/dialogs/spawn.tres
#   "level_town/red_karim/intro"→ res://levels/level_town/dialogs/red_karim/intro.tres
#
# To add a new dialog:
#   1. Create a .tres file under levels/{level_id}/dialogs/ (use subdirectories per NPC)
#   2. Edit its lines array in the Inspector
#   3. Trigger with _start_cinematic_dialog("{level_id}/{npc_id}/{moment}") from GameScene

class_name DialogDefs

static func get_lines(dialog_id: String) -> Array[DialogLine]:
	var seq = _load_sequence(dialog_id)
	if seq:
		return seq.lines
	return []

static func has_dialog(dialog_id: String) -> bool:
	return ResourceLoader.exists(_id_to_path(dialog_id))

static func is_one_shot(dialog_id: String) -> bool:
	var seq = _load_sequence(dialog_id)
	return seq.one_shot if seq else true

static func _load_sequence(dialog_id: String) -> DialogSequence:
	var path := _id_to_path(dialog_id)
	if not ResourceLoader.exists(path):
		push_warning("DialogDefs: no .tres found for '%s' (expected %s)" % [dialog_id, path])
		return null
	return load(path) as DialogSequence

static func _id_to_path(dialog_id: String) -> String:
	var parts := dialog_id.split("/")
	if parts.size() >= 2:
		var level_id := parts[0]
		var rest := "/".join(parts.slice(1))
		return "res://levels/" + level_id + "/dialogs/" + rest + ".tres"
	return "res://levels/" + dialog_id + ".tres"
