/**
 * Module Launch Fixes
 * Improved module launching with better error handling
 */

// Enhanced module launcher with better timing and error handling
function enhancedLaunchDemo(demoId) {
  console.log(`🚀 Enhanced launch: ${demoId}`);

  // First show the transcendence loading
  if (window.terraFusionOS && window.terraFusionOS.launchDemo) {
    window.terraFusionOS.launchDemo(demoId);
  }

  // Then launch the actual module with proper timing
  setTimeout(() => {
    try {
      switch (demoId) {
        case 'costforge':
          launchCostForgeEnhanced();
          break;

        case 'ai-swarm':
          launchAISwarmEnhanced();
          break;

        case 'gis-transcended':
          launchGISEnhanced();
          break;

        case 'quantum-core':
          launchQuantumEnhanced();
          break;

        case 'hybrid-intelligence':
          launchHybridEnhanced();
          break;

        case 'levy-optimizer':
          launchLevyEnhanced();
          break;

        default:
          console.log(`Unknown demo: ${demoId}`);
          alert(`Demo "${demoId}" is being prepared. Please try again in a moment.`);
      }
    } catch (error) {
      console.error('Enhanced launch error:', error);
      alert(`Error launching ${demoId}: ${error.message}`);
    }
  }, 3500); // Wait for loading animation to complete
}

// Enhanced CostForge launcher
function launchCostForgeEnhanced() {
  console.log('🏗️ Launching CostForge AI with enhanced integration...');

  try {
    // First try the class-based approach
    if (typeof CostForgeWizard !== 'undefined') {
      if (!window.costForgeInstance) {
        window.costForgeInstance = new CostForgeWizard();
      }
      window.costForgeInstance.show();
      console.log('✅ CostForge launched via class');
    }
    // Fallback to function-based approach
    else if (typeof window.launchCostForgeWizard === 'function') {
      window.launchCostForgeWizard();
      console.log('✅ CostForge launched via function');
    }
    // Final fallback - create simple demo
    else {
      createSimpleCostForgeDemo();
      console.log('✅ CostForge launched via fallback');
    }
  } catch (error) {
    console.error('CostForge launch error:', error);
    createSimpleCostForgeDemo();
  }
}

// Enhanced AI Swarm launcher
function launchAISwarmEnhanced() {
  console.log('🤖 Launching AI Swarm with enhanced integration...');

  try {
    // First try the class-based approach
    if (typeof AISwarmVisualization !== 'undefined') {
      if (!window.aiSwarmInstance) {
        window.aiSwarmInstance = new AISwarmVisualization();
      }
      window.aiSwarmInstance.show();
      console.log('✅ AI Swarm launched via class');
    }
    // Fallback to function-based approach
    else if (typeof window.showAISwarmViz === 'function') {
      window.showAISwarmViz();
      console.log('✅ AI Swarm launched via function');
    }
    // Final fallback - create simple demo
    else {
      createSimpleAISwarmDemo();
      console.log('✅ AI Swarm launched via fallback');
    }
  } catch (error) {
    console.error('AI Swarm launch error:', error);
    createSimpleAISwarmDemo();
  }
}

// Enhanced GIS launcher
function launchGISEnhanced() {
  console.log('🗺️ Launching GIS Transcended...');

  try {
    if (typeof window.launchGISViewer === 'function') {
      window.launchGISViewer();
    } else {
      createSimpleGISDemo();
    }
  } catch (error) {
    console.error('GIS launch error:', error);
    createSimpleGISDemo();
  }
}

// Enhanced Quantum launcher (this one works)
function launchQuantumEnhanced() {
  console.log('⚡ Launching Quantum Performance...');

  try {
    if (typeof launchQuantumPerformanceDemo === 'function') {
      launchQuantumPerformanceDemo();
    } else {
      createSimpleQuantumDemo();
    }
  } catch (error) {
    console.error('Quantum launch error:', error);
    createSimpleQuantumDemo();
  }
}

// Enhanced Hybrid Intelligence launcher
function launchHybridEnhanced() {
  console.log('🔒 Launching Hybrid Intelligence...');

  try {
    if (typeof window.launchHybridLLMSecurity === 'function') {
      window.launchHybridLLMSecurity();
    } else {
      createSimpleHybridDemo();
    }
  } catch (error) {
    console.error('Hybrid launch error:', error);
    createSimpleHybridDemo();
  }
}

// Enhanced Levy Optimizer launcher
function launchLevyEnhanced() {
  console.log('💰 Launching Terra-Levy Optimizer...');

  try {
    if (typeof window.launchTerraLevy === 'function') {
      window.launchTerraLevy();
    } else {
      createSimpleLevyDemo();
    }
  } catch (error) {
    console.error('Levy launch error:', error);
    createSimpleLevyDemo();
  }
}

