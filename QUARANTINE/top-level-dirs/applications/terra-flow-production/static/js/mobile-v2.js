/**
 * GeoAssessmentPro Mobile v2
 * Enhanced mobile-friendly JavaScript functionality
 */

// Initialize mobile functionality when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Detect if user is on a mobile device
  const isMobile = window.innerWidth < 768;
  
  // Only run mobile-specific code on mobile devices
  if (isMobile) {
    initMobileInterface();
  }
});

/**
 * Initialize mobile interface enhancements
 */
function initMobileInterface() {
  console.log('Initializing enhanced mobile interface v2');
  
  // Setup components
  setupMobileHeader();
  setupBottomNavigation();
  setupMobileDrawer();
  setupMobileMapControls();
  setupMobileFilterSheet();
  setupMobileGestures();
  setupMobileAccessibility();
  setupScrollBehavior();
  
  // Add mobile-specific class to body
  document.body.classList.add('mobile-view');
}

/**
 * Set up the mobile header with hide-on-scroll behavior
 */
function setupMobileHeader() {
  // Create mobile header if it doesn't exist
  if (!document.querySelector('.mobile-header')) {
    createMobileHeader();
  }
  
  const header = document.querySelector('.mobile-header');
  if (!header) return;
  
  // Get the current page title
  const pageTitle = document.title.split(' | ')[0] || 'GeoAssessmentPro';
  
  // Set the header title
  const headerTitle = header.querySelector('.mobile-header-title');
  if (headerTitle) {
    headerTitle.textContent = pageTitle;
  }
  
  // Handle menu toggle
  const menuToggle = header.querySelector('.mobile-menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileDrawer);
  }
}

/**
 * Create a mobile header if it doesn't exist
 */
function createMobileHeader() {
  const header = document.createElement('div');
  header.className = 'mobile-header';
  header.innerHTML = `
    <button class="mobile-menu-toggle" aria-label="Open menu">
      <i class="fas fa-bars"></i>
    </button>
    <h1 class="mobile-header-title">GeoAssessmentPro</h1>
    <button class="mobile-actions-toggle" aria-label="Actions">
      <i class="fas fa-ellipsis-v"></i>
    </button>
  `;
  
  // Insert at the beginning of the body
  document.body.insertBefore(header, document.body.firstChild);
  
  // Setup actions toggle
  const actionsToggle = header.querySelector('.mobile-actions-toggle');
  if (actionsToggle) {
    actionsToggle.addEventListener('click', toggleMobileActions);
  }
}

/**
 * Set up the bottom navigation bar
 */
function setupBottomNavigation() {
  // Create bottom navigation if it doesn't exist
  if (!document.querySelector('.mobile-bottom-nav')) {
    createBottomNavigation();
  }
}

/**
 * Create the bottom navigation component
 */
function createBottomNavigation() {
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'mobile-bottom-nav';
  
  // Define navigation items
  const navItems = [
    { icon: 'fa-home', label: 'Home', url: '/' },
    { icon: 'fa-map-marker-alt', label: 'Map', url: '/map' },
    { icon: 'fa-search', label: 'Search', url: '/search' },
    { icon: 'fa-file-alt', label: 'Reports', url: '/reports' },
    { icon: 'fa-user', label: 'Profile', url: '/profile' }
  ];
  
  // Current path for active state
  const currentPath = window.location.pathname;
  
  // Create navigation HTML
  const navHTML = navItems.map(item => {
    const isActive = currentPath === item.url || 
                     (item.url !== '/' && currentPath.startsWith(item.url));
    
    return `
      <a href="${item.url}" class="mobile-bottom-nav-item ${isActive ? 'active' : ''}">
        <i class="fas ${item.icon} mobile-bottom-nav-icon"></i>
        <span class="mobile-bottom-nav-label">${item.label}</span>
      </a>
    `;
  }).join('');
  
  bottomNav.innerHTML = navHTML;
  document.body.appendChild(bottomNav);
}

