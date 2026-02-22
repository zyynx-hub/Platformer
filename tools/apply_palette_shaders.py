"""Apply ENDESGA-64 palette to all town shaders."""
import os

base = r"c:\Users\Robin\Desktop\codex\godot_port\shaders"

shaders = {}

shaders["town_sky.gdshader"] = """shader_type canvas_item;

// Procedural sky that transitions through a full day/night cycle.
// time_of_day: 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset

uniform float time_of_day : hint_range(0.0, 1.0) = 0.35;
uniform float star_density : hint_range(20.0, 120.0) = 60.0;
uniform float star_brightness : hint_range(0.2, 1.5) = 0.9;
uniform float cloud_speed : hint_range(0.0, 0.1) = 0.02;

float star_hash(vec2 p) {
\treturn fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 hash2(vec2 p) {
\tp = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
\treturn -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradient_noise(vec2 p) {
\tvec2 i = floor(p);
\tvec2 f = fract(p);
\tvec2 u = f * f * (3.0 - 2.0 * f);
\treturn mix(
\t\tmix(dot(hash2(i), f),
\t\t\tdot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
\t\tmix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
\t\t\tdot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
\t\tu.y
\t);
}

float fbm(vec2 p) {
\tfloat v = 0.0;
\tfloat a = 0.5;
\tfor (int i = 0; i < 3; i++) {
\t\tv += a * gradient_noise(p);
\t\tp *= 2.0;
\t\ta *= 0.5;
\t}
\treturn v;
}

vec3 sky_top_color(float t) {
\tvec3 midnight = vec3(0.0549, 0.0275, 0.1059);
\tvec3 dawn     = vec3(0.102, 0.098, 0.1961);
\tvec3 day      = vec3(0.0, 0.5961, 0.8627);
\tvec3 dusk     = vec3(0.2235, 0.1216, 0.1294);
\tif (t < 0.15) { return midnight; }
\telse if (t < 0.25) { return mix(midnight, dawn, (t - 0.15) / 0.1); }
\telse if (t < 0.35) { return mix(dawn, day, (t - 0.25) / 0.1); }
\telse if (t < 0.65) { return day; }
\telse if (t < 0.75) { return mix(day, dusk, (t - 0.65) / 0.1); }
\telse if (t < 0.85) { return mix(dusk, midnight, (t - 0.75) / 0.1); }
\telse { return midnight; }
}

vec3 sky_bottom_color(float t) {
\tvec3 midnight = vec3(0.0549, 0.0275, 0.1059);
\tvec3 dawn     = vec3(0.5412, 0.2824, 0.2118);
\tvec3 day      = vec3(0.5804, 0.9922, 1.0);
\tvec3 dusk     = vec3(0.7765, 0.2706, 0.1412);
\tif (t < 0.15) { return midnight; }
\telse if (t < 0.25) { return mix(midnight, dawn, (t - 0.15) / 0.1); }
\telse if (t < 0.35) { return mix(dawn, day, (t - 0.25) / 0.1); }
\telse if (t < 0.65) { return day; }
\telse if (t < 0.75) { return mix(day, dusk, (t - 0.65) / 0.1); }
\telse if (t < 0.85) { return mix(dusk, midnight, (t - 0.75) / 0.1); }
\telse { return midnight; }
}

float star_visibility(float t) {
\tif (t < 0.15) { return 1.0; }
\telse if (t < 0.25) { return 1.0 - smoothstep(0.15, 0.25, t); }
\telse if (t < 0.75) { return 0.0; }
\telse if (t < 0.85) { return smoothstep(0.75, 0.85, t); }
\telse { return 1.0; }
}

float circle_sdf(vec2 uv, vec2 center, float radius) {
\treturn length(uv - center) - radius;
}

void fragment() {
\tvec2 uv = UV;
\tfloat t = time_of_day;

\tvec3 top = sky_top_color(t);
\tvec3 bottom = sky_bottom_color(t);
\tvec3 sky = mix(top, bottom, pow(uv.y, 0.5));

\t// Sun
\tfloat sun_phase = (t - 0.25) / 0.5;
\tif (sun_phase > 0.0 && sun_phase < 1.0) {
\t\tfloat sun_x = sun_phase;
\t\tfloat sun_y = 0.8 - 0.6 * (1.0 - pow(2.0 * sun_phase - 1.0, 2.0));
\t\tfloat sun_alpha = smoothstep(0.0, 0.1, sun_phase) * smoothstep(1.0, 0.9, sun_phase);
\t\tfloat d = circle_sdf(uv, vec2(sun_x, sun_y), 0.03);
\t\tfloat sun_glow = exp(-max(d, 0.0) * 30.0) * sun_alpha;
\t\tvec3 sun_color = mix(vec3(1.0, 0.6353, 0.0784), vec3(0.9765, 0.902, 0.8118), smoothstep(0.15, 0.5, sun_phase));
\t\tsky += sun_color * sun_glow * 0.8;
\t\tfloat sun_core = smoothstep(0.005, 0.0, max(d, 0.0)) * sun_alpha;
\t\tsky += vec3(0.9765, 0.902, 0.8118) * sun_core;
\t}

\t// Moon
\tfloat moon_t = t < 0.5 ? t + 1.0 : t;
\tfloat moon_phase = (moon_t - 0.75) / 0.5;
\tif (moon_phase > 0.0 && moon_phase < 1.0) {
\t\tfloat moon_x = moon_phase;
\t\tfloat moon_y = 0.8 - 0.55 * (1.0 - pow(2.0 * moon_phase - 1.0, 2.0));
\t\tfloat moon_alpha = smoothstep(0.0, 0.15, moon_phase) * smoothstep(1.0, 0.85, moon_phase);
\t\tfloat d = circle_sdf(uv, vec2(moon_x, moon_y), 0.02);
\t\tfloat d2 = circle_sdf(uv, vec2(moon_x + 0.012, moon_y - 0.005), 0.018);
\t\tfloat moon_shape = smoothstep(0.003, 0.0, max(d, 0.0)) * smoothstep(0.0, 0.003, max(d2, 0.0));
\t\tfloat moon_glow = exp(-max(d, 0.0) * 40.0) * moon_alpha * 0.3;
\t\tvec3 moon_color = vec3(0.7804, 0.8118, 0.8667);
\t\tsky += moon_color * (moon_shape * moon_alpha + moon_glow);
\t}

\t// Stars
\tfloat sv = star_visibility(t);
\tif (sv > 0.01) {
\t\tvec2 grid = floor(uv * star_density);
\t\tfloat rnd = star_hash(grid);
\t\tif (rnd > 0.96) {
\t\t\tvec2 cell_uv = fract(uv * star_density);
\t\t\tvec2 star_pos = vec2(star_hash(grid + 0.5), star_hash(grid + 1.5)) * 0.6 + 0.2;
\t\t\tfloat dist = length(cell_uv - star_pos);
\t\t\tfloat twinkle_rate = star_hash(grid + 7.0) * 4.0 + 1.0;
\t\t\tfloat twinkle_phase = star_hash(grid + 13.0) * 6.283;
\t\t\tfloat twinkle = sin(TIME * twinkle_rate + twinkle_phase) * 0.4 + 0.6;
\t\t\tfloat size = mix(0.08, 0.18, star_hash(grid + 3.0));
\t\t\tfloat star = smoothstep(size, 0.0, dist) * twinkle;
\t\t\tvec3 star_color = vec3(1.0);
\t\t\tif (rnd > 0.99) { star_color = vec3(0.7804, 0.8118, 0.8667); }
\t\t\telse if (rnd > 0.98) { star_color = vec3(0.9765, 0.902, 0.8118); }
\t\t\tsky += star_color * star * star_brightness * sv;
\t\t}
\t}

\t// Thin cloud wisps
\tfloat cloud_mask = smoothstep(0.8, 0.3, uv.y);
\tfloat n = fbm(vec2(uv.x * 4.0 + TIME * cloud_speed, uv.y * 2.0));
\tfloat cloud = smoothstep(0.1, 0.4, n) * cloud_mask * 0.15;
\tvec3 cloud_color = mix(vec3(0.1647, 0.1843, 0.3059), vec3(0.7804, 0.8118, 0.8667), smoothstep(0.15, 0.35, t) * smoothstep(0.85, 0.65, t));
\tsky = mix(sky, cloud_color, cloud);

\tCOLOR = vec4(sky, 1.0);
}
"""

