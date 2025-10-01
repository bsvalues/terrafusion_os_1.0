import styled from 'styled-components';

// TerraFusion OS Government Color Palette
export const COLORS = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: {
    500: '#10b981',
    600: '#059669',
  },
  warning: {
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    500: '#ef4444',
    600: '#dc2626',
  },
};

// TerraFusion Glass Morphism Card
export const TFCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px rgba(31, 38, 135, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

// TerraFusion Government Button
export const TFButton = styled.button<{ variant?: 'primary' | 'secondary' | 'outline' }>`
  background: ${props => {
    switch (props.variant) {
      case 'secondary':
        return `linear-gradient(135deg, ${COLORS.secondary[500]}, ${COLORS.secondary[600]})`;
      case 'outline':
        return 'transparent';
      default:
        return `linear-gradient(135deg, ${COLORS.primary[500]}, ${COLORS.primary[600]})`;
    }
  }};
  color: ${props => props.variant === 'outline' ? COLORS.primary[600] : 'white'};
  border: ${props => props.variant === 'outline' ? `2px solid ${COLORS.primary[500]}` : 'none'};
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
    ${props => props.variant === 'outline' && `
      background: ${COLORS.primary[500]};
      color: white;
    `}
  }

  &:active {
    transform: translateY(0);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

// Status Badge
export const StatusBadge = styled.span<{ status: 'active' | 'inactive' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  
  ${props => {
    switch (props.status) {
      case 'active':
        return `
          background: rgba(16, 185, 129, 0.1);
          color: ${COLORS.success[600]};
          border: 1px solid rgba(16, 185, 129, 0.2);
        `;
      case 'warning':
        return `
          background: rgba(245, 158, 11, 0.1);
          color: ${COLORS.warning[600]};
          border: 1px solid rgba(245, 158, 11, 0.2);
        `;
      default:
        return `
          background: rgba(239, 68, 68, 0.1);
          color: ${COLORS.error[600]};
          border: 1px solid rgba(239, 68, 68, 0.2);
        `;
    }
  }}
`;

// Loading Spinner
export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(14, 165, 233, 0.1);
  border-top: 3px solid ${COLORS.primary[500]};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
