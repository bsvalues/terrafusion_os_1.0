/**
 * Terrafusion Data State Manager
 * Provides a consistent approach to managing and displaying data states across the application
 */

class DataStateManager {
  constructor() {
    this.containers = new Map();
    this.defaultOptions = {
      states: {
        // Initial state - waiting for data to be loaded
        initial: {
          icon: 'fas fa-database',
          title: 'Ready',
          message: 'Data ready to be loaded',
          showInToolbar: false
        },
        // Loading state - data is being fetched or processed
        loading: {
          icon: 'fas fa-spinner fa-spin',
          title: 'Loading',
          message: 'Loading data...',
          showInToolbar: true
        },
        // Empty state - no data available
        empty: {
          icon: 'fas fa-inbox',
          title: 'No Data',
          message: 'No data is available',
          showInToolbar: true,
          actionLabel: 'Refresh',
          actionIcon: 'fas fa-sync-alt'
        },
        // Error state - an error occurred
        error: {
          icon: 'fas fa-exclamation-circle',
          title: 'Error',
          message: 'An error occurred while loading data',
          showInToolbar: true,
          actionLabel: 'Try Again',
          actionIcon: 'fas fa-sync-alt'
        },
        // Success state - data loaded successfully
        success: {
          icon: 'fas fa-check-circle',
          title: 'Success',
          message: 'Data loaded successfully',
          showInToolbar: true
        },
        // Modified state - data has been modified but not saved
        modified: {
          icon: 'fas fa-edit',
          title: 'Modified',
          message: 'Data has been modified but not saved',
          showInToolbar: true,
          actionLabel: 'Save',
          actionIcon: 'fas fa-save'
        },
        // Saving state - data is being saved
        saving: {
          icon: 'fas fa-spinner fa-spin',
          title: 'Saving',
          message: 'Saving data...',
          showInToolbar: true
        },
        // Syncing state - data is being synchronized with server
        syncing: {
          icon: 'fas fa-sync fa-spin',
          title: 'Syncing',
          message: 'Syncing data with server...',
          showInToolbar: true
        },
        // Offline state - data is being used in offline mode
        offline: {
          icon: 'fas fa-wifi-slash',
          title: 'Offline',
          message: 'Working in offline mode',
          showInToolbar: true,
          actionLabel: 'Reconnect',
          actionIcon: 'fas fa-wifi'
        },
        // Stale state - data may be outdated
        stale: {
          icon: 'fas fa-clock',
          title: 'Stale Data',
          message: 'This data may be outdated',
          showInToolbar: true,
          actionLabel: 'Refresh',
          actionIcon: 'fas fa-sync-alt'
        },
        // Filtered state - data is being filtered
        filtered: {
          icon: 'fas fa-filter',
          title: 'Filtered',
          message: 'Data is being filtered',
          showInToolbar: true,
          actionLabel: 'Clear Filters',
          actionIcon: 'fas fa-times'
        },
        // Partial state - only partial data is loaded
        partial: {
          icon: 'fas fa-exclamation-triangle',
          title: 'Partial Data',
          message: 'Only partial data is available',
          showInToolbar: true,
          actionLabel: 'Load More',
          actionIcon: 'fas fa-download'
        }
      },
      // Default transitions between states
      transitions: {
        initial: ['loading', 'error', 'offline'],
        loading: ['success', 'error', 'empty', 'partial', 'offline'],
        success: ['loading', 'modified', 'stale', 'filtered', 'offline'],
        error: ['loading', 'offline'],
        empty: ['loading', 'offline'],
        modified: ['saving', 'success', 'error', 'offline'],
        saving: ['success', 'error', 'offline'],
        syncing: ['success', 'error', 'offline', 'partial'],
        offline: ['loading', 'syncing'],
        stale: ['loading', 'offline'],
        filtered: ['loading', 'success', 'offline'],
        partial: ['loading', 'success', 'offline']
      },
      // Default display options
      stateDisplayOptions: {
        showToolbar: true,
        showPlaceholder: true,
        toolbarPosition: 'top', // top, bottom, left, right
        toolbarStyle: 'standard', // standard, minimal, pill
        animateTransitions: true,
        announceStateChanges: true
      }
    };
  }

