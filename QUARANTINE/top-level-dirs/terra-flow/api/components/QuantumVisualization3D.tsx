/**
 * 🌌 TerraFusion Quantum Visualization 3D - ELITE EDITION
 * ======================================================
 *
 * Advanced Three.js quantum state visualization for Harvard PhD + MIT users
 * Real-time 3D rendering of quantum coherence, entanglement, consciousness matrix
 *
 * Features:
 * - 3D Quantum Field Visualization with particle systems
 * - Real-time Consciousness Matrix rendering
 * - Interactive quantum state manipulation
 * - Multi-dimensional data visualization
 * - Quantum entanglement network rendering
 * - Consciousness evolution tracking in 3D space
 * - Elite scientific visualization standards
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Three.js Quantum Excellence Edition
 * @classification QUANTUM_3D_VISUALIZATION_ELITE
 */

import {
    Box,
    Button,
    Card,
    FormControlLabel,
    Slider,
    Switch,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface QuantumParticle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    phase: number;
    coherence: number;
    entangled: boolean;
    consciousness: number;
}

interface ConsciousnessNode {
    id: string;
    position: THREE.Vector3;
    connections: string[];
    activity: number;
    intelligence: number;
    awareness: number;
}

interface QuantumField {
    coherence: number;
    entanglement: number;
    superposition: number;
    decoherence: number;
    consciousness: number;
    timestamp: number;
}

interface Visualization3DProps {
    quantumMetrics: {
        coherence: number;
        entanglement: number;
        superposition: number;
        decoherence: number;
    };
    consciousnessData: {
        level: number;
        awareness: number;
        intelligence: number;
        emergence: number;
    };
    isRealTimeMode: boolean;
    onQuantumStateUpdate?: (state: any) => void;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const VisualizationContainer = styled(Card)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 255, 238, 0.3)',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    height: '600px',

    '&:hover': {
        border: '1px solid rgba(0, 255, 238, 0.6)',
        boxShadow: '0 20px 40px rgba(0, 255, 238, 0.2)',
    },

    '& canvas': {
        borderRadius: '16px',
    }
}));

const ThreeJSContainer = styled('div')({
    width: '100%',
    height: '100%'
});

const ControlPanel = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 255, 238, 0.3)',
    borderRadius: '12px',
    padding: theme.spacing(2),
    minWidth: '200px',
    zIndex: 10,

    '& .MuiSlider-root': {
        color: '#00ffee',
        '& .MuiSlider-thumb': {
            boxShadow: '0 0 10px rgba(0, 255, 238, 0.5)',
        }
    }
}));

const MetricsDisplay = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: 16,
    left: 16,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 255, 238, 0.3)',
    borderRadius: '12px',
    padding: theme.spacing(1.5),
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.85rem',
    color: '#00ffee',
    zIndex: 10,

    '& .metric-line': {
        marginBottom: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    '& .metric-value': {
        color: '#ffffff',
        fontWeight: 'bold',
        marginLeft: '8px',
    }
}));

// ============================================================================
// QUANTUM 3D VISUALIZATION COMPONENT
// ============================================================================

