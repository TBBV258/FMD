import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary: Error caught:', error, errorInfo);
    
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      errorInfo,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error ID:', errorId);
      console.groupEnd();
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    console.log('🔄 ErrorBoundary: Retrying...');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleGoHome = () => {
    console.log('🏠 ErrorBoundary: Going home...');
    window.location.href = '/';
  };

  handleReportBug = () => {
    console.log('🐛 ErrorBoundary: Reporting bug...');
    
    const { error, errorInfo, errorId } = this.state;
    if (!error) return;

    // Create bug report content
    const bugReport = `
🚨 Bug Report - Error ID: ${errorId}

Error: ${error.message}
Stack: ${error.stack}

Component Stack: ${errorInfo?.componentStack}

User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim();

    // Copy to clipboard
    navigator.clipboard.writeText(bugReport).then(() => {
      alert('Bug report copied to clipboard! Please send it to the development team.');
    }).catch(() => {
      // Fallback: open email client
      const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`);
      const body = encodeURIComponent(bugReport);
      window.open(`mailto:dev@findmydocs.com?subject=${subject}&body=${body}`);
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Oops! Algo deu errado
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Encontramos um problema inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
              </p>

              {this.state.errorId && (
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    ID do Erro: <code className="font-mono">{this.state.errorId}</code>
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detalhes do Erro (Desenvolvimento)
                  </summary>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                    <div>
                      <strong>Mensagem:</strong>
                      <pre className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-x-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack do Componente:</strong>
                        <pre className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Tentar Novamente
                </Button>
                
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                  leftIcon={<Home className="w-4 h-4" />}
                >
                  Ir para Início
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={this.handleReportBug}
                className="w-full"
                leftIcon={<Bug className="w-4 h-4" />}
              >
                Reportar Bug
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
