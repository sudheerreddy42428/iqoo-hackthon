import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-rose-950/20 border border-rose-900/50 rounded-xl max-w-md mx-auto my-12 text-center animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-rose-950 flex items-center justify-center mb-4 shadow-lg shadow-rose-900/50">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-200 mb-2 font-mono">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-400 mb-6 font-mono leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred in the application interface.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-rose-900/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
