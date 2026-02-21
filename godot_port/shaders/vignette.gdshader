shader_type canvas_item;

// Soft warm vignette — gentle edge darkening with a warm tint
uniform float strength : hint_range(0.0, 1.5) = 0.45;
uniform float softness : hint_range(0.1, 2.0) = 0.55;
uniform float radius : hint_range(0.1, 1.0) = 0.55;
uniform vec4 tint : source_color = vec4(0.15, 0.05, 0.1, 1.0);

void fragment() {
	vec2 uv = UV - 0.5;
	float dist = length(uv);
	float vignette = smoothstep(radius - softness * 0.5, radius + softness * 0.5, dist);
	COLOR = vec4(tint.rgb, vignette * strength);
}
