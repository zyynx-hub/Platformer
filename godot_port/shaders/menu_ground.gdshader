shader_type canvas_item;

// Procedural blocky terrain silhouette — two layers for depth
uniform vec4 far_color : source_color = vec4(0.06, 0.04, 0.14, 1.0);
uniform vec4 near_color : source_color = vec4(0.03, 0.02, 0.08, 1.0);
uniform float far_height : hint_range(0.2, 0.7) = 0.45;
uniform float near_height : hint_range(0.1, 0.5) = 0.3;
uniform float block_freq : hint_range(5.0, 60.0) = 30.0;

float terrain_hash(float p) {
	return fract(sin(p * 127.1) * 43758.5453);
}

float blocky_terrain(float x, float base, float amplitude, float freq) {
	float qx = floor(x * freq);
	float h = base;
	h += (terrain_hash(qx) - 0.5) * amplitude;
	h += (terrain_hash(qx * 2.0 + 73.0) - 0.5) * amplitude * 0.4;
	return h;
}

void fragment() {
	vec2 uv = UV;

	// Far hills — smoother, taller
	float far_line = 1.0 - blocky_terrain(uv.x, far_height, 0.1, block_freq * 0.5);

	// Near ground — blockier, shorter
	float near_line = 1.0 - blocky_terrain(uv.x, near_height, 0.07, block_freq);

	if (uv.y > near_line) {
		COLOR = near_color;
	} else if (uv.y > far_line) {
		COLOR = far_color;
	} else {
		COLOR = vec4(0.0, 0.0, 0.0, 0.0);
	}
}
