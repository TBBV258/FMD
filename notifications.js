// Notifications System

class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.lastSubscriptionReminder = null;
        
        // Initialize
        this.loadNotifications();
        this.setupEventListeners();
        this.checkSubscriptionReminders();
        
        // Check for new notifications every 5 minutes
        setInterval(() => this.checkForNewNotifications(), 5 * 60 * 1000);
        
        // Check subscription status daily
        setInterval(() => this.checkSubscriptionReminders(), 24 * 60 * 60 * 1000);
    }
    
    // Load notifications from Supabase
    async loadNotifications() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const { data: notifications, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            this.notifications = notifications || [];
            this.updateUnreadCount();
            
            // Set up real-time subscription for new notifications
            this.setupRealtimeUpdates(user.id);
            
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Fallback to localStorage if Supabase fails
            const savedNotifications = localStorage.getItem('notifications');
            if (savedNotifications) {
                this.notifications = JSON.parse(savedNotifications);
                this.updateUnreadCount();
            }
        }
        
        // Load last subscription reminder date
        const lastReminder = localStorage.getItem('lastSubscriptionReminder');
        if (lastReminder) {
            this.lastSubscriptionReminder = new Date(lastReminder);
        }
    }
    
    // Save notifications to Supabase
    async saveNotifications() {
        try {
            // We don't need to save all notifications to Supabase here
            // as they are already saved when added individually
            this.updateBadge();
        } catch (error) {
            console.error('Error saving notifications:', error);
            // Fallback to localStorage
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
        }
    }
    
    // Update the unread count and badge
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateBadge();
    }
    
    // Update the notification badge
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    // Add a new notification
    async addNotification(notification) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            
            const newNotification = {
                user_id: user.id,
                type: notification.type || 'info',
                title: notification.title,
                message: notification.message,
                is_read: false,
                action_url: notification.action?.url || null,
                metadata: notification.data || {},
                created_at: new Date().toISOString()
            };
            
            // Save to Supabase
            const { data: savedNotification, error } = await supabase
                .from('notifications')
                .insert([newNotification])
                .select()
                .single();
                
            if (error) throw error;
            
            // Add to local state
            const formattedNotification = {
                id: savedNotification.id,
                type: savedNotification.type,
                title: savedNotification.title,
                message: savedNotification.message,
                timestamp: new Date(savedNotification.created_at),
                read: savedNotification.is_read,
                data: savedNotification.metadata || {},
                action: notification.action
            };
            
            this.notifications.unshift(formattedNotification);
            this.updateUnreadCount();
            
            // Show desktop notification if enabled and not on the notifications page
            if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
                this.showDesktopNotification(formattedNotification);
            }
            
            return formattedNotification;
            
        } catch (error) {
            console.error('Error adding notification:', error);
            
            // Fallback to localStorage
            const fallbackNotification = {
                id: Date.now().toString(),
                type: notification.type || 'info',
                title: notification.title,
                message: notification.message,
                timestamp: new Date(),
                read: false,
                data: notification.data || {},
                action: notification.action
            };
            
            this.notifications.unshift(fallbackNotification);
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
            this.updateUnreadCount();
            
            return fallbackNotification;
        }
    }
    
    // Mark a notification as read
    async markAsRead(notificationId) {
        try {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (!notification || notification.read) return;
            
            // Update in Supabase
            const { error } = await supabase
                .from('notifications')
                .update({ 
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', notificationId);
                
            if (error) throw error;
            
            // Update local state
            notification.read = true;
            this.updateUnreadCount();
            this.renderNotificationsList();
            
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Fallback to local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                localStorage.setItem('notifications', JSON.stringify(this.notifications));
                this.updateUnreadCount();
                this.renderNotificationsList();
            }
        }
    }
    
    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Mark all as read in Supabase
            const { error } = await supabase
                .from('notifications')
                .update({ 
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('is_read', false);
                
            if (error) throw error;
            
            // Update local state
            this.notifications.forEach(notification => {
                if (!notification.read) {
                    notification.read = true;
                }
            });
            
            this.updateUnreadCount();
            this.renderNotificationsList();
            
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            // Fallback to local state
            let updated = false;
            this.notifications.forEach(notification => {
                if (!notification.read) {
                    notification.read = true;
                    updated = true;
                }
            });
            
            if (updated) {
                localStorage.setItem('notifications', JSON.stringify(this.notifications));
                this.updateUnreadCount();
                this.renderNotificationsList();
            }
        }
    }
    
    // Delete a notification
    async deleteNotification(notificationId) {
        try {
            // Delete from Supabase
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);
                
            if (error) throw error;
            
            // Update local state
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                this.notifications.splice(index, 1);
                this.updateUnreadCount();
                this.renderNotificationsList();
            }
            
        } catch (error) {
            console.error('Error deleting notification:', error);
            // Fallback to local state
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                this.notifications.splice(index, 1);
                localStorage.setItem('notifications', JSON.stringify(this.notifications));
                this.updateUnreadCount();
                this.renderNotificationsList();
            }
        }
    }
    
    // Clear all notifications
    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateUnreadCount();
        this.renderNotificationsList();
    }
    
    // Set up real-time updates for notifications
    setupRealtimeUpdates(userId) {
        // Subscribe to new notifications
        const subscription = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                const newNotification = {
                    id: payload.new.id,
                    type: payload.new.type,
                    title: payload.new.title,
                    message: payload.new.message,
                    timestamp: new Date(payload.new.created_at),
                    read: payload.new.is_read,
                    data: payload.new.metadata || {},
                    action: payload.new.action_url ? {
                        text: 'View',
                        url: payload.new.action_url
                    } : null
                };
                
                // Add to local state if not already present
                if (!this.notifications.some(n => n.id === newNotification.id)) {
                    this.notifications.unshift(newNotification);
                    this.updateUnreadCount();
                    
                    // Show desktop notification if enabled and not on the notifications page
                    if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
                        this.showDesktopNotification(newNotification);
                    }
                    
                    // Re-render if on notifications page
                    if (window.location.hash === '#notifications') {
                        this.renderNotificationsList();
                    }
                }
            })
            .subscribe();
            
        // Store subscription for cleanup
        this.subscription = subscription;
    }
    
    // Load existing conversations for notifications
    async loadExistingConversations() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load chat conversations
            if (window.chat && window.chat.loadChatHistoryList) {
                await window.chat.loadChatHistoryList();
            }

            // Load document matches
            if (window.documentMatcher) {
                await window.documentMatcher.checkForMatches();
            }
        } catch (error) {
            console.error('Error loading existing conversations:', error);
        }
    }

    // Check for subscription reminders
    async checkSubscriptionReminders() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Get user's subscription info
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('plan, subscription_end_date')
                .eq('id', user.id)
                .single();
                
            if (error) throw error;
            if (!profile) return;
            
            // Skip if user is on free plan
            if (profile.plan === 'free') return;
            
            // Check subscription end date
            if (!profile.subscription_end_date) return;
            
            const subscriptionEndDate = new Date(profile.subscription_end_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((subscriptionEndDate - today) / (1000 * 60 * 60 * 24));
            
            // If subscription is expiring in 7 days or less
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                // Check if we've shown a reminder in the last 2 days
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                
                if (!this.lastSubscriptionReminder || this.lastSubscriptionReminder < twoDaysAgo) {
                    await this.addSubscriptionReminder(daysUntilExpiry);
                    this.lastSubscriptionReminder = new Date();
                    localStorage.setItem('lastSubscriptionReminder', this.lastSubscriptionReminder.toISOString());
                }
            }
            
        } catch (error) {
            console.error('Error checking subscription reminders:', error);
            // Fallback to example date if there's an error
            const subscriptionEndDate = new Date('2025-12-31');
            const today = new Date();
            const daysUntilExpiry = Math.ceil((subscriptionEndDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                
                if (!this.lastSubscriptionReminder || this.lastSubscriptionReminder < twoDaysAgo) {
                    this.addSubscriptionReminder(daysUntilExpiry);
                    this.lastSubscriptionReminder = new Date();
                    localStorage.setItem('lastSubscriptionReminder', this.lastSubscriptionReminder.toISOString());
                }
            }
        }
    }
    
    // Add a subscription reminder notification
    async addSubscriptionReminder(daysLeft) {
        let message, type = 'warning';
        
        if (daysLeft <= 0) {
            message = 'Sua assinatura expirou. Atualize agora para continuar usando todos os recursos.';
            type = 'danger';
        } else if (daysLeft === 1) {
            message = 'Sua assinatura expira amanhã! Renove agora para evitar interrupções.';
        } else {
            message = `Sua assinatura expira em ${daysLeft} dias. Renove agora para continuar sem interrupções.`;
        }
        
        await this.addNotification({
            type: type,
            title: 'Status da Assinatura',
            message: message,
            action: {
                text: 'Ver Planos',
                url: '#perfil'
            }
        });
    }
    
    // Show a desktop notification
    showDesktopNotification(notification) {
        const notificationOptions = {
            body: notification.message,
            icon: '/favicon.png',
            tag: notification.id
        };
        
        new Notification(notification.title, notificationOptions);
    }
    
    // Request notification permission
    requestNotificationPermission() {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    }
    
    // Render the notifications list
    renderNotificationsList() {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <i class="far fa-bell-slash"></i>
                    <p data-i18n="notifications.empty">Nenhuma notificação encontrada</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.notifications.map(notification => {
            const timeAgo = this.formatTimeAgo(notification.timestamp);
            const icon = this.getNotificationIcon(notification.type);
            
            return `
                <div class="notification-item ${notification.type} ${!notification.read ? 'unread' : ''}" 
                     data-id="${notification.id}">
                    <div class="notification-meta">
                        <div class="notification-icon">
                            <i class="${icon}"></i>
                        </div>
                        <div class="notification-content">
                            <strong>${notification.title}</strong>
                            <p>${notification.message}</p>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                    </div>
                    <div class="notification-actions">
                        ${notification.action ? `
                            <button class="btn small primary" data-action="${notification.id}">
                                ${notification.action.text}
                            </button>
                        ` : ''}
                        <button class="btn small icon" data-delete="${notification.id}" title="Remover">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        document.querySelectorAll('.notification-item').forEach(item => {
            const id = item.getAttribute('data-id');
            item.addEventListener('click', () => this.handleNotificationClick(id));
        });
        
        document.querySelectorAll('[data-action]').forEach(button => {
            const id = button.getAttribute('data-action');
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const notification = this.notifications.find(n => n.id === id);
                if (notification && notification.action && notification.action.callback) {
                    notification.action.callback();
                }
            });
        });
        
        document.querySelectorAll('[data-delete]').forEach(button => {
            const id = button.getAttribute('data-delete');
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNotification(id);
            });
        });
    }
    
    // Handle notification click
    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            this.markAsRead(notificationId);
            
            // If there's a link in the notification data, navigate to it
            if (notification.data && notification.data.link) {
                window.location.href = notification.data.link;
            }
        }
    }
    
    // Format time ago
    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} h`;
        if (diffInSeconds < 604800) return `Há ${Math.floor(diffInSeconds / 86400)} d`;
        
        return new Date(date).toLocaleDateString();
    }
    
    // Get icon based on notification type
    getNotificationIcon(type) {
        const icons = {
            'info': 'fas fa-info-circle',
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-triangle',
            'danger': 'fas fa-exclamation-circle',
            'message': 'fas fa-comment-alt',
            'chat': 'fas fa-comments',
            'subscription': 'fas fa-credit-card'
        };
        
        return icons[type] || 'fas fa-bell';
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Mark all as read button
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Request notification permission when clicking the notifications tab
        const notificationsTab = document.querySelector('[data-section="notifications"]');
        if (notificationsTab) {
            notificationsTab.addEventListener('click', () => this.requestNotificationPermission());
        }

        // Listen for new chat messages from Supabase
        if (typeof supabase !== 'undefined') {
            (async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const chatSubscription = supabase
                            .channel('chats')
                            .on('postgres_changes', {
                                event: 'INSERT',
                                schema: 'public',
                                table: 'chats',
                                filter: `receiver_id=eq.${user.id}`
                            }, async (payload) => {
                                // Get sender's profile
                                const { data: sender, error } = await supabase
                                    .from('user_profiles')
                                    .select('full_name')
                                    .eq('id', payload.new.sender_id)
                                    .single();

                                const senderName = sender?.full_name || 'Alguém';

                                this.addNotification({
                                    type: 'chat',
                                    title: `Nova mensagem de ${senderName}`,
                                    message: payload.new.message.length > 50
                                        ? payload.new.message.substring(0, 47) + '...'
                                        : payload.new.message,
                                    data: {
                                        chat_id: payload.new.id,
                                        document_id: payload.new.document_id,
                                        sender_id: payload.new.sender_id
                                    },
                                    action: {
                                        text: 'Responder',
                                        url: `#chat?document_id=${payload.new.document_id}&user_id=${payload.new.sender_id}`
                                    }
                                });
                            })
                            .subscribe();

                        // Store subscription for cleanup
                        this.chatSubscription = chatSubscription;
                    }
                } catch (error) {
                    console.error('Error setting up chat notifications:', error);
                }
            })();
        }
    }
}

// Initialize notifications manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to be initialized
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not found. Make sure supabaseClient.js is loaded before notifications.js');
        return;
    }
    
    // Create notifications manager
    window.notificationsManager = new NotificationsManager();
    
    // Render notifications when the notifications section is shown
    document.addEventListener('section-shown', (e) => {
        if (e.detail.sectionId === 'notifications' && window.notificationsManager) {
            window.notificationsManager.renderNotificationsList();
        }
    });
    
    // Clean up subscriptions when page is unloaded
    window.addEventListener('beforeunload', () => {
        if (window.notificationsManager) {
            if (window.notificationsManager.subscription) {
                supabase.removeChannel(window.notificationsManager.subscription);
            }
            if (window.notificationsManager.chatSubscription) {
                supabase.removeChannel(window.notificationsManager.chatSubscription);
            }
        }
    });
});
