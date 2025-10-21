// State Management System for FindMyDocs
class AppState {
    constructor() {
        this.state = {
            user: null,
            documents: [],
            notifications: [],
            theme: 'light',
            language: 'pt',
            currentSection: 'documentos',
            isLoading: false,
            error: null,
            settings: {
                notifications: true,
                location: true,
                autoSave: true
            },
            cache: new Map(),
            lastUpdated: null
        };
        
        this.listeners = new Map();
        this.middleware = [];
        this.persistKeys = ['user', 'theme', 'language', 'settings'];
        
        this.initializeFromStorage();
        this.setupAutoSave();
    }

    /**
     * Get current state
     * @param {string} key - Specific state key to get
     * @returns {any} State value
     */
    getState(key = null) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state };
    }

    /**
     * Set state with middleware processing
     * @param {Object|Function} newState - New state or state updater function
     * @param {boolean} silent - Skip notifying listeners
     */
    setState(newState, silent = false) {
        const prevState = { ...this.state };
        
        // Process middleware
        const processedState = this.processMiddleware(newState, prevState);
        
        // Update state
        if (typeof processedState === 'function') {
            this.state = { ...this.state, ...processedState(this.state) };
        } else {
            this.state = { ...this.state, ...processedState };
        }
        
        // Update timestamp
        this.state.lastUpdated = new Date().toISOString();
        
        // Persist to storage
        this.persistState();
        
        // Notify listeners
        if (!silent) {
            this.notifyListeners(prevState, this.state);
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        
        this.listeners.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                keyListeners.delete(callback);
                if (keyListeners.size === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }

    /**
     * Add middleware for state processing
     * @param {Function} middleware - Middleware function
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Process state through middleware
     */
    processMiddleware(newState, prevState) {
        let processedState = newState;
        
        for (const middleware of this.middleware) {
            processedState = middleware(processedState, prevState, this.state);
        }
        
        return processedState;
    }

    /**
     * Notify all listeners of state changes
     */
    notifyListeners(prevState, newState) {
        // Notify specific key listeners
        for (const [key, listeners] of this.listeners) {
            if (prevState[key] !== newState[key]) {
                listeners.forEach(callback => {
                    try {
                        callback(newState[key], prevState[key], key);
                    } catch (error) {
                        console.error('Error in state listener:', error);
                    }
                });
            }
        }
        
        // Notify global listeners
        const globalListeners = this.listeners.get('*');
        if (globalListeners) {
            globalListeners.forEach(callback => {
                try {
                    callback(newState, prevState);
                } catch (error) {
                    console.error('Error in global state listener:', error);
                }
            });
        }
    }

    /**
     * Initialize state from localStorage
     */
    initializeFromStorage() {
        try {
            const savedState = localStorage.getItem('findmydocs_state');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                // Only restore persisted keys
                this.persistKeys.forEach(key => {
                    if (parsedState[key] !== undefined) {
                        this.state[key] = parsedState[key];
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to restore state from storage:', error);
        }
    }

    /**
     * Persist state to localStorage
     */
    persistState() {
        try {
            const stateToPersist = {};
            this.persistKeys.forEach(key => {
                stateToPersist[key] = this.state[key];
            });
            
            localStorage.setItem('findmydocs_state', JSON.stringify(stateToPersist));
        } catch (error) {
            console.warn('Failed to persist state to storage:', error);
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.persistState();
        }, 30000);

        // Auto-save before page unload
        window.addEventListener('beforeunload', () => {
            this.persistState();
        });
    }

    /**
     * Cache data with expiration
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    setCache(key, data, ttl = 300000) { // 5 minutes default
        const cacheItem = {
            data,
            timestamp: Date.now(),
            ttl
        };
        
        this.state.cache.set(key, cacheItem);
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {any|null} Cached data or null if expired/not found
     */
    getCache(key) {
        const cacheItem = this.state.cache.get(key);
        
        if (!cacheItem) {
            return null;
        }
        
        // Check if expired
        if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
            this.state.cache.delete(key);
            return null;
        }
        
        return cacheItem.data;
    }

    /**
     * Clear cache
     * @param {string} key - Specific key to clear, or clear all if not provided
     */
    clearCache(key = null) {
        if (key) {
            this.state.cache.delete(key);
        } else {
            this.state.cache.clear();
        }
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.state = {
            user: null,
            documents: [],
            notifications: [],
            theme: 'light',
            language: 'pt',
            currentSection: 'documentos',
            isLoading: false,
            error: null,
            settings: {
                notifications: true,
                location: true,
                autoSave: true
            },
            cache: new Map(),
            lastUpdated: null
        };
        
        this.persistState();
        this.notifyListeners({}, this.state);
    }

    /**
     * Get state statistics
     */
    getStats() {
        return {
            listenersCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
            cacheSize: this.state.cache.size,
            lastUpdated: this.state.lastUpdated,
            persistedKeys: this.persistKeys.length
        };
    }

    /**
     * Export state for debugging
     */
    exportState() {
        return {
            state: this.state,
            listeners: Array.from(this.listeners.keys()),
            middleware: this.middleware.length,
            stats: this.getStats()
        };
    }

    /**
     * Import state from external source
     * @param {Object} importedState - State to import
     */
    importState(importedState) {
        if (importedState && typeof importedState === 'object') {
            this.setState(importedState);
        }
    }
}

// Create global state instance
window.appState = new AppState();

// Add common middleware
window.appState.addMiddleware((newState, prevState, currentState) => {
    // Log state changes in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('State change:', { newState, prevState });
    }
    
    return newState;
});

// Add error handling middleware
window.appState.addMiddleware((newState, prevState, currentState) => {
    // Handle error state
    if (newState.error) {
        // Log error to error handler
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(newState.error, 'state_error');
        }
    }
    
    return newState;
});

// Make AppState available globally
window.AppState = AppState;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
}

export default AppState;
