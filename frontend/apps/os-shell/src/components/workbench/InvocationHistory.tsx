/**
 * InvocationHistory.tsx
 *
 * Phase 6.1: Shared component for displaying tool invocation history
 * Phase 6.2: Visual Renaissance materials adoption
 *
 * Used by: PropertyDossier, PropertyAtlas, PropertyForge, PropertyDais
 * Contract:
 * - Display list of invocation records (max 10)
 * - Show status icon (success/error)
 * - Show toolId, timestamp, truncated correlationId
 * - Copy button for full correlationId (TactileButton)
 * - Empty state when no records
 * - LiquidPanel wrapper with quality gate fallback
 */

import React, { useCallback } from 'react';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import { TactileButton } from '../../ui/materials/TactileButton';

export interface InvocationRecord {
  id: string;
  toolId: string;
  status: 'success' | 'error';
  correlationId: string;
  /** ISO string or Date — callers may pass either; component normalises before display */
  timestamp: string | Date;
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
    <LiquidPanel variant='infrastructure' radius='xl' className='p-5'>
      <h3 className='tf-text font-semibold mb-4 flex items-center gap-2'>
        <span>{icon}</span> {title}
      </h3>

      {displayRecords.length === 0 ? (
        <p className='tf-text-tertiary text-center py-4'>{emptyMessage}</p>
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
                    {new Date(record.timestamp).toLocaleTimeString()}
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
                <TactileButton
                  variant='ghost'
                  size='sm'
                  onClick={() => copyToClipboard(record.correlationId)}
                  title='Copy correlation ID'
                  aria-label='Copy correlation ID'
                >
                  Copy
                </TactileButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </LiquidPanel>
  );
};

export default InvocationHistory;
