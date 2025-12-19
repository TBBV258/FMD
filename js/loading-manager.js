// Loading States and Skeleton Screens for FindMyDocs
class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
        this.skeletonTemplates = this.createSkeletonTemplates();
    }

    /**
     * Show loading state for a specific element
     * @param {string} elementId - ID of the element to show loading for
     * @param {string} type - Type of loading (skeleton, spinner, progress)
     * @param {Object} options - Additional options
     */
    showLoading(elementId, type = 'skeleton', options = {}) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Store original content
        if (!this.loadingStates.has(elementId)) {
            this.loadingStates.set(elementId, {
                originalContent: element.innerHTML,
                originalClass: element.className
            });
        }

        // Add loading class
        element.classList.add('loading-state');

        // Show appropriate loading type
        switch (type) {
            case 'skeleton':
                this.showSkeleton(element, options);
                break;
            case 'spinner':
                this.showSpinner(element, options);
                break;
            case 'progress':
                this.showProgress(element, options);
                break;
            default:
                this.showSkeleton(element, options);
        }
    }

    /**
     * Hide loading state and restore original content
     * @param {string} elementId - ID of the element
     */
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const state = this.loadingStates.get(elementId);
        if (!state) return;

        // Remove loading class
        element.classList.remove('loading-state');

        // Restore original content
        element.innerHTML = state.originalContent;
        element.className = state.originalClass;

        // Remove from loading states
        this.loadingStates.delete(elementId);
    }

    /**
     * Show skeleton loading
     */
    showSkeleton(element, options = {}) {
        const template = options.template || this.detectSkeletonTemplate(element);
        element.innerHTML = this.skeletonTemplates[template] || this.skeletonTemplates.default;
    }

    /**
     * Show spinner loading
     */
    showSpinner(element, options = {}) {
        const message = options.message || 'Carregando...';
        const size = options.size || 'medium';
        
        element.innerHTML = `
            <div class="loading-spinner ${size}">
                <div class="spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
    }

    /**
     * Show progress loading
     */
    showProgress(element, options = {}) {
        const message = options.message || 'Carregando...';
        const progress = options.progress || 0;
        
        element.innerHTML = `
            <div class="loading-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <p class="loading-message">${message}</p>
                <span class="progress-percentage">${Math.round(progress)}%</span>
            </div>
        `;
    }

    /**
     * Detect appropriate skeleton template based on element
     */
    detectSkeletonTemplate(element) {
        const id = element.id;
        const className = element.className;

        if (id.includes('documents-grid') || className.includes('documents-grid')) {
            return 'documentsGrid';
        }
        if (id.includes('profile') || className.includes('profile')) {
            return 'profile';
        }
        if (id.includes('feed') || className.includes('feed')) {
            return 'feed';
        }
        if (id.includes('notifications') || className.includes('notifications')) {
            return 'notifications';
        }
        if (className.includes('document-card')) {
            return 'documentCard';
        }
        if (className.includes('user-card')) {
            return 'userCard';
        }

        return 'default';
    }

    /**
     * Create skeleton templates
     */
    createSkeletonTemplates() {
        return {
            default: `
                <div class="skeleton-container">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line medium"></div>
                </div>
            `,

            documentCard: `
                <div class="skeleton-document-card">
                    <div class="skeleton-header">
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                        </div>
                    </div>
                    <div class="skeleton-body">
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line"></div>
                    </div>
                    <div class="skeleton-actions">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                    </div>
                </div>
            `,

            documentsGrid: `
                <div class="skeleton-grid">
                    ${Array(6).fill(0).map(() => `
                <div class="skeleton-document-card">
                    <div class="skeleton-header">
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                        </div>
                    </div>
                    <div class="skeleton-body">
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line"></div>
                    </div>
                    <div class="skeleton-actions">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                    </div>
                </div>
            `).join('')}
                </div>
            `,

            profile: `
                <div class="skeleton-profile">
                    <div class="skeleton-profile-header">
                        <div class="skeleton-avatar large"></div>
                        <div class="skeleton-profile-info">
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                            <div class="skeleton-badges">
                                <div class="skeleton-badge"></div>
                                <div class="skeleton-badge"></div>
                            </div>
                        </div>
                    </div>
                    <div class="skeleton-profile-stats">
                        <div class="skeleton-stat">
                            <div class="skeleton-number"></div>
                            <div class="skeleton-label"></div>
                        </div>
                        <div class="skeleton-stat">
                            <div class="skeleton-number"></div>
                            <div class="skeleton-label"></div>
                        </div>
                        <div class="skeleton-stat">
                            <div class="skeleton-number"></div>
                            <div class="skeleton-label"></div>
                        </div>
                    </div>
                </div>
            `,

            feed: `
                <div class="skeleton-feed">
                    ${Array(5).fill(0).map(() => `
                        <div class="skeleton-feed-item">
                            <div class="skeleton-feed-header">
                                <div class="skeleton-avatar"></div>
                                <div class="skeleton-content">
                                    <div class="skeleton-line"></div>
                                    <div class="skeleton-line short"></div>
                                </div>
                            </div>
                            <div class="skeleton-feed-body">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line medium"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `,

            notifications: `
                <div class="skeleton-notifications">
                    ${Array(8).fill(0).map(() => `
                        <div class="skeleton-notification-item">
                            <div class="skeleton-icon"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                                <div class="skeleton-line tiny"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `,

            userCard: `
                <div class="skeleton-user-card">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-badge"></div>
                    </div>
                    <div class="skeleton-points">
                        <div class="skeleton-number"></div>
                    </div>
                </div>
            `
        };
    }

    /**
     * Create a loading overlay for the entire page
     */
    showPageLoading(message = 'Carregando...') {
        const overlay = document.createElement('div');
        overlay.id = 'page-loading-overlay';
        overlay.className = 'page-loading-overlay';
        overlay.innerHTML = `
            <div class="page-loading-content">
                <div class="loading-spinner large">
                    <div class="spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    /**
     * Hide page loading overlay
     */
    hidePageLoading() {
        const overlay = document.getElementById('page-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Show loading for multiple elements
     */
    showMultipleLoading(elements, type = 'skeleton') {
        elements.forEach(element => {
            this.showLoading(element.id || element, type);
        });
    }

    /**
     * Hide loading for multiple elements
     */
    hideMultipleLoading(elements) {
        elements.forEach(element => {
            this.hideLoading(element.id || element);
        });
    }

    /**
     * Create a loading button
     */
    createLoadingButton(button, text = 'Carregando...') {
        const originalText = button.textContent;
        const originalDisabled = button.disabled;
        
        button.disabled = true;
        button.innerHTML = `
            <span class="button-spinner"></span>
            ${text}
        `;
        
        return {
            restore: () => {
                button.disabled = originalDisabled;
                button.textContent = originalText;
            }
        };
    }

    /**
     * Show loading state for form submission
     */
    showFormLoading(form, submitButton) {
        const button = submitButton || form.querySelector('button[type="submit"]');
        if (button) {
            return this.createLoadingButton(button, 'Enviando...');
        }
    }

    /**
     * Get loading statistics
     */
    getLoadingStats() {
        return {
            activeLoadings: this.loadingStates.size,
            loadingElements: Array.from(this.loadingStates.keys())
        };
    }
}

// Initialize global loading manager
window.loadingManager = new LoadingManager();

// Make LoadingManager available globally
window.LoadingManager = LoadingManager;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingManager;
}

export default LoadingManager;
