# LevelDefs.gd
# Static level definitions for the constellation map

class_name LevelDefs

# Each level entry:
#   id: String          — unique key
#   title: String       — display name
#   scene: String       — res:// path to level .tscn ("" for placeholder)
#   star_pos: Vector2   — normalized UV position on the sky (0.0–1.0)
#   connections: Array  — ids of levels connected by constellation lines
#   unlock_requires: String — id of level that must be completed to unlock ("" = always unlocked)

const ALL: Array[Dictionary] = [
	{
		"id": "level_1",
		"title": "Awakening",
		"scene": "res://levels/level_1/Level1.tscn",
		"star_pos": Vector2(0.2, 0.55),
		"connections": ["level_2", "level_town"],
		"unlock_requires": "",
	},
	{
		"id": "level_2",
		"title": "Rooftops",
		"scene": "res://levels/level_2/Level2.tscn",
		"star_pos": Vector2(0.35, 0.38),
		"connections": ["level_1", "level_3"],
		"unlock_requires": "level_1",
	},
	{
		"id": "level_3",
		"title": "The Descent",
		"scene": "",
		"star_pos": Vector2(0.52, 0.5),
		"connections": ["level_2", "level_4"],
		"unlock_requires": "level_2",
	},
	{
		"id": "level_4",
		"title": "Neon District",
		"scene": "",
		"star_pos": Vector2(0.65, 0.3),
		"connections": ["level_3", "level_5"],
		"unlock_requires": "level_3",
	},
	{
		"id": "level_5",
		"title": "Escape",
		"scene": "",
		"star_pos": Vector2(0.8, 0.45),
		"connections": ["level_4"],
		"unlock_requires": "level_4",
	},
	{
		"id": "level_town",
		"title": "Town",
		"scene": "res://levels/level_town/TownLevel.tscn",
		"star_pos": Vector2(0.1, 0.38),
		"connections": ["level_1", "level_jungle"],
		"unlock_requires": "",
	},
	{
		"id": "level_jungle",
		"title": "Jungle Village",
		"scene": "res://levels/level_jungle/JungleLevel.tscn",
		"star_pos": Vector2(0.05, 0.62),
		"connections": ["level_town"],
		"unlock_requires": "",
	},
]

static func get_def(id: String) -> Dictionary:
	for def in ALL:
		if def["id"] == id:
			return def
	return {}

static func get_index(id: String) -> int:
	for i in range(ALL.size()):
		if ALL[i]["id"] == id:
			return i
	return -1
