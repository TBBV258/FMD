import { useEffect, useCallback, useRef } from 'react';

interface PerformanceOptions {
  enableVirtualScrolling?: boolean;
  enableLazyLoading?: boolean;
  enableDebouncing?: boolean;
  debounceDelay?: number;
}

export const usePerformance = (options: PerformanceOptions = {}) => {
  const {
    enableVirtualScrolling = true,
    enableLazyLoading = true,
    enableDebouncing = true,
    debounceDelay = 300,
  } = options;

  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const intersectionObserver = useRef<IntersectionObserver | null>(null);
  const virtualScrollerRef = useRef<HTMLDivElement | null>(null);

  // Debounce function for search inputs and other frequent updates
  const debounce = useCallback(
    (key: string, callback: () => void) => {
      if (!enableDebouncing) {
        callback();
        return;
      }

      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const newTimer = setTimeout(() => {
        callback();
        debounceTimers.current.delete(key);
      }, debounceDelay);

      debounceTimers.current.set(key, newTimer);
    },
    [enableDebouncing, debounceDelay]
  );

  // Lazy loading for images and heavy content
  const setupLazyLoading = useCallback(() => {
    if (!enableLazyLoading || !('IntersectionObserver' in window)) {
      return;
    }

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            
            // Handle lazy images
            if (target.tagName === 'IMG') {
              const img = target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
              }
            }

            // Handle lazy content
            if (target.dataset.lazyContent) {
              target.innerHTML = target.dataset.lazyContent;
              target.removeAttribute('data-lazy-content');
              target.classList.remove('lazy');
            }

            intersectionObserver.current?.unobserve(target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );
  }, [enableLazyLoading]);

  // Virtual scrolling for large lists
  const setupVirtualScrolling = useCallback(() => {
    if (!enableVirtualScrolling || !virtualScrollerRef.current) {
      return;
    }

    const container = virtualScrollerRef.current;
    const items = Array.from(container.children) as HTMLElement[];
    
    if (items.length === 0) return;

    const itemHeight = items[0].offsetHeight;
    const containerHeight = container.offsetHeight;
    const visibleItems = Math.ceil(containerHeight / itemHeight) + 2; // Buffer

    let startIndex = 0;
    let endIndex = Math.min(visibleItems, items.length);

    const updateVisibleItems = () => {
      const scrollTop = container.scrollTop;
      startIndex = Math.floor(scrollTop / itemHeight);
      endIndex = Math.min(startIndex + visibleItems, items.length);

      // Hide items outside visible range
      items.forEach((item, index) => {
        if (index >= startIndex && index < endIndex) {
          item.style.display = '';
          item.style.position = 'absolute';
          item.style.top = `${index * itemHeight}px`;
        } else {
          item.style.display = 'none';
        }
      });

      // Update container height for proper scrolling
      container.style.height = `${items.length * itemHeight}px`;
    };

    container.addEventListener('scroll', updateVisibleItems);
    updateVisibleItems();

    return () => {
      container.removeEventListener('scroll', updateVisibleItems);
    };
  }, [enableVirtualScrolling]);

  // Memory management and cleanup
  const cleanup = useCallback(() => {
    // Clear all debounce timers
    debounceTimers.current.forEach((timer) => clearTimeout(timer));
    debounceTimers.current.clear();

    // Disconnect intersection observer
    if (intersectionObserver.current) {
      intersectionObserver.current.disconnect();
      intersectionObserver.current = null;
    }
  }, []);

  // Performance monitoring
  const measurePerformance = useCallback((name: string, fn: () => void) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(`⚡ Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    } else {
      fn();
    }
  }, []);

  // Throttle function for scroll events
  const throttle = useCallback(
    (key: string, callback: () => void, delay: number = 100) => {
      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) {
        return;
      }

      const newTimer = setTimeout(() => {
        callback();
        debounceTimers.current.delete(key);
      }, delay);

      debounceTimers.current.set(key, newTimer);
    },
    []
  );

  // Setup performance optimizations
  useEffect(() => {
    setupLazyLoading();
    setupVirtualScrolling();

    return cleanup;
  }, [setupLazyLoading, setupVirtualScrolling, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    debounce,
    throttle,
    measurePerformance,
    virtualScrollerRef,
    setupLazyLoading,
    setupVirtualScrolling,
    cleanup,
  };
};
