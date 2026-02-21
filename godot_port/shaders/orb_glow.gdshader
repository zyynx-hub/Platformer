shader_type canvas_item;
render_mode blend_add, unshaded;

// Industry-standard glowing orb: SDF circle + layered glow + FBM noise distortion
// Apply to a small ColorRect (28x28 to 32x32). No texture needed.

uniform vec4 core_color : source_color = vec4(1.0, 0.95, 0.85, 1.0);
uniform vec4 glow_color : source_color = vec4(0.3, 0.6, 1.0, 1.0);
uniform vec4 accent_color : source_color = vec4(0.55, 0.35, 1.0, 1.0);
uniform float core_size : hint_range(0.05, 0.25) = 0.1;
uniform float glow_spread : hint_range(1.0, 8.0) = 4.0;
uniform float pulse_speed : hint_range(0.5, 6.0) = 2.5;
uniform float distortion_amount : hint_range(0.0, 0.08) = 0.03;
uniform float chromatic_speed : hint_range(0.0, 1.0) = 0.15;

// Inline noise — no texture sampler needed
float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 3; i++) {
		v += a * value_noise(p);
		p *= 2.0;
		a *= 0.5;
	}
	return v;
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void fragment() {
	vec2 uv = UV - 0.5;

	// FBM noise distortion — organic wobble
	float n1 = fbm(uv * 6.0 + TIME * 0.8);
	float n2 = fbm(uv * 6.0 + TIME * 0.8 + 42.0);
	vec2 distortion = (vec2(n1, n2) - 0.5) * distortion_amount;
	vec2 warped = uv + distortion;

	float dist = length(warped);

	// Pulse animation
	float pulse = sin(TIME * pulse_speed) * 0.12 + 1.0;
	float fast_flicker = sin(TIME * pulse_speed * 3.7) * 0.04 + 1.0;

	// Layer 1: Bright solid core (squared falloff)
	float core = smoothstep(core_size * pulse, core_size * 0.3 * pulse, dist);

	// Layer 2: Inner glow (inverse falloff, tight)
	float inner_d = max(dist - core_size * 0.4, 0.001);
	float inner_glow = clamp(0.012 / inner_d, 0.0, 1.0) * fast_flicker;

	// Layer 3: Outer halo (wide, soft)
	float outer_glow = clamp(0.004 / max(dist, 0.001), 0.0, 1.0) * glow_spread * pulse;

	// Chromatic shift (angle-based, subtle rainbow tint)
	float angle = atan(uv.y, uv.x);
	float hue = fract(angle / 6.2832 + TIME * chromatic_speed);
	vec3 chromatic = hsv2rgb(vec3(hue, 0.35, 1.0));

	// Color mixing
	vec3 col = core_color.rgb * core * 1.2;

	vec3 inner_col = mix(core_color.rgb, glow_color.rgb, 0.4);
	col += inner_col * inner_glow * 0.7;

	vec3 outer_col = mix(glow_color.rgb, chromatic, 0.25);
	outer_col = mix(outer_col, accent_color.rgb, sin(TIME * 1.3) * 0.15 + 0.15);
	col += outer_col * outer_glow;

	// Alpha
	float alpha = max(core, max(inner_glow * 0.9, outer_glow));
	alpha = clamp(alpha, 0.0, 1.0);

	COLOR = vec4(col, alpha);
}
