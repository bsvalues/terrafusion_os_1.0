/**
 * Terrafusion Fuzzy Address Search System
 * Provides intelligent address matching with typo tolerance
 */

class FuzzyAddressSearch {
    constructor() {
        this.propertyDatabase = [
            // Benton County addresses with property details
            {
                address: "123 Championship Way, Richland, WA 99352",
                propertyType: "residential",
                squareFootage: 2450,
                bedrooms: 4,
                bathrooms: 3,
                yearBuilt: 2019,
                lotSize: "0.25 acres",
                assessedValue: 485000,
                county: "Benton"
            },
            {
                address: "456 Innovation Drive, Richland, WA 99352",
                propertyType: "commercial",
                squareFootage: 8500,
                bedrooms: null,
                bathrooms: 4,
                yearBuilt: 2020,
                lotSize: "1.2 acres",
                assessedValue: 1250000,
                county: "Benton"
            },
            {
                address: "789 Technology Blvd, Richland, WA 99352",
                propertyType: "industrial",
                squareFootage: 15000,
                bedrooms: null,
                bathrooms: 2,
                yearBuilt: 2018,
                lotSize: "2.5 acres",
                assessedValue: 2100000,
                county: "Benton"
            },
            {
                address: "1247 Oak Street, Richland, WA 99352",
                propertyType: "residential",
                squareFootage: 1850,
                bedrooms: 3,
                bathrooms: 2,
                yearBuilt: 2005,
                lotSize: "0.18 acres",
                assessedValue: 395000,
                county: "Benton"
            },
            {
                address: "555 Main Street, Richland, WA 99352",
                propertyType: "residential",
                squareFootage: 2100,
                bedrooms: 3,
                bathrooms: 2.5,
                yearBuilt: 2010,
                lotSize: "0.22 acres",
                assessedValue: 425000,
                county: "Benton"
            },
            {
                address: "888 Commerce Ave, Richland, WA 99352",
                propertyType: "commercial",
                squareFootage: 6200,
                bedrooms: null,
                bathrooms: 3,
                yearBuilt: 2015,
                lotSize: "0.8 acres",
                assessedValue: 950000,
                county: "Benton"
            },
            {
                address: "321 Enterprise Way, Richland, WA 99352",
                propertyType: "commercial",
                squareFootage: 4500,
                bedrooms: null,
                bathrooms: 2,
                yearBuilt: 2017,
                lotSize: "0.5 acres",
                assessedValue: 750000,
                county: "Benton"
            },
            {
                address: "654 Industrial Pkwy, Richland, WA 99352",
                propertyType: "industrial",
                squareFootage: 12000,
                bedrooms: null,
                bathrooms: 2,
                yearBuilt: 2012,
                lotSize: "3.2 acres",
                assessedValue: 1800000,
                county: "Benton"
            },
            {
                address: "987 Business Loop, Richland, WA 99352",
                propertyType: "commercial",
                squareFootage: 3200,
                bedrooms: null,
                bathrooms: 2,
                yearBuilt: 2014,
                lotSize: "0.4 acres",
                assessedValue: 520000,
                county: "Benton"
            },
            {
                address: "147 Progress Dr, Richland, WA 99352",
                propertyType: "residential",
                squareFootage: 2800,
                bedrooms: 4,
                bathrooms: 3.5,
                yearBuilt: 2021,
                lotSize: "0.35 acres",
                assessedValue: 565000,
                county: "Benton"
            },
            
            // Kennewick addresses
            {
                address: "234 Columbia Center Blvd, Kennewick, WA 99336",
                propertyType: "commercial",
                squareFootage: 9500,
                bedrooms: null,
                bathrooms: 4,
                yearBuilt: 2016,
                lotSize: "1.5 acres",
                assessedValue: 1400000,
                county: "Benton"
            },
            {
                address: "567 Clearwater Ave, Kennewick, WA 99336",
                propertyType: "residential",
                squareFootage: 1950,
                bedrooms: 3,
                bathrooms: 2,
                yearBuilt: 2008,
                lotSize: "0.20 acres",
                assessedValue: 375000,
                county: "Benton"
            },
            {
                address: "890 Canal Drive, Kennewick, WA 99336",
                propertyType: "residential",
                squareFootage: 2250,
                bedrooms: 4,
                bathrooms: 2.5,
                yearBuilt: 2013,
                lotSize: "0.28 acres",
                assessedValue: 445000,
                county: "Benton"
            },
            {
                address: "111 Vista Way, Kennewick, WA 99336",
                propertyType: "residential",
                squareFootage: 3100,
                bedrooms: 5,
                bathrooms: 4,
                yearBuilt: 2019,
                lotSize: "0.45 acres",
                assessedValue: 625000,
                county: "Benton"
            },
            {
                address: "222 Highlands Blvd, Kennewick, WA 99336",
                propertyType: "residential",
                squareFootage: 2650,
                bedrooms: 4,
                bathrooms: 3,
                yearBuilt: 2020,
                lotSize: "0.32 acres",
                assessedValue: 535000,
                county: "Benton"
            },
            
            // Pasco addresses
            {
                address: "345 Road 68, Pasco, WA 99301",
                propertyType: "agricultural",
                squareFootage: 2400,
                bedrooms: 3,
                bathrooms: 2,
                yearBuilt: 1995,
                lotSize: "5.2 acres",
                assessedValue: 650000,
                county: "Franklin"
            },
            {
                address: "678 Court Street, Pasco, WA 99301",
                propertyType: "residential",
                squareFootage: 1750,
                bedrooms: 3,
                bathrooms: 2,
                yearBuilt: 2000,
                lotSize: "0.15 acres",
                assessedValue: 295000,
                county: "Franklin"
            },
            {
                address: "901 Lewis Street, Pasco, WA 99301",
                propertyType: "residential",
                squareFootage: 1650,
                bedrooms: 2,
                bathrooms: 1.5,
                yearBuilt: 1998,
                lotSize: "0.12 acres",
                assessedValue: 275000,
                county: "Franklin"
            },
            
            // West Richland addresses
            {
                address: "789 Van Giesen Street, West Richland, WA 99353",
                propertyType: "residential",
                squareFootage: 2300,
                bedrooms: 4,
                bathrooms: 2.5,
                yearBuilt: 2011,
                lotSize: "0.25 acres",
                assessedValue: 465000,
                county: "Benton"
            },
            {
                address: "456 Bombing Range Road, West Richland, WA 99353",
                propertyType: "residential",
                squareFootage: 1900,
                bedrooms: 3,
                bathrooms: 2,
                yearBuilt: 2007,
                lotSize: "0.22 acres",
                assessedValue: 385000,
                county: "Benton"
            }
        ];
        
        // Create address-only array for backward compatibility
        this.addressDatabase = this.propertyDatabase.map(prop => prop.address);
    }
    
