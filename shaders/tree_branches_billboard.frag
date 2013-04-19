uniform sampler2D color_map, normal_map;
uniform vec3 ref_dir         = vec3(0,1,0);
uniform vec2 normal_tc_off   = vec2(0,0);
uniform vec2 normal_tc_scale = vec2(1,1);

varying vec4 world_space_pos, eye_space_pos;

void main()
{
	vec2 tc_scaled = normal_tc_scale*gl_TexCoord[0].st;
	vec4 texel = texture2D(color_map, tc_scaled);
	if (texel.a < 0.5) discard; // transparent
	check_noise_and_maybe_discard(0.0, gl_Color.a);

	// transform normal into billboard orientation 
	vec3 normal = 2.0*texture2D(normal_map, (tc_scaled + normal_tc_off)).xyz - vec3(1,1,1);
	normal.y   *= -1.0; // texture is rendered with ybot < ytop
	vec4 eye    = gl_ModelViewMatrixInverse[3]; // world space
	vec3 vdir   = normalize(eye.xyz - world_space_pos.xyz);
	float angle = acos(dot(normalize(ref_dir.xy), normalize(vdir.xy)));
	if (cross(vdir, ref_dir).z < 0.0) {angle = -angle;} // rotate the other direction
	mat3 mrot   = mat3(cos(angle), -sin(angle), 0.0,
			           sin(angle),  cos(angle), 0.0,
			           0.0,         0.0,        1.0);
	normal      = mrot * normal;
	normal      = normalize(gl_NormalMatrix * normal); // convert to eye space
	
	vec4 color  = gl_Color * gl_LightModel.ambient;
	if (enable_light0) color += add_light_comp(normal, 0);
	if (enable_light1) color += add_light_comp(normal, 1);
	if (enable_light2) color += add_light_comp(normal, 2) * calc_light_atten(eye_space_pos, 2);
	gl_FragColor = apply_fog(clamp(color, 0.0, 1.0)*vec4(texel.rgb, 1.0));
}
