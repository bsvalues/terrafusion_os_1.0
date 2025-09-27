/**
 * Simple TerraFusion Components - Working fallback implementation
 */
import React from 'react';

// Simple working components with TerraFusion styling
export const TerraFusionGlobalStyles: React.FC = () => (
  <style>{`
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
    
    .tf-btn {
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-family: Inter, sans-serif;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      text-decoration: none;
    }
    
    .tf-btn-primary {
      background: #0099ff;
      color: white;
      border: none;
    }
    
    .tf-btn-secondary {
      background: transparent;
      color: #0099ff;
      border: 1px solid #0099ff;
    }
    
    .tf-btn-accent {
      background: #00ffaa;
      color: white;
      border: none;
    }
    
    .tf-btn-ghost {
      background: transparent;
      color: #888888;
      border: 1px solid transparent;
    }
    
    .tf-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 153, 255, 0.3);
    }
    
    .tf-card {
      background: rgba(26, 31, 58, 0.8);
      border: 1px solid rgba(0, 153, 255, 0.2);
      border-radius: 12px;
      padding: 24px;
      backdrop-filter: blur(10px);
    }
    
    .tf-card-elevated {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    
    .tf-card-transcendent {
      background: linear-gradient(135deg, rgba(0, 153, 255, 0.1) 0%, rgba(0, 255, 238, 0.1) 100%);
      border: 1px solid #00ffee;
    }
    
    .tf-heading {
      font-family: Inter, sans-serif;
      font-weight: 800;
      margin: 0 0 16px 0;
      color: #ffffff;
    }
    
    .tf-heading-gradient {
      background: linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .tf-flex {
      display: flex;
    }
  `}</style>
);

export const TFButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  [key: string]: any;
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  onClick, 
  style = {}, 
  ...props 
}) => (
  <button 
    className={`tf-btn tf-btn-${variant} tf-btn-${size}`}
    onClick={onClick}
    style={{
      ...(fullWidth ? { width: '100%' } : {}),
      ...style
    }}
    {...props}
  >
    {children}
  </button>
);

export const TFCard: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'transcendent';
  style?: React.CSSProperties;
  [key: string]: any;
}> = ({ children, variant = 'default', style = {}, ...props }) => (
  <div 
    className={`tf-card ${variant === 'elevated' ? 'tf-card-elevated' : ''} ${variant === 'transcendent' ? 'tf-card-transcendent' : ''}`}
    style={style}
    {...props}
  >
    {children}
  </div>
);

export const TFHeading: React.FC<{
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: boolean;
  style?: React.CSSProperties;
  [key: string]: any;
}> = ({ children, level = 2, gradient = false, style = {}, ...props }) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <HeadingTag 
      className={`tf-heading ${gradient ? 'tf-heading-gradient' : ''}`}
      style={style}
      {...props}
    >
      {children}
    </HeadingTag>
  );
};

export const TFFlex: React.FC<{
  children: React.ReactNode;
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: string;
  wrap?: boolean;
  style?: React.CSSProperties;
  [key: string]: any;
}> = ({ 
  children, 
  direction = 'row', 
  align = 'flex-start', 
  justify = 'flex-start', 
  gap = '0',
  wrap = false,
  style = {}, 
  ...props 
}) => (
  <div 
    className="tf-flex"
    style={{
      flexDirection: direction,
      alignItems: align,
      justifyContent: justify,
      gap: gap,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);
