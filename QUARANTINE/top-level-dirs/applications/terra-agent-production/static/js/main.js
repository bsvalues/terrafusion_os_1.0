// Main JavaScript for TerraAgent

// DOM Elements
let chatContainer, messageInput, sendButton, queryTypeSelect;
let resetChatButton, loadingIndicator;

// Application state
const appState = {
    isProcessing: false,
    systemStatus: {
        database: true,
        vector_store: false,
        ai_model: true
    }
};

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize notification system
    if (window.Notifications) {
        window.Notifications.init();
    }
    
    // Set up form validation for all forms with needs-validation class
    setupFormValidation();
    
    // Get DOM elements
    chatContainer = document.getElementById('chat-container');
    messageInput = document.getElementById('message-input');
    sendButton = document.getElementById('send-button');
    queryTypeSelect = document.getElementById('query-type');
    resetChatButton = document.getElementById('reset-chat');
    loadingIndicator = document.getElementById('loading-indicator');
    
    // Document ingestion elements
    const sidebarDocForm = document.getElementById('sidebar-document-form');
    const sidebarIngestStatus = document.getElementById('sidebar-ingest-status');
    
    // Set up help tooltips for query types
    setupQueryTypeTooltips();
    
    // Set up event listeners with improved accessibility
    sendButton.addEventListener('click', sendMessage);
    
    // Add keyboard support for message input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default to avoid newline in input
            sendMessage();
        }
    });
    
    // Add keyboard shortcut (Ctrl+Enter or Command+Enter also works)
    document.addEventListener('keydown', (e) => {
        // Alt+S or Ctrl+Enter to send message when input is focused
        if (document.activeElement === messageInput && 
            ((e.altKey && e.key === 's') || (e.ctrlKey && e.key === 'Enter'))) {
            e.preventDefault();
            sendMessage();
        }
        
        // Escape key to clear input when focused
        if (document.activeElement === messageInput && e.key === 'Escape') {
            e.preventDefault();
            messageInput.value = '';
        }
        
        // Focus message input with / key when not in any input
        if (e.key === '/' && 
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            messageInput.focus();
        }
    });
    
    if (resetChatButton) {
        resetChatButton.addEventListener('click', resetChat);
    }
    
    // Set up document ingestion form
    if (sidebarDocForm) {
        sidebarDocForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const url = document.getElementById('sidebar-doc-url').value;
            const title = document.getElementById('sidebar-doc-title').value;
            
            // Show loading state
            sidebarIngestStatus.classList.remove('d-none', 'text-success', 'text-danger');
            sidebarIngestStatus.classList.add('text-info');
            sidebarIngestStatus.textContent = 'Processing document...';
            
            // Show processing notification
            const processingNotification = window.Notifications?.info('Processing document. This may take a few moments...', 0) || null;
            
            try {
                // Send API request
                const response = await fetch('/api/ingest_document', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url,
                        title: title || null,
                        type: 'webpage'
                    })
                });
                
                const result = await response.json();
                
                // Dismiss processing notification
                if (processingNotification && window.Notifications) {
                    window.Notifications.dismiss(processingNotification);
                }
                
                if (response.ok) {
                    // Success
                    sidebarIngestStatus.classList.remove('text-info', 'text-danger');
                    sidebarIngestStatus.classList.add('text-success');
                    sidebarIngestStatus.textContent = `Document added successfully!`;
                    
                    // Show success notification
                    window.Notifications?.success(`Document "${result.title}" added successfully!`);
                    
                    // Add message to chat
                    addMessage(`I've added a new document "${result.title}" to my knowledge base. You can now ask me questions about it!`, 'assistant');
                    
                    // Clear form
                    sidebarDocForm.reset();
                } else {
                    // Error
                    sidebarIngestStatus.classList.remove('text-info', 'text-success');
                    sidebarIngestStatus.classList.add('text-danger');
                    sidebarIngestStatus.textContent = `Error: ${result.error}`;
                    
                    // Show error notification
                    window.Notifications?.error(`Failed to add document: ${result.error}`);
                }
            } catch (error) {
                // Dismiss processing notification
                if (processingNotification && window.Notifications) {
                    window.Notifications.dismiss(processingNotification);
                }
                
                // Network error
                sidebarIngestStatus.classList.remove('text-info', 'text-success');
                sidebarIngestStatus.classList.add('text-danger');
                sidebarIngestStatus.textContent = `Network error`;
                console.error('Document ingestion error:', error);
                
                // Show error notification
                window.Notifications?.error('Network error. Please check your connection and try again.');
            }
        });
    }
    
    // Hide loading indicator initially
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // Link system status with our app state
    if (window.SystemStatus) {
        // Use the SystemStatus component
        const initialStatus = window.SystemStatus.getStatus();
        if (initialStatus) {
            appState.systemStatus = initialStatus;
        }
        
        // Custom event for status updates
        document.addEventListener('systemStatusUpdate', function(e) {
            if (e.detail && e.detail.status) {
                appState.systemStatus = e.detail.status;
                updateQueryTypeAvailability();
            }
        });
    } else {
        // Fallback: check status directly if component not available
        checkSystemStatus();
    }
    
    // Add welcome message
    addMessage('Hello, I\'m Agent Smith from TerraAgent. Ask me anything about property assessment, CAMA data, levy calculations, or database information. You can also add documents to my knowledge base using the form in the sidebar.', 'assistant');
});

