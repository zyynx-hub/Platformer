shader_type canvas_item;

uniform float intensity : hint_range(0.0, 1.0) = 0.5;
uniform float fall_speed : hint_range(10.0, 100.0) = 35.0;
uniform float drift : hint_range(0.0, 30.0) = 12.0;
uniform vec3 flake_tint : source_color = vec3(1.0, 1.0, 1.0);

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

void fragment() {
	vec2 res = vec2(426.0, 240.0);
	vec2 px = UV * res;
	float alpha = 0.0;
	for (int layer = 0; layer < 4; layer++) {
		float fl = float(layer);
		float lspeed = fall_speed * (0.6 + fl * 0.2);
		float ldrift = drift * (0.8 + fl * 0.15);
		float cell_size = 8.0 + fl * 6.0;
		float flake_r = 0.8 + fl * 0.3;
		float lalpha = 0.6 - fl * 0.1;
		vec2 p = px;
		p.y -= TIME * lspeed;
		float drift_phase = TIME * (0.4 + fl * 0.15) + fl * 1.7;
		p.x += sin(drift_phase + p.y * 0.02) * ldrift;
		vec2 cell = floor(p / cell_size);
		vec2 fp = p - cell * cell_size;
		float rnd = hash21(cell + fl * 77.0);
		float show = step(rnd, intensity);
		vec2 flake_pos = vec2(hash21(cell + vec2(fl * 13.0, 0.0)), hash21(cell + vec2(0.0, fl * 29.0))) * (cell_size - 2.0) + 1.0;
		float dist = length(fp - flake_pos);
		float flake = smoothstep(flake_r, flake_r - 0.5, dist);
		alpha += flake * lalpha * show;
	}
	COLOR = vec4(flake_tint, clamp(alpha, 0.0, 0.5));
}