    // Calculate similarity score between two strings
    calculateSimilarity(input, candidate) {
        const inputLower = input.toLowerCase().replace(/[^\w\s]/g, '');
        const candidateLower = candidate.toLowerCase().replace(/[^\w\s]/g, '');
        
        // Exact match gets highest score
        if (inputLower === candidateLower) return 100;
        
        // Check if input is contained in candidate
        if (candidateLower.includes(inputLower)) {
            return 80 + (inputLower.length / candidateLower.length) * 20;
        }
        
        // Check if candidate starts with input
        if (candidateLower.startsWith(inputLower)) {
            return 70 + (inputLower.length / candidateLower.length) * 20;
        }
        
        // Word-based matching
        const inputWords = inputLower.split(/\s+/);
        const candidateWords = candidateLower.split(/\s+/);
        
        let matchedWords = 0;
        for (const inputWord of inputWords) {
            if (inputWord.length < 2) continue;
            for (const candidateWord of candidateWords) {
                if (candidateWord.includes(inputWord) || inputWord.includes(candidateWord)) {
                    matchedWords++;
                    break;
                }
            }
        }
        
        const wordScore = (matchedWords / inputWords.length) * 60;
        
        // Character overlap score
        let charOverlap = 0;
        for (const char of inputLower) {
            if (candidateLower.includes(char)) {
                charOverlap++;
            }
        }
        const charScore = (charOverlap / inputLower.length) * 40;
        
        return Math.max(wordScore, charScore);
    }
    
    // Search for addresses with fuzzy matching
    search(input, maxResults = 8) {
        if (!input || input.length < 2) {
            return [];
        }
        
        const results = this.propertyDatabase.map(property => ({
            address: property.address,
            property: property,
            score: this.calculateSimilarity(input, property.address)
        }))
        .filter(result => result.score >= 25)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
        
        return results;
    }
    