/**
 * Setup tooltips for query type selector to provide better guidance
 */
function setupQueryTypeTooltips() {
    if (!queryTypeSelect) return;
    
    const tooltipContent = {
        'general': 'General queries about property data, assessments, and CAMA information.',
        'rag': 'Search through ingested documents and knowledge base for specific information.',
        'levy': 'Calculate property tax levies based on assessment values and exemptions.',
        'trends': 'Analyze neighborhood trends and property value changes over time.',
        'dbatools': 'Advanced database administration tasks and queries.'
    };
    
    // Add help icon and tooltip container next to select
    const queryTypeContainer = queryTypeSelect.parentElement;
    const helpContainer = document.createElement('div');
    helpContainer.className = 'mt-2 small text-muted query-help';
    helpContainer.innerHTML = '<i class="fas fa-info-circle me-1"></i><span>Select a query type for better results</span>';
    queryTypeContainer.appendChild(helpContainer);
    
    // Update help text when selection changes
    const helpText = helpContainer.querySelector('span');
    queryTypeSelect.addEventListener('change', () => {
        const selected = queryTypeSelect.value;
        helpText.textContent = tooltipContent[selected] || 'Select a query type for better results';
    });
}

// Add a message to the chat container
function addMessage(text, role) {
    // Create message element with proper ARIA roles for accessibility
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}-message`;
    
    // Add ARIA roles and attributes for screen readers
    messageElement.setAttribute('role', 'log');
    messageElement.setAttribute('aria-live', role === 'assistant' ? 'polite' : 'off');
    
    // Add timestamp for screen readers (hidden visually)
    const timestamp = new Date().toLocaleTimeString();
    const sender = role === 'assistant' ? 'Assistant' : 'You';
    
    // Create message header with metadata (visually hidden for screen readers)
    const messageHeader = document.createElement('div');
    messageHeader.className = 'sr-only';
    messageHeader.setAttribute('aria-hidden', 'false');
    messageHeader.textContent = `${sender} at ${timestamp}:`;
    messageElement.appendChild(messageHeader);
    
    // Create content container
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    
    // Process markdown-like formatting in the message
    const formattedText = formatText(text);
    contentElement.innerHTML = formattedText;
    messageElement.appendChild(contentElement);
    
    // Add to chat container
    chatContainer.appendChild(messageElement);
    
    // Announce to screen readers when assistant responds
    if (role === 'assistant') {
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.textContent = 'New response received';
        document.body.appendChild(announcement);
        
        // Remove after it's been announced
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Scroll to bottom
    scrollToBottom();
}

// Format text with simple markdown-like syntax
function formatText(text) {
    // Convert code blocks
    text = text.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Convert inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert bold text
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic text
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Convert line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Scroll chat container to bottom
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Set up form validation for Bootstrap forms
 */
function setupFormValidation() {
    // Fetch all forms with the 'needs-validation' class
    const forms = document.querySelectorAll('.needs-validation');
    
    // Loop over them and prevent submission if validation fails
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            // Skip if form validation already handled by specific event handler
            if (form.getAttribute('data-validation-handled') === 'true') {
                return;
            }
            
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                
                // Show validation error notification
                window.Notifications?.warning('Please fix the form errors before submitting.');
            }
            
            form.classList.add('was-validated');
        }, false);
    });
    
    // Add validation to the message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('invalid', function() {
            if (this.value.trim() === '') {
                window.Notifications?.info('Please enter a message before sending.');
            } else if (this.value.length < 2) {
                window.Notifications?.info('Your message is too short.');
            } else if (this.value.length > 500) {
                window.Notifications?.info('Your message is too long (maximum 500 characters).');
            }
        });
    }
}

/**
 * Check system status and display it to the user
 */
function checkSystemStatus() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            // Update app state
            if (data && data.status) {
                appState.systemStatus = data.status;
                
                // Show warning for unavailable services
                if (!data.status.vector_store) {
                    window.Notifications?.warning('Document search functionality is limited. Vector store is unavailable.', 10000);
                }
                
                // Update query type options based on availability
                updateQueryTypeAvailability();
            }
        })
        .catch(error => {
            console.error('Error checking system status:', error);
        });
}

/**
 * Update query type options based on service availability
 */
function updateQueryTypeAvailability() {
    if (!queryTypeSelect) return;
    
    // Get all options
    const options = Array.from(queryTypeSelect.options);
    
    // Update options based on system status
    options.forEach(option => {
        // If vector store is unavailable, disable RAG option
        if (option.value === 'rag' && !appState.systemStatus.vector_store) {
            option.disabled = true;
            option.text = option.text + ' (Limited)';
        }
        
        // Handle other service dependencies as needed
    });
}

/**
 * Send message to backend
 */
function sendMessage() {
    const message = messageInput.value.trim();
    
    // Skip if message is empty
    if (!message) {
        return;
    }
    
    // Prevent double submission
    if (appState.isProcessing) {
        return;
    }
    
    // Get selected query type
    const queryType = queryTypeSelect ? queryTypeSelect.value : 'general';
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    
    // Update UI for processing state
    appState.isProcessing = true;
    if (loadingIndicator) {
        loadingIndicator.style.display = 'inline-block';
    }
    sendButton.disabled = true;
    
    // Show notification for specific query types
    let processingNotification = null;
    if (queryType === 'rag') {
        processingNotification = window.Notifications?.info('Searching through documents. This may take a moment...', 0);
    } else if (queryType === 'trends') {
        processingNotification = window.Notifications?.info('Analyzing neighborhood trends. This may take a moment...', 0);
    }
    
    // Send to backend
    fetch('/api/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: message,
            type: queryType
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset processing state
        appState.isProcessing = false;
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        sendButton.disabled = false;
        
        // Dismiss processing notification if present
        if (processingNotification && window.Notifications) {
            window.Notifications.dismiss(processingNotification);
        }
        
        // Handle error
        if (data.error) {
            // Show error in chat
            addMessage(`Error: ${data.error}`, 'assistant error');
            
            // Show notification
            window.Notifications?.error(`Query error: ${data.error}`);
            
            // Provide recovery suggestion based on error type
            if (data.error.includes('database') || data.error.includes('Database')) {
                window.Notifications?.info('Try a different query type or check database connection.', 7000);
            } else if (data.error.includes('vector store') || data.error.includes('document')) {
                window.Notifications?.info('Document search is limited. Try a general query instead.', 7000);
            }
            
            return;
        }
        
        // Add assistant response to chat
        addMessage(data.result, 'assistant');
        
        // Scroll to bottom
        scrollToBottom();
    })
    .catch(error => {
        // Reset processing state
        appState.isProcessing = false;
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        sendButton.disabled = false;
        
        // Dismiss processing notification if present
        if (processingNotification && window.Notifications) {
            window.Notifications.dismiss(processingNotification);
        }
        
        // Show error in chat
        addMessage(`Error: ${error.message}`, 'assistant error');
        
        // Show notification
        window.Notifications?.error('Network error. Please try again later.');
        
        console.error('Error:', error);
    });
}

// Reset chat history
function resetChat() {
    // Clear chat container
    while (chatContainer.firstChild) {
        chatContainer.removeChild(chatContainer.firstChild);
    }
    
    // Show notification
    window.Notifications?.info('Resetting chat history...');
    
    // Send reset request to backend
    fetch('/api/reset_chat', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        // Add welcome message
        addMessage('Chat history has been reset. I\'m Agent Smith - how can I assist with your property assessment needs today?', 'assistant');
        
        // Show success notification
        window.Notifications?.success('Chat history has been reset successfully.');
    })
    .catch(error => {
        console.error('Error resetting chat:', error);
        window.Notifications?.error('Failed to reset chat history. Please try again.');
    });
}
