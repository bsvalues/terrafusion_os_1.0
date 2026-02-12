/**
 * Notification System for TerraAgent
 * Provides consistent user feedback across all operations
 */

// The notification container that will be added to the DOM
let notificationContainer;

// Initialize the notification system
function initNotifications() {
    // Create container if it doesn't exist
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add styles if not already in CSS
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 350px;
                    z-index: 9999;
                }
                
                .notification {
                    margin-bottom: 10px;
                    padding: 15px;
                    border-radius: 4px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    animation: slide-in 0.3s ease-out forwards;
                    opacity: 0;
                    transform: translateX(50px);
                }
                
                @keyframes slide-in {
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fade-out {
                    to {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                }
                
                .notification.success {
                    background-color: var(--bs-success);
                    color: white;
                }
                
                .notification.error {
                    background-color: var(--bs-danger);
                    color: white;
                }
                
                .notification.info {
                    background-color: var(--bs-info);
                    color: white;
                }
                
                .notification.warning {
                    background-color: var(--bs-warning);
                    color: white;
                }
                
                .notification-content {
                    margin-right: 10px;
                    flex: 1;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.8;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                .notification-progress {
                    height: 3px;
                    background-color: rgba(255, 255, 255, 0.5);
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    transform-origin: left;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

/**
 * Show a notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Time in ms before the notification is auto-dismissed (0 for no auto-dismiss)
 * @returns {HTMLElement} The notification element
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Initialize if not already done
    initNotifications();
    
    // Create notification element with accessibility attributes
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    
    // Add unique ID for accessibility references
    const notificationId = 'notification-' + Date.now();
    notification.id = notificationId;
    
    // Map type to text for screen readers
    const typeText = {
        success: 'Success:',
        error: 'Error:',
        info: 'Information:',
        warning: 'Warning:'
    };
    
    // Create hidden type label for screen readers
    const typeLabel = document.createElement('span');
    typeLabel.className = 'sr-only';
    typeLabel.textContent = typeText[type] || 'Notification:';
    
    // Create content with proper labeling
    const content = document.createElement('div');
    content.className = 'notification-content';
    content.id = `${notificationId}-content`;
    content.textContent = message;
    content.setAttribute('aria-label', `${typeText[type]} ${message}`);
    
    // Create close button with accessibility attributes
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.setAttribute('title', 'Close');
    closeBtn.addEventListener('click', () => dismissNotification(notification));
    
    // Add progress bar for timed notifications
    const progressBar = document.createElement('div');
    progressBar.className = 'notification-progress';
    progressBar.setAttribute('aria-hidden', 'true'); // Hide from screen readers
    
    // Assemble notification
    notification.appendChild(typeLabel);
    notification.appendChild(content);
    notification.appendChild(closeBtn);
    notification.appendChild(progressBar);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Enable keyboard interaction
    notification.setAttribute('tabindex', '0');
    notification.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dismissNotification(notification);
        }
    });
    
    // Set auto-dismiss if duration > 0
    if (duration > 0) {
        progressBar.style.animation = `shrink ${duration}ms linear forwards`;
        progressBar.style.transformOrigin = 'left';
        progressBar.style.transform = 'scaleX(1)';
        
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                dismissNotification(notification);
            }
        }, duration);
    } else {
        progressBar.style.display = 'none';
    }
    
    // Return the notification for potential manipulation
    return notification;
}

/**
 * Dismiss a notification with animation
 * @param {HTMLElement} notification - The notification element to dismiss
 */
function dismissNotification(notification) {
    notification.style.animation = 'fade-out 0.3s ease-out forwards';
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notificationContainer.removeChild(notification);
        }
    }, 300);
}

/**
 * Show a success notification
 * @param {string} message - The message to display
 * @param {number} duration - Time in ms before auto-dismiss
 * @returns {HTMLElement} The notification element
 */
function showSuccess(message, duration = 5000) {
    return showNotification(message, 'success', duration);
}

/**
 * Show an error notification
 * @param {string} message - The message to display
 * @param {number} duration - Time in ms before auto-dismiss (0 for no auto-dismiss)
 * @returns {HTMLElement} The notification element
 */
function showError(message, duration = 0) {
    return showNotification(message, 'error', duration);
}

/**
 * Show an info notification
 * @param {string} message - The message to display
 * @param {number} duration - Time in ms before auto-dismiss
 * @returns {HTMLElement} The notification element
 */
function showInfo(message, duration = 5000) {
    return showNotification(message, 'info', duration);
}

/**
 * Show a warning notification
 * @param {string} message - The message to display
 * @param {number} duration - Time in ms before auto-dismiss
 * @returns {HTMLElement} The notification element
 */
function showWarning(message, duration = 7000) {
    return showNotification(message, 'warning', duration);
}

// API for usage in other JS files
window.Notifications = {
    show: showNotification,
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    dismiss: dismissNotification,
    init: initNotifications
};