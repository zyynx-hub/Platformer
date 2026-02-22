shader_type canvas_item;

uniform float accumulation : hint_range(0.0, 1.0) = 0.0;
uniform vec3 wet_tint : source_color = vec3(0.1059, 0.1059, 0.1059);
uniform vec3 puddle_tint : source_color = vec3(0.2588, 0.298, 0.4314);

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float value_noise(vec2 p) {
	vec2 i = floor(p); vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

void fragment() {
	vec2 uv = UV;
	vec2 px = uv * vec2(220.0, 8.0);
	float puddle_noise = value_noise(px * 0.3);
	float wet_noise = value_noise(px * 0.8 + 50.0);
	float puddle_threshold = 1.0 - accumulation * 0.9;
	float puddle = smoothstep(puddle_threshold, puddle_threshold + 0.08, puddle_noise);
	float wet_threshold = 1.0 - accumulation * 1.2;
	float wet = clamp(smoothstep(wet_threshold, wet_threshold + 0.15, wet_noise), 0.0, 1.0);
	vec3 col = mix(wet_tint, puddle_tint, puddle * 0.6);
	float alpha = max(wet * 0.4, puddle * 0.6) * smoothstep(0.0, 0.15, accumulation);
	alpha *= smoothstep(1.0, 0.3, uv.y);
	COLOR = vec4(col, alpha);
}
