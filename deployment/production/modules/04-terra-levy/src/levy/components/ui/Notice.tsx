/**
 * Notice banner for success/warning/error messages
 */

import React from 'react';

export const Notice: React.FC<{
  kind?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}> = ({ kind = 'info', children }) => {
  const styles: Record<string, string> = {
    info: 'bg-[#0099ff]/15 border-[#0099ff]/40 text-[#8ecaff]',
    success: 'bg-[#00ffaa]/15 border-[#00ffaa]/40 text-[#a3ffdd]',
    warning: 'bg-[#ffaa00]/15 border-[#ffaa00]/40 text-[#ffd28c]',
    error: 'bg-[#ff0055]/15 border-[#ff0055]/40 text-[#ff9fbd]',
  };
  return (
    <div className={`rounded border p-3 text-sm ${styles[kind]}`} role="status" aria-live="polite">
      {children}
    </div>
  );
};
