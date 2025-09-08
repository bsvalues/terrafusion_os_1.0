import React, { useState, useEffect, useRef } from 'react';
import './TerraFusionEnhanced.css';

// County data for A/B testing
const countyData = {
  benton: {
    name: "Benton County",
    properties: "94,149",
    population: "206,873",
    savings: "$477,816",
    efficiency: "379M×",
    testimonial: "Terrafusion transformed our assessment process completely.",
    official: "County Assessor",
    gradient: "linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)",
    icon: "🌾"
  },
  clark: {
    name: "Clark County",
    properties: "178,000",
    population: "503,311",
    savings: "$892,000",
    efficiency: "425M×",
    testimonial: "The clarity we've achieved is unprecedented.",
    official: "IT Director",
    gradient: "linear-gradient(135deg, #004d40 0%, #00695c 100%)",
    icon: "🌲"
  },
  king: {
    name: "King County",
    properties: "542,000",
    population: "2,269,675",
    savings: "$2.8M",
    efficiency: "512M×",
    testimonial: "This is what modern government should be.",
    official: "County Executive",
    gradient: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)",
    icon: "👑"
  },
  snohomish: {
    name: "Snohomish County",
    properties: "312,000",
    population: "827,957",
    savings: "$1.2M",
    efficiency: "398M×",
    testimonial: "Our teams are more confident than ever.",
    official: "Department Head",
    gradient: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)",
    icon: "🏔️"
  },
  pierce: {
    name: "Pierce County",
    properties: "289,000",
    population: "921,130",
    savings: "$1.1M",
    efficiency: "405M×",
    testimonial: "Citizens love the transparency.",
    official: "Public Relations",
    gradient: "linear-gradient(135deg, #e65100 0%, #f57c00 100%)",
    icon: "🌊"
  }
};

// WebGL Particle System Component
const WebGLBackground = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute float a_size;
      attribute float a_alpha;
      
      varying float v_alpha;
      
      uniform vec2 u_resolution;
      uniform float u_time;
      
      void main() {
        vec2 position = a_position;
        position.x += sin(u_time * 0.001 + a_position.y * 0.01) * 50.0;
        position.y += cos(u_time * 0.001 + a_position.x * 0.01) * 30.0;
        
        vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = a_size;
        v_alpha = a_alpha;
      }
    `;
    
    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      
      varying float v_alpha;
      uniform vec3 u_color;
      
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        if(dist > 0.5) {
          discard;
        }
        
        float alpha = (1.0 - dist * 2.0) * v_alpha;
        gl_FragColor = vec4(u_color, alpha);
      }
    `;
    
    // Create shaders
    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    
    // Get locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const sizeLocation = gl.getAttribLocation(program, 'a_size');
    const alphaLocation = gl.getAttribLocation(program, 'a_alpha');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const colorLocation = gl.getUniformLocation(program, 'u_color');
    
    // Create particles
    const particleCount = 100;
    const positions = [];
    const sizes = [];
    const alphas = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions.push(Math.random() * canvas.width, Math.random() * canvas.height);
      sizes.push(Math.random() * 5 + 2);
      alphas.push(Math.random() * 0.5 + 0.2);
    }
    
    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    const sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    
    const alphaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW);
    
    // Animation loop
    let animationId;
    const animate = (time) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      // Set uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);
      gl.uniform3f(colorLocation, 0, 1, 0.93); // Cyan color
      
      // Bind attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.enableVertexAttribArray(sizeLocation);
      gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
      gl.enableVertexAttribArray(alphaLocation);
      gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);
      
      // Draw
      gl.drawArrays(gl.POINTS, 0, particleCount);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate(0);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="webgl-background" />;
};

