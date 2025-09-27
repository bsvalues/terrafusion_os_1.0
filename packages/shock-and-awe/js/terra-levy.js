/**
 * Terra-Levy - FULL-SCREEN TAX OPTIMIZATION CALCULATOR
 * Advanced tax analysis and levy optimization tools
 */

class TerraLevyCalculator {
  constructor() {
    this.calculations = {};
    this.scenarios = [];
    this.init();
  }

  init() {
    this.createLevyInterface();
    this.bindEvents();
  }

  createLevyInterface() {
    const levyContainer = document.createElement('div');
    levyContainer.id = 'terra-levy';
    levyContainer.className = 'tf-fullscreen-app tf-cosmic-bg';
    levyContainer.style.display = 'none';
    levyContainer.innerHTML = `
            <div class="levy-container">
                <div class="levy-header">
                    <div class="levy-title">
                        <svg class="wizard-icon" viewBox="0 0 24 24" fill="currentColor" style="width: 60px; height: 60px; color: #00ffee;">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Terra-Levy Tax Optimizer
                    </div>
                    <button class="tf-feature-close" id="levy-close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                <div class="levy-main">
                    <div class="levy-calculator">
                        <h3 style="color: #ffffff; font-size: 2rem; margin-bottom: 2rem; text-align: center;">Tax Calculation Engine</h3>
                        
                        <div class="levy-form-group">
                            <label for="property-value">Assessed Property Value</label>
                            <input type="number" id="property-value" placeholder="e.g., 350000" style="font-size: 1.2rem; padding: 1rem;">
                        </div>
                        
                        <div class="levy-form-group">
                            <label for="property-type-levy">Property Type</label>
                            <select id="property-type-levy" style="font-size: 1.2rem; padding: 1rem;">
                                <option value="">Select Type</option>
                                <option value="residential">Residential</option>
                                <option value="commercial">Commercial</option>
                                <option value="industrial">Industrial</option>
                                <option value="agricultural">Agricultural</option>
                            </select>
                        </div>
                        
                        <div class="levy-form-group">
                            <label for="county-levy">County</label>
                            <select id="county-levy" style="font-size: 1.2rem; padding: 1rem;">
                                <option value="">Select County</option>
                                <option value="benton">Benton County</option>
                                <option value="yakima">Yakima County</option>
                                <option value="clark">Clark County</option>
                                <option value="spokane">Spokane County</option>
                                <option value="king">King County</option>
                            </select>
                        </div>
                        
                        <div class="levy-form-group">
                            <label for="exemptions">Exemptions & Deductions</label>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;">
                                <label style="display: flex; align-items: center; gap: 0.5rem; color: #ffffff;">
                                    <input type="checkbox" id="senior-exemption" style="width: 20px; height: 20px;">
                                    Senior Citizen Exemption
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; color: #ffffff;">
                                    <input type="checkbox" id="veteran-exemption" style="width: 20px; height: 20px;">
                                    Veteran Exemption
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; color: #ffffff;">
                                    <input type="checkbox" id="homestead-exemption" style="width: 20px; height: 20px;">
                                    Homestead Exemption
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; color: #ffffff;">
                                    <input type="checkbox" id="historic-exemption" style="width: 20px; height: 20px;">
                                    Historic Property
                                </label>
                            </div>
                        </div>
                        
                        <button id="calculate-taxes" style="width: 100%; padding: 1.5rem; font-size: 1.3rem; margin-top: 2rem; background: linear-gradient(135deg, #0099ff, #00ffee); color: #0b1020; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;">
                            Calculate Tax Liability
                        </button>
                    </div>
                    
                    <div class="levy-results">
                        <h3 style="color: #ffffff; font-size: 2rem; margin-bottom: 2rem; text-align: center;">Tax Analysis Results</h3>
                        
                        <div id="tax-results" style="display: none;">
                            <div style="background: rgba(0, 255, 238, 0.1); border: 2px solid rgba(0, 255, 238, 0.3); border-radius: 16px; padding: 2rem; margin-bottom: 2rem; text-align: center;">
                                <div style="font-size: 1.2rem; color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem;">Annual Tax Liability</div>
                                <div id="total-tax" style="font-size: 3rem; font-weight: 900; color: #00ffee;">$0</div>
                                <div style="font-size: 1rem; color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Effective Rate: <span id="effective-rate">0%</span></div>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500;">County Tax</span>
                                    <span id="county-tax" style="color: #00ffee; font-weight: 700; font-size: 1.2rem;">$0</span>
                                </div>
                                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500;">State Tax</span>
                                    <span id="state-tax" style="color: #00ffee; font-weight: 700; font-size: 1.2rem;">$0</span>
                                </div>
                                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500;">School District</span>
                                    <span id="school-tax" style="color: #00ffee; font-weight: 700; font-size: 1.2rem;">$0</span>
                                </div>
                                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500;">Fire/EMS District</span>
                                    <span id="fire-tax" style="color: #00ffee; font-weight: 700; font-size: 1.2rem;">$0</span>
                                </div>
                                <div style="background: rgba(0, 255, 170, 0.1); border: 1px solid rgba(0, 255, 170, 0.3); border-radius: 12px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500;">Total Exemptions</span>
                                    <span id="total-exemptions" style="color: #00ffaa; font-weight: 700; font-size: 1.2rem;">-$0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="no-results" style="display: flex; align-items: center; justify-content: center; height: 60%; color: rgba(255, 255, 255, 0.6); font-size: 1.3rem; text-align: center; flex-direction: column; gap: 1rem;">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.3)">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <div>Enter property details to calculate taxes</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(levyContainer);
  }

  bindEvents() {
    // Close button
    document.addEventListener('click', e => {
      if (e.target.closest('#levy-close')) {
        this.close();
      }
    });

    // Calculate button
    document.addEventListener('click', e => {
      if (e.target.id === 'calculate-taxes') {
        this.calculateTaxes();
      }
    });

    // Close on backdrop click
    document.addEventListener('click', e => {
      if (e.target.id === 'terra-levy') {
        this.close();
      }
    });

    // Form inputs
    ['property-value', 'property-type-levy', 'county-levy'].forEach(id => {
      document.addEventListener('input', e => {
        if (e.target.id === id) {
          this.updateCalculations();
        }
      });
    });
  }

  calculateTaxes() {
    const propertyValue = parseFloat(document.getElementById('property-value')?.value) || 0;
    const propertyType = document.getElementById('property-type-levy')?.value || '';
    const county = document.getElementById('county-levy')?.value || '';

    if (!propertyValue || !propertyType || !county) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('💰 Calculating taxes for:', { propertyValue, propertyType, county });

    // Calculate exemptions
    const exemptions = this.calculateExemptions(propertyValue);
    const taxableValue = Math.max(0, propertyValue - exemptions);

    // Tax rates by county (mills per $1000 of assessed value)
    const taxRates = {
      benton: { county: 2.85, state: 4.29, school: 8.45, fire: 1.24 },
      yakima: { county: 3.12, state: 4.29, school: 9.67, fire: 1.58 },
      clark: { county: 3.45, state: 4.29, school: 11.23, fire: 1.89 },
      spokane: { county: 3.78, state: 4.29, school: 10.45, fire: 1.67 },
      king: { county: 4.23, state: 4.29, school: 12.78, fire: 2.34 },
    };

    const rates = taxRates[county] || taxRates.benton;

    // Calculate individual taxes
    const countyTax = (taxableValue * rates.county) / 1000;
    const stateTax = (taxableValue * rates.state) / 1000;
    const schoolTax = (taxableValue * rates.school) / 1000;
    const fireTax = (taxableValue * rates.fire) / 1000;
    const totalTax = countyTax + stateTax + schoolTax + fireTax;
    const effectiveRate = ((totalTax / propertyValue) * 100).toFixed(3);

    // Update UI
    document.getElementById('total-tax').textContent = `$${totalTax.toLocaleString()}`;
    document.getElementById('effective-rate').textContent = `${effectiveRate}%`;
    document.getElementById('county-tax').textContent = `$${countyTax.toLocaleString()}`;
    document.getElementById('state-tax').textContent = `$${stateTax.toLocaleString()}`;
    document.getElementById('school-tax').textContent = `$${schoolTax.toLocaleString()}`;
    document.getElementById('fire-tax').textContent = `$${fireTax.toLocaleString()}`;
    document.getElementById('total-exemptions').textContent = `-$${exemptions.toLocaleString()}`;

    // Show results
    document.getElementById('no-results').style.display = 'none';
    document.getElementById('tax-results').style.display = 'block';

    console.log('💰 Tax calculation complete:', {
      totalTax: totalTax.toLocaleString(),
      effectiveRate: `${effectiveRate}%`,
      exemptions: exemptions.toLocaleString(),
    });
  }

  calculateExemptions(propertyValue) {
    let totalExemptions = 0;

    if (document.getElementById('senior-exemption')?.checked) {
      totalExemptions += Math.min(propertyValue * 0.6, 60000); // 60% up to $60k
    }
    if (document.getElementById('veteran-exemption')?.checked) {
      totalExemptions += 12000; // $12k veteran exemption
    }
    if (document.getElementById('homestead-exemption')?.checked) {
      totalExemptions += Math.min(propertyValue * 0.35, 35000); // 35% up to $35k
    }
    if (document.getElementById('historic-exemption')?.checked) {
      totalExemptions += Math.min(propertyValue * 0.25, 25000); // 25% up to $25k
    }

    return totalExemptions;
  }

  updateCalculations() {
    // Real-time calculation preview could go here
  }

  show() {
    const container = document.getElementById('terra-levy');
    if (container) {
      container.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      console.log('💰 Terra-Levy Tax Optimizer launched - FULL SCREEN');
    }
  }

  close() {
    const container = document.getElementById('terra-levy');
    if (container) {
      container.style.display = 'none';
      document.body.style.overflow = 'auto';
      console.log('💰 Tax optimizer closed');
    }
  }
}

// Export for use in main application
window.TerraLevyCalculator = TerraLevyCalculator;
