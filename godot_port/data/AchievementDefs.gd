# AchievementDefs.gd
# Static achievement definitions

class_name AchievementDefs

const ALL := [
	{
		"id": "first_jump",
		"title": "Liftoff",
		"description": "Perform your first jump.",
		"hidden": false,
	},
	{
		"id": "first_dash",
		"title": "Speed Demon",
		"description": "Perform your first dash.",
		"hidden": false,
	},
	{
		"id": "first_death",
		"title": "Learning Experience",
		"description": "Die for the first time.",
		"hidden": false,
	},
	{
		"id": "level_1_complete",
		"title": "Escape Artist",
		"description": "Complete Level 1.",
		"hidden": false,
	},
	{
		"id": "wall_jumper",
		"title": "Wall Runner",
		"description": "Perform 50 wall jumps.",
		"hidden": false,
	},
	{
		"id": "die_10_times",
		"title": "Persistence",
		"description": "Die 10 times total.",
		"hidden": true,
	},
	{
		"id": "play_1_hour",
		"title": "Dedicated",
		"description": "Play for a total of 1 hour.",
		"hidden": false,
	},
]

static func get_def(id: String) -> Dictionary:
	for def in ALL:
		if def["id"] == id:
			return def
	return {}
