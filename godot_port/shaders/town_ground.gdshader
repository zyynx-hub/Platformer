shader_type canvas_item;

// Soil texture for the town ground surface.

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void fragment() {
	vec2 px = UV * vec2(2200.0, 200.0);
	vec2 block = floor(px / 4.0);
	float n  = hash(block);
	float n2 = hash(block + vec2(13.3, 7.1));
	float n3 = hash(block * 0.5 + vec2(3.7, 17.9));

	vec3 soil_dark  = vec3(0.235, 0.153, 0.078);  // dark warm brown #3C2713
	vec3 soil_mid   = vec3(0.353, 0.239, 0.141);  // medium warm brown #5A3C24
	vec3 soil_light = vec3(0.478, 0.322, 0.196);  // lighter warm brown #7A5232

	vec3 soil = mix(soil_dark, soil_light, n * n);

	float pebble = step(0.91, n) * step(0.85, n2);
	soil = mix(soil, vec3(0.490, 0.467, 0.435), pebble);  // warm gray pebble #7D776F

	vec2 block2 = floor(px / 2.0);
	float fine = hash(block2 + vec2(41.0, 3.0));
	float rock_detail = step(0.93, fine) * (1.0 - pebble);
	soil = mix(soil, soil_dark * 0.75, rock_detail * 0.5);

	float top_fade = clamp(1.0 - px.y / 18.0, 0.0, 1.0);
	vec2 root_block = floor(px / vec2(2.0, 9.0));
	float root = step(0.87, hash(root_block)) * top_fade;
	soil = mix(soil, vec3(0.078, 0.063, 0.043), root * 0.6);  // very dark root #140F0B

	COLOR = vec4(soil, 1.0);
}
