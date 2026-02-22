# ItemDefs.gd
# Static item definitions — add new items here

class_name ItemDefs

# composited_sheets: maps base character sheet path → composited (character+item) sheet
# When equipped, Player swaps its SpriteFrames to use these sheets instead

const ALL := {
	"rocket_boots": {
		"id": "rocket_boots",
		"name": "Rocket Boots",
		"icon_path": "res://items/sprites/rocket_boots_icon.png",
		"pickup_path": "res://items/sprites/rocket_boots_pickup.png",
		"composited_sheets": {
			"res://player/sprites/Owlet_Monster_Idle_4.png": "res://items/sprites/rocket_boots_composited/idle_4.png",
			"res://player/sprites/Owlet_Monster_Run_6.png": "res://items/sprites/rocket_boots_composited/run_6.png",
			"res://player/sprites/Owlet_Monster_Jump_8.png": "res://items/sprites/rocket_boots_composited/jump_8.png",
			"res://player/sprites/Owlet_Monster_Climb_4.png": "res://items/sprites/rocket_boots_composited/climb_4.png",
			"res://player/sprites/Owlet_Monster_Hurt_4.png": "res://items/sprites/rocket_boots_composited/hurt_4.png",
			"res://player/sprites/Owlet_Monster_Death_8.png": "res://items/sprites/rocket_boots_composited/death_8.png",
		},
	},
}

# Shop items sold by BlueKarimNPC (ordered by display priority)
const SHOP: Array = [
	{
		"id": "extra_heart",
		"name": "Extra Heart",
		"desc": "+1 max HP permanently",
		"cost": 80,
	},
	{
		"id": "speed_charm",
		"name": "Speed Charm",
		"desc": "Move 10% faster",
		"cost": 120,
	},
	{
		"id": "town_key",
		"name": "Town Key",
		"desc": "Opens the east gate",
		"cost": 60,
	},
]

static func get_item(id: String) -> Dictionary:
	if ALL.has(id):
		return ALL[id]
	push_error("ItemDefs: unknown item '%s'" % id)
	return {}
