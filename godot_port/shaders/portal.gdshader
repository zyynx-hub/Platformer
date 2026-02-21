shader_type canvas_item;
render_mode blend_mix, unshaded;

// Swirl behavior
uniform float swirl_speed : hint_range(0.5, 8.0) = 2.0;
uniform float swirl_intensity : hint_range(0.0, 5.0) = 2.5;

// Activation: 0.0 = ambient idle, 1.0 = full power (player being pulled in)
uniform float activation_progress : hint_range(0.0, 1.0) = 0.0;

// Colors
uniform vec4 core_color : source_color = vec4(0.05, 0.0, 0.15, 1.0);
uniform vec4 edge_color : source_color = vec4(0.4, 0.3, 1.0, 1.0);
uniform vec4 energy_color : source_color = vec4(0.5, 0.2, 1.0, 1.0);

// Glow
uniform float glow_strength : hint_range(0.0, 2.0) = 0.8;

// Ellipse shape (Y/X ratio — 0.6 = tall oval)
uniform float ellipse_ratio : hint_range(0.3, 1.0) = 0.6;

// ===== Noise functions =====

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float value_noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
	float val = 0.0;
	float amp = 0.5;
	for (int i = 0; i < 4; i++) {
		val += amp * value_noise(p);
		p *= 2.1;
		amp *= 0.5;
	}
	return val;
}

void fragment() {
	// Center UV at origin
	vec2 uv = UV - 0.5;

	// Scale X by ellipse_ratio to make tall oval (Y stays full, X compressed)
	vec2 ellipse_uv = vec2(uv.x / ellipse_ratio, uv.y);
	float dist = length(ellipse_uv);

	// Ellipse SDF — 0.5 is the boundary
	float ellipse_edge = 0.5;

	// Soft oval mask — fully transparent outside
	float outer_mask = 1.0 - smoothstep(ellipse_edge - 0.08, ellipse_edge + 0.02, dist);

	// Polar coordinates
	float angle = atan(ellipse_uv.y, ellipse_uv.x);

	// Swirl distortion — inner regions spin much faster (vortex effect)
	float swirl_factor = swirl_intensity * (1.0 + activation_progress * 2.0);
	float depth = max(1.0 - dist * 2.0, 0.0);
	float swirled_angle = angle + depth * depth * swirl_factor + TIME * swirl_speed;

	// Convert back to cartesian for noise sampling
	vec2 swirled_uv = vec2(cos(swirled_angle), sin(swirled_angle)) * dist;

	// FBM noise at swirled position for organic energy
	float noise = fbm(swirled_uv * 5.0 + TIME * 0.4);
	float noise2 = fbm(swirled_uv * 3.0 - TIME * 0.6 + 42.0);

	// ===== Dark vortex center =====
	// Deep black hole in the middle that sucks light in
	float void_mask = smoothstep(0.18, 0.0, dist);
	float void_strength = 0.7 + activation_progress * 0.3;

	// ===== Swirling energy arms =====
	// Spiral arms emanating from center — the main visual feature
	float arm_angle = swirled_angle * 2.0;
	float arms = pow(abs(sin(arm_angle + noise * 3.0)), 1.5);
	arms *= smoothstep(0.0, 0.15, dist); // fade near center (vortex hole)
	arms *= smoothstep(0.5, 0.25, dist); // fade near edge
	float arm_brightness = arms * (0.6 + noise2 * 0.4);

	// Mix purple and blue based on spiral position
	vec3 arm_color = mix(energy_color.rgb, edge_color.rgb, sin(arm_angle * 0.5 + TIME) * 0.5 + 0.5);
	vec3 swirl_layer = arm_color * arm_brightness * 1.2;

	// ===== Secondary swirl detail =====
	float detail_angle = swirled_angle * 4.0 + TIME * 0.8;
	float detail = pow(abs(sin(detail_angle + noise2 * 2.0)), 3.0) * 0.3;
	detail *= smoothstep(0.05, 0.12, dist) * smoothstep(0.45, 0.2, dist);
	swirl_layer += edge_color.rgb * detail;

	// ===== Edge glow (bright rim) =====
	float edge_band = smoothstep(ellipse_edge, ellipse_edge - 0.1, dist)
	               * (1.0 - smoothstep(ellipse_edge - 0.1, ellipse_edge - 0.2, dist));
	float edge_pulse = 1.0 + sin(TIME * 2.5 + angle * 2.0) * 0.3;
	edge_pulse += activation_progress * sin(TIME * 6.0) * 0.4;
	float glow = glow_strength * edge_band * edge_pulse;
	vec3 edge = edge_color.rgb * glow;

	// ===== Outer haze (soft glow outside the main shape) =====
	float haze = smoothstep(ellipse_edge + 0.02, ellipse_edge - 0.05, dist) * 0.3;
	haze *= (1.0 - smoothstep(ellipse_edge - 0.05, ellipse_edge - 0.15, dist));
	vec3 haze_color = edge_color.rgb * haze * glow_strength;

	// ===== Combine =====
	// Start with dark core
	vec3 final_color = core_color.rgb * 0.1;

	// Add swirling energy
	final_color += swirl_layer;

	// Add edge glow + haze
	final_color += edge + haze_color;

	// Darken the center vortex (the "hole")
	final_color *= (1.0 - void_mask * void_strength);

	// Brighten on activation
	final_color *= 1.0 + activation_progress * 0.5;

	// Alpha: outer_mask controls the oval shape
	float alpha = outer_mask;

	COLOR = vec4(final_color * alpha, alpha);
}
