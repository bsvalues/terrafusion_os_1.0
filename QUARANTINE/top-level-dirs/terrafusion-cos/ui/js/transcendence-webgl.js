/**
 * TerraFusion cOS - WebGL Transcendence Background Engine
 * "Government. Transcended."
 * 
 * Creates flowing energy visualization with real-time particle effects
 * Extracted from Brand_Assets/webgl-transcendence-complete.html
 */

export function initTranscendenceBackground(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Transcendence canvas not found:', canvasId);
        return;
    }

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    // Resize canvas to full viewport
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // Update buffer with new dimensions
        if (positionBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            const positions = [
                0, 0,
                canvas.width, 0,
                0, canvas.height,
                canvas.width, canvas.height,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        }
    }

    // Vertex shader - creates the flowing grid
    const vertexShaderSource = `
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        uniform float u_time;
        varying vec2 v_uv;
        
        void main() {
            v_uv = a_position;
            vec2 position = a_position;
            
            // Add wave distortion for flowing effect
            position.y += sin(position.x * 10.0 + u_time * 2.0) * 0.02;
            position.x += cos(position.y * 8.0 + u_time * 1.5) * 0.02;
            
            vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
            gl_Position = vec4(clipSpace, 0, 1);
        }
    `;

    // Fragment shader - creates transcendence colors
    const fragmentShaderSource = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        varying vec2 v_uv;
        
        void main() {
            vec2 st = v_uv / u_resolution;
            vec2 mouse = u_mouse / u_resolution;
            
            // Create flowing energy lines (5 moving particles)
            float energy = 0.0;
            for(float i = 0.0; i < 5.0; i++) {
                vec2 pos = vec2(
                    sin(u_time * 0.5 + i * 1.5) * 0.3 + 0.5,
                    cos(u_time * 0.7 + i * 2.1) * 0.3 + 0.5
                );
                float dist = distance(st, pos);
                energy += 0.01 / (dist + 0.01);
            }
            
            // Mouse interaction - glow follows cursor
            float mouseDist = distance(st, mouse);
            float mouseGlow = 0.05 / (mouseDist + 0.05);
            
            // TerraFusion brand colors
            vec3 color1 = vec3(0.0, 0.6, 1.0);    // #0099ff Trust blue
            vec3 color2 = vec3(0.0, 1.0, 0.933);  // #00ffee Transcendence cyan
            vec3 color3 = vec3(0.0, 1.0, 0.667);  // #00ffaa Success green
            
            // Create flowing gradient
            vec3 finalColor = mix(color1, color2, st.x + sin(u_time) * 0.1);
            finalColor = mix(finalColor, color3, st.y + cos(u_time * 0.8) * 0.1);
            
            // Add energy particles
            finalColor += energy * 0.3;
            
            // Add mouse glow in cyan
            finalColor += mouseGlow * vec3(0.2, 0.8, 1.0);
            
            // Subtle grid overlay
            float grid = step(0.98, sin(st.x * 50.0)) + step(0.98, sin(st.y * 50.0));
            finalColor += grid * 0.05;
            
            // Fade edges for softer appearance
            float fade = 1.0 - distance(st, vec2(0.5, 0.5)) * 1.5;
            fade = clamp(fade, 0.0, 1.0);
            
            // Final output with reduced opacity (0.3) for background effect
            gl_FragColor = vec4(finalColor * fade * 0.3, 1.0);
        }
    `;

    // Compile shader helper
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Transcendence shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }

    // Create WebGL program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create transcendence shaders');
        return;
    }
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Transcendence program link error:', gl.getProgramInfoLog(program));
        return;
    }

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

    // Create position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Initial resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking for interactive glow
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Animation loop
    const startTime = Date.now();
    let animationFrameId;
    
    function render() {
        const time = (Date.now() - startTime) * 0.001; // Convert to seconds
        
        // Clear canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Use shader program
        gl.useProgram(program);
        
        // Set up vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(timeLocation, time);
        gl.uniform2f(mouseLocation, mouseX, mouseY);
        
        // Draw transcendence visualization
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(render);
    }
    
    // Start rendering
    render();
    
    console.log('✨ Transcendence background initialized - Government. Transcended.');
    
    // Return cleanup function
    return function cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener('resize', resizeCanvas);
        console.log('Transcendence background cleaned up');
    };
}
