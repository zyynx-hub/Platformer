# QuestDefs.gd
# Static quest definitions — add new quests here
# Each entry is read by QuestLogScene to display status + narrative

class_name QuestDefs

# active_key   — ProgressData quest key that marks quest as in progress
# complete_key — ProgressData quest key that marks quest as fully done
const ALL: Array[Dictionary] = [
	{
		"id": "quest_red_karim",
		"name": "Red Karim's Problem",
		"reward": "Dildo",
		"description": "Green Karim needed to shut his mouth according to Red Karim. Miffy resolved this conflict by putting his foot down hard.",
		"active_key": "quest_red_karim_accepted",
		"complete_key": "quest_red_karim_complete",
	},
	{
		"id": "quest_purple_karim",
		"name": "Purple Karim's Debt",
		"reward": "Vibrator",
		"description": "Purple Karim couldn't pay off his PC debt because of his busted knee. Miffy delivered the payment to the terrifying three-headed Hydra Karim deep in the jungle village, narrowly avoiding threats of violence. Purple Karim was relieved and grateful.",
		"active_key": "quest_purple_karim_active",
		"complete_key": "quest_purple_karim_complete",
	},
]

static func get_quest(id: String) -> Dictionary:
	for q in ALL:
		if q["id"] == id:
			return q
	return {}
