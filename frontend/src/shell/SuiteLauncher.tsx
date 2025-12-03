/**
 * TerraFusion Suite Launcher
 *
 * Clean "home screen" for suite selection.
 * Reads from suite manifest and displays tiles.
 */

import React, { useState } from 'react';
import { SUITES, getSuitesByCategory } from '../suites';
import { SuiteManifest } from '../suites/types';
import { SuiteTile } from './SuiteTile';

interface SuiteLauncherProps {
  onOpenSuite?: (id: string) => void;
  onShowDetails?: (id: string) => void;
  userPermissions?: string[];
}

export const SuiteLauncher: React.FC<SuiteLauncherProps> = ({
  onOpenSuite,
  onShowDetails,
  userPermissions = ['ROLE_SYSADMIN'], // Default: show all suites
}) => {
  const [filterCategory, setFilterCategory] = useState<SuiteManifest['category'] | 'all'>('all');

  const handleOpenSuite = (id: string) => {
    if (onOpenSuite) {
      onOpenSuite(id);
    } else {
      // Default: navigate to suite route
      window.location.hash = `#/suite/${id}`;
    }
  };

  const handleShowDetails = (id: string) => {
    if (onShowDetails) {
      onShowDetails(id);
    } else {
      // Default: show alert with suite info
      const suite = SUITES.find((s) => s.id === id);
      if (suite) {
        console.log('Suite details:', suite);
      }
    }
  };

  // Filter suites
  const filteredSuites = filterCategory === 'all' ? SUITES : getSuitesByCategory(filterCategory);

  // Group by category for visual organization
  const coreSuites = filteredSuites.filter((s) => s.category === 'core');
  const premiumSuites = filteredSuites.filter((s) => s.category === 'premium');
  const adminSuites = filteredSuites.filter((s) => s.category === 'admin');

  return (
    <section
      className='suite-launcher quantum-grid-pattern'
      style={{
        padding: 'var(--tf-space-6)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <header
        style={{
          marginBottom: 'var(--tf-space-8)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--tf-space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--tf-text-3xl)',
              fontWeight: 'var(--tf-weight-bold)',
              color: 'var(--tf-color-text-primary)',
              marginBottom: 'var(--tf-space-2)',
            }}
          >
            TerraFusion Suites
          </h1>
          <p
            style={{
              fontSize: 'var(--tf-text-base)',
              color: 'var(--tf-color-text-secondary)',
              lineHeight: 'var(--tf-leading-relaxed)',
            }}
          >
            Choose a suite to open its workspace. All data is coordinated through TF-Substrate and
            your county backend.
          </p>
        </div>

        {/* Filter buttons */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--tf-space-2)',
            flexWrap: 'wrap',
          }}
        >
          {(['all', 'core', 'premium', 'admin'] as const).map((cat) => (
            <button
              key={cat}
              className={`tf-btn ${filterCategory === cat ? 'tf-btn-primary' : 'tf-btn-secondary'}`}
              onClick={() => setFilterCategory(cat)}
              style={{
                textTransform: 'capitalize',
              }}
            >
              {cat === 'all' ? 'All Suites' : `${cat}`}
            </button>
          ))}
        </div>
      </header>

      {/* Core Suites */}
      {coreSuites.length > 0 && (
        <div style={{ marginBottom: 'var(--tf-space-8)' }}>
          <h2
            style={{
              fontSize: 'var(--tf-text-xl)',
              fontWeight: 'var(--tf-weight-semibold)',
              color: 'var(--tf-color-text-primary)',
              marginBottom: 'var(--tf-space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--tf-space-2)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--tf-color-primary)',
              }}
            />
            Core Suites
          </h2>
          <div
            className='suite-grid'
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--tf-space-6)',
            }}
          >
            {coreSuites.map((suite) => (
              <SuiteTile
                key={suite.id}
                suite={suite}
                onOpen={handleOpenSuite}
                onShowDetails={handleShowDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Premium Suites */}
      {premiumSuites.length > 0 && (
        <div style={{ marginBottom: 'var(--tf-space-8)' }}>
          <h2
            style={{
              fontSize: 'var(--tf-text-xl)',
              fontWeight: 'var(--tf-weight-semibold)',
              color: 'var(--tf-color-text-primary)',
              marginBottom: 'var(--tf-space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--tf-space-2)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#8B5CF6',
              }}
            />
            Premium Suites
          </h2>
          <div
            className='suite-grid'
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--tf-space-6)',
            }}
          >
            {premiumSuites.map((suite) => (
              <SuiteTile
                key={suite.id}
                suite={suite}
                onOpen={handleOpenSuite}
                onShowDetails={handleShowDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Admin Suites */}
      {adminSuites.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: 'var(--tf-text-xl)',
              fontWeight: 'var(--tf-weight-semibold)',
              color: 'var(--tf-color-text-primary)',
              marginBottom: 'var(--tf-space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--tf-space-2)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#6B7280',
              }}
            />
            Admin Suites
          </h2>
          <div
            className='suite-grid'
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--tf-space-6)',
            }}
          >
            {adminSuites.map((suite) => (
              <SuiteTile
                key={suite.id}
                suite={suite}
                onOpen={handleOpenSuite}
                onShowDetails={handleShowDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredSuites.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--tf-space-12)',
            color: 'var(--tf-color-text-tertiary)',
          }}
        >
          <div style={{ fontSize: 'var(--tf-text-4xl)', marginBottom: 'var(--tf-space-4)' }}>
            🔍
          </div>
          <p style={{ fontSize: 'var(--tf-text-lg)' }}>No suites found in this category</p>
        </div>
      )}
    </section>
  );
};