    // Get property details by exact address match
    getPropertyByAddress(address) {
        return this.propertyDatabase.find(property => 
            property.address.toLowerCase() === address.toLowerCase()
        );
    }
    
    // Search for properties with detailed information
    searchProperties(input, maxResults = 8) {
        return this.search(input, maxResults);
    }
}

// Address autocomplete component
class AddressAutocomplete {
    constructor(inputElement) {
        this.input = inputElement;
        this.fuzzySearch = new FuzzyAddressSearch();
        this.dropdown = null;
        this.selectedIndex = -1;
        this.results = [];
        this.init();
    }
    
    init() {
        this.createDropdown();
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('blur', (e) => this.handleBlur(e));
        this.styleInput();
    }
    
    createDropdown() {
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'address-autocomplete-dropdown';
        this.dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(11, 16, 32, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 255, 238, 0.3);
            border-radius: 12px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            margin-top: 4px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        
        this.input.parentElement.style.position = 'relative';
        this.input.parentElement.appendChild(this.dropdown);
    }
    
    styleInput() {
        this.input.style.paddingLeft = '50px';
        this.input.style.background = `
            url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffee" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>')}")
            no-repeat 15px center,
            rgba(255, 255, 255, 0.1)
        `;
        this.input.style.backgroundSize = '20px 20px, 100%';
    }
    
    handleInput(e) {
        const value = e.target.value.trim();
        
        if (value.length < 2) {
            this.hideDropdown();
            return;
        }
        
        this.results = this.fuzzySearch.search(value, 8);
        this.selectedIndex = -1;
        this.updateDropdown();
    }
    
