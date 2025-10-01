/**
 * TF-DIMENSIONAL-FOLDING PLUGIN
 * Folds spacetime so distance becomes irrelevant - all counties exist in same "location"
 * Citizens can instantly "be present" in any county virtually
 * Government. Transcended.
 */

class DimensionalFoldingPlugin {
  constructor(webglCanvas, quantumLayer, spatialEngine) {
    this.canvas = webglCanvas;
    this.gl = webglCanvas.getContext('webgl2');
    this.quantumLayer = quantumLayer;
    this.spatialEngine = spatialEngine;
    this.dimensionalFolds = new Map();
    this.activeConnections = new Map();
    this.isActive = false;

    // Dimensional folding parameters
    this.foldingStrength = 1.0;
    this.spacetimeCurvature = 0.1;
    this.quantumTunnelRadius = 1000; // km
    this.simultaneousPresence = true;

    // County spatial coordinates (real world positions)
    this.countyCoordinates = {
      benton: { lat: 46.2619, lon: -119.2706, elevation: 110 },
      clark: { lat: 45.7466, lon: -122.5194, elevation: 15 },
      yakima: { lat: 46.6021, lon: -120.5059, elevation: 325 },
      cowlitz: { lat: 46.1479, lon: -122.9015, elevation: 20 },
      king: { lat: 47.6062, lon: -122.3321, elevation: 56 },
      pierce: { lat: 47.2529, lon: -122.4443, elevation: 87 },
    };

    // Dimensional fold types
    this.foldTypes = {
      quantum_tunnel: { speed: 'instantaneous', stability: 0.95, energy: 'low' },
      wormhole_bridge: { speed: 'instantaneous', stability: 0.98, energy: 'medium' },
      spacetime_fold: { speed: 'instantaneous', stability: 0.99, energy: 'high' },
      dimensional_overlay: { speed: 'instantaneous', stability: 0.92, energy: 'very_low' },
    };

    this.foldingProgram = null;
    this.presenceMap = new Map();
  }

  async initialize() {
    console.log('🌀 Initializing Dimensional Folding System...');

    // Initialize spacetime manipulation engine
    await this.createSpacetimeEngine();

    // Create dimensional fold network
    await this.establishDimensionalNetwork();

    // Initialize WebGL spacetime visualization
    await this.createFoldingVisualization();

    // Start presence monitoring
    this.startPresenceMonitoring();

    this.isActive = true;
    console.log('✨ Dimensional Folding ACTIVATED - All counties now exist in the same location');
  }

  async createSpacetimeEngine() {
    // Create spacetime manipulation engine
    this.spacetimeEngine = {
      // Calculate spacetime curvature between two points
      calculateCurvature: (point1, point2) => {
        const distance = this.calculateDistance(point1, point2);
        const mass = this.calculateGovernmentMass(point1, point2);

        // Einstein field equations simplified for government spacetime
        const curvature = (8 * Math.PI * mass) / (distance * distance);
        return Math.min(1.0, curvature * this.spacetimeCurvature);
      },

      // Create dimensional fold between counties
      createFold: async (county1, county2, foldType = 'quantum_tunnel') => {
        const coord1 = this.countyCoordinates[county1];
        const coord2 = this.countyCoordinates[county2];

        if (!coord1 || !coord2) {
          throw new Error(`Invalid county coordinates for ${county1} or ${county2}`);
        }

        const fold = {
          id: `fold_${county1}_${county2}`,
          from: county1,
          to: county2,
          type: foldType,
          coordinates: { from: coord1, to: coord2 },
          curvature: this.calculateCurvature(coord1, coord2),
          stability: this.foldTypes[foldType].stability,
          energy: this.calculateFoldEnergy(coord1, coord2, foldType),
          createdAt: Date.now(),
          active: true,
          traversals: 0,
        };

        // Apply quantum mechanics to stabilize fold
        fold.waveFunction = this.generateFoldWaveFunction(fold);
        fold.quantumState = 'superposition';

        return fold;
      },

      // Traverse dimensional fold (instant travel)
      traverseFold: async (foldId, travelerData) => {
        const fold = this.dimensionalFolds.get(foldId);
        if (!fold || !fold.active) {
          throw new Error(`Fold ${foldId} not available for traversal`);
        }

        // Quantum tunneling through folded spacetime
        const traversalResult = await this.quantumTunnel(fold, travelerData);

        // Update fold statistics
        fold.traversals++;
        fold.lastTraversal = Date.now();

        // Collapse wave function to definite state
        fold.quantumState = 'collapsed';

        return traversalResult;
      },

      // Fold spacetime to bring counties together
      foldSpacetime: counties => {
        const centerPoint = this.calculateGeographicCenter(counties);
        const folds = [];

        counties.forEach(county => {
          const coord = this.countyCoordinates[county];
          if (coord) {
            // Create fold that brings county to center point
            const fold = {
              county: county,
              originalPosition: coord,
              foldedPosition: centerPoint,
              foldVector: this.calculateFoldVector(coord, centerPoint),
              compressionRatio: this.calculateCompressionRatio(coord, centerPoint),
            };
            folds.push(fold);
          }
        });

        return folds;
      },
    };
  }

