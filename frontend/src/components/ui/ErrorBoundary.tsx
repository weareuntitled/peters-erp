import React, { ReactNode, useState, useEffect } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-4xl text-red-500">❌</div>
          <h2 className="font-heading text-xl font-semibold text-zinc-900">
            Ein Fehler ist aufgetreten
          </h2>
          <p className="text-sm text-slate-500 max-w-md text-center">
            {this.state.error?.message || 'Unbekannter Fehler'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Seite neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Page-level error boundary wrapper
export const withErrorBoundary = (Component: React.ComponentType) => {
  return (props: any) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
};
