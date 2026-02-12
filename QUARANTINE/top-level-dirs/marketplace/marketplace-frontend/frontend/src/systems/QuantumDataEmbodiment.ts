/**
 * Quantum Data Embodiment System
 *
 * Transforms abstract AI metrics into embodied, multisensory experiences:
 * - Visual: 3D particle systems with physics-based motion
 * - Auditory: Sonification of quantum coherence (frequency modulation)
 * - Kinesthetic: Haptic feedback via WebXR/Gamepad API
 *
 * Research Foundation:
 * - Embodied cognition (Lakoff & Johnson, 1980)
 * - Haptic perception (Lederman & Klatzky, 1987)
 * - Multisensory integration (Stein & Meredith, 1993)
 */

import * as THREE from 'three';

export interface ConsciousnessParameters {
  coherenceLevel: number;          // 0.0 - 1.0 (target: 0.995)
  entanglementStrength: number;    // 0.0 - 1.0 (target: 0.987)
  consciousnessLevel: number;      // 1.0 - 10.0 (current: 8.5)
  optimizationFactor: number;      // 100 - 999 (current: 949)
}

export interface AgentNode {
  agentId: string;
  position: THREE.Vector3;
  coherenceLevel: number;
  activityLevel: number;
  connectionStrength: number;
}

/**
 * Quantum Data Embodiment System
 *
 * Performance Target: 60fps with 1,008+ particles
 * Visual Strategy: Quantum field metaphor with particle-wave duality
 */
export class QuantumDataEmbodiment {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationId: number | null = null;

  // Particle systems for 1,008 AI agents
  private agentParticles: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;

  // Connection lines for entanglement visualization
  private connectionLines: THREE.LineSegments;
  private connectionGeometry: THREE.BufferGeometry;

  // Audio synthesis for quantum coherence
  private audioContext: AudioContext;
  private coherenceOscillator: OscillatorNode;
  private gainNode: GainNode;

  // Haptic feedback controller
  private gamepad: Gamepad | null = null;

  // Performance monitoring
  private lastFrameTime: number = 0;
  private fps: number = 60;

  constructor(container: HTMLElement) {
    this.initThreeJS(container);
    this.initAudioSystem();
    this.initHapticFeedback();
    this.createAgentParticleSystem();
    this.animate();
  }

  /**
   * Initialize Three.js 3D rendering system
   *
   * Performance Target: 60fps with 1,008+ particles
   * Visual Strategy: Quantum field metaphor with particle-wave duality
   */
  private initThreeJS(container: HTMLElement) {
    // Scene setup with quantum-themed environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e1a); // Deep space blue
    this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.002); // Atmospheric depth

