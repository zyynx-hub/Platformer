shader_type canvas_item;

// Night sky with twinkling stars and subtle aurora wisps
uniform vec4 color_top : source_color = vec4(0.02, 0.02, 0.08, 1.0);
uniform vec4 color_horizon : source_color = vec4(0.08, 0.06, 0.18, 1.0);
uniform float star_density : hint_range(20.0, 120.0) = 60.0;
uniform float star_brightness : hint_range(0.2, 1.5) = 0.9;
uniform float aurora_strength : hint_range(0.0, 0.15) = 0.06;
uniform float aurora_speed : hint_range(0.01, 0.2) = 0.04;

float star_hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 hash2(vec2 p) {
	p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradient_noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(dot(hash2(i), f),
			dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
		mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
			dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
		u.y
	);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 3; i++) {
		v += a * gradient_noise(p);
		p *= 2.0;
		a *= 0.5;
	}
	return v;
}

void fragment() {
	vec2 uv = UV;

	// Vertical gradient: dark top to slightly lighter horizon
	vec3 sky = mix(color_top.rgb, color_horizon.rgb, pow(uv.y, 0.6));

	// Stars — grid-based with twinkle
	vec2 grid = floor(uv * star_density);
	float rnd = star_hash(grid);
	if (rnd > 0.96) {
		// Star position jitter within cell
		vec2 cell_uv = fract(uv * star_density);
		vec2 star_pos = vec2(star_hash(grid + 0.5), star_hash(grid + 1.5)) * 0.6 + 0.2;
		float dist = length(cell_uv - star_pos);

		// Twinkle — separate hashes for rate and phase so each star is independent
		float twinkle_rate = star_hash(grid + 7.0) * 4.0 + 1.0;
		float twinkle_phase = star_hash(grid + 13.0) * 6.283;
		float twinkle = sin(TIME * twinkle_rate + twinkle_phase) * 0.4 + 0.6;
		float size = mix(0.08, 0.18, star_hash(grid + 3.0));
		float star = smoothstep(size, 0.0, dist) * twinkle;

		// Color variation: mostly white, some warm, some blue
		vec3 star_color = vec3(1.0);
		if (rnd > 0.99) {
			star_color = vec3(0.8, 0.85, 1.0); // blue-ish
		} else if (rnd > 0.98) {
			star_color = vec3(1.0, 0.9, 0.75); // warm
		}
		sky += star_color * star * star_brightness;
	}

	// Subtle aurora wisps in the upper portion
	if (uv.y < 0.5) {
		float t = TIME * aurora_speed;
		float n = fbm(vec2(uv.x * 3.0 + t, uv.y * 2.0 - t * 0.3));
		float mask = smoothstep(0.5, 0.0, uv.y); // stronger at top
		vec3 aurora_color = mix(
			vec3(0.1, 0.3, 0.5),  // blue
			vec3(0.2, 0.1, 0.4),  // purple
			sin(uv.x * 4.0 + t) * 0.5 + 0.5
		);
		sky += aurora_color * n * mask * aurora_strength;
	}

	COLOR = vec4(sky, 1.0);
}
