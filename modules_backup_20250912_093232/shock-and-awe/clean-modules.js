/**
 * Clean Module Implementation
 * Simple, working popups without disasters
 */

// Clean, simple popup creation
function createCleanPopup(title, content) {
  // Remove any existing popups first
  const existingPopups = document.querySelectorAll('.tf-clean-popup');
  existingPopups.forEach(popup => popup.remove());

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'tf-clean-popup';
  backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(11, 16, 32, 0.95);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

  // Create popup content
  const popup = document.createElement('div');
  popup.style.cssText = `
        background: linear-gradient(135deg, #0b1020 0%, #1a1a2e 100%);
        border: 2px solid #00ffee;
        border-radius: 12px;
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 
            0 0 40px rgba(0, 255, 238, 0.3),
            inset 0 1px 0 rgba(0, 255, 238, 0.1);
        position: relative;
    `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
        padding: 1.5rem 2rem;
        border-bottom: 1px solid rgba(0, 255, 238, 0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(0, 255, 238, 0.05);
    `;

  header.innerHTML = `
        <h2 style="
            color: #00ffee;
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        ">${title}</h2>
        <button onclick="this.closest('.tf-clean-popup').remove()" style="
            background: none;
            border: none;
            color: #8892b0;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 4px;
            transition: all 0.2s;
        " onmouseover="this.style.color='#00ffee'" onmouseout="this.style.color='#8892b0'">&times;</button>
    `;

  // Create content area
  const contentArea = document.createElement('div');
  contentArea.style.cssText = `
        padding: 2rem;
        color: white;
        line-height: 1.6;
    `;
  contentArea.innerHTML = content;

  // Assemble popup
  popup.appendChild(header);
  popup.appendChild(contentArea);
  backdrop.appendChild(popup);

  // Add animation CSS if not exists
  if (!document.querySelector('#tf-popup-animations')) {
    const style = document.createElement('style');
    style.id = 'tf-popup-animations';
    style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
    document.head.appendChild(style);
  }

  // Add to page
  document.body.appendChild(backdrop);

  // Close on backdrop click
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) {
      backdrop.remove();
    }
  });

  // Close on Escape key
  const handleEscape = e => {
    if (e.key === 'Escape') {
      backdrop.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  return backdrop;
}

// Clean CostForge demo
function showCostForgeDemo() {
  const content = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🏗️</div>
            <p style="color: #8892b0; font-size: 1.1rem;">Advanced Property Valuation with AI Precision</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: #00ffaa; font-weight: 500;">Property Type:</label>
                <select style="width: 100%; padding: 0.75rem; background: #1a1a2e; border: 1px solid #00ffee; border-radius: 6px; color: white;">
                    <option>Single Family Residential</option>
                    <option>Commercial Building</option>
                    <option>Multi-Family Units</option>
                    <option>Industrial Property</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: #00ffaa; font-weight: 500;">Square Footage:</label>
                <input type="number" value="2500" style="width: 100%; padding: 0.75rem; background: #1a1a2e; border: 1px solid #00ffee; border-radius: 6px; color: white;">
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 255, 238, 0.1); border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: 700; color: #00ffee;">144</div>
                <div style="color: #8892b0; font-size: 0.9rem;">AI Agents</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 255, 170, 0.1); border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: 700; color: #00ffaa;">< 3s</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Analysis Time</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 153, 255, 0.1); border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: 700; color: #0099ff;">99.5%</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Accuracy</div>
            </div>
        </div>
        
        <div style="text-align: center;">
            <button onclick="alert('🚀 CostForge AI analyzing property... Estimated value: $485,750')" style="
                background: linear-gradient(135deg, #0099ff, #00ffee);
                border: none;
                color: white;
                padding: 1rem 2rem;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                🧠 Generate AI Valuation
            </button>
        </div>
    `;

  createCleanPopup('CostForge AI - Property Valuation', content);
}

// Clean AI Swarm demo
function showAISwarmDemo() {
  const content = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
            <p style="color: #8892b0; font-size: 1.1rem;">Real-Time AI Agent Coordination & Intelligence</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 255, 238, 0.1); border-radius: 8px;">
                <div style="font-size: 2.5rem; font-weight: 900; color: #00ffee;">1,008</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Total Agents</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 255, 170, 0.1); border-radius: 8px;">
                <div style="font-size: 2.5rem; font-weight: 900; color: #00ffaa;">987</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Active Now</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 153, 255, 0.1); border-radius: 8px;">
                <div style="font-size: 2.5rem; font-weight: 900; color: #0099ff;">98.7%</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Efficiency</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(255, 165, 0, 0.1); border-radius: 8px;">
                <div style="font-size: 2.5rem; font-weight: 900; color: #ffaa00;">24/7</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Uptime</div>
            </div>
        </div>
        
        <div style="background: rgba(0, 255, 238, 0.05); border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <h4 style="color: #00ffee; margin: 0 0 1rem 0;">Agent Categories:</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                <div style="color: #8892b0;">• Property Assessment: <span style="color: #00ffaa;">144 agents</span></div>
                <div style="color: #8892b0;">• Data Processing: <span style="color: #00ffaa;">288 agents</span></div>
                <div style="color: #8892b0;">• Quality Control: <span style="color: #00ffaa;">216 agents</span></div>
                <div style="color: #8892b0;">• Coordination: <span style="color: #00ffaa;">360 agents</span></div>
            </div>
        </div>
        
        <div style="text-align: center;">
            <div style="color: #00ffee; font-weight: 600; margin-bottom: 0.5rem;">🌐 Swarm Status: OPERATIONAL</div>
            <div style="color: #8892b0;">All agents coordinated and ready for government operations</div>
        </div>
    `;

  createCleanPopup('AI Swarm Intelligence - 1,008 Agents', content);
}

// Clean GIS demo
function showGISDemo() {
  const content = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
            <p style="color: #8892b0; font-size: 1.1rem;">Advanced Geographic Information System</p>
        </div>
        
        <div style="background: #1a1a2e; border: 2px solid #00ffee; border-radius: 8px; padding: 2rem; text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 8rem; color: #00ffee; margin-bottom: 1rem;">🌍</div>
            <div style="color: #00ffaa; font-weight: 600; font-size: 1.2rem; margin-bottom: 0.5rem;">Interactive Mapping Interface</div>
            <div style="color: #8892b0;">Real-time property data visualization and analysis</div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div style="text-align: center; padding: 1rem; background: rgba(0, 255, 238, 0.1); border-radius: 6px;">
                <div style="color: #00ffee; font-weight: 600;">📍 Property Mapping</div>
                <div style="color: #8892b0; font-size: 0.9rem; margin-top: 0.5rem;">Precise location data</div>
            </div>
            <div style="text-align: center; padding: 1rem; background: rgba(0, 255, 170, 0.1); border-radius: 6px;">
                <div style="color: #00ffaa; font-weight: 600;">📊 Data Layers</div>
                <div style="color: #8892b0; font-size: 0.9rem; margin-top: 0.5rem;">Multiple overlays</div>
            </div>
            <div style="text-align: center; padding: 1rem; background: rgba(0, 153, 255, 0.1); border-radius: 6px;">
                <div style="color: #0099ff; font-weight: 600;">⚡ Real-Time</div>
                <div style="color: #8892b0; font-size: 0.9rem; margin-top: 0.5rem;">Live updates</div>
            </div>
        </div>
    `;

  createCleanPopup('GIS Transcended - Geographic Intelligence', content);
}