    handleKeydown(e) {
        if (!this.isDropdownVisible()) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectResult(this.results[this.selectedIndex]);
                }
                break;
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }
    
    handleBlur(e) {
        setTimeout(() => {
            if (!this.dropdown.contains(document.activeElement)) {
                this.hideDropdown();
            }
        }, 150);
    }
    
    updateDropdown() {
        if (this.results.length === 0) {
            this.hideDropdown();
            return;
        }
        
        this.dropdown.innerHTML = this.results.map((result /* , index */) => `
            <div class="address-result" data-index="${index}" style="
                padding: 12px 15px;
                cursor: pointer;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.2s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="color: #ffffff; font-size: 1rem;">
                    ${this.highlightMatch(result.address, this.input.value)}
                </div>
                <div style="
                    color: #00ffaa; 
                    font-size: 0.8rem; 
                    font-weight: 600;
                    background: rgba(0, 255, 170, 0.1);
                    padding: 2px 8px;
                    border-radius: 12px;
                ">
                    ${Math.round(result.score)}%
                </div>
            </div>
        `).join('');
        
        this.dropdown.querySelectorAll('.address-result').forEach((item /* , index */) => {
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });
            
            item.addEventListener('click', () => {
                this.selectResult(this.results[index]);
            });
        });
        
        this.showDropdown();
        this.updateSelection();
    }
    
    highlightMatch(text, query) {
        if (!query) return text;
        
        const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
        let highlighted = text;
        
        queryTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlighted = highlighted.replace(regex, '<span style="background: rgba(0, 255, 238, 0.3); color: #00ffee; font-weight: 600;">$1</span>');
        });
        
        return highlighted;
    }
    
    updateSelection() {
        this.dropdown.querySelectorAll('.address-result').forEach((item /* , index */) => {
            if (index === this.selectedIndex) {
                item.style.background = 'rgba(0, 255, 238, 0.2)';
                item.style.borderColor = 'rgba(0, 255, 238, 0.5)';
            } else {
                item.style.background = 'transparent';
                item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
        });
    }
    
    selectResult(result) {
        this.input.value = result.address;
        this.hideDropdown();
        
        // Trigger auto-fill if property data is available
        if (result.property) {
            this.autoFillPropertyData(result.property);
        }
        
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
        this.input.dispatchEvent(new CustomEvent('addressSelected', { 
            detail: { 
                address: result.address, 
                property: result.property 
            },
            bubbles: true 
        }));
    }
    
    autoFillPropertyData(property) {
        console.log('🏡 Auto-filling property data:', property);
        
        // Try to find and fill related form fields
        const form = this.input.closest('form') || document;
        
        // Map property type
        const propertyTypeSelect = form.querySelector('select[name*="type" i], select[id*="type" i], #assessment-type, #property-type');
        if (propertyTypeSelect && property.propertyType) {
            const propertyTypeMap = {
                'residential': ['residential', 'Residential Property', 'Residential - Single Family'],
                'commercial': ['commercial', 'Commercial Property', 'Commercial'],
                'industrial': ['industrial', 'Industrial Property', 'Industrial'],
                'agricultural': ['agricultural', 'Agricultural Land', 'Agricultural']
            };
            
            const typeOptions = propertyTypeMap[property.propertyType] || [property.propertyType];
            for (const option of propertyTypeSelect.options) {
                if (typeOptions.some(type => option.text.toLowerCase().includes(type.toLowerCase()) || option.value.toLowerCase().includes(type.toLowerCase()))) {
                    propertyTypeSelect.value = option.value;
                    break;
                }
            }
        }
        
        // Fill square footage
        const squareFootageInput = form.querySelector('input[placeholder*="square" i], input[name*="square" i], input[id*="square" i], input[placeholder*="footage" i]');
        if (squareFootageInput && property.squareFootage) {
            squareFootageInput.value = property.squareFootage.toLocaleString();
        }
        
        // Fill county selection
        const countySelect = form.querySelector('select[name*="county" i], select[id*="county" i], #county-select');
        if (countySelect && property.county) {
            for (const option of countySelect.options) {
                if (option.text.toLowerCase().includes(property.county.toLowerCase())) {
                    countySelect.value = option.value;
                    break;
                }
            }
        }
        
        // Show property information in a summary if there's a results area
        const resultsArea = document.getElementById('demo-results') || form.querySelector('.demo-results, .property-results, .results');
        if (resultsArea) {
            this.displayPropertySummary(property, resultsArea);
        }
        
        // Trigger change events
        [propertyTypeSelect, squareFootageInput, countySelect].forEach(element => {
            if (element) {
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }
    
    displayPropertySummary(property, container) {
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        };
        
        const formatNumber = (num) => {
            return num ? num.toLocaleString() : 'N/A';
        };
        
        const summaryHTML = `
            <div style="background: rgba(0, 255, 238, 0.1); border: 2px solid rgba(0, 255, 238, 0.3); border-radius: 16px; padding: 2rem; margin-top: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#00ffee">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    <h3 style="color: #00ffee; font-size: 1.5rem; margin: 0;">Property Information Auto-Filled</h3>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Property Type</div>
                        <div style="color: #ffffff; font-size: 1.1rem; font-weight: 600; text-transform: capitalize;">${property.propertyType}</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Square Footage</div>
                        <div style="color: #ffffff; font-size: 1.1rem; font-weight: 600;">${formatNumber(property.squareFootage)} sq ft</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Assessed Value</div>
                        <div style="color: #00ffaa; font-size: 1.1rem; font-weight: 700;">${formatCurrency(property.assessedValue)}</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Year Built</div>
                        <div style="color: #ffffff; font-size: 1.1rem; font-weight: 600;">${property.yearBuilt}</div>
                    </div>
                </div>
                
                ${property.bedrooms ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem;">
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Bedrooms</div>
                            <div style="color: #ffffff; font-size: 1.1rem; font-weight: 600;">${property.bedrooms}</div>
                        </div>
                        
                        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem;">
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Bathrooms</div>
                            <div style="color: #ffffff; font-size: 1.1rem; font-weight: 600;">${property.bathrooms}</div>
                        </div>
                        
                        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem;">
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Lot Size</div>
                            <div style="color: #ffffff; font-size: 1.1rem; font-weight: 600;">${property.lotSize}</div>
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0, 255, 170, 0.1); border-radius: 8px; text-align: center;">
                    <div style="color: #00ffaa; font-size: 0.9rem; font-weight: 600;">✅ Form fields automatically populated from Terrafusion property database</div>
                </div>
            </div>
        `;
        
        container.innerHTML = summaryHTML;
    }
    
    showDropdown() {
        this.dropdown.style.display = 'block';
    }
    
    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }
    
    isDropdownVisible() {
        return this.dropdown.style.display === 'block';
    }
}

// Create global instances
window.FuzzyAddressSearch = FuzzyAddressSearch;
window.AddressAutocomplete = AddressAutocomplete;

console.log('🔍 Terrafusion Fuzzy Address Search System loaded');