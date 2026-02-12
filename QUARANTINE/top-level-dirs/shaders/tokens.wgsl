// TerraFusion WGSL Shader Token Constants
// "Government. Transcended."
// Auto-generated from design/tokens.json

struct TerraTokens {
    blur_radius: f32,
    glow_intensity: f32,
    pulse_speed: f32,
}

// Canonical shader constants derived from design tokens
const TERRA_TOKENS: TerraTokens = TerraTokens(
    20.0,   // blur_radius: Glass morphism backdrop blur
    0.50,   // glow_intensity: Transcendence glow strength
    3.00,   // pulse_speed: Transcendence pulse animation (seconds)
);

// TerraFusion Brand Colors (from tokens.colors)
const TRUST_BLUE: vec4<f32> = vec4<f32>(0.0, 0.600, 1.0, 1.0);        // #0099ff
const TRANSCEND_CYAN: vec4<f32> = vec4<f32>(0.0, 1.0, 0.933, 1.0);    // #00ffee
const SUCCESS_GREEN: vec4<f32> = vec4<f32>(0.0, 1.0, 0.667, 1.0);     // #00ffaa
const DEEP_SPACE: vec4<f32> = vec4<f32>(0.043, 0.063, 0.125, 1.0);    // #0b1020
const MIDNIGHT: vec4<f32> = vec4<f32>(0.102, 0.122, 0.227, 1.0);      // #1a1f3a
const ALERT_RED: vec4<f32> = vec4<f32>(1.0, 0.267, 0.267, 1.0);       // #ff4444
const CAUTION_AMBER: vec4<f32> = vec4<f32>(1.0, 0.667, 0.0, 1.0);     // #ffaa00
const WHITE: vec4<f32> = vec4<f32>(1.0, 1.0, 1.0, 1.0);               // #ffffff

// Clarity Gradient (3-stop)
const CLARITY_START: vec4<f32> = TRUST_BLUE;                          // #0099ff
const CLARITY_MID: vec4<f32> = TRANSCEND_CYAN;                        // #00ffee
const CLARITY_END: vec4<f32> = SUCCESS_GREEN;                         // #00ffaa

// Geometry constants
const BORDER_RADIUS_SM: f32 = 6.0;         // Small corners
const BORDER_RADIUS_MD: f32 = 12.0;        // Medium corners
const BORDER_RADIUS_LG: f32 = 24.0;        // Large corners
const BORDER_RADIUS_FULL: f32 = 999.0;     // Fully rounded

// Glow effects
const GLOW_TRANSCEND_RADIUS: f32 = 40.0;   // Transcendence glow
const GLOW_CLARITY_RADIUS: f32 = 60.0;     // Clarity glow
const GLOW_SUCCESS_RADIUS: f32 = 30.0;     // Success glow

// Motion constants (converted to seconds)
const DURATION_MICRO: f32 = 0.150;         // 150ms - Micro interactions
const DURATION_QUICK: f32 = 0.300;         // 300ms - Quick transitions
const DURATION_NORMAL: f32 = 0.500;        // 500ms - Normal transitions
const DURATION_SLOW: f32 = 0.800;          // 800ms - Slow transitions
const DURATION_PAGE: f32 = 1.200;          // 1200ms - Page transitions
