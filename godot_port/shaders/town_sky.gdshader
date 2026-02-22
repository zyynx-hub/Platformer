shader_type canvas_item;

// Procedural sky that transitions through a full day/night cycle.
// time_of_day: 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset

uniform float time_of_day : hint_range(0.0, 1.0) = 0.35;
uniform float star_density : hint_range(20.0, 120.0) = 60.0;
uniform float star_brightness : hint_range(0.2, 1.5) = 0.9;
uniform float cloud_speed : hint_range(0.0, 0.1) = 0.02;

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

vec3 sky_top_color(float t) {
	vec3 midnight = vec3(0.055, 0.043, 0.106);  // deep indigo #0E0B1B
	vec3 dawn     = vec3(0.239, 0.180, 0.341);  // dark purple #3D2E57
	vec3 day      = vec3(0.176, 0.502, 0.792);  // clear azure #2D80CA
	vec3 dusk     = vec3(0.341, 0.094, 0.188);  // deep crimson #571830
	if (t < 0.15) { return midnight; }
	else if (t < 0.25) { return mix(midnight, dawn, (t - 0.15) / 0.1); }
	else if (t < 0.35) { return mix(dawn, day, (t - 0.25) / 0.1); }
	else if (t < 0.65) { return day; }
	else if (t < 0.75) { return mix(day, dusk, (t - 0.65) / 0.1); }
	else if (t < 0.85) { return mix(dusk, midnight, (t - 0.75) / 0.1); }
	else { return midnight; }
}

vec3 sky_bottom_color(float t) {
	vec3 midnight = vec3(0.055, 0.043, 0.106);  // deep indigo #0E0B1B
	vec3 dawn     = vec3(0.878, 0.455, 0.220);  // warm amber-orange #E07438
	vec3 day      = vec3(0.486, 0.792, 0.937);  // pale sky blue #7CCAEF
	vec3 dusk     = vec3(0.800, 0.251, 0.118);  // amber-red #CC401E
	if (t < 0.15) { return midnight; }
	else if (t < 0.25) { return mix(midnight, dawn, (t - 0.15) / 0.1); }
	else if (t < 0.35) { return mix(dawn, day, (t - 0.25) / 0.1); }
	else if (t < 0.65) { return day; }
	else if (t < 0.75) { return mix(day, dusk, (t - 0.65) / 0.1); }
	else if (t < 0.85) { return mix(dusk, midnight, (t - 0.75) / 0.1); }
	else { return midnight; }
}

float star_visibility(float t) {
	if (t < 0.15) { return 1.0; }
	else if (t < 0.25) { return 1.0 - smoothstep(0.15, 0.25, t); }
	else if (t < 0.75) { return 0.0; }
	else if (t < 0.85) { return smoothstep(0.75, 0.85, t); }
	else { return 1.0; }
}

float circle_sdf(vec2 uv, vec2 center, float radius) {
	return length(uv - center) - radius;
}

void fragment() {
	vec2 uv = UV;
	float t = time_of_day;

	vec3 top = sky_top_color(t);
	vec3 bottom = sky_bottom_color(t);
	vec3 sky = mix(top, bottom, pow(uv.y, 0.5));

	// Sun
	float sun_phase = (t - 0.25) / 0.5;
	if (sun_phase > 0.0 && sun_phase < 1.0) {
		float sun_x = sun_phase;
		float sun_y = 0.8 - 0.6 * (1.0 - pow(2.0 * sun_phase - 1.0, 2.0));
		float sun_alpha = smoothstep(0.0, 0.1, sun_phase) * smoothstep(1.0, 0.9, sun_phase);
		float d = circle_sdf(uv, vec2(sun_x, sun_y), 0.03);
		float sun_glow = exp(-max(d, 0.0) * 30.0) * sun_alpha;
		// Orange-amber at dawn, warm cream at noon — both from palette
		vec3 sun_color = mix(vec3(1.0, 0.635, 0.078), vec3(0.976, 0.906, 0.812), smoothstep(0.15, 0.5, sun_phase));
		sky += sun_color * sun_glow * 0.8;
		float sun_core = smoothstep(0.005, 0.0, max(d, 0.0)) * sun_alpha;
		sky += vec3(0.976, 0.906, 0.812) * sun_core;
	}

	// Moon
	float moon_t = t < 0.5 ? t + 1.0 : t;
	float moon_phase = (moon_t - 0.75) / 0.5;
	if (moon_phase > 0.0 && moon_phase < 1.0) {
		float moon_x = moon_phase;
		float moon_y = 0.8 - 0.55 * (1.0 - pow(2.0 * moon_phase - 1.0, 2.0));
		float moon_alpha = smoothstep(0.0, 0.15, moon_phase) * smoothstep(1.0, 0.85, moon_phase);
		float d = circle_sdf(uv, vec2(moon_x, moon_y), 0.02);
		float d2 = circle_sdf(uv, vec2(moon_x + 0.012, moon_y - 0.005), 0.018);
		float moon_shape = smoothstep(0.003, 0.0, max(d, 0.0)) * smoothstep(0.0, 0.003, max(d2, 0.0));
		float moon_glow = exp(-max(d, 0.0) * 40.0) * moon_alpha * 0.3;
		vec3 moon_color = vec3(0.784, 0.816, 0.867);  // cool blue-gray #C8D0DD
		sky += moon_color * (moon_shape * moon_alpha + moon_glow);
	}

	// Stars
	float sv = star_visibility(t);
	if (sv > 0.01) {
		vec2 grid = floor(uv * star_density);
		float rnd = star_hash(grid);
		if (rnd > 0.96) {
			vec2 cell_uv = fract(uv * star_density);
			vec2 star_pos = vec2(star_hash(grid + 0.5), star_hash(grid + 1.5)) * 0.6 + 0.2;
			float dist = length(cell_uv - star_pos);
			float twinkle_rate = star_hash(grid + 7.0) * 4.0 + 1.0;
			float twinkle_phase = star_hash(grid + 13.0) * 6.283;
			float twinkle = sin(TIME * twinkle_rate + twinkle_phase) * 0.4 + 0.6;
			float size = mix(0.08, 0.18, star_hash(grid + 3.0));
			float star = smoothstep(size, 0.0, dist) * twinkle;
			vec3 star_color = vec3(1.0);
			if (rnd > 0.99) { star_color = vec3(0.784, 0.816, 0.867); }  // cool blue star
			else if (rnd > 0.98) { star_color = vec3(0.976, 0.906, 0.812); }  // warm cream star
			sky += star_color * star * star_brightness * sv;
		}
	}

	// Thin cloud wisps at horizon
	float cloud_mask = smoothstep(0.8, 0.3, uv.y);
	float n = fbm(vec2(uv.x * 4.0 + TIME * cloud_speed, uv.y * 2.0));
	float cloud = smoothstep(0.1, 0.4, n) * cloud_mask * 0.15;
	vec3 cloud_color = mix(vec3(0.122, 0.102, 0.200), vec3(0.784, 0.816, 0.867), smoothstep(0.15, 0.35, t) * smoothstep(0.85, 0.65, t));
	sky = mix(sky, cloud_color, cloud);

	COLOR = vec4(sky, 1.0);
}
