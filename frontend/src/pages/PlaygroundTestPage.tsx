/**
 * Playground Testing Page
 * Championship-level validation interface for Phase 4 Playground
 */

import React from 'react';
import PlaygroundTester from '../components/playground/PlaygroundTester';

export const PlaygroundTestPage: React.FC = () => {
  return (
    <div className='min-h-screen bg-[#0A0E1A] p-8'>
      <PlaygroundTester />
    </div>
  );
};

export default PlaygroundTestPage;