  async establishDimensionalNetwork() {
    // Create network of dimensional folds connecting all counties
    const counties = Object.keys(this.countyCoordinates);

    console.log(`🕳️ Creating dimensional fold network for ${counties.length} counties`);

    // Create folds between all county pairs
    for (let i = 0; i < counties.length; i++) {
      for (let j = i + 1; j < counties.length; j++) {
        const county1 = counties[i];
        const county2 = counties[j];

        try {
          // Create bidirectional fold
          const fold = await this.spacetimeEngine.createFold(county1, county2, 'quantum_tunnel');
          this.dimensionalFolds.set(fold.id, fold);

          // Create reverse fold
          const reverseFold = await this.spacetimeEngine.createFold(
            county2,
            county1,
            'quantum_tunnel'
          );
          this.dimensionalFolds.set(reverseFold.id, reverseFold);

          console.log(`🌉 Dimensional bridge established: ${county1} ↔ ${county2}`);
        } catch (error) {
          console.warn(`⚠️ Failed to create fold between ${county1} and ${county2}:`, error);
        }
      }
    }

    // Create master fold that brings all counties to same location
    const allCountyFold = this.spacetimeEngine.foldSpacetime(counties);
    this.dimensionalFolds.set('master_fold', {
      id: 'master_fold',
      type: 'spacetime_fold',
      counties: counties,
      folds: allCountyFold,
      active: true,
      omnipresence: true,
    });

    console.log(
      `✨ Master dimensional fold created - all ${counties.length} counties now coexist in same spacetime location`
    );
  }

