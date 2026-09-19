import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ReproxErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ReproX Platform Error:', error, errorInfo);
  }

  private handleRecover = () => {
    // Attempt recovery by clearing potential bad state
    sessionStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] w-full bg-dark-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-dark-900 border border-rose-500/30 rounded-xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-bold text-white">REPROX PLATFORM ERROR</h1>
            <p className="text-sm text-slate-300">
              Something went wrong in the ReproX debugging interface itself (not the simulated application).
            </p>
            <div className="bg-dark-950 border border-slate-800 p-3 rounded text-left overflow-auto max-h-32 text-xs font-mono text-rose-400">
              {this.state.error?.message || 'Unknown internal error'}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleRecover}
                className="flex-1 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recover & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
