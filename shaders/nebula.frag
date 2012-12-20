uniform sampler3D noise_tex;
uniform float noise_scale = 1.0;
uniform vec4 color1, color2, color3;
uniform vec3 view_dir;
uniform float radius;
uniform float offset = 0.0;
varying vec3 normal, vertex; // local object space

// Note: the nebula center is always assumed to be at 0,0,0 in local object space
void main()
{
	vec4 color = color1;

	if (!line_mode) {
		float dist = length(vertex)/radius; // 0 at center, 1 at edge
		if (dist > 1.0) discard;
		vec3  pos  = vertex + vec3(offset, offset, offset);
		vec4  val  = vec4(0,0,0,0);
		float freq = 1.0;

		for (int i = 0; i < NUM_OCTAVES; ++i) {
			val  += texture3D(noise_tex, noise_scale*(freq*pos))/freq;
			freq *= 2.0;
		}
		val      = clamp(2.0*(0.5*val-0.4), 0.0, 1.0);
		color.a *= val.a;
		color    = mix(color, color2, abs(val.r - val.g));
		color    = mix(color, color3, abs(val.r - val.b));
		color.a *= clamp((1.0 - dist), 0.0, 1.0); // attenuate near edges to create a spherical shape
	}
	color.a *= clamp((1.5*abs(dot(normal, view_dir)) - 0.5), 0.0, 1.0); // attenuate billboards not facing the camera
	gl_FragColor = color;
}
