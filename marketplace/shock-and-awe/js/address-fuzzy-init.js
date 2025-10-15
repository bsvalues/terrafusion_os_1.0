/**
 * Terrafusion Address Fuzzy Search Initialization
 * Automatically enables fuzzy search on all address input fields
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Initializing Terrafusion Address Fuzzy Search...');
    
    // Initialize fuzzy search on existing address inputs
    initializeAddressFuzzySearch();
    
    // Watch for dynamically added address inputs (for CostForge and other features)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    initializeAddressFuzzySearchInElement(node);
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Terrafusion Address Fuzzy Search initialization complete');
});

function initializeAddressFuzzySearch() {
    // Find all address input fields
    const addressInputs = [
        // Demo form address input
        document.getElementById('property-address'),
        
        // Look for other address inputs by common patterns
        ...document.querySelectorAll('input[placeholder*="address" i]'),
        ...document.querySelectorAll('input[name*="address" i]'),
        ...document.querySelectorAll('input[id*="address" i]'),
        ...document.querySelectorAll('input[placeholder*="property" i]'),
        ...document.querySelectorAll('input[name*="property" i]'),
        ...document.querySelectorAll('input[id*="property" i]')
    ].filter(input => input && !input.hasAttribute('data-fuzzy-search-enabled'));
    
    addressInputs.forEach(input => {
        if (input && typeof AddressAutocomplete !== 'undefined') {
            try {
                new AddressAutocomplete(input);
                input.setAttribute('data-fuzzy-search-enabled', 'true');
                
                // Add visual indicator
                addSearchIcon(input);
                
                console.log(`🔍 Fuzzy search enabled for: ${input.id || input.name || input.placeholder}`);
            } catch (error) {
                console.warn('Failed to initialize fuzzy search for input:', error);
            }
        }
    });
}

function initializeAddressFuzzySearchInElement(element) {
    // Initialize fuzzy search for any address inputs within this element
    const addressInputs = [
        ...element.querySelectorAll('input[placeholder*="address" i]'),
        ...element.querySelectorAll('input[name*="address" i]'),
        ...element.querySelectorAll('input[id*="address" i]'),
        ...element.querySelectorAll('input[placeholder*="property" i]'),
        ...element.querySelectorAll('input[name*="property" i]'),
        ...element.querySelectorAll('input[id*="property" i]')
    ].filter(input => !input.hasAttribute('data-fuzzy-search-enabled'));
    
    addressInputs.forEach(input => {
        if (typeof AddressAutocomplete !== 'undefined') {
            try {
                new AddressAutocomplete(input);
                input.setAttribute('data-fuzzy-search-enabled', 'true');
                addSearchIcon(input);
                console.log(`🔍 Fuzzy search enabled for dynamic input: ${input.id || input.name || input.placeholder}`);
            } catch (error) {
                console.warn('Failed to initialize fuzzy search for dynamic input:', error);
            }
        }
    });
}

function addSearchIcon(input) {
    // Skip if already has search icon
    if (input.style.backgroundImage && input.style.backgroundImage.includes('search')) {
        return;
    }
    
    // Add search icon styling if not already present
    if (!input.style.paddingLeft) {
        input.style.paddingLeft = '50px';
    }
    
    if (!input.style.backgroundImage || !input.style.backgroundImage.includes('search')) {
        const searchIcon = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffee" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>')}")`;
        
        if (input.style.background) {
            input.style.background = `${searchIcon} no-repeat 15px center, ${input.style.background}`;
        } else {
            input.style.background = `${searchIcon} no-repeat 15px center, rgba(255, 255, 255, 0.1)`;
        }
        input.style.backgroundSize = '20px 20px, 100%';
    }
}

// Global function to manually enable fuzzy search on specific inputs
window.enableFuzzySearchOnInput = function(inputElement) {
    if (inputElement && !inputElement.hasAttribute('data-fuzzy-search-enabled')) {
        if (typeof AddressAutocomplete !== 'undefined') {
            new AddressAutocomplete(inputElement);
            inputElement.setAttribute('data-fuzzy-search-enabled', 'true');
            addSearchIcon(inputElement);
            console.log('🔍 Fuzzy search manually enabled for input');
        }
    }
};

// Global function to get fuzzy search stats
window.getFuzzySearchStats = function() {
    const enabledInputs = document.querySelectorAll('input[data-fuzzy-search-enabled="true"]');
    return {
        enabledInputs: enabledInputs.length,
        totalAddresses: window.FuzzyAddressSearch ? new window.FuzzyAddressSearch().addressDatabase.length : 0,
        inputElements: Array.from(enabledInputs).map(input => ({
            id: input.id,
            name: input.name,
            placeholder: input.placeholder
        }))
    };
};

console.log('🔍 Terrafusion Address Fuzzy Search Auto-Initialization loaded');