import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface WebGLEffectsProps {
  effect?: number;
  onEffectChange?: (_effect: number) => void;
}

const WebGLEffects: React.FC<WebGLEffectsProps> = ({ effect = 1, onEffectChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentEffect, setCurrentEffect] = useState(effect);
  const [_isLoaded, _setIsLoaded] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number | null>(null);

  // FPS monitoring
  const [fps, setFps] = useState(60);
  const fpsRef = useRef({ frames: 0, lastTime: Date.now() });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    camera.position.z = 5;

    // Initialize the current effect
    initializeEffect(currentEffect, scene, camera, renderer);
    _setIsLoaded(true);

    // Handle window resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      // Clear previous effect
      while (sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }
      
      initializeEffect(currentEffect, sceneRef.current, cameraRef.current, rendererRef.current);
    }
  }, [currentEffect]);

  const initializeEffect = (
    effectNumber: number, 
    scene: THREE.Scene, 
    camera: THREE.PerspectiveCamera, 
    renderer: THREE.WebGLRenderer
  ) => {
    switch (effectNumber) {
      case 1:
        createTranscendenceWave(scene);
        break;
      case 2:
        createNeuralNetwork(scene);
        break;
      case 3:
        createDataFlow(scene);
        break;
      case 4:
        createParticleGalaxy(scene);
        break;
      case 5:
        createQuantumField(scene);
        break;
      case 6:
        createDigitalCortex(scene);
        break;
      case 7:
        createTranscendenceMatrix(scene);
        break;
      default:
        createTranscendenceWave(scene);
    }

    startAnimation(scene, camera, renderer);
  };

  const createTranscendenceWave = (scene: THREE.Scene) => {
    const geometry = new THREE.PlaneGeometry(20, 20, 100, 100);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        colorA: { value: new THREE.Color(0x0099ff) },
        colorB: { value: new THREE.Color(0x00ffee) }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.z = sin(pos.x * 2.0 + time) * cos(pos.y * 2.0 + time) * 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 colorA;
        uniform vec3 colorB;
        varying vec2 vUv;
        void main() {
          float wave = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
          vec3 color = mix(colorA, colorB, wave * 0.5 + 0.5);
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 4;
    scene.add(mesh);

    // Store material for animation
    (scene as any).animateMaterial = material;
  };

  const createNeuralNetwork = (scene: THREE.Scene) => {
    const nodes: THREE.Mesh[] = [];
    const connections: THREE.Line[] = [];

    // Create nodes
    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 0.8, 0.5)
      });
      const node = new THREE.Mesh(geometry, material);
      
      node.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
      );
      
      nodes.push(node);
      scene.add(node);
    }

    // Create connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() < 0.1) { // 10% chance of connection
          const geometry = new THREE.BufferGeometry().setFromPoints([
            nodes[i].position,
            nodes[j].position
          ]);
          const material = new THREE.LineBasicMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.3
          });
          const line = new THREE.Line(geometry, material);
          connections.push(line);
          scene.add(line);
        }
      }
    }

    (scene as any).nodes = nodes;
    (scene as any).connections = connections;
  };

  const createDataFlow = (scene: THREE.Scene) => {
    const streams: THREE.Line[] = [];
    
    for (let i = 0; i < 100; i++) {
      const points = [];
      const startY = (Math.random() - 0.5) * 10;
      
      for (let j = 0; j < 20; j++) {
        points.push(new THREE.Vector3(
          -10 + j * 1,
          startY + Math.sin(j * 0.5) * 0.5,
          (Math.random() - 0.5) * 2
        ));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.4, 0.8, 0.5),
        transparent: true,
        opacity: 0.6
      });
      
      const stream = new THREE.Line(geometry, material);
      streams.push(stream);
      scene.add(stream);
    }

    (scene as any).streams = streams;
  };

  const createParticleGalaxy = (scene: THREE.Scene) => {
    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 2;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const color = new THREE.Color().setHSL(0.5 + Math.random() * 0.3, 0.8, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    (scene as any).particles = particles;
  };

  const createQuantumField = (scene: THREE.Scene) => {
    // Implementation for quantum field effect
    const geometry = new THREE.IcosahedronGeometry(2, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffee,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    (scene as any).quantumField = mesh;
  };

  const createDigitalCortex = (scene: THREE.Scene) => {
    // Implementation for digital cortex effect
    const group = new THREE.Group();
    
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.TorusGeometry(1 + i * 0.1, 0.05, 8, 16);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.5 + i * 0.02, 0.8, 0.5),
        transparent: true,
        opacity: 0.3
      });
      const torus = new THREE.Mesh(geometry, material);
      torus.rotation.x = Math.random() * Math.PI;
      torus.rotation.y = Math.random() * Math.PI;
      group.add(torus);
    }

    scene.add(group);
    (scene as any).cortexGroup = group;
  };

  const createTranscendenceMatrix = (scene: THREE.Scene) => {
    // Implementation for transcendence matrix effect
    const cubes: THREE.Mesh[] = [];
    
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        for (let z = -2; z <= 2; z++) {
          if (Math.random() < 0.3) {
            const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const material = new THREE.MeshBasicMaterial({
              color: new THREE.Color().setHSL(0.5, 0.8, Math.random()),
              transparent: true,
              opacity: 0.7
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(x, y, z);
            cubes.push(cube);
            scene.add(cube);
          }
        }
      }
    }

    (scene as any).matrixCubes = cubes;
  };

  const startAnimation = (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    const animate = (time: number) => {
      // FPS monitoring
      fpsRef.current.frames++;
      const now = Date.now();
      if (now - fpsRef.current.lastTime >= 1000) {
        setFps(fpsRef.current.frames);
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }

      // Animation logic based on current effect
      switch (currentEffect) {
        case 1: // Transcendence Wave
          if ((scene as any).animateMaterial) {
            (scene as any).animateMaterial.uniforms.time.value = time * 0.001;
          }
          break;
        case 2: // Neural Network
          if ((scene as any).nodes) {
            (scene as any).nodes.forEach((node: THREE.Mesh, i: number) => {
              node.position.y += Math.sin(time * 0.001 + i) * 0.01;
            });
          }
          break;
        case 4: // Particle Galaxy
          if ((scene as any).particles) {
            (scene as any).particles.rotation.y = time * 0.0005;
          }
          break;
        case 5: // Quantum Field
          if ((scene as any).quantumField) {
            (scene as any).quantumField.rotation.x = time * 0.001;
            (scene as any).quantumField.rotation.y = time * 0.0007;
          }
          break;
        case 6: // Digital Cortex
          if ((scene as any).cortexGroup) {
            (scene as any).cortexGroup.rotation.x = time * 0.0005;
            (scene as any).cortexGroup.rotation.y = time * 0.0003;
          }
          break;
        case 7: // Transcendence Matrix
          if ((scene as any).matrixCubes) {
            (scene as any).matrixCubes.forEach((cube: THREE.Mesh, i: number) => {
              cube.rotation.x = time * 0.001 + i * 0.1;
              cube.rotation.y = time * 0.0007 + i * 0.1;
            });
          }
          break;
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate(0);
  };

  const changeEffect = (newEffect: number) => {
    setCurrentEffect(newEffect);
    onEffectChange?.(newEffect);
  };

  return (
    <div className="webgl-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      
      {/* Effect Controls */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        {[1, 2, 3, 4, 5, 6, 7].map(num => (
          <button
            key={num}
            onClick={() => changeEffect(num)}
            style={{
              padding: '8px 12px',
              backgroundColor: currentEffect === num ? '#00ffee' : 'rgba(0, 255, 238, 0.2)',
              color: currentEffect === num ? '#0b1020' : '#00ffee',
              border: '1px solid #00ffee',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {num}
          </button>
        ))}
      </div>

      {/* FPS Counter */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        color: '#00ffee',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(11, 16, 32, 0.8)',
        padding: '5px 10px',
        borderRadius: '5px'
      }}>
        FPS: {fps}
      </div>

      {/* Effect Labels */}
      <div style={{
        position: 'fixed',
        bottom: '70px',
        left: '20px',
        zIndex: 1000,
        color: '#00ffee',
        fontSize: '12px',
        background: 'rgba(11, 16, 32, 0.8)',
        padding: '5px 10px',
        borderRadius: '5px'
      }}>
        {[
          'Transcendence Wave',
          'Neural Network',
          'Data Flow',
          'Particle Galaxy',
          'Quantum Field',
          'Digital Cortex',
          'Transcendence Matrix'
        ][currentEffect - 1]}
      </div>
    </div>
  );
};

export default WebGLEffects;