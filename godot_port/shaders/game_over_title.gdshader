shader_type canvas_item;

// Game Over title glow: soft pulsing aura behind text with chromatic shimmer
// Uses additive blending for ethereal glow effect

render_mode blend_add;

uniform vec3 glow_color : source_color = vec3(0.4, 0.65, 1.0);
uniform vec3 accent_color : source_color = vec3(0.55, 0.35, 1.0);
uniform float glow_spread : hint_range(1.0, 8.0) = 3.5;
uniform float pulse_speed : hint_range(0.5, 5.0) = 1.8;
uniform float shimmer_speed : hint_range(0.0, 2.0) = 0.6;
uniform float intensity : hint_range(0.0, 1.0) = 0.7;
uniform float appear_progress : hint_range(0.0, 1.0) = 1.0;

float hash21(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

float value_noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash21(i);
	float b = hash21(i + vec2(1.0, 0.0));
	float c = hash21(i + vec2(0.0, 1.0));
	float d = hash21(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void fragment() {
	vec2 center = UV - 0.5;
	// Squash vertically for a wide horizontal aura
	center.y *= 2.2;
	float dist = length(center);

	// Pulsing glow layers
	float pulse = 0.85 + 0.15 * sin(TIME * pulse_speed);
	float pulse2 = 0.9 + 0.1 * sin(TIME * pulse_speed * 1.7 + 1.0);

	// Core glow (tight)
	float core = 0.02 / (dist + 0.01) * pulse;
	// Outer halo (wide, soft)
	float halo = 0.006 / (dist + 0.01) * glow_spread * pulse2;

	// Chromatic shimmer: hue shifts along x-axis over time
	float hue_shift = sin(center.x * 4.0 + TIME * shimmer_speed) * 0.5 + 0.5;
	vec3 shimmer = mix(glow_color, accent_color, hue_shift);

	// Noise distortion for organic feel
	float noise = value_noise(UV * 6.0 + TIME * 0.3) * 0.3;
	core *= (1.0 + noise);

	vec3 col = shimmer * (core * 0.4 + halo * 0.6);
	float alpha = clamp(core + halo, 0.0, 1.0) * intensity * appear_progress;

	COLOR = vec4(col * appear_progress, alpha);
}
