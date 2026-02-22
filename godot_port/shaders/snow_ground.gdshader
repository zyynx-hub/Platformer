shader_type canvas_item;

uniform float accumulation : hint_range(0.0, 1.0) = 0.0;
uniform vec3 snow_color : source_color = vec3(1.0, 1.0, 1.0);
uniform vec3 snow_shadow : source_color = vec3(0.7804, 0.8118, 0.8667);

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
	vec2 px = uv * vec2(220.0, 6.0);  // overlay is now 6px tall (-6 to 0)
	float edge_noise = value_noise(vec2(px.x * 0.4, 0.0)) * 0.4 + value_noise(vec2(px.x * 1.2, 5.0)) * 0.15;
	// Max pile: ~3px above ground at full accumulation; noise adds organic edge variation
	float snow_height = accumulation * 0.50 + edge_noise * accumulation * 0.25;
	float snow_mask = smoothstep(snow_height, snow_height - 0.06, 1.0 - uv.y);
	float detail = value_noise(px * 1.5 + 30.0);
	vec3 col = mix(snow_shadow, snow_color, detail * 0.5 + 0.5);
	float sparkle = step(0.92, hash21(floor(px * 2.0)));
	col += sparkle * 0.15 * accumulation;
	float alpha = snow_mask * smoothstep(0.0, 0.1, accumulation);
	COLOR = vec4(col, alpha);
}
