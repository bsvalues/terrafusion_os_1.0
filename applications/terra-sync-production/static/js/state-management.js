/**
 * Terrafusion Platform - State Management
 * 
 * This module provides consistent state management functionality
 * to track and persist application state across page transitions.
 */

// Initialize the state management 
const TerraFusionState = (function() {
  // State storage object
  let _state = {};
  
  // Event listeners for state changes
  const _listeners = {};
  
  // Load state from localStorage if available
  function _init() {
    try {
      const savedState = localStorage.getItem('terraFusionState');
      if (savedState) {
        _state = JSON.parse(savedState);
      }
    } catch (e) {
      console.error('Error loading state from localStorage', e);
    }
    
    // Set up storage event listener for cross-tab synchronization
    window.addEventListener('storage', (event) => {
      if (event.key === 'terraFusionState') {
        try {
          const newState = JSON.parse(event.newValue);
          _updateState(newState);
        } catch (e) {
          console.error('Error parsing state from storage event', e);
        }
      }
    });
  }
  
  // Save state to localStorage
  function _saveState() {
    try {
      localStorage.setItem('terraFusionState', JSON.stringify(_state));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }
  
  // Update state and notify listeners
  function _updateState(newState) {
    const oldState = { ..._state };
    _state = { ..._state, ...newState };
    
    // Notify listeners of changed properties
    for (const key in newState) {
      if (newState[key] !== oldState[key] && _listeners[key]) {
        _listeners[key].forEach(callback => {
          try {
            callback(_state[key], oldState[key]);
          } catch (e) {
            console.error(`Error in state listener for ${key}`, e);
          }
        });
      }
    }
    
    // Save updated state
    _saveState();
  }
  
  // Public API
  return {
    // Initialize state management
    init: function() {
      _init();
      return this;
    },
    
    // Set state value
    set: function(key, value) {
      const newState = {};
      newState[key] = value;
      _updateState(newState);
      return this;
    },
    
    // Set multiple state values
    setMultiple: function(stateUpdate) {
      _updateState(stateUpdate);
      return this;
    },
    
    // Get state value
    get: function(key) {
      return _state[key];
    },
    
    // Get entire state object
    getAll: function() {
      return { ..._state };
    },
    
    // Remove state value
    remove: function(key) {
      if (key in _state) {
        const newState = { ..._state };
        delete newState[key];
        _state = newState;
        _saveState();
        
        // Notify listeners
        if (_listeners[key]) {
          _listeners[key].forEach(callback => {
            try {
              callback(undefined, _state[key]);
            } catch (e) {
              console.error(`Error in state listener for ${key}`, e);
            }
          });
        }
      }
      return this;
    },
    
    // Clear all state
    clear: function() {
      const oldState = { ..._state };
      _state = {};
      _saveState();
      
      // Notify all listeners
      for (const key in oldState) {
        if (_listeners[key]) {
          _listeners[key].forEach(callback => {
            try {
              callback(undefined, oldState[key]);
            } catch (e) {
              console.error(`Error in state listener for ${key}`, e);
            }
          });
        }
      }
      return this;
    },
    
    // Subscribe to state changes
    subscribe: function(key, callback) {
      if (!_listeners[key]) {
        _listeners[key] = [];
      }
      _listeners[key].push(callback);
      return this;
    },
    
    // Unsubscribe from state changes
    unsubscribe: function(key, callback) {
      if (_listeners[key]) {
        _listeners[key] = _listeners[key].filter(cb => cb !== callback);
      }
      return this;
    },
    
    // Save form state
    saveFormState: function(formId, data = null) {
      const form = document.getElementById(formId);
      if (!form) return this;
      
      const formData = data || {};
      
      // If no data provided, collect from form
      if (!data) {
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.name) {
            if (element.type === 'checkbox' || element.type === 'radio') {
              if (element.checked) {
                formData[element.name] = element.value;
              }
            } else if (element.type !== 'button' && element.type !== 'submit') {
              formData[element.name] = element.value;
            }
          }
        }
      }
      
      this.set(`form_${formId}`, formData);
      return formData;
    },
    
    // Load form state
    loadFormState: function(formId) {
      const formData = this.get(`form_${formId}`);
      if (!formData) return null;
      
      const form = document.getElementById(formId);
      if (!form) return formData;
      
      // Populate form with saved data
      const elements = form.elements;
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.name && formData[element.name] !== undefined) {
          if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = (element.value === formData[element.name]);
          } else if (element.type !== 'button' && element.type !== 'submit') {
            element.value = formData[element.name];
          }
        }
      }
      
      return formData;
    },
    
    // Clear form state
    clearFormState: function(formId) {
      return this.remove(`form_${formId}`);
    },
    
    // Track user flow
    trackUserFlow: function(pageName) {
      let flowHistory = this.get('userFlowHistory') || [];
      
      // Add current page to history
      flowHistory.push({
        page: pageName,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 10 pages in history
      if (flowHistory.length > 10) {
        flowHistory = flowHistory.slice(flowHistory.length - 10);
      }
      
      this.set('userFlowHistory', flowHistory);
      this.set('currentPage', pageName);
      
      return flowHistory;
    },
    
    // Get user flow history
    getUserFlowHistory: function() {
      return this.get('userFlowHistory') || [];
    }
  };
})();

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the state management
  TerraFusionState.init();
  
  // Track current page
  const currentPage = document.body.getAttribute('data-page');
  if (currentPage) {
    TerraFusionState.trackUserFlow(currentPage);
  }
  
  // Auto-load any forms with the data-autoload attribute
  document.querySelectorAll('form[data-autoload="true"]').forEach(form => {
    TerraFusionState.loadFormState(form.id);
  });
  
  // Auto-save forms with the data-autosave attribute
  document.querySelectorAll('form[data-autosave="true"]').forEach(form => {
    const formElements = form.elements;
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      if (element.name) {
        element.addEventListener('change', () => {
          TerraFusionState.saveFormState(form.id);
        });
      }
    }
  });
});

// Export state management to global namespace
window.Terrafusion = window.Terrafusion || {};
window.Terrafusion.state = TerraFusionState;