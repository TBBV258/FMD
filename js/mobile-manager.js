// Enhanced Mobile Experience and Offline Support for FindMyDocs
class MobileManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.cache = new Map();
        this.serviceWorker = null;
        this.pushManager = null;
        
        this.initializeMobileFeatures();
        this.setupOfflineSupport();
        this.setupPushNotifications();
    }

    /**
     * Initialize mobile-specific features
     */
    initializeMobileFeatures() {
        // Detect mobile device
        this.isMobile = this.detectMobileDevice();
        
        // Add mobile-specific classes
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
        }
        
        // Setup touch gestures
        this.setupTouchGestures();
        
        // Setup mobile-specific UI adjustments
        this.setupMobileUI();
        
        // Setup camera integration
        this.setupCameraIntegration();
        
        // Setup GPS integration
        this.setupGPSIntegration();
    }

    /**
     * Detect mobile device
     */
    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }

    /**
     * Setup touch gestures
     */
    setupTouchGestures() {
        let startX, startY, startTime;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            const diffTime = endTime - startTime;
            
            // Swipe detection
            if (diffTime < 300) {
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 50) {
                        this.handleSwipe('left');
                    } else if (diffX < -50) {
                        this.handleSwipe('right');
                    }
                } else {
                    if (diffY > 50) {
                        this.handleSwipe('up');
                    } else if (diffY < -50) {
                        this.handleSwipe('down');
                    }
                }
            }
            
            startX = startY = null;
        });
    }

    /**
     * Handle swipe gestures
     */
    handleSwipe(direction) {
        const currentSection = window.appState?.getState('currentSection') || 'documentos';
        
        switch (direction) {
            case 'left':
                // Navigate to next section
                this.navigateToNextSection(currentSection);
                break;
            case 'right':
                // Navigate to previous section
                this.navigateToPreviousSection(currentSection);
                break;
            case 'up':
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'down':
                // Show navigation
                this.toggleMobileNavigation();
                break;
        }
    }

    /**
     * Navigate to next section
     */
    navigateToNextSection(currentSection) {
        const sections = ['documentos', 'feed', 'relatar-perda', 'relatar-encontrado', 'notificacoes', 'perfil'];
        const currentIndex = sections.indexOf(currentSection);
        
        if (currentIndex < sections.length - 1) {
            const nextSection = sections[currentIndex + 1];
            if (window.showSection) {
                window.showSection(nextSection);
            }
        }
    }

    /**
     * Navigate to previous section
     */
    navigateToPreviousSection(currentSection) {
        const sections = ['documentos', 'feed', 'relatar-perda', 'relatar-encontrado', 'notificacoes', 'perfil'];
        const currentIndex = sections.indexOf(currentSection);
        
        if (currentIndex > 0) {
            const prevSection = sections[currentIndex - 1];
            if (window.showSection) {
                window.showSection(prevSection);
            }
        }
    }

    /**
     * Toggle mobile navigation
     */
    toggleMobileNavigation() {
        const nav = document.querySelector('.navbar');
        if (nav) {
            nav.classList.toggle('mobile-nav-open');
        }
    }

    /**
     * Setup mobile-specific UI adjustments
     */
    setupMobileUI() {
        // Add mobile-specific styles
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            .mobile-device .navbar {
                position: fixed;
                top: 0;
                bottom: auto;
                left: 0;
                right: 0;
                width: 100%;
                z-index: 1000;
                background: var(--card-bg);
                border-bottom: 1px solid var(--border-color);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .mobile-device .nav-links {
                display: flex;
                justify-content: space-around;
                padding: 8px 0;
            }
            
            .mobile-device .nav-link {
                flex-direction: column;
                padding: 8px 4px;
                font-size: 12px;
            }
            
            .mobile-device .nav-link i {
                font-size: 18px;
                margin-bottom: 4px;
            }
            
            .mobile-device .container {
                padding-top: 80px;
            }
            
            .mobile-device .modal-content {
                margin: 20px;
                max-height: calc(100vh - 40px);
                overflow-y: auto;
            }
            
            .mobile-device .btn {
                min-height: 44px;
                min-width: 44px;
            }
            
            .mobile-device input, .mobile-device textarea, .mobile-device select {
                min-height: 44px;
                font-size: 16px;
            }
        `;
        document.head.appendChild(mobileStyles);
    }

    /**
     * Setup camera integration
     */
    setupCameraIntegration() {
        // Add camera button to file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            if (input.accept.includes('image')) {
                this.addCameraButton(input);
            }
        });
    }

    /**
     * Add camera button to file input
     */
    addCameraButton(fileInput) {
        const container = fileInput.parentElement;
        const cameraBtn = document.createElement('button');
        cameraBtn.type = 'button';
        cameraBtn.className = 'btn secondary camera-btn';
        cameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
        cameraBtn.title = 'Tirar foto';
        
        cameraBtn.addEventListener('click', () => {
            this.openCamera(fileInput);
        });
        
        container.appendChild(cameraBtn);
    }

    /**
     * Open camera for photo capture
     */
    openCamera(fileInput) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use back camera on mobile
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Process the captured image
                this.processCapturedImage(file, fileInput);
            }
        });
        
        input.click();
    }

    /**
     * Process captured image
     */
    processCapturedImage(file, targetInput) {
        // Compress image for mobile
        if (window.performanceManager) {
            window.performanceManager.compressImage(file, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.8
            }).then(compressedFile => {
                // Create new FileList
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(compressedFile);
                targetInput.files = dataTransfer.files;
                
                // Trigger change event
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            });
        } else {
            // Fallback: use original file
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            targetInput.files = dataTransfer.files;
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Setup GPS integration
     */
    setupGPSIntegration() {
        // Request location permission
        this.requestLocationPermission();
        
        // Setup location tracking
        this.setupLocationTracking();
    }

    /**
     * Request location permission
     */
    requestLocationPermission() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Location permission granted');
                    this.updateLocationInputs(position);
                },
                (error) => {
                    console.warn('Location permission denied:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        }
    }

    /**
     * Setup location tracking
     */
    setupLocationTracking() {
        // Watch position for automatic location updates
        if ('geolocation' in navigator) {
            this.locationWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.updateLocationInputs(position);
                },
                (error) => {
                    console.warn('Location tracking error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 60000
                }
            );
        }
    }

    /**
     * Update location inputs with current position
     */
    updateLocationInputs(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Update hidden location inputs
        const latInputs = document.querySelectorAll('input[id$="-lat"]');
        const lngInputs = document.querySelectorAll('input[id$="-lng"]');
        
        latInputs.forEach(input => {
            input.value = lat;
        });
        
        lngInputs.forEach(input => {
            input.value = lng;
        });
        
        // Reverse geocoding to get address
        this.reverseGeocode(lat, lng);
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(lat, lng) {
        try {
            // Use a geocoding service (you might want to use a proper API)
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`);
            const data = await response.json();
            
            if (data.locality) {
                const address = `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
                
                // Update address inputs
                const addressInputs = document.querySelectorAll('input[id$="-location"]');
                addressInputs.forEach(input => {
                    if (!input.value) {
                        input.value = address;
                    }
                });
            }
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
        }
    }

    /**
     * Setup offline support
     */
    setupOfflineSupport() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnlineStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOfflineStatus();
        });
        
        // Setup service worker
        this.setupServiceWorker();
        
        // Setup offline queue
        this.setupOfflineQueue();
    }

    /**
     * Handle online status
     */
    handleOnlineStatus() {
        // Show online indicator
        if (window.showToast) {
            window.showToast('Conexão restaurada!', 'success');
        }
        
        // Process offline queue
        this.processOfflineQueue();
    }

    /**
     * Handle offline status
     */
    handleOfflineStatus() {
        // Show offline indicator
        if (window.showToast) {
            window.showToast('Modo offline ativado', 'warning');
        }
        
        // Show offline banner
        this.showOfflineBanner();
    }

    /**
     * Show offline banner
     */
    showOfflineBanner() {
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.className = 'offline-banner';
        banner.innerHTML = `
            <div class="offline-content">
                <i class="fas fa-wifi"></i>
                <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
            </div>
        `;
        
        document.body.appendChild(banner);
    }

    /**
     * Hide offline banner
     */
    hideOfflineBanner() {
        const banner = document.getElementById('offline-banner');
        if (banner) {
            banner.remove();
        }
    }

    /**
     * Setup service worker
     */
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                this.serviceWorker = registration;
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Setup offline queue
     */
    setupOfflineQueue() {
        // Load existing queue from localStorage
        this.loadOfflineQueue();
        
        // Process queue every 30 seconds when online
        setInterval(() => {
            if (this.isOnline && this.offlineQueue.length > 0) {
                this.processOfflineQueue();
            }
        }, 30000);
    }

    /**
     * Add action to offline queue
     */
    addToOfflineQueue(action) {
        this.offlineQueue.push({
            ...action,
            timestamp: new Date().toISOString(),
            id: this.generateQueueId()
        });
        
        this.persistOfflineQueue();
    }

    /**
     * Process offline queue
     */
    async processOfflineQueue() {
        if (!this.isOnline || this.offlineQueue.length === 0) return;
        
        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        
        for (const action of queue) {
            try {
                await this.executeQueuedAction(action);
            } catch (error) {
                console.error('Failed to execute queued action:', error);
                // Re-add to queue if it fails
                this.offlineQueue.push(action);
            }
        }
        
        this.persistOfflineQueue();
    }

    /**
     * Execute queued action
     */
    async executeQueuedAction(action) {
        switch (action.type) {
            case 'document_upload':
                await this.executeDocumentUpload(action.data);
                break;
            case 'document_update':
                await this.executeDocumentUpdate(action.data);
                break;
            case 'chat_message':
                await this.executeChatMessage(action.data);
                break;
            default:
                console.warn('Unknown queued action type:', action.type);
        }
    }

    /**
     * Execute document upload
     */
    async executeDocumentUpload(data) {
        if (window.documentsApi) {
            await window.documentsApi.create(data);
        }
    }

    /**
     * Execute document update
     */
    async executeDocumentUpdate(data) {
        if (window.documentsApi) {
            await window.documentsApi.update(data.id, data.updates);
        }
    }

    /**
     * Execute chat message
     */
    async executeChatMessage(data) {
        if (window.chatsApi) {
            await window.chatsApi.send(data);
        }
    }

    /**
     * Setup push notifications
     */
    async setupPushNotifications() {
        if ('PushManager' in window && 'serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                this.pushManager = registration.pushManager;
                
                // Request notification permission
                const permission = await Notification.requestPermission();
                
                if (permission === 'granted') {
                    console.log('Push notifications enabled');
                }
            } catch (error) {
                console.warn('Push notifications setup failed:', error);
            }
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPushNotifications() {
        if (!this.pushManager) return;
        
        try {
            const subscription = await this.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
            });
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
            return subscription;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return null;
        }
    }

    /**
     * Send subscription to server
     */
    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
        }
    }

    /**
     * Convert VAPID key
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }

    /**
     * Generate queue ID
     */
    generateQueueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Persist offline queue
     */
    persistOfflineQueue() {
        try {
            localStorage.setItem('findmydocs_offline_queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.warn('Failed to persist offline queue:', error);
        }
    }

    /**
     * Load offline queue
     */
    loadOfflineQueue() {
        try {
            const saved = localStorage.getItem('findmydocs_offline_queue');
            if (saved) {
                this.offlineQueue = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load offline queue:', error);
        }
    }

    /**
     * Get mobile statistics
     */
    getMobileStats() {
        return {
            isMobile: this.isMobile,
            isOnline: this.isOnline,
            offlineQueueSize: this.offlineQueue.length,
            hasLocationPermission: 'geolocation' in navigator,
            hasNotificationPermission: Notification.permission === 'granted',
            hasServiceWorker: !!this.serviceWorker
        };
    }

    /**
     * Cleanup mobile manager
     */
    cleanup() {
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
        }
        
        this.hideOfflineBanner();
    }
}

// Initialize global mobile manager
window.mobileManager = new MobileManager();

// Make MobileManager available globally
window.MobileManager = MobileManager;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileManager;
}

export default MobileManager;
