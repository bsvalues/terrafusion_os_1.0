import React, { useState, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';

import styles from './index.module.css';

interface HarrisPacsPluginProps {
  context: {
    moduleName: string;
    countyConfig: any;
    sessionId: string | null;
    os: {
      invoke: (_method: string, _payload?: any) => Promise<any>;
      emit: (_event: string, _data?: any) => void;
    };
  };
}

interface MigrationStatus {
  county: string;
  legacySystem: string;
  migrationStatus: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    pendingRecords: number;
    completionPercentage: number;
    lastImport: string;
    nextScheduledImport: string;
  };
  conversionMappings: {
    pacsParcelId: string;
    pacsOwnerRec: string;
    totalMapped: number;
    mappingErrors: number;
  };
}

const HarrisPacsPlugin: React.FC<HarrisPacsPluginProps> = ({ context }) => {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [importRunning, setImportRunning] = useState(false);

  useEffect(() => {
    loadImportStatus();
  }, []);

  const loadImportStatus = async () => {
    try {
      setLoading(true);
      const result = await context.os.invoke('harris.importStatus');
      setStatus(result);
    } catch (error) {
      console.error('Failed to load Harris PACS status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startImport = async () => {
    try {
      setImportRunning(true);
      const _result = await context.os.invoke('harris.startImport');
      // Import started successfully

      // Refresh status after starting import
      setTimeout(() => {
        loadImportStatus();
        setImportRunning(false);
      }, 2000);

      context.os.emit('harris.importStarted', _result);
    } catch (error) {
      // Failed to start import
      setImportRunning(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading Harris PACS migration status...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>


        <h2>Harris PACS 9.0 Migration</h2>
        <p

>Benton County Legacy System Integration</p>
      </div>

      {status && (
        <div>
          <div className={styles.statusGrid}>
            <div className={styles.statusCard}>


              <h3>Migration Progress</h3>
              <div

className={styles.progressBar}>


                <div
                  className={styles.progressFill}
                  style={{ width: `${status.migrationStatus.completionPercentage}%` }}
                />
              </div>
              <div

className={styles.progressText}>
                {status.migrationStatus.completionPercentage.toFixed(1)}% Complete
              </div>
            </div>

            <div className={styles.statusCard}>


              <h3>Record Status</h3>
              <div

className={styles.recordStats}>
                <div className={styles.stat}>


                  <span className={styles.statLabel}>Total:</span>
                  <span

className={styles.statValue}>
                    {status.migrationStatus.totalRecords.toLocaleString()}
                  </span>
                </div>
                <div className={styles.stat}>


                  <span className={styles.statLabel}>Valid:</span>
                  <span

className={`${styles.statValue} ${styles.valid}`}>
                    {status.migrationStatus.validRecords.toLocaleString()}
                  </span>
                </div>
                <div className={styles.stat}>


                  <span className={styles.statLabel}>Invalid:</span>
                  <span

className={`${styles.statValue} ${styles.invalid}`}>
                    {status.migrationStatus.invalidRecords.toLocaleString()}
                  </span>
                </div>
                <div className={styles.stat}>


                  <span className={styles.statLabel}>Pending:</span>
                  <span

className={`${styles.statValue} ${styles.pending}`}>
                    {status.migrationStatus.pendingRecords.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.statusCard}>


              <h3>System Mapping</h3>
              <div

className={styles.mappingInfo}>
                <div className={styles.mappingRow}>
                  <span>PACS Parcel ID → {status.conversionMappings.pacsParcelId}</span>
                </div>
                <div className={styles.mappingRow}>
                  <span>PACS Owner Rec → {status.conversionMappings.pacsOwnerRec}</span>
                </div>
                <div className={styles.mappingStats}>


                  <span>Mapped: {status.conversionMappings.totalMapped.toLocaleString()}</span>
                  <span

>Errors: {status.conversionMappings.mappingErrors}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>


            <button className={styles.primaryButton} onClick={startImport} disabled={importRunning}>
              {importRunning ? 'Starting Import...' : 'Start PACS Import'}
            </button>

            <button

className={styles.secondaryButton}
              onClick={loadImportStatus}
              disabled={loading}
            >
              Refresh Status
            </button>
          </div>

          <div className={styles.timeline}>
            <div className={styles.timelineItem}>


              <span className={styles.timelineLabel}>Last Import:</span>
              <span

className={styles.timelineValue}>
                {new Date(status.migrationStatus.lastImport).toLocaleString()}
              </span>
            </div>
            <div className={styles.timelineItem}>


              <span className={styles.timelineLabel}>Next Scheduled:</span>
              <span

className={styles.timelineValue}>
                {new Date(status.migrationStatus.nextScheduledImport).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  mount: async (el: HTMLElement, context: any) => {
    const root: Root = createRoot(el);
    root.render(<HarrisPacsPlugin context={context} />);
    (el as any).__tf_root = root;
  },
  unmount: async (el: HTMLElement) => {
    const root: Root | undefined = (el as any).__tf_root;
    try {
      root?.unmount();
    } catch {
      // Ignore unmount errors
    }
    delete (el as any).__tf_root;
  },
};