shaders["town_mountains.gdshader"] = """shader_type canvas_item;

uniform float time_of_day : hint_range(0.0, 1.0) = 0.35;
uniform float base_height : hint_range(0.1, 0.8) = 0.4;
uniform float amplitude : hint_range(0.02, 0.3) = 0.12;
uniform float block_freq : hint_range(5.0, 80.0) = 20.0;
uniform vec4 day_color : source_color = vec4(0.2588, 0.298, 0.4314, 1.0);
uniform vec4 night_color : source_color = vec4(0.0549, 0.0275, 0.1059, 1.0);
uniform vec4 dawn_color : source_color = vec4(0.3647, 0.1725, 0.1569, 1.0);
uniform vec4 dusk_color : source_color = vec4(0.3412, 0.1098, 0.1529, 1.0);

float terrain_hash(float p) {
\treturn fract(sin(p * 127.1) * 43758.5453);
}

float smooth_terrain(float x, float base, float amp, float freq) {
\tfloat qx = floor(x * freq);
\tfloat fx = fract(x * freq);
\tfloat t = fx * fx * (3.0 - 2.0 * fx);
\tfloat h0 = base + (terrain_hash(qx) - 0.5) * amp
\t\t+ (terrain_hash(qx * 2.0 + 73.0) - 0.5) * amp * 0.4
\t\t+ (terrain_hash(qx * 3.0 + 137.0) - 0.5) * amp * 0.15;
\tfloat h1 = base + (terrain_hash(qx + 1.0) - 0.5) * amp
\t\t+ (terrain_hash((qx + 1.0) * 2.0 + 73.0) - 0.5) * amp * 0.4
\t\t+ (terrain_hash((qx + 1.0) * 3.0 + 137.0) - 0.5) * amp * 0.15;
\treturn mix(h0, h1, t);
}

vec4 time_color(float t) {
\tif (t < 0.15) { return night_color; }
\telse if (t < 0.25) { return mix(night_color, dawn_color, (t - 0.15) / 0.1); }
\telse if (t < 0.35) { return mix(dawn_color, day_color, (t - 0.25) / 0.1); }
\telse if (t < 0.65) { return day_color; }
\telse if (t < 0.75) { return mix(day_color, dusk_color, (t - 0.65) / 0.1); }
\telse if (t < 0.85) { return mix(dusk_color, night_color, (t - 0.75) / 0.1); }
\telse { return night_color; }
}

void fragment() {
\tvec2 uv = UV;
\tfloat height = smooth_terrain(uv.x, base_height, amplitude, block_freq);
\tfloat mountain_line = 1.0 - height;
\tif (uv.y > mountain_line) {
\t\tvec4 col = time_color(time_of_day);
\t\tfloat grad = smoothstep(mountain_line, 1.0, uv.y);
\t\tcol.rgb *= mix(1.0, 0.7, grad);
\t\tCOLOR = col;
\t} else {
\t\tCOLOR = vec4(0.0, 0.0, 0.0, 0.0);
\t}
}
"""

