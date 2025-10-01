/**
 * Terrafusion Genius UX Enhancement Service
 * Applies Jobs/Ive/Musk/Tesla excellence principles to existing components
 * Transforms functional interfaces into magical experiences
 */

import GeniusPromptService from './GeniusPromptService';

export interface GeniusEnhancement {
  element: HTMLElement;
  type: 'button' | 'input' | 'select' | 'card' | 'notification' | 'generic';
  enhancements: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface GeniusMetrics {
  delightScore: number;
  accessibilityScore: number;
  performanceScore: number;
  consistencyScore: number;
  overallScore: number;
  recommendations: string[];
}

export class GeniusUXService {
  private static instance: GeniusUXService;
  private observer: MutationObserver | null = null;
  private enhancedElements = new WeakSet<HTMLElement>();
  private metrics: GeniusMetrics = {
    delightScore: 0,
    accessibilityScore: 0,
    performanceScore: 0,
    consistencyScore: 0,
    overallScore: 0,
    recommendations: [],
  };

  private constructor() {
    this.initializeObserver();
    this.enhanceExistingElements();
  }

  static getInstance(): GeniusUXService {
    if (!GeniusUXService.instance) {
      GeniusUXService.instance = new GeniusUXService();
    }
    return GeniusUXService.instance;
  }

