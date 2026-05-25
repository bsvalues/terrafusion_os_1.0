import React from 'react';

/**
 * DcfPanel — Discounted Cash Flow Panel.
 * Displays availability status until governed income data is configured.
 */
export const DcfPanel: React.FC = () => (
  <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
    Discounted Cash Flow analysis available when income data is configured.
  </div>
);
