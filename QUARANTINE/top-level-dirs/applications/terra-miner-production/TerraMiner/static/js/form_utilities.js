/**
 * Form Utilities for TerraMiner
 * 
 * This file contains utility functions for enhancing form components
 * with interactive functionality.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all form components
    initPasswordToggles();
    initPasswordStrength();
    initTagInputs();
    initColorPickers();
    initRangeSliders();
    initAutocomplete();
    initFormSections();
    initFormValidation();
});

/**
 * Initialize password show/hide toggles
 */
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    });
}

/**
 * Initialize password strength meters
 */
function initPasswordStrength() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.closest('.form-field').querySelector('.password-strength')) {
            input.addEventListener('input', function() {
                const strength = calculatePasswordStrength(this.value);
                const progressBar = this.closest('.form-field').querySelector('.progress-bar');
                const strengthLabel = this.closest('.form-field').querySelector('.strength-label');
                
                // Update progress bar
                progressBar.style.width = `${strength.score * 25}%`;
                progressBar.className = 'progress-bar bg-' + strength.color;
                
                // Update strength label
                strengthLabel.textContent = strength.label;
                strengthLabel.className = 'strength-label small text-' + strength.color;
            });
        }
    });
}

/**
 * Calculate password strength
 * @param {string} password - Password to check
 * @returns {Object} - Strength details
 */
function calculatePasswordStrength(password) {
    if (!password) {
        return { score: 0, label: 'None', color: 'muted' };
    }
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // Adjust score to 0-4 scale
    score = Math.min(score, 4);
    
    // Define strength levels
    const strengthLevels = [
        { score: 0, label: 'Very Weak', color: 'danger' },
        { score: 1, label: 'Weak', color: 'danger' },
        { score: 2, label: 'Fair', color: 'warning' },
        { score: 3, label: 'Good', color: 'success' },
        { score: 4, label: 'Strong', color: 'success' }
    ];
    
    return strengthLevels[score];
}

/**
 * Initialize tag input components
 */
function initTagInputs() {
    document.querySelectorAll('.tag-input-container').forEach(container => {
        const input = container.querySelector('.tag-input');
        const hiddenInput = container.querySelector('input[type="hidden"]');
        const tagList = container.querySelector('.tag-list');
        
        if (!input || !hiddenInput || !tagList) return;
        
        // Parse existing tags from hidden input
        let tags = [];
        try {
            tags = JSON.parse(hiddenInput.value);
            if (!Array.isArray(tags)) tags = [];
        } catch (e) {
            console.error('Error parsing tags:', e);
            tags = [];
        }
        
        // Get delimiters and max tags
        const delimiters = JSON.parse(input.getAttribute('data-delimiters') || '[]');
        const maxTags = input.getAttribute('data-max-tags') !== 'null' ? 
            parseInt(input.getAttribute('data-max-tags'), 10) : null;
        
        // Add tag function
        function addTag(tag) {
            tag = tag.trim();
            if (!tag) return;
            
            // Check if tag already exists
            if (tags.includes(tag)) return;
            
            // Check max tags
            if (maxTags !== null && tags.length >= maxTags) return;
            
            // Add tag
            tags.push(tag);
            updateTags();
        }
        
        // Remove tag function
        function removeTag(index) {
            tags.splice(index, 1);
            updateTags();
        }
        
        // Update tags UI and hidden input
        function updateTags() {
            // Update hidden input
            hiddenInput.value = JSON.stringify(tags);
            
            // Update tag list
            tagList.innerHTML = '';
            
            tags.forEach((tag /* , index */) => {
                const tagItem = document.createElement('div');
                tagItem.className = 'badge bg-primary tag-item m-1 px-2 py-1';
                tagItem.innerHTML = `
                    <span>${tag}</span>
                    <button type="button" class="btn-close btn-close-white ms-1 tag-remove" aria-label="Remove"></button>
                `;
                
                tagItem.querySelector('.tag-remove').addEventListener('click', function() {
                    removeTag(index);
                });
                
                tagList.appendChild(tagItem);
            });
            
            // Clear input
            input.value = '';
        }
        
        // Handle input keydown
        input.addEventListener('keydown', function(e) {
            // Check for delimiters
            if (delimiters.includes(e.key)) {
                e.preventDefault();
                addTag(this.value);
                return;
            }
            
            // Handle backspace on empty input
            if (e.key === 'Backspace' && !this.value && tags.length > 0) {
                removeTag(tags.length - 1);
                return;
            }
            
            // Handle enter key
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(this.value);
                return;
            }
        });
        
        // Handle input blur
        input.addEventListener('blur', function() {
            if (this.value) {
                addTag(this.value);
            }
        });
        
        // Handle tag remove buttons
        tagList.addEventListener('click', function(e) {
            if (e.target.classList.contains('tag-remove')) {
                const index = Array.from(tagList.children).indexOf(e.target.closest('.tag-item'));
                if (index !== -1) {
                    removeTag(index);
                }
            }
        });
    });
}

