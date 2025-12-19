// Error Handling System for FindMyDocs
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.setupGlobalErrorHandling();
    }

    /**
     * Handle errors with context and user-friendly messages
     * @param {Error} error - The error object
     * @param {string} context - Context where the error occurred
     * @param {Object} additionalData - Additional data to log
     */
    static handle(error, context, additionalData = {}) {
        const errorHandler = window.errorHandler || new ErrorHandler();
        return errorHandler.handleError(error, context, additionalData);
    }

    /**
     * Handle error with logging and user notification
     */
    handleError(error, context, additionalData = {}) {
        // Log error details
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: window.currentUser?.id || 'anonymous',
            ...additionalData
        };

        // Add to error log
        this.addToLog(errorDetails);

        // Send to error tracking service (if available)
        this.trackError(errorDetails);

        // Show user-friendly message
        this.showUserMessage(error, context);

        // Log to console in development
        if (this.isDevelopment()) {
            console.error(`Error in ${context}:`, errorDetails);
        }
    }

    /**
     * Add error to local log
     */
    addToLog(errorDetails) {
        this.errorLog.unshift(errorDetails);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // Save to localStorage for persistence
        try {
            localStorage.setItem('findmydocs_error_log', JSON.stringify(this.errorLog));
        } catch (e) {
            console.warn('Could not save error log to localStorage:', e);
        }
    }

    /**
     * Track error with external service
     */
    async trackError(errorDetails) {
        try {
            // Send to Supabase for error tracking
            if (window.supabase) {
                await window.supabase
                    .from('error_logs')
                    .insert([{
                        error_message: errorDetails.message,
                        error_stack: errorDetails.stack,
                        context: errorDetails.context,
                        user_id: errorDetails.userId,
                        user_agent: errorDetails.userAgent,
                        url: errorDetails.url,
                        additional_data: errorDetails.additionalData || {},
                        created_at: errorDetails.timestamp
                    }]);
            }
        } catch (trackingError) {
            console.warn('Error tracking failed:', trackingError);
        }
    }

    /**
     * Show user-friendly error message
     */
    showUserMessage(error, context) {
        const userMessage = this.getUserFriendlyMessage(error, context);
        
        if (window.showToast) {
            window.showToast(userMessage.message, userMessage.type);
        } else {
            // Fallback to alert if toast system not available
            alert(userMessage.message);
        }
    }

    /**
     * Get user-friendly error message based on error type
     */
    getUserFriendlyMessage(error, context) {
        const errorMessages = {
            // Network errors
            'NetworkError': {
                message: 'Problema de conexão. Verifique sua internet e tente novamente.',
                type: 'warning'
            },
            'Failed to fetch': {
                message: 'Não foi possível conectar ao servidor. Tente novamente em alguns minutos.',
                type: 'error'
            },
            
            // Authentication errors
            'AuthApiError': {
                message: 'Erro de autenticação. Por favor, faça login novamente.',
                type: 'error'
            },
            'Invalid credentials': {
                message: 'Credenciais inválidas. Verifique seu email e senha.',
                type: 'error'
            },
            
            // Document errors
            'DocumentUploadError': {
                message: 'Erro ao enviar documento. Verifique o arquivo e tente novamente.',
                type: 'error'
            },
            'DocumentNotFound': {
                message: 'Documento não encontrado.',
                type: 'warning'
            },
            
            // File errors
            'FileTooLarge': {
                message: 'Arquivo muito grande. Tamanho máximo: 10MB.',
                type: 'warning'
            },
            'InvalidFileType': {
                message: 'Tipo de arquivo não suportado. Use JPG, PNG ou PDF.',
                type: 'warning'
            },
            
            // Location errors
            'GeolocationError': {
                message: 'Não foi possível obter sua localização. Verifique as permissões.',
                type: 'warning'
            },
            
            // Generic errors
            'default': {
                message: 'Ocorreu um erro inesperado. Tente novamente.',
                type: 'error'
            }
        };

        // Check for specific error messages
        for (const [errorType, message] of Object.entries(errorMessages)) {
            if (error.message.includes(errorType) || error.name === errorType) {
                return message;
            }
        }

        // Check context-specific messages
        const contextMessages = {
            'document_upload': {
                message: 'Erro ao enviar documento. Verifique os dados e tente novamente.',
                type: 'error'
            },
            'document_search': {
                message: 'Erro na pesquisa. Tente com outros termos.',
                type: 'warning'
            },
            'profile_update': {
                message: 'Erro ao atualizar perfil. Tente novamente.',
                type: 'error'
            },
            'chat_send': {
                message: 'Erro ao enviar mensagem. Verifique sua conexão.',
                type: 'warning'
            }
        };

        if (contextMessages[context]) {
            return contextMessages[context];
        }

        return errorMessages.default;
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(
                new Error(event.reason),
                'unhandled_promise_rejection',
                { reason: event.reason }
            );
            event.preventDefault();
        });

        // Handle global JavaScript errors (skip resource loading errors here so they
        // are handled only once by the dedicated resource handler below).
        window.addEventListener('error', (event) => {
            // If this is a resource error (event.target is element), skip here.
            if (event.target && event.target !== window) return;

            this.handleError(
                event.error || new Error(event.message),
                'global_error',
                {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                }
            );
        });

        // Handle resource loading errors (capture phase) — these originate from
        // failing <script>, <link>, <img> etc. and will be reported under
        // 'resource_load_error'. Kept separate so we can attach resource-specific metadata.
        window.addEventListener('error', (event) => {
            if (event.target && event.target !== window) {
                this.handleError(
                    new Error(`Failed to load resource: ${event.target.src || event.target.href}`),
                    'resource_load_error',
                    {
                        tagName: event.target.tagName,
                        src: event.target.src || event.target.href
                    }
                );
            }
        }, true);
    }

    /**
     * Check if running in development mode
     */
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('dev');
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentErrors = this.errorLog.filter(error => 
            new Date(error.timestamp) > last24h
        );

        const errorCounts = recentErrors.reduce((counts, error) => {
            counts[error.context] = (counts[error.context] || 0) + 1;
            return counts;
        }, {});

        return {
            totalErrors: this.errorLog.length,
            recentErrors: recentErrors.length,
            errorCounts,
            mostCommonError: Object.keys(errorCounts).reduce((a, b) => 
                errorCounts[a] > errorCounts[b] ? a : b, 'none'
            )
        };
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('findmydocs_error_log');
    }

    /**
     * Export error log for debugging
     */
    exportErrorLog() {
        const dataStr = JSON.stringify(this.errorLog, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `findmydocs-errors-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize global error handler
window.errorHandler = new ErrorHandler();

// Make ErrorHandler available globally
window.ErrorHandler = ErrorHandler;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

export default ErrorHandler;