shaders["town_clouds.gdshader"] = """shader_type canvas_item;

uniform float time_of_day : hint_range(0.0, 1.0) = 0.35;
uniform float drift_speed : hint_range(0.0, 0.05) = 0.008;
uniform float density : hint_range(0.0, 1.0) = 0.4;
uniform float softness : hint_range(0.05, 0.5) = 0.15;
uniform float weather_darken : hint_range(0.0, 1.0) = 0.0;

vec2 hash2(vec2 p) {
\tp = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
\treturn -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradient_noise(vec2 p) {
\tvec2 i = floor(p);
\tvec2 f = fract(p);
\tvec2 u = f * f * (3.0 - 2.0 * f);
\treturn mix(
\t\tmix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
\t\tmix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
\t\tu.y
\t);
}

float fbm(vec2 p) {
\tfloat v = 0.0; float a = 0.5;
\tfor (int i = 0; i < 4; i++) { v += a * gradient_noise(p); p *= 2.0; a *= 0.5; }
\treturn v;
}

vec3 cloud_color(float t) {
\tvec3 midnight = vec3(0.102, 0.098, 0.1961);
\tvec3 dawn     = vec3(0.902, 0.6118, 0.4118);
\tvec3 day      = vec3(1.0, 1.0, 1.0);
\tvec3 dusk     = vec3(0.749, 0.4353, 0.2902);
\tif (t < 0.15) { return midnight; }
\telse if (t < 0.25) { return mix(midnight, dawn, (t - 0.15) / 0.1); }
\telse if (t < 0.35) { return mix(dawn, day, (t - 0.25) / 0.1); }
\telse if (t < 0.65) { return day; }
\telse if (t < 0.75) { return mix(day, dusk, (t - 0.65) / 0.1); }
\telse if (t < 0.85) { return mix(dusk, midnight, (t - 0.75) / 0.1); }
\telse { return midnight; }
}

void fragment() {
\tvec2 uv = UV;
\tfloat drift = TIME * drift_speed;
\tvec2 cloud_uv = vec2(uv.x * 3.0 + drift, uv.y * 1.5);
\tfloat n = fbm(cloud_uv);
\tfloat threshold = 1.0 - density;
\tfloat cloud = smoothstep(threshold - softness, threshold + softness, n * 0.5 + 0.5);
\tfloat edge_mask = smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.7, uv.y);
\tcloud *= edge_mask;
\tvec3 col = cloud_color(time_of_day);
\tfloat detail = fbm(cloud_uv * 2.0 + 50.0) * 0.15;
\tcol += detail;
\tvec3 storm_col = mix(col, vec3(0.3647, 0.3647, 0.3647), weather_darken * 0.7);
\tfloat storm_alpha = mix(0.6, 0.85, weather_darken);
\tCOLOR = vec4(storm_col, cloud * storm_alpha);
}
"""

