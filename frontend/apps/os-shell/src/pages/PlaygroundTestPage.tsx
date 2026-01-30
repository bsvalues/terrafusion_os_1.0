/**
 * Playground Testing Page
 * Championship-level validation interface for Phase 4 Playground
 */

import React from 'react';
import PlaygroundTester from '../components/playground/PlaygroundTester';

export const PlaygroundTestPage: React.FC = () => {
  return (
    <div className='min-h-screen bg-[var(--tf-bg-void)] p-8'>
      <PlaygroundTester />
    </div>
  );
};

export default PlaygroundTestPage;
