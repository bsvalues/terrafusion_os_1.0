/**
 * BreadcrumbBar — file path breadcrumb navigation for TerraCanon.
 *
 * Renders clickable path segments: os-platform › core › pilot › handlers.ts
 * Last segment (filename) is non-clickable active item.
 */
import React from 'react';

export interface BreadcrumbBarProps {
  /** Full file path, e.g. "os-platform/core/pilot/handlers.ts" */
  filePath: string;
  /** Called when a directory segment is clicked, with its partial path */
  onSegmentClick?: (directoryPath: string) => void;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = React.memo(
  function BreadcrumbBar({ filePath, onSegmentClick }) {
    const segments = filePath.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    return (
      <nav className="canon-breadcrumb" data-testid="canon-breadcrumb" aria-label="File path">
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          const partialPath = segments.slice(0, i + 1).join('/');

          return (
            <React.Fragment key={partialPath}>
              {i > 0 && <span className="canon-breadcrumb__sep" aria-hidden="true">›</span>}
              {isLast ? (
                <span className="canon-breadcrumb__segment canon-breadcrumb__segment--active">
                  {segment}
                </span>
              ) : (
                <button
                  className="canon-breadcrumb__segment canon-breadcrumb__segment--dir"
                  onClick={() => onSegmentClick?.(partialPath)}
                  title={partialPath}
                >
                  {segment}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  },
);
