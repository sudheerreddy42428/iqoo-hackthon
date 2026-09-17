import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  onCrash: (error: Error) => void;
}

interface State {
  hasError: boolean;
}

export class SimulatedAppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Simulated App Crash Intercepted:', error, errorInfo);
    this.props.onCrash(error);
  }

  public render() {
    if (this.state.hasError) {
      // The parent will typically navigate away, but in case it doesn't immediately:
      return (
        <div className="flex flex-col h-full items-center justify-center bg-dark-900 border border-rose-500/30 rounded-xl overflow-hidden p-6 text-center">
          <div className="text-3xl mb-4">💥</div>
          <h3 className="text-rose-400 font-bold mb-2">Simulated App Crashed</h3>
          <p className="text-xs text-slate-400">Capturing context and navigating to ReproX shell...</p>
        </div>
      );
    }

    return this.props.children;
  }
}
