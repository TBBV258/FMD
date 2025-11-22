// app-state.js
// Estado global e inicialização dos módulos principais
import { renderBottomNav } from './ui/bottom-nav.js';
import { renderThemeSwitcher } from './ui/theme-switcher.js';
import { setupOffline } from './pwa-offline.js';
import { showToast } from './ui/toasts.js';
import { showModal } from './ui/modals.js';
import ScanUI from './scan-ui.js';

// Constantes
const AUTO_SAVE_INTERVAL_MS = 30000; // 30 segundos
const DEFAULT_CACHE_TTL_MS = 300000; // 5 minutos
const CACHE_CLEANUP_INTERVAL_MS = 60000; // 1 minuto

// Estado inicial padrão
const INITIAL_STATE = {
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
    cache: {}, // Objeto ao invés de Map para serialização
    lastUpdated: null
};

// Inicialização global
window.addEventListener('DOMContentLoaded', () => {
    renderBottomNav();
    renderThemeSwitcher();
    setupOffline();
    initOCRDemo();
    initGeoDemo();
    initChatDemo();
    initScanner(); // Adicionado: inicializar scanner
    // ...inicializar outros módulos conforme necessário
});

/**
 * Scanner de Documentos
 * Inicializa a interface de escaneamento de documentos
 */
async function initScanner() {
    const scannerUI = new ScanUI();
    const video = document.getElementById('scanner-video');
    const canvas = document.createElement('canvas');
    const preview = document.getElementById('preview-image');
    
    if (!video || !preview) return;
    
    // Estado da câmera (movido para escopo da função para evitar perda de estado)
    const cameraState = {
        usingFront: false,
        flashOn: false,
        currentStream: null
    };
    
    try {
        await scannerUI.initialize(video, canvas, preview);
        
        // Botões de controle
        const btnCapture = document.getElementById('btn-capture');
        const btnRetry = document.getElementById('btn-retry');
        const btnConfirm = document.getElementById('btn-confirm');
        const btnSwitch = document.getElementById('btn-switch-camera');
        const btnFlash = document.getElementById('btn-flash');
        
        // Containers
        const scannerContainer = document.getElementById('scanner-container');
        const previewContainer = document.getElementById('preview-container');
        
        // Evento de captura
        btnCapture?.addEventListener('click', async () => {
            try {
                const result = await scannerUI.capture();
                if (result) {
                    scannerContainer?.classList.add('hidden');
                    previewContainer?.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Erro ao capturar:', error);
                showToast('Erro ao capturar documento', 'error');
            }
        });
        
        // Tentar novamente
        btnRetry?.addEventListener('click', () => {
            try {
                scannerContainer?.classList.remove('hidden');
                previewContainer?.classList.add('hidden');
                scannerUI.resetUI();
            } catch (error) {
                console.error('Erro ao resetar:', error);
                showToast('Erro ao resetar scanner', 'error');
            }
        });
        
        // Confirmar documento
        btnConfirm?.addEventListener('click', async () => {
            try {
                showToast('Documento salvo com sucesso!', 'success');
                // Aqui você pode implementar o salvamento no Supabase
            } catch (error) {
                console.error('Erro ao confirmar documento:', error);
                showToast('Erro ao salvar documento', 'error');
            }
        });
        
        // Trocar câmera - CORRIGIDO: parar stream anterior
        btnSwitch?.addEventListener('click', async () => {
            try {
                // Parar stream anterior antes de criar novo
                if (cameraState.currentStream) {
                    cameraState.currentStream.getTracks().forEach(track => track.stop());
                }
                
                cameraState.usingFront = !cameraState.usingFront;
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: cameraState.usingFront ? 'user' : 'environment' }
                });
                
                cameraState.currentStream = newStream;
                video.srcObject = newStream;
            } catch (error) {
                console.error('Erro ao trocar câmera:', error);
                showToast('Erro ao trocar câmera', 'error');
            }
        });
        
        // Flash (se disponível)
        btnFlash?.addEventListener('click', async () => {
            try {
                const track = video.srcObject?.getVideoTracks()[0];
                const capabilities = track?.getCapabilities();
                
                if (capabilities?.torch) {
                    cameraState.flashOn = !cameraState.flashOn;
                    await track.applyConstraints({
                        advanced: [{ torch: cameraState.flashOn }]
                    });
                    btnFlash.innerHTML = `<i class="fas fa-bolt${cameraState.flashOn ? ' text-yellow-300' : ''}"></i>`;
                }
            } catch (error) {
                console.error('Erro ao controlar flash:', error);
                showToast('Erro ao controlar flash', 'error');
            }
        });
        
    } catch (error) {
        console.error('Erro ao inicializar scanner:', error);
        showToast('Erro ao inicializar câmera', 'error');
    }
}