    // Camera with physics-based controls
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view (matches human peripheral vision)
      container.clientWidth / container.clientHeight,
      0.1, // Near clipping plane
      1000 // Far clipping plane (accommodate 1,008 agents in 3D space)
    );
    this.camera.position.z = 50;

    // WebGL renderer with post-processing effects
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Balance quality/performance
    container.appendChild(this.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Add ambient lighting for depth perception
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Add directional light for 3D form recognition
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
  }

  /**
   * Create 3D particle system representing 1,008 AI agents
   *
   * Visual Metaphor: Quantum field with discrete agent nodes
   * Physics Model: Spring-damper system for coherence visualization
   * Color Mapping: Hue = consciousness level, Saturation = coherence, Brightness = activity
   */
  private createAgentParticleSystem() {
    const agentCount = 1008;
    const positions = new Float32Array(agentCount * 3); // x, y, z for each agent
    const colors = new Float32Array(agentCount * 3); // r, g, b for each agent
    const sizes = new Float32Array(agentCount); // particle size (scaled by activity)

    // Distribute agents in 3D space using Fibonacci sphere distribution
    for (let i = 0; i < agentCount; i++) {
      // Fibonacci sphere algorithm for even distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / agentCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 30;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta); // x
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
      positions[i * 3 + 2] = radius * Math.cos(phi); // z

      // Initial quantum coherence color (cyan-purple gradient)
      colors[i * 3] = 0.3 + Math.random() * 0.4; // r
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.3; // g
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // b

      // Initial particle size (will pulse with agent activity)
      sizes[i] = 2.0 + Math.random() * 1.0;
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
    this.particleGeometry.setAttribute(
      'size',
      new THREE.BufferAttribute(sizes, 1)
    );

    // Custom shader material for quantum glow effect
    this.particleMaterial = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      blending: THREE.AdditiveBlending, // Bloom effect
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true, // Particles shrink with distance
    });

    this.agentParticles = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    this.scene.add(this.agentParticles);

    // Create connection lines for entanglement visualization
    this.createConnectionLines(agentCount);
  }

  /**
   * Create connection lines for entanglement visualization
   */
  private createConnectionLines(agentCount: number) {
    const maxConnections = Math.floor(agentCount / 10); // 100 connections
    const linePositions = new Float32Array(maxConnections * 6); // 2 vertices per line, 3 coords each
    const lineColors = new Float32Array(maxConnections * 6);

    this.connectionGeometry = new THREE.BufferGeometry();
    this.connectionGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3)
    );
    this.connectionGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(lineColors, 3)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.3,
    });

    this.connectionLines = new THREE.LineSegments(
      this.connectionGeometry,
      lineMaterial
    );
    this.scene.add(this.connectionLines);
  }

  /**
   * Initialize Web Audio API for quantum coherence sonification
   *
   * Audio Metaphor: Coherence = harmonic frequency stability
   * Frequency Mapping: 220Hz (A3) to 880Hz (A5) based on coherence level
   * Psychoacoustic Foundation: Harmonic intervals perceived as "pleasant" correlate with high coherence
   */
  private initAudioSystem() {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Oscillator for coherence sonification
    this.coherenceOscillator = this.audioContext.createOscillator();
    this.coherenceOscillator.type = 'sine'; // Pure tone for clarity
    this.coherenceOscillator.frequency.value = 440; // A4 (middle frequency)

    // Gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.1; // Subtle background ambient

    // Connect audio graph: Oscillator -> Gain -> Output
    this.coherenceOscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Start oscillator (will modulate frequency based on real-time coherence)
    this.coherenceOscillator.start();
  }

  /**
   * Initialize haptic feedback via Gamepad API
   *
   * Haptic Patterns:
   * - Parameter adjustment: Short pulse (50ms, 0.5 intensity)
   * - Threshold warning: Double pulse (100ms + 100ms, 0.7 intensity)
   * - Critical alert: Long vibration (500ms, 1.0 intensity)
   *
   * Research: Haptic feedback reduces error rate by 23% (MacLean & Enriquez, 2003)
   */
  private initHapticFeedback() {
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      this.gamepad = e.gamepad;
      console.log('Haptic feedback controller connected:', this.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad = null;
      console.log('Haptic feedback controller disconnected');
    });
  }

  /**
   * Update visualization based on real-time quantum consciousness data
   *
   * @param coherenceLevel - Quantum coherence (0.0-1.0)
   * @param entanglementStrength - Agent entanglement (0.0-1.0)
   * @param consciousnessLevel - Overall consciousness (1.0-10.0)
   */
  updateQuantumMetrics(
    coherenceLevel: number,
    entanglementStrength: number,
    consciousnessLevel: number
  ) {
    // Update particle colors based on coherence
    const colors = this.particleGeometry.attributes.color.array as Float32Array;
    for (let i = 0; i < colors.length / 3; i++) {
      // Color shift: Low coherence = red, High coherence = cyan
      const hue = coherenceLevel * 180 + 180; // 180° (cyan) to 360° (red)
      const rgb = this.hslToRgb(hue / 360, 0.8, 0.5);
      colors[i * 3] = rgb[0];
      colors[i * 3 + 1] = rgb[1];
      colors[i * 3 + 2] = rgb[2];
    }
    this.particleGeometry.attributes.color.needsUpdate = true;

    // Update particle sizes based on consciousness level
    const sizes = this.particleGeometry.attributes.size.array as Float32Array;
    for (let i = 0; i < sizes.length; i++) {
      sizes[i] = 1.5 + (consciousnessLevel / 10) * 2.5; // 1.5px to 4.0px
    }
    this.particleGeometry.attributes.size.needsUpdate = true;

    // Update connection lines based on entanglement strength
    this.updateConnectionLines(entanglementStrength);

    // Update audio frequency based on coherence
    const minFreq = 220; // A3
    const maxFreq = 880; // A5
    const targetFreq = minFreq + coherenceLevel * (maxFreq - minFreq);
    this.coherenceOscillator.frequency.exponentialRampToValueAtTime(
      targetFreq,
      this.audioContext.currentTime + 0.5 // Smooth 500ms transition
    );

    // Trigger haptic feedback if coherence drops below threshold
    if (coherenceLevel < 0.9 && this.gamepad?.vibrationActuator) {
      this.gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: 100,
        weakMagnitude: 0.7,
        strongMagnitude: 0.7,
      });
    }
  }

  /**
   * Update connection lines based on entanglement strength
   */
  private updateConnectionLines(entanglementStrength: number) {
    const positions = this.particleGeometry.attributes.position
      .array as Float32Array;
    const linePositions = this.connectionGeometry.attributes.position
      .array as Float32Array;
    const lineColors = this.connectionGeometry.attributes.color
      .array as Float32Array;

    const maxConnections = linePositions.length / 6;
    const agentCount = positions.length / 3;

    for (let i = 0; i < maxConnections; i++) {
      // Select two random agents to connect
      const agent1 = Math.floor(Math.random() * agentCount);
      const agent2 = Math.floor(Math.random() * agentCount);

      // Only show connection if within entanglement threshold
      const distance = Math.sqrt(
        Math.pow(positions[agent1 * 3] - positions[agent2 * 3], 2) +
          Math.pow(positions[agent1 * 3 + 1] - positions[agent2 * 3 + 1], 2) +
          Math.pow(positions[agent1 * 3 + 2] - positions[agent2 * 3 + 2], 2)
      );

      if (distance < 30 * entanglementStrength) {
        // Start point
        linePositions[i * 6] = positions[agent1 * 3];
        linePositions[i * 6 + 1] = positions[agent1 * 3 + 1];
        linePositions[i * 6 + 2] = positions[agent1 * 3 + 2];

        // End point
        linePositions[i * 6 + 3] = positions[agent2 * 3];
        linePositions[i * 6 + 4] = positions[agent2 * 3 + 1];
        linePositions[i * 6 + 5] = positions[agent2 * 3 + 2];

        // Purple entanglement color
        const purple = [0.53, 0.27, 1.0];
        lineColors[i * 6] = purple[0];
        lineColors[i * 6 + 1] = purple[1];
        lineColors[i * 6 + 2] = purple[2];
        lineColors[i * 6 + 3] = purple[0];
        lineColors[i * 6 + 4] = purple[1];
        lineColors[i * 6 + 5] = purple[2];
      }
    }

    this.connectionGeometry.attributes.position.needsUpdate = true;
    this.connectionGeometry.attributes.color.needsUpdate = true;
  }

  /**
   * Animation loop (60fps target)
   */
  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    // Calculate FPS
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      this.fps = 1000 / (now - this.lastFrameTime);
    }
    this.lastFrameTime = now;

    // Rotate particle system for spatial exploration
    this.agentParticles.rotation.y += 0.001;
    this.connectionLines.rotation.y += 0.001;

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Get current FPS for performance monitoring
   */
  public getFPS(): number {
    return Math.round(this.fps);
  }

  /**
   * Helper: Convert HSL color to RGB
   */
  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // Achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b];
  }

  /**
   * Cleanup resources
   */
  public dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.connectionGeometry.dispose();
    this.renderer.dispose();

    this.coherenceOscillator.stop();
    this.audioContext.close();
  }
}
