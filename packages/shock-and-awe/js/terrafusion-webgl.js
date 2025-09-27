/**
 * Terrafusion Official WebGL Effects System
 * Government. Transcended. Visually.
 */

class TerraFusionWebGL {
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.startTime = Date.now();
    this.frameCount = 0;
    this.lastTime = 0;
    this.mouse = { x: 0.5, y: 0.5 };

    this.stats = {
      fps: 60,
      drawCalls: 0,
      gpuTime: 0,
    };

    this.init();
  }

  init() {
    console.log('🏆 Initializing Terrafusion WebGL System...');

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;

    // Add to WebGL container
    const container = document.getElementById('webgl-background');
    if (container) {
      container.appendChild(this.canvas);
    } else {
      document.body.appendChild(this.canvas);
    }

    // Set canvas size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Get WebGL context
    this.gl = this.canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });

    if (!this.gl) {
      console.warn('WebGL2 not supported, falling back to WebGL1');
      this.gl = this.canvas.getContext('webgl', {
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    }

    if (!this.gl) {
      console.error('WebGL not supported');
      return;
    }

    console.log('✅ WebGL context created successfully');

    // Setup shaders
    this.setupShaders();

    // Setup geometry
    this.setupGeometry();

    // Setup events
    this.setupEvents();

    // Start render loop
    this.animate();

    console.log('🚀 Terrafusion WebGL System initialized');
  }

  setupShaders() {
    const vertexSource = document.getElementById('vertex-shader').textContent;
    const fragmentSource = document.getElementById('quantum-fragment').textContent;

    this.program = this.createProgram(vertexSource, fragmentSource);

    if (!this.program) {
      console.error('Failed to create shader program');
      return;
    }

    console.log('🎨 Terrafusion shaders compiled successfully');
  }

  createShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  createProgram(vertexSource, fragmentSource) {
    const vertexShader = this.createShader(vertexSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.createShader(fragmentSource, this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program linking error:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }

    // Clean up shaders
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  setupGeometry() {
    // Create fullscreen quad
    const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    console.log('📐 Geometry setup complete');
  }

  setupEvents() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    });

    // Track mouse movement
    window.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX / window.innerWidth;
      this.mouse.y = 1.0 - e.clientY / window.innerHeight;
    });

    // Optimize for performance
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  render() {
    const gl = this.gl;
    const program = this.program;

    if (!program) return;

    // Clear with Terrafusion deep space color
    gl.clearColor(0.043, 0.063, 0.125, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use program
    gl.useProgram(program);

    // Set uniforms
    const time = (Date.now() - this.startTime) / 1000;
    const timeLocation = gl.getUniformLocation(program, 'time');
    gl.uniform1f(timeLocation, time);

    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

    const mouseLocation = gl.getUniformLocation(program, 'mouse');
    if (mouseLocation) {
      gl.uniform2f(mouseLocation, this.mouse.x, this.mouse.y);
    }

    // Set attributes
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.stats.drawCalls = 1;
  }

  updateStats() {
    this.frameCount++;
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000) {
      this.stats.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastTime = currentTime;

      // Estimate GPU time (rough approximation)
      this.stats.gpuTime = Math.max(0, 16.67 - 1000 / this.stats.fps).toFixed(2);

      // Log performance occasionally
      if (this.stats.fps < 55) {
        console.warn(`Terrafusion WebGL performance: ${this.stats.fps}fps`);
      }
    }
  }

  animate() {
    if (!this.isPaused) {
      this.render();
      this.updateStats();
    }
    requestAnimationFrame(() => this.animate());
  }

  pause() {
    this.isPaused = true;
    console.log('🔄 Terrafusion WebGL paused');
  }

  resume() {
    this.isPaused = false;
    console.log('▶️ Terrafusion WebGL resumed');
  }

  destroy() {
    if (this.gl) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.gl.deleteProgram(this.program);
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    console.log('🗑️ Terrafusion WebGL destroyed');
  }

  // Public API
  getStats() {
    return { ...this.stats };
  }

  setQuality(level) {
    // Adjust shader complexity based on performance
    const multiplier = level === 'high' ? 1.0 : level === 'medium' ? 0.7 : 0.5;

    // This could be used to switch to different shader variants
    console.log(`🎛️ Terrafusion WebGL quality set to: ${level}`);
  }
}

// Global Terrafusion WebGL instance
let terraFusionWebGL = null;

// Auto-initialize when DOM is ready
function initTerraFusionWebGL() {
  if (terraFusionWebGL) {
    terraFusionWebGL.destroy();
  }

  terraFusionWebGL = new TerraFusionWebGL();

  // Expose to global scope for debugging
  window.terraFusionWebGL = terraFusionWebGL;
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTerraFusionWebGL);
} else {
  initTerraFusionWebGL();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerraFusionWebGL;
}

console.log('🏆 Terrafusion WebGL System loaded - Government. Transcended. Visually.');
