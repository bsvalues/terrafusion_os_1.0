// Main JavaScript for NARRPR Data Scraper

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons if available
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Handle form submission for running the scraper
    const scraperForm = document.getElementById('scraper-form');
    if (scraperForm) {
        scraperForm.addEventListener('submit', function(e) {
            const submitButton = scraperForm.querySelector('button[type="submit"]');
            const buttonText = submitButton.innerHTML;
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Running...';
            
            // Form will submit normally, this just updates the UI
        });
    }
    
    // Handle clipboard copy for report data
    const copyButtons = document.querySelectorAll('.btn-copy');
    if (copyButtons.length > 0) {
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const textToCopy = this.getAttribute('data-copy-text');
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    // Change button text temporarily
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i data-feather="check"></i> Copied!';
                    feather.replace();
                    
                    // Reset button text after 2 seconds
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        feather.replace();
                    }, 2000);
                });
            });
        });
    }
    
    // Toggle password visibility
    const passwordToggles = document.querySelectorAll('.password-toggle');
    if (passwordToggles.length > 0) {
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const inputField = document.querySelector(this.getAttribute('data-password-field'));
                
                if (inputField.type === 'password') {
                    inputField.type = 'text';
                    this.innerHTML = '<i data-feather="eye-off"></i>';
                } else {
                    inputField.type = 'password';
                    this.innerHTML = '<i data-feather="eye"></i>';
                }
                
                feather.replace();
            });
        });
    }
    
    // Handle filtering in tables
    const searchInputs = document.querySelectorAll('.table-search');
    if (searchInputs.length > 0) {
        searchInputs.forEach(input => {
            input.addEventListener('keyup', function() {
                const searchValue = this.value.toLowerCase();
                const tableId = this.getAttribute('data-table');
                const table = document.getElementById(tableId);
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchValue) ? '' : 'none';
                });
            });
        });
    }
});

// Function to update real-time status during scraping
function updateScraperStatus(status) {
    const statusElement = document.getElementById('scraper-status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// Function to add a new log entry to the activity log
function addLogEntry(message, type = 'info') {
    const logContainer = document.getElementById('activity-log');
    if (!logContainer) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    
    logEntry.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        <span class="log-message">${message}</span>
    `;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}