// Main Enhanced Component
const TerraFusionEnhanced = () => {
  const [selectedCounty, setSelectedCounty] = useState('benton');
  const [variant, setVariant] = useState('control');
  const [metrics, setMetrics] = useState({
    engagementRate: 0,
    timeOnPage: 0,
    ctaClicks: 0,
    conversionRate: 0
  });
  const [startTime] = useState(Date.now());
  const [modules] = useState([
    { id: 'costforge-ai', name: 'CostForge AI', icon: '🏆', status: 'ready' },
    { id: 'terra-agent', name: 'Terra Agent', icon: '🤖', status: 'ready' },
    { id: 'terra-flow', name: 'Terra Flow', icon: '🔄', status: 'ready' },
    { id: 'terra-levy', name: 'Terra Levy', icon: '💰', status: 'ready' },
    { id: 'terra-miner', name: 'Terra Miner', icon: '⛏️', status: 'ready' },
    { id: 'terra-sync', name: 'Terra Sync', icon: '🔄', status: 'ready' },
    { id: 'gispro', name: 'GIS Pro', icon: '🗺️', status: 'ready' },
    { id: 'property-workbench', name: 'Property Workbench', icon: '🏠', status: 'ready' },
    { id: 'terra-insight', name: 'Terra Insight', icon: '📊', status: 'ready' },
    { id: 'terra-dashboard', name: 'Terra Dashboard', icon: '📱', status: 'ready' },
    { id: 'terra-assessor', name: 'Terra Assessor', icon: '📋', status: 'ready' },
    { id: 'marketplace', name: 'Marketplace', icon: '🛒', status: 'ready' },
    { id: 'terra-collections', name: 'Terra Collections', icon: '📚', status: 'ready' },
    { id: 'terra-official', name: 'Terra Official', icon: '🏛️', status: 'ready' }
  ]);
  
  // Update metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      setMetrics(prev => ({
        ...prev,
        timeOnPage,
        engagementRate: Math.min(100, Math.floor(timeOnPage / 60 * 100))
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);
  
  const handleCTA = (type) => {
    setMetrics(prev => ({
      ...prev,
      ctaClicks: prev.ctaClicks + 1,
      conversionRate: Math.min(100, (prev.ctaClicks + 1) * 25)
    }));
    
    // Show success animation
    const button = event.target;
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 600);
  };
  
  const renderVariant = () => {
    const county = countyData[selectedCounty];
    
    switch(variant) {
      case 'emotional':
        return (
          <>
            <div className="county-badge emotional">
              {county.icon} {county.name} Success Story
            </div>
            <h1 className="hero-headline gradient-text">Your Team Deserves Better</h1>
            <div className="testimonial">
              <p className="quote">"{county.testimonial}"</p>
              <p className="attribution">- {county.official}, {county.name}</p>
            </div>
            <p className="hero-subhead">
              Join thousands of county employees who've transcended the old way of working.
            </p>
          </>
        );
        
      case 'data':
        return (
          <>
            <div className="county-badge data">
              {county.icon} {county.name} Performance
            </div>
            <h1 className="hero-headline">The Numbers Speak Volumes</h1>
            <div className="metric-cards">
              <div className="metric-card">
                <div className="metric-number">{county.efficiency}</div>
                <div className="metric-label">Faster Processing</div>
              </div>
              <div className="metric-card">
                <div className="metric-number">{county.savings}</div>
                <div className="metric-label">Annual Savings</div>
              </div>
              <div className="metric-card">
                <div className="metric-number">{county.properties}</div>
                <div className="metric-label">Properties Managed</div>
              </div>
              <div className="metric-card">
                <div className="metric-number">94%</div>
                <div className="metric-label">Accuracy Rate</div>
              </div>
            </div>
            <p className="hero-subhead">
              Real results from counties like yours. Verified. Documented. Repeatable.
            </p>
          </>
        );
        
      case 'urgency':
        return (
          <>
            <div className="county-badge urgency">
              ⚡ Limited Availability
            </div>
            <h1 className="hero-headline">Only 3 Pilot Slots Remaining</h1>
            <div className="countdown">
              <span>Offer expires in: </span>
              <span className="timer">47:59:42</span>
            </div>
            <p className="hero-subhead">
              {county.name} qualifies for our exclusive Pioneer Program.
              Lock in founding member pricing and priority support.
            </p>
            <p className="special-offer">
              <strong>Special Offer:</strong> Save {county.savings} annually + 
              6 months free implementation support
            </p>
          </>
        );
        
      default:
        return (
          <>
            <div className="county-badge">
              {county.icon} {county.name} Ready
            </div>
            <h1 className="hero-headline">Government. Transcended.</h1>
            <p className="hero-subhead">
              Turn complexity into clarity across {county.properties} properties. 
              Make better decisions faster. Serve {county.population} citizens with confidence.
            </p>
          </>
        );
    }
  };
  
  return (
    <div className="terrafusion-enhanced">
      <WebGLBackground />
      
      {/* A/B Testing Control Panel */}
      <div className="control-panel">
        <h3>🧪 A/B Testing Control</h3>
        
        <div className="county-selector">
          <label>Select County:</label>
          <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}>
            {Object.entries(countyData).map(([key, data]) => (
              <option key={key} value={key}>{data.name}</option>
            ))}
          </select>
        </div>
        
        <div className="variant-selector">
          <button 
            className={`variant-btn ${variant === 'control' ? 'active' : ''}`}
            onClick={() => setVariant('control')}
          >
            Control
          </button>
          <button 
            className={`variant-btn ${variant === 'emotional' ? 'active' : ''}`}
            onClick={() => setVariant('emotional')}
          >
            Emotional
          </button>
          <button 
            className={`variant-btn ${variant === 'data' ? 'active' : ''}`}
            onClick={() => setVariant('data')}
          >
            Data
          </button>
          <button 
            className={`variant-btn ${variant === 'urgency' ? 'active' : ''}`}
            onClick={() => setVariant('urgency')}
          >
            Urgency
          </button>
        </div>
        
        <div className="metrics-display">
          <div className="metric-row">
            <span>Engagement:</span>
            <span className="metric-value">{metrics.engagementRate}%</span>
          </div>
          <div className="metric-row">
            <span>Time on Page:</span>
            <span className="metric-value">{metrics.timeOnPage}s</span>
          </div>
          <div className="metric-row">
            <span>CTA Clicks:</span>
            <span className="metric-value">{metrics.ctaClicks}</span>
          </div>
          <div className="metric-row">
            <span>Conversion:</span>
            <span className="metric-value">{metrics.conversionRate}%</span>
          </div>
        </div>
      </div>
      
      {/* Main Hero Section */}
      <section 
        className="hero-section"
        style={{ background: countyData[selectedCounty].gradient }}
      >
        <div className="hero-content">
          {renderVariant()}
          
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => handleCTA('primary')}>
              Begin Transcendence
            </button>
            <button className="btn-secondary" onClick={() => handleCTA('secondary')}>
              Discover Clarity
            </button>
          </div>
        </div>
      </section>
      
      {/* Module Grid */}
      <section className="modules-section">
        <h2 className="section-title">14 Championship Modules</h2>
        <div className="module-grid">
          {modules.map(module => (
            <div key={module.id} className="module-card">
              <div className="module-icon">{module.icon}</div>
              <h3>{module.name}</h3>
              <div className="module-status">{module.status}</div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Performance Metrics Bar */}
      <div className="metrics-bar">
        <div className="metric">
          <div className="metric-value">379M×</div>
          <div className="metric-label">Faster</div>
        </div>
        <div className="metric">
          <div className="metric-value">94%</div>
          <div className="metric-label">Accuracy</div>
        </div>
        <div className="metric">
          <div className="metric-value">14</div>
          <div className="metric-label">Modules</div>
        </div>
        <div className="metric">
          <div className="metric-value">$2.8M</div>
          <div className="metric-label">Saved</div>
        </div>
      </div>
    </div>
  );
};

export default TerraFusionEnhanced;