class ChatBoxController {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadChats();
    }

    initializeElements() {
        // Create chat box container if it doesn't exist
        if (!document.getElementById('chat-box')) {
            const chatBox = document.createElement('div');
            chatBox.id = 'chat-box';
            chatBox.className = 'chat-box-container chat-box-minimized';
            chatBox.innerHTML = `
                <div class="chat-box-header">
                    <h3>Conversas <span id="unread-count" class="unread-badge" style="display: none">0</span></h3>
                    <button class="chat-box-toggle">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                </div>
                <div class="chat-list" id="chat-list"></div>
            `;
            document.body.appendChild(chatBox);
        }

        this.chatBox = document.getElementById('chat-box');
        this.chatList = document.getElementById('chat-list');
        this.toggleButton = this.chatBox.querySelector('.chat-box-toggle');
        this.unreadCount = document.getElementById('unread-count');
    }

    setupEventListeners() {
        // Toggle chat box
        this.toggleButton.addEventListener('click', () => this.toggleChatBox());

        // Handle chat item clicks
        this.chatList.addEventListener('click', (e) => {
            const chatItem = e.target.closest('.chat-item');
            if (chatItem) {
                const chatId = chatItem.dataset.chatId;
                this.openChat(chatId);
            }
        });

        // Handle mobile view
        if (window.innerWidth <= 768) {
            document.addEventListener('click', (e) => {
                if (!this.chatBox.contains(e.target)) {
                    this.chatBox.classList.remove('show');
                }
            });
        }
    }

    toggleChatBox() {
        this.chatBox.classList.toggle('chat-box-minimized');
        const icon = this.toggleButton.querySelector('i');
        icon.className = this.chatBox.classList.contains('chat-box-minimized') 
            ? 'fas fa-chevron-up' 
            : 'fas fa-chevron-down';

        if (window.innerWidth <= 768) {
            this.chatBox.classList.toggle('show');
        }
    }

    async loadChats() {
        try {
            const response = await supabase
                .from('chats')
                .select(`
                    id,
                    last_message,
                    last_message_time,
                    participants (
                        id,
                        name,
                        avatar_url
                    )
                `)
                .order('last_message_time', { ascending: false });

            if (response.error) throw response.error;

            this.renderChats(response.data);
            this.updateUnreadCount(response.data);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }

    renderChats(chats) {
        this.chatList.innerHTML = chats.map(chat => `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="chat-item-avatar">
                    ${this.getAvatarContent(chat.participants[0])}
                </div>
                <div class="chat-item-content">
                    <div class="chat-item-name">${chat.participants[0].name}</div>
                    <div class="chat-item-preview">${chat.last_message || 'Iniciar conversa...'}</div>
                </div>
            </div>
        `).join('');
    }

    getAvatarContent(participant) {
        if (participant.avatar_url) {
            return `<img src="${participant.avatar_url}" alt="${participant.name}" />`;
        }
        return participant.name.charAt(0).toUpperCase();
    }

    updateUnreadCount(chats) {
        const unreadChats = chats.filter(chat => chat.unread);
        if (unreadChats.length > 0) {
            this.unreadCount.textContent = unreadChats.length;
            this.unreadCount.style.display = 'inline';
        } else {
            this.unreadCount.style.display = 'none';
        }
    }

    openChat(chatId) {
        // Navigate to chat page or open chat modal
        window.location.href = `/chat.html?id=${chatId}`;
    }
}

// Initialize chat box
document.addEventListener('DOMContentLoaded', () => {
    new ChatBoxController();
});