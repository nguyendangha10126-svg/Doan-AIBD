import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { RefreshCw } from 'lucide-react';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
          <div className="max-w-md w-full bg-surface rounded-[28px] p-8 text-center shadow-pop border border-ink/10">
            <div className="text-5xl mb-4">🧸</div>
            <h2 className="text-2xl font-heading font-extrabold text-ink mb-2">
              Úi, có một chút trục trặc nhỏ!
            </h2>
            <p className="text-sm text-ink-soft mb-6 leading-relaxed">
              Bức tranh phép thuật đang cần nghỉ ngơi một chút. Hãy thử tải lại trang hoặc quay lại sau nhé!
            </p>
            <Button
              variant="primary"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Tải lại trang ngay
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

