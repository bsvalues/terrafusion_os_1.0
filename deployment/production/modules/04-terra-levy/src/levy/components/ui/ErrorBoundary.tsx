/**
 * ErrorBoundary - catches runtime errors and renders a fallback
 */

import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('LevyModule ErrorBoundary caught error', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="terra-glass rounded-lg p-6 border border-[#ff0055]/40 bg-[#ff0055]/10 text-[#ff9fbd]">
            <div className="font-semibold mb-1">A runtime error occurred.</div>
            <div className="text-sm opacity-80">Try reloading this view or checking recent inputs.</div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
