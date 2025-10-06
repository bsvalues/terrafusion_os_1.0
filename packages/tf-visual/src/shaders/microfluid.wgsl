// TerraFusion Micro-Fluid Shader (WebGPU)
// φ-governed flow field with adaptive glow based on system load

struct Uniforms {
  time: f32,
  flowIntensity: f32,  // 0..1 from CPU/NET metrics
  baseGlow: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

@fragment
fn fs_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = (pos.xy - vec2(960.0, 540.0)) / 540.0; // normalized -1..1
  let t = u.time;
  
  // φ-based flow field (golden ratio = 1.618)
  let phi = 1.618033988749;
  let flow_x = sin(uv.x * phi + t * 0.3) * cos(uv.y * phi * 0.7 + t * 0.2);
  let flow_y = cos(uv.x * phi * 0.6 + t * 0.25) * sin(uv.y * phi + t * 0.15);
  
  // Distort UV with flow
  let flow = vec2(flow_x, flow_y) * u.flowIntensity * 0.12;
  let uv2 = uv + flow;
  
  // Layered noise for micro-turbulence
  let noise1 = fract(sin(dot(uv2 * 4.5 + t * 0.08, vec2(12.9898, 78.233))) * 43758.5453);
  let noise2 = fract(sin(dot(uv2 * 8.7 + t * 0.15, vec2(94.673, 47.281))) * 23421.631);
  
  // Combine for turbulent glow
  let turbulence = (noise1 * 0.6 + noise2 * 0.4) * u.flowIntensity;
  
  // Base colors (TerraFusion brand)
  let transcend_cyan = vec3(0.0, 1.0, 0.933); // #00ffee
  let trust_blue = vec3(0.0, 0.6, 1.0);       // #0099ff
  
  // Mix based on flow + turbulence
  let color_mix = mix(trust_blue, transcend_cyan, flow_x * 0.5 + 0.5);
  let intensity = u.baseGlow + turbulence * 0.4;
  
  // Distance fade from center
  let dist = length(uv);
  let radial_fade = smoothstep(1.4, 0.3, dist);
  
  // Final color with glow
  let final_color = color_mix * intensity * radial_fade;
  
  // Subtle vignette
  let vignette = 1.0 - dist * 0.3;
  
  return vec4(final_color * vignette, 0.8); // slight transparency for layering
}

