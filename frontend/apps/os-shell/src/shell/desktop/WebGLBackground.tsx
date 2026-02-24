/**
 * TerraFusion OS - Immersive WebGL Background
 *
 * This is THE environment. The entire desktop is a living, breathing
 * 3D space with flowing energy, particle systems, and interactive
 * mouse tracking. All UI floats OVER this immersive experience.
 *
 * @see TERRAFUSION BRAND CODEX - webgl-transcendence-complete.html
 * @see TERRAFUSION BRAND CODEX - terrasphere_webgl.tsx
 */

import { useEffect, useRef } from 'react';

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS background');
      return;
    }

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      (gl as WebGLRenderingContext).viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader - The Transcendence Effect
    const fragmentShaderSource = `
      precision highp float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      
      varying vec2 v_uv;
      
      // Noise functions for organic movement
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
      
      void main() {
        vec2 st = v_uv;
        vec2 mouse = u_mouse;
        float t = u_time * 0.3;
        
        // Base colors - TerraFusion Brand
        vec3 voidBlack = vec3(0.039, 0.055, 0.102);     // #0A0E1A
        vec3 terraCyan = vec3(0.0, 0.898, 1.0);         // #00E5FF
        vec3 terraBlue = vec3(0.0, 0.502, 1.0);         // #0080FF
        vec3 terraGreen = vec3(0.0, 1.0, 0.533);        // #00FF88
        
        // Create flowing energy field
        vec2 flowUV = st;
        flowUV.x += sin(st.y * 3.0 + t) * 0.05;
        flowUV.y += cos(st.x * 4.0 + t * 0.7) * 0.03;
        
        float flow = fbm(flowUV * 3.0 + t * 0.5);
        
        // Energy streams
        float energy = 0.0;
        for (float i = 0.0; i < 5.0; i++) {
          vec2 streamPos = vec2(
            sin(t * 0.3 + i * 1.7) * 0.4 + 0.5,
            cos(t * 0.4 + i * 2.3) * 0.4 + 0.5
          );
          float dist = distance(st, streamPos);
          energy += 0.015 / (dist + 0.02);
        }
        
        // Mouse interaction - creates a glow around cursor
        float mouseDist = distance(st, mouse);
        float mouseGlow = 0.08 / (mouseDist + 0.08);
        mouseGlow *= smoothstep(0.5, 0.0, mouseDist);
        
        // Grid pattern - the quantum lattice
        vec2 gridSt = st * 40.0;
        float grid = 0.0;
        grid += smoothstep(0.98, 1.0, sin(gridSt.x * 3.14159));
        grid += smoothstep(0.98, 1.0, sin(gridSt.y * 3.14159));
        grid *= 0.15;
        
        // Radial fade from center
        float radialFade = 1.0 - smoothstep(0.3, 0.9, distance(st, vec2(0.5)));
        
        // Combine colors
        vec3 color = voidBlack;
        
        // Add energy field
        color = mix(color, terraBlue * 0.5, flow * 0.3);
        
        // Add energy streams
        vec3 energyColor = mix(terraCyan, terraGreen, sin(t + energy) * 0.5 + 0.5);
        color += energyColor * energy * 0.15;
        
        // Add mouse glow
        color += terraCyan * mouseGlow * 0.5;
        
        // Add grid
        color += terraCyan * grid * radialFade * 0.3;
        
        // Corner glows
        float topLeftGlow = smoothstep(0.8, 0.0, distance(st, vec2(0.0, 0.0)));
        float bottomRightGlow = smoothstep(0.8, 0.0, distance(st, vec2(1.0, 1.0)));
        color += terraCyan * topLeftGlow * 0.1 * (sin(t * 2.0) * 0.5 + 0.5);
        color += terraBlue * bottomRightGlow * 0.1 * (cos(t * 1.5) * 0.5 + 0.5);
        
        // Vignette
        float vignette = 1.0 - smoothstep(0.4, 1.4, distance(st, vec2(0.5)) * 1.5);
        color *= vignette;
        
        // Subtle noise overlay for texture
        float textureNoise = noise(st * 200.0 + t * 10.0) * 0.02;
        color += textureNoise;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Compile shaders
    const compileShader = (source: string, type: number) => {
      const shader = (gl as WebGLRenderingContext).createShader(type);
      if (!shader) return null;
      (gl as WebGLRenderingContext).shaderSource(shader, source);
      (gl as WebGLRenderingContext).compileShader(shader);
      if (
        !(gl as WebGLRenderingContext).getShaderParameter(
          shader,
          (gl as WebGLRenderingContext).COMPILE_STATUS
        )
      ) {
        console.error(
          'Shader compile error:',
          (gl as WebGLRenderingContext).getShaderInfoLog(shader)
        );
        (gl as WebGLRenderingContext).deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(
      vertexShaderSource,
      (gl as WebGLRenderingContext).VERTEX_SHADER
    );
    const fragmentShader = compileShader(
      fragmentShaderSource,
      (gl as WebGLRenderingContext).FRAGMENT_SHADER
    );

    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = (gl as WebGLRenderingContext).createProgram();
    if (!program) return;
    (gl as WebGLRenderingContext).attachShader(program, vertexShader);
    (gl as WebGLRenderingContext).attachShader(program, fragmentShader);
    (gl as WebGLRenderingContext).linkProgram(program);

    if (
      !(gl as WebGLRenderingContext).getProgramParameter(
        program,
        (gl as WebGLRenderingContext).LINK_STATUS
      )
    ) {
      console.error(
        'Program link error:',
        (gl as WebGLRenderingContext).getProgramInfoLog(program)
      );
      return;
    }

    // Get locations
    const positionLocation = (gl as WebGLRenderingContext).getAttribLocation(program, 'a_position');
    const timeLocation = (gl as WebGLRenderingContext).getUniformLocation(program, 'u_time');
    const resolutionLocation = (gl as WebGLRenderingContext).getUniformLocation(
      program,
      'u_resolution'
    );
    const mouseLocation = (gl as WebGLRenderingContext).getUniformLocation(program, 'u_mouse');

    // Create fullscreen quad
    const positionBuffer = (gl as WebGLRenderingContext).createBuffer();
    (gl as WebGLRenderingContext).bindBuffer(
      (gl as WebGLRenderingContext).ARRAY_BUFFER,
      positionBuffer
    );
    (gl as WebGLRenderingContext).bufferData(
      (gl as WebGLRenderingContext).ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      (gl as WebGLRenderingContext).STATIC_DRAW
    );

    // Animation loop
    const startTime = Date.now();

    const render = () => {
      const time = (Date.now() - startTime) * 0.001;

      (gl as WebGLRenderingContext).clearColor(0.039, 0.055, 0.102, 1);
      (gl as WebGLRenderingContext).clear((gl as WebGLRenderingContext).COLOR_BUFFER_BIT);

      (gl as WebGLRenderingContext).useProgram(program);

      (gl as WebGLRenderingContext).bindBuffer(
        (gl as WebGLRenderingContext).ARRAY_BUFFER,
        positionBuffer
      );
      (gl as WebGLRenderingContext).enableVertexAttribArray(positionLocation);
      (gl as WebGLRenderingContext).vertexAttribPointer(
        positionLocation,
        2,
        (gl as WebGLRenderingContext).FLOAT,
        false,
        0,
        0
      );

      (gl as WebGLRenderingContext).uniform1f(timeLocation, time);
      (gl as WebGLRenderingContext).uniform2f(resolutionLocation, canvas.width, canvas.height);
      (gl as WebGLRenderingContext).uniform2f(
        mouseLocation,
        mouseRef.current.x,
        1.0 - mouseRef.current.y
      );

      (gl as WebGLRenderingContext).drawArrays((gl as WebGLRenderingContext).TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid='webgl-background'
      className='absolute inset-0 w-full h-full'
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}

export default WebGLBackground;
