// chat.js - Chat functionality using Supabase Realtime

class Chat {
    constructor(supabase) {
        this.supabase = supabase;
        this.currentUserId = null;
        this.currentChatId = null;
        this.channel = null;
        this.unreadCount = 0;
    }

    // Initialize the chat
    async init() {
        try {
            // Get current user
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;

            if (!user) return;

            this.currentUserId = user.id;
            this.setupEventListeners();
            this.setupRealtime();

            // Load unread message count
            this.updateUnreadCount();

            // Check for unread messages every 30 seconds
            setInterval(() => this.updateUnreadCount(), 30000);

        } catch (error) {
            console.error('Error initializing chat:', error);
        }
    }

    // Setup event listeners for the chat UI
    setupEventListeners() {
        // Chat toggle
        document.getElementById('chat-toggle')?.addEventListener('click', () => {
            const chatContainer = document.getElementById('chat-container');
            chatContainer.classList.toggle('active');

            // Mark messages as read when opening chat
            if (chatContainer.classList.contains('active') && this.currentChatId) {
                this.markConversationAsRead(this.currentChatId);
            }
        });

        // Close chat
        document.getElementById('chat-close')?.addEventListener('click', () => {
            document.getElementById('chat-container').classList.remove('active');
        });

        // Send message when pressing Enter (but allow Shift+Enter for new lines)
        document.getElementById('chat-message-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }

            // Auto-resize textarea
            this.autoResizeTextarea(e.target);
        });

