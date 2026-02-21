shader_type canvas_item;

// Animated glowing border with flowing energy for item acquisition popup
// Dark semi-transparent box with rounded corners, sparkles, and pulsing glow

uniform vec4 border_color : source_color = vec4(0.3, 0.7, 1.0, 1.0);
uniform vec4 accent_color : source_color = vec4(0.55, 0.35, 1.0, 1.0);
uniform vec4 bg_color : source_color = vec4(0.03, 0.03, 0.1, 0.92);
uniform float border_thickness : hint_range(0.002, 0.03) = 0.008;
uniform float glow_radius : hint_range(0.01, 0.12) = 0.045;
uniform float corner_radius : hint_range(0.01, 0.15) = 0.06;
uniform float energy_speed : hint_range(0.5, 5.0) = 2.0;
uniform float appear_progress : hint_range(0.0, 1.0) = 1.0;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Signed distance to a rounded rectangle
float rounded_box_sdf(vec2 p, vec2 b, float r) {
	vec2 q = abs(p) - b + r;
	return length(max(q, 0.0)) - r;
}

void fragment() {
	vec2 uv = UV;
	vec2 centered = uv - 0.5;

	// Rounded box SDF
	float d = rounded_box_sdf(centered, vec2(0.485, 0.44), corner_radius);

	// Background fill
	float bg_mask = smoothstep(0.002, -0.002, d);

	// Border band (hard edge + soft glow)
	float abs_d = abs(d);
	float border_hard = smoothstep(border_thickness + 0.003, border_thickness - 0.003, abs_d);
	float border_soft = smoothstep(glow_radius, 0.0, abs_d);

	// Energy flow around the perimeter (traveling light)
	float angle = atan(centered.y, centered.x);
	float flow1 = sin(angle * 4.0 - TIME * energy_speed) * 0.5 + 0.5;
	float flow2 = sin(angle * 7.0 + TIME * energy_speed * 0.6) * 0.5 + 0.5;
	float flow3 = sin(angle * 2.0 - TIME * energy_speed * 1.3) * 0.5 + 0.5;
	float energy = flow1 * 0.5 + flow2 * 0.3 + flow3 * 0.2;

	// Corner accents — brighter glow near corners
	float cx = abs(centered.x);
	float cy = abs(centered.y);
	float corner_proximity = smoothstep(0.15, 0.0, min(abs(cx - 0.485), abs(cy - 0.44)));
	float corner_glow = corner_proximity * (sin(TIME * 1.5) * 0.2 + 0.8);

	// Sparkles along the border (more frequent)
	vec2 sparkle_grid = floor(uv * 60.0);
	float sparkle_rand = hash(sparkle_grid);
	float sparkle_phase = hash(sparkle_grid + 42.0) * 6.2832;
	float sparkle = pow(max(sin(TIME * 5.0 + sparkle_phase), 0.0), 14.0);
	float near_border = smoothstep(glow_radius * 1.5, 0.0, abs_d);
	sparkle *= near_border * step(0.85, sparkle_rand);

	// Color mixing
	vec3 energy_col = mix(border_color.rgb, accent_color.rgb, corner_glow * 0.4 + energy * 0.15);
	vec3 glow_col = energy_col * (0.4 + energy * 0.6);

	// Compose layers
	vec3 col = bg_color.rgb * bg_mask;

	// Outer glow (stronger halo outside the box)
	float outer_glow = smoothstep(glow_radius * 3.0, 0.0, max(d, 0.0));
	col += energy_col * outer_glow * 0.18;

	// Soft border glow (brighter)
	col += glow_col * border_soft * 0.6;

	// Hard border line
	col += energy_col * border_hard * (0.8 + energy * 0.5);

	// Corner highlights
	col += energy_col * corner_glow * border_soft * 0.35;

	// Sparkle overlay (brighter)
	col += energy_col * sparkle * 3.0;

	// Inner light bleed (subtle glow from border inward)
	float inner_bleed = smoothstep(0.0, -0.1, d) * smoothstep(-0.18, 0.0, d);
	col += energy_col * inner_bleed * 0.08;

	// Entrance flash — intense bright burst that fades as appear_progress goes 0 to 1
	float flash_raw = 1.0 - appear_progress;
	float flash = flash_raw * flash_raw * flash_raw;  // cubic falloff for snappy pop
	col += energy_col * flash * bg_mask * 1.2;
	// Border flash extra intensity during entrance
	col += energy_col * border_soft * flash * 2.0;

	// Alpha
	float alpha = max(bg_mask * bg_color.a, border_soft * 0.75);
	alpha = max(alpha, outer_glow * 0.3);
	alpha = max(alpha, sparkle * 0.6);
	alpha *= clamp(appear_progress * 3.0, 0.0, 1.0);

	COLOR = vec4(col, alpha);
}