shaders["town_ground.gdshader"] = """shader_type canvas_item;

// Soil texture for the town ground surface.

float hash(vec2 p) {
\treturn fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void fragment() {
\tvec2 px = UV * vec2(2200.0, 200.0);
\tvec2 block = floor(px / 4.0);
\tfloat n  = hash(block);
\tfloat n2 = hash(block + vec2(13.3, 7.1));
\tfloat n3 = hash(block * 0.5 + vec2(3.7, 17.9));

\tvec3 soil_dark  = vec3(0.2235, 0.1216, 0.1294);
\tvec3 soil_mid   = vec3(0.2235, 0.1216, 0.1294);
\tvec3 soil_light = vec3(0.3647, 0.1725, 0.1569);

\tvec3 soil = mix(soil_dark, soil_light, n * n);

\tfloat pebble = step(0.91, n) * step(0.85, n2);
\tsoil = mix(soil, vec3(0.3647, 0.3647, 0.3647), pebble);

\tvec2 block2 = floor(px / 2.0);
\tfloat fine = hash(block2 + vec2(41.0, 3.0));
\tfloat rock_detail = step(0.93, fine) * (1.0 - pebble);
\tsoil = mix(soil, vec3(0.2235, 0.1216, 0.1294), rock_detail * 0.5);

\tfloat top_fade = clamp(1.0 - px.y / 18.0, 0.0, 1.0);
\tvec2 root_block = floor(px / vec2(2.0, 9.0));
\tfloat root = step(0.87, hash(root_block)) * top_fade;
\tsoil = mix(soil, vec3(0.0745, 0.0745, 0.0745), root * 0.6);

\tCOLOR = vec4(soil, 1.0);
}
"""

shaders["streetlight_glow.gdshader"] = """shader_type canvas_item;
render_mode blend_add;

uniform float brightness : hint_range(0.0, 1.0) = 0.0;
uniform vec4 light_color : source_color = vec4(0.9647, 0.7922, 0.6235, 1.0);
uniform float flicker_amount : hint_range(0.0, 0.15) = 0.04;

float lamp_hash(float p) {
\treturn fract(sin(p * 127.1) * 43758.5453);
}

void fragment() {
\tvec2 uv = UV;
\tfloat cone_width = mix(0.05, 0.5, uv.y);
\tfloat dist_from_center = abs(uv.x - 0.5) / cone_width;
\tfloat vertical = 1.0 - uv.y;
\tvertical = vertical * vertical;
\tfloat cone = smoothstep(1.0, 0.3, dist_from_center) * vertical;
\tfloat bulb_dist = length(uv - vec2(0.5, 0.02));
\tfloat bulb = exp(-bulb_dist * 25.0) * 0.6;
\tfloat flicker = 1.0 - flicker_amount * sin(TIME * 8.0 + lamp_hash(TIME * 0.1) * 6.283);
\tfloat intensity = (cone + bulb) * brightness * flicker;
\tCOLOR = vec4(light_color.rgb * intensity, intensity * 0.7);
}
"""

