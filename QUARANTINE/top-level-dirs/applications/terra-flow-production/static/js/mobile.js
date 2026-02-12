/**
 * GeoAssessmentPro Mobile JavaScript
 * Handles mobile-specific interaction and behavior
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a mobile device
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        initMobileFeatures();
    }
    
    // Handle window resize events
    window.addEventListener('resize', function() {
        const currentIsMobile = window.innerWidth < 768;
        if (currentIsMobile !== isMobile) {
            location.reload(); // Reload to apply correct layout
        }
    });
    
    /**
     * Initialize mobile-specific features
     */
    function initMobileFeatures() {
        // Add mobile device class to body
        document.body.classList.add('mobile-device');
        
        // Initialize mobile filter panel for assessment map
        initMobileFilterPanel();
        
        // Initialize mobile property cards
        initMobilePropertyCards();
        
        // Initialize mobile navigation
        initMobileNavigation();
    }
    
    /**
     * Initialize mobile filter panel for the assessment map
     */
    function initMobileFilterPanel() {
        const filterPanel = document.querySelector('.assessment-filters-panel');
        const filterPanelToggleBtn = document.getElementById('mobile-filters-toggle');
        
        if (!filterPanel || !filterPanelToggleBtn) return;
        
        // Toggle filter panel when button is clicked
        filterPanelToggleBtn.addEventListener('click', function() {
            filterPanel.classList.toggle('expanded');
        });
        
        // Handle panel drag/swipe
        const filterPanelHandle = document.querySelector('.filter-panel-handle');
        
        if (filterPanelHandle) {
            let startY = 0;
            let currentY = 0;
            let initialTransform = 0;
            
            filterPanelHandle.addEventListener('touchstart', function(e) {
                startY = e.touches[0].clientY;
                initialTransform = filterPanel.classList.contains('expanded') ? 0 : -filterPanel.offsetHeight + 50;
                filterPanel.style.transition = 'none';
            });
            
            filterPanelHandle.addEventListener('touchmove', function(e) {
                currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;
                
                // Calculate new position
                let newTransform = initialTransform + deltaY;
                
                // Limit the range
                if (newTransform > 0) newTransform = 0;
                if (newTransform < -filterPanel.offsetHeight + 50) newTransform = -filterPanel.offsetHeight + 50;
                
                filterPanel.style.transform = `translateY(${newTransform}px)`;
            });
            
            filterPanelHandle.addEventListener('touchend', function() {
                filterPanel.style.transition = 'transform 0.3s ease';
                
                // If dragged more than 25% of the height, expand/collapse accordingly
                const threshold = filterPanel.offsetHeight * 0.25;
                
                if (initialTransform === 0) {
                    // Was expanded, check if should collapse
                    if (Math.abs(currentY - startY) > threshold && currentY > startY) {
                        filterPanel.classList.remove('expanded');
                    } else {
                        filterPanel.style.transform = '';
                    }
                } else {
                    // Was collapsed, check if should expand
                    if (Math.abs(currentY - startY) > threshold && currentY < startY) {
                        filterPanel.classList.add('expanded');
                    } else {
                        filterPanel.style.transform = '';
                    }
                }
            });
        }
        
        // Sync filter controls between mobile and desktop
        const mobileFilters = {
            'mobile-property-type': 'property-type',
            'mobile-assessment-year': 'assessment-year',
            'mobile-year-built-min': 'year-built-min',
            'mobile-year-built-max': 'year-built-max'
        };
        
        // Sync from desktop to mobile
        for (const [mobileId, desktopId] of Object.entries(mobileFilters)) {
            const desktopElement = document.getElementById(desktopId);
            const mobileElement = document.getElementById(mobileId);
            
            if (desktopElement && mobileElement) {
                mobileElement.value = desktopElement.value;
                
                desktopElement.addEventListener('change', function() {
                    mobileElement.value = desktopElement.value;
                });
            }
        }
        
        // Sync from mobile to desktop
        for (const [mobileId, desktopId] of Object.entries(mobileFilters)) {
            const desktopElement = document.getElementById(desktopId);
            const mobileElement = document.getElementById(mobileId);
            
            if (desktopElement && mobileElement) {
                mobileElement.addEventListener('change', function() {
                    desktopElement.value = mobileElement.value;
                });
            }
        }
        
        // Sync buttons
        if (document.getElementById('mobile-apply-filters') && document.getElementById('apply-filters')) {
            document.getElementById('mobile-apply-filters').addEventListener('click', function() {
                document.getElementById('apply-filters').click();
                filterPanel.classList.remove('expanded');
            });
        }
        
        if (document.getElementById('mobile-reset-filters') && document.getElementById('reset-filters')) {
            document.getElementById('mobile-reset-filters').addEventListener('click', function() {
                document.getElementById('reset-filters').click();
            });
        }
        
        // Sync value range slider
        // Note: This assumes noUiSlider is already initialized for desktop
        const desktopSlider = document.getElementById('value-range-slider');
        const mobileSlider = document.getElementById('mobile-value-range-slider');
        
        if (desktopSlider && mobileSlider && window.noUiSlider) {
            // Wait for the desktop slider to be initialized
            const checkSliderInterval = setInterval(function() {
                if (desktopSlider.noUiSlider) {
                    clearInterval(checkSliderInterval);
                    
                    // Clone the configuration from desktop slider
                    const config = {
                        start: desktopSlider.noUiSlider.get(),
                        connect: true,
                        range: desktopSlider.noUiSlider.options.range,
                        step: desktopSlider.noUiSlider.options.step
                    };
                    
                    // Initialize mobile slider with the same config
                    window.noUiSlider.create(mobileSlider, config);
                    
                    // Sync the mobile min/max display with the desktop values
                    const mobileMinValue = document.getElementById('mobile-min-value');
                    const mobileMaxValue = document.getElementById('mobile-max-value');
                    const desktopMinValue = document.getElementById('min-value');
                    const desktopMaxValue = document.getElementById('max-value');
                    
                    if (mobileMinValue && mobileMaxValue && desktopMinValue && desktopMaxValue) {
                        mobileMinValue.textContent = desktopMinValue.textContent;
                        mobileMaxValue.textContent = desktopMaxValue.textContent;
                    }
                    
                    // Update the mobile values when desktop slider changes
                    desktopSlider.noUiSlider.on('update', function(values) {
                        mobileSlider.noUiSlider.set(values);
                    });
                    
                    // Update the desktop values when mobile slider changes
                    mobileSlider.noUiSlider.on('update', function(values) {
                        desktopSlider.noUiSlider.set(values);
                    });
                }
            }, 100);
        }
        
        // Sync analysis tool buttons
        const analysisBtnPairs = [
            ['mobile-toggle-heatmap', 'toggle-heatmap'],
            ['mobile-toggle-zoning', 'toggle-zoning'],
            ['mobile-generate-report', 'generate-report'],
            ['mobile-export-data', 'export-data']
        ];
        
        analysisBtnPairs.forEach(function(pair) {
            const mobileBtn = document.getElementById(pair[0]);
            const desktopBtn = document.getElementById(pair[1]);
            
            if (mobileBtn && desktopBtn) {
                mobileBtn.addEventListener('click', function() {
                    desktopBtn.click();
                    filterPanel.classList.remove('expanded');
                });
            }
        });
    }
    
    /**
     * Initialize mobile property cards
     */
    function initMobilePropertyCards() {
        // Find all mobile property cards
        const propertyCards = document.querySelectorAll('.mobile-property-card');
        
        propertyCards.forEach(function(card) {
            // Add swipe-to-action functionality
            let startX = 0;
            let currentX = 0;
            
            card.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
                card.style.transition = 'none';
            });
            
            card.addEventListener('touchmove', function(e) {
                currentX = e.touches[0].clientX;
                const deltaX = currentX - startX;
                
                // Limit swipe to left only and maximum of 100px
                if (deltaX < 0 && deltaX > -100) {
                    card.style.transform = `translateX(${deltaX}px)`;
                }
            });
            
            card.addEventListener('touchend', function() {
                card.style.transition = 'transform 0.3s ease';
                
                // If swiped more than 40px, show actions
                if (startX - currentX > 40) {
                    card.classList.add('actions-visible');
                } else {
                    card.style.transform = '';
                }
            });
            
            // Close actions when clicking elsewhere
            document.addEventListener('click', function(e) {
                if (!card.contains(e.target) && card.classList.contains('actions-visible')) {
                    card.classList.remove('actions-visible');
                    card.style.transform = '';
                }
            });
        });
    }
    
    /**
     * Initialize mobile navigation
     */
    function initMobileNavigation() {
        // Handle scroll behavior for fixing headers
        const header = document.querySelector('.navbar');
        let lastScrollTop = 0;
        
        if (header) {
            window.addEventListener('scroll', function() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                if (scrollTop > lastScrollTop && scrollTop > 60) {
                    // Scrolling down
                    header.classList.add('navbar-hidden');
                } else {
                    // Scrolling up
                    header.classList.remove('navbar-hidden');
                }
                
                lastScrollTop = scrollTop;
            });
        }
        
        // Add active state to navbar links
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                navLinks.forEach(function(navLink) {
                    navLink.classList.remove('active');
                });
                
                link.classList.add('active');
            });
        });
    }
});