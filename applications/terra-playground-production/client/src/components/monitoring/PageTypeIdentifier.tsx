import { useEffect } from 'react';

interface PageTypeIdentifierProps {
  /**
   * The type or identifier for this page, used for performance segmentation
   * Examples: 'dashboard', 'property-details', 'map-view', 'settings'
   */
  pageType: string;

  /**
   * Additional page attributes for more detailed segmentation
   * Examples: { complexity: 'high', hasMap: true, recordCount: '500+' }
   */
  attributes?: Record<string, string | boolean | number>;
}

/**
 * Helper component that adds data-page-type and other data attributes to the body
 * This allows the RealUserMonitoring component to segment performance data by page type
 *
 * Usage:
 * ```jsx
 * <PageTypeIdentifier pageType="property-editor" attributes={{ complexity: 'high' }} />
 * ```
 */
export function PageTypeIdentifier({ pageType, attributes = {} }: PageTypeIdentifierProps) {
  useEffect(() => {
    // Save previous page type to restore later
    const prevPageType = document.body.dataset.pageType;

    // Set page type
    document.body.dataset.pageType = pageType;

    // Set additional attributes
    Object.entries(attributes).forEach(([key, value]) => {
      document.body.dataset[`page${key.charAt(0).toUpperCase() + key.slice(1)}`] = String(value);
    });

    // Cleanup when unmounting
    return () => {
      if (prevPageType) {
        document.body.dataset.pageType = prevPageType;
      } else {
        delete document.body.dataset.pageType;
      }

      // Clean up additional attributes
      Object.keys(attributes).forEach(key => {
        delete document.body.dataset[`page${key.charAt(0).toUpperCase() + key.slice(1)}`];
      });
    };
  }, [pageType, attributes]);

  // This component doesn't render anything
  return null;
}

export default PageTypeIdentifier;
