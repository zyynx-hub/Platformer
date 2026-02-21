# DialogLine.gd
# Resource for a single line of cinematic dialog — editable in the Inspector

class_name DialogLine
extends Resource

@export var character_name: String = ""
@export_multiline var text: String = ""
@export var portrait: Texture2D = null
@export_range(0.4, 2.0, 0.05) var voice_pitch: float = 1.0  ## Center pitch for talk blips (lower = deeper, higher = squeaky)
