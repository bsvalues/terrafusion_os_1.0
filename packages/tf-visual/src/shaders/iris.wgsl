// TerraFusion Iris Shader (WebGPU)
// Adaptive aperture that opens/closes with system focus metric

struct IrisUniforms {
  time: f32,
  aperture: f32,  // 0..1 (0=closed, 1=fully open)
}

@group(0) @binding(0) var<uniform> u: IrisUniforms;

@fragment
fn fs_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = (pos.xy - vec2(960.0, 540.0)) / 540.0; // normalized
  let dist = length(uv);
  let angle = atan2(uv.y, uv.x);
  
  // Iris parameters
  let iris_radius = 0.35;
  let pupil_radius = iris_radius * (1.0 - u.aperture * 0.7); // contracts when open
  
  // Iris pattern (geometric petals)
  let petals = 8.0;
  let petal_angle = angle * petals + u.time * 0.2;
  let petal_wave = sin(petal_angle) * 0.03;
  
  // Iris ring
  let iris_dist = abs(dist - iris_radius - petal_wave);
  let iris_glow = smoothstep(0.02, 0.0, iris_dist);
  
  // Pupil
  let pupil_mask = smoothstep(pupil_radius + 0.01, pupil_radius - 0.01, dist);
  
  // Colors
  let iris_color = vec3(0.0, 1.0, 0.933); // transcend cyan
  let pupil_color = vec3(0.0, 0.2, 0.3);  // dark
  
  // Combine
  let color = mix(pupil_color, iris_color, iris_glow);
  let alpha = pupil_mask * 0.6 + iris_glow * 0.9;
  
  // Subtle shimmer
  let shimmer = sin(angle * 12.0 + u.time * 3.0) * 0.05 + 0.95;
  
  return vec4(color * shimmer, alpha);
}

