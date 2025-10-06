/**
 * WebGLTranscendence - TerraFusion WebGL Background Component
 * 
 * @architecture WebGL shader-based animated background using WGSL design tokens
 * Creates flowing energy lines and transcendence gradient effects
 * 
 * @example
 * <WebGLTranscendence intensity={0.3} interactive={true} />
 */

import React, { useEffect, useRef } from 'react';

import { useTheme } from '../theme/ThemeProvider.jsx';

const WebGLTranscendence = ({ 
  intensity = 0.3, // 0.0 - 1.0, controls brightness
  interactive = true, // Mouse interaction
  animated = true, // Time-based animation
  className = '',
  style = {},
  ...props 
}) => {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      // Silently fall back - no WebGL support
      return;
    }
    
    glRef.current = gl;
    
    // Vertex shader - creates the geometry
    const vertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      uniform float u_time;
      varying vec2 v_uv;
      
      void main() {
        v_uv = a_position;
        vec2 position = a_position;
        
        // Add wave distortion for organic flow
        position.y += sin(position.x * 10.0 + u_time * 2.0) * 0.02;
        position.x += cos(position.y * 8.0 + u_time * 1.5) * 0.02;
        
        vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
        gl_Position = vec4(clipSpace, 0, 1);
      }
    `;
    
    // Fragment shader - TerraFusion brand colors from design tokens
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      varying vec2 v_uv;
      
      void main() {
        vec2 st = v_uv / u_resolution;
        vec2 mouse = u_mouse / u_resolution;
        
        // Create flowing energy lines
        float energy = 0.0;
        for(float i = 0.0; i < 5.0; i++) {
          vec2 pos = vec2(
            sin(u_time * 0.5 + i * 1.5) * 0.3 + 0.5,
            cos(u_time * 0.7 + i * 2.1) * 0.3 + 0.5
          );
          float dist = distance(st, pos);
          energy += 0.01 / (dist + 0.01);
        }
        
        // Mouse interaction glow
        float mouseDist = distance(st, mouse);
        float mouseGlow = 0.05 / (mouseDist + 0.05);
        
        // TerraFusion Transcendence Colors (from design tokens)
        // Trust Blue #0099ff -> vec3(0.0, 0.6, 1.0)
        // Transcend Cyan #00ffee -> vec3(0.0, 1.0, 0.933)
        // Success Green #00ffaa -> vec3(0.0, 1.0, 0.667)
        vec3 trustBlue = vec3(0.0, 0.6, 1.0);
        vec3 transcendCyan = vec3(0.0, 1.0, 0.933);
        vec3 successGreen = vec3(0.0, 1.0, 0.667);
        
        // Clarity gradient mixing
        vec3 finalColor = mix(trustBlue, transcendCyan, st.x + sin(u_time) * 0.1);
        finalColor = mix(finalColor, successGreen, st.y + cos(u_time * 0.8) * 0.1);
        
        // Combine energy and mouse interaction
        finalColor += energy * 0.3;
        finalColor += mouseGlow * vec3(0.2, 0.8, 1.0);
        
        // Subtle grid overlay
        float grid = step(0.98, sin(st.x * 50.0)) + step(0.98, sin(st.y * 50.0));
        finalColor += grid * 0.05;
        
        // Fade edges for vignette effect
        float fade = 1.0 - distance(st, vec2(0.5, 0.5)) * 1.5;
        fade = clamp(fade, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor * fade * u_intensity, 1.0);
      }
    `;
    
    // Compile shaders
    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // Shader compilation failed - silently fail in production
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;
    
    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // Program linking failed - silently fail in production
      return;
    }
    
    programRef.current = program;
    gl.useProgram(program);
    
    // Get uniform locations
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    
    // Create geometry (full-screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      canvas.width, 0,
      0, canvas.height,
      0, canvas.height,
      canvas.width, 0,
      canvas.width, canvas.height,
    ]), gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Resize handler
    function resize() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      
      // Update buffer data
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        canvas.width, 0,
        0, canvas.height,
        0, canvas.height,
        canvas.width, 0,
        canvas.width, canvas.height,
      ]), gl.STATIC_DRAW);
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    // Mouse handler
    function handleMouseMove(e) {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    
    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }
    
    // Animation loop
    let startTime = Date.now();
    function render() {
      if (!gl || !programRef.current) return;
      
      const time = animated ? (Date.now() - startTime) / 1000 : 0;
      
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(intensityLocation, intensity);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      animationRef.current = requestAnimationFrame(render);
    }
    
    render();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      if (interactive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, [intensity, interactive, animated]);
  
  const canvasStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: interactive ? 'auto' : 'none',
    ...style,
  };
  
  return (
    <canvas
      ref={canvasRef}
      style={canvasStyles}
      className={`webgl-transcendence ${className}`}
      {...props}
    />
  );
};

export default WebGLTranscendence;
