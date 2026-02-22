shader_type canvas_item;

uniform float time_of_day : hint_range(0.0, 1.0) = 0.35;
uniform float drift_speed : hint_range(0.0, 0.05) = 0.008;
uniform float density : hint_range(0.0, 1.0) = 0.4;
uniform float softness : hint_range(0.05, 0.5) = 0.15;
uniform float weather_darken : hint_range(0.0, 1.0) = 0.0;

vec2 hash2(vec2 p) {
	p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradient_noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
		mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
		u.y
	);
}

float fbm(vec2 p) {
	float v = 0.0; float a = 0.5;
	for (int i = 0; i < 3; i++) { v += a * gradient_noise(p); p *= 2.0; a *= 0.5; }
	return v;
}

vec3 cloud_color(float t) {
	vec3 midnight = vec3(0.122, 0.102, 0.200);  // dark indigo #1F1A33
	vec3 dawn     = vec3(0.929, 0.608, 0.380);  // warm peach #ED9B61
	vec3 day      = vec3(0.906, 0.910, 0.945);  // pale lavender-white #E7E8F1
	vec3 dusk     = vec3(0.749, 0.388, 0.200);  // amber-rust #BF6333
	if (t < 0.15) { return midnight; }
	else if (t < 0.25) { return mix(midnight, dawn, (t - 0.15) / 0.1); }
	else if (t < 0.35) { return mix(dawn, day, (t - 0.25) / 0.1); }
	else if (t < 0.65) { return day; }
	else if (t < 0.75) { return mix(day, dusk, (t - 0.65) / 0.1); }
	else if (t < 0.85) { return mix(dusk, midnight, (t - 0.75) / 0.1); }
	else { return midnight; }
}

void fragment() {
	vec2 uv = UV;
	float drift = TIME * drift_speed;
	vec2 cloud_uv = vec2(uv.x * 3.0 + drift, uv.y * 1.5);
	float n = fbm(cloud_uv);
	float threshold = 1.0 - density;
	float cloud = smoothstep(threshold - softness, threshold + softness, n * 0.5 + 0.5);
	float edge_mask = smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.7, uv.y);
	cloud *= edge_mask;
	vec3 col = cloud_color(time_of_day);
	float detail = fbm(cloud_uv * 2.0 + 50.0) * 0.15;
	col += detail;
	// Storm clouds darken to a warm dark gray
	vec3 storm_col = mix(col, vec3(0.302, 0.275, 0.251), weather_darken * 0.7);
	float storm_alpha = mix(0.6, 0.85, weather_darken);
	COLOR = vec4(storm_col, cloud * storm_alpha);
}
