/**
 * Terrafusion Market - Quantum Visualization Engine
 * Advanced Quantum-Inspired Visual Effects
 * Squad Alpha Component - Quantum Visualizations
 */

class QuantumVisualization {
  constructor(container) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.particles = [];
    this.connections = [];
    this.fields = [];
    this.time = 0;
    this.isRunning = false;
    this.mousePosition = { x: 0, y: 0 };
    this.config = {
      particleCount: 100,
      connectionDistance: 150,
      fieldStrength: 0.5,
      colors: {
        particles: ['#68d391', '#38b2ac', '#4fd1c7', '#81e6d9'],
        connections: 'rgba(104, 211, 145, 0.3)',
        fields: 'rgba(56, 178, 172, 0.1)',
      },
      physics: {
        gravity: 0.001,
        friction: 0.99,
        attraction: 0.002,
        repulsion: 0.005,
      },
    };

    this.init();
  }

  init() {
    this.createCanvas();
    this.setupEventListeners();
    this.generateParticles();
    this.generateFields();
    this.start();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.container.addEventListener('mousemove', e => {
      const rect = this.container.getBoundingClientRect();
      this.mousePosition.x = e.clientX - rect.left;
      this.mousePosition.y = e.clientY - rect.top;
    });

    this.container.addEventListener('mouseleave', () => {
      this.mousePosition.x = this.canvas.width / 2;
      this.mousePosition.y = this.canvas.height / 2;
    });
  }

  generateParticles() {
    this.particles = [];

    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(
        new QuantumParticle({
          x: (Math.random() * this.canvas.width) / window.devicePixelRatio,
          y: (Math.random() * this.canvas.height) / window.devicePixelRatio,
          color:
            this.config.colors.particles[
              Math.floor(Math.random() * this.config.colors.particles.length)
            ],
          mass: Math.random() * 2 + 1,
          charge: Math.random() > 0.5 ? 1 : -1,
          spin: Math.random() * Math.PI * 2,
        })
      );
    }
  }

  generateFields() {
    this.fields = [];

    // Create quantum fields
    for (let i = 0; i < 5; i++) {
      this.fields.push(
        new QuantumField({
          x: (Math.random() * this.canvas.width) / window.devicePixelRatio,
          y: (Math.random() * this.canvas.height) / window.devicePixelRatio,
          strength: (Math.random() - 0.5) * this.config.fieldStrength,
          radius: Math.random() * 100 + 50,
          frequency: Math.random() * 0.02 + 0.01,
        })
      );
    }
  }

  updateParticles() {
    this.particles.forEach((particle /* , index */) => {
      // Apply quantum field effects
      this.fields.forEach(field => {
        const distance = Math.hypot(particle.x - field.x, particle.y - field.y);
        if (distance < field.radius) {
          const force = field.getForceAt(particle.x, particle.y, this.time);
          particle.applyForce(force);
        }
      });

      // Apply mouse interaction
      const mouseDist = Math.hypot(
        particle.x - this.mousePosition.x,
        particle.y - this.mousePosition.y
      );
      if (mouseDist < 200) {
        const angle = Math.atan2(
          this.mousePosition.y - particle.y,
          this.mousePosition.x - particle.x
        );
        const force = ((200 - mouseDist) / 200) * 0.5;
        particle.vx += Math.cos(angle) * force * particle.charge;
        particle.vy += Math.sin(angle) * force * particle.charge;
      }

      // Particle interactions
      this.particles.forEach((otherParticle, otherIndex) => {
        if (index !== otherIndex) {
          const distance = Math.hypot(particle.x - otherParticle.x, particle.y - otherParticle.y);

          if (distance < this.config.connectionDistance) {
            // Create connection
            this.connections.push({
              from: particle,
              to: otherParticle,
              strength:
                (this.config.connectionDistance - distance) / this.config.connectionDistance,
            });

            // Apply forces
            if (distance > 0) {
              const angle = Math.atan2(otherParticle.y - particle.y, otherParticle.x - particle.x);
              const force =
                (particle.charge * otherParticle.charge * this.config.physics.attraction) /
                (distance * distance);

              particle.vx -= Math.cos(angle) * force;
              particle.vy -= Math.sin(angle) * force;
            }
          }
        }
      });

      // Update particle physics
      particle.update(
        this.canvas.width / window.devicePixelRatio,
        this.canvas.height / window.devicePixelRatio
      );
    });
  }

  updateFields() {
    this.fields.forEach(field => {
      field.update(this.time);
    });
  }

  drawParticles() {
    this.particles.forEach(particle => {
      particle.draw(this.ctx);
    });
  }

  drawConnections() {
    this.ctx.strokeStyle = this.config.colors.connections;
    this.ctx.lineWidth = 1;

    this.connections.forEach(connection => {
      this.ctx.globalAlpha = connection.strength * 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(connection.from.x, connection.from.y);
      this.ctx.lineTo(connection.to.x, connection.to.y);
      this.ctx.stroke();
    });

    this.ctx.globalAlpha = 1;
    this.connections = []; // Clear connections for next frame
  }

  drawFields() {
    this.fields.forEach(field => {
      field.draw(this.ctx, this.config.colors.fields);
    });
  }

  drawQuantumEffects() {
    // Draw quantum tunneling effect
    this.drawQuantumTunneling();

    // Draw wave interference
    this.drawWaveInterference();

    // Draw energy levels
    this.drawEnergyLevels();
  }

  drawQuantumTunneling() {
    // Create tunneling effect between distant particles
    this.particles.forEach((particle /* , index */) => {
      this.particles.slice(index + 1).forEach(otherParticle => {
        const distance = Math.hypot(particle.x - otherParticle.x, particle.y - otherParticle.y);

        if (
          distance > this.config.connectionDistance &&
          distance < this.config.connectionDistance * 2
        ) {
          // Probability of tunneling decreases with distance
          const tunnelingProbability = Math.exp(-distance / 100) * 0.1;

          if (Math.random() < tunnelingProbability) {
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${tunnelingProbability})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 10]);

            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(otherParticle.x, otherParticle.y);
            this.ctx.stroke();

            this.ctx.setLineDash([]);
          }
        }
      });
    });
  }

  drawWaveInterference() {
    // Draw wave patterns
    const centerX = this.canvas.width / window.devicePixelRatio / 2;
    const centerY = this.canvas.height / window.devicePixelRatio / 2;

    this.ctx.strokeStyle = 'rgba(104, 211, 145, 0.1)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < 10; i++) {
      const radius = 50 + i * 30 + Math.sin(this.time * 0.01 + i) * 10;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  drawEnergyLevels() {
    // Draw energy level indicators
    const levels = [0.2, 0.4, 0.6, 0.8];
    const height = this.canvas.height / window.devicePixelRatio;

    this.ctx.strokeStyle = 'rgba(56, 178, 172, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([10, 5]);

    levels.forEach(level => {
      const y = height * level;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width / window.devicePixelRatio, y);
      this.ctx.stroke();
    });

    this.ctx.setLineDash([]);
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update physics
    this.updateParticles();
    this.updateFields();

    // Draw elements
    this.drawFields();
    this.drawConnections();
    this.drawQuantumEffects();
    this.drawParticles();

    // Update time
    this.time += 1;
  }

  animate() {
    if (this.isRunning) {
      this.render();
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  destroy() {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  // Public API
  addParticle(options = {}) {
    this.particles.push(
      new QuantumParticle({
        x: options.x || (Math.random() * this.canvas.width) / window.devicePixelRatio,
        y: options.y || (Math.random() * this.canvas.height) / window.devicePixelRatio,
        color: options.color || this.config.colors.particles[0],
        mass: options.mass || 1,
        charge: options.charge || 1,
        spin: options.spin || 0,
      })
    );
  }

  addField(options = {}) {
    this.fields.push(
      new QuantumField({
        x: options.x || (Math.random() * this.canvas.width) / window.devicePixelRatio,
        y: options.y || (Math.random() * this.canvas.height) / window.devicePixelRatio,
        strength: options.strength || this.config.fieldStrength,
        radius: options.radius || 100,
        frequency: options.frequency || 0.01,
      })
    );
  }

  setMouseInteraction(enabled) {
    this.mouseInteraction = enabled;
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }
}

class QuantumParticle {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = options.vx || (Math.random() - 0.5) * 2;
    this.vy = options.vy || (Math.random() - 0.5) * 2;
    this.mass = options.mass || 1;
    this.charge = options.charge || 1;
    this.spin = options.spin || 0;
    this.color = options.color || '#68d391';
    this.radius = Math.sqrt(this.mass) * 3;
    this.energy = (this.mass * (this.vx * this.vx + this.vy * this.vy)) / 2;
    this.phase = Math.random() * Math.PI * 2;
    this.frequency = 0.02 + Math.random() * 0.03;
  }

  applyForce(force) {
    this.vx += force.x / this.mass;
    this.vy += force.y / this.mass;
  }

  update(canvasWidth, canvasHeight) {
    // Apply quantum effects
    this.phase += this.frequency;
    this.spin += 0.01;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Apply friction
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Boundary conditions with quantum tunneling
    if (this.x < 0 || this.x > canvasWidth) {
      if (Math.random() < 0.1) {
        // Quantum tunneling - appear on other side
        this.x = this.x < 0 ? canvasWidth : 0;
      } else {
        this.vx *= -0.8;
        this.x = Math.max(0, Math.min(canvasWidth, this.x));
      }
    }

    if (this.y < 0 || this.y > canvasHeight) {
      if (Math.random() < 0.1) {
        // Quantum tunneling - appear on other side
        this.y = this.y < 0 ? canvasHeight : 0;
      } else {
        this.vy *= -0.8;
        this.y = Math.max(0, Math.min(canvasHeight, this.y));
      }
    }

    // Update energy
    this.energy = (this.mass * (this.vx * this.vx + this.vy * this.vy)) / 2;
  }

  draw(ctx) {
    ctx.save();

    // Quantum wave function visualization
    const waveAmplitude = Math.sin(this.phase) * 0.3;
    const currentRadius = this.radius * (1 + waveAmplitude);

    // Particle probability cloud
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius * 2);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color.replace('rgb', 'rgba').replace(')', ', 0.5)'));
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core particle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Spin indicator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 1.2, this.spin, this.spin + Math.PI / 4);
    ctx.stroke();

    // Energy level indicator
    const energyColor = this.energy > 5 ? '#ff6b6b' : this.energy > 2 ? '#feca57' : '#48cae4';
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 1.5, 0, (this.energy / 10) * Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