        // Send button click
        document.getElementById('chat-send-button')?.addEventListener('click', () => this.sendMessage());
    }

    // Auto-resize textarea as user types
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }

    // Setup realtime subscription for new messages
    setupRealtime() {
        // Unsubscribe from any existing channel
        if (this.channel) {
            this.supabase.removeChannel(this.channel);
        }

        // Subscribe to new messages
        this.channel = this.supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${this.currentUserId}`
                },
                (payload) => {
                    this.handleNewMessage(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${this.currentUserId}`
                },
                (payload) => {
                    this.handleUpdatedMessage(payload.new);
                }
            )
            .subscribe();
    }

    // Handle sending a new message
    async sendMessage() {
        const messageInput = document.getElementById('chat-message-input');
        const message = messageInput.value.trim();

        if (!message || !this.currentChatId) return;

        // Create a temporary message ID for optimistic UI update
        const tempMessageId = `temp-${Date.now()}`;
        const messageData = {
            id: tempMessageId,
            sender_id: this.currentUserId,
            receiver_id: this.currentChatId,
            content: message,
            document_id: this.currentDocumentId || null,
            created_at: new Date().toISOString(),
            is_read: false,
            is_sending: true // Custom flag for UI
        };

        // Add message to UI immediately (optimistic update)
        this.addMessageToUI(messageData);

        try {
            const { data, error } = await this.supabase
                .from('messages')
                .insert([{
                    sender_id: this.currentUserId,
                    receiver_id: this.currentChatId,
                    content: message,
                    document_id: this.currentDocumentId || null
                }])
                .select()
                .single();

            if (error) throw error;

            // Update the message in the UI with the real ID
            const tempMessage = document.querySelector(`[data-temp-id="${tempMessageId}"]`);
            if (tempMessage) {
                tempMessage.dataset.messageId = data.id;
                tempMessage.removeAttribute('data-temp-id');
                tempMessage.classList.remove('sending');
            }

            // Clear input and reset height
            messageInput.value = '';
            messageInput.style.height = 'auto';

        } catch (error) {
            console.error('Error sending message:', error);

            // Show error in UI
            const tempMessage = document.querySelector(`[data-temp-id="${tempMessageId}"]`);
            if (tempMessage) {
                tempMessage.classList.add('error');
                tempMessage.innerHTML += '<div class="message-error">Falha ao enviar</div>';
            }
        }
    }

    // Handle incoming message
    handleNewMessage(message) {
        // Only add to UI if it's from the current chat
        if (this.currentChatId === message.sender_id) {
            this.addMessageToUI(message);
            this.markAsRead([message.id]);
        } else {
            // Show notification for new message
            this.showNotification(message);
        }

        // Update unread count
        this.updateUnreadCount();
    }

    // Handle message updates (e.g., read receipts)
    handleUpdatedMessage(message) {
        const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
        if (messageElement) {
            // Update read status
            const readStatus = messageElement.querySelector('.message-read-status');
            if (readStatus) {
                readStatus.textContent = message.is_read ? '✓✓' : '✓';
            }
        }
    }

    // Add message to the chat UI
    addMessageToUI(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const isCurrentUser = message.sender_id === this.currentUserId;
        const messageTime = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isSending = message.is_sending;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isCurrentUser ? 'sent' : 'received'} ${isSending ? 'sending' : ''}`;
        messageElement.dataset.messageId = message.id;
        if (message.id.startsWith('temp-')) {
            messageElement.dataset.tempId = message.id;
        }

        messageElement.innerHTML = `
            <div class="message-content">${this.escapeHtml(message.content)}</div>
            <div class="message-meta">
                <span class="message-time">${messageTime}</span>
                ${isCurrentUser ? `<span class="message-read-status">${message.is_read ? '✓✓' : '✓'}</span>` : ''}
            </div>
            ${isSending ? '<div class="message-sending">Enviando...</div>' : ''}
        `;

        // If it's a new message, scroll to bottom
        const shouldScroll = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 50;

        messagesContainer.appendChild(messageElement);

        if (shouldScroll) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // If it's the current chat, mark as read
        if (this.currentChatId === message.sender_id && !isCurrentUser) {
            this.markAsRead([message.id]);
        }
    }

    // Mark messages as read
    async markAsRead(messageIds) {
        if (!messageIds.length) return;

        try {
            await this.supabase
                .from('messages')
                .update({ is_read: true })
                .in('id', messageIds)
                .eq('receiver_id', this.currentUserId)
                .eq('is_read', false);

            // Update unread count
            this.updateUnreadCount();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Mark all messages in a conversation as read
    async markConversationAsRead(otherUserId) {
        try {
            // Get unread message IDs
            const { data: unreadMessages } = await this.supabase
                .from('messages')
                .select('id')
                .eq('sender_id', otherUserId)
                .eq('receiver_id', this.currentUserId)
                .eq('is_read', false);

            if (unreadMessages?.length) {
                const messageIds = unreadMessages.map(msg => msg.id);
                await this.markAsRead(messageIds);

                // Update UI
                document.querySelectorAll('.chat-message.received .message-read-status').forEach(el => {
                    el.textContent = '✓✓';
                });
            }
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    }

    // Update unread message count
    async updateUnreadCount() {
        try {
            const { count, error } = await this.supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', this.currentUserId)
                .eq('is_read', false);

            if (error) throw error;

            this.unreadCount = count || 0;
            this.updateUnreadBadge();

        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    }

    // Update the unread badge in the UI
    updateUnreadBadge() {
        const unreadBadge = document.getElementById('unread-count');
        if (!unreadBadge) return;

        if (this.unreadCount > 0) {
            unreadBadge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
            unreadBadge.style.display = 'flex';

            // Add pulse animation
            unreadBadge.classList.add('pulse');
            setTimeout(() => unreadBadge.classList.remove('pulse'), 1000);
        } else {
            unreadBadge.style.display = 'none';
        }
    }

    // Show notification for new message
    async showNotification(message) {
        // Check if browser supports notifications
        if (!("Notification" in window)) {
            return;
        }

        // Check if we're in the chat with this user
        if (this.currentChatId === message.sender_id) {
            return;
        }

        // Get sender info
        let senderName = 'Alguém';
        try {
            const { data: sender } = await this.supabase
                .from('user_profiles')
                .select('full_name')
                .eq('id', message.sender_id)
                .single();

            if (sender?.full_name) {
                senderName = sender.full_name.split(' ')[0]; // First name only
            }
        } catch (error) {
            console.error('Error getting sender info:', error);
        }

        // Check if notification permission is already granted
        if (Notification.permission === "granted") {
            this.createNotification(senderName, message);
        }
        // Otherwise, ask the user for permission
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    this.createNotification(senderName, message);
                }
            });
        }

        // Update unread count
        this.updateUnreadCount();
    }

    createNotification(senderName, message) {
        // Create a notification
        const notification = new Notification(`${senderName} diz:`, {
            body: message.content.length > 100
                ? message.content.substring(0, 100) + '...'
                : message.content,
            icon: "/images/notification-icon.png"
        });

        // Handle notification click
        notification.onclick = () => {
            window.focus();
            this.openChat(message.sender_id);
            notification.close();
        };
    }

    // Open chat with a specific user
    async openChat(userId, documentId = null) {
        // Don't reopen the same chat
        if (this.currentChatId === userId && document.getElementById('chat-container').classList.contains('active')) {
            return;
        }

        this.currentChatId = userId;
        this.currentDocumentId = documentId;

        // Show chat UI
        const chatContainer = document.getElementById('chat-container');
        chatContainer.classList.add('active');

        // Update chat header with user info
        await this.updateChatHeader(userId);

        // Load chat history
        await this.loadChatHistory();

        // Mark messages as read
        this.markConversationAsRead(userId);

        // Focus message input
        setTimeout(() => {
            document.getElementById('chat-message-input')?.focus();
        }, 100);
    }

    // Update chat header with user info
    async updateChatHeader(userId) {
        try {
            const { data: user, error } = await this.supabase
                .from('user_profiles')
                .select('full_name, avatar_url')
                .eq('id', userId)
                .single();

            if (error) throw error;

            const chatHeader = document.querySelector('.chat-header');
            if (chatHeader) {
                chatHeader.innerHTML = `
                    <div class="chat-user">
                        <img src="${user.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXVzZXIiPjxwYXRoIGQ9Ik0xOSAyMXYtMmE0IDQgMCAwIDAtNC00SDlhNCA0IDAgMCAwLTQgNHYyIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+PC9zdmc+'}"
                             alt="${user.full_name}" class="chat-user-avatar">
                        <span class="chat-user-name">${user.full_name}</span>
                    </div>
                    <button id="chat-close" class="chat-close">&times;</button>
                `;

                // Re-attach close event listener
                document.getElementById('chat-close')?.addEventListener('click', () => {
                    document.getElementById('chat-container').classList.remove('active');
                });
            }
        } catch (error) {
            console.error('Error updating chat header:', error);
        }
    }

    // Load chat history with a user
    async loadChatHistory() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer || !this.currentChatId) return;

        // Show loading
        messagesContainer.innerHTML = '<div class="loading-messages">Carregando mensagens...</div>';

        try {
            const { data: messages, error } = await this.supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${this.currentUserId},receiver_id.eq.${this.currentChatId}),and(sender_id.eq.${this.currentChatId},receiver_id.eq.${this.currentUserId})`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Clear loading
            messagesContainer.innerHTML = '';

            // Add messages to UI
            if (messages.length === 0) {
                messagesContainer.innerHTML = '<div class="no-messages">Nenhuma mensagem ainda. Envie uma mensagem para começar a conversa!</div>';
                return;
            }

            messages.forEach(message => {
                this.addMessageToUI(message);
            });

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

        } catch (error) {
            console.error('Error loading chat history:', error);
            messagesContainer.innerHTML = '<div class="error-message">Erro ao carregar mensagens. Tente novamente.</div>';
        }
    }

    // Utility function to escape HTML
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase to be available
    const checkSupabase = setInterval(() => {
        if (window.supabase) {
            clearInterval(checkSupabase);
            window.chat = new Chat(window.supabase);
            window.chat.init();
        }
    }, 100);
});
