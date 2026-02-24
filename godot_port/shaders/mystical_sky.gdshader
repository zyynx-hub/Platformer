shader_type canvas_item;

// Cosmic mystical sky — permanent starfield with drifting nebula wisps.
// No day/night cycle — the Mystical Realm exists outside time.

uniform float star_density : hint_range(20.0, 120.0) = 80.0;
uniform float star_brightness : hint_range(0.2, 1.5) = 1.0;
uniform float nebula_intensity : hint_range(0.0, 1.0) = 0.3;
uniform vec2 camera_offset = vec2(0.0);

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
	for (int i = 0; i < 4; i++) {
		v += a * gradient_noise(p);
		p *= 2.0;
		a *= 0.5;
	}
	return v;
}

void fragment() {
	vec2 uv = UV;

	// Base gradient — deep indigo to dark purple
	vec3 top = vec3(0.03, 0.02, 0.08);
	vec3 bottom = vec3(0.08, 0.03, 0.12);
	vec3 sky = mix(top, bottom, pow(uv.y, 0.6));

	// Parallax offsets — camera_offset is in world pixels, normalize to subtle UV shift
	vec2 nebula_uv = uv + camera_offset * 0.00005;
	vec2 star_uv = uv + camera_offset * 0.00015;

	// Nebula wisps — slow-drifting colored clouds
	float n1 = fbm(nebula_uv * 3.0 + TIME * 0.01);
	float n2 = fbm(nebula_uv * 2.5 + vec2(5.0, 3.0) + TIME * 0.008);

	// Purple nebula
	vec3 nebula1 = vec3(0.25, 0.05, 0.35) * smoothstep(0.0, 0.5, n1) * nebula_intensity;
	// Blue nebula
	vec3 nebula2 = vec3(0.05, 0.1, 0.3) * smoothstep(0.0, 0.5, n2) * nebula_intensity;
	// Gold accent wisps
	float n3 = fbm(nebula_uv * 4.0 + vec2(10.0, 7.0) + TIME * 0.005);
	vec3 nebula3 = vec3(0.3, 0.2, 0.05) * smoothstep(0.2, 0.6, n3) * nebula_intensity * 0.4;

	sky += nebula1 + nebula2 + nebula3;

	// Stars — always visible
	vec2 grid = floor(star_uv * star_density);
	float rnd = star_hash(grid);
	if (rnd > 0.94) {
		vec2 cell_uv = fract(star_uv * star_density);
		vec2 star_pos = vec2(star_hash(grid + 0.5), star_hash(grid + 1.5)) * 0.6 + 0.2;
		float dist = length(cell_uv - star_pos);
		float twinkle_rate = star_hash(grid + 7.0) * 4.0 + 1.0;
		float twinkle_phase = star_hash(grid + 13.0) * 6.283;
		float twinkle = sin(TIME * twinkle_rate + twinkle_phase) * 0.4 + 0.6;
		float size = mix(0.08, 0.2, star_hash(grid + 3.0));
		float star = smoothstep(size, 0.0, dist) * twinkle;
		// Color variation: white, blue-white, pale gold
		vec3 star_color = vec3(1.0);
		if (rnd > 0.98) { star_color = vec3(0.7, 0.8, 1.0); }
		else if (rnd > 0.96) { star_color = vec3(1.0, 0.9, 0.7); }
		sky += star_color * star * star_brightness;
	}

	COLOR = vec4(sky, 1.0);
}
