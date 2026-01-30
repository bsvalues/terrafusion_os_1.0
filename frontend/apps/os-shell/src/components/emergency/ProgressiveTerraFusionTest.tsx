/**
 * TerraFusion Progressive Test
 * Test TerraFusion components step by step
 */
import { useState } from 'react';
import TerraFusionExcellenceProvider from '../../providers/TerraFusionExcellenceProvider.tsx';
import './ProgressiveTerraFusionTest.css';

export function ProgressiveTerraFusionTest() {
  const [testLevel, setTestLevel] = useState(1);

  const renderTest = () => {
    switch (testLevel) {
      case 1:
        return (
          <div className='tf-progressive-test-container'>
            <h1 className='tf-progressive-test-title tf-progressive-test-cyan'>
              🧪 Test Level 1: Basic React Component
            </h1>
            <p className='tf-progressive-test-desc tf-progressive-test-white'>
              If you can see this, basic React rendering is working.
            </p>
            <button
              onClick={() => setTestLevel(2)}
              className='tf-progressive-test-btn tf-progressive-test-btn-cyan'
            >
              Next: Test Excellence Provider
            </button>
          </div>
        );

      case 2:
        return (
          <TerraFusionExcellenceProvider>
            <div className='tf-progressive-test-container'>
              <h1 className='tf-progressive-test-title tf-progressive-test-cyan'>
                🧪 Test Level 2: Excellence Provider Working
              </h1>
              <p className='tf-progressive-test-desc tf-progressive-test-white'>
                If you can see this, TerraFusionExcellenceProvider is working.
              </p>
              <button
                onClick={() => setTestLevel(3)}
                className='tf-progressive-test-btn tf-progressive-test-btn-cyan'
              >
                Next: Test Full OS
              </button>
            </div>
          </TerraFusionExcellenceProvider>
        );

      case 3: {
        // Import the full TerraFusionQuantumOS dynamically
        const { TerraFusionQuantumOS } = require('../TerraFusionQuantumOS');
        return <TerraFusionQuantumOS />;
      }

      default:
        return (
          <div className='tf-progressive-test-container'>
            <h1 className='tf-progressive-test-title tf-progressive-test-red'>❌ Test Failed</h1>
            <button
              onClick={() => setTestLevel(1)}
              className='tf-progressive-test-btn tf-progressive-test-btn-red'
            >
              Restart Tests
            </button>
          </div>
        );
    }
  };

  return <div className='tf-progressive-test-fixed-bg'>{renderTest()}</div>;
}

<div className='tf-progressive-test-fixed-bg'></div>;