/**
 * Função para inicializar OCR Demo (placeholder)
 */
function initOCRDemo() {
    // Placeholder - será implementado quando necessário
}

/**
 * Exemplo: Geofencing UI
 * Inicializa a interface de geofencing
 */
function initGeoDemo() {
    const btn = document.getElementById('btn-set-geofence');
    const alertDiv = document.getElementById('geo-alert');
    if (!btn) return;
    
    btn.onclick = async () => {
        try {
            showToast('Obtendo sua localização...', 'info');
            if (alertDiv) {
                alertDiv.innerHTML = '<span class="animate-pulse">Obtendo localização...</span>';
            }
            
            const position = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Geolocalização não suportada'));
                    return;
                }
                
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            const coords = {
                lat: position.coords.latitude.toFixed(4),
                lng: position.coords.longitude.toFixed(4)
            };
            
            if (alertDiv) {
                alertDiv.innerHTML = `<b>Zona definida:</b> Lat ${coords.lat}, Lng ${coords.lng}`;
            }
            showToast('Localização obtida!', 'success');
            
            const confirmed = await showModal(`
                <h3 class="text-lg font-bold mb-4">Confirmar Zona de Busca</h3>
                <div class="space-y-4">
                    <p>Deseja definir uma zona de busca com raio de 1km ao redor de:</p>
                    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                        <p><b>Latitude:</b> ${coords.lat}</p>
                        <p><b>Longitude:</b> ${coords.lng}</p>
                    </div>
                </div>
            `, { showCancel: true, confirmText: 'Definir Zona' });

            if (confirmed) {
                showToast('Zona de busca definida!', 'success');
            }
        } catch (error) {
            showToast('Erro ao obter localização', 'error');
            if (alertDiv) {
                alertDiv.innerHTML = '<span class="text-red-500">Erro ao obter localização</span>';
            }
            console.error('Erro geolocation:', error);
        }
    };
}

/**
 * Exemplo: Chat UI
 * Inicializa a interface de chat
 */
function initChatDemo() {
    const chatArea = document.getElementById('chat-area');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-chat-send');
    
    if (!chatArea || !chatMessages || !chatInput || !btnSend) return;
    
    chatMessages.innerHTML = '';
    
    const addMsg = (msg, self = false) => {
        try {
            const div = document.createElement('div');
            div.className = 'mb-1 ' + (self ? 'text-right text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200');
            div.textContent = msg;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Erro ao adicionar mensagem:', error);
        }
    };
    
    btnSend.onclick = async () => {
        try {
            const msg = chatInput.value.trim();
            if (!msg) {
                showToast('Digite uma mensagem primeiro', 'warning');
                return;
            }
            
            addMsg(msg, true);
            chatInput.value = '';
            showToast('Mensagem enviada!', 'success');
            
            // Simula resposta do bot
            await new Promise(resolve => setTimeout(resolve, 500));
            addMsg('🤖 Bot: Processando sua mensagem...');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            addMsg('🤖 Bot: Obrigado pelo contato! Como posso ajudar?');
            
            await showModal(`
                <h3 class="text-lg font-bold mb-4">Assistente Virtual</h3>
                <div class="space-y-4">
                    <p>Seu chat foi iniciado com sucesso!</p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        Use este chat para tirar dúvidas sobre documentos 
                        perdidos ou encontrados.
                    </p>
                </div>
            `);
        } catch (error) {
            showToast('Erro ao processar mensagem', 'error');
            console.error('Erro chat:', error);
        }
    };
}

/**
 * State Management System for FindMyDocs
 * Gerencia o estado global da aplicação com persistência e middleware
 */
class AppState {
    /**
     * @constructor
     * Inicializa o estado da aplicação
     */
    constructor() {
        this.state = { ...INITIAL_STATE };
        this.listeners = new Map();
        this.middleware = [];
        this.persistKeys = ['user', 'theme', 'language', 'settings'];
        this.autoSaveIntervalId = null;
        this.cacheCleanupIntervalId = null;
        this.persistDebounceTimer = null;
        
        this.initializeFromStorage();
        this.setupAutoSave();
        this.setupCacheCleanup();
    }

    /**
     * Get current state
     * @param {string|null} key - Specific state key to get, or null for entire state
     * @returns {any} State value or entire state object
     */
    getState(key = null) {
        if (key && typeof key !== 'string') {
            console.warn('AppState.getState: key must be a string');
            return null;
        }
        
        if (key) {
            return this.state[key];
        }
        return { ...this.state };
    }

