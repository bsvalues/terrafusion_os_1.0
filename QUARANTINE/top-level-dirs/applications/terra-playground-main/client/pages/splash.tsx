import React from 'react';
import { useRouter } from 'next/router';
import { Branding } from '../components/Branding';
import { brandingConfig } from '../config/branding';

const SplashPage: React.FC = () => {
  const router = useRouter();

  const handleAnimationComplete = () => {
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <Branding
      config={brandingConfig}
      onAnimationComplete={handleAnimationComplete}
    />
  );
};

export default SplashPage; 