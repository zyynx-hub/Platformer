# DialogSequence.gd
# A sequence of dialog lines — save as .tres and edit in Inspector
# Folder convention: res://levels/{level_id}/dialogs/{moment}.tres

class_name DialogSequence
extends Resource

@export var description: String = ""  ## What this dialog is about (for tracking)
@export var one_shot: bool = true     ## Only play once, then persist as seen
@export var lines: Array[DialogLine] = []
