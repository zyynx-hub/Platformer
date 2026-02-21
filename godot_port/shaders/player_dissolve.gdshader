shader_type canvas_item;

// Dissolve amount: 0.0 = fully visible, 1.0 = fully dissolved
uniform float dissolve_amount : hint_range(0.0, 1.0) = 0.0;
// Edge glow color (luminous cyan-white soul effect)
uniform vec4 edge_color : source_color = vec4(0.6, 0.85, 1.0, 1.0);
// Edge glow width in noise-space
uniform float edge_width : hint_range(0.01, 0.15) = 0.06;
// Noise scale — tuned for 32x32 pixel-art sprites
uniform float noise_scale : hint_range(2.0, 20.0) = 8.0;
// Dissolve direction bias: 0.0 = pure noise, 1.0 = bottom-to-top sweep
uniform float direction_bias : hint_range(0.0, 1.0) = 0.3;

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

void fragment() {
	// At full dissolve, discard everything unconditionally (avoids float precision edge cases)
	if (dissolve_amount >= 1.0) {
		discard;
	}

	vec4 tex = texture(TEXTURE, UV);

	// Sample noise at pixel-art-appropriate scale
	float noise = value_noise(UV * noise_scale);

	// Mix in vertical direction bias (bottom pixels dissolve first)
	float directional = mix(noise, 1.0 - UV.y, direction_bias);

	float threshold = dissolve_amount;

	// Discard dissolved pixels (hard cutoff avoids blurry ghosts at NEAREST upscale)
	if (directional < threshold) {
		discard;
	}

	// Edge glow: bright border on pixels about to dissolve
	float edge = 1.0 - smoothstep(threshold, threshold + edge_width, directional);
	// Kill edge glow when fully materialized so shader is a pure passthrough at 0.0
	edge *= step(0.001, dissolve_amount);

	// Blend edge glow onto surviving pixels
	vec3 final_color = mix(tex.rgb, edge_color.rgb, edge * edge_color.a);
	COLOR = vec4(final_color, tex.a);
}
