/**
 * Loading State Component
 * Displays loading indicators with consistent styling
 */

import React from 'react';
import TerraCard from './TerraCard';
import TerraLoader from './TerraLoader';
import './LoadingState.css';

const LoadingState = ({ 
  message = 'Loading...', 
  fullPage = false,
  showCard = true 
}) => {
  const content = (
    <div className="loading-state">
      <TerraLoader size="large" />
      <p className="loading-message">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="loading-state-fullpage">
        {showCard ? <TerraCard>{content}</TerraCard> : content}
      </div>
    );
  }

  return showCard ? <TerraCard>{content}</TerraCard> : content;
};

export default LoadingState;
