/**
 * Mobile Gestures Library
 * Enhanced touch interactions for GeoAssessmentPro
 */

class MobileGestures {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.minSwipeDistance = 50;
    this.maxSwipeTime = 300;
    this.startTime = 0;
    this.init();
  }

  init() {
    // Only initialize on mobile devices
    if (window.innerWidth >= 768) return;
    
    this.setupSwipeDetection();
    this.setupBottomSheetGestures();
    this.setupTouchFeedback();
    this.setupPinchZoom();
    this.setupDoubleTapZoom();
  }

  /**
   * Set up swipe detection for the entire document
   */
  setupSwipeDetection() {
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
      this.startTime = Date.now();
    }, false);

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    }, false);
  }

  /**
   * Handle swipe gestures
   */
  handleSwipe() {
    const endTime = Date.now();
    const elapsedTime = endTime - this.startTime;
    
    // Check if gesture was fast enough to be a swipe
    if (elapsedTime > this.maxSwipeTime) return;
    
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Only consider it a swipe if moved further than minimum distance
    if (absDeltaX < this.minSwipeDistance && absDeltaY < this.minSwipeDistance) return;
    
    // Determine swipe direction (horizontal swipes take precedence over vertical)
    if (absDeltaX > absDeltaY) {
      if (deltaX > 0) {
        this.handleRightSwipe();
      } else {
        this.handleLeftSwipe();
      }
    } else {
      if (deltaY > 0) {
        this.handleDownSwipe();
      } else {
        this.handleUpSwipe();
      }
    }
  }

  /**
   * Handle left swipe
   */
  handleLeftSwipe() {
    // Trigger a custom event
    document.dispatchEvent(new CustomEvent('mobileSwipeLeft'));
    
    // Check for specific active elements
    const drawer = document.querySelector('.mobile-drawer.open');
    if (drawer) {
      // Close the drawer if it's open
      drawer.classList.remove('open');
      const backdrop = document.querySelector('.mobile-drawer-backdrop.visible');
      if (backdrop) backdrop.classList.remove('visible');
      document.body.style.overflow = '';
    }
  }

  /**
   * Handle right swipe
   */
  handleRightSwipe() {
    // Trigger a custom event
    document.dispatchEvent(new CustomEvent('mobileSwipeRight'));
    
    // Check if we should open the drawer
    const drawer = document.querySelector('.mobile-drawer');
    if (drawer && !drawer.classList.contains('open') && this.touchStartX < 30) {
      // Open the drawer if swipe starts from the left edge
      drawer.classList.add('open');
      const backdrop = document.querySelector('.mobile-drawer-backdrop');
      if (backdrop) backdrop.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Handle up swipe
   */
  handleUpSwipe() {
    // Trigger a custom event
    document.dispatchEvent(new CustomEvent('mobileSwipeUp'));
    
    // Check if we should open bottom sheets
    if (this.touchStartY > window.innerHeight - 50) {
      // If swipe starts from near the bottom of the screen
      const filtersPanel = document.querySelector('.assessment-filters-panel');
      if (filtersPanel && !filtersPanel.classList.contains('expanded')) {
        filtersPanel.classList.add('expanded');
      }
    }
  }

  /**
   * Handle down swipe
   */
  handleDownSwipe() {
    // Trigger a custom event
    document.dispatchEvent(new CustomEvent('mobileSwipeDown'));
    
    // Check if we should close any bottom sheets
    const expandedPanels = document.querySelectorAll('.expanded');
    expandedPanels.forEach(panel => {
      if (this.touchStartY < panel.offsetTop + 60) {
        panel.classList.remove('expanded');
      }
    });
  }

  /**
   * Set up gesture handling for bottom sheet UI elements
   */
  setupBottomSheetGestures() {
    const bottomSheets = document.querySelectorAll('.assessment-filters-panel, .property-details-panel, .mobile-map-filter-sheet');
    
    bottomSheets.forEach(sheet => {
      if (!sheet) return;
      
      const handle = sheet.querySelector('.panel-handle');
      if (!handle) return;
      
      let startY = 0;
      let startTransform = 0;
      let currentTransform = 100;
      
      handle.addEventListener('touchstart', (e) => {
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
        
        // Add event listeners for drag
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
      });
      
      function handleTouchMove(e) {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        const sheetHeight = sheet.offsetHeight;
        
        // Calculate new transform percentage
        let newTransform = startTransform + (deltaY / sheetHeight) * 100;
        
        // Limit to 0-100% range (0% is fully visible, 100% is hidden)
        newTransform = Math.max(0, Math.min(100, newTransform));
        
        // Apply transform
        sheet.style.transform = `translateY(${newTransform}%)`;
        currentTransform = newTransform;
      }
      
      function handleTouchEnd() {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        
        // Snap to open or closed position
        if (currentTransform > 50) {
          // Close sheet
          sheet.style.transform = 'translateY(100%)';
          sheet.classList.remove('expanded');
        } else {
          // Open sheet
          sheet.style.transform = 'translateY(0)';
          sheet.classList.add('expanded');
        }
        
        // Reset transform after animation completes
        setTimeout(() => {
          if (sheet.classList.contains('expanded')) {
            sheet.style.transform = '';
          }
        }, 300);
      }
    });
  }

  /**
   * Set up visual touch feedback for clickable elements
   */
  setupTouchFeedback() {
    const interactiveElements = document.querySelectorAll(
      'button, .btn, .nav-link, .mobile-drawer-link, .list-group-item, .card.interactive'
    );
    
    interactiveElements.forEach(element => {
      element.addEventListener('touchstart', () => {
        element.classList.add('active-touch');
      });
      
      element.addEventListener('touchend', () => {
        element.classList.remove('active-touch');
      });
      
      element.addEventListener('touchcancel', () => {
        element.classList.remove('active-touch');
      });
    });
    
    // Add CSS for touch feedback if not already present
    if (!document.getElementById('touch-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'touch-feedback-styles';
      style.textContent = `
        .active-touch {
          transform: scale(0.98);
          transition: transform 0.1s ease-out;
        }
        .btn.active-touch {
          opacity: 0.8;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Set up pinch-to-zoom for maps and images
   */
  setupPinchZoom() {
    // Only apply to map elements
    const maps = document.querySelectorAll('.leaflet-container');
    
    maps.forEach(map => {
      // Leaflet already handles pinch zoom, but we can enhance it
      if (map._leaflet_map) {
        const leafletMap = map._leaflet_map;
        leafletMap.touchZoom.enable();
        leafletMap.boxZoom.enable();
        
        // Improve pinch zoom sensitivity
        if (typeof leafletMap.options.touchZoom === 'object') {
          leafletMap.options.touchZoom.sensitivity = 1.5;
        }
      }
    });
    
    // Apply to large images
    const zoomableImages = document.querySelectorAll('.zoomable-image');
    
    zoomableImages.forEach(img => {
      let currentScale = 1;
      let initialDistance = 0;
      
      img.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          initialDistance = getDistance(
            e.touches[0].clientX, e.touches[0].clientY,
            e.touches[1].clientX, e.touches[1].clientY
          );
        }
      });
      
      img.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          e.preventDefault(); // Prevent page scrolling
          
          const currentDistance = getDistance(
            e.touches[0].clientX, e.touches[0].clientY,
            e.touches[1].clientX, e.touches[1].clientY
          );
          
          const scaleFactor = currentDistance / initialDistance;
          const newScale = Math.min(Math.max(1, currentScale * scaleFactor), 3);
          
          img.style.transform = `scale(${newScale})`;
        }
      });
      
      img.addEventListener('touchend', () => {
        initialDistance = 0;
        currentScale = parseFloat(img.style.transform.replace('scale(', '').replace(')', '')) || 1;
      });
      
      function getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      }
    });
  }

  /**
   * Set up double-tap-to-zoom for maps
   */
  setupDoubleTapZoom() {
    const maps = document.querySelectorAll('.leaflet-container');
    
    maps.forEach(map => {
      // Leaflet already handles double tap, but we can enhance it
      if (map._leaflet_map) {
        const leafletMap = map._leaflet_map;
        leafletMap.doubleClickZoom.enable();
      }
    });
  }
}

// Initialize mobile gestures when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.mobileGestures = new MobileGestures();
});