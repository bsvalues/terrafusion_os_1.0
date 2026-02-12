/**
 * Voice-activated property search with natural language processing
 * 
 * This script handles voice input capture, processing, and search execution
 */

class VoicePropertySearch {
    constructor(options = {}) {
        // Set default options
        this.options = {
            language: 'en-US',
            searchEndpoint: '/api/voice-property-search',
            voiceButtonId: 'voice-search-button',
            searchResultsId: 'search-results',
            searchStatusId: 'search-status',
            recordingTimeout: 10000, // 10 seconds max recording time
            ...options
        };

        // Initialize state
        this.isRecording = false;
        this.recognition = null;
        this.transcript = '';
        this.searchInProgress = false;

        // Bind methods to this
        this.toggleRecording = this.toggleRecording.bind(this);
        this.processVoiceInput = this.processVoiceInput.bind(this);
        this.handleError = this.handleError.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.searchProperties = this.searchProperties.bind(this);

        // Initialize when document is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the voice search functionality
     */
    init() {
        // Check if browser supports SpeechRecognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.updateStatus('Voice recognition is not supported in your browser. Try Chrome or Edge.', 'error');
            document.getElementById(this.options.voiceButtonId).disabled = true;
            return;
        }

        // Initialize SpeechRecognition
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.options.language;

        // Set up event listeners
        this.recognition.onresult = this.processVoiceInput;
        this.recognition.onerror = this.handleError;
        this.recognition.onend = () => {
            if (this.isRecording) {
                this.stopRecording();
                this.searchProperties(this.transcript);
            }
        };

        // Add event listener to the voice search button
        const voiceButton = document.getElementById(this.options.voiceButtonId);
        if (voiceButton) {
            voiceButton.addEventListener('click', this.toggleRecording);
        } else {
            console.error(`Voice search button with ID "${this.options.voiceButtonId}" not found.`);
        }

        // Initialize UI
        this.updateStatus('Voice search ready. Click the microphone to begin.', 'ready');
    }

