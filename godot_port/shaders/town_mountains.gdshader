shader_type canvas_item;

uniform float time_of_day : hint_range(0.0, 1.0) = 0.35;
uniform float base_height : hint_range(0.1, 0.8) = 0.4;
uniform float amplitude : hint_range(0.02, 0.3) = 0.12;
uniform float block_freq : hint_range(5.0, 80.0) = 20.0;
uniform vec4 day_color : source_color = vec4(0.2588, 0.298, 0.4314, 1.0);
uniform vec4 night_color : source_color = vec4(0.0549, 0.0275, 0.1059, 1.0);
uniform vec4 dawn_color : source_color = vec4(0.3647, 0.1725, 0.1569, 1.0);
uniform vec4 dusk_color : source_color = vec4(0.3412, 0.1098, 0.1529, 1.0);

float terrain_hash(float p) {
	return fract(sin(p * 127.1) * 43758.5453);
}

float smooth_terrain(float x, float base, float amp, float freq) {
	float qx = floor(x * freq);
	float fx = fract(x * freq);
	float t = fx * fx * (3.0 - 2.0 * fx);
	float h0 = base + (terrain_hash(qx) - 0.5) * amp
		+ (terrain_hash(qx * 2.0 + 73.0) - 0.5) * amp * 0.4
		+ (terrain_hash(qx * 3.0 + 137.0) - 0.5) * amp * 0.15;
	float h1 = base + (terrain_hash(qx + 1.0) - 0.5) * amp
		+ (terrain_hash((qx + 1.0) * 2.0 + 73.0) - 0.5) * amp * 0.4
		+ (terrain_hash((qx + 1.0) * 3.0 + 137.0) - 0.5) * amp * 0.15;
	return mix(h0, h1, t);
}

vec4 time_color(float t) {
	if (t < 0.15) { return night_color; }
	else if (t < 0.25) { return mix(night_color, dawn_color, (t - 0.15) / 0.1); }
	else if (t < 0.35) { return mix(dawn_color, day_color, (t - 0.25) / 0.1); }
	else if (t < 0.65) { return day_color; }
	else if (t < 0.75) { return mix(day_color, dusk_color, (t - 0.65) / 0.1); }
	else if (t < 0.85) { return mix(dusk_color, night_color, (t - 0.75) / 0.1); }
	else { return night_color; }
}

void fragment() {
	vec2 uv = UV;
	float height = smooth_terrain(uv.x, base_height, amplitude, block_freq);
	float mountain_line = 1.0 - height;
	if (uv.y > mountain_line) {
		vec4 col = time_color(time_of_day);
		float grad = smoothstep(mountain_line, 1.0, uv.y);
		col.rgb *= mix(1.0, 0.7, grad);
		COLOR = col;
	} else {
		COLOR = vec4(0.0, 0.0, 0.0, 0.0);
	}
}