  /**
   * Register a container for data state management
   * @param {string} containerId - The ID of the container to manage
   * @param {object} options - Configuration options
   * @param {object} options.states - Custom state definitions
   * @param {object} options.transitions - Custom state transitions
   * @param {object} options.stateDisplayOptions - Custom display options
   * @param {object} options.callbacks - Callback functions for state changes and actions
   * @returns {object} - The manager interface for this container
   */
  register(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID ${containerId} not found`);
      return null;
    }

    // Merge default and custom options
    const mergedOptions = this.mergeOptions(this.defaultOptions, options);
    
    // Set up container
    this.setupContainer(container, mergedOptions);
    
    // Store container info
    const containerInfo = {
      element: container,
      options: mergedOptions,
      currentState: 'initial',
      data: null,
      toolbar: null,
      placeholder: null,
      contentArea: null
    };
    
    this.containers.set(containerId, containerInfo);
    
    // Create control interface for this container
    const managerInterface = this.createManagerInterface(containerId);
    
    // Set initial state
    this.setState(containerId, 'initial');
    
    return managerInterface;
  }

  /**
   * Merge default options with custom options
   * @param {object} defaults - Default options
   * @param {object} custom - Custom options
   * @returns {object} - Merged options
   */
  mergeOptions(defaults, custom) {
    // Start with a deep copy of defaults
    const result = JSON.parse(JSON.stringify(defaults));
    
    // Merge states
    if (custom.states) {
      for (const [state, config] of Object.entries(custom.states)) {
        if (result.states[state]) {
          // Merge with existing state
          result.states[state] = { ...result.states[state], ...config };
        } else {
          // Add new state
          result.states[state] = config;
        }
      }
    }
    
    // Merge transitions
    if (custom.transitions) {
      for (const [state, transitions] of Object.entries(custom.transitions)) {
        if (result.transitions[state]) {
          // Merge with existing transitions
          result.transitions[state] = [...new Set([...result.transitions[state], ...transitions])];
        } else {
          // Add new transitions
          result.transitions[state] = transitions;
        }
      }
    }
    
    // Merge display options
    if (custom.stateDisplayOptions) {
      result.stateDisplayOptions = { ...result.stateDisplayOptions, ...custom.stateDisplayOptions };
    }
    
    // Add callbacks
    result.callbacks = custom.callbacks || {};
    
    return result;
  }

  /**
   * Set up the container with toolbar and placeholder
   * @param {HTMLElement} container - The container element
   * @param {object} options - Configuration options
   */
  setupContainer(container, options) {
    // Add container class
    container.classList.add('tf-data-state-container');
    
    // Get or create content area
    let contentArea = container.querySelector('.tf-data-content');
    if (!contentArea) {
      // Move all existing content to a content area div
      contentArea = document.createElement('div');
      contentArea.className = 'tf-data-content';
      
      // Move all children to content area
      while (container.firstChild) {
        contentArea.appendChild(container.firstChild);
      }
      
      container.appendChild(contentArea);
    }
    
    // Create toolbar if enabled
    if (options.stateDisplayOptions.showToolbar) {
      const toolbar = document.createElement('div');
      toolbar.className = `tf-data-toolbar tf-toolbar-${options.stateDisplayOptions.toolbarPosition} tf-toolbar-${options.stateDisplayOptions.toolbarStyle}`;
      toolbar.setAttribute('role', 'status');
      toolbar.setAttribute('aria-live', 'polite');
      
      // Add toolbar before or after content based on position
      if (options.stateDisplayOptions.toolbarPosition === 'top' || options.stateDisplayOptions.toolbarPosition === 'left') {
        container.insertBefore(toolbar, contentArea);
      } else {
        container.appendChild(toolbar);
      }
    }
    
    // Create placeholder if enabled
    if (options.stateDisplayOptions.showPlaceholder) {
      const placeholder = document.createElement('div');
      placeholder.className = 'tf-data-placeholder';
      placeholder.style.display = 'none';
      
      container.appendChild(placeholder);
    }
  }

  /**
   * Create an interface for managing a specific container
   * @param {string} containerId - The ID of the container
   * @returns {object} - The manager interface
   */
  createManagerInterface(containerId) {
    return {
      setState: (state, data = null) => this.setState(containerId, state, data),
      getState: () => this.getState(containerId),
      getData: () => this.getData(containerId),
      setData: (data) => this.setData(containerId, data),
      isValidTransition: (toState) => this.isValidTransition(containerId, toState),
      getValidTransitions: () => this.getValidTransitions(containerId),
      reset: () => this.resetContainer(containerId),
      startLoading: (message) => {
        this.setState(containerId, 'loading', { message });
        return this.createLoadingPromise(containerId);
      }
    };
  }

  /**
   * Set the state of a container
   * @param {string} containerId - The ID of the container
   * @param {string} state - The state to set
   * @param {any} data - Data associated with the state
   * @returns {boolean} - True if state was set, false otherwise
   */
  setState(containerId, state, data = null) {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      console.error(`Container with ID ${containerId} not registered`);
      return false;
    }
    
    // Check if state is valid
    if (!containerInfo.options.states[state]) {
      console.error(`Invalid state: ${state}`);
      return false;
    }
    
    // Check if transition is valid
    if (containerInfo.currentState !== state && 
        !this.isValidTransition(containerId, state)) {
      console.warn(`Invalid state transition: ${containerInfo.currentState} -> ${state}`);
      // Still allow the transition in production for robustness
    }
    
    const prevState = containerInfo.currentState;
    containerInfo.currentState = state;
    
    // Update data if provided
    if (data !== null) {
      containerInfo.data = data;
    }
    
    // Update UI
    this.updateContainerUI(containerId);
    
    // Call state change callback if provided
    if (containerInfo.options.callbacks && 
        typeof containerInfo.options.callbacks.onStateChange === 'function') {
      containerInfo.options.callbacks.onStateChange(state, prevState, containerInfo.data);
    }
    
    // Announce state change if enabled
    if (containerInfo.options.stateDisplayOptions.announceStateChanges &&
        window.terraFusionNotifications) {
      const stateConfig = containerInfo.options.states[state];
      const message = typeof data === 'string' ? data : stateConfig.message;
      window.terraFusionNotifications.announce(`${stateConfig.title}: ${message}`);
    }
    
    return true;
  }

  /**
   * Get the current state of a container
   * @param {string} containerId - The ID of the container
   * @returns {string|null} - The current state, or null if container not found
   */
  getState(containerId) {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      console.error(`Container with ID ${containerId} not registered`);
      return null;
    }
    
    return containerInfo.currentState;
  }

  /**
   * Get the data associated with a container
   * @param {string} containerId - The ID of the container
   * @returns {any} - The data, or null if container not found
   */
  getData(containerId) {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      console.error(`Container with ID ${containerId} not registered`);
      return null;
    }
    
    return containerInfo.data;
  }

  /**
   * Set the data associated with a container
   * @param {string} containerId - The ID of the container
   * @param {any} data - The data to set
   * @returns {boolean} - True if data was set, false otherwise
   */
  setData(containerId, data) {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      console.error(`Container with ID ${containerId} not registered`);
      return false;
    }
    
    containerInfo.data = data;
    return true;
  }

  /**
   * Check if a transition to a state is valid
   * @param {string} containerId - The ID of the container
   * @param {string} toState - The state to transition to
   * @returns {boolean} - True if transition is valid, false otherwise
   */
  isValidTransition(containerId, toState) {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      console.error(`Container with ID ${containerId} not registered`);
      return false;
    }
    
    const fromState = containerInfo.currentState;
    const validTransitions = containerInfo.options.transitions[fromState];
    
    return validTransitions && validTransitions.includes(toState);
  }

  /**
   * Get valid transitions from the current state
   * @param {string} containerId - The ID of the container
   * @returns {string[]} - Array of valid states to transition to
   */
  getValidTransitions(containerId) {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      console.error(`Container with ID ${containerId} not registered`);
      return [];
    }
    
    const fromState = containerInfo.currentState;
    return containerInfo.options.transitions[fromState] || [];
  }

  /**
   * Update the UI of a container based on its current state
   * @param {string} containerId - The ID of the container
   */
  updateContainerUI(containerId) {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) return;
    
    const container = containerInfo.element;
    const state = containerInfo.currentState;
    const stateConfig = containerInfo.options.states[state];
    
    // Update container classes
    container.classList.remove(...Object.keys(containerInfo.options.states).map(s => `tf-state-${s}`));
    container.classList.add(`tf-state-${state}`);
    
    // Update toolbar if it exists
    if (containerInfo.options.stateDisplayOptions.showToolbar) {
      const toolbar = container.querySelector('.tf-data-toolbar');
      if (toolbar) {
        // Show or hide toolbar based on state config
        if (stateConfig.showInToolbar) {
          toolbar.style.display = '';
          
          // Get message from data or config
          const message = (typeof containerInfo.data === 'string') ? 
            containerInfo.data : stateConfig.message;
          
          // Create toolbar content
          const toolbarHtml = `
            <div class="tf-toolbar-content">
              <div class="tf-toolbar-icon"><i class="${stateConfig.icon}"></i></div>
              <div class="tf-toolbar-info">
                <div class="tf-toolbar-title">${stateConfig.title}</div>
                <div class="tf-toolbar-message">${message}</div>
              </div>
              ${stateConfig.actionLabel ? `
                <div class="tf-toolbar-actions">
                  <button type="button" class="tf-action-button" data-action="${state}-action">
                    <i class="${stateConfig.actionIcon}"></i> ${stateConfig.actionLabel}
                  </button>
                </div>
              ` : ''}
            </div>
          `;
          
          toolbar.innerHTML = toolbarHtml;
          
          // Set up action button if it exists
          const actionButton = toolbar.querySelector('.tf-action-button');
          if (actionButton && containerInfo.options.callbacks && 
              typeof containerInfo.options.callbacks.onAction === 'function') {
            actionButton.addEventListener('click', () => {
              containerInfo.options.callbacks.onAction(state, containerInfo.data);
            });
          }
        } else {
          toolbar.style.display = 'none';
        }
      }
    }
    
    // Update placeholder if it exists
    if (containerInfo.options.stateDisplayOptions.showPlaceholder) {
      const placeholder = container.querySelector('.tf-data-placeholder');
      const contentArea = container.querySelector('.tf-data-content');
      
      // Only show placeholder for certain states
      const placeholderStates = ['loading', 'empty', 'error'];
      if (placeholder && contentArea && placeholderStates.includes(state)) {
        placeholder.style.display = '';
        contentArea.style.display = 'none';
        
        // Get message from data or config
        const message = (typeof containerInfo.data === 'string') ? 
          containerInfo.data : stateConfig.message;
        
        // Create placeholder content
        const placeholderHtml = `
          <div class="tf-placeholder-content">
            <div class="tf-placeholder-icon">
              <i class="${stateConfig.icon}"></i>
            </div>
            <div class="tf-placeholder-title">${stateConfig.title}</div>
            <div class="tf-placeholder-message">${message}</div>
            ${stateConfig.actionLabel ? `
              <div class="tf-placeholder-actions">
                <button type="button" class="btn btn-primary tf-action-button" data-action="${state}-action">
                  <i class="${stateConfig.actionIcon}"></i> ${stateConfig.actionLabel}
                </button>
              </div>
            ` : ''}
          </div>
        `;
        
        placeholder.innerHTML = placeholderHtml;
        
        // Set up action button if it exists
        const actionButton = placeholder.querySelector('.tf-action-button');
        if (actionButton && containerInfo.options.callbacks && 
            typeof containerInfo.options.callbacks.onAction === 'function') {
          actionButton.addEventListener('click', () => {
            containerInfo.options.callbacks.onAction(state, containerInfo.data);
          });
        }
      } else if (placeholder && contentArea) {
        placeholder.style.display = 'none';
        contentArea.style.display = '';
      }
    }
  }

  /**
   * Reset a container to its initial state
   * @param {string} containerId - The ID of the container
   * @returns {boolean} - True if container was reset, false otherwise
   */
  resetContainer(containerId) {
    return this.setState(containerId, 'initial', null);
  }

  /**
   * Create a loading promise that resolves when loading is complete
   * @param {string} containerId - The ID of the container
   * @returns {Promise} - A promise that resolves when data is loaded
   */
  createLoadingPromise(containerId) {
    return {
      success: (data = null) => {
        // If data is empty array or empty object, set to empty state
        if (Array.isArray(data) && data.length === 0) {
          this.setState(containerId, 'empty');
        } else if (data !== null && typeof data === 'object' && Object.keys(data).length === 0) {
          this.setState(containerId, 'empty');
        } else {
          this.setState(containerId, 'success', data);
        }
        return data;
      },
      error: (error) => {
        this.setState(containerId, 'error', error.message || 'Error loading data');
        throw error;
      },
      partial: (data) => {
        this.setState(containerId, 'partial', data);
        return data;
      }
    };
  }
  
  /**
   * Connect to a form to automatically manage its data state
   * @param {string} formId - The ID of the form to connect
   * @param {string} containerId - The ID of the container to manage
   * @param {object} options - Configuration options
   * @returns {object} - The form manager interface
   */
  connectToForm(formId, containerId, options = {}) {
    const form = document.getElementById(formId);
    if (!form) {
      console.error(`Form with ID ${formId} not found`);
      return null;
    }
    
    const containerManager = this.containers.get(containerId);
    if (!containerManager) {
      console.error(`Container with ID ${containerId} not registered`);
      return null;
    }
    
    // Set up form change detection
    const initialFormData = new FormData(form);
    const initialFormObject = Object.fromEntries(initialFormData.entries());
    
    // Track form changes
    form.addEventListener('input', () => {
      const currentFormData = new FormData(form);
      const currentFormObject = Object.fromEntries(currentFormData.entries());
      
      // Check if form data changed
      const formChanged = JSON.stringify(initialFormObject) !== JSON.stringify(currentFormObject);
      
      // Update state if changed
      if (formChanged && this.getState(containerId) === 'success') {
        this.setState(containerId, 'modified', 'Form data has been modified');
      } else if (!formChanged && this.getState(containerId) === 'modified') {
        this.setState(containerId, 'success');
      }
    });
    
    // Handle form submission
    form.addEventListener('submit', (event) => {
      // Prevent default form submission if requested
      if (options.preventDefault !== false) {
        event.preventDefault();
      }
      
      // Set saving state
      this.setState(containerId, 'saving', 'Saving form data...');
      
      // Call custom submit handler if provided
      if (options.onSubmit && typeof options.onSubmit === 'function') {
        try {
          const formData = new FormData(form);
          const result = options.onSubmit(formData, form);
          
          // Handle promises
          if (result instanceof Promise) {
            result
              .then((data) => {
                this.setState(containerId, 'success', data || 'Form submitted successfully');
              })
              .catch((error) => {
                this.setState(containerId, 'error', error.message || 'Error submitting form');
              });
          } else {
            // Handle synchronous result
            this.setState(containerId, 'success', result || 'Form submitted successfully');
          }
        } catch (error) {
          this.setState(containerId, 'error', error.message || 'Error submitting form');
        }
      } else if (options.preventDefault === false) {
        // Let the form submit naturally
        this.setState(containerId, 'success', 'Form submitted successfully');
      }
    });
    
    return {
      reset: () => {
        form.reset();
        this.setState(containerId, 'success');
      },
      markModified: () => {
        this.setState(containerId, 'modified', 'Form data has been modified');
      },
      markSaving: () => {
        this.setState(containerId, 'saving', 'Saving form data...');
      },
      markSuccess: (message) => {
        this.setState(containerId, 'success', message || 'Form submitted successfully');
      },
      markError: (message) => {
        this.setState(containerId, 'error', message || 'Error submitting form');
      }
    };
  }
  
  /**
   * Connect to a table to automatically manage its data state
   * @param {string} tableId - The ID of the table to connect
   * @param {string} containerId - The ID of the container to manage
   * @param {object} options - Configuration options
   * @returns {object} - The table manager interface
   */
  connectToTable(tableId, containerId, options = {}) {
    const table = document.getElementById(tableId);
    if (!table) {
      console.error(`Table with ID ${tableId} not found`);
      return null;
    }
    
    const containerManager = this.containers.get(containerId);
    if (!containerManager) {
      console.error(`Container with ID ${containerId} not registered`);
      return null;
    }
    
    // Create manager interface
    const tableManager = {
      loadData: (dataPromise) => {
        this.setState(containerId, 'loading', 'Loading table data...');
        
        return dataPromise
          .then((data) => {
            if (Array.isArray(data) && data.length === 0) {
              this.setState(containerId, 'empty', 'No data available');
            } else {
              this.setState(containerId, 'success', data);
              this.updateTable(tableId, data, options);
            }
            return data;
          })
          .catch((error) => {
            this.setState(containerId, 'error', error.message || 'Error loading table data');
            throw error;
          });
      },
      setFiltered: (filters) => {
        const currentData = this.getData(containerId);
        const filterDescription = typeof filters === 'string' 
          ? filters 
          : `${Object.keys(filters).length} filters applied`;
        
        this.setState(containerId, 'filtered', filterDescription);
        return currentData;
      },
      clearFilters: () => {
        this.setState(containerId, 'success');
      },
      refresh: (dataPromise) => {
        return tableManager.loadData(dataPromise);
      }
    };
    
    return tableManager;
  }
  
  /**
   * Update a table with data
   * @param {string} tableId - The ID of the table to update
   * @param {Array} data - The data to display in the table
   * @param {object} options - Configuration options
   */
  updateTable(tableId, data, options = {}) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    // Get table body or create one if it doesn't exist
    let tbody = table.querySelector('tbody');
    if (!tbody) {
      tbody = document.createElement('tbody');
      table.appendChild(tbody);
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add rows
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const row = document.createElement('tr');
        
        // If options.columns is provided, use it to determine which columns to show
        if (options.columns && Array.isArray(options.columns)) {
          options.columns.forEach((column) => {
            const cell = document.createElement('td');
            
            // Handle column.render function
            if (column.render && typeof column.render === 'function') {
              cell.innerHTML = column.render(item[column.key], item);
            } else {
              cell.textContent = item[column.key] || '';
            }
            
            if (column.className) {
              cell.className = column.className;
            }
            
            row.appendChild(cell);
          });
        } else {
          // Otherwise, create a cell for each property
          for (const key in item) {
            const cell = document.createElement('td');
            cell.textContent = item[key] || '';
            row.appendChild(cell);
          }
        }
        
        tbody.appendChild(row);
      });
    }
  }
}

// Create global instance
const terraFusionDataStates = new DataStateManager();

// Add to window for global access
window.terraFusionDataStates = terraFusionDataStates;