import React from 'react';
import { useRouter } from 'next/router';
import { OnboardingForm } from '../components/OnboardingForm';
import { useTheme } from 'next-themes';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const { pdfUrl } = await response.json();
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
<>
          <h1
            className={`text-3xl font-bold mb-8 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            County Onboarding
          </h1>
          <OnboardingForm
</> onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage; 