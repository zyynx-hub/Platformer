## LevelParser — reads the custom JSON command format used by all levels.
## Direct port of js/level/level-data.js createLevelData().
class_name LevelParser
extends RefCounted

## Returns a 2D array of tile characters for the given level JSON file.
## Falls back to a minimal floor if the file is missing or invalid.
static func load_level(level_number: int) -> Array:
	var path := "res://assets/levels/level-%d.json" % level_number
	if not FileAccess.file_exists(path):
		push_warning("LevelParser: %s not found, using fallback" % path)
		return _make_fallback(90, 18)

	var text := FileAccess.get_file_as_string(path)
	var json  := JSON.new()
	if json.parse(text) != OK:
		push_warning("LevelParser: JSON parse error in %s" % path)
		return _make_fallback(90, 18)

	var data: Dictionary = json.get_data()
	var width:  int = int(data.get("width",  90))
	var height: int = int(data.get("height", 18))
	var rows := _empty_grid(width, height)

	# Base floor
	_line(rows, 0, width - 1, height - 1, "#")

	var commands = data.get("commands", [])
	for cmd in commands:
		var op: String = str(cmd.get("op", ""))
		match op:
			"line":
				_line(rows,
					int(cmd.get("x1", 0)), int(cmd.get("x2", 0)),
					int(cmd.get("y",  0)), str(cmd.get("ch", ".")))
			"rect":
				_rect(rows,
					int(cmd.get("x1", 0)), int(cmd.get("y1", 0)),
					int(cmd.get("x2", 0)), int(cmd.get("y2", 0)),
					str(cmd.get("ch", ".")))
			"many":
				for item in cmd.get("items", []):
					_put(rows, width, height, int(item[0]), int(item[1]), str(cmd.get("ch", ".")))
			"manyEnemies":
				for item in cmd.get("items", []):
					if item.size() >= 3:
						_put(rows, width, height, int(item[0]), int(item[1]), str(item[2]))

	return rows


static func _empty_grid(width: int, height: int) -> Array:
	var rows: Array = []
	for _y in height:
		var row: Array = []
		for _x in width:
			row.append(".")
		rows.append(row)
	return rows


static func _make_fallback(width: int, height: int) -> Array:
	var rows := _empty_grid(width, height)
	_line(rows, 0, width - 1, height - 1, "#")
	_put(rows, width, height, 4, height - 2, "S")
	return rows


static func _put(rows: Array, width: int, height: int, x: int, y: int, ch: String) -> void:
	if x >= 0 and x < width and y >= 0 and y < height:
		rows[y][x] = ch


static func _line(rows: Array, x1: int, x2: int, y: int, ch: String) -> void:
	var height: int = rows.size()
	var width:  int = rows[0].size() if height > 0 else 0
	for x in range(x1, x2 + 1):
		_put(rows, width, height, x, y, ch)


static func _rect(rows: Array, x1: int, y1: int, x2: int, y2: int, ch: String) -> void:
	var height: int = rows.size()
	var width:  int = rows[0].size() if height > 0 else 0
	for y in range(y1, y2 + 1):
		for x in range(x1, x2 + 1):
			_put(rows, width, height, x, y, ch)
