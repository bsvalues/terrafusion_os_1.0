import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime';
import React, { useState, useEffect } from 'react';

import styles from './index.module.css';
const HarrisPacsPlugin = ({ pluginApi }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importRunning, setImportRunning] = useState(false);
  useEffect(() => {
    loadImportStatus();
  }, []);
  const loadImportStatus = async () => {
    try {
      setLoading(true);
      const result = await pluginApi.invoke('harris.importStatus');
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
      const result = await pluginApi.invoke('harris.startImport');
      console.log('Import started:', result);
      // Refresh status after starting import
      setTimeout(() => {
        loadImportStatus();
        setImportRunning(false);
      }, 2000);
      pluginApi.emit('harris.importStarted', result);
    } catch (error) {
      console.error('Failed to start import:', error);
      setImportRunning(false);
    }
  };
  if (loading) {
    return _jsx('div', {
      className: styles.container,
      children: _jsx('div', {
        className: styles.loading,
        children: 'Loading Harris PACS migration status...',
      }),
    });
  }
  return _jsxs('div', {
    className: styles.container,
    children: [
      _jsxs('div', {
        className: styles.header,
        children: [
          _jsx('h2', { children: 'Harris PACS 9.0 Migration' }),
          _jsx('p', { children: 'Benton County Legacy System Integration' }),
        ],
      }),
      status &&
        _jsxs(_Fragment, {
          children: [
            _jsxs('div', {
              className: styles.statusGrid,
              children: [
                _jsxs('div', {
                  className: styles.statusCard,
                  children: [
                    _jsx('h3', { children: 'Migration Progress' }),
                    _jsx('div', {
                      className: styles.progressBar,
                      children: _jsx('div', {
                        className: styles.progressFill,
                        style: { width: `${status.migrationStatus.completionPercentage}%` },
                      }),
                    }),
                    _jsxs('div', {
                      className: styles.progressText,
                      children: [
                        status.migrationStatus.completionPercentage.toFixed(1),
                        '% Complete',
                      ],
                    }),
                  ],
                }),
                _jsxs('div', {
                  className: styles.statusCard,
                  children: [
                    _jsx('h3', { children: 'Record Status' }),
                    _jsxs('div', {
                      className: styles.recordStats,
                      children: [
                        _jsxs('div', {
                          className: styles.stat,
                          children: [
                            _jsx('span', { className: styles.statLabel, children: 'Total:' }),
                            _jsx('span', {
                              className: styles.statValue,
                              children: status.migrationStatus.totalRecords.toLocaleString(),
                            }),
                          ],
                        }),
                        _jsxs('div', {
                          className: styles.stat,
                          children: [
                            _jsx('span', { className: styles.statLabel, children: 'Valid:' }),
                            _jsx('span', {
                              className: `${styles.statValue} ${styles.valid}`,
                              children: status.migrationStatus.validRecords.toLocaleString(),
                            }),
                          ],
                        }),
                        _jsxs('div', {
                          className: styles.stat,
                          children: [
                            _jsx('span', { className: styles.statLabel, children: 'Invalid:' }),
                            _jsx('span', {
                              className: `${styles.statValue} ${styles.invalid}`,
                              children: status.migrationStatus.invalidRecords.toLocaleString(),
                            }),
                          ],
                        }),
                        _jsxs('div', {
                          className: styles.stat,
                          children: [
                            _jsx('span', { className: styles.statLabel, children: 'Pending:' }),
                            _jsx('span', {
                              className: `${styles.statValue} ${styles.pending}`,
                              children: status.migrationStatus.pendingRecords.toLocaleString(),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs('div', {
                  className: styles.statusCard,
                  children: [
                    _jsx('h3', { children: 'System Mapping' }),
                    _jsxs('div', {
                      className: styles.mappingInfo,
                      children: [
                        _jsx('div', {
                          className: styles.mappingRow,
                          children: _jsxs('span', {
                            children: [
                              'PACS Parcel ID \u2192 ',
                              status.conversionMappings.pacsParcelId,
                            ],
                          }),
                        }),
                        _jsx('div', {
                          className: styles.mappingRow,
                          children: _jsxs('span', {
                            children: [
                              'PACS Owner Rec \u2192 ',
                              status.conversionMappings.pacsOwnerRec,
                            ],
                          }),
                        }),
                        _jsxs('div', {
                          className: styles.mappingStats,
                          children: [
                            _jsxs('span', {
                              children: [
                                'Mapped: ',
                                status.conversionMappings.totalMapped.toLocaleString(),
                              ],
                            }),
                            _jsxs('span', {
                              children: ['Errors: ', status.conversionMappings.mappingErrors],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            _jsxs('div', {
              className: styles.actions,
              children: [
                _jsx('button', {
                  className: styles.primaryButton,
                  onClick: startImport,
                  disabled: importRunning,
                  children: importRunning ? 'Starting Import...' : 'Start PACS Import',
                }),
                _jsx('button', {
                  className: styles.secondaryButton,
                  onClick: loadImportStatus,
                  disabled: loading,
                  children: 'Refresh Status',
                }),
              ],
            }),
            _jsxs('div', {
              className: styles.timeline,
              children: [
                _jsxs('div', {
                  className: styles.timelineItem,
                  children: [
                    _jsx('span', { className: styles.timelineLabel, children: 'Last Import:' }),
                    _jsx('span', {
                      className: styles.timelineValue,
                      children: new Date(status.migrationStatus.lastImport).toLocaleString(),
                    }),
                  ],
                }),
                _jsxs('div', {
                  className: styles.timelineItem,
                  children: [
                    _jsx('span', { className: styles.timelineLabel, children: 'Next Scheduled:' }),
                    _jsx('span', {
                      className: styles.timelineValue,
                      children: new Date(
                        status.migrationStatus.nextScheduledImport
                      ).toLocaleString(),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ],
  });
};
export default HarrisPacsPlugin;