shaders["night_overlay.gdshader"] = """shader_type canvas_item;

uniform float darkness : hint_range(0.0, 0.8) = 0.0;
uniform vec4 night_tint : source_color = vec4(0.102, 0.098, 0.1961, 1.0);

void fragment() {
\tCOLOR = vec4(night_tint.rgb, darkness);
}
"""

shaders["rain.gdshader"] = """shader_type canvas_item;

uniform float intensity : hint_range(0.0, 1.0) = 0.6;
uniform float speed : hint_range(50.0, 500.0) = 220.0;
uniform float wind : hint_range(-0.4, 0.4) = 0.12;
uniform float drop_len : hint_range(2.0, 12.0) = 5.0;
uniform vec3 drop_tint : source_color = vec3(0.7804, 0.8118, 0.8667);

float hash21(vec2 p) {
\tp = fract(p * vec2(123.34, 456.21));
\tp += dot(p, p + 45.32);
\treturn fract(p.x * p.y);
}

void fragment() {
\tvec2 res = vec2(426.0, 240.0);
\tvec2 px = UV * res;
\tfloat alpha = 0.0;
\tfor (int layer = 0; layer < 3; layer++) {
\t\tfloat fl = float(layer);
\t\tfloat lspeed = speed * (1.2 - fl * 0.2);
\t\tfloat col_w = 5.0 + fl * 3.0;
\t\tfloat lalpha = 0.5 - fl * 0.12;
\t\tfloat ldrop = drop_len * (1.0 - fl * 0.15);
\t\tvec2 p = px;
\t\tp.x += wind * p.y;
\t\tp.y -= TIME * lspeed;
\t\tfloat col = floor(p.x / col_w);
\t\tfloat fx = p.x - col * col_w;
\t\tfloat x_pos = hash21(vec2(col, fl * 37.0)) * (col_w - 1.0) + 0.5;
\t\tfloat cell_h = res.y * 0.4 + fl * 20.0;
\t\tfloat row = floor(p.y / cell_h);
\t\tfloat fy = p.y - row * cell_h;
\t\tfloat rnd = hash21(vec2(col, row + fl * 100.0));
\t\tfloat show = step(rnd, intensity);
\t\tfloat in_x = step(abs(fx - x_pos), 0.6);
\t\tfloat in_y = smoothstep(0.0, 1.0, fy) * step(fy, ldrop);
\t\talpha += in_x * in_y * lalpha * show;
\t}
\tCOLOR = vec4(drop_tint, clamp(alpha, 0.0, 0.6));
}
"""

shaders["snow.gdshader"] = """shader_type canvas_item;

uniform float intensity : hint_range(0.0, 1.0) = 0.5;
uniform float fall_speed : hint_range(10.0, 100.0) = 35.0;
uniform float drift : hint_range(0.0, 30.0) = 12.0;
uniform vec3 flake_tint : source_color = vec3(1.0, 1.0, 1.0);

float hash21(vec2 p) {
\tp = fract(p * vec2(123.34, 456.21));
\tp += dot(p, p + 45.32);
\treturn fract(p.x * p.y);
}

void fragment() {
\tvec2 res = vec2(426.0, 240.0);
\tvec2 px = UV * res;
\tfloat alpha = 0.0;
\tfor (int layer = 0; layer < 4; layer++) {
\t\tfloat fl = float(layer);
\t\tfloat lspeed = fall_speed * (0.6 + fl * 0.2);
\t\tfloat ldrift = drift * (0.8 + fl * 0.15);
\t\tfloat cell_size = 8.0 + fl * 6.0;
\t\tfloat flake_r = 0.8 + fl * 0.3;
\t\tfloat lalpha = 0.6 - fl * 0.1;
\t\tvec2 p = px;
\t\tp.y -= TIME * lspeed;
\t\tfloat drift_phase = TIME * (0.4 + fl * 0.15) + fl * 1.7;
\t\tp.x += sin(drift_phase + p.y * 0.02) * ldrift;
\t\tvec2 cell = floor(p / cell_size);
\t\tvec2 fp = p - cell * cell_size;
\t\tfloat rnd = hash21(cell + fl * 77.0);
\t\tfloat show = step(rnd, intensity);
\t\tvec2 flake_pos = vec2(hash21(cell + vec2(fl * 13.0, 0.0)), hash21(cell + vec2(0.0, fl * 29.0))) * (cell_size - 2.0) + 1.0;
\t\tfloat dist = length(fp - flake_pos);
\t\tfloat flake = smoothstep(flake_r, flake_r - 0.5, dist);
\t\talpha += flake * lalpha * show;
\t}
\tCOLOR = vec4(flake_tint, clamp(alpha, 0.0, 0.5));
}
"""