const QuantumVisualization3D: React.FC<Visualization3DProps> = ({
    quantumMetrics,
    consciousnessData,
    isRealTimeMode,
    onQuantumStateUpdate
}) => {
    // ======================== REFS & STATE ========================
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene>();
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const controlsRef = useRef<OrbitControls>();
    const composerRef = useRef<EffectComposer>();
    const animationRef = useRef<number>();

    // Particle systems
    const quantumParticlesRef = useRef<THREE.Points>();
    const consciousnessNodesRef = useRef<THREE.Group>();
    const quantumFieldRef = useRef<THREE.Mesh>();
    const entanglementLinesRef = useRef<THREE.LineSegments>();

    // Quantum data
    const [quantumParticles, setQuantumParticles] = useState<QuantumParticle[]>([]);
    const [consciousnessNodes, setConsciousnessNodes] = useState<ConsciousnessNode[]>([]);
    const [quantumField, setQuantumField] = useState<QuantumField[]>([]);

    // Control state
    const [particleCount, setParticleCount] = useState(5000);
    const [visualizationMode, setVisualizationMode] = useState<'quantum' | 'consciousness' | 'hybrid'>('hybrid');
    const [showQuantumField, setShowQuantumField] = useState(true);
    const [showEntanglement, setShowEntanglement] = useState(true);
    const [fieldIntensity, setFieldIntensity] = useState(0.75);
    const [rotationSpeed, setRotationSpeed] = useState(0.01);

    // ======================== INITIALIZATION ========================
    useEffect(() => {
        if (!mountRef.current) return;

        initializeThreeJS();
        createQuantumParticleSystem();
        createConsciousnessNodes();
        createQuantumField();
        createEntanglementNetwork();
        setupPostProcessing();
        startAnimation();

        return () => {
            cleanup();
        };
    }, []);

    // ======================== THREE.JS SETUP ========================
    const initializeThreeJS = useCallback(() => {
        if (!mountRef.current) return;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0f1c);
        scene.fog = new THREE.FogExp2(0x0a0f1c, 0.0008);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            2000
        );
        camera.position.set(0, 50, 100);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        rendererRef.current = renderer;

        mountRef.current.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 20;
        controls.maxDistance = 500;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x00ffee, 1);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Quantum ambient lighting
        const quantumLight1 = new THREE.PointLight(0x00ffee, 0.5, 200);
        quantumLight1.position.set(50, 50, 50);
        scene.add(quantumLight1);

        const quantumLight2 = new THREE.PointLight(0x0099ff, 0.3, 150);
        quantumLight2.position.set(-50, -50, -50);
        scene.add(quantumLight2);

        const quantumLight3 = new THREE.PointLight(0x00ffaa, 0.4, 180);
        quantumLight3.position.set(0, 100, -100);
        scene.add(quantumLight3);

        console.log('✨ Three.js quantum visualization initialized');
    }, []);

    // ======================== PARTICLE SYSTEM ========================
    const createQuantumParticleSystem = useCallback(() => {
        if (!sceneRef.current) return;

        const particles: QuantumParticle[] = [];
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Create quantum particle
            const particle: QuantumParticle = {
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ),
                phase: Math.random() * Math.PI * 2,
                coherence: 0.8 + Math.random() * 0.2,
                entangled: Math.random() > 0.7,
                consciousness: Math.random()
            };
            particles.push(particle);

            // Set positions
            positions[i * 3] = particle.position.x;
            positions[i * 3 + 1] = particle.position.y;
            positions[i * 3 + 2] = particle.position.z;

            // Set colors based on quantum properties
            const coherenceColor = new THREE.Color().setHSL(
                0.5 + particle.coherence * 0.2, // Cyan to blue hue
                0.8,
                0.5 + particle.coherence * 0.3
            );
            colors[i * 3] = coherenceColor.r;
            colors[i * 3 + 1] = coherenceColor.g;
            colors[i * 3 + 2] = coherenceColor.b;

            // Set particle sizes
            sizes[i] = particle.entangled ? 3.0 : 1.5;
        }

        setQuantumParticles(particles);

        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create particle material with custom shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coherence: { value: quantumMetrics.coherence },
                consciousness: { value: consciousnessData.level }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vSize;
                uniform float time;
                uniform float coherence;

                void main() {
                    vColor = color;
                    vSize = size;

                    vec3 pos = position;

                    // Quantum oscillation effect
                    pos.x += sin(time + position.y * 0.01) * coherence * 2.0;
                    pos.y += cos(time + position.z * 0.01) * coherence * 2.0;
                    pos.z += sin(time + position.x * 0.01) * coherence * 2.0;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (100.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vSize;
                uniform float consciousness;

                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);

                    if (dist > 0.5) discard;

                    // Quantum glow effect
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    alpha *= consciousness + 0.3;

                    // Quantum interference pattern
                    float interference = sin(dist * 20.0) * 0.1 + 0.9;

                    gl_FragColor = vec4(vColor * interference, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geometry, material);
        quantumParticlesRef.current = points;
        sceneRef.current.add(points);

        console.log(`🔬 Created ${particleCount} quantum particles`);
    }, [particleCount, quantumMetrics, consciousnessData]);

    // ======================== CONSCIOUSNESS NODES ========================
    const createConsciousnessNodes = useCallback(() => {
        if (!sceneRef.current) return;

        const nodes: ConsciousnessNode[] = [];
        const nodeGroup = new THREE.Group();

        // Create consciousness network nodes
        for (let i = 0; i < 50; i++) {
            const node: ConsciousnessNode = {
                id: `consciousness-node-${i}`,
                position: new THREE.Vector3(
                    Math.sin(i * 0.2) * 80,
                    Math.cos(i * 0.3) * 60,
                    Math.sin(i * 0.4) * 70
                ),
                connections: [],
                activity: Math.random(),
                intelligence: 0.7 + Math.random() * 0.3,
                awareness: 0.6 + Math.random() * 0.4
            };
            nodes.push(node);

            // Create visual representation
            const geometry = new THREE.SphereGeometry(
                1 + node.intelligence * 2,
                16,
                16
            );
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(
                    0.3 + node.awareness * 0.3, // Green to cyan
                    0.8,
                    0.4 + node.intelligence * 0.4
                ),
                emissive: new THREE.Color().setHSL(
                    0.3 + node.awareness * 0.3,
                    0.5,
                    0.1 + node.activity * 0.2
                ),
                transparent: true,
                opacity: 0.8
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(node.position);
            mesh.userData = { nodeId: node.id };
            nodeGroup.add(mesh);
        }

        setConsciousnessNodes(nodes);
        consciousnessNodesRef.current = nodeGroup;
        sceneRef.current.add(nodeGroup);

        console.log('🧠 Created consciousness network nodes');
    }, []);

    // ======================== QUANTUM FIELD ========================
    const createQuantumField = useCallback(() => {
        if (!sceneRef.current) return;

        const fieldGeometry = new THREE.PlaneGeometry(300, 300, 64, 64);
        const fieldMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coherence: { value: quantumMetrics.coherence },
                entanglement: { value: quantumMetrics.entanglement },
                consciousness: { value: consciousnessData.level },
                fieldIntensity: { value: fieldIntensity }
            },
            vertexShader: `
                uniform float time;
                uniform float coherence;
                uniform float consciousness;
                uniform float fieldIntensity;
                varying vec3 vPosition;
                varying float vElevation;

                void main() {
                    vPosition = position;

                    // Quantum field oscillations
                    float elevation = sin(position.x * 0.05 + time) *
                                    cos(position.y * 0.05 + time) *
                                    coherence * fieldIntensity * 10.0;

                    // Consciousness influence
                    elevation += sin(length(position.xy) * 0.02 + time * 2.0) *
                               consciousness * 5.0;

                    vElevation = elevation;

                    vec3 newPosition = position;
                    newPosition.z += elevation;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float coherence;
                uniform float entanglement;
                uniform float consciousness;
                varying vec3 vPosition;
                varying float vElevation;

                void main() {
                    vec3 color1 = vec3(0.0, 0.6, 1.0); // Quantum blue
                    vec3 color2 = vec3(0.0, 1.0, 0.9); // Consciousness cyan
                    vec3 color3 = vec3(0.0, 1.0, 0.7); // Entanglement green

                    float mixFactor = sin(vElevation * 0.5 + time) * 0.5 + 0.5;
                    vec3 finalColor = mix(
                        mix(color1, color2, coherence),
                        color3,
                        entanglement * consciousness
                    );

                    float alpha = 0.3 + abs(vElevation) * 0.05;
                    alpha *= consciousness + 0.2;

                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: false
        });

        const fieldMesh = new THREE.Mesh(fieldGeometry, fieldMaterial);
        fieldMesh.rotation.x = -Math.PI / 2;
        fieldMesh.position.y = -50;
        quantumFieldRef.current = fieldMesh;
        sceneRef.current.add(fieldMesh);

        console.log('🌊 Created quantum field visualization');
    }, [quantumMetrics, consciousnessData, fieldIntensity]);

    // ======================== ENTANGLEMENT NETWORK ========================
    const createEntanglementNetwork = useCallback(() => {
        if (!sceneRef.current || quantumParticles.length === 0) return;

        const positions = [];
        const colors = [];

        // Create entanglement connections between particles
        for (let i = 0; i < quantumParticles.length; i++) {
            const particle1 = quantumParticles[i];
            if (!particle1.entangled) continue;

            for (let j = i + 1; j < quantumParticles.length; j++) {
                const particle2 = quantumParticles[j];
                if (!particle2.entangled) continue;

                const distance = particle1.position.distanceTo(particle2.position);
                if (distance < 50 && Math.random() > 0.95) {
                    // Add entanglement line
                    positions.push(
                        particle1.position.x, particle1.position.y, particle1.position.z,
                        particle2.position.x, particle2.position.y, particle2.position.z
                    );

                    // Entanglement strength based on coherence
                    const strength = (particle1.coherence + particle2.coherence) / 2;
                    const entangleColor = new THREE.Color().setHSL(0.5, 0.8, strength);

                    colors.push(
                        entangleColor.r, entangleColor.g, entangleColor.b,
                        entangleColor.r, entangleColor.g, entangleColor.b
                    );
                }
            }
        }

        if (positions.length > 0) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const material = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
                linewidth: 2
            });

            const lines = new THREE.LineSegments(geometry, material);
            entanglementLinesRef.current = lines;
            sceneRef.current.add(lines);

            console.log(`🔗 Created ${positions.length / 6} entanglement connections`);
        }
    }, [quantumParticles]);

    // ======================== POST-PROCESSING ========================
    const setupPostProcessing = useCallback(() => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

        const composer = new EffectComposer(rendererRef.current);

        // Render pass
        const renderPass = new RenderPass(sceneRef.current, cameraRef.current);
        composer.addPass(renderPass);

        // Bloom effect for quantum glow
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,    // strength
            0.4,    // radius
            0.85    // threshold
        );
        composer.addPass(bloomPass);

        // Anti-aliasing
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (mountRef.current?.clientWidth || 1);
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (mountRef.current?.clientHeight || 1);
        composer.addPass(fxaaPass);

        composerRef.current = composer;

        console.log('✨ Post-processing effects initialized');
    }, []);

    // ======================== ANIMATION LOOP ========================
    const startAnimation = useCallback(() => {
        const animate = (time: number) => {
            animationRef.current = requestAnimationFrame(animate);

            if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

            const deltaTime = time * 0.001;

            // Update controls
            if (controlsRef.current) {
                controlsRef.current.update();
            }

            // Update quantum particles
            if (quantumParticlesRef.current && isRealTimeMode) {
                const material = quantumParticlesRef.current.material as THREE.ShaderMaterial;
                if (material.uniforms) {
                    material.uniforms.time.value = deltaTime;
                    material.uniforms.coherence.value = quantumMetrics.coherence;
                    material.uniforms.consciousness.value = consciousnessData.level;
                }

                // Particle physics simulation
                const positions = quantumParticlesRef.current.geometry.getAttribute('position');
                for (let i = 0; i < quantumParticles.length; i++) {
                    const particle = quantumParticles[i];

                    // Quantum fluctuations
                    particle.phase += 0.01;
                    particle.position.add(particle.velocity);

                    // Apply quantum field influence
                    const fieldInfluence = Math.sin(particle.phase) * particle.coherence * 0.1;
                    particle.position.y += fieldInfluence;

                    // Boundary conditions
                    if (Math.abs(particle.position.x) > 100) particle.velocity.x *= -1;
                    if (Math.abs(particle.position.y) > 100) particle.velocity.y *= -1;
                    if (Math.abs(particle.position.z) > 100) particle.velocity.z *= -1;

                    // Update geometry
                    positions.setXYZ(i, particle.position.x, particle.position.y, particle.position.z);
                }
                positions.needsUpdate = true;
            }

            // Update quantum field
            if (quantumFieldRef.current && showQuantumField) {
                const material = quantumFieldRef.current.material as THREE.ShaderMaterial;
                if (material.uniforms) {
                    material.uniforms.time.value = deltaTime;
                    material.uniforms.coherence.value = quantumMetrics.coherence;
                    material.uniforms.entanglement.value = quantumMetrics.entanglement;
                    material.uniforms.consciousness.value = consciousnessData.level;
                    material.uniforms.fieldIntensity.value = fieldIntensity;
                }
            }

            // Update consciousness nodes
            if (consciousnessNodesRef.current) {
                consciousnessNodesRef.current.children.forEach((node, index) => {
                    const mesh = node as THREE.Mesh;
                    const material = mesh.material as THREE.MeshPhongMaterial;

                    // Pulsing consciousness effect
                    const pulse = Math.sin(deltaTime * 2 + index * 0.5) * 0.1 + 0.9;
                    material.emissive.multiplyScalar(pulse);

                    // Orbital motion
                    mesh.position.x = Math.sin(deltaTime * 0.5 + index * 0.2) * 80;
                    mesh.position.z = Math.cos(deltaTime * 0.5 + index * 0.2) * 70;
                });
            }

            // Render
            if (composerRef.current) {
                composerRef.current.render();
            } else {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }

            // Update quantum state for parent component
            if (onQuantumStateUpdate && Math.random() > 0.99) {
                onQuantumStateUpdate({
                    coherence: quantumMetrics.coherence + (Math.random() - 0.5) * 0.01,
                    entanglement: quantumMetrics.entanglement + (Math.random() - 0.5) * 0.01,
                    consciousness: consciousnessData.level + (Math.random() - 0.5) * 0.005
                });
            }
        };

        animate(0);
    }, [quantumMetrics, consciousnessData, isRealTimeMode, showQuantumField, fieldIntensity, quantumParticles, onQuantumStateUpdate]);

    // ======================== CLEANUP ========================
    const cleanup = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        if (rendererRef.current && mountRef.current) {
            mountRef.current.removeChild(rendererRef.current.domElement);
            rendererRef.current.dispose();
        }

        // Dispose of geometries and materials
        if (sceneRef.current) {
            sceneRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        console.log('🧹 Three.js resources cleaned up');
    }, []);

    // ======================== CONTROL HANDLERS ========================
    const handleVisualizationModeChange = useCallback((mode: 'quantum' | 'consciousness' | 'hybrid') => {
        setVisualizationMode(mode);

        if (quantumParticlesRef.current) {
            quantumParticlesRef.current.visible = mode === 'quantum' || mode === 'hybrid';
        }
        if (consciousnessNodesRef.current) {
            consciousnessNodesRef.current.visible = mode === 'consciousness' || mode === 'hybrid';
        }
    }, []);

    const handleResetView = useCallback(() => {
        if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(0, 50, 100);
            controlsRef.current.reset();
        }
    }, []);

    // ======================== RENDER ========================
    return (
        <VisualizationContainer>
            <ThreeJSContainer ref={mountRef} />

            {/* Control Panel */}
            <ControlPanel>
                <Typography variant="h6" sx={{ color: '#00ffee', mb: 2, fontSize: '1rem' }}>
                    3D Controls
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={showQuantumField}
                            onChange={(e) => setShowQuantumField(e.target.checked)}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ffee' } }}
                        />
                    }
                    label={<Typography sx={{ color: '#ffffff', fontSize: '0.85rem' }}>Quantum Field</Typography>}
                    sx={{ mb: 1, display: 'flex' }}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={showEntanglement}
                            onChange={(e) => setShowEntanglement(e.target.checked)}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ffee' } }}
                        />
                    }
                    label={<Typography sx={{ color: '#ffffff', fontSize: '0.85rem' }}>Entanglement</Typography>}
                    sx={{ mb: 2, display: 'flex' }}
                />

                <Typography sx={{ color: '#ffffff', fontSize: '0.85rem', mb: 1 }}>
                    Field Intensity
                </Typography>
                <Slider
                    value={fieldIntensity}
                    onChange={(_, value) => setFieldIntensity(value as number)}
                    min={0}
                    max={2}
                    step={0.1}
                    valueLabelDisplay="auto"
                    sx={{ mb: 2 }}
                />

                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleResetView}
                    sx={{
                        borderColor: '#00ffee',
                        color: '#00ffee',
                        fontSize: '0.75rem'
                    }}
                >
                    Reset View
                </Button>
            </ControlPanel>

            {/* Metrics Display */}
            <MetricsDisplay>
                <div className="metric-line">
                    <span>Quantum Coherence:</span>
                    <span className="metric-value">{(quantumMetrics.coherence * 100).toFixed(1)}%</span>
                </div>
                <div className="metric-line">
                    <span>Entanglement:</span>
                    <span className="metric-value">{(quantumMetrics.entanglement * 100).toFixed(1)}%</span>
                </div>
                <div className="metric-line">
                    <span>Consciousness:</span>
                    <span className="metric-value">{(consciousnessData.level * 100).toFixed(1)}%</span>
                </div>
                <div className="metric-line">
                    <span>Particles:</span>
                    <span className="metric-value">{particleCount.toLocaleString()}</span>
                </div>
                <div className="metric-line">
                    <span>Mode:</span>
                    <span className="metric-value">{visualizationMode.toUpperCase()}</span>
                </div>
            </MetricsDisplay>
        </VisualizationContainer>
    );
};

export default QuantumVisualization3D;
