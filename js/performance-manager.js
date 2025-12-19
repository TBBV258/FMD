// Performance Optimization Utilities for FindMyDocs
class PerformanceManager {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            apiResponseTimes: new Map(),
            renderTimes: new Map(),
            memoryUsage: 0,
            cacheHitRate: 0
        };
        
        this.observers = new Map();
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        
        this.initializePerformanceMonitoring();
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @param {string} key - Unique key for the debounced function
     * @returns {Function} Debounced function
     */
    debounce(func, delay, key = null) {
        const timerKey = key || func.name || 'anonymous';
        
        return (...args) => {
            clearTimeout(this.debounceTimers.get(timerKey));
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(timerKey);
            }, delay);
            
            this.debounceTimers.set(timerKey, timer);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @param {string} key - Unique key for the throttled function
     * @returns {Function} Throttled function
     */
    throttle(func, delay, key = null) {
        const timerKey = key || func.name || 'anonymous';
        
        return (...args) => {
            if (this.throttleTimers.has(timerKey)) {
                return;
            }
            
            func.apply(this, args);
            
            const timer = setTimeout(() => {
                this.throttleTimers.delete(timerKey);
            }, delay);
            
            this.throttleTimers.set(timerKey, timer);
        };
    }

    /**
     * Virtual scrolling for large lists
     */
    createVirtualScroller(container, itemHeight, renderItem, options = {}) {
        const {
            buffer = 5,
            threshold = 100
        } = options;

        let items = [];
        let scrollTop = 0;
        let containerHeight = 0;
        let visibleCount = 0;

        const updateVisibleItems = () => {
            const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
            const endIndex = Math.min(items.length, startIndex + visibleCount + buffer * 2);

            const visibleItems = items.slice(startIndex, endIndex);
            const offsetY = startIndex * itemHeight;

            container.innerHTML = '';
            container.style.paddingTop = `${offsetY}px`;
            container.style.height = `${items.length * itemHeight}px`;

            visibleItems.forEach((item, index) => {
                const element = renderItem(item, startIndex + index);
                container.appendChild(element);
            });
        };

        const handleScroll = this.throttle((e) => {
            scrollTop = e.target.scrollTop;
            updateVisibleItems();
        }, 16, 'virtual-scroll');

        return {
            setItems: (newItems) => {
                items = newItems;
                containerHeight = container.clientHeight;
                visibleCount = Math.ceil(containerHeight / itemHeight) + buffer * 2;
                updateVisibleItems();
            },
            
            addScrollListener: () => {
                container.addEventListener('scroll', handleScroll);
            },
            
            removeScrollListener: () => {
                container.removeEventListener('scroll', handleScroll);
            },
            
            scrollToItem: (index) => {
                const targetScrollTop = index * itemHeight;
                container.scrollTop = targetScrollTop;
            }
        };
    }

    /**
     * Lazy loading for images
     */
    createLazyImageLoader(options = {}) {
        const {
            rootMargin = '50px',
            threshold = 0.1
        } = options;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, { rootMargin, threshold });

        return {
            observe: (img) => observer.observe(img),
            unobserve: (img) => observer.unobserve(img),
            disconnect: () => observer.disconnect()
        };
    }

    /**
     * Load image with error handling
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        const imageLoader = new Image();
        
        imageLoader.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            delete img.dataset.src;
        };
        
        imageLoader.onerror = () => {
            img.classList.add('error');
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=';
        };
        
        imageLoader.src = src;
    }

    /**
     * Image compression utility
     */
    compressImage(file, options = {}) {
        const {
            maxWidth = 800,
            maxHeight = 600,
            quality = 0.8,
            format = 'image/jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, format, quality);
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Cache management
     */
    createCache(maxSize = 100) {
        const cache = new Map();
        
        return {
            get: (key) => cache.get(key),
            
            set: (key, value) => {
                if (cache.size >= maxSize) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }
                cache.set(key, value);
            },
            
            has: (key) => cache.has(key),
            
            delete: (key) => cache.delete(key),
            
            clear: () => cache.clear(),
            
            size: () => cache.size
        };
    }

    /**
     * Batch DOM updates
     */
    batchDOMUpdates(updates) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                updates.forEach(update => update());
                resolve();
            });
        });
    }

    /**
     * Measure performance
     */
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.metrics.renderTimes.set(name, end - start);
        
        return result;
    }

    /**
     * Measure API response time
     */
    async measureAPI(apiCall, endpoint) {
        const start = performance.now();
        
        try {
            const result = await apiCall();
            const end = performance.now();
            
            this.metrics.apiResponseTimes.set(endpoint, end - start);
            return result;
        } catch (error) {
            const end = performance.now();
            this.metrics.apiResponseTimes.set(`${endpoint}_error`, end - start);
            throw error;
        }
    }

    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        // Monitor page load time
        window.addEventListener('load', () => {
            this.metrics.pageLoadTime = performance.now();
        });

        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
            }, 30000);
        }

        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        console.warn('Long task detected:', entry.duration + 'ms');
                    }
                }
            });
            
            observer.observe({ entryTypes: ['longtask'] });
        }
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            apiResponseTimes: Object.fromEntries(this.metrics.apiResponseTimes),
            renderTimes: Object.fromEntries(this.metrics.renderTimes)
        };
    }

    /**
     * Optimize images in container
     */
    optimizeImages(container) {
        const images = container.querySelectorAll('img[data-src]');
        const lazyLoader = this.createLazyImageLoader();
        
        images.forEach(img => lazyLoader.observe(img));
        
        return lazyLoader;
    }

    /**
     * Preload critical resources
     */
    preloadResources(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.url;
            link.as = resource.type || 'image';
            
            if (resource.crossorigin) {
                link.crossOrigin = resource.crossorigin;
            }
            
            document.head.appendChild(link);
        });
    }

    /**
     * Cleanup performance monitoring
     */
    cleanup() {
        // Clear all timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.throttleTimers.forEach(timer => clearTimeout(timer));
        
        this.debounceTimers.clear();
        this.throttleTimers.clear();
        
        // Disconnect observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Initialize global performance manager
window.performanceManager = new PerformanceManager();

// Make PerformanceManager available globally
window.PerformanceManager = PerformanceManager;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
}

export default PerformanceManager;
