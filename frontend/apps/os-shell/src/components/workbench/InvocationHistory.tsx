/**
 * InvocationHistory.tsx
 *
 * Phase 6.1: Shared component for displaying tool invocation history
 *
 * Used by: PropertyDossier, PropertyAtlas, PropertyForge, PropertyDais
 * Contract:
 * - Display list of invocation records (max 10)
 * - Show status icon (success/error)
 * - Show toolId, timestamp, truncated correlationId
 * - Copy button for full correlationId
 * - Empty state when no records
 */

import React, { useCallback } from 'react';

export interface InvocationRecord {
  id: string;
  toolId: string;
  status: 'success' | 'error';
  correlationId: string;
  timestamp: Date;
  errorCode?: string;
  /** Optional additional display info */
  meta?: Record<string, string | number>;
}

export interface InvocationHistoryProps {
  records: InvocationRecord[];
  title: string;
  icon?: string;
  emptyMessage?: string;
  /** Max records to display (default: 10) */
  maxRecords?: number;
}

export const InvocationHistory: React.FC<InvocationHistoryProps> = ({
  records,
  title,
  icon = '📜',
  emptyMessage = 'No invocations yet.',
  maxRecords = 10,
}) => {
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const displayRecords = records.slice(0, maxRecords);

  return (
    <div className='bg-white/5 rounded-xl p-5 border border-white/10'>
      <h3 className='text-white font-semibold mb-4 flex items-center gap-2'>
        <span>{icon}</span> {title}
      </h3>

      {displayRecords.length === 0 ? (
        <p className='text-white/40 text-center py-4'>{emptyMessage}</p>
      ) : (
        <div className='space-y-3'>
          {displayRecords.map((record) => (
            <div
              key={record.id}
              data-testid={`history-record-${record.id}`}
              className={`flex items-center justify-between p-3 rounded-lg ${
                record.status === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}
            >
              <div className='flex items-center gap-3'>
                <span className={record.status === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                  {record.status === 'success' ? '✅' : '❌'}
                </span>
                <div>
                  <code className='text-white/80 text-sm'>{record.toolId}</code>
                  <p className='text-white/40 text-xs'>
                    {record.timestamp.toLocaleTimeString()}
                    {record.meta &&
                      Object.entries(record.meta).map(([key, value]) => (
                        <span key={key}> • {value}</span>
                      ))}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <code className='text-xs text-white/50 bg-black/20 px-2 py-1 rounded'>
                  {record.correlationId.substring(0, 12)}...
                </code>
                <button
                  onClick={() => copyToClipboard(record.correlationId)}
                  className='px-2 py-1 text-xs bg-white/10 text-white/60 rounded hover:bg-white/20'
                  title='Copy correlation ID'
                  aria-label='Copy correlation ID'
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvocationHistory;
