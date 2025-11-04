/**
 * TerraFlow Accessibility Enhancements
 * Improves accessibility throughout the application
 */

class AccessibilityManager {
  constructor() {
    this.highContrastEnabled = false;
    this.largeTextEnabled = false;
    this.reduceMotionEnabled = false;
    
    // Initialize based on user preferences
    this.checkUserPreferences();
    
    // Load saved preferences
    this.loadSavedPreferences();
  }
  
  /**
   * Initialize the accessibility features
   */
  init() {
    this.setupEventListeners();
    return this;
  }
  
  /**
   * Check user OS/browser preferences for accessibility settings
   */
  checkUserPreferences() {
    // Check for prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.reduceMotionEnabled = true;
      document.documentElement.classList.add('reduce-motion');
    }
    
    // Check for prefers-contrast
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      this.highContrastEnabled = true;
      document.documentElement.classList.add('high-contrast');
    }
    
    // Check if user has increased font size in their browser
    const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (baseFontSize > 16) {
      this.largeTextEnabled = true;
      document.documentElement.classList.add('large-text');
    }
  }
  
  /**
   * Load user's saved accessibility preferences from localStorage
   */
  loadSavedPreferences() {
    try {
      const savedPrefs = localStorage.getItem('terraflow_a11y_preferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        
        if (prefs.highContrast) {
          this.highContrastEnabled = true;
          document.documentElement.classList.add('high-contrast');
        }
        
        if (prefs.largeText) {
          this.largeTextEnabled = true;
          document.documentElement.classList.add('large-text');
        }
        
        if (prefs.reduceMotion) {
          this.reduceMotionEnabled = true;
          document.documentElement.classList.add('reduce-motion');
        }
      }
    } catch (error) {
      console.error('Error loading accessibility preferences:', error);
    }
  }
  
  /**
   * Save the current accessibility preferences to localStorage
   */
  savePreferences() {
    try {
      const prefs = {
        highContrast: this.highContrastEnabled,
        largeText: this.largeTextEnabled,
        reduceMotion: this.reduceMotionEnabled
      };
      
      localStorage.setItem('terraflow_a11y_preferences', JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving accessibility preferences:', error);
    }
  }
  
  /**
   * Set up event listeners for accessibility controls
   */
  setupEventListeners() {
    // Toggle accessibility panel
    const panelToggle = document.getElementById('toggle-a11y-panel');
    if (panelToggle) {
      panelToggle.addEventListener('click', () => {
        const panel = document.querySelector('.a11y-panel');
        if (panel) {
          panel.classList.toggle('open');
          
          // Update ARIA attributes
          const isOpen = panel.classList.contains('open');
          panelToggle.setAttribute('aria-expanded', isOpen.toString());
          
          // If panel is now open, set focus to first option
          if (isOpen) {
            const firstOption = panel.querySelector('.a11y-option');
            if (firstOption) {
              firstOption.focus();
            }
          }
        }
      });
    }
    
    // Set up high contrast toggle
    const contrastToggle = document.getElementById('toggle-high-contrast');
    if (contrastToggle) {
      // Update button state
      this.updateToggleState(contrastToggle, this.highContrastEnabled);
      
      contrastToggle.addEventListener('click', () => {
        this.toggleHighContrast();
        this.updateToggleState(contrastToggle, this.highContrastEnabled);
        this.savePreferences();
      });
    }
    
    // Set up large text toggle
    const textToggle = document.getElementById('toggle-large-text');
    if (textToggle) {
      // Update button state
      this.updateToggleState(textToggle, this.largeTextEnabled);
      
      textToggle.addEventListener('click', () => {
        this.toggleLargeText();
        this.updateToggleState(textToggle, this.largeTextEnabled);
        this.savePreferences();
      });
    }
    
    // Set up reduce motion toggle
    const motionToggle = document.getElementById('toggle-reduce-motion');
    if (motionToggle) {
      // Update button state
      this.updateToggleState(motionToggle, this.reduceMotionEnabled);
      
      motionToggle.addEventListener('click', () => {
        this.toggleReduceMotion();
        this.updateToggleState(motionToggle, this.reduceMotionEnabled);
        this.savePreferences();
      });
    }
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Add keyboard-focused class to body when using Tab
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-focus');
      }
      
      // Close accessibility panel with Escape
      if (e.key === 'Escape') {
        const panel = document.querySelector('.a11y-panel');
        if (panel && panel.classList.contains('open')) {
          panel.classList.remove('open');
          panelToggle.setAttribute('aria-expanded', 'false');
          panelToggle.focus(); // Return focus to toggle
        }
      }
    });
    
    // Remove keyboard-focused class when using mouse
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-focus');
    });
    
    // Add focus styling for keyboard navigation
    this.addFocusVisibility();
  }
  
  /**
   * Updates the visual state of a toggle button
   * @param {HTMLElement} button - The toggle button
   * @param {boolean} enabled - Whether the feature is enabled
   */
  updateToggleState(button, enabled) {
    if (button) {
      if (enabled) {
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
      }
    }
  }
  
  /**
   * Toggle high contrast mode
   */
  toggleHighContrast() {
    this.highContrastEnabled = !this.highContrastEnabled;
    
    if (this.highContrastEnabled) {
      document.documentElement.classList.add('high-contrast');
      // Announce to screen readers
      this.announce('High contrast mode enabled');
    } else {
      document.documentElement.classList.remove('high-contrast');
      // Announce to screen readers
      this.announce('High contrast mode disabled');
    }
  }
  
  /**
   * Toggle large text mode
   */
  toggleLargeText() {
    this.largeTextEnabled = !this.largeTextEnabled;
    
    if (this.largeTextEnabled) {
      document.documentElement.classList.add('large-text');
      // Announce to screen readers
      this.announce('Large text mode enabled');
    } else {
      document.documentElement.classList.remove('large-text');
      // Announce to screen readers
      this.announce('Large text mode disabled');
    }
  }
  
  /**
   * Toggle reduced motion mode
   */
  toggleReduceMotion() {
    this.reduceMotionEnabled = !this.reduceMotionEnabled;
    
    if (this.reduceMotionEnabled) {
      document.documentElement.classList.add('reduce-motion');
      // Announce to screen readers
      this.announce('Reduced motion mode enabled');
    } else {
      document.documentElement.classList.remove('reduce-motion');
      // Announce to screen readers
      this.announce('Reduced motion mode disabled');
    }
  }
  
  /**
   * Announce a message to screen readers
   * @param {string} message - The message to announce
   */
  announce(message) {
    let announcer = document.getElementById('a11y-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11y-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'visually-hidden';
      document.body.appendChild(announcer);
    }
    
    // Clear the announcer and then set the new message
    announcer.textContent = '';
    
    // Use setTimeout to ensure screen readers register the change
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
  
  /**
   * Add CSS for ensuring focus is visible when using keyboard navigation
   */
  addFocusVisibility() {
    // Skip if already added
    if (document.getElementById('a11y-focus-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'a11y-focus-styles';
    style.textContent = `
      /* Only show focus outlines when using keyboard */
      .keyboard-focus :focus {
        outline: 3px solid var(--primary-600) !important;
        outline-offset: 2px !important;
      }
      
      /* Hide focus outlines when using mouse */
      :focus:not(:focus-visible) {
        outline: none !important;
      }
      
      /* Visually hidden but screen reader accessible */
      .visually-hidden {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      /* Skip to content link */
      .skip-to-content {
        position: absolute;
        top: -50px;
        left: 0;
        background: var(--primary-600);
        color: white;
        padding: 10px 15px;
        z-index: 1100;
        transition: top 0.3s ease;
      }
      
      .skip-to-content:focus {
        top: 0;
      }
      
      /* High contrast mode */
      .high-contrast {
        --primary-600: #0052cc;
        --neutral-600: #444444;
        --success-500: #006600;
        --danger-500: #cc0000;
        --warning-500: #cc6600;
        --info-500: #006699;
      }
      
      .high-contrast .card {
        border: 1px solid #000;
      }
      
      .high-contrast .btn-outline-primary {
        border-width: 2px;
      }
      
      /* Large text mode */
      .large-text {
        font-size: 120%;
      }
      
      .large-text .form-control,
      .large-text .btn,
      .large-text .nav-link {
        font-size: 110%;
        padding: 0.5rem 1rem;
      }
      
      /* Reduced motion mode */
      .reduce-motion * {
        animation-duration: 0.001s !important;
        transition-duration: 0.001s !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Fix tab index for accessibility
   * Ensures proper tab order and adds missing tabindex where needed
   */
  fixTabIndex() {
    // Add tab index to interactive elements that lack it
    const interactiveElements = document.querySelectorAll('[role="button"]:not([tabindex]), [role="link"]:not([tabindex])');
    interactiveElements.forEach(el => {
      el.setAttribute('tabindex', '0');
    });
    
    // Ensure modal dialogs trap focus correctly
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      // Only for visible modals
      if (modal.classList.contains('show')) {
        this.trapFocusInModal(modal);
      }
    });
  }
  
  /**
   * Trap keyboard focus inside a modal dialog
   * @param {HTMLElement} modal - The modal element
   */
  trapFocusInModal(modal) {
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Handle Tab and Shift+Tab to trap focus
    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }
  
  /**
   * Add alt text to images that are missing it
   */
  fixMissingAltText() {
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      // Set empty alt for decorative images or derive from context
      const parentEl = img.parentElement;
      
      // If inside an anchor, use the anchor text
      if (parentEl.tagName === 'A' && parentEl.textContent.trim()) {
        img.alt = parentEl.textContent.trim();
      } else if (img.src) {
        // Otherwise extract some meaning from filename
        const filename = img.src.split('/').pop().split('?')[0].split('#')[0];
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        
        // Only use filename if it seems meaningful
        if (nameWithoutExt.length > 3) {
          img.alt = nameWithoutExt;
        } else {
          img.alt = ''; // Decorative image
        }
      } else {
        img.alt = ''; // Decorative image
      }
    });
  }
  
  /**
   * Scan the page for accessibility issues and fix common problems
   */
  scanAndFixAccessibilityIssues() {
    // Fix missing alt text
    this.fixMissingAltText();
    
    // Fix tab indexing
    this.fixTabIndex();
    
    // Ensure all form elements have associated labels
    const formControls = document.querySelectorAll('input, select, textarea');
    formControls.forEach(control => {
      // Skip if it has an associated label
      if (control.id && document.querySelector(`label[for="${control.id}"]`)) {
        return;
      }
      
      // Skip if it's a hidden field
      if (control.type === 'hidden') {
        return;
      }
      
      // Skip if it's inside a label already
      if (control.closest('label')) {
        return;
      }
      
      // Try to find a suitable label text
      let labelText = '';
      
      // Check placeholder
      if (control.placeholder) {
        labelText = control.placeholder;
      }
      // Check aria-label
      else if (control.getAttribute('aria-label')) {
        labelText = control.getAttribute('aria-label');
      }
      // Use name attribute as fallback
      else if (control.name) {
        labelText = control.name.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        labelText = labelText.charAt(0).toUpperCase() + labelText.slice(1);
      }
      
      if (labelText) {
        // Create a new ID if needed
        if (!control.id) {
          control.id = `form-control-${Math.random().toString(36).substring(2, 10)}`;
        }
        
        // Create and insert a label
        const label = document.createElement('label');
        label.setAttribute('for', control.id);
        label.textContent = labelText;
        
        // Insert before the control
        control.parentNode.insertBefore(label, control);
      }
    });
    
    // Ensure headings are in the correct order
    let lastHeadingLevel = 0;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      
      // Warn about skipped heading levels in console
      if (lastHeadingLevel > 0 && level - lastHeadingLevel > 1) {
        console.warn(`Accessibility issue: Heading level skipped from h${lastHeadingLevel} to ${heading.tagName}`, heading);
      }
      
      lastHeadingLevel = level;
    });
    
    // Report any found issues
    console.info('Accessibility scan completed. Issues fixed where possible.');
  }
}

// Initialize the accessibility manager
document.addEventListener('DOMContentLoaded', function() {
  // Create singleton instance
  window.accessibilityManager = new AccessibilityManager().init();
  
  // Add keyboard-accessible skip link if not present
  if (!document.getElementById('skip-to-content')) {
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-content';
    skipLink.className = 'skip-to-content';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    
    // Add to beginning of body
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add handler
    skipLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Find main content area
      const mainContent = document.querySelector('main') || document.getElementById('main-content');
      
      if (mainContent) {
        // Set focus to it
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        
        // Scroll to it
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  // Automatically fix common accessibility issues
  window.accessibilityManager.scanAndFixAccessibilityIssues();
});