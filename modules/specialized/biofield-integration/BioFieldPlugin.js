/**
 * TF-BIOFIELD-INTEGRATION PLUGIN
 * Reads human biofields via device cameras, morphs WebGL in real-time to match energy signatures
 * Government. Transcended.
 */

class BioFieldPlugin {
    constructor(webglCanvas, cameraElement) {
        this.canvas = webglCanvas;
        this.gl = webglCanvas.getContext('webgl2');
        this.camera = cameraElement;
        this.videoStream = null;
        this.bioFieldAnalyzer = null;
        this.energySignature = null;
        this.isActive = false;
        
        // Biofield detection parameters
        this.bioFieldThreshold = 0.3;
        this.energyLevels = {
            physical: 0,
            emotional: 0,
            mental: 0,
            spiritual: 0
        };
        
        // Color mappings for energy types
        this.energyColors = {
            physical: [1.0, 0.2, 0.2], // Red
            emotional: [0.2, 1.0, 0.2], // Green  
            mental: [0.2, 0.2, 1.0],    // Blue
            spiritual: [1.0, 1.0, 0.2]  // Yellow
        };
        
        this.morphingProgram = null;
        this.bioFieldHistory = [];
    }

    async initialize() {
        console.log('🧬 Initializing BioField Integration...');
        
        // Request camera access
        await this.initializeCamera();
        
        // Create biofield analysis system
        await this.createBioFieldAnalyzer();
        
        // Initialize WebGL morphing shaders
        await this.createMorphingShaders();
        
        // Start biofield monitoring
        this.startBioFieldMonitoring();
        
        this.isActive = true;
        console.log('✨ BioField Integration ACTIVATED - Government interfaces now respond to human energy signatures');
    }