// Fallback demo creators
function createSimpleCostForgeDemo() {
  const modal = createTerraFusionModal('CostForge AI', '🏗️');
  modal.querySelector('.tf-modal-content').innerHTML += `
        <div style="padding: 2rem;">
            <h3 style="color: var(--tf-transcend); margin-bottom: 1rem;">Property Valuation Wizard</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--tf-gray-light);">Property Type:</label>
                    <select style="width: 100%; padding: 0.75rem; background: var(--tf-dark); border: 1px solid var(--tf-transcend); border-radius: 4px; color: white;">
                        <option>Residential</option>
                        <option>Commercial</option>
                        <option>Industrial</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--tf-gray-light);">Square Footage:</label>
                    <input type="number" placeholder="2,500" style="width: 100%; padding: 0.75rem; background: var(--tf-dark); border: 1px solid var(--tf-transcend); border-radius: 4px; color: white;">
                </div>
            </div>
            <div style="text-align: center; padding: 2rem; background: rgba(0, 255, 238, 0.1); border-radius: 8px;">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--tf-transcend); margin-bottom: 0.5rem;">144 AI Agents</div>
                <div style="color: var(--tf-gray-light);">Analyzing property data with quantum precision</div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
}

function createSimpleAISwarmDemo() {
  const modal = createTerraFusionModal('AI Swarm Intelligence', '🤖');
  modal.querySelector('.tf-modal-content').innerHTML += `
        <div style="padding: 2rem;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 2rem;">
                <div style="text-align: center; padding: 2rem; background: rgba(0, 255, 238, 0.1); border-radius: 8px;">
                    <div style="font-size: 3rem; font-weight: 900; color: var(--tf-transcend);">1,008</div>
                    <div style="color: var(--tf-gray-light);">Active Agents</div>
                </div>
                <div style="text-align: center; padding: 2rem; background: rgba(0, 255, 170, 0.1); border-radius: 8px;">
                    <div style="font-size: 3rem; font-weight: 900; color: var(--tf-accent);">99.7%</div>
                    <div style="color: var(--tf-gray-light);">Coordination</div>
                </div>
                <div style="text-align: center; padding: 2rem; background: rgba(0, 153, 255, 0.1); border-radius: 8px;">
                    <div style="font-size: 3rem; font-weight: 900; color: var(--tf-primary);">24/7</div>
                    <div style="color: var(--tf-gray-light);">Operational</div>
                </div>
            </div>
            <div style="text-align: center; color: var(--tf-gray-light);">
                <p>Real-time coordination of 1,008 AI agents working in perfect harmony</p>
                <p style="margin-top: 1rem; color: var(--tf-transcend);">🌟 Swarm intelligence at work</p>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
}

function createSimpleGISDemo() {
  const modal = createTerraFusionModal('GIS Transcended', '🗺️');
  modal.querySelector('.tf-modal-content').innerHTML += `
        <div style="padding: 2rem;">
            <p style="color: var(--tf-gray-light); margin-bottom: 2rem;">Advanced Geographic Information System with AI-powered insights</p>
            <div style="background: var(--tf-dark); border: 2px solid var(--tf-transcend); border-radius: 8px; padding: 2rem; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🌍</div>
                <div style="color: var(--tf-transcend); font-weight: 600;">Interactive Mapping Interface</div>
                <div style="color: var(--tf-gray-light); margin-top: 1rem;">Real-time property data visualization</div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
}

function createSimpleQuantumDemo() {
  const modal = createTerraFusionModal('Quantum Performance Core', '⚡');
  modal.querySelector('.tf-modal-content').innerHTML += `
        <div style="padding: 2rem;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem;">
                <div style="text-align: center; padding: 2rem; background: rgba(0, 255, 238, 0.1); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 900; color: var(--tf-transcend);">379M×</div>
                    <div style="color: var(--tf-gray-light);">Performance Gain</div>
                </div>
                <div style="text-align: center; padding: 2rem; background: rgba(0, 255, 170, 0.1); border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: 900; color: var(--tf-accent);">< 1ms</div>
                    <div style="color: var(--tf-gray-light);">Response Time</div>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
}

function createSimpleHybridDemo() {
  const modal = createTerraFusionModal('Hybrid Intelligence Engine', '🔒');
  modal.querySelector('.tf-modal-content').innerHTML += `
        <div style="padding: 2rem;">
            <p style="color: var(--tf-gray-light); margin-bottom: 2rem;">Multi-layer AI security and intelligence coordination</p>
            <div style="text-align: center; padding: 2rem; background: rgba(0, 255, 238, 0.1); border-radius: 8px;">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--tf-transcend);">🛡️ Security Layer Active</div>
                <div style="color: var(--tf-gray-light); margin-top: 1rem;">Government-grade protection enabled</div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
}

function createSimpleLevyDemo() {
  const modal = createTerraFusionModal('Terra-Levy Optimizer', '💰');
  modal.querySelector('.tf-modal-content').innerHTML += `
        <div style="padding: 2rem;">
            <p style="color: var(--tf-gray-light); margin-bottom: 2rem;">Intelligent tax levy optimization and analysis</p>
            <div style="text-align: center; padding: 2rem; background: rgba(0, 255, 170, 0.1); border-radius: 8px;">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--tf-accent);">📊 Optimization Engine</div>
                <div style="color: var(--tf-gray-light); margin-top: 1rem;">Maximum efficiency, minimum burden</div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
}

// Utility function to create Terrafusion-branded modals
function createTerraFusionModal(title, icon) {
  const modal = document.createElement('div');
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(11, 16, 32, 0.95);
        backdrop-filter: blur(20px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

  modal.innerHTML = `
        <div class="tf-modal-content" style="
            background: var(--tf-surface);
            border: 2px solid var(--tf-transcend);
            border-radius: 16px;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 0 60px rgba(0, 255, 238, 0.3);
        ">
            <div style="
                padding: 2rem;
                border-bottom: 1px solid rgba(0, 255, 238, 0.2);
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-size: 2rem;">${icon}</span>
                    <h2 style="color: var(--tf-transcend); font-size: 1.5rem; margin: 0;">${title}</h2>
                </div>
                <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                    background: none;
                    border: none;
                    color: var(--tf-gray-light);
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                ">&times;</button>
            </div>
        </div>
    `;

  return modal;
}

// Override the main launch function
window.launchDemo = enhancedLaunchDemo;

console.log('🔧 Module fixes loaded - enhanced launching available');
