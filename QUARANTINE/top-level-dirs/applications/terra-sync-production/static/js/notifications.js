/**
 * Terrafusion Platform - Notification System
 * 
 * This module provides a standardized way to show notifications
 * throughout the application, ensuring consistent user feedback.
 */

// Toast notification container
let toastContainer;

// Initialize the notification system
function initNotifications() {
  // Create toast container if it doesn't exist
  if (!document.querySelector('.tf-toast-container')) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'tf-toast-container';
    document.body.appendChild(toastContainer);
  } else {
    toastContainer = document.querySelector('.tf-toast-container');
  }
}

// Show a toast notification
function showNotification(title, message, type = 'info', duration = 5000) {
  // Initialize if not already done
  if (!toastContainer) {
    initNotifications();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'tf-toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Set background color based on type
  let typeClass, typeIcon;
  switch (type) {
    case 'success':
      typeClass = 'border-left: 4px solid var(--success);';
      typeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>';
      break;
    case 'error':
      typeClass = 'border-left: 4px solid var(--danger);';
      typeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>';
      break;
    case 'warning':
      typeClass = 'border-left: 4px solid var(--warning);';
      typeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>';
      break;
    default: // info
      typeClass = 'border-left: 4px solid var(--info);';
      typeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle-fill" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>';
  }
  
  // Create toast content
  toast.innerHTML = `
    <div class="tf-toast-header" style="${typeClass}">
      <span style="color: ${type === 'warning' ? 'var(--gray-800)' : type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'}" class="me-2">${typeIcon}</span>
      <strong class="me-auto">${title}</strong>
      <small>${new Date().toLocaleTimeString()}</small>
      <button type="button" class="btn-close" aria-label="Close"></button>
    </div>
    <div class="tf-toast-body">
      ${message}
    </div>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Add click event to close button
  const closeButton = toast.querySelector('.btn-close');
  closeButton.addEventListener('click', () => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
  
  // Auto-close after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  return toast;
}

// Show success notification
function showSuccess(message, title = 'Success') {
  return showNotification(title, message, 'success');
}

// Show error notification
function showError(message, title = 'Error') {
  return showNotification(title, message, 'error');
}

// Show warning notification
function showWarning(message, title = 'Warning') {
  return showNotification(title, message, 'warning');
}

// Show info notification
function showInfo(message, title = 'Information') {
  return showNotification(title, message, 'info');
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initNotifications();
});

// Export notification functions
window.Terrafusion = window.Terrafusion || {};
window.Terrafusion.notifications = {
  show: showNotification,
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo
};