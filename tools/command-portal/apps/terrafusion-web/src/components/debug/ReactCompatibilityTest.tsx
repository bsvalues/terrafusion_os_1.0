'use client'

import React from 'react'

/**
 * React 19 Compatibility Test Component
 * Tests basic React 19 features and rendering patterns
 */
const ReactCompatibilityTest: React.FC = () => {
  const [count, setCount] = React.useState(0)
  
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        React 19 Compatibility Test
      </h3>
      <p className="text-blue-700 mb-4">
        Testing React 19.1.0 rendering with @testing-library/react@16.3.0
      </p>
      <div className="space-y-2">
        <div data-testid="version-info">
          React Version: {React.version}
        </div>
        <div data-testid="counter-display">
          Count: {count}
        </div>
        <button 
          data-testid="increment-button"
          onClick={() => setCount(prev => prev + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Increment
        </button>
      </div>
    </div>
  )
}

export default ReactCompatibilityTest