shaders["rain_puddles.gdshader"] = """shader_type canvas_item;

uniform float accumulation : hint_range(0.0, 1.0) = 0.0;
uniform vec3 wet_tint : source_color = vec3(0.1059, 0.1059, 0.1059);
uniform vec3 puddle_tint : source_color = vec3(0.2588, 0.298, 0.4314);

float hash21(vec2 p) {
\tp = fract(p * vec2(123.34, 456.21));
\tp += dot(p, p + 45.32);
\treturn fract(p.x * p.y);
}

float value_noise(vec2 p) {
\tvec2 i = floor(p); vec2 f = fract(p);
\tf = f * f * (3.0 - 2.0 * f);
\treturn mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

void fragment() {
\tvec2 uv = UV;
\tvec2 px = uv * vec2(220.0, 8.0);
\tfloat puddle_noise = value_noise(px * 0.3);
\tfloat wet_noise = value_noise(px * 0.8 + 50.0);
\tfloat puddle_threshold = 1.0 - accumulation * 0.9;
\tfloat puddle = smoothstep(puddle_threshold, puddle_threshold + 0.08, puddle_noise);
\tfloat wet_threshold = 1.0 - accumulation * 1.2;
\tfloat wet = clamp(smoothstep(wet_threshold, wet_threshold + 0.15, wet_noise), 0.0, 1.0);
\tvec3 col = mix(wet_tint, puddle_tint, puddle * 0.6);
\tfloat alpha = max(wet * 0.4, puddle * 0.6) * smoothstep(0.0, 0.15, accumulation);
\talpha *= smoothstep(1.0, 0.3, uv.y);
\tCOLOR = vec4(col, alpha);
}
"""

shaders["snow_ground.gdshader"] = """shader_type canvas_item;

uniform float accumulation : hint_range(0.0, 1.0) = 0.0;
uniform vec3 snow_color : source_color = vec3(1.0, 1.0, 1.0);
uniform vec3 snow_shadow : source_color = vec3(0.7804, 0.8118, 0.8667);

float hash21(vec2 p) {
\tp = fract(p * vec2(123.34, 456.21));
\tp += dot(p, p + 45.32);
\treturn fract(p.x * p.y);
}

float value_noise(vec2 p) {
\tvec2 i = floor(p); vec2 f = fract(p);
\tf = f * f * (3.0 - 2.0 * f);
\treturn mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

void fragment() {
\tvec2 uv = UV;
\tvec2 px = uv * vec2(220.0, 12.0);
\tfloat edge_noise = value_noise(vec2(px.x * 0.4, 0.0)) * 0.4 + value_noise(vec2(px.x * 1.2, 5.0)) * 0.15;
\tfloat snow_height = accumulation * 0.85 + edge_noise * accumulation;
\tfloat snow_mask = smoothstep(snow_height, snow_height - 0.06, 1.0 - uv.y);
\tfloat detail = value_noise(px * 1.5 + 30.0);
\tvec3 col = mix(snow_shadow, snow_color, detail * 0.5 + 0.5);
\tfloat sparkle = step(0.92, hash21(floor(px * 2.0)));
\tcol += sparkle * 0.15 * accumulation;
\tfloat alpha = snow_mask * smoothstep(0.0, 0.1, accumulation);
\tCOLOR = vec4(col, alpha);
}
"""

for fname, content in shaders.items():
    path = os.path.join(base, fname)
    with open(path, "w", newline="\n") as f:
        f.write(content.lstrip("\n"))
    print(f"  wrote {fname}")

print("All shaders done.")
