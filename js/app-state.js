// app-state.js
// Estado global e inicialização dos módulos principais
import { renderBottomNav } from './ui/bottom-nav.js';
import { renderThemeSwitcher } from './ui/theme-switcher.js';
import { setupOffline } from './pwa-offline.js';
import { showToast } from './ui/toasts.js';
import { showModal } from './ui/modals.js';

// Inicialização global
window.addEventListener('DOMContentLoaded', () => {
  renderBottomNav();
  renderThemeSwitcher();
  setupOffline();
  initOCRDemo();
  initGeoDemo();
  initChatDemo();
  // ...inicializar outros módulos conforme necessário
});

// Scanner de Documentos
async function initScanner() {
  const scannerUI = new ScanUI();
  const video = document.getElementById('scanner-video');
  const canvas = document.createElement('canvas');
  const preview = document.getElementById('preview-image');
  
  if (!video || !preview) return;
  
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
      const result = await scannerUI.capture();
      if (result) {
        scannerContainer.classList.add('hidden');
        previewContainer.classList.remove('hidden');
      }
    });
    
    // Tentar novamente
    btnRetry?.addEventListener('click', () => {
      scannerContainer.classList.remove('hidden');
      previewContainer.classList.add('hidden');
      scannerUI.resetUI();
    });
    
    // Confirmar documento
    btnConfirm?.addEventListener('click', async () => {
      showToast('Documento salvo com sucesso!', 'success');
      // Aqui você pode implementar o salvamento no Supabase
    });
    
    // Trocar câmera
    let usingFront = false;
    btnSwitch?.addEventListener('click', async () => {
      usingFront = !usingFront;
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: usingFront ? 'user' : 'environment' }
      });
      video.srcObject = newStream;
    });
    
    // Flash (se disponível)
    let flashOn = false;
    btnFlash?.addEventListener('click', async () => {
      const track = video.srcObject?.getVideoTracks()[0];
      const capabilities = track?.getCapabilities();
      
      if (capabilities?.torch) {
        flashOn = !flashOn;
        await track.applyConstraints({
          advanced: [{ torch: flashOn }]
        });
        btnFlash.innerHTML = `<i class="fas fa-bolt${flashOn ? ' text-yellow-300' : ''}"></i>`;
      }
    });
    
  } catch (error) {
    console.error('Erro ao inicializar scanner:', error);
    showToast('Erro ao inicializar câmera', 'error');
  }
}
}

// Exemplo: Geofencing UI
function initGeoDemo() {
  const btn = document.getElementById('btn-set-geofence');
  const alertDiv = document.getElementById('geo-alert');
  if (!btn) return;
  btn.onclick = async () => {
    try {
      showToast('Obtendo sua localização...', 'info');
      alertDiv.innerHTML = '<span class="animate-pulse">Obtendo localização...</span>';
      
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
      
      alertDiv.innerHTML = `<b>Zona definida:</b> Lat ${coords.lat}, Lng ${coords.lng}`;
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
      alertDiv.innerHTML = '<span class="text-red-500">Erro ao obter localização</span>';
      console.error('Erro geolocation:', error);
    }
      });
    }
  };
}

// Exemplo: Chat UI
function initChatDemo() {
  const chatArea = document.getElementById('chat-area');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-chat-send');
  if (!chatArea || !chatMessages || !chatInput || !btnSend) return;
  chatMessages.innerHTML = '';
  const addMsg = (msg, self=false) => {
    const div = document.createElement('div');
    div.className = 'mb-1 ' + (self ? 'text-right text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200');
    div.textContent = msg;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