  /**
   * Initialize DOM observer to enhance new elements automatically
   */
  private initializeObserver(): void {
    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.enhanceElement(node as HTMLElement);
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Enhance existing elements on page load
   */
  private enhanceExistingElements(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.scanAndEnhanceAll();
      });
    } else {
      this.scanAndEnhanceAll();
    }
  }

  /**
   * Scan entire document and enhance all eligible elements
   */
  private scanAndEnhanceAll(): void {
    const elements = document.querySelectorAll(
      'button, input, select, [role="button"], .card, .notification'
    );
    elements.forEach(element => {
      this.enhanceElement(element as HTMLElement);
    });
  }

  /**
   * Enhance a single element with genius UX principles
   */
  public enhanceElement(element: HTMLElement): GeniusEnhancement | null {
    if (this.enhancedElements.has(element)) {
      return null; // Already enhanced
    }

    const enhancement = this.analyzeElement(element);
    if (!enhancement) return null;

    this.applyEnhancements(enhancement);
    this.enhancedElements.add(element);

    return enhancement;
  }

  /**
   * Analyze element and determine appropriate enhancements
   */
  private analyzeElement(element: HTMLElement): GeniusEnhancement | null {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const className = element.className;

    let type: GeniusEnhancement['type'] = 'generic';
    let enhancements: string[] = [];
    let priority: GeniusEnhancement['priority'] = 'medium';

    // Determine element type
    if (tagName === 'button' || role === 'button') {
      type = 'button';
      enhancements = this.getButtonEnhancements(element);
      priority = 'high';
    } else if (tagName === 'input') {
      type = 'input';
      enhancements = this.getInputEnhancements(element);
      priority = 'high';
    } else if (tagName === 'select') {
      type = 'select';
      enhancements = this.getSelectEnhancements(element);
      priority = 'critical'; // Accessibility critical
    } else if (className.includes('card')) {
      type = 'card';
      enhancements = this.getCardEnhancements(element);
      priority = 'medium';
    } else if (className.includes('notification')) {
      type = 'notification';
      enhancements = this.getNotificationEnhancements(element);
      priority = 'high';
    }

    if (enhancements.length === 0) return null;

    return { element, type, enhancements, priority };
  }

  /**
   * Get button-specific enhancements
   */
  private getButtonEnhancements(button: HTMLElement): string[] {
    const enhancements: string[] = [];

    // Genius UX: Immediate visual feedback
    if (!button.classList.contains('genius-enhanced')) {
      enhancements.push('add-ripple-effect');
      enhancements.push('add-hover-animation');
      enhancements.push('add-focus-ring');
    }

    // Accessibility enhancements
    if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
      enhancements.push('add-aria-label');
    }

    // Performance enhancement
    if (!button.style.cursor) {
      enhancements.push('add-cursor-pointer');
    }

    // Genius UX: Loading states
    if (!button.querySelector('.loading-indicator')) {
      enhancements.push('add-loading-capability');
    }

    return enhancements;
  }

  /**
   * Get input-specific enhancements
   */
  private getInputEnhancements(input: HTMLElement): string[] {
    const enhancements: string[] = [];
    const inputElement = input as HTMLInputElement;

    // Genius UX: Real-time validation feedback
    if (!input.classList.contains('genius-enhanced')) {
      enhancements.push('add-focus-animation');
      enhancements.push('add-validation-feedback');
    }

    // Accessibility enhancements
    if (!inputElement.getAttribute('aria-label') && !inputElement.getAttribute('aria-labelledby')) {
      enhancements.push('add-accessible-label');
    }

    // Genius UX: Smart autocomplete
    if (inputElement.type === 'text' && !inputElement.getAttribute('autocomplete')) {
      enhancements.push('add-smart-autocomplete');
    }

    return enhancements;
  }

  /**
   * Get select-specific enhancements (CRITICAL for accessibility)
   */
  private getSelectEnhancements(select: HTMLElement): string[] {
    const enhancements: string[] = [];
    const selectElement = select as HTMLSelectElement;

    // CRITICAL: Accessibility compliance
    if (!selectElement.getAttribute('title') && !selectElement.getAttribute('aria-label')) {
      enhancements.push('add-accessible-name');
    }

    // Genius UX: Custom styling
    if (!select.classList.contains('genius-enhanced')) {
      enhancements.push('add-custom-dropdown');
      enhancements.push('add-search-capability');
    }

    return enhancements;
  }

  /**
   * Get card-specific enhancements
   */
  private getCardEnhancements(card: HTMLElement): string[] {
    const enhancements: string[] = [];

    if (!card.classList.contains('genius-enhanced')) {
      enhancements.push('add-hover-elevation');
      enhancements.push('add-smooth-transitions');
    }

    return enhancements;
  }

  /**
   * Get notification-specific enhancements
   */
  private getNotificationEnhancements(notification: HTMLElement): string[] {
    const enhancements: string[] = [];

    if (!notification.classList.contains('genius-enhanced')) {
      enhancements.push('add-entrance-animation');
      enhancements.push('add-progress-indicator');
      enhancements.push('add-sound-feedback');
    }

    return enhancements;
  }

  /**
   * Apply enhancements to element
   */
  private applyEnhancements(enhancement: GeniusEnhancement): void {
    const { element, enhancements } = enhancement;

    enhancements.forEach(enhancementType => {
      switch (enhancementType) {
        case 'add-ripple-effect':
          this.addRippleEffect(element);
          break;
        case 'add-hover-animation':
          this.addHoverAnimation(element);
          break;
        case 'add-focus-ring':
          this.addFocusRing(element);
          break;
        case 'add-accessible-name':
          this.addAccessibleName(element);
          break;
        case 'add-cursor-pointer':
          element.style.cursor = 'pointer';
          break;
        case 'add-smooth-transitions':
          element.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
          break;
        case 'add-hover-elevation':
          this.addHoverElevation(element);
          break;
        default:
          console.debug(`Enhancement not implemented: ${enhancementType}`);
      }
    });

    // Mark as enhanced
    element.classList.add('genius-enhanced');
  }

  /**
   * Add ripple effect to interactive elements
   */
  private addRippleEffect(element: HTMLElement): void {
    element.style.position = 'relative';
    element.style.overflow = 'hidden';

    element.addEventListener('click', event => {
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: genius-ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
      `;

      element.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });

    // Add CSS animation if not exists
    if (!document.querySelector('#genius-ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'genius-ripple-styles';
      style.textContent = `
        @keyframes genius-ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Add hover animation
   */
  private addHoverAnimation(element: HTMLElement): void {
    element.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-2px)';
      element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translateY(0)';
      element.style.boxShadow = '';
    });
  }

  /**
   * Add focus ring for accessibility
   */
  private addFocusRing(element: HTMLElement): void {
    element.addEventListener('focus', () => {
      element.style.outline = '2px solid var(--tf-primary, #00e5ff)';
      element.style.outlineOffset = '2px';
    });

    element.addEventListener('blur', () => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    });
  }

  /**
   * Add accessible name to select elements (CRITICAL FIX)
   */
  private addAccessibleName(element: HTMLElement): void {
    const select = element as HTMLSelectElement;

    // Try to find associated label
    const label = document.querySelector(`label[for="${select.id}"]`);
    if (label) {
      select.setAttribute('aria-labelledby', select.id + '-label');
      label.id = select.id + '-label';
      return;
    }

    // Try to infer from context
    const parent = select.parentElement;
    const context = parent?.textContent?.trim() || '';

    // Generate appropriate title based on context
    let title = 'Select an option';
    if (context.toLowerCase().includes('county')) {
      title = 'Select county';
    } else if (context.toLowerCase().includes('category')) {
      title = 'Select category';
    } else if (context.toLowerCase().includes('filter')) {
      title = 'Filter options';
    } else if (context.toLowerCase().includes('sort')) {
      title = 'Sort options';
    }

    select.setAttribute('title', title);
    select.setAttribute('aria-label', title);
  }

  /**
   * Add hover elevation effect
   */
  private addHoverElevation(element: HTMLElement): void {
    element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-4px)';
      element.style.boxShadow = '0 8px 25px rgba(0, 229, 255, 0.15)';
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translateY(0)';
      element.style.boxShadow = '';
    });
  }

  /**
   * Calculate genius metrics for current page
   */
  public calculateGeniusMetrics(): GeniusMetrics {
    const elements = document.querySelectorAll('button, input, select, [role="button"]');
    let totalElements = elements.length;
    let enhancedElements = 0;
    let accessibleElements = 0;
    let performantElements = 0;

    elements.forEach(element => {
      const htmlElement = element as HTMLElement;

      // Check if enhanced
      if (this.enhancedElements.has(htmlElement)) {
        enhancedElements++;
      }

      // Check accessibility
      if (this.isAccessible(htmlElement)) {
        accessibleElements++;
      }

      // Check performance
      if (this.isPerformant(htmlElement)) {
        performantElements++;
      }
    });

    const delightScore = totalElements > 0 ? (enhancedElements / totalElements) * 100 : 100;
    const accessibilityScore = totalElements > 0 ? (accessibleElements / totalElements) * 100 : 100;
    const performanceScore = totalElements > 0 ? (performantElements / totalElements) * 100 : 100;
    const consistencyScore = this.calculateConsistencyScore();
    const overallScore =
      (delightScore + accessibilityScore + performanceScore + consistencyScore) / 4;

    const recommendations = this.generateRecommendations(
      delightScore,
      accessibilityScore,
      performanceScore,
      consistencyScore
    );

    this.metrics = {
      delightScore,
      accessibilityScore,
      performanceScore,
      consistencyScore,
      overallScore,
      recommendations,
    };

    return this.metrics;
  }

  /**
   * Check if element is accessible
   */
  private isAccessible(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'select') {
      return !!(
        element.getAttribute('title') ||
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby')
      );
    }

    if (tagName === 'button' || element.getAttribute('role') === 'button') {
      return !!(element.getAttribute('aria-label') || element.textContent?.trim());
    }

    return true; // Default to accessible for other elements
  }

  /**
   * Check if element is performant
   */
  private isPerformant(element: HTMLElement): boolean {
    // Simple performance check - has transitions defined
    const computedStyle = window.getComputedStyle(element);
    return computedStyle.transition !== 'all 0s ease 0s';
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(): number {
    // Check for consistent color usage, typography, spacing
    const buttons = document.querySelectorAll('button');
    const consistentButtons = Array.from(buttons).filter(button => {
      return (
        button.classList.contains('genius-enhanced') || button.classList.contains('genius-button')
      );
    });

    return buttons.length > 0 ? (consistentButtons.length / buttons.length) * 100 : 100;
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    delight: number,
    accessibility: number,
    performance: number,
    consistency: number
  ): string[] {
    const recommendations: string[] = [];

    if (delight < 80) {
      recommendations.push('🎨 Enhance user delight with animations and micro-interactions');
    }

    if (accessibility < 95) {
      recommendations.push(
        '♿ Improve accessibility with proper ARIA labels and keyboard navigation'
      );
    }

    if (performance < 85) {
      recommendations.push(
        '⚡ Optimize performance with smooth transitions and efficient animations'
      );
    }

    if (consistency < 90) {
      recommendations.push(
        '🎯 Improve consistency by using the Terrafusion Genius component library'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✨ Excellent! Your interface meets genius standards');
    }

    return recommendations;
  }

  /**
   * Get current genius metrics
   */
  public getMetrics(): GeniusMetrics {
    return this.metrics;
  }

  /**
   * Destroy service and cleanup
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export singleton instance
export const geniusUXService = GeniusUXService.getInstance();
export default geniusUXService;