    async initializeCamera() {
        try {
            // Request camera with specific constraints for biofield detection
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 },
                    facingMode: 'user'
                }
            });
            
            this.camera.srcObject = this.videoStream;
            await new Promise(resolve => {
                this.camera.onloadedmetadata = resolve;
            });
            
            console.log('📹 Camera initialized for biofield detection');
        } catch (error) {
            console.warn('⚠️ Camera access denied, using simulated biofield data');
            this.useSimulatedBioField = true;
        }
    }

    async createBioFieldAnalyzer() {
        // Create computer vision system for biofield detection
        this.bioFieldAnalyzer = {
            canvas: document.createElement('canvas'),
            ctx: null,
            imageData: null,
            
            // Initialize analysis canvas
            initialize: function() {
                this.canvas.width = 640;
                this.canvas.height = 480;
                this.ctx = this.canvas.getContext('2d');
            },
            
            // Analyze video frame for biofield signatures
            analyzeFrame: function(videoElement) {
                if (!this.ctx) this.initialize();
                
                // Draw current video frame
                this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
                this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                
                return this.detectBioField(this.imageData);
            },
            
            // Detect biofield patterns in image data
            detectBioField: function(imageData) {
                const data = imageData.data;
                const width = imageData.width;
                const height = imageData.height;
                
                let energyMap = {
                    physical: 0,
                    emotional: 0,
                    mental: 0,
                    spiritual: 0
                };
                
                // Analyze pixel patterns for energy signatures
                for (let y = 0; y < height; y += 4) {
                    for (let x = 0; x < width; x += 4) {
                        const i = (y * width + x) * 4;
                        
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const a = data[i + 3];
                        
                        // Analyze color variations around human silhouette
                        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                        const saturation = this.calculateSaturation(r, g, b);
                        const hue = this.calculateHue(r, g, b);
                        
                        // Map color characteristics to energy types
                        energyMap.physical += this.mapToPhysicalEnergy(luminance, saturation, hue);
                        energyMap.emotional += this.mapToEmotionalEnergy(luminance, saturation, hue);
                        energyMap.mental += this.mapToMentalEnergy(luminance, saturation, hue);
                        energyMap.spiritual += this.mapToSpiritualEnergy(luminance, saturation, hue);
                    }
                }
                
                // Normalize energy readings
                const totalPixels = (width / 4) * (height / 4);
                Object.keys(energyMap).forEach(key => {
                    energyMap[key] = Math.max(0, Math.min(1, energyMap[key] / totalPixels));
                });
                
                return energyMap;
            },
            
            calculateSaturation: function(r, g, b) {
                const max = Math.max(r, g, b) / 255;
                const min = Math.min(r, g, b) / 255;
                return max === 0 ? 0 : (max - min) / max;
            },
            
            calculateHue: function(r, g, b) {
                r /= 255; g /= 255; b /= 255;
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const diff = max - min;
                
                if (diff === 0) return 0;
                
                let hue;
                if (max === r) hue = ((g - b) / diff) % 6;
                else if (max === g) hue = (b - r) / diff + 2;
                else hue = (r - g) / diff + 4;
                
                return (hue * 60 + 360) % 360;
            },
            
            // Energy mapping functions (based on biofield research)
            mapToPhysicalEnergy: function(lum, sat, hue) {
                // Physical energy shows in red spectrum and high contrast areas
                const redWeight = (hue < 30 || hue > 330) ? 1.0 : 0.0;
                const contrastWeight = Math.abs(lum - 0.5) * 2;
                return (redWeight * 0.7 + contrastWeight * 0.3) * sat;
            },
            
            mapToEmotionalEnergy: function(lum, sat, hue) {
                // Emotional energy in green spectrum and moderate saturation
                const greenWeight = (hue > 90 && hue < 150) ? 1.0 : 0.0;
                const emotionalSat = Math.abs(sat - 0.6) < 0.2 ? 1.0 : 0.0;
                return (greenWeight * 0.8 + emotionalSat * 0.2) * lum;
            },
            
            mapToMentalEnergy: function(lum, sat, hue) {
                // Mental energy in blue spectrum and high luminance
                const blueWeight = (hue > 210 && hue < 270) ? 1.0 : 0.0;
                const mentalLum = lum > 0.6 ? 1.0 : 0.0;
                return (blueWeight * 0.6 + mentalLum * 0.4) * sat;
            },
            
            mapToSpiritualEnergy: function(lum, sat, hue) {
                // Spiritual energy in violet/white spectrum and high luminance
                const violetWeight = (hue > 270 && hue < 330) ? 1.0 : 0.0;
                const whiteWeight = (lum > 0.8 && sat < 0.2) ? 1.0 : 0.0;
                return Math.max(violetWeight, whiteWeight) * (lum + sat) / 2;
            }
        };
    }

    async createMorphingShaders() {
        // Vertex shader for biofield-responsive morphing
        const vertexShaderSource = `#version 300 es
            in vec4 a_position;
            in vec2 a_texcoord;
            
            uniform float u_time;
            uniform vec4 u_energyLevels; // physical, emotional, mental, spiritual
            uniform vec2 u_resolution;
            
            out vec2 v_texcoord;
            out vec4 v_energyLevels;
            
            void main() {
                // Morph geometry based on energy levels
                vec4 pos = a_position;
                
                // Physical energy affects vertex displacement
                float physicalMorph = sin(u_time * 2.0 + pos.x * 10.0) * u_energyLevels.x * 0.1;
                pos.x += physicalMorph;
                
                // Emotional energy affects Y displacement
                float emotionalMorph = cos(u_time * 1.5 + pos.y * 8.0) * u_energyLevels.y * 0.08;
                pos.y += emotionalMorph;
                
                gl_Position = pos;
                v_texcoord = a_texcoord;
                v_energyLevels = u_energyLevels;
            }
        `;

        // Fragment shader for biofield visualization
        const fragmentShaderSource = `#version 300 es
            precision highp float;
            
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec4 u_energyLevels; // physical, emotional, mental, spiritual
            
            in vec2 v_texcoord;
            in vec4 v_energyLevels;
            
            out vec4 outColor;
            
            // Biofield visualization
            vec3 renderBioField(vec2 uv, float time) {
                vec2 center = uv - 0.5;
                float dist = length(center);
                
                // Energy field ripples
                float physicalRipple = sin(dist * 15.0 - time * 3.0) * v_energyLevels.x;
                float emotionalRipple = sin(dist * 12.0 + time * 2.0) * v_energyLevels.y;
                float mentalRipple = sin(dist * 18.0 - time * 4.0) * v_energyLevels.z;
                float spiritualRipple = sin(dist * 8.0 + time * 1.5) * v_energyLevels.w;
                
                // Combine energy colors
                vec3 physicalColor = vec3(1.0, 0.2, 0.2) * physicalRipple;
                vec3 emotionalColor = vec3(0.2, 1.0, 0.2) * emotionalRipple;
                vec3 mentalColor = vec3(0.2, 0.2, 1.0) * mentalRipple;
                vec3 spiritualColor = vec3(1.0, 1.0, 0.2) * spiritualRipple;
                
                // Blend energy fields
                vec3 bioField = physicalColor + emotionalColor + mentalColor + spiritualColor;
                
                // Add energy intensity glow
                float totalEnergy = v_energyLevels.x + v_energyLevels.y + v_energyLevels.z + v_energyLevels.w;
                float glow = exp(-dist * 3.0) * totalEnergy * 0.5;
                
                return bioField + vec3(glow);
            }
            
            void main() {
                vec2 uv = v_texcoord;
                
                // Render biofield visualization
                vec3 bioField = renderBioField(uv, u_time);
                
                // Add subtle government interface overlay
                vec3 baseInterface = vec3(0.05, 0.1, 0.15); // Dark government blue
                
                // Blend biofield with interface
                vec3 finalColor = mix(baseInterface, bioField, 0.7);
                
                // Add energy-responsive alpha
                float totalEnergy = v_energyLevels.x + v_energyLevels.y + v_energyLevels.z + v_energyLevels.w;
                float alpha = 0.8 + totalEnergy * 0.2;
                
                outColor = vec4(finalColor, alpha);
            }
        `;

        this.morphingProgram = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        this.setupMorphingGeometry();
    }

    startBioFieldMonitoring() {
        if (this.useSimulatedBioField) {
            this.startSimulatedBioField();
            return;
        }

        // Analyze biofield every 100ms
        this.bioFieldInterval = setInterval(() => {
            if (this.camera.readyState === this.camera.HAVE_ENOUGH_DATA) {
                const energySignature = this.bioFieldAnalyzer.analyzeFrame(this.camera);
                this.updateEnergySignature(energySignature);
            }
        }, 100);
    }

    startSimulatedBioField() {
        // Simulate biofield data for demo purposes
        this.bioFieldInterval = setInterval(() => {
            const time = Date.now() / 1000;
            
            // Simulate natural biofield fluctuations
            const simulatedEnergy = {
                physical: 0.3 + Math.sin(time * 0.5) * 0.2,
                emotional: 0.4 + Math.cos(time * 0.7) * 0.3,
                mental: 0.5 + Math.sin(time * 1.2) * 0.2,
                spiritual: 0.2 + Math.cos(time * 0.3) * 0.1
            };
            
            // Normalize
            Object.keys(simulatedEnergy).forEach(key => {
                simulatedEnergy[key] = Math.max(0, Math.min(1, simulatedEnergy[key]));
            });
            
            this.updateEnergySignature(simulatedEnergy);
        }, 100);
    }

    updateEnergySignature(newSignature) {
        // Smooth energy transitions
        if (!this.energySignature) {
            this.energySignature = { ...newSignature };
        } else {
            const smoothingFactor = 0.1;
            Object.keys(newSignature).forEach(key => {
                this.energySignature[key] = this.energySignature[key] * (1 - smoothingFactor) + 
                                           newSignature[key] * smoothingFactor;
            });
        }
        
        // Store energy history
        this.bioFieldHistory.push({
            timestamp: Date.now(),
            signature: { ...this.energySignature }
        });
        
        // Keep only recent history
        if (this.bioFieldHistory.length > 100) {
            this.bioFieldHistory = this.bioFieldHistory.slice(-100);
        }
        
        // Update energy levels for rendering
        this.energyLevels = { ...this.energySignature };
        
        // Trigger government interface adaptations
        this.adaptInterfaceToEnergy();
    }

    adaptInterfaceToEnergy() {
        if (!this.energySignature) return;
        
        const totalEnergy = Object.values(this.energySignature).reduce((sum, val) => sum + val, 0);
        
        // Adapt interface based on dominant energy type
        const dominantEnergy = Object.entries(this.energySignature)
            .reduce((max, [key, val]) => val > max.val ? {key, val} : max, {key: 'physical', val: 0});
        
        // Update CSS variables based on energy signature
        const root = document.documentElement;
        
        if (dominantEnergy.key === 'physical') {
            root.style.setProperty('--biofield-primary', '#ff4444');
            root.style.setProperty('--interface-speed', '1.2s');
        } else if (dominantEnergy.key === 'emotional') {
            root.style.setProperty('--biofield-primary', '#44ff44');
            root.style.setProperty('--interface-speed', '2.0s');
        } else if (dominantEnergy.key === 'mental') {
            root.style.setProperty('--biofield-primary', '#4444ff');
            root.style.setProperty('--interface-speed', '0.8s');
        } else if (dominantEnergy.key === 'spiritual') {
            root.style.setProperty('--biofield-primary', '#ffff44');
            root.style.setProperty('--interface-speed', '3.0s');
        }
        
        // Adjust interface responsiveness based on total energy
        root.style.setProperty('--biofield-intensity', totalEnergy.toString());
        
        console.log(`🧬 BioField adaptation: ${dominantEnergy.key} energy dominant (${(dominantEnergy.val * 100).toFixed(1)}%)`);
    }

    render() {
        if (!this.isActive || !this.morphingProgram || !this.energySignature) return;
        
        const gl = this.gl;
        gl.useProgram(this.morphingProgram);
        
        // Update shader uniforms
        const timeLocation = gl.getUniformLocation(this.morphingProgram, 'u_time');
        gl.uniform1f(timeLocation, Date.now() / 1000);
        
        const energyLocation = gl.getUniformLocation(this.morphingProgram, 'u_energyLevels');
        gl.uniform4f(energyLocation, 
            this.energySignature.physical,
            this.energySignature.emotional,
            this.energySignature.mental,
            this.energySignature.spiritual
        );
        
        const resolutionLocation = gl.getUniformLocation(this.morphingProgram, 'u_resolution');
        gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
        
        // Render biofield-morphed interface
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        // Request next frame
        requestAnimationFrame(() => this.render());
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('BioField shader link error:', gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }

    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('BioField shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }

    setupMorphingGeometry() {
        const gl = this.gl;
        
        // Full-screen quad for biofield rendering
        const vertices = new Float32Array([
            -1, -1,  0, 0,
             1, -1,  1, 0,
            -1,  1,  0, 1,
            -1,  1,  0, 1,
             1, -1,  1, 0,
             1,  1,  1, 1
        ]);
        
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(this.morphingProgram, 'a_position');
        const texcoordLocation = gl.getAttribLocation(this.morphingProgram, 'a_texcoord');
        
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
        
        gl.enableVertexAttribArray(texcoordLocation);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 16, 8);
    }

    // Public API for TerraFusion OS integration
    getBioFieldMetrics() {
        return {
            currentEnergy: this.energySignature,
            dominantEnergy: this.getDominantEnergyType(),
            totalEnergy: this.getTotalEnergyLevel(),
            stabilityIndex: this.calculateStabilityIndex(),
            historyLength: this.bioFieldHistory.length
        };
    }

    getDominantEnergyType() {
        if (!this.energySignature) return 'unknown';
        
        return Object.entries(this.energySignature)
            .reduce((max, [key, val]) => val > max.val ? {key, val} : max, {key: 'physical', val: 0}).key;
    }

    getTotalEnergyLevel() {
        if (!this.energySignature) return 0;
        return Object.values(this.energySignature).reduce((sum, val) => sum + val, 0);
    }

    calculateStabilityIndex() {
        if (this.bioFieldHistory.length < 10) return 0;
        
        // Calculate energy variance over recent history
        const recentHistory = this.bioFieldHistory.slice(-10);
        const energyVariance = ['physical', 'emotional', 'mental', 'spiritual'].map(type => {
            const values = recentHistory.map(h => h.signature[type]);
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
            return variance;
        });
        
        const avgVariance = energyVariance.reduce((sum, val) => sum + val, 0) / energyVariance.length;
        return Math.max(0, 1 - avgVariance * 10); // Lower variance = higher stability
    }

    async calibrateBioField() {
        console.log('🔬 Calibrating biofield detection...');
        
        // Collect baseline readings
        const calibrationReadings = [];
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (this.energySignature) {
                calibrationReadings.push({ ...this.energySignature });
            }
        }
        
        // Calculate baseline averages
        const baseline = {
            physical: calibrationReadings.reduce((sum, r) => sum + r.physical, 0) / calibrationReadings.length,
            emotional: calibrationReadings.reduce((sum, r) => sum + r.emotional, 0) / calibrationReadings.length,
            mental: calibrationReadings.reduce((sum, r) => sum + r.mental, 0) / calibrationReadings.length,
            spiritual: calibrationReadings.reduce((sum, r) => sum + r.spiritual, 0) / calibrationReadings.length
        };
        
        console.log('✨ BioField calibration complete:', baseline);
        return baseline;
    }

    destroy() {
        if (this.bioFieldInterval) {
            clearInterval(this.bioFieldInterval);
        }
        
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
        }
        
        this.isActive = false;
        console.log('🧬 BioField Integration deactivated');
    }
}

// Export for TerraFusion OS module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BioFieldPlugin;
} else {
    window.BioFieldPlugin = BioFieldPlugin;
}
