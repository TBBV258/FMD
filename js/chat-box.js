class ChatBoxController {
    constructor() {
        // Allow disabling the chat box UI by adding `hide-chat-box` to <body>
        if (typeof document !== 'undefined' && document.body && document.body.classList.contains('hide-chat-box')) {
            console.info('Chat box initialization skipped (hide-chat-box set on body)');
            return;
        }

        // Wait for Supabase to be initialized
        if (!window.supabase) {
            console.warn('Supabase not initialized, waiting...');
            setTimeout(() => this.constructor(), 500);
            return;
        }
        
        this.subscriptions = [];
        this.initializeElements();
        this.setupEventListeners();
        this.loadChats();
        this.setupRealtimeUpdates();
    }

    initializeElements() {
        // Create chat box container if it doesn't exist
        if (!document.getElementById('chat-box')) {
            const chatBox = document.createElement('div');
            chatBox.id = 'chat-box';
            // Use a bubble style on mobile: visible but minimized (small round
            // bubble). On larger screens keep minimized in bottom-right corner.
            if (window.innerWidth <= 768) {
                chatBox.className = 'chat-box-container chat-box-minimized bubble';
            } else {
                chatBox.className = 'chat-box-container chat-box-minimized';
            }
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

        // Handle mobile view: clicking outside should minimize the bubble/panel
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.chatBox.contains(e.target)) {
                    // minimize bubble
                    this.chatBox.classList.add('chat-box-minimized');
                }
            }
        });
    }

    toggleChatBox() {
        this.chatBox.classList.toggle('chat-box-minimized');
        const icon = this.toggleButton.querySelector('i');
        icon.className = this.chatBox.classList.contains('chat-box-minimized') 
            ? 'fas fa-chevron-up' 
            : 'fas fa-chevron-down';

        // When expanding on mobile, ensure it's not treated as a full-screen
        // overlay: we simply remove the minimized class which expands the
        // bubble into a small panel instead of occupying the whole page.
    }

    async loadChats() {
        try {
            // Get current user
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) return;

            // Try to use chat_rooms table with proper joins. Wrap in try/catch to handle schema differences.
            let chatRooms = null;
            try {
                const resp = await window.supabase
                    .from('chat_rooms')
                    .select(`
                        id,
                        document_id,
                        participant_1_id,
                        participant_2_id,
                        last_message_at,
                        last_message_id,
                        document:documents(title, type),
                        last_message:chats!chat_rooms_last_message_id_fkey(message, created_at)
                    `)
                    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
                    .order('last_message_at', { ascending: false });

                if (resp.error) {
                    console.warn('chat_rooms query returned error, falling back to messages:', resp.error);
                } else {
                    chatRooms = resp.data;
                }
            } catch (e) {
                console.warn('chat_rooms query threw, falling back to messages', e);
            }

            // If chatRooms not available, fallback to scanning messages/chats table
            if (!chatRooms || chatRooms.length === 0) {
                let messages = [];
                try {
                    const resp = await window.supabase
                        .from('chats')
                        .select(`
                            id,
                            document_id,
                            sender_id,
                            receiver_id,
                            message,
                            created_at,
                            document:documents(title, type)
                        `)
                        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                        .order('created_at', { ascending: false })
                        .limit(50);

                    if (!resp.error && Array.isArray(resp.data)) messages = resp.data;
                } catch (e) {
                    console.warn('Fallback messages query failed', e);
                }

                // Group messages by document_id (or by participant pair)
                const chatMap = new Map();
                messages.forEach(msg => {
                    const docId = msg.document_id || `doc_${msg.sender_id}_${msg.receiver_id}`;
                    if (!chatMap.has(docId)) {
                        chatMap.set(docId, {
                            id: docId,
                            document: msg.document,
                            last_message: msg.message,
                            last_message_time: msg.created_at,
                            other_user_id: msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
                        });
                    }
                });

                const chatsArray = Array.from(chatMap.values());
                const otherIds = [...new Set(chatsArray.map(c => c.other_user_id).filter(Boolean))];

                // Resolve participant profiles via profilesApi then Supabase, with fallbacks
                let profileMap = new Map();
                if (otherIds.length > 0) {
                    try {
                        if (window.profilesApi && typeof window.profilesApi.getProfilesByIds === 'function') {
                            const profiles = await window.profilesApi.getProfilesByIds(otherIds);
                            (profiles || []).forEach(p => profileMap.set(p.id, p));
                        }
                    } catch (e) {
                        console.warn('profilesApi.getProfilesByIds failed', e);
                    }

                    if (profileMap.size === 0 && window.supabase) {
                        try {
                            const resp = await window.supabase
                                .from('profiles')
                                .select('id, display_name, avatar_url')
                                .in('id', otherIds);
                            if (!resp.error && Array.isArray(resp.data)) {
                                resp.data.forEach(p => profileMap.set(p.id, p));
                            }
                        } catch (e) {
                            console.warn('Supabase profiles fetch failed', e);
                        }
                    }
                }

                // Attach participant info with fallbacks
                chatsArray.forEach(c => {
                    const profile = profileMap.get(c.other_user_id);
                    if (profile) {
                        c.participant = { display_name: profile.display_name || 'Usuário', avatar_url: profile.avatar_url || null, id: profile.id };
                    } else {
                        c.participant = { display_name: `User ${String(c.other_user_id).slice(-6)}`, id: c.other_user_id };
                    }
                });

                this.renderChats(chatsArray);
                return;
            }

            // Process chat rooms and get participant info
            const processedChats = await Promise.all(
                (chatRooms || []).map(async (room) => {
                    const otherUserId = room.participant_1_id === user.id 
                        ? room.participant_2_id 
                        : room.participant_1_id;

                    // Attempt to get other user's profile with fallbacks
                    let profile = null;
                    try {
                        if (window.profilesApi && typeof window.profilesApi.get === 'function') {
                            profile = await window.profilesApi.get(otherUserId);
                        }
                    } catch (e) {
                        console.warn('profilesApi.get failed', e);
                    }

                    if (!profile && window.supabase) {
                        try {
                            const resp = await window.supabase
                                .from('profiles')
                                .select('id, display_name, avatar_url')
                                .eq('id', otherUserId)
                                .single();
                            if (!resp.error) profile = resp.data;
                        } catch (e) {
                            console.warn('Supabase single profile fetch failed', e);
                        }
                    }

                    return {
                        id: room.id,
                        document: room.document,
                        last_message: room.last_message?.message || 'Nenhuma mensagem',
                        last_message_time: room.last_message_at || room.last_message?.created_at,
                        participant: profile || { id: otherUserId, display_name: `User ${String(otherUserId).slice(-6)}`, avatar_url: null }
                    };
                })
            );

            this.renderChats(processedChats);
            this.updateUnreadCount(processedChats);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }

    renderChats(chats) {
        if (!chats || chats.length === 0) {
            this.chatList.innerHTML = '<div class="empty-state">Nenhuma conversa encontrada</div>';
            return;
        }

        this.chatList.innerHTML = chats.map(chat => {
            const participant = chat.participant || { display_name: 'Usuário', avatar_url: null };
            const chatName = participant.display_name || 'Usuário';
            const documentTitle = chat.document?.title || 'Documento';
            const documentId = chat.document_id || chat.id;
            const receiverId = chat.other_user_id || participant.id;
            
            return `
                <div class="chat-item" data-chat-id="${chat.id}" data-document-id="${documentId}" data-receiver-id="${receiverId}">
                    <div class="chat-item-avatar">
                        ${this.getAvatarContent(participant)}
                    </div>
                    <div class="chat-item-content">
                        <div class="chat-item-name">${chatName}</div>
                        <div class="chat-item-preview">${documentTitle}</div>
                        <div class="chat-item-message">${chat.last_message || 'Iniciar conversa...'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getAvatarContent(participant) {
        if (participant?.avatar_url) {
            return `<img src="${participant.avatar_url}" alt="${participant.display_name || 'Usuário'}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'avatar-initial\\'>${(participant?.display_name || 'U').charAt(0).toUpperCase()}</div>';" />`;
        }
        const initial = (participant?.display_name || 'U').charAt(0).toUpperCase();
        return `<div class="avatar-initial">${initial}</div>`;
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
        if (window.chat && typeof window.chat.openChatModal === 'function') {
            // Try to get document info from the chat item
            const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
            if (chatItem) {
                const documentId = chatItem.dataset.documentId;
                const receiverId = chatItem.dataset.receiverId;
                const title = chatItem.querySelector('.chat-item-preview')?.textContent || 'Documento';
                window.chat.openChatModal(documentId || chatId, title, receiverId);
            } else {
                window.location.href = `/chat.html?id=${chatId}`;
            }
        } else {
            window.location.href = `/chat.html?id=${chatId}`;
        }
    }

    /**
     * Setup real-time updates for chat list
     */
    setupRealtimeUpdates() {
        if (!window.supabase) return;

        try {
            // Get current user
            window.supabase.auth.getUser().then(({ data: { user }, error }) => {
                if (error || !user) return;

                // Subscribe to new messages
                const channel = window.supabase
                    .channel('chat-box-updates')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'chats',
                            filter: `receiver_id=eq.${user.id}`
                        },
                        (payload) => {
                            // Reload chats when new message arrives
                            this.loadChats();
                        }
                    )
                    .subscribe();

                this.subscriptions.push(channel);
            });
        } catch (error) {
            console.error('Error setting up real-time updates:', error);
        }
    }

    /**
     * Cleanup subscriptions
     */
    cleanup() {
        this.subscriptions.forEach(channel => {
            try {
                if (window.supabase && channel) {
                    window.supabase.removeChannel(channel);
                }
            } catch (error) {
                console.warn('Error removing channel:', error);
            }
        });
        this.subscriptions = [];
    }
}

// Initialize chat box
document.addEventListener('DOMContentLoaded', () => {
    // Allow hiding chat box by adding `hide-chat-box` to <body>
    if (document.body && document.body.classList.contains('hide-chat-box')) {
        console.info('Chat box initialization skipped (hide-chat-box present on body).');
        return;
    }
    new ChatBoxController();
});