    /**
     * Toggle recording state
     */
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    /**
     * Start voice recording
     */
    startRecording() {
        if (this.searchInProgress) {
            this.updateStatus('Please wait while processing the previous search...', 'warning');
            return;
        }

        this.transcript = '';
        this.isRecording = true;
        
        try {
            this.recognition.start();
            this.updateStatus('Listening... Speak your property search query.', 'recording');
            
            // Update button state
            const voiceButton = document.getElementById(this.options.voiceButtonId);
            if (voiceButton) {
                voiceButton.classList.add('recording');
                
                // Pulse animation
                voiceButton.style.animation = 'pulse 1.5s infinite';
            }
            
            // Set a timeout to stop recording after the specified time
            this.recordingTimeout = setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                    this.searchProperties(this.transcript);
                }
            }, this.options.recordingTimeout);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Stop voice recording
     */
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
        
        // Clear the recording timeout
        if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
            this.recordingTimeout = null;
        }
        
        // Update button state
        const voiceButton = document.getElementById(this.options.voiceButtonId);
        if (voiceButton) {
            voiceButton.classList.remove('recording');
            voiceButton.style.animation = '';
        }
        
        this.updateStatus('Processing your search...', 'processing');
    }

    /**
     * Process voice input from the speech recognition API
     */
    processVoiceInput(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (finalTranscript) {
            this.transcript = finalTranscript;
            this.updateStatus(`Heard: "${finalTranscript}"`, 'recording');
        } else if (interimTranscript) {
            this.updateStatus(`Hearing: "${interimTranscript}"`, 'recording');
        }
        
        // If we have significant content, automatically search
        if (finalTranscript && finalTranscript.split(' ').length > 4) {
            this.stopRecording();
            this.searchProperties(finalTranscript);
        }
    }

    /**
     * Handle errors from the speech recognition API
     */
    handleError(event) {
        let message = '';
        
        switch (event.error) {
            case 'no-speech':
                message = 'No speech was detected. Please try again.';
                break;
            case 'aborted':
                message = 'Speech recognition was aborted.';
                break;
            case 'audio-capture':
                message = 'No microphone was found or microphone is disabled.';
                break;
            case 'network':
                message = 'Network error occurred. Please check your connection.';
                break;
            case 'not-allowed':
            case 'service-not-allowed':
                message = 'Microphone access was denied. Please enable microphone access.';
                break;
            default:
                message = `Error: ${event.error}`;
        }
        
        this.updateStatus(message, 'error');
        this.isRecording = false;
        
        // Update button state
        const voiceButton = document.getElementById(this.options.voiceButtonId);
        if (voiceButton) {
            voiceButton.classList.remove('recording');
            voiceButton.style.animation = '';
        }
    }

    /**
     * Update the status display
     */
    updateStatus(message, status = 'info') {
        const statusElement = document.getElementById(this.options.searchStatusId);
        if (!statusElement) return;
        
        statusElement.textContent = message;
        
        // Remove existing status classes and add the new one
        statusElement.className = ''; // Remove all classes
        statusElement.classList.add('search-status', status);
    }

    /**
     * Send the voice transcript to the server for NLP processing and search
     */
    searchProperties(transcript) {
        if (!transcript || this.searchInProgress) return;
        
        this.searchInProgress = true;
        this.updateStatus('Searching properties based on your query...', 'searching');
        
        fetch(this.options.searchEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ query: transcript })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            this.searchInProgress = false;
            
            if (data.error) {
                this.updateStatus(`Error: ${data.error}`, 'error');
                return;
            }
            
            // Display results
            this.displayResults(data);
            
            // Update status
            const resultCount = data.properties ? data.properties.length : 0;
            if (resultCount > 0) {
                this.updateStatus(`Found ${resultCount} properties matching your search.`, 'success');
            } else {
                this.updateStatus('No properties found matching your search criteria.', 'info');
            }
        })
        .catch(error => {
            this.searchInProgress = false;
            this.updateStatus(`Error: ${error.message}`, 'error');
            console.error('Search error:', error);
        });
    }

    /**
     * Display search results in the designated container
     */
    displayResults(data) {
        const resultsContainer = document.getElementById(this.options.searchResultsId);
        if (!resultsContainer) return;
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        if (!data.properties || data.properties.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No properties found matching your search criteria.</div>';
            return;
        }
        
        // Display the interpreted search criteria
        if (data.interpreted_query) {
            const queryInterpretation = document.createElement('div');
            queryInterpretation.className = 'query-interpretation';
            queryInterpretation.innerHTML = `
                <h3>We understood your search as:</h3>
                <div class="interpretation-details">
                    ${this.formatInterpretedQuery(data.interpreted_query)}
                </div>
            `;
            resultsContainer.appendChild(queryInterpretation);
        }
        
        // Create and append property results
        const propertiesGrid = document.createElement('div');
        propertiesGrid.className = 'properties-grid';
        
        data.properties.forEach(property => {
            const propertyCard = this.createPropertyCard(property);
            propertiesGrid.appendChild(propertyCard);
        });
        
        resultsContainer.appendChild(propertiesGrid);
    }

    /**
     * Format the interpreted query for display
     */
    formatInterpretedQuery(interpretation) {
        let html = '<ul class="interpretation-list">';
        
        for (const [key, value] of Object.entries(interpretation)) {
            if (value !== null && value !== undefined && value !== '') {
                // Format the key for display
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                
                // Format the value based on type
                let formattedValue = value;
                if (Array.isArray(value)) {
                    formattedValue = value.join(', ');
                } else if (typeof value === 'boolean') {
                    formattedValue = value ? 'Yes' : 'No';
                } else if (typeof value === 'number') {
                    if (key.includes('price')) {
                        formattedValue = `$${value.toLocaleString()}`;
                    } else {
                        formattedValue = value.toLocaleString();
                    }
                }
                
                html += `<li><span class="key">${formattedKey}:</span> <span class="value">${formattedValue}</span></li>`;
            }
        }
        
        html += '</ul>';
        return html;
    }

    /**
     * Create a property card element
     */
    createPropertyCard(property) {
        const card = document.createElement('div');
        card.className = 'property-card';
        
        // Format price
        const price = typeof property.price === 'number'
            ? `$${property.price.toLocaleString()}`
            : property.price;
        
        // Card HTML structure
        card.innerHTML = `
            <div class="property-image">
                <img src="${property.image_url || '/static/images/property-placeholder.jpg'}" alt="${property.address || 'Property'}">
                <div class="property-price">${price || 'Price not available'}</div>
            </div>
            <div class="property-details">
                <h3 class="property-address">${property.address || 'Address not available'}</h3>
                <div class="property-specs">
                    ${property.bedrooms ? `<span class="spec"><i class="fa fa-bed"></i> ${property.bedrooms} bd</span>` : ''}
                    ${property.bathrooms ? `<span class="spec"><i class="fa fa-bath"></i> ${property.bathrooms} ba</span>` : ''}
                    ${property.square_feet ? `<span class="spec"><i class="fa fa-vector-square"></i> ${property.square_feet.toLocaleString()} sqft</span>` : ''}
                </div>
                <p class="property-description">${property.description || ''}</p>
                <div class="property-features">
                    ${property.features ? this.formatFeatures(property.features) : ''}
                </div>
                <a href="/property/${property.id}" class="view-details-btn">View Details</a>
            </div>
        `;
        
        return card;
    }

    /**
     * Format property features for display
     */
    formatFeatures(features) {
        if (!features || !Array.isArray(features) || features.length === 0) {
            return '';
        }
        
        return features.map(feature => `
            <span class="feature">${feature}</span>
        `).join('');
    }
}

// Initialize the voice search on page load
document.addEventListener('DOMContentLoaded', () => {
    const voiceSearch = new VoicePropertySearch({
        // You can customize options here
    });
});