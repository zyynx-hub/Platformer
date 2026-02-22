shader_type canvas_item;

uniform float darkness : hint_range(0.0, 0.8) = 0.0;
uniform vec4 night_tint : source_color = vec4(0.055, 0.043, 0.212, 1.0);  // deep indigo #0E0B36

void fragment() {
	COLOR = vec4(night_tint.rgb, darkness);
}