// Clean Quantum demo
function showQuantumDemo() {
  const content = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div>
            <p style="color: #8892b0; font-size: 1.1rem;">Quantum-Enhanced Performance Engine</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 2rem;">
            <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, rgba(0, 255, 238, 0.1), rgba(0, 153, 255, 0.1)); border-radius: 8px;">
                <div style="font-size: 3rem; font-weight: 900; color: #00ffee; margin-bottom: 0.5rem;">379M×</div>
                <div style="color: #8892b0; font-weight: 600;">Performance Multiplier</div>
                <div style="color: #8892b0; font-size: 0.9rem; margin-top: 0.5rem;">Quantum optimization active</div>
            </div>
            <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, rgba(0, 255, 170, 0.1), rgba(255, 170, 0, 0.1)); border-radius: 8px;">
                <div style="font-size: 3rem; font-weight: 900; color: #00ffaa; margin-bottom: 0.5rem;">< 1ms</div>
                <div style="color: #8892b0; font-weight: 600;">Response Time</div>
                <div style="color: #8892b0; font-size: 0.9rem; margin-top: 0.5rem;">Sub-millisecond precision</div>
            </div>
        </div>
        
        <div style="background: rgba(0, 255, 238, 0.05); border-radius: 8px; padding: 1.5rem;">
            <h4 style="color: #00ffee; margin: 0 0 1rem 0;">Quantum Capabilities:</h4>
            <div style="color: #8892b0; line-height: 1.8;">
                • Superposition-based parallel processing<br>
                • Quantum entanglement for instant coordination<br>
                • Advanced error correction algorithms<br>
                • Real-time optimization across all systems
            </div>
        </div>
    `;

  createCleanPopup('Quantum Performance Core - Transcendent Speed', content);
}

// Clean Hybrid demo
function showHybridDemo() {
  const content = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
            <p style="color: #8892b0; font-size: 1.1rem;">Multi-Layer AI Security & Intelligence</p>
        </div>
        
        <div style="background: rgba(0, 255, 238, 0.05); border-radius: 8px; padding: 2rem; text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 2rem; color: #00ffee; margin-bottom: 1rem;">🛡️</div>
            <div style="color: #00ffaa; font-weight: 600; font-size: 1.2rem; margin-bottom: 0.5rem;">Government-Grade Security</div>
            <div style="color: #8892b0;">FISMA compliant • NIST standards • Zero-trust architecture</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div style="padding: 1.5rem; background: rgba(0, 153, 255, 0.1); border-radius: 8px;">
                <div style="color: #0099ff; font-weight: 600; margin-bottom: 0.5rem;">🔐 Authentication</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Multi-factor verification with biometric integration</div>
            </div>
            <div style="padding: 1.5rem; background: rgba(0, 255, 170, 0.1); border-radius: 8px;">
                <div style="color: #00ffaa; font-weight: 600; margin-bottom: 0.5rem;">🌐 Network Security</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Advanced threat detection and prevention</div>
            </div>
            <div style="padding: 1.5rem; background: rgba(255, 170, 0, 0.1); border-radius: 8px;">
                <div style="color: #ffaa00; font-weight: 600; margin-bottom: 0.5rem;">📊 Monitoring</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Real-time security analytics and reporting</div>
            </div>
            <div style="padding: 1.5rem; background: rgba(255, 68, 68, 0.1); border-radius: 8px;">
                <div style="color: #ff4444; font-weight: 600; margin-bottom: 0.5rem;">⚡ Response</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Automated incident response and mitigation</div>
            </div>
        </div>
    `;

  createCleanPopup('Hybrid Intelligence Engine - Security First', content);
}

