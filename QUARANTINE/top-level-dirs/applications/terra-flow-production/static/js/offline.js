/**
 * GeoAssessmentPro Offline Support
 * Handles service worker registration and offline functionality
 */

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/js/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Check for updates to the service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Service Worker update found!');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateNotification();
            }
          });
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
      
    // When the service worker takes control (after update)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
    });
  });
}

// Offline status detection
function setupOfflineDetection() {
  // Initial check
  updateOnlineStatus();
  
  // Add event listeners for online/offline events
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Add the offline indicator to the DOM if it doesn't exist
  if (!document.querySelector('.offline-indicator')) {
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.textContent = 'You are offline. Some features may be limited.';
    document.body.prepend(offlineIndicator);
  }
}

// Update UI based on online status
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  document.body.classList.toggle('offline', !isOnline);
  
  // Update syncing status for assessments in field mode
  if (isOnline && document.body.classList.contains('field-assessment-mode')) {
    requestBackgroundSync();
  }
  
  // Dispatch custom event for components to react to offline status
  const event = new CustomEvent('connectionStatusChanged', { 
    detail: { online: isOnline } 
  });
  document.dispatchEvent(event);
}

// Request background sync for offline data
function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(registration => {
        // Register sync for assessments
        registration.sync.register('sync-assessments')
          .then(() => console.log('Assessment sync registered'))
          .catch(err => console.error('Assessment sync registration failed:', err));
          
        // Register sync for inspections
        registration.sync.register('sync-inspections')
          .then(() => console.log('Inspection sync registered'))
          .catch(err => console.error('Inspection sync registration failed:', err));
      });
  }
}

// Store assessment data for offline use
function storeAssessmentOffline(assessmentData) {
  if (!('indexedDB' in window)) {
    console.error('IndexedDB not supported');
    return Promise.reject(new Error('IndexedDB not supported'));
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GeoAssessmentProOffline', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingAssessments')) {
        db.createObjectStore('pendingAssessments', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingAssessments'], 'readwrite');
      const store = transaction.objectStore('pendingAssessments');
      
      // Generate a unique ID for the assessment
      const offlineAssessment = {
        id: new Date().toISOString() + '-' + Math.random().toString(36).substr(2, 9),
        data: assessmentData,
        timestamp: new Date().toISOString()
      };
      
      const addRequest = store.add(offlineAssessment);
      
      addRequest.onsuccess = () => {
        console.log('Assessment stored for offline sync');
        
        // Show notification to user
        showNotification('Assessment Saved', 'Assessment saved for offline sync. It will be submitted when you go online.');
        
        resolve();
      };
      
      addRequest.onerror = () => {
        console.error('Error storing assessment offline:', addRequest.error);
        reject(addRequest.error);
      };
    };
    
    request.onerror = event => {
      console.error('Error opening IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get pending assessments that haven't been synced
function getPendingAssessments() {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GeoAssessmentProOffline', 1);
    
    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingAssessments'], 'readonly');
      const store = transaction.objectStore('pendingAssessments');
      
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}

// Show notification to users
function showNotification(title, message) {
  // Create notification element
  const notificationContainer = document.createElement('div');
  notificationContainer.className = 'offline-notification';
  notificationContainer.innerHTML = `
    <div class="offline-notification-content">
      <strong>${title}</strong>
      <p>${message}</p>
    </div>
    <button class="offline-notification-close">×</button>
  `;
  
  // Add to document
  document.body.appendChild(notificationContainer);
  
  // Show with animation
  setTimeout(() => {
    notificationContainer.classList.add('show');
  }, 10);
  
  // Setup close button
  const closeButton = notificationContainer.querySelector('.offline-notification-close');
  closeButton.addEventListener('click', () => {
    notificationContainer.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notificationContainer);
    }, 300);
  });
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notificationContainer)) {
      notificationContainer.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notificationContainer)) {
          document.body.removeChild(notificationContainer);
        }
      }, 300);
    }
  }, 5000);
}

// Show update notification
function showUpdateNotification() {
  const updateContainer = document.createElement('div');
  updateContainer.className = 'update-notification';
  updateContainer.innerHTML = `
    <div class="update-notification-content">
      <strong>Update Available</strong>
      <p>A new version of GeoAssessmentPro is available. Click to update.</p>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(updateContainer);
  
  // Show with animation
  setTimeout(() => {
    updateContainer.classList.add('show');
  }, 10);
  
  // Reload on click
  updateContainer.addEventListener('click', () => {
    window.location.reload();
  });
}

// Initialize offline functionality
document.addEventListener('DOMContentLoaded', setupOfflineDetection);

// Export functions for use in other scripts
window.offlineSupport = {
  storeAssessmentOffline,
  getPendingAssessments,
  requestBackgroundSync,
  isOnline: () => navigator.onLine
};