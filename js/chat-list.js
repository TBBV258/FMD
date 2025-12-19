// Chat List Management
class ChatListManager {
    constructor() {
        this.chats = [];
        this.unreadCount = 0;
        this.initialize();
    }

    async initialize() {
        this.setupEventListeners();
        await this.loadChats();
        this.setupRealtimeUpdates();
    }

    setupEventListeners() {
        // Handle tab switching
        document.querySelectorAll('.notification-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.switchTab(type);
            });
        });
    }

    switchTab(type) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(`${type}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Update active tab
        document.querySelectorAll('.notification-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });
    }

    async loadChats() {
        try {
            // Simulate loading chats from the server
            // In a real app, this would be an API call
            this.chats = await this.fetchChats();
            this.renderChats();
        } catch (error) {
            console.error('Error loading chats:', error);
            this.showError('Failed to load chats');
        }
    }

    async fetchChats() {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock data - replace with actual API call
                resolve([
                    {
                        id: '1',
                        userId: 'user1',
                        userName: 'João Silva',
                        lastMessage: 'Olá, encontrei seu documento!',
                        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                        unread: 2,
                        avatar: 'https://ui-avatars.com/api/?name=Joao+Silva&background=random'
                    },
                    {
                        id: '2',
                        userId: 'user2',
                        userName: 'Maria Santos',
                        lastMessage: 'Obrigado pela ajuda!',
                        timestamp: new Date(Date.now() - 86400000), // 1 day ago
                        unread: 0,
                        avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=random'
                    }
                ]);
            }, 500);
        });
    }

    renderChats() {
        const container = document.getElementById('chats-list');
        if (!container) return;

        if (this.chats.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p data-i18n="chats.empty">Nenhuma conversa ativa</p>
                </div>`;
            return;
        }

        container.innerHTML = this.chats.map(chat => this.createChatItem(chat)).join('');
        this.addChatEventListeners();
        this.updateUnreadCount();
    }

    createChatItem(chat) {
        const timeAgo = this.formatTimeAgo(chat.timestamp);
        const unreadBadge = chat.unread > 0 
            ? `<span class="unread-badge">${chat.unread}</span>` 
            : '';

        return `
            <div class="chat-item" data-chat-id="${chat.id}" data-user-id="${chat.userId}">
                <div class="chat-avatar">
                    <img src="${chat.avatar}" alt="${chat.userName}'s avatar">
                </div>
                <div class="chat-details">
                    <div class="chat-header">
                        <h4 class="chat-user-name">${chat.userName}</h4>
                        <span class="chat-time">${timeAgo}</span>
                    </div>
                    <p class="chat-preview">${chat.lastMessage}</p>
                </div>
                ${unreadBadge}
            </div>`;
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            ano: 31536000,
            mês: 2592000,
            semana: 604800,
            dia: 86400,
            hora: 3600,
            minuto: 60,
            segundo: 1
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 
                    ? `há 1 ${unit}` 
                    : `há ${interval} ${unit}${interval > 1 ? 's' : ''}`;
            }
        }
        
        return 'agora mesmo';
    }

    addChatEventListeners() {
        document.querySelectorAll('.chat-item').forEach(chatItem => {
            chatItem.addEventListener('click', (e) => {
                const chatId = chatItem.dataset.chatId;
                const userId = chatItem.dataset.userId;
                this.openChat(chatId, userId);
            });
        });
    }

    openChat(chatId, userId) {
        // In a real app, this would open the chat with the specified ID
        console.log(`Opening chat ${chatId} with user ${userId}`);
        // Here you would integrate with your existing chat system
        // For example: window.chatSystem.openChat(chatId, userId);
    }

    updateUnreadCount() {
        this.unreadCount = this.chats.reduce((total, chat) => total + chat.unread, 0);
        const badge = document.getElementById('unread-chats-count');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'inline-block' : 'none';
        }
    }

    setupRealtimeUpdates() {
        // In a real app, this would set up WebSocket or similar for real-time updates
        // For now, we'll simulate updates with a timer
        setInterval(() => this.simulateNewMessage(), 30000);
    }

    simulateNewMessage() {
        if (this.chats.length === 0) return;
        
        const randomChat = this.chats[Math.floor(Math.random() * this.chats.length)];
        randomChat.unread += 1;
        randomChat.lastMessage = 'Nova mensagem recebida';
        randomChat.timestamp = new Date();
        
        this.renderChats();
        this.showNotification('Nova mensagem recebida');
    }

    showNotification(message) {
        // Simple notification
        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        console.error(message);
        // You could implement a more sophisticated error handling here
        alert(message);
    }
}

// Initialize the chat list when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatListManager = new ChatListManager();
});
