// TerraFusion Depth-of-Field Shader (WebGPU)
// φ-governed blur that adapts to focus metric

struct DoFUniforms {
  blurRadius: f32,  // in pixels
}

@group(0) @binding(0) var<uniform> u: DoFUniforms;
@group(0) @binding(1) var colorTex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

@fragment
fn fs_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let texSize = vec2<f32>(textureDimensions(colorTex));
  let uv = pos.xy / texSize;
  
  // Simple box blur with φ-based sampling pattern
  let phi = 1.618033988749;
  let blurPx = u.blurRadius;
  let texelSize = 1.0 / texSize;
  
  var accum = vec4(0.0);
  var weight_sum = 0.0;
  
  // Multi-tap blur (16 samples in φ-spiral pattern)
  for (var i = 0; i < 16; i = i + 1) {
    let angle = f32(i) * phi * 2.0 * 3.14159;
    let radius = sqrt(f32(i) / 16.0) * blurPx;
    let offset = vec2(cos(angle), sin(angle)) * radius * texelSize;
    
    let sample = textureSample(colorTex, samp, uv + offset);
    let weight = 1.0;
    accum = accum + sample * weight;
    weight_sum = weight_sum + weight;
  }
  
  return accum / weight_sum;
}

