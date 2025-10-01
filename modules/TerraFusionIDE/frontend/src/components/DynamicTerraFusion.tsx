/**
 * Dynamic TerraFusion Components
 * Runtime component resolution from parent TerraFusion system
 */
import React, { useEffect, useState } from 'react';
import { ComponentLoader } from '../utils/ComponentLoader';

// Dynamic component wrapper
export const useTerraFusionComponent = (componentName: string) => {
  const [Component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        const loader = ComponentLoader.getInstance();
        const component = await loader.loadComponent(componentName);
        setComponent(() => component);
        setError(null);
      } catch (err) {
        setError(`Failed to load ${componentName}: ${err}`);
        console.error(`Component loading error for ${componentName}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [componentName]);

  return { Component, loading, error };
};

// Dynamic TerraFusion system hook
export const useTerraFusionSystem = () => {
  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSystem = async () => {
      try {
        const loader = ComponentLoader.getInstance();
        await loader.preloadEssentialComponents();
        const terraFusionSystem = await loader.loadTerraFusionSystem();
        setSystem(terraFusionSystem);
      } catch (error) {
        console.error('Failed to load TerraFusion system:', error);
        // Use fallback system with proper React components
        setSystem({
          TerraFusionGlobalStyles: () => React.createElement('style', {}, `
            :root {
              --tf-color-primary: #0099ff;
              --tf-color-accent: #00ffaa;
              --tf-color-transcend: #00ffee;
              --tf-color-dark: #0b1020;
              --tf-color-light: #ffffff;
              --tf-color-gray: #888888;
              --tf-spacing-xs: 4px;
              --tf-spacing-sm: 8px;
              --tf-spacing-md: 16px;
              --tf-spacing-lg: 24px;
              --tf-radius-md: 8px;
              --tf-radius-lg: 12px;
            }
          `),
          TFButton: ({ children, variant = 'primary', size = 'md', ...props }: any) => 
            React.createElement('button', { 
              className: `tf-btn tf-btn-${variant} tf-btn-${size}`, 
              style: {
                padding: '8px 16px',
                background: variant === 'primary' ? '#0099ff' : variant === 'secondary' ? 'transparent' : '#00ffaa',
                color: variant === 'secondary' ? '#0099ff' : 'white',
                border: variant === 'secondary' ? '1px solid #0099ff' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...props.style
              },
              ...props 
            }, children),
          TFCard: ({ children, variant = 'default', ...props }: any) => 
            React.createElement('div', { 
              className: `tf-card tf-card-${variant}`,
              style: {
                background: 'rgba(26, 31, 58, 0.8)',
                border: '1px solid rgba(0, 153, 255, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                backdropFilter: 'blur(10px)',
                ...props.style
              },
              ...props 
            }, children),
          TFHeading: ({ children, level = 2, gradient = false, ...props }: any) => 
            React.createElement(`h${level}`, { 
              className: `tf-heading tf-heading-${level}`,
              style: {
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                margin: '0 0 16px 0',
                ...(gradient ? {
                  background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                } : { color: '#ffffff' }),
                ...props.style
              },
              ...props 
            }, children),
          TFFlex: ({ children, direction = 'row', align = 'flex-start', justify = 'flex-start', gap = '0', ...props }: any) => 
            React.createElement('div', { 
              className: 'tf-flex',
              style: {
                display: 'flex',
                flexDirection: direction,
                alignItems: align,
                justifyContent: justify,
                gap: gap,
                ...props.style
              },
              ...props 
            }, children)
        });
      } finally {
        setLoading(false);
      }
    };

    loadSystem();
  }, []);

  return { system, loading };
};

// Component factory for dynamic creation
export const createDynamicComponent = (componentName: string) => {
  return React.forwardRef<any, any>((props, ref) => {
    const { Component, loading, error } = useTerraFusionComponent(componentName);

    if (loading) {
      return <div className="tf-loading">Loading {componentName}...</div>;
    }

    if (error) {
      return <div className="tf-error">Error loading {componentName}: {error}</div>;
    }

    if (!Component) {
      return <div className="tf-fallback">Component {componentName} not available</div>;
    }

    return <Component ref={ref} {...props} />;
  });
};

// Pre-built dynamic components
export const DynamicTFButton = createDynamicComponent('TFButton');
export const DynamicTFCard = createDynamicComponent('TFCard');
export const DynamicTFHeading = createDynamicComponent('TFHeading');
export const DynamicTFFlex = createDynamicComponent('TFFlex');
export const DynamicTFInput = createDynamicComponent('TFInput');
export const DynamicTFText = createDynamicComponent('TFText');
