shader_type canvas_item;
render_mode blend_add;

uniform float brightness : hint_range(0.0, 1.0) = 0.0;
uniform vec4 light_color : source_color = vec4(1.0, 0.792, 0.380, 1.0);  // warm amber-gold #FFCA61
uniform float flicker_amount : hint_range(0.0, 0.15) = 0.04;

float lamp_hash(float p) {
	return fract(sin(p * 127.1) * 43758.5453);
}

void fragment() {
	vec2 uv = UV;
	float cone_width = mix(0.05, 0.5, uv.y);
	float dist_from_center = abs(uv.x - 0.5) / cone_width;
	float vertical = 1.0 - uv.y;
	vertical = vertical * vertical;
	float cone = smoothstep(1.0, 0.3, dist_from_center) * vertical;
	float bulb_dist = length(uv - vec2(0.5, 0.02));
	float bulb = exp(-bulb_dist * 25.0) * 0.6;
	float flicker = 1.0 - flicker_amount * sin(TIME * 8.0 + lamp_hash(TIME * 0.1) * 6.283);
	float intensity = (cone + bulb) * brightness * flicker;
	COLOR = vec4(light_color.rgb * intensity, intensity * 0.7);
}
