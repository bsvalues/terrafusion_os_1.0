/**
 * TerraFlow UI Component System
 * Core interactive components for the Terrafusion Platform
 */

class TerraFlowComponents {
  constructor() {
    this.components = {};
    this.eventListeners = {};
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => this.init());
  }
  
  /**
   * Initialize all components
   */
  init() {
    this.initializeDataCards();
    this.initializeFilterPanels();
    this.initializeStatusIndicators();
    this.initializeTooltips();
    this.registerComponentEvents();
  }
  
  /**
   * Initialize all data cards on the page
   */
  initializeDataCards() {
    const dataCards = document.querySelectorAll('.data-card');
    
    dataCards.forEach(card => {
      const cardId = card.id;
      if (!cardId) return;
      
      this.components[cardId] = {
        type: 'data-card',
        element: card,
        state: 'idle',
        data: null
      };
      
      // Auto-fetch data if URL is provided
      const fetchUrl = card.dataset.fetchUrl;
      if (fetchUrl) {
        this.fetchCardData(cardId, fetchUrl);
      }
      
      // Add refresh button functionality
      const refreshBtn = card.querySelector('.tf-card-refresh');
      if (refreshBtn && fetchUrl) {
        refreshBtn.addEventListener('click', () => {
          this.fetchCardData(cardId, fetchUrl, true);
        });
      }
    });
  }
  
  /**
   * Fetch data for a card from a provided URL
   * @param {string} cardId - The ID of the card to fetch data for
   * @param {string} url - The URL to fetch data from
   * @param {boolean} forceRefresh - Whether to force a refresh (bypass cache)
   */
  fetchCardData(cardId, url, forceRefresh = false) {
    const card = this.components[cardId];
    if (!card) return;
    
    // Update card state
    card.state = 'loading';
    this.updateCardState(cardId);
    
    // Add cache busting if forced refresh
    const fetchUrl = forceRefresh ? `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}` : url;
    
    // Fetch data
    fetch(fetchUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        card.data = data;
        card.state = data && Object.keys(data).length > 0 ? 'loaded' : 'empty';
        card.error = null;
        card.lastUpdated = new Date();
        
        this.updateCardState(cardId);
        this.updateCardContent(cardId);
        
        // Trigger card updated event
        this.triggerEvent('cardUpdated', {
          cardId,
          state: card.state,
          data: card.data
        });
      })
      .catch(error => {
        console.error(`Error fetching data for card ${cardId}:`, error);
        card.state = 'error';
        card.error = error.message;
        
        this.updateCardState(cardId);
        
        // Trigger card error event
        this.triggerEvent('cardError', {
          cardId,
          error: error.message
        });
      });
  }
  
  /**
   * Update the visual state of a card based on its data state
   * @param {string} cardId - The ID of the card to update
   */
  updateCardState(cardId) {
    const card = this.components[cardId];
    if (!card) return;
    
    const element = card.element;
    const dataContainer = element.querySelector('.data-container');
    const footer = element.querySelector('.tf-card-footer');
    
    // Clear previous states
    const loadingEl = element.querySelector('.loading-template')?.cloneNode(true);
    const errorEl = element.querySelector('.error-template')?.cloneNode(true);
    const emptyEl = element.querySelector('.empty-template')?.cloneNode(true);
    
    // Remove any existing state elements
    element.querySelectorAll('.tf-loading-indicator, .tf-error-content, .tf-empty-content')
      .forEach(el => el.remove());
    
    // Update based on current state
    switch (card.state) {
      case 'loading':
        if (loadingEl) {
          loadingEl.classList.remove('d-none');
          dataContainer.style.display = 'none';
          dataContainer.after(loadingEl);
        } else {
          // Use the dataFeedback utility if available
          if (window.dataFeedback) {
            window.dataFeedback.showLoading(cardId);
          }
        }
        
        if (footer) footer.classList.add('d-none');
        break;
        
      case 'error':
        if (errorEl) {
          errorEl.classList.remove('d-none');
          dataContainer.style.display = 'none';
          
          // Update error message if available
          if (card.error) {
            const errorMsg = errorEl.querySelector('.tf-error-message');
            if (errorMsg) errorMsg.textContent = card.error;
          }
          
          // Set up retry button
          const retryBtn = errorEl.querySelector('.tf-retry-button');
          if (retryBtn) {
            retryBtn.addEventListener('click', () => {
              const fetchUrl = element.dataset.fetchUrl;
              if (fetchUrl) {
                this.fetchCardData(cardId, fetchUrl, true);
              }
            });
          }
          
          dataContainer.after(errorEl);
        } else {
          // Use the dataFeedback utility if available
          if (window.dataFeedback) {
            window.dataFeedback.showError(cardId, {
              message: card.error || 'Error loading data',
              onRetry: () => {
                const fetchUrl = element.dataset.fetchUrl;
                if (fetchUrl) {
                  this.fetchCardData(cardId, fetchUrl, true);
                }
              }
            });
          }
        }
        
        if (footer) footer.classList.add('d-none');
        break;
        
      case 'empty':
        if (emptyEl) {
          emptyEl.classList.remove('d-none');
          dataContainer.style.display = 'none';
          dataContainer.after(emptyEl);
        } else {
          // Use the dataFeedback utility if available
          if (window.dataFeedback) {
            window.dataFeedback.showEmpty(cardId);
          }
        }
        
        if (footer) footer.classList.add('d-none');
        break;
        
      case 'loaded':
        // Show the data container and hide any state templates
        dataContainer.style.display = '';
        
        // Clear any feedback states if using dataFeedback
        if (window.dataFeedback) {
          window.dataFeedback.clearFeedback(cardId);
        }
        
        // Show footer with updated timestamp if available
        if (footer) {
          footer.classList.remove('d-none');
          
          // Update last updated timestamp
          const updatedAt = footer.querySelector('.tf-card-updated-at');
          if (updatedAt && card.lastUpdated) {
            updatedAt.textContent = `Updated: ${this.formatDateTime(card.lastUpdated)}`;
          }
        }
        break;
        
      default:
        // Default/idle state - just show the data container
        dataContainer.style.display = '';
        
        // Clear any feedback states if using dataFeedback
        if (window.dataFeedback) {
          window.dataFeedback.clearFeedback(cardId);
        }
        
        if (footer) footer.classList.add('d-none');
    }
  }
  
  /**
   * Update the content of a card with the loaded data
   * @param {string} cardId - The ID of the card to update
   */
  updateCardContent(cardId) {
    const card = this.components[cardId];
    if (!card || card.state !== 'loaded' || !card.data) return;
    
    // Get the template ID from the card if available
    const element = card.element;
    const templateId = element.dataset.templateId;
    
    if (templateId) {
      const template = document.getElementById(templateId);
      if (template && template.tagName === 'TEMPLATE') {
        this.renderTemplate(cardId, template, card.data);
        return;
      }
    }
    
    // If no template or template not found, trigger an event for custom handling
    this.triggerEvent('cardContentUpdate', {
      cardId,
      data: card.data
    });
  }
  
  /**
   * Render a template into a card
   * @param {string} cardId - The ID of the card to render into
   * @param {HTMLTemplateElement} template - The template to render
   * @param {object} data - The data to use for rendering
   */
  renderTemplate(cardId, template, data) {
    const card = this.components[cardId];
    if (!card) return;
    
    const dataContainer = card.element.querySelector('.data-container');
    if (!dataContainer) return;
    
    // Clone the template content
    const content = template.content.cloneNode(true);
    
    // Replace placeholders with data
    this.processTemplateNodes(content, data);
    
    // Clear and append the new content
    dataContainer.innerHTML = '';
    dataContainer.appendChild(content);
    
    // Initialize any components in the new content
    this.initializeComponentsInContainer(dataContainer);
  }
  
  /**
   * Process template nodes to replace placeholders with data
   * @param {DocumentFragment|Element} node - The node to process
   * @param {object} data - The data to use for replacement
   */
  processTemplateNodes(node, data) {
    // Process text nodes for {{placeholder}} patterns
    const processTextNode = (textNode, data) => {
      const text = textNode.nodeValue;
      const placeholderPattern = /{{([\w.]+)}}/g;
      let match;
      let newText = text;
      
      while ((match = placeholderPattern.exec(text)) !== null) {
        const placeholder = match[1];
        const value = this.getNestedValue(data, placeholder);
        
        if (value !== undefined) {
          newText = newText.replace(match[0], value);
        }
      }
      
      if (newText !== text) {
        textNode.nodeValue = newText;
      }
    };
    
    // Process element attributes for data-bind attributes
    const processElement = (element, data) => {
      // Process data-bind attributes
      if (element.hasAttribute('data-bind')) {
        const binding = element.getAttribute('data-bind');
        const value = this.getNestedValue(data, binding);
        
        if (value !== undefined) {
          element.textContent = value;
        }
      }
      
      // Process data-attr-* attributes (bind values to other attributes)
      Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('data-attr-'))
        .forEach(attr => {
          const targetAttr = attr.name.substring(10); // Remove "data-attr-" prefix
          const binding = attr.value;
          const value = this.getNestedValue(data, binding);
          
          if (value !== undefined) {
            element.setAttribute(targetAttr, value);
          }
        });
      
      // Process data-if attribute (conditional rendering)
      if (element.hasAttribute('data-if')) {
        const condition = element.getAttribute('data-if');
        const value = this.getNestedValue(data, condition);
        
        if (!value) {
          element.remove();
          return;
        }
      }
      
      // Process data-for attribute (list rendering)
      if (element.hasAttribute('data-for')) {
        const forAttr = element.getAttribute('data-for');
        const [itemName, collectionName] = forAttr.split(' in ').map(s => s.trim());
        const collection = this.getNestedValue(data, collectionName);
        
        if (Array.isArray(collection)) {
          const template = element.cloneNode(true);
          template.removeAttribute('data-for');
          
          // Clear original content
          element.textContent = '';
          
          // Create a new item for each item in the collection
          collection.forEach(item => {
            const newItem = template.cloneNode(true);
            
            // Create a new data context with the item
            const itemData = { 
              ...data,
              [itemName]: item 
            };
            
            // Process the new item with the item data
            this.processTemplateNodes(newItem, itemData);
            element.appendChild(newItem);
          });
        }
        
        return;
      }
      
      // Process child elements
      Array.from(element.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          processElement(child, data);
        } else if (child.nodeType === Node.TEXT_NODE) {
          processTextNode(child, data);
        }
      });
    };
    
    // Handle DocumentFragment or Element
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          processElement(child, data);
        } else if (child.nodeType === Node.TEXT_NODE) {
          processTextNode(child, data);
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      processElement(node, data);
    }
  }
  
  /**
   * Get a nested value from an object using dot notation
   * @param {object} obj - The object to get the value from
   * @param {string} path - The path to the value using dot notation
   * @returns {*} The value at the path or undefined if not found
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }
  
  /**
   * Initialize filter panels
   */
  initializeFilterPanels() {
    const filterPanels = document.querySelectorAll('.tf-filter-panel');
    
    filterPanels.forEach(panel => {
      const panelId = panel.id;
      if (!panelId) return;
      
      this.components[panelId] = {
        type: 'filter-panel',
        element: panel,
        state: 'idle',
        filters: {}
      };
      
      // Set up filter controls
      const applyBtn = panel.querySelector('.tf-filter-apply');
      const resetBtn = panel.querySelector('.tf-filter-reset');
      
      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          this.applyFilters(panelId);
        });
      }
      
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetFilters(panelId);
        });
      }
      
      // Set up mobile filter panel behavior
      if (window.innerWidth < 768) {
        const handle = document.createElement('div');
        handle.className = 'tf-filter-handle';
        panel.insertBefore(handle, panel.firstChild);
        
        // Add touch gestures
        let startY = 0;
        let currentTranslate = 0;
        
        handle.addEventListener('touchstart', (e) => {
          startY = e.touches[0].clientY;
          panel.style.transition = 'none';
        });
        
        handle.addEventListener('touchmove', (e) => {
          const currentY = e.touches[0].clientY;
          const diff = currentY - startY;
          
          // Only allow dragging down
          if (diff > 0) {
            currentTranslate = diff;
            panel.style.transform = `translateY(${diff}px)`;
          }
        });
        
        handle.addEventListener('touchend', () => {
          panel.style.transition = 'transform 0.3s ease';
          
          // If dragged more than 100px, close the panel
          if (currentTranslate > 100) {
            panel.classList.remove('open');
          } else {
            panel.style.transform = '';
          }
          
          currentTranslate = 0;
        });
      }
    });
  }
  
  /**
   * Apply filters from a filter panel
   * @param {string} panelId - The ID of the filter panel
   */
  applyFilters(panelId) {
    const panel = this.components[panelId];
    if (!panel) return;
    
    // Collect all filter values
    const filters = {};
    const filterInputs = panel.element.querySelectorAll('input, select');
    
    filterInputs.forEach(input => {
      const name = input.name;
      if (!name) return;
      
      // Different handling for different input types
      if (input.type === 'checkbox') {
        filters[name] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          filters[name] = input.value;
        }
      } else if (input.type === 'select-multiple') {
        filters[name] = Array.from(input.selectedOptions).map(opt => opt.value);
      } else {
        filters[name] = input.value;
      }
    });
    
    panel.filters = filters;
    
    // Trigger filter applied event
    this.triggerEvent('filtersApplied', {
      panelId,
      filters
    });
    
    // For mobile: close the panel after applying
    if (window.innerWidth < 768) {
      panel.element.classList.remove('open');
    }
  }
  
  /**
   * Reset filters in a filter panel
   * @param {string} panelId - The ID of the filter panel
   */
  resetFilters(panelId) {
    const panel = this.components[panelId];
    if (!panel) return;
    
    // Reset all filter inputs
    const filterInputs = panel.element.querySelectorAll('input, select');
    
    filterInputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = input.defaultChecked;
      } else if (input.type === 'select-one' || input.type === 'select-multiple') {
        Array.from(input.options).forEach(opt => {
          opt.selected = opt.defaultSelected;
        });
      } else {
        input.value = input.defaultValue;
      }
    });
    
    panel.filters = {};
    
    // Trigger filter reset event
    this.triggerEvent('filtersReset', {
      panelId
    });
  }
  
  /**
   * Initialize status indicators
   */
  initializeStatusIndicators() {
    // Enable tooltips for status indicators
    const statusIndicators = document.querySelectorAll('.tf-status-indicator[data-bs-toggle="tooltip"]');
    if (statusIndicators.length > 0 && typeof bootstrap !== 'undefined') {
      statusIndicators.forEach(indicator => {
        new bootstrap.Tooltip(indicator);
      });
    }
  }
  
  /**
   * Initialize all tooltips
   */
  initializeTooltips() {
    if (typeof bootstrap !== 'undefined') {
      const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
      });
    }
  }
  
  /**
   * Initialize components within a dynamically loaded container
   * @param {HTMLElement} container - The container element
   */
  initializeComponentsInContainer(container) {
    // Re-initialize tooltips
    if (typeof bootstrap !== 'undefined') {
      const tooltips = container.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
      });
    }
    
    // Initialize any cards
    const cards = container.querySelectorAll('.data-card');
    if (cards.length > 0) {
      this.initializeDataCards();
    }
    
    // Initialize any filter panels
    const panels = container.querySelectorAll('.tf-filter-panel');
    if (panels.length > 0) {
      this.initializeFilterPanels();
    }
  }
  
  /**
   * Register global component event listeners
   */
  registerComponentEvents() {
    // Register global filter button
    const filterToggleButtons = document.querySelectorAll('[data-action="toggle-filters"]');
    
    filterToggleButtons.forEach(button => {
      const targetId = button.dataset.target;
      if (!targetId) return;
      
      button.addEventListener('click', () => {
        const panel = document.getElementById(targetId);
        if (panel) {
          panel.classList.toggle('open');
        }
      });
    });
    
    // Register global map marker buttons
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action="show-on-map"]');
      if (!button) return;
      
      const lat = parseFloat(button.dataset.lat);
      const lng = parseFloat(button.dataset.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        this.triggerEvent('showOnMap', { lat, lng });
      }
    });
  }
  
  /**
   * Format a date and time for display
   * @param {Date} date - The date to format
   * @returns {string} The formatted date and time
   */
  formatDateTime(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Add an event listener for component events
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   */
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    
    this.eventListeners[event].push(callback);
  }
  
  /**
   * Remove an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function to remove
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners[event]) return;
    
    this.eventListeners[event] = this.eventListeners[event]
      .filter(cb => cb !== callback);
  }
  
  /**
   * Trigger an event
   * @param {string} event - The event name
   * @param {object} data - The event data
   */
  triggerEvent(event, data) {
    if (!this.eventListeners[event]) return;
    
    this.eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}

// Create and export a singleton instance
const terraFlowComponents = new TerraFlowComponents();

// Add to window for global access
window.terraFlowComponents = terraFlowComponents;