class QuantumField {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.strength = options.strength || 1;
    this.radius = options.radius || 100;
    this.frequency = options.frequency || 0.01;
    this.phase = Math.random() * Math.PI * 2;
    this.type = options.type || 'attractive'; // 'attractive', 'repulsive', 'oscillating'
  }

  update(time) {
    this.phase += this.frequency;

    // Field oscillation
    if (this.type === 'oscillating') {
      this.strength = Math.sin(time * this.frequency) * 0.5;
    }
  }

  getForceAt(x, y, time) {
    const distance = Math.hypot(x - this.x, y - this.y);

    if (distance > this.radius) {
      return { x: 0, y: 0 };
    }

    const angle = Math.atan2(y - this.y, x - this.x);
    const fieldStrength = this.strength * Math.cos(time * this.frequency + this.phase);
    const force = fieldStrength * (1 - distance / this.radius);

    return {
      x: Math.cos(angle) * force,
      y: Math.sin(angle) * force,
    };
  }

  draw(ctx, color) {
    ctx.save();

    // Field visualization
    const fieldIntensity = Math.abs(this.strength);
    const alpha = fieldIntensity * 0.3;

    ctx.fillStyle = color.replace('0.1', alpha.toString());
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Field lines
    ctx.strokeStyle = color.replace('0.1', (alpha * 0.5).toString());
    ctx.lineWidth = 1;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const startX = this.x + Math.cos(angle) * this.radius * 0.3;
      const startY = this.y + Math.sin(angle) * this.radius * 0.3;
      const endX = this.x + Math.cos(angle) * this.radius * 0.9;
      const endY = this.y + Math.sin(angle) * this.radius * 0.9;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrow heads
      const arrowSize = 5;
      const arrowAngle = this.strength > 0 ? angle : angle + Math.PI;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Initialize quantum visualizations
document.addEventListener('DOMContentLoaded', () => {
  const quantumContainers = document.querySelectorAll('.quantum-visualization');

  quantumContainers.forEach(container => {
    if (container.children.length === 0) {
      // Only initialize if empty
      new QuantumVisualization(container);
    }
  });
});

// Global function for external initialization
window.initQuantumVisualization = (containerId, config = {}) => {
  return new QuantumVisualization(containerId, config);
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuantumVisualization, QuantumParticle, QuantumField };
}
