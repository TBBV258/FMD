import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary: getDerivedStateFromError called with:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary: componentDidCatch called');
    console.error('🚨 ErrorBoundary: Error:', error);
    console.error('🚨 ErrorBoundary: Error info:', errorInfo);
    console.error('🚨 ErrorBoundary: Error stack:', error.stack);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    console.log('🎭 ErrorBoundary: render called, hasError:', this.state.hasError);
    
    if (this.state.hasError) {
      console.log('🚨 ErrorBoundary: Rendering error state');
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center">
              <div className="mb-6">
                <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Oops! Algo deu errado
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded text-left text-xs">
                  <details>
                    <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 text-red-600 dark:text-red-400 overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={this.handleRetry}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Tentar Novamente
                </Button>
                <Button 
                  variant="primary" 
                  onClick={this.handleReload}
                >
                  Recarregar Página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    console.log('✅ ErrorBoundary: Rendering children normally');
    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error handled:', error, errorInfo);
    
    // You can send to error reporting service here
    // e.g., Sentry, LogRocket, etc.
  };

  return handleError;
};
