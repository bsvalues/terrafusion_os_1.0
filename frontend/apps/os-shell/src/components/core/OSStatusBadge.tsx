import React from 'react';

import { useOSConnection } from '../../hooks/useOSConnection';

import styles from './OSStatusBadge.module.css';

function statusColor(status: string) {
  switch (status) {
    case 'connected':
      return { bg: 'var(--tf-status-teal-dark)', dot: 'var(--tf-status-teal-light)', label: 'Connected' }; // teal/green
    case 'connecting':
      return { bg: 'var(--tf-status-blue-dark)', dot: 'var(--tf-status-blue-light)', label: 'Connecting' }; // blue
    case 'error':
      return { bg: 'var(--tf-status-red-dark)', dot: 'var(--tf-status-red-light)', label: 'Error' }; // red
    default:
      return { bg: 'var(--gray-900)', dot: 'var(--gray-400)', label: 'Disconnected' }; // gray
  }
}

export const OSStatusBadge: React.FC = () => {
  const state = useOSConnection();
  const meta = statusColor(state.status);

  const tooltip = [
    `Status: ${meta.label}`,
    state.authenticated ? 'Auth: yes' : 'Auth: no',
    state.sessionId ? `Session: ${state.sessionId}` : 'Session: none',
    typeof state.reconnectAttempts === 'number' ? `Retries: ${state.reconnectAttempts}` : undefined,
    state.lastError ? `Last Error: ${state.lastError}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');

  const statusKey = (meta.label || 'Disconnected').toLowerCase();
  const badgeClass = `${styles.badge} ${styles[statusKey as 'connected' | 'connecting' | 'error' | 'disconnected']}`;
  const dotClass = `${styles.dot} ${styles[statusKey as 'connected' | 'connecting' | 'error' | 'disconnected']}`;

  return (
    <div title={tooltip} className={badgeClass}>
      <span aria-hidden className={dotClass} />

      <span className={styles.labelStrong}>OS Core</span>
      <span className={styles.labelSubtle}>· {meta.label}</span>
    </div>
  );
};

export default OSStatusBadge;