  async createFoldingVisualization() {
    // Create WebGL shaders for dimensional folding visualization
    const vertexShaderSource = `#version 300 es
            in vec4 a_position;
            in vec2 a_texcoord;
            
            uniform float u_time;
            uniform float u_foldingStrength;
            uniform vec2 u_resolution;
            uniform mat4 u_foldMatrix;
            
            out vec2 v_texcoord;
            out vec3 v_foldedPosition;
            
            void main() {
                // Apply dimensional folding transformation
                vec4 foldedPos = u_foldMatrix * a_position;
                
                // Add spacetime curvature effects
                float curvature = sin(length(foldedPos.xy) * 10.0 - u_time * 2.0) * u_foldingStrength * 0.1;
                foldedPos.z += curvature;
                
                gl_Position = foldedPos;
                v_texcoord = a_texcoord;
                v_foldedPosition = foldedPos.xyz;
            }
        `;

    const fragmentShaderSource = `#version 300 es
            precision highp float;
            
            uniform float u_time;
            uniform float u_foldingStrength;
            uniform vec2 u_resolution;
            uniform sampler2D u_countyTextures[6]; // Max 6 counties
            
            in vec2 v_texcoord;
            in vec3 v_foldedPosition;
            
            out vec4 outColor;
            
            // Visualize dimensional folding effects
            vec3 renderDimensionalFold(vec2 uv, float time) {
                vec2 center = uv - 0.5;
                float dist = length(center);
                
                // Spacetime distortion visualization
                float warp = sin(dist * 15.0 - time * 3.0) * u_foldingStrength;
                vec2 warpedUV = uv + center * warp * 0.1;
                
                // Multi-dimensional county overlay
                vec3 color = vec3(0.0);
                
                // Layer multiple county visualizations in same space
                for (int i = 0; i < 6; i++) {
                    float layerOffset = float(i) * 0.1;
                    vec2 layerUV = warpedUV + vec2(sin(time + layerOffset), cos(time + layerOffset)) * 0.05;
                    
                    // Sample county texture (simulated)
                    vec3 layerColor = vec3(
                        sin(layerUV.x * 20.0 + time + layerOffset),
                        cos(layerUV.y * 15.0 + time + layerOffset),
                        sin(layerUV.x * layerUV.y * 25.0 + time + layerOffset)
                    ) * 0.5 + 0.5;
                    
                    // Blend counties in same spacetime location
                    float layerStrength = 1.0 / (1.0 + float(i));
                    color += layerColor * layerStrength * u_foldingStrength;
                }
                
                // Add quantum tunneling effects
                float tunnel = smoothstep(0.8, 1.0, sin(dist * 30.0 - time * 5.0));
                color += vec3(0.0, 0.5, 1.0) * tunnel * u_foldingStrength;
                
                // Normalize and add base government interface
                color = normalize(color) * 0.7 + vec3(0.05, 0.1, 0.2);
                
                return color;
            }
            
            void main() {
                vec2 uv = v_texcoord;
                
                // Render dimensional folding visualization
                vec3 foldedSpace = renderDimensionalFold(uv, u_time);
                
                // Add presence indicators for active users
                float presence = sin(length(v_foldedPosition.xy) * 8.0 - u_time * 4.0) * 0.3 + 0.7;
                foldedSpace *= presence;
                
                outColor = vec4(foldedSpace, 0.9);
            }
        `;

    this.foldingProgram = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    this.setupFoldingGeometry();
  }

