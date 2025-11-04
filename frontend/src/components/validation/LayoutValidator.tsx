/**
 * TerraFusion Layout Validation Component
 * Ensures proper coordination between all OS components
 */
import { useEffect, useState } from 'react';

interface LayoutMetrics {
  viewportWidth: number;
  viewportHeight: number;
  scrollHeight: number;
  hasOverflow: boolean;
  zIndexConflicts: boolean;
  atlasPosition: { x: number; y: number };
  togglePosition: { x: number; y: number };
}

export function LayoutValidator() {
  const [metrics, setMetrics] = useState<LayoutMetrics | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    const validateLayout = () => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      const osContainer = document.querySelector('.terrafusion-quantum-os');
      const atlasContainer = document.querySelector('.atlas-container');
      const toggleButton = document.querySelector('.terrafusion-view-toggle');
      const mainContent = document.querySelector('.terrafusion-main-content');

      const newIssues: string[] = [];

      // Check OS container
      if (!osContainer) {
        newIssues.push('❌ OS Container not found');
      } else {
        const osRect = osContainer.getBoundingClientRect();
        if (osRect.width !== viewport.width || osRect.height !== viewport.height) {
          newIssues.push('⚠️ OS Container size mismatch');
        }
      }

      // Check ATLAS positioning
      if (!atlasContainer) {
        newIssues.push('❌ ATLAS Container not found');
      } else {
        const atlasRect = atlasContainer.getBoundingClientRect();
        const atlasStyle = window.getComputedStyle(atlasContainer);
        if (atlasStyle.position !== 'fixed') {
          newIssues.push('⚠️ ATLAS not properly positioned');
        }
      }

      // Check toggle button
      if (!toggleButton) {
        newIssues.push('❌ Toggle Button not found');
      } else {
        const toggleStyle = window.getComputedStyle(toggleButton);
        if (toggleStyle.position !== 'fixed') {
          newIssues.push('⚠️ Toggle Button not properly positioned');
        }
      }

      // Check main content
      if (!mainContent) {
        newIssues.push('❌ Main Content not found');
      } else {
        const contentRect = mainContent.getBoundingClientRect();
        if (contentRect.height !== viewport.height) {
          newIssues.push('⚠️ Main Content height mismatch');
        }
      }

      // Check for overflow issues
      const body = document.body;
      const html = document.documentElement;
      const hasOverflow =
        body.scrollHeight > viewport.height || html.scrollHeight > viewport.height;

      if (hasOverflow) {
        newIssues.push('⚠️ Unexpected page overflow detected');
      }

      // Update metrics
      setMetrics({
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        scrollHeight: Math.max(body.scrollHeight, html.scrollHeight),
        hasOverflow,
        zIndexConflicts: false, // TODO: Implement z-index conflict detection
        atlasPosition: atlasContainer
          ? (() => {
              const rect = atlasContainer.getBoundingClientRect();
              return { x: rect.right, y: rect.bottom };
            })()
          : { x: 0, y: 0 },
        togglePosition: toggleButton
          ? (() => {
              const rect = toggleButton.getBoundingClientRect();
              return { x: rect.left, y: rect.top };
            })()
          : { x: 0, y: 0 },
      });

      setIssues(newIssues);
    };

    // Initial validation
    validateLayout();

    // Validate on resize
    window.addEventListener('resize', validateLayout);

    // Validate periodically
    const interval = setInterval(validateLayout, 5000);

    return () => {
      window.removeEventListener('resize', validateLayout);
      clearInterval(interval);
    };
  }, []);

  if (!metrics) {
    return (
      <div className='fixed top-20 left-4 z-[1300] bg-black/80 text-terra-cyan p-4 rounded-lg border border-terra-cyan/30'>
        <div className='text-sm'>🔄 Layout Validation Initializing...</div>
      </div>
    );
  }

  return (
    <div className='fixed top-20 left-4 z-[1300] bg-black/90 text-terra-cyan p-4 rounded-lg border border-terra-cyan/30 backdrop-blur-lg'>
      <h3 className='text-lg font-bold text-terra-cyan mb-2'>🏛️ Layout Validation</h3>

      <div className='space-y-2 text-sm'>
        <div>
          <span className='text-terra-cyan/70'>Viewport:</span> {metrics.viewportWidth}×
          {metrics.viewportHeight}
        </div>

        <div>
          <span className='text-terra-cyan/70'>Scroll Height:</span> {metrics.scrollHeight}px
        </div>

        <div>
          <span className='text-terra-cyan/70'>ATLAS Position:</span> {metrics.atlasPosition.x},{' '}
          {metrics.atlasPosition.y}
        </div>

        <div>
          <span className='text-terra-cyan/70'>Toggle Position:</span> {metrics.togglePosition.x},{' '}
          {metrics.togglePosition.y}
        </div>
      </div>

      {issues.length > 0 && (
        <div className='mt-4 space-y-1'>
          <div className='text-orange-400 font-semibold'>Layout Issues:</div>
          {issues.map((issue, index) => (
            <div key={index} className='text-xs text-orange-300'>
              {issue}
            </div>
          ))}
        </div>
      )}

      {issues.length === 0 && (
        <div className='mt-4 text-green-400 text-sm font-semibold'>
          ✅ Layout Optimal - Government Excellence Achieved
        </div>
      )}
    </div>
  );
}

export default LayoutValidator;
