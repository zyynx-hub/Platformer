# VersionChecker.gd
# One-shot version check against a remote version.json.
# Not an autoload — called from Boot.gd during startup.

class_name VersionChecker

# Cached result (persists across scene changes)
static var has_update := false
static var latest_version := ""
static var latest_url := ""
static var latest_message := ""


## Kick off a non-blocking HTTP request. Emits EventBus.update_available on success.
## Attaches a temporary HTTPRequest node to the given parent (auto-freed on completion).
static func check(parent: Node) -> void:
	if Constants.VERSION_CHECK_URL.is_empty():
		return

	var http := HTTPRequest.new()
	http.timeout = 5.0
	parent.add_child(http)
	http.request_completed.connect(_on_request_completed.bind(http))

	var err := http.request(Constants.VERSION_CHECK_URL)
	if err != OK:
		http.queue_free()


static func _on_request_completed(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray, http: HTTPRequest) -> void:
	http.queue_free()

	if result != HTTPRequest.RESULT_SUCCESS or response_code != 200:
		return

	var text := body.get_string_from_utf8()
	var json := JSON.new()
	if json.parse(text) != OK:
		return

	var data: Dictionary = json.data
	if not data.has("latest"):
		return

	var remote_version: String = data.get("latest", "")
	if remote_version.is_empty():
		return

	if _is_newer(remote_version, Constants.APP_VERSION):
		latest_version = remote_version
		latest_url = data.get("url", Constants.ITCH_URL)
		latest_message = data.get("message", "")
		has_update = true
		EventBus.update_available.emit(latest_version, latest_url, latest_message)


## Simple semver comparison: returns true if remote is strictly newer than local.
static func _is_newer(remote: String, local: String) -> bool:
	var r := remote.split(".")
	var l := local.split(".")
	for i in range(max(r.size(), l.size())):
		var rv: int = int(r[i]) if i < r.size() else 0
		var lv: int = int(l[i]) if i < l.size() else 0
		if rv > lv:
			return true
		if rv < lv:
			return false
	return false
