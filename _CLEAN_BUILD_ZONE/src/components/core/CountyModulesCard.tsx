import React from 'react';

import { useCountyConfig } from '../../hooks/useCountyConfig';

import styles from './CountyModulesCard.module.css';

export const CountyModulesCard: React.FC = () => {
  const { config, loading } = useCountyConfig();

  if (loading) {
    return <div className='tf-card'>Loading county configuration…</div>;
  }
  if (!config) {
    return <div className='tf-card tf-card-error'>No county configuration found.</div>;
  }
  if (config.error) {
    return <div className='tf-card tf-card-error'>Error: {config.error}</div>;
  }

  const modules = config.requiredModules || [];

  return (
    <div className='tf-card'>
      <div className='tf-card-header'>


        <h3 className={styles.headerTitle}>County Configuration</h3>
        <small

className={styles.headerSubtle}>
          County: {config.countyId || 'benton'} — Legacy: {config.legacySystem || 'PACS_9.0'}
        </small>
      </div>
      <div className='tf-card-body'>
        <div className={styles.sectionTitle}>Enabled Modules</div>
        {modules.length === 0 ? (
          <div className={styles.muted}>No modules listed.</div>
        ) : (
          <ul>
            {modules.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CountyModulesCard;
