/**
 * Terrafusion Platform - Navigation Component
 * 
 * This component provides a standardized navigation menu with
 * responsive behavior and active state tracking.
 */

class TerraFusionNavigation {
  constructor(elementId, options = {}) {
    this.element = document.getElementById(elementId);
    if (!this.element) {
      console.error(`Navigation element with ID "${elementId}" not found.`);
      return;
    }
    
    this.options = {
      activeClass: 'active',
      mobileBreakpoint: 768,
      enableBreadcrumbs: true,
      ...options
    };
    
    this.isMobile = window.innerWidth < this.options.mobileBreakpoint;
    this.isExpanded = false;
    
    this.init();
  }
  
  init() {
    // Create breadcrumbs if enabled
    if (this.options.enableBreadcrumbs) {
      this.createBreadcrumbs();
    }
    
    // Add mobile toggle button if in mobile mode
    if (this.isMobile) {
      this.createMobileToggle();
    }
    
    // Set initial active state
    this.updateActiveState();
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Add navigation state to Terrafusion state if available
    if (window.Terrafusion && window.Terrafusion.state) {
      const currentPage = document.body.getAttribute('data-page');
      if (currentPage) {
        window.Terrafusion.state.set('navigation', {
          currentPage,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  createMobileToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'tf-nav-toggle';
    toggle.setAttribute('aria-label', 'Toggle navigation menu');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    
    toggle.addEventListener('click', this.toggleNavigation.bind(this));
    
    this.element.parentNode.insertBefore(toggle, this.element);
    this.toggle = toggle;
  }
  
  toggleNavigation() {
    this.isExpanded = !this.isExpanded;
    
    if (this.isExpanded) {
      this.element.classList.add('expanded');
      this.toggle.classList.add('active');
      this.toggle.setAttribute('aria-expanded', 'true');
    } else {
      this.element.classList.remove('expanded');
      this.toggle.classList.remove('active');
      this.toggle.setAttribute('aria-expanded', 'false');
    }
  }
  
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < this.options.mobileBreakpoint;
    
    // Toggle changed from desktop to mobile
    if (!wasMobile && this.isMobile) {
      this.createMobileToggle();
      this.element.classList.remove('expanded');
    }
    
    // Toggle changed from mobile to desktop
    if (wasMobile && !this.isMobile) {
      if (this.toggle) {
        this.toggle.remove();
        this.toggle = null;
      }
      this.element.classList.remove('expanded');
      this.isExpanded = false;
    }
  }
  
  updateActiveState() {
    const currentUrl = window.location.pathname;
    const navLinks = this.element.querySelectorAll('a');
    
    navLinks.forEach(link => {
      const linkUrl = link.getAttribute('href');
      
      // Exact match
      if (linkUrl === currentUrl) {
        link.classList.add(this.options.activeClass);
        link.setAttribute('aria-current', 'page');
      }
      // Match for index page
      else if (currentUrl === '/' && (linkUrl === '/' || linkUrl === '/index.html')) {
        link.classList.add(this.options.activeClass);
        link.setAttribute('aria-current', 'page');
      }
      // Partial match for section
      else if (linkUrl !== '/' && currentUrl.startsWith(linkUrl)) {
        link.classList.add(this.options.activeClass);
        link.setAttribute('aria-current', 'true');
      }
      else {
        link.classList.remove(this.options.activeClass);
        link.removeAttribute('aria-current');
      }
    });
  }
  
  createBreadcrumbs() {
    const breadcrumbsContainer = document.querySelector('.tf-breadcrumb');
    if (!breadcrumbsContainer) return;
    
    const currentUrl = window.location.pathname;
    const navLinks = this.element.querySelectorAll('a');
    
    let breadcrumbs = [
      { url: '/', title: 'Home' }
    ];
    
    // Find matching navigation items for current URL
    let bestMatch = null;
    let bestMatchLength = 0;
    
    navLinks.forEach(link => {
      const linkUrl = link.getAttribute('href');
      if (linkUrl === '/' || linkUrl === '/index.html') return;
      
      if (currentUrl.startsWith(linkUrl) && linkUrl.length > bestMatchLength) {
        bestMatch = link;
        bestMatchLength = linkUrl.length;
      }
    });
    
    // If we found a match, add it to breadcrumbs
    if (bestMatch) {
      breadcrumbs.push({
        url: bestMatch.getAttribute('href'),
        title: bestMatch.textContent.trim()
      });
    }
    
    // Add current page if it's a subpage
    const pageTitleElement = document.querySelector('h1, h2, h3, .page-title');
    if (pageTitleElement && bestMatch && currentUrl !== bestMatch.getAttribute('href')) {
      breadcrumbs.push({
        url: currentUrl,
        title: pageTitleElement.textContent.trim()
      });
    }
    
    // Generate breadcrumbs HTML
    let breadcrumbsHtml = '';
    breadcrumbs.forEach((crumb /* , index */) => {
      if (index === breadcrumbs.length - 1) {
        breadcrumbsHtml += `<li class="tf-breadcrumb-item active" aria-current="page">${crumb.title}</li>`;
      } else {
        breadcrumbsHtml += `<li class="tf-breadcrumb-item"><a href="${crumb.url}">${crumb.title}</a></li>`;
      }
    });
    
    breadcrumbsContainer.innerHTML = breadcrumbsHtml;
  }
}

// Initialize navigation on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize primary navigation if it exists
  if (document.getElementById('main-nav')) {
    new TerraFusionNavigation('main-nav');
  }
});

// Export navigation component to global namespace
window.Terrafusion = window.Terrafusion || {};
window.Terrafusion.components = window.Terrafusion.components || {};
window.Terrafusion.components.Navigation = TerraFusionNavigation;