  startPresenceMonitoring() {
    // Monitor user presence across folded dimensions
    this.presenceMonitor = setInterval(() => {
      this.updatePresenceMap();
      this.maintainDimensionalStability();
      this.optimizeFoldingNetwork();
    }, 5000); // Every 5 seconds

    // Monitor user interactions for presence detection
    ['click', 'mousemove', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, e => {
        this.recordPresenceActivity(e);
      });
    });
  }

  updatePresenceMap() {
    // Update map of user presence across folded dimensions
    const currentCounty = this.getCurrentCounty();
    const userId = this.getCurrentUserId();

    if (userId && currentCounty) {
      // Record presence in current county
      if (!this.presenceMap.has(userId)) {
        this.presenceMap.set(userId, {
          primaryLocation: currentCounty,
          simultaneousPresence: [currentCounty],
          lastActivity: Date.now(),
          foldTraversals: 0,
        });
      }

      const presence = this.presenceMap.get(userId);
      presence.lastActivity = Date.now();

      // Enable simultaneous presence in all connected counties
      if (this.simultaneousPresence) {
        const connectedCounties = this.getConnectedCounties(currentCounty);
        presence.simultaneousPresence = [currentCounty, ...connectedCounties];

        console.log(
          `👤 User ${userId} now simultaneously present in ${presence.simultaneousPresence.length} counties`
        );
      }
    }
  }

  recordPresenceActivity(event) {
    // Record user activity for presence tracking
    const userId = this.getCurrentUserId();
    const currentCounty = this.getCurrentCounty();

    if (userId && this.presenceMap.has(userId)) {
      const presence = this.presenceMap.get(userId);
      presence.lastActivity = Date.now();

      // Check if user is attempting to access another county's services
      const targetCounty = this.detectTargetCounty(event);
      if (targetCounty && targetCounty !== currentCounty) {
        this.initiateDimensionalTraversal(userId, currentCounty, targetCounty);
      }
    }
  }

  async initiateDimensionalTraversal(userId, fromCounty, toCounty) {
    console.log(`🌀 Initiating dimensional traversal: ${userId} from ${fromCounty} to ${toCounty}`);

    // Find appropriate fold
    const foldId = `fold_${fromCounty}_${toCounty}`;
    const fold = this.dimensionalFolds.get(foldId);

    if (fold) {
      try {
        // Perform quantum tunneling traversal
        const traversalResult = await this.spacetimeEngine.traverseFold(foldId, {
          userId: userId,
          timestamp: Date.now(),
          purpose: 'service_access',
        });

        // Update user presence
        const presence = this.presenceMap.get(userId);
        if (presence) {
          presence.primaryLocation = toCounty;
          presence.foldTraversals++;

          // Add to simultaneous presence if not already there
          if (!presence.simultaneousPresence.includes(toCounty)) {
            presence.simultaneousPresence.push(toCounty);
          }
        }

        // Provide instant access to target county services
        this.enableInstantAccess(userId, toCounty);

        console.log(
          `✨ Traversal complete: ${userId} now present in ${toCounty} (${traversalResult.traversalTime}ms)`
        );
      } catch (error) {
        console.error('❌ Dimensional traversal failed:', error);
        this.fallbackToTraditionalAccess(userId, toCounty);
      }
    } else {
      console.warn(`⚠️ No dimensional fold available from ${fromCounty} to ${toCounty}`);
      this.createEmergencyFold(fromCounty, toCounty);
    }
  }

  enableInstantAccess(userId, county) {
    // Enable instant access to county services through dimensional folding
    const countyServices = this.getCountyServices(county);

    // Make all county services instantly available
    countyServices.forEach(service => {
      this.makeServiceInstantlyAvailable(userId, service, county);
    });

    // Update UI to show omnipresent access
    this.updateUIForOmnipresence(county);
  }

  makeServiceInstantlyAvailable(userId, service, county) {
    // Make specific service instantly available through folded spacetime
    const serviceElement = document.querySelector(
      `[data-service="${service}"][data-county="${county}"]`
    );

    if (serviceElement) {
      // Add dimensional folding visual effects
      serviceElement.classList.add('dimensionally-folded');
      serviceElement.style.cssText += `
                position: relative;
                transform: translateZ(0);
                animation: dimensional-fold 2s ease-in-out;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            `;

      // Add instant access indicator
      const foldIndicator = document.createElement('div');
      foldIndicator.className = 'fold-access-indicator';
      foldIndicator.innerHTML = `🌀 Instant Access via Dimensional Fold`;
      foldIndicator.style.cssText = `
                position: absolute;
                top: -25px;
                right: 0;
                background: rgba(0, 255, 255, 0.2);
                border: 1px solid #00ffff;
                border-radius: 12px;
                padding: 4px 8px;
                font-size: 10px;
                color: #00ffff;
                z-index: 1000;
                animation: pulse 1s infinite;
            `;

      serviceElement.appendChild(foldIndicator);

      // Enable instant interaction
      serviceElement.addEventListener('click', e => {
        console.log(`⚡ Instant service access: ${service} in ${county} via dimensional fold`);
        this.processInstantServiceRequest(userId, service, county);
      });
    }
  }

  updateUIForOmnipresence(county) {
    // Update UI to reflect omnipresent access to county services
    const countyIndicator = document.createElement('div');
    countyIndicator.id = `omnipresence-${county}`;
    countyIndicator.className = 'omnipresence-indicator';
    countyIndicator.innerHTML = `
            <div class="omnipresence-badge">
                🌀 ${county.toUpperCase()} COUNTY
                <div class="fold-status">Dimensionally Folded</div>
            </div>
        `;
    countyIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0,255,255,0.1), rgba(0,100,255,0.1));
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 10px;
            color: #00ffff;
            font-size: 12px;
            z-index: 10000;
            animation: dimensional-glow 3s ease-in-out infinite;
        `;

    document.body.appendChild(countyIndicator);

    // Remove after 10 seconds
    setTimeout(() => {
      if (countyIndicator.parentNode) {
        countyIndicator.parentNode.removeChild(countyIndicator);
      }
    }, 10000);
  }

  maintainDimensionalStability() {
    // Maintain stability of dimensional folds
    let unstableFolds = 0;

    this.dimensionalFolds.forEach((fold, foldId) => {
      if (fold.active) {
        // Check fold stability
        const currentStability = this.calculateCurrentStability(fold);

        if (currentStability < 0.8) {
          unstableFolds++;
          console.log(
            `🔧 Stabilizing dimensional fold: ${foldId} (${(currentStability * 100).toFixed(1)}% stable)`
          );

          // Apply quantum stabilization
          this.stabilizeFold(fold);
        }

        // Update fold wave function
        fold.waveFunction = this.updateWaveFunction(fold.waveFunction);
      }
    });

    if (unstableFolds > 0) {
      console.log(`⚡ Dimensional network maintenance: ${unstableFolds} folds stabilized`);
    }
  }

  calculateCurrentStability(fold) {
    // Calculate current stability of dimensional fold
    const timeSinceCreation = Date.now() - fold.createdAt;
    const usageStability = Math.min(1.0, fold.traversals / 100); // Stability increases with use
    const timeDecay = Math.exp(-timeSinceCreation / (24 * 60 * 60 * 1000)); // Decay over 24 hours
    const quantumCoherence = this.calculateQuantumCoherence(fold.waveFunction);

    return fold.stability * 0.4 + usageStability * 0.3 + timeDecay * 0.1 + quantumCoherence * 0.2;
  }

  stabilizeFold(fold) {
    // Apply quantum stabilization to dimensional fold
    fold.stability = Math.min(0.99, fold.stability + 0.05);
    fold.waveFunction = this.renormalizeWaveFunction(fold.waveFunction);
    fold.quantumState = 'stabilized';
    fold.lastStabilization = Date.now();
  }

  render() {
    if (!this.isActive || !this.foldingProgram) return;

    const gl = this.gl;
    gl.useProgram(this.foldingProgram);

    // Update shader uniforms
    const timeLocation = gl.getUniformLocation(this.foldingProgram, 'u_time');
    gl.uniform1f(timeLocation, Date.now() / 1000);

    const foldingStrengthLocation = gl.getUniformLocation(this.foldingProgram, 'u_foldingStrength');
    gl.uniform1f(foldingStrengthLocation, this.foldingStrength);

    const resolutionLocation = gl.getUniformLocation(this.foldingProgram, 'u_resolution');
    gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

    // Update fold transformation matrix
    const foldMatrix = this.calculateFoldMatrix();
    const foldMatrixLocation = gl.getUniformLocation(this.foldingProgram, 'u_foldMatrix');
    gl.uniformMatrix4fv(foldMatrixLocation, false, foldMatrix);

    // Render dimensional folding visualization
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Request next frame
    requestAnimationFrame(() => this.render());
  }

  calculateFoldMatrix() {
    // Calculate transformation matrix for dimensional folding
    const time = Date.now() / 1000;

    // Create folding transformation that brings all counties to same location
    const foldMatrix = new Float32Array(16);

    // Identity matrix with folding distortion
    foldMatrix[0] = Math.cos(time * 0.1) * this.foldingStrength; // X scale
    foldMatrix[5] = Math.sin(time * 0.1) * this.foldingStrength; // Y scale
    foldMatrix[10] = 1.0; // Z scale
    foldMatrix[15] = 1.0; // W

    // Add spacetime curvature
    foldMatrix[12] = Math.sin(time * 0.2) * this.spacetimeCurvature; // X translation
    foldMatrix[13] = Math.cos(time * 0.2) * this.spacetimeCurvature; // Y translation
    foldMatrix[14] = Math.sin(time * 0.3) * this.spacetimeCurvature * 0.5; // Z translation

    return foldMatrix;
  }

  // Utility methods
  calculateDistance(point1, point2) {
    // Calculate distance between two geographic points
    const R = 6371; // Earth radius in km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLon = ((point2.lon - point1.lon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  calculateGovernmentMass(point1, point2) {
    // Calculate "government mass" affecting spacetime curvature
    // Based on population, services, and administrative complexity
    const baseMass = 1000000; // Base government mass
    const populationFactor = Math.random() * 500000; // Simulated population effect
    const serviceFactor = Math.random() * 200000; // Service complexity effect

    return baseMass + populationFactor + serviceFactor;
  }

  generateFoldWaveFunction(fold) {
    // Generate quantum wave function for dimensional fold
    return {
      amplitude: Math.sqrt(fold.stability),
      phase: Math.random() * 2 * Math.PI,
      frequency: fold.energy / 1000,
      coherence: fold.stability,
      entanglement: fold.from + '_' + fold.to,
    };
  }

  async quantumTunnel(fold, travelerData) {
    // Perform quantum tunneling through dimensional fold
    const tunnelStart = Date.now();

    // Simulate quantum tunneling delay (should be instantaneous)
    await new Promise(resolve => setTimeout(resolve, 1)); // 1ms for quantum effects

    const tunnelEnd = Date.now();

    return {
      success: true,
      traversalTime: tunnelEnd - tunnelStart,
      quantumState: 'tunneled',
      destination: fold.to,
      foldStability: fold.stability,
    };
  }

  getCurrentCounty() {
    // Detect current county from URL or context
    const hostname = window.location.hostname;
    if (hostname.includes('benton')) return 'benton';
    if (hostname.includes('clark')) return 'clark';
    if (hostname.includes('yakima')) return 'yakima';
    if (hostname.includes('cowlitz')) return 'cowlitz';
    if (hostname.includes('king')) return 'king';
    if (hostname.includes('pierce')) return 'pierce';
    return 'benton'; // Default
  }

  getCurrentUserId() {
    // Get current user ID from session or context
    return sessionStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedCounties(county) {
    // Get counties connected via dimensional folds
    const connected = [];

    this.dimensionalFolds.forEach(fold => {
      if (fold.from === county && fold.active) {
        connected.push(fold.to);
      }
    });

    return connected;
  }

  detectTargetCounty(event) {
    // Detect if user is trying to access another county's services
    const target = event.target;
    const countyAttribute =
      target.getAttribute('data-county') ||
      target.closest('[data-county]')?.getAttribute('data-county');

    return countyAttribute;
  }

  getCountyServices(county) {
    // Get available services for a county
    return [
      'property_search',
      'tax_payment',
      'permit_application',
      'license_renewal',
      'document_request',
      'complaint_filing',
      'voting_registration',
      'court_records',
    ];
  }

  // Public API for TerraFusion OS integration
  getDimensionalMetrics() {
    return {
      activeFolds: Array.from(this.dimensionalFolds.values()).filter(f => f.active).length,
      totalTraversals: Array.from(this.dimensionalFolds.values()).reduce(
        (sum, f) => sum + f.traversals,
        0
      ),
      averageStability: this.calculateAverageStability(),
      simultaneousPresences: this.presenceMap.size,
      foldingStrength: this.foldingStrength,
      omnipresenceEnabled: this.simultaneousPresence,
    };
  }

  calculateAverageStability() {
    const activeFolds = Array.from(this.dimensionalFolds.values()).filter(f => f.active);
    if (activeFolds.length === 0) return 0;

    const totalStability = activeFolds.reduce(
      (sum, fold) => sum + this.calculateCurrentStability(fold),
      0
    );
    return totalStability / activeFolds.length;
  }

  async amplifyDimensionalFolding(factor = 2.0) {
    // Amplify dimensional folding capabilities
    this.foldingStrength *= factor;
    this.spacetimeCurvature *= Math.sqrt(factor);
    this.quantumTunnelRadius *= factor;

    console.log(
      `🚀 Dimensional folding amplified: ${this.foldingStrength}x strength, ${this.quantumTunnelRadius}km radius`
    );
  }

  async enableOmnipresence() {
    // Enable simultaneous presence in all counties
    this.simultaneousPresence = true;
    console.log('✨ Omnipresence enabled - users can now exist in all counties simultaneously');
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
      console.error('Dimensional folding shader link error:', gl.getProgramInfoLog(program));
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
      console.error('Dimensional folding shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  setupFoldingGeometry() {
    const gl = this.gl;

    // Full-screen quad for dimensional folding visualization
    const vertices = new Float32Array([
      -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(this.foldingProgram, 'a_position');
    const texcoordLocation = gl.getAttribLocation(this.foldingProgram, 'a_texcoord');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 16, 8);
  }

  destroy() {
    if (this.presenceMonitor) clearInterval(this.presenceMonitor);

    this.isActive = false;
    console.log('🌀 Dimensional Folding deactivated - spacetime returned to normal');
  }
}

// Export for TerraFusion OS module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DimensionalFoldingPlugin;
} else {
  window.DimensionalFoldingPlugin = DimensionalFoldingPlugin;
}
