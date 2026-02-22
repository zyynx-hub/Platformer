shader_type canvas_item;

uniform float intensity : hint_range(0.0, 1.0) = 0.6;
uniform float speed : hint_range(50.0, 500.0) = 220.0;
uniform float wind : hint_range(-0.5, 0.5) = 0.15;
uniform float drop_len : hint_range(3.0, 20.0) = 9.0;
uniform vec3 drop_tint : source_color = vec3(0.784, 0.816, 0.867);

float hash(float n) {
	return fract(sin(n * 127.1) * 43758.5453);
}

float hash2(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void fragment() {
	vec2 res = vec2(426.0, 240.0);
	vec2 px = UV * res;
	float alpha = 0.0;

	// 4 parallax layers: layer 0 = distant/faint, layer 3 = near/bright
	for (int layer = 0; layer < 4; layer++) {
		float fl = float(layer);

		float lspeed = speed * (0.45 + fl * 0.20);     // near layers fall faster
		float col_w  = 5.0  - fl * 0.5;                // all similar width
		float lalpha = 0.22 + fl * 0.10;               // near layers more opaque
		float ldrop  = drop_len * (0.35 + fl * 0.22);  // near = longer drops
		float lwind  = wind * (0.25 + fl * 0.28);      // near = stronger shear

		vec2 p = px;
		p.x += lwind * p.y;  // diagonal rain angle
		p.y -= TIME * lspeed;

		float col = floor(p.x / col_w);
		float fx  = fract(p.x / col_w) * col_w;

		// Random gap length per column — breaks up uniform spacing
		float gap_mult = 2.5 + hash(col * 17.3 + fl * 5.1) * 4.5;
		float cycle = ldrop + ldrop * gap_mult;

		float fy  = mod(p.y, cycle);
		float row = floor(p.y / cycle);

		// x offset varies per (col, row) pair — no more vertical streak lines
		float x_rand = hash2(vec2(col + row * 0.37, fl * 31.0 + row * 0.71));
		float x_pos  = x_rand * (col_w - 1.0) + 0.5;

		// Randomly skip drops based on intensity
		float rnd  = hash2(vec2(col * 1.3 + fl, row + fl * 100.0));
		float show = step(1.0 - intensity, rnd);

		// X: 1px-wide streak with soft edges
		float in_x = 1.0 - smoothstep(0.25, 0.85, abs(fx - x_pos));

		// Y: fy=0 = tail (top/faint), fy=ldrop = head (bottom/bright)
		// Drops fall downward, so head is the leading lower edge
		float in_y = 0.0;
		if (fy < ldrop) {
			float t = fy / ldrop;      // 0 = tail, 1 = head
			in_y = pow(t, 0.65);       // bright at head, fades smoothly to tail
		}

		alpha += in_x * in_y * lalpha * show;
	}

	COLOR = vec4(drop_tint, clamp(alpha, 0.0, 0.85));
}