    /**
     * Set state with middleware processing
     * @param {Object|Function} newState - New state or state updater function
     * @param {boolean} silent - Skip notifying listeners
     * @returns {void}
     */
    setState(newState, silent = false) {
        if (newState === null || newState === undefined) {
            console.warn('AppState.setState: newState cannot be null or undefined');
            return;
        }
        
        if (typeof newState !== 'object' && typeof newState !== 'function') {
            console.warn('AppState.setState: newState must be an object or function');
            return;
        }
        
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
        
        // Persist to storage (com debounce)
        this.debouncedPersistState();
        
        // Notify listeners
        if (!silent) {
            this.notifyListeners(prevState, this.state);
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch, or '*' for all changes
     * @param {Function} callback - Callback function (newValue, oldValue, key)
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (typeof key !== 'string') {
            console.warn('AppState.subscribe: key must be a string');
            return () => {};
        }
        
        if (typeof callback !== 'function') {
            console.warn('AppState.subscribe: callback must be a function');
            return () => {};
        }
        
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
     * @param {Function} middleware - Middleware function (newState, prevState, currentState) => processedState
     * @returns {void}
     */
    addMiddleware(middleware) {
        if (typeof middleware !== 'function') {
            console.warn('AppState.addMiddleware: middleware must be a function');
            return;
        }
        
        this.middleware.push(middleware);
    }

    /**
     * Process state through middleware
     * @private
     * @param {Object|Function} newState - New state to process
     * @param {Object} prevState - Previous state
     * @returns {Object|Function} Processed state
     */
    processMiddleware(newState, prevState) {
        let processedState = newState;
        
        for (const middleware of this.middleware) {
            try {
                processedState = middleware(processedState, prevState, this.state);
            } catch (error) {
                console.error('Error in middleware:', error);
                // Continue with unprocessed state if middleware fails
            }
        }
        
        return processedState;
    }

    /**
     * Notify all listeners of state changes
     * @private
     * @param {Object} prevState - Previous state
     * @param {Object} newState - New state
     * @returns {void}
     */
    notifyListeners(prevState, newState) {
        // Notify specific key listeners
        for (const [key, listeners] of this.listeners) {
            if (key === '*') continue; // Handle global listeners separately
            
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
     * @private
     * @returns {void}
     */
    initializeFromStorage() {
        try {
            const savedState = localStorage.getItem('findmydocs_state');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                // Validar estrutura do estado salvo
                if (this.validateStateStructure(parsedState)) {
                    // Only restore persisted keys
                    this.persistKeys.forEach(key => {
                        if (parsedState[key] !== undefined) {
                            this.state[key] = parsedState[key];
                        }
                    });
                } else {
                    console.warn('Invalid state structure in localStorage, using defaults');
                }
            }
        } catch (error) {
            console.warn('Failed to restore state from storage:', error);
        }
    }

    /**
     * Validate state structure
     * @private
     * @param {Object} state - State to validate
     * @returns {boolean} True if valid
     */
    validateStateStructure(state) {
        if (!state || typeof state !== 'object') {
            return false;
        }
        
        // Validar que persistKeys existem e têm tipos corretos
        for (const key of this.persistKeys) {
            if (state[key] !== undefined) {
                // Validações básicas de tipo
                if (key === 'settings' && (typeof state[key] !== 'object' || Array.isArray(state[key]))) {
                    return false;
                }
                if (key === 'theme' && typeof state[key] !== 'string') {
                    return false;
                }
                if (key === 'language' && typeof state[key] !== 'string') {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Persist state to localStorage
     * @private
     * @returns {void}
     */
    persistState() {
        try {
            const stateToPersist = {};
            this.persistKeys.forEach(key => {
                stateToPersist[key] = this.state[key];
            });
            
            // Converter cache Map para objeto serializável
            const cacheObj = {};
            for (const [cacheKey, cacheValue] of Object.entries(this.state.cache)) {
                cacheObj[cacheKey] = cacheValue;
            }
            
            localStorage.setItem('findmydocs_state', JSON.stringify(stateToPersist));
        } catch (error) {
            console.warn('Failed to persist state to storage:', error);
        }
    }

    /**
     * Debounced persist state to avoid excessive writes
     * @private
     * @returns {void}
     */
    debouncedPersistState() {
        if (this.persistDebounceTimer) {
            clearTimeout(this.persistDebounceTimer);
        }
        
        this.persistDebounceTimer = setTimeout(() => {
            this.persistState();
            this.persistDebounceTimer = null;
        }, 500); // 500ms debounce
    }

    /**
     * Setup auto-save functionality
     * @private
     * @returns {void}
     */
    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveIntervalId = setInterval(() => {
            this.persistState();
        }, AUTO_SAVE_INTERVAL_MS);

        // Auto-save before page unload
        window.addEventListener('beforeunload', () => {
            this.persistState();
        });
    }

    /**
     * Setup automatic cache cleanup
     * @private
     * @returns {void}
     */
    setupCacheCleanup() {
        this.cacheCleanupIntervalId = setInterval(() => {
            this.cleanupExpiredCache();
        }, CACHE_CLEANUP_INTERVAL_MS);
    }

    /**
     * Cleanup expired cache entries
     * @private
     * @returns {void}
     */
    cleanupExpiredCache() {
        const now = Date.now();
        const cache = this.state.cache;
        
        for (const key in cache) {
            if (cache.hasOwnProperty(key)) {
                const cacheItem = cache[key];
                if (cacheItem && cacheItem.timestamp && cacheItem.ttl) {
                    if (now - cacheItem.timestamp > cacheItem.ttl) {
                        delete cache[key];
                    }
                }
            }
        }
    }

    /**
     * Cache data with expiration
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     * @returns {void}
     */
    setCache(key, data, ttl = DEFAULT_CACHE_TTL_MS) {
        if (typeof key !== 'string') {
            console.warn('AppState.setCache: key must be a string');
            return;
        }
        
        if (typeof ttl !== 'number' || ttl < 0) {
            console.warn('AppState.setCache: ttl must be a positive number');
            return;
        }
        
        const cacheItem = {
            data,
            timestamp: Date.now(),
            ttl
        };
        
        // Usar objeto ao invés de Map para serialização
        if (!this.state.cache || typeof this.state.cache !== 'object') {
            this.state.cache = {};
        }
        
        this.state.cache[key] = cacheItem;
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {any|null} Cached data or null if expired/not found
     */
    getCache(key) {
        if (typeof key !== 'string') {
            console.warn('AppState.getCache: key must be a string');
            return null;
        }
        
        if (!this.state.cache || typeof this.state.cache !== 'object') {
            return null;
        }
        
        const cacheItem = this.state.cache[key];
        
        if (!cacheItem) {
            return null;
        }
        
        // Check if expired
        if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
            delete this.state.cache[key];
            return null;
        }
        
        return cacheItem.data;
    }

    /**
     * Clear cache
     * @param {string|null} key - Specific key to clear, or clear all if not provided
     * @returns {void}
     */
    clearCache(key = null) {
        if (!this.state.cache || typeof this.state.cache !== 'object') {
            this.state.cache = {};
            return;
        }
        
        if (key) {
            if (typeof key !== 'string') {
                console.warn('AppState.clearCache: key must be a string');
                return;
            }
            delete this.state.cache[key];
        } else {
            this.state.cache = {};
        }
    }

    /**
     * Reset state to initial values
     * @returns {void}
     */
    reset() {
        this.state = { ...INITIAL_STATE };
        
        this.persistState();
        this.notifyListeners({}, this.state);
    }

    /**
     * Get state statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const cacheSize = this.state.cache && typeof this.state.cache === 'object' 
            ? Object.keys(this.state.cache).length 
            : 0;
        
        return {
            listenersCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
            cacheSize,
            lastUpdated: this.state.lastUpdated,
            persistedKeys: this.persistKeys.length
        };
    }

    /**
     * Export state for debugging
     * @returns {Object} Exported state object
     */
    exportState() {
        return {
            state: { ...this.state },
            listeners: Array.from(this.listeners.keys()),
            middleware: this.middleware.length,
            stats: this.getStats()
        };
    }

    /**
     * Import state from external source
     * @param {Object} importedState - State to import
     * @returns {boolean} True if import was successful
     */
    importState(importedState) {
        if (!importedState || typeof importedState !== 'object') {
            console.warn('AppState.importState: importedState must be an object');
            return false;
        }
        
        // Validar estrutura antes de importar
        if (!this.validateStateStructure(importedState)) {
            console.warn('AppState.importState: invalid state structure');
            return false;
        }
        
        // Sanitizar: apenas permitir chaves válidas
        const sanitizedState = {};
        const allowedKeys = Object.keys(INITIAL_STATE);
        
        for (const key of allowedKeys) {
            if (importedState[key] !== undefined) {
                sanitizedState[key] = importedState[key];
            }
        }
        
        this.setState(sanitizedState);
        return true;
    }

    /**
     * Cleanup resources
     * @returns {void}
     */
    cleanup() {
        if (this.autoSaveIntervalId) {
            clearInterval(this.autoSaveIntervalId);
            this.autoSaveIntervalId = null;
        }
        
        if (this.cacheCleanupIntervalId) {
            clearInterval(this.cacheCleanupIntervalId);
            this.cacheCleanupIntervalId = null;
        }
        
        if (this.persistDebounceTimer) {
            clearTimeout(this.persistDebounceTimer);
            this.persistDebounceTimer = null;
        }
        
        this.listeners.clear();
        this.middleware = [];
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
    if (newState && newState.error) {
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
