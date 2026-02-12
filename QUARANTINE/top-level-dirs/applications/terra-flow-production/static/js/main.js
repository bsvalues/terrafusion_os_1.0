/**
 * GeoAssessmentPro Main JavaScript
 * Benton County Assessor's Office
 * Copyright 2025
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Setup Flash message auto-dismissal
    const flashMessages = document.querySelectorAll('.alert-dismissible');
    flashMessages.forEach(function(alert) {
        // Auto dismiss after 5 seconds
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
    
    // Toggle password visibility for password fields
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    });
    
    // Handle confirmation dialogs
    const confirmButtons = document.querySelectorAll('[data-confirm]');
    confirmButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm(this.getAttribute('data-confirm'))) {
                e.preventDefault();
                return false;
            }
        });
    });
    
    // Add active class to current nav item based on URL
    const currentLocation = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentLocation) {
            link.classList.add('active');
        }
    });
    
    // Form validation enhancement
    const forms = document.querySelectorAll('form.needs-validation');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });
    
    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('.copy-to-clipboard');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-clipboard-text');
            const tempInput = document.createElement('input');
            document.body.appendChild(tempInput);
            tempInput.value = textToCopy;
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            // Show success feedback
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="bi bi-check"></i> Copied!';
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });
    
    // Initialize date pickers if any
    if (typeof flatpickr !== 'undefined') {
        flatpickr('.datepicker', {
            dateFormat: 'Y-m-d',
            allowInput: true
        });
    }
    
    // Handle custom file inputs
    const customFileInputs = document.querySelectorAll('.custom-file-input');
    customFileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const fileName = this.files[0].name;
            const nextSibling = this.nextElementSibling;
            nextSibling.innerText = fileName;
        });
    });
    
    // Collapsible card functionality
    const cardToggles = document.querySelectorAll('.card-header-toggle');
    cardToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-bs-target');
            const targetCollapse = document.querySelector(targetId);
            const isCollapsed = targetCollapse.classList.contains('show');
            const icon = this.querySelector('i');
            
            if (isCollapsed) {
                icon.classList.remove('bi-chevron-up');
                icon.classList.add('bi-chevron-down');
            } else {
                icon.classList.remove('bi-chevron-down');
                icon.classList.add('bi-chevron-up');
            }
        });
    });
    
    // Feedback form functionality
    const feedbackModal = document.getElementById('feedbackModal');
    if (feedbackModal) {
        // Set current page URL when feedback modal is opened
        feedbackModal.addEventListener('show.bs.modal', function () {
            const currentPageInput = document.getElementById('currentPage');
            if (currentPageInput) {
                currentPageInput.value = window.location.pathname;
            }
        });
        
        // Handle feedback form submission
        const feedbackForm = document.getElementById('feedbackForm');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(feedbackForm);
                
                // Get screenshot if permission is given
                const screenshotPermission = formData.get('screenshot_permission');
                if (screenshotPermission === 'on') {
                    // In a real implementation, this would capture a screenshot
                    // For now, we just add a placeholder
                    formData.append('screenshot', 'screenshot_placeholder');
                }
                
                // Submit the feedback via fetch API
                fetch(feedbackForm.action, {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Show success message
                    const feedbackButton = document.querySelector('.feedback-button');
                    const modal = bootstrap.Modal.getInstance(feedbackModal);
                    modal.hide();
                    
                    // Create and show success toast
                    showToast('Feedback Submitted', 'Thank you for your feedback! Your input helps us improve the system.', 'success');
                    
                    // Reset form
                    feedbackForm.reset();
                })
                .catch(error => {
                    console.error('Error submitting feedback:', error);
                    showToast('Submission Error', 'There was a problem submitting your feedback. Please try again.', 'danger');
                });
            });
        }
    }
    
    // Toast notification system
    function showToast(title, message, type = 'info') {
        try {
            // Try to find the toast container
            let container = document.getElementById('toast-container');
            
            // Create toast container if it doesn't exist
            if (!container) {
                try {
                    container = document.createElement('div');
                    container.id = 'toast-container';
                    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                    container.style.zIndex = '1090';
                    
                    // Make sure document.body exists before appending
                    if (document.body) {
                        document.body.appendChild(container);
                    } else {
                        console.error('Document body not available');
                        return; // Exit if no document body
                    }
                } catch (err) {
                    console.error('Error creating toast container:', err);
                    return; // Exit if container creation fails
                }
            }
            
            // Create toast element
            const toastEl = document.createElement('div');
            toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
            toastEl.setAttribute('role', 'alert');
            toastEl.setAttribute('aria-live', 'assertive');
            toastEl.setAttribute('aria-atomic', 'true');
            
            // Create toast content
            toastEl.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        <strong>${title}</strong><br>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            `;
            
            // Add toast to container
            if (container && container.appendChild) {
                container.appendChild(toastEl);
                
                // Initialize and show toast
                if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                    const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
                    toast.show();
                    
                    // Remove toast from DOM after it's hidden
                    toastEl.addEventListener('hidden.bs.toast', function () {
                        if (toastEl.parentNode) {
                            toastEl.parentNode.removeChild(toastEl);
                        }
                    });
                } else {
                    console.error('Bootstrap Toast not available');
                }
            } else {
                console.error('Toast container is not valid for appending');
            }
        } catch (err) {
            console.error('Error showing toast:', err);
        }
    }
    
    // Test scenario guide functionality
    const testGuides = document.querySelectorAll('.test-guide');
    testGuides.forEach(guide => {
        const steps = guide.querySelectorAll('.test-step');
        steps.forEach((step /* , index */) => {
            // Add completed checkbox to each step
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input step-checkbox ms-2';
            checkbox.id = `step-${guide.id}-${index}`;
            
            // Load state from localStorage if available
            const savedState = localStorage.getItem(checkbox.id);
            if (savedState === 'true') {
                checkbox.checked = true;
                step.classList.add('text-muted');
            }
            
            // Save state to localStorage when changed
            checkbox.addEventListener('change', function() {
                localStorage.setItem(this.id, this.checked);
                if (this.checked) {
                    step.classList.add('text-muted');
                } else {
                    step.classList.remove('text-muted');
                }
            });
            
            step.appendChild(checkbox);
        });
    });
});