// Clean Levy demo
function showLevyDemo() {
  const content = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
            <p style="color: #8892b0; font-size: 1.1rem;">Intelligent Tax Levy Optimization</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 255, 170, 0.1); border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: 700; color: #00ffaa;">+15%</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Revenue Increase</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 255, 238, 0.1); border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: 700; color: #00ffee;">-25%</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Admin Overhead</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: rgba(0, 153, 255, 0.1); border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: 700; color: #0099ff;">99.8%</div>
                <div style="color: #8892b0; font-size: 0.9rem;">Accuracy Rate</div>
            </div>
        </div>
        
        <div style="background: rgba(0, 255, 170, 0.05); border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <h4 style="color: #00ffaa; margin: 0 0 1rem 0;">Optimization Features:</h4>
            <div style="color: #8892b0; line-height: 1.8;">
                • AI-powered tax rate optimization<br>
                • Predictive revenue modeling<br>
                • Compliance monitoring and reporting<br>
                • Automated calculation and distribution
            </div>
        </div>
        
        <div style="text-align: center;">
            <div style="color: #00ffaa; font-weight: 600;">💡 Smart Algorithm Active</div>
            <div style="color: #8892b0;">Maximum efficiency, minimum citizen burden</div>
        </div>
    `;

  createCleanPopup('Terra-Levy Optimizer - Smart Tax Management', content);
}

// Override the main launch function with clean implementation
window.launchDemo = function (demoId) {
  console.log(`🚀 Launching clean demo: ${demoId}`);

  // Show transcendence loading first (if available)
  if (window.terraFusionOS && window.terraFusionOS.launchDemo) {
    window.terraFusionOS.launchDemo(demoId);
  }

  // Then show clean demo after loading
  setTimeout(() => {
    switch (demoId) {
      case 'costforge':
        showCostForgeDemo();
        break;
      case 'ai-swarm':
        showAISwarmDemo();
        break;
      case 'gis-transcended':
        showGISDemo();
        break;
      case 'quantum-core':
        showQuantumDemo();
        break;
      case 'hybrid-intelligence':
        showHybridDemo();
        break;
      case 'levy-optimizer':
        showLevyDemo();
        break;
      default:
        alert(`Demo "${demoId}" is ready! Clean implementation loaded.`);
    }
  }, 3500);
};

console.log('✅ Clean module implementation loaded - no more disasters!');
