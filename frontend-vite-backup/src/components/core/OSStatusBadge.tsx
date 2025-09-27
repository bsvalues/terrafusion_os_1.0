import React from 'react';

import {useOSConnection} from '../../hooks/useOSConnection';

import styles from './OSStatusBadge.module.css';

function statusColor(status: string) {switch (status) {
    case 'connected':
      return { bg: '#0f766e', dot: '#34d399', label: 'Connected'}; // teal/green
    case 'connecting':
      return {bg: '#1e3a8a', dot: '#60a5fa', label: 'Connecting'}; // blue
    case 'error':
      return {bg: '#7f1d1d', dot: '#f87171', label: 'Error'}; // red
    default:
      return {bg: '#111827', dot: '#9ca3af', label: 'Disconnected'}; // gray
  }
}

export const OSStatusBadge: React.FC = () =>{
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

  return (<div title={tooltip} className={badgeClass}><span aria-hidden className={dotClass} /><span className={styles.labelStrong}>OS Core</span><span className={styles.labelSubtle}>· {meta.label}</span></div>
  );
};

export default OSStatusBadge;
