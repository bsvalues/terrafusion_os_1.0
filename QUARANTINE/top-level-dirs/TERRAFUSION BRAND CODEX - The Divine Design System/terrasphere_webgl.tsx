import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// TerraSphere WebGL Engine - Pure Three.js Implementation
export default function TerraSphereWebGL() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [systemState, setSystemState] = useState('idle');
  const [stats, setStats] = useState({
    fps: 60,
    load: 0,
    agents: 12,
    nodes: 3057
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000814, 5, 15);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 6);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 0.5);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0080ff, 0.3);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Create main group for all elements
    const terraSphereGroup = new THREE.Group();
    scene.add(terraSphereGroup);

    // 1. Wireframe Lattice
    const latticeGroup = new THREE.Group();
    
    // Outer sphere wireframe
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wireframeSphere = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    latticeGroup.add(wireframeSphere);

    // Ring system
    const rings = [];
    const ringGeometry = new THREE.TorusGeometry(1.8, 0.01, 2, 100);
    
    // Horizontal rings
    for (let i = 0; i < 4; i++) {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.z = (Math.PI / 2) * i / 2;
      rings.push(ring);
      latticeGroup.add(ring);
    }
    
    // Vertical rings
    for (let i = 0; i < 4; i++) {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = (Math.PI / 2) * i / 2;
      rings.push(ring);
      latticeGroup.add(ring);
    }

    terraSphereGroup.add(latticeGroup);

    // 2. Energy Core (Custom Shader)
    const coreGeometry = new THREE.IcosahedronGeometry(1, 4);
    
    const coreShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x001144) },
        uPulse: { value: 1 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPulse;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          float displacement = sin(uTime * 2.0 + position.y * 10.0) * 0.02;
          pos += normal * displacement * uPulse;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uPulse;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 color = mix(uColor, vec3(1.0), fresnel * 0.5);
          
          float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
          float glow = fresnel * pulse * uPulse;
          
          color += vec3(0.0, 1.0, 1.0) * glow * 2.0;
          
          float alpha = 0.8 + fresnel * 0.2;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const coreMesh = new THREE.Mesh(coreGeometry, coreShaderMaterial);
    terraSphereGroup.add(coreMesh);

    // 3. Particle System
    const particleCount = 50;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 0.5;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    terraSphereGroup.add(particleSystem);

    // Mouse controls
    let mouseX = 0;
    let mouseY = 0;
    
    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // State management
    let currentState = 'idle';
    const updateSystemState = (state) => {
      currentState = state;
      
      // Update colors based on state
      const color = state === 'alert' ? 0xff4444 : 0x00ffff;
      wireframeMaterial.color.setHex(color);
      rings.forEach(ring => ring.material.color.setHex(color));
      
      // Update particle color
      if (state === 'alert') {
        particlesMaterial.color.setHex(0xff4444);
      } else if (state === 'success') {
        particlesMaterial.color.setHex(0x00ff88);
      } else {
        particlesMaterial.color.setHex(0x00ffff);
      }
    };

    // Animation loop
    const clock = new THREE.Clock();
    let time = 0;
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      const deltaTime = clock.getDelta();
      time += deltaTime;
      
      // Update shader uniforms
      coreShaderMaterial.uniforms.uTime.value = time;
      
      // Pulse effect based on state
      let targetPulse = 1;
      switch (currentState) {
        case 'boot':
          targetPulse = 1.5;
          terraSphereGroup.rotation.y += 0.02;
          break;
        case 'processing':
          targetPulse = 1.2;
          terraSphereGroup.rotation.y += 0.015;
          break;
        case 'alert':
          targetPulse = 1.3 + Math.sin(time * 10) * 0.2;
          break;
        case 'success':
          targetPulse = 1.8;
          break;
        default:
          targetPulse = 1 + Math.sin(time * 0.5) * 0.1;
      }
      
      coreShaderMaterial.uniforms.uPulse.value = THREE.MathUtils.lerp(
        coreShaderMaterial.uniforms.uPulse.value,
        targetPulse,
        0.1
      );
      
      // Rotate main elements
      terraSphereGroup.rotation.y += 0.003;
      latticeGroup.rotation.y -= 0.002;
      latticeGroup.rotation.z += 0.001;
      coreMesh.rotation.y += 0.005;
      coreMesh.rotation.x += 0.002;
      
      // Particle animation
      const particlePositions = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const x = particlePositions[idx];
        const y = particlePositions[idx + 1];
        const z = particlePositions[idx + 2];
        
        // Orbital motion
        const speed = currentState === 'processing' ? 0.5 : 0.1;
        const angle = time * speed + i * 0.1;
        const radius = Math.sqrt(x * x + y * y + z * z);
        
        particlePositions[idx] = radius * Math.sin(angle) * Math.cos(i);
        particlePositions[idx + 1] = radius * Math.cos(angle) * Math.sin(i);
        particlePositions[idx + 2] = z + Math.sin(time + i) * 0.01;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
      
      // Camera follow mouse slightly
      camera.position.x = mouseX * 0.5;
      camera.position.y = mouseY * 0.5;
      camera.lookAt(scene.position);
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Expose state update function
    window.updateTerraSphereState = updateSystemState;

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update system state when React state changes
  useEffect(() => {
    if (window.updateTerraSphereState) {
      window.updateTerraSphereState(systemState);
    }
  }, [systemState]);

  // Simulate system metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        fps: 60 + Math.floor(Math.random() * 10 - 5),
        load: Math.floor(Math.random() * 100),
        agents: Math.floor(Math.random() * 50),
        nodes: 3057 + Math.floor(Math.random() * 100 - 50)
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-8 pointer-events-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl font-thin text-cyan-400 tracking-tight mb-2">
            TERRAFUSION
          </h1>
          <p className="text-cyan-600 text-sm uppercase tracking-widest">
            Quantum Governance Engine v4.1
          </p>
        </div>
      </div>
      
      {/* System Status Panel */}
      <div className="absolute top-8 right-8 bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20 min-w-[200px]">
        <h3 className="text-cyan-400 text-xs uppercase tracking-wider mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">FPS</span>
            <span className="text-cyan-400 font-mono text-sm">{stats.fps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">CPU Load</span>
            <span className="text-cyan-400 font-mono text-sm">{stats.load}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Active Agents</span>
            <span className="text-cyan-400 font-mono text-sm">{stats.agents}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Nodes</span>
            <span className="text-cyan-400 font-mono text-sm">{stats.nodes}</span>
          </div>
        </div>
      </div>
      
      {/* Control Panel */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 pointer-events-auto">
        {['idle', 'boot', 'processing', 'alert', 'success'].map(state => (
          <button
            key={state}
            onClick={() => setSystemState(state)}
            className={`
              px-6 py-3 rounded-xl text-sm uppercase tracking-wider
              transition-all duration-300 transform hover:-translate-y-1
              ${systemState === state 
                ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/50' 
                : 'bg-slate-900/80 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10'
              }
            `}
          >
            {state}
          </button>
        ))}
      </div>
      
      {/* Particle effects overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}