/**
 * Initialize color picker components
 */
function initColorPickers() {
    document.querySelectorAll('input[type="color"]').forEach(colorInput => {
        const textInput = document.getElementById(colorInput.id + '_text');
        if (!textInput) return;
        
        // Update text input when color changes
        colorInput.addEventListener('input', function() {
            textInput.value = this.value;
        });
        
        // Update color input when text changes
        textInput.addEventListener('input', function() {
            // Add # if missing
            if (this.value && !this.value.startsWith('#')) {
                this.value = '#' + this.value;
            }
            
            // Validate hex color
            if (/^#([0-9A-F]{3}){1,2}$/i.test(this.value)) {
                colorInput.value = this.value;
            }
        });
        
        // Format on blur
        textInput.addEventListener('blur', function() {
            // Add # if missing
            if (this.value && !this.value.startsWith('#')) {
                this.value = '#' + this.value;
            }
            
            // Validate hex color
            if (!/^#([0-9A-F]{3}){1,2}$/i.test(this.value)) {
                this.value = colorInput.value;
            }
        });
    });
}

/**
 * Initialize range slider components
 */
function initRangeSliders() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const valueDisplay = slider.previousElementSibling?.querySelector('.slider-value');
        if (!valueDisplay) return;
        
        // Update value display when slider changes
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
        });
    });
}

/**
 * Initialize autocomplete for search fields
 */
function initAutocomplete() {
    document.querySelectorAll('input[data-autocomplete-url]').forEach(input => {
        const url = input.getAttribute('data-autocomplete-url');
        const minLength = parseInt(input.getAttribute('data-autocomplete-min-length') || '2', 10);
        const delay = parseInt(input.getAttribute('data-autocomplete-delay') || '300', 10);
        const resultsContainer = input.closest('.form-field').querySelector('.autocomplete-results');
        
        if (!url || !resultsContainer) return;
        
        let timeout = null;
        
        // Create results dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown position-absolute mt-1 w-100 bg-dark border border-secondary rounded shadow-sm';
        dropdown.style.display = 'none';
        dropdown.style.zIndex = '1000';
        resultsContainer.appendChild(dropdown);
        
        // Handle input
        input.addEventListener('input', function() {
            const query = this.value.trim();
            
            // Clear previous timeout
            if (timeout) clearTimeout(timeout);
            
            // Hide dropdown if query is too short
            if (query.length < minLength) {
                dropdown.style.display = 'none';
                return;
            }
            
            // Set timeout for API call
            timeout = setTimeout(() => {
                // In a real implementation, this would fetch from the API
                // For this demo, we'll simulate results
                simulateAutocompleteResults(query, dropdown);
            }, delay);
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        // Simulate autocomplete results (replace with actual API call)
        function simulateAutocompleteResults(query, dropdown) {
            // In a real implementation, this would fetch from the API
            const results = [
                { id: 1, text: query + ' Result 1' },
                { id: 2, text: query + ' Result 2' },
                { id: 3, text: query + ' Result 3' }
            ];
            
            // Clear previous results
            dropdown.innerHTML = '';
            
            // Add results to dropdown
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item p-2 border-bottom border-secondary cursor-pointer';
                item.textContent = result.text;
                
                item.addEventListener('click', function() {
                    input.value = result.text;
                    dropdown.style.display = 'none';
                });
                
                item.addEventListener('mouseover', function() {
                    this.classList.add('bg-primary');
                });
                
                item.addEventListener('mouseout', function() {
                    this.classList.remove('bg-primary');
                });
                
                dropdown.appendChild(item);
            });
            
            // Show dropdown
            dropdown.style.display = 'block';
        }
    });
}

/**
 * Initialize collapsible form sections
 */
function initFormSections() {
    document.querySelectorAll('.form-section-header[data-bs-toggle="collapse"]').forEach(header => {
        header.addEventListener('click', function() {
            const icon = this.querySelector('.bi');
            if (!icon) return;
            
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // Toggle icon
            if (isExpanded) {
                icon.classList.replace('bi-chevron-down', 'bi-chevron-right');
                this.setAttribute('aria-expanded', 'false');
            } else {
                icon.classList.replace('bi-chevron-right', 'bi-chevron-down');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/**
 * Initialize client-side form validation
 */
function initFormValidation() {
    document.querySelectorAll('form.needs-validation').forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!this.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            this.classList.add('was-validated');
        }, false);
    });
}