/**
 * Set up the mobile drawer menu 
 */
function setupMobileDrawer() {
  // Create drawer if it doesn't exist
  if (!document.querySelector('.mobile-drawer')) {
    createMobileDrawer();
  }
}

/**
 * Create the mobile drawer component
 */
function createMobileDrawer() {
  // Create drawer element
  const drawer = document.createElement('div');
  drawer.className = 'mobile-drawer';
  
  // Create drawer content
  drawer.innerHTML = `
    <div class="mobile-drawer-header">
      <h2>GeoAssessmentPro</h2>
      <button class="mobile-drawer-close" aria-label="Close menu">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="mobile-drawer-content">
      <ul class="mobile-drawer-nav">
        <li class="mobile-drawer-item">
          <a href="/" class="mobile-drawer-link ${window.location.pathname === '/' ? 'active' : ''}">
            <i class="fas fa-home mobile-drawer-icon"></i>
            Home
          </a>
        </li>
        <li class="mobile-drawer-item">
          <a href="/map" class="mobile-drawer-link ${window.location.pathname.includes('/map') ? 'active' : ''}">
            <i class="fas fa-map-marker-alt mobile-drawer-icon"></i>
            Assessment Map
          </a>
        </li>
        <li class="mobile-drawer-item">
          <a href="/search" class="mobile-drawer-link ${window.location.pathname.includes('/search') ? 'active' : ''}">
            <i class="fas fa-search mobile-drawer-icon"></i>
            Property Search
          </a>
        </li>
        <li class="mobile-drawer-item">
          <a href="/reports" class="mobile-drawer-link ${window.location.pathname.includes('/reports') ? 'active' : ''}">
            <i class="fas fa-chart-bar mobile-drawer-icon"></i>
            Reports
          </a>
        </li>
        <li class="mobile-drawer-item">
          <a href="/data-quality" class="mobile-drawer-link ${window.location.pathname.includes('/data-quality') ? 'active' : ''}">
            <i class="fas fa-check-circle mobile-drawer-icon"></i>
            Data Quality
          </a>
        </li>
        <li class="mobile-drawer-item">
          <a href="/valuation" class="mobile-drawer-link ${window.location.pathname.includes('/valuation') ? 'active' : ''}">
            <i class="fas fa-dollar-sign mobile-drawer-icon"></i>
            Valuation Tools
          </a>
        </li>
        <li class="mobile-drawer-item">
          <a href="/profile" class="mobile-drawer-link ${window.location.pathname.includes('/profile') ? 'active' : ''}">
            <i class="fas fa-user mobile-drawer-icon"></i>
            My Profile
          </a>
        </li>
        <li class="mobile-drawer-item">
          <a href="/settings" class="mobile-drawer-link ${window.location.pathname.includes('/settings') ? 'active' : ''}">
            <i class="fas fa-cog mobile-drawer-icon"></i>
            Settings
          </a>
        </li>
      </ul>
      
      <hr>
      
      <ul class="mobile-drawer-nav">
        <li class="mobile-drawer-item">
          <a href="/help" class="mobile-drawer-link">
            <i class="fas fa-question-circle mobile-drawer-icon"></i>
            Help & Support
          </a>
        </li>
        <li class="mobile-drawer-item">
          <a href="/logout" class="mobile-drawer-link">
            <i class="fas fa-sign-out-alt mobile-drawer-icon"></i>
            Log Out
          </a>
        </li>
      </ul>
    </div>
  `;
  
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-drawer-backdrop';
  backdrop.addEventListener('click', toggleMobileDrawer);
  
  // Add drawer and backdrop to body
  document.body.appendChild(drawer);
  document.body.appendChild(backdrop);
  
  // Add event listener to close button
  const closeButton = drawer.querySelector('.mobile-drawer-close');
  if (closeButton) {
    closeButton.addEventListener('click', toggleMobileDrawer);
  }
}

/**
 * Toggle the mobile drawer menu
 */
function toggleMobileDrawer() {
  const drawer = document.querySelector('.mobile-drawer');
  const backdrop = document.querySelector('.mobile-drawer-backdrop');
  
  if (!drawer || !backdrop) return;
  
  // Toggle classes
  drawer.classList.toggle('open');
  backdrop.classList.toggle('visible');
  
  // Toggle body scroll
  if (drawer.classList.contains('open')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

/**
 * Toggle mobile actions menu
 */
function toggleMobileActions() {
  // Implementation depends on the context of the current page
  console.log('Mobile actions toggled');
}

/**
 * Set up mobile map controls
 */
function setupMobileMapControls() {
  // Only run this on the map page
  if (!window.location.pathname.includes('/map')) return;
  
  // Add map-specific classes
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    mapContainer.classList.add('mobile-optimized');
  }
  
  // Create floating action button for map
  createMapFloatingActionButton();
}

/**
 * Create floating action button for map
 */
function createMapFloatingActionButton() {
  // Check if FAB already exists
  if (document.querySelector('.mobile-map-fab')) return;
  
  // Create FAB
  const fab = document.createElement('button');
  fab.className = 'mobile-map-fab';
  fab.innerHTML = '<i class="fas fa-layer-group"></i>';
  fab.setAttribute('aria-label', 'Map options');
  
  // Create action menu
  const actionMenu = document.createElement('div');
  actionMenu.className = 'mobile-map-action-menu';
  actionMenu.innerHTML = `
    <button class="mobile-map-action" id="mobile-toggle-filters">
      <i class="fas fa-filter"></i> Filters
    </button>
    <button class="mobile-map-action" id="mobile-toggle-layers">
      <i class="fas fa-layer-group"></i> Layers
    </button>
    <button class="mobile-map-action" id="mobile-generate-report">
      <i class="fas fa-file-alt"></i> Report
    </button>
    <button class="mobile-map-action" id="mobile-export-data">
      <i class="fas fa-download"></i> Export
    </button>
  `;
  
  // Add to page
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    mapContainer.appendChild(fab);
    mapContainer.appendChild(actionMenu);
  } else {
    document.body.appendChild(fab);
    document.body.appendChild(actionMenu);
  }
  
  // Add event listener
  fab.addEventListener('click', function() {
    actionMenu.classList.toggle('visible');
  });
  
  // Add event listeners to actions
  document.getElementById('mobile-toggle-filters').addEventListener('click', function() {
    toggleMobileFilterSheet();
    actionMenu.classList.remove('visible');
  });
  
  document.getElementById('mobile-toggle-layers').addEventListener('click', function() {
    // Toggle layers submenu or directly toggle layers
    const toggleZoning = document.getElementById('toggle-zoning');
    if (toggleZoning) {
      toggleZoning.click();
    }
    actionMenu.classList.remove('visible');
  });
  
  document.getElementById('mobile-generate-report').addEventListener('click', function() {
    const generateReport = document.getElementById('generate-report');
    if (generateReport) {
      generateReport.click();
    }
    actionMenu.classList.remove('visible');
  });
  
  document.getElementById('mobile-export-data').addEventListener('click', function() {
    const exportData = document.getElementById('export-data');
    if (exportData) {
      exportData.click();
    }
    actionMenu.classList.remove('visible');
  });
}

/**
 * Set up mobile filter sheet
 */
function setupMobileFilterSheet() {
  // Only run this on the map page
  if (!window.location.pathname.includes('/map')) return;
  
  // Create filter sheet if it doesn't exist
  if (!document.querySelector('.mobile-map-filter-sheet')) {
    createMobileFilterSheet();
  }
}

/**
 * Create the mobile filter sheet
 */
function createMobileFilterSheet() {
  // Create sheet container
  const sheet = document.createElement('div');
  sheet.className = 'mobile-map-filter-sheet';
  sheet.innerHTML = `
    <div class="mobile-sheet-handle"></div>
    <div class="mobile-sheet-content">
      <h3>Filter Properties</h3>
      <form id="mobile-filter-form">
        <div class="mobile-filter-group">
          <div class="mobile-filter-label">Property Type</div>
          <div class="mobile-filter-options">
            <button type="button" class="mobile-filter-chip" data-value="All">All</button>
            <button type="button" class="mobile-filter-chip" data-value="Residential">Residential</button>
            <button type="button" class="mobile-filter-chip" data-value="Commercial">Commercial</button>
            <button type="button" class="mobile-filter-chip" data-value="Agricultural">Agricultural</button>
            <button type="button" class="mobile-filter-chip" data-value="Industrial">Industrial</button>
            <button type="button" class="mobile-filter-chip" data-value="Vacant">Vacant</button>
          </div>
        </div>
        
        <div class="mobile-filter-group">
          <div class="mobile-filter-label">Value Range</div>
          <div id="mobile-value-range-slider"></div>
          <div class="d-flex justify-content-between mt-2">
            <span id="mobile-value-min">$0</span>
            <span id="mobile-value-max">$2,000,000+</span>
          </div>
        </div>
        
        <div class="mobile-filter-group">
          <div class="mobile-filter-label">Assessment Year</div>
          <select class="form-select" id="mobile-assessment-year">
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
        
        <div class="mobile-filter-actions">
          <button type="button" id="mobile-reset-filters" class="btn btn-outline-secondary">Reset</button>
          <button type="button" id="mobile-apply-filters" class="btn btn-primary">Apply Filters</button>
        </div>
      </form>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(sheet);
  
  // Setup range slider if noUiSlider is available
  if (window.noUiSlider) {
    const mobileValueSlider = document.getElementById('mobile-value-range-slider');
    if (mobileValueSlider) {
      noUiSlider.create(mobileValueSlider, {
        start: [0, 2000000],
        connect: true,
        step: 50000,
        range: {
          'min': 0,
          'max': 2000000
        },
        format: {
          to: function(value) {
            return Math.round(value);
          },
          from: function(value) {
            return Math.round(value);
          }
        }
      });
      
      // Update value labels
      mobileValueSlider.noUiSlider.on('update', function(values) {
        document.getElementById('mobile-value-min').textContent = '$' + parseInt(values[0]).toLocaleString();
        document.getElementById('mobile-value-max').textContent = '$' + parseInt(values[1]).toLocaleString();
      });
    }
  }
  
  // Setup property type chips
  const chips = sheet.querySelectorAll('.mobile-filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', function() {
      // If "All" is selected, deselect others
      if (this.dataset.value === 'All') {
        chips.forEach(c => {
          if (c.dataset.value !== 'All') {
            c.classList.remove('selected');
          }
        });
      } else {
        // If any other value is selected, deselect "All"
        const allChip = sheet.querySelector('.mobile-filter-chip[data-value="All"]');
        if (allChip) {
          allChip.classList.remove('selected');
        }
      }
      
      this.classList.toggle('selected');
    });
  });
  
  // Select "All" by default
  const allChip = sheet.querySelector('.mobile-filter-chip[data-value="All"]');
  if (allChip) {
    allChip.classList.add('selected');
  }
  
  // Setup event listeners
  document.getElementById('mobile-apply-filters').addEventListener('click', function() {
    // Get selected property types
    const selectedChips = sheet.querySelectorAll('.mobile-filter-chip.selected');
    const propertyTypes = Array.from(selectedChips).map(chip => chip.dataset.value);
    
    // Get value range
    let valueRange = [0, 2000000];
    const slider = document.getElementById('mobile-value-range-slider');
    if (slider && slider.noUiSlider) {
      valueRange = slider.noUiSlider.get();
    }
    
    // Get assessment year
    const year = document.getElementById('mobile-assessment-year').value;
    
    // Apply filters (trigger the desktop filter application)
    if (window.loadProperties) {
      window.loadProperties(propertyTypes, valueRange, year);
    }
    
    // Close sheet
    toggleMobileFilterSheet(false);
  });
  
  document.getElementById('mobile-reset-filters').addEventListener('click', function() {
    // Reset form
    document.getElementById('mobile-filter-form').reset();
    
    // Reset chips
    chips.forEach(chip => chip.classList.remove('selected'));
    const allChip = sheet.querySelector('.mobile-filter-chip[data-value="All"]');
    if (allChip) {
      allChip.classList.add('selected');
    }
    
    // Reset slider
    if (document.getElementById('mobile-value-range-slider').noUiSlider) {
      document.getElementById('mobile-value-range-slider').noUiSlider.set([0, 2000000]);
    }
    
    // Reset year
    document.getElementById('mobile-assessment-year').value = '2025';
  });
  
  // Setup sheet drag
  setupSheetDrag(sheet);
}

/**
 * Toggle the mobile filter sheet
 * @param {boolean} [show] - Force show/hide state
 */
function toggleMobileFilterSheet(show) {
  const sheet = document.querySelector('.mobile-map-filter-sheet');
  if (!sheet) return;
  
  if (typeof show === 'boolean') {
    if (show) {
      sheet.classList.add('visible');
    } else {
      sheet.classList.remove('visible');
    }
  } else {
    sheet.classList.toggle('visible');
  }
}

/**
 * Set up draggable behavior for bottom sheets
 * @param {HTMLElement} sheet - The sheet element
 */
function setupSheetDrag(sheet) {
  const handle = sheet.querySelector('.mobile-sheet-handle');
  if (!handle) return;
  
  let startY = 0;
  let startTransform = 0;
  let currentTransform = 100;
  
  handle.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
    startTransform = currentTransform;
    
    // Get current transform
    const transform = window.getComputedStyle(sheet).transform;
    if (transform !== 'none') {
      const matrix = transform.match(/matrix.*\((.+)\)/);
      if (matrix) {
        const values = matrix[1].split(', ');
        if (values.length >= 6) {
          const translateY = parseFloat(values[5]);
          const sheetHeight = sheet.offsetHeight;
          currentTransform = (translateY / sheetHeight) * 100;
        }
      }
    }
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  });
  
  function handleTouchMove(e) {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    const sheetHeight = sheet.offsetHeight;
    
    // Calculate new transform percentage
    let newTransform = startTransform + (deltaY / sheetHeight) * 100;
    
    // Limit to 0-100% range
    newTransform = Math.max(0, Math.min(100, newTransform));
    
    // Apply transform
    sheet.style.transform = `translateY(${newTransform}%)`;
    currentTransform = newTransform;
  }
  
  function handleTouchEnd() {
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    // Snap to open or closed state
    if (currentTransform > 50) {
      // Close
      sheet.style.transform = 'translateY(100%)';
      sheet.classList.remove('visible');
    } else {
      // Open
      sheet.style.transform = 'translateY(0)';
    }
  }
}

/**
 * Set up mobile-specific gesture handling
 */
function setupMobileGestures() {
  // Handle map gestures when available
  setupMapGestures();
  
  // Setup pull-to-refresh prevention
  document.body.addEventListener('touchstart', function(e) {
    // Prevent pull-to-refresh in browsers like Chrome on Android
    if (e.touches.length === 1 && e.touches[0].clientY < 10) {
      e.preventDefault();
    }
  }, { passive: false });
}

/**
 * Set up gestures for map interaction
 */
function setupMapGestures() {
  // Only run on map page
  if (!window.location.pathname.includes('/map')) return;
  
  // Get map container
  const mapContainer = document.querySelector('.map-container');
  if (!mapContainer) return;
  
  // Add mobile-optimized class
  mapContainer.classList.add('mobile-optimized');
  
  // If Leaflet map is available, optimize it for touch
  if (window.map && window.map instanceof L.Map) {
    // Enable touch zoom and double-tap zoom
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    
    // Disable scroll wheel zoom (can be disorienting on mobile)
    map.scrollWheelZoom.disable();
    
    // Adjust map controls for mobile
    const zoomControl = map.zoomControl;
    if (zoomControl) {
      map.removeControl(zoomControl);
      map.addControl(L.control.zoom({ position: 'bottomright' }));
    }
  }
}

/**
 * Set up mobile accessibility improvements
 */
function setupMobileAccessibility() {
  // Add high contrast mode toggle in settings
  const settingsLink = document.querySelector('.mobile-drawer-link[href="/settings"]');
  if (settingsLink) {
    settingsLink.addEventListener('click', function(e) {
      // Check if we're on the settings page
      if (window.location.pathname !== '/settings') return;
      
      // Prevent default if we're just toggling
      e.preventDefault();
      
      // Toggle high contrast mode
      document.body.classList.toggle('high-contrast-mode');
      
      // Save preference to localStorage
      const isHighContrast = document.body.classList.contains('high-contrast-mode');
      localStorage.setItem('high-contrast-mode', isHighContrast.toString());
    });
  }
  
  // Apply high contrast mode if previously enabled
  if (localStorage.getItem('high-contrast-mode') === 'true') {
    document.body.classList.add('high-contrast-mode');
  }
  
  // Add skip-to-content link for keyboard users
  if (!document.getElementById('skip-to-content')) {
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-content';
    skipLink.className = 'visually-hidden';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to content';
    skipLink.setAttribute('tabindex', '1');
    
    // Style it to be visible on focus
    skipLink.addEventListener('focus', function() {
      this.style.position = 'fixed';
      this.style.top = '0';
      this.style.left = '0';
      this.style.padding = '10px';
      this.style.background = 'white';
      this.style.zIndex = '9999';
      this.style.width = 'auto';
      this.style.height = 'auto';
    });
    
    skipLink.addEventListener('blur', function() {
      this.style.position = 'absolute';
      this.style.width = '1px';
      this.style.height = '1px';
      this.style.padding = '0';
      this.style.overflow = 'hidden';
      this.style.clip = 'rect(0, 0, 0, 0)';
      this.style.whiteSpace = 'nowrap';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
}

/**
 * Set up scroll behavior optimizations
 */
function setupScrollBehavior() {
  let lastScroll = 0;
  const header = document.querySelector('.mobile-header');
  
  if (!header) return;
  
  // Handle scroll events
  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    // Hide/show header based on scroll direction
    if (currentScroll > lastScroll && currentScroll > 100) {
      // Scrolling down - hide header
      header.classList.add('hidden');
    } else {
      // Scrolling up - show header
      header.classList.remove('hidden');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}

/**
 * Handle errors gracefully
 * @param {string} message - Error message
 * @param {string} [location] - Component where error occurred
 */
function handleMobileError(message, location = 'general') {
  console.error(`Mobile interface error (${location}):`, message);
  
  // Attempt to continue with other functionality
  // For critical errors, show a user-friendly message
  if (location === 'critical') {
    showMobileErrorMessage(message);
  }
}

/**
 * Display a user-friendly error message
 * @param {string} message - Error message
 */
function showMobileErrorMessage(message) {
  // Create error message container if not exists
  let errorContainer = document.querySelector('.mobile-error-container');
  
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'mobile-error-container alert alert-danger';
    errorContainer.style.position = 'fixed';
    errorContainer.style.bottom = 'calc(var(--bottom-nav-height) + 16px)';
    errorContainer.style.left = '16px';
    errorContainer.style.right = '16px';
    errorContainer.style.zIndex = '1000';
    errorContainer.style.borderRadius = '8px';
    errorContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    document.body.appendChild(errorContainer);
  }
  
  // Set message
  errorContainer.textContent = message;
  
  // Show error
  errorContainer.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 5000);
}