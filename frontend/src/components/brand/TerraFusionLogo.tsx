import React from 'react';
import { Box, Typography } from '@mui/material';
import '../../assets/terrafusion-brand.css';

interface TerraFusionLogoProps {
  variant?: 'monogram' | 'embossed' | 'seal' | 'square' | 'browser';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  className?: string;
}

const TerraFusionLogo: React.FC<TerraFusionLogoProps> = ({
  variant = 'monogram',
  size = 'medium',
  animated = true,
  className = ''
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: '1.2rem', width: '32px', height: '32px' };
      case 'large':
        return { fontSize: '2.5rem', width: '96px', height: '96px' };
      default:
        return { fontSize: '1.8rem', width: '64px', height: '64px' };
    }
  };

  const sizeStyles = getSizeStyles();

  switch (variant) {
    case 'monogram':
      return (
        <Typography
          variant="h4"
          className={`tf-logo-monogram ${animated ? 'tf-holographic' : ''} ${className}`}
          sx={{ fontSize: sizeStyles.fontSize, fontWeight: 900 }}
        >
          TF
        </Typography>
      );

    case 'embossed':
      return (
        <Box
          className={`tf-logo-embossed ${animated ? 'tf-token-glow' : ''} ${className}`}
          sx={{ 
            width: sizeStyles.width, 
            height: sizeStyles.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography
            variant="h6"
            className="tf-logo-monogram"
            sx={{ fontSize: `${Number(sizeStyles.fontSize || 16) * 0.7}px`, fontWeight: 900 }}
          >
            TF
          </Typography>
        </Box>
      );

    case 'seal':
      return (
        <Box
          className={`tf-seal-badge ${animated ? 'tf-token-glow' : ''} ${className}`}
          sx={{ width: sizeStyles.width, height: sizeStyles.height }}
        >
          <Box className="tf-seal-text">
            <Typography variant="caption" sx={{ fontSize: '8px', fontWeight: 700 }}>
              TERRA
            </Typography>
            <br
/>
            <Typography variant="caption" sx={{ fontSize: '8px', fontWeight: 700 }}>
              FUSION
            </Typography>
          </Box>
        </Box>
      );

    case 'square':
      return (
        <Box
          className={`tf-square-badge ${animated ? 'tf-holographic' : ''} ${className}`}
          sx={{ width: sizeStyles.width, height: sizeStyles.height }}
        >
          <Typography
            variant="h6"
            className="tf-logo-monogram"
            sx={{ fontSize: `${Number(sizeStyles.fontSize || 16) * 0.6}px`, fontWeight: 900 }}
          >
            TF
          </Typography>
        </Box>
      );

    case 'browser':
      return (
        <Box className={`tf-browser-mockup ${className}`}>
          <Box className="tf-browser-dots">
            <Box className="tf-browser-dot close" />
            <Box className="tf-browser-dot minimize" />
            <Box className="tf-browser-dot maximize" />
          </Box>
          <Typography
variant="body2"
            className="tf-logo-monogram"
            sx={{ ml: 2, fontSize: '14px', fontWeight: 700 }}
          >
            Terrafusion OS
          </Typography>
        </Box>
      );

    default:
      return (
        <Typography
          variant="h4"
          className={`tf-logo-monogram ${className}`}
          sx={{ fontSize: sizeStyles.fontSize, fontWeight: 900 }}
        >
          TF
        </Typography>
      );
  }
};

export default TerraFusionLogo;
