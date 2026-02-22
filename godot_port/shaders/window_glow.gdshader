shader_type canvas_item;
render_mode blend_add;

// Radial glow centered at UV (0.5, 0.5).
// Modulate.a drives overall brightness (set by House.gd set_brightness()).

void fragment() {
	vec2 uv = UV - vec2(0.5);
	float dist = length(uv) * 2.0;   // 0.0 = center, 1.0 = edge
	float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
	alpha *= alpha;                   // concentrate falloff toward center
	COLOR = vec4(1.0, 0.792, 0.314, alpha);  // warm amber-gold
}
