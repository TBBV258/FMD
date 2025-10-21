// Match Notifications UI Component
class MatchNotifications {
    constructor() {
        this.supabase = supabase;
        this.notificationsContainer = document.getElementById('notifications-list');
        this.matchSound = new Audio('/sounds/notification.mp3');
        this.setupEventListeners();
        this.init();
    }

    async init() {
        await this.loadUserPreferences();
        this.setupRealtimeUpdates();
        this.loadInitialNotifications();
    }

    async loadUserPreferences() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            const { data: prefs } = await this.supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single();

            this.userPrefs = prefs || {
                notifications_enabled: true,
                notification_sound: 'default',
                theme: 'light'
            };
        } catch (error) {
            console.error('Error loading user preferences:', error);
            this.userPrefs = {
                notifications_enabled: true,
                notification_sound: 'default',
                theme: 'light'
            };
        }
    }

    setupRealtimeUpdates() {
        // Listen for new match notifications
        this.supabase
            .channel('match_notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${this.userId}`
            }, (payload) => {
                if (payload.new.type === 'document_match') {
                    this.handleNewMatchNotification(payload.new);
                }
            })
            .subscribe();
    }

    async loadInitialNotifications() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            const { data: notifications, error } = await this.supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'document_match')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            this.renderNotifications(notifications || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showError('Failed to load notifications');
        }
    }

    renderNotifications(notifications) {
        if (!notifications.length) {
            this.notificationsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No match notifications yet</p>
                </div>`;
            return;
        }

        this.notificationsContainer.innerHTML = notifications
            .map(notification => this.renderNotification(notification))
            .join('');
    }

    renderNotification(notification) {
        const { id, title, message, created_at, metadata } = notification;
        const matchScore = Math.round((metadata?.match_score || 0) * 100);
        const matchClass = this.getMatchClass(matchScore);
        const date = new Date(created_at).toLocaleString();
        const actions = metadata?.actions || [];

        return `
            <div class="notification-item match-notification ${notification.status}" 
                 data-notification-id="${id}" 
                 data-match-score="${matchScore}">
                <div class="notification-header">
                    <div class="notification-title">${title}</div>
                    <div class="notification-time">${date}</div>
                </div>
                <div class="notification-body">
                    <div class="match-score ${matchClass}">
                        <span class="score">${matchScore}%</span> Match
                    </div>
                    <p class="notification-message">${message}</p>
                    ${this.renderMatchDetails(metadata?.match_details)}
                </div>
                <div class="notification-actions">
                    ${actions.map(action => 
                        `<button class="btn ${action.style || 'secondary'} small" 
                                data-action="${action.action}" 
                                data-url="${action.url}">
                            ${action.label}
                        </button>`
                    ).join('')}
                </div>
            </div>`;
    }

    renderMatchDetails(details = []) {
        if (!details.length) return '';

        return `
            <div class="match-details">
                <div class="details-header">Match Details:</div>
                <div class="details-grid">
                    ${details.map(detail => `
                        <div class="detail-item">
                            <span class="detail-label">${this.formatFieldName(detail.field)}:</span>
                            <span class="detail-value">
                                ${this.formatDetailValue(detail)}
                                ${detail.similarity !== undefined ? 
                                    `<span class="similarity">
                                        (${Math.round(detail.similarity * 100)}%)
                                    </span>` : ''
                                }
                            </span>
                        </div>`
                    ).join('')}
                </div>
            </div>`;
    }

    formatFieldName(field) {
        return field
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    formatDetailValue(detail) {
        if (detail.field === 'location' && detail.distance_km !== undefined) {
            return `${detail.distance_km.toFixed(1)} km away`;
        }
        return detail.value || detail;
    }

    getMatchClass(score) {
        if (score >= 90) return 'high';
        if (score >= 70) return 'medium';
        return 'low';
    }

    handleNewMatchNotification(notification) {
        // Play sound if enabled
        if (this.userPrefs.notifications_enabled && this.userPrefs.notification_sound) {
            this.playNotificationSound();
        }

        // Add to the top of the list
        const notificationEl = this.renderNotification(notification);
        const firstChild = this.notificationsContainer.firstChild;
        
        if (firstChild?.classList?.contains('empty-state')) {
            this.notificationsContainer.innerHTML = notificationEl;
        } else {
            this.notificationsContainer.insertAdjacentHTML('afterbegin', notificationEl);
        }

        // Show toast notification
        if (window.showToast) {
            window.showToast({
                title: notification.title,
                message: notification.message,
                type: 'success',
                duration: 10000,
                actions: [
                    {
                        text: 'View',
                        handler: () => window.location.href = notification.action_url
                    },
                    {
                        text: 'Dismiss',
                        handler: (toast) => toast.remove()
                    }
                ]
            });
        }
    }

    playNotificationSound() {
        try {
            this.matchSound.currentTime = 0;
            this.matchSound.play().catch(e => console.warn('Could not play sound:', e));
        } catch (e) {
            console.warn('Error playing notification sound:', e);
        }
    }

    setupEventListeners() {
        // Handle notification actions
        this.notificationsContainer?.addEventListener('click', async (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            e.preventDefault();
            const action = actionBtn.dataset.action;
            const notificationId = actionBtn.closest('.notification-item')?.dataset.notificationId;
            
            if (!notificationId) return;

            switch (action) {
                case 'view':
                    window.location.href = actionBtn.dataset.url;
                    break;
                    
                case 'accept':
                    await this.handleMatchAction(notificationId, 'accept');
                    break;
                    
                case 'reject':
                    await this.handleMatchAction(notificationId, 'reject');
                    break;
            }
        });
    }

    async handleMatchAction(notificationId, action) {
        try {
            // Update UI immediately for better UX
            const notificationEl = this.notificationsContainer.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notificationEl) {
                notificationEl.classList.add('processing');
                notificationEl.querySelectorAll('button').forEach(btn => {
                    btn.disabled = true;
                });
            }

            // Call the API to process the action
            const { error } = await this.supabase
                .from('match_actions')
                .insert([{
                    notification_id: notificationId,
                    action: action,
                    user_id: (await this.supabase.auth.getUser()).data.user.id
                }]);

            if (error) throw error;

            // Update notification status
            const { error: updateError } = await this.supabase
                .from('notifications')
                .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
                .eq('id', notificationId);

            if (updateError) throw updateError;

            // Update UI
            if (notificationEl) {
                notificationEl.classList.remove('processing');
                notificationEl.classList.add(action === 'accept' ? 'accepted' : 'rejected');
                notificationEl.innerHTML = `
                    <div class="action-feedback">
                        <i class="fas ${action === 'accept' ? 'fa-check-circle success' : 'fa-times-circle error'}"></i>
                        <span>Match ${action}ed successfully</span>
                    </div>
                `;
                
                // Remove after delay
                setTimeout(() => {
                    notificationEl.remove();
                    // If no notifications left, show empty state
                    if (!this.notificationsContainer.children.length) {
                        this.notificationsContainer.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-bell-slash"></i>
                                <p>No match notifications yet</p>
                            </div>`;
                    }
                }, 3000);
            }

            // If accepted, redirect to chat
            if (action === 'accept') {
                // Get the chat URL from the notification
                const { data: notification } = await this.supabase
                    .from('notifications')
                    .select('metadata->>chat_id')
                    .eq('id', notificationId)
                    .single();

                if (notification?.chat_id) {
                    window.location.href = `/chat/${notification.chat_id}`;
                }
            }

        } catch (error) {
            console.error(`Error ${action}ing match:`, error);
            this.showError(`Failed to ${action} match. Please try again.`);
            
            // Reset button states on error
            const notificationEl = this.notificationsContainer.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notificationEl) {
                notificationEl.classList.remove('processing');
                notificationEl.querySelectorAll('button').forEach(btn => {
                    btn.disabled = false;
                });
            }
        }
    }

    showError(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase !== 'undefined') {
        window.matchNotifications = new MatchNotifications();
    }
});
