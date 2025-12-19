// Chat and Location System for FMD
(function () {
    const messagesEl = () => document.getElementById('chat-messages');
    const inputEl = () => document.getElementById('chat-input-field');
    const sendBtn = () => document.getElementById('send-message');
    const chatsContainer = document.getElementById('chats-container');

    let userLocation = null;
    let watchId = null;
    
    // Initialize chat history tab
    function initChatHistoryTab() {
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active tab button
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show corresponding tab content
                const tabId = button.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(tabId).classList.add('active');
                
                // Load chat history if chats tab is active
                if (tabId === 'chats-tab') {
                    loadChatHistoryList();
                }
            });
        });
        
        // Initial load if chats tab is active
        if (document.querySelector('.tab-btn[data-tab="chats-tab"]')?.classList.contains('active')) {
            loadChatHistoryList();
        }
    }
    
    // Load chat history list for the notifications tab
    async function loadChatHistoryList() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Show loading state
            const container = document.getElementById('chats-container');
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Carregando conversas...</p>
                </div>`;
            
            // Get all unique chat threads where the current user is either sender or receiver
            const { data: chatThreads, error } = await supabase
                .from('chats')
                .select('document_id, document:documents(title, type), receiver_id, sender_id, message, created_at')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            // Group messages by document_id to create chat threads
            const threads = {};
            chatThreads.forEach(msg => {
                const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                const threadId = msg.document_id || `user_${otherUserId}`;

                if (!threads[threadId]) {
                    threads[threadId] = {
                        documentId: msg.document_id,
                        documentTitle: msg.document?.title || 'Chat Privado',
                        documentType: msg.document?.type || 'private',
                        otherUserId: otherUserId,
                        otherUserName: null, // Will be populated by profile fetch below
                        otherUserAvatar: null, // Will be populated by profile fetch below
                        lastMessage: msg.message,
                        lastMessageTime: msg.created_at,
                        unreadCount: 0 // You can implement unread count logic if needed
                    };
                }
            });

            // If some threads are missing profile info, try to batch fetch profiles with fallbacks
            const missingIds = Object.values(threads)
                .filter(t => !t.otherUserName && t.otherUserId)
                .map(t => t.otherUserId);
            if (missingIds.length > 0) {
                const uniqueIds = [...new Set(missingIds)];
                let profileMap = new Map();
                try {
                    if (window.profilesApi && typeof window.profilesApi.getProfilesByIds === 'function') {
                        const profiles = await window.profilesApi.getProfilesByIds(uniqueIds);
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
                            .in('id', uniqueIds);
                        if (!resp.error && Array.isArray(resp.data)) {
                            resp.data.forEach(p => profileMap.set(p.id, p));
                        }
                    } catch (e) {
                        console.warn('Supabase profiles batch fetch failed', e);
                    }
                }

                // Apply fetched profiles to threads
                Object.values(threads).forEach(t => {
                    if (!t.otherUserName && profileMap.has(t.otherUserId)) {
                        const p = profileMap.get(t.otherUserId);
                        t.otherUserName = p.display_name || `User ${String(p.id).slice(-6)}`;
                        t.otherUserAvatar = p.avatar_url || t.otherUserAvatar;
                    }
                });
            }
            
            // Display chat threads
            if (Object.keys(threads).length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <p data-i18n="notifications.no_chats">Nenhuma conversa recente</p>
                    </div>`;
                return;
            }
            
            const threadsHtml = Object.values(threads)
                .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
                .map(thread => {
                    const avatarUrl = thread.otherUserAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.otherUserName)}&background=random`;
                    const hasUnread = thread.unreadCount > 0;
                    
                    return `
                    <div class="chat-item ${hasUnread ? 'has-unread' : ''}" 
                         data-document-id="${thread.documentId || ''}" 
                         data-receiver-id="${thread.otherUserId}"
                         role="listitem">
                        <div class="chat-avatar-container">
                            <img src="${avatarUrl}" 
                                 alt="${thread.otherUserName}" 
                                 class="chat-avatar"
                                 onerror="this.src='https://ui-avatars.com/api/?name='+encodeURIComponent('${thread.otherUserName}')+'&background=random'">
                            ${hasUnread ? '<span class="chat-status-dot"></span>' : ''}
                        </div>
                        <div class="chat-info">
                            <div class="chat-header">
                                <h4 class="chat-name">${thread.otherUserName}</h4>
                                <span class="chat-time">${formatTimeAgo(thread.lastMessageTime)}</span>
                            </div>
                            <div class="chat-details">
                                <p class="chat-preview">
                                    <i class="fas fa-file-alt" style="margin-right: 4px; opacity: 0.6;"></i>
                                    ${thread.documentTitle}
                                </p>
                                ${thread.lastMessage ? `<p class="chat-last-message">${thread.lastMessage.substring(0, 60)}${thread.lastMessage.length > 60 ? '...' : ''}</p>` : ''}
                            </div>
                        </div>
                        <div class="chat-meta">
                            ${hasUnread ? `<span class="chat-unread-badge">${thread.unreadCount}</span>` : '<span class="chat-read-indicator"><i class="fas fa-check-double"></i></span>'}
                        </div>
                    </div>`;
                })
                .join('');
                
            container.innerHTML = threadsHtml;
            
            // Add click handlers to open chat
            container.querySelectorAll('.chat-item').forEach(item => {
                item.addEventListener('click', () => {
                    const documentId = item.getAttribute('data-document-id');
                    const receiverId = item.getAttribute('data-receiver-id');
                    const title = item.querySelector('.chat-name').textContent;
                    if (window.chat && typeof window.chat.openChatModal === 'function') {
                        window.chat.openChatModal(documentId, title, receiverId);
                    } else {
                        console.error('openChatModal is not available');
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading chat history:', error);
            const container = document.getElementById('chats-container');
            container.innerHTML = `
                <div class="empty-state error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erro ao carregar conversas. Tente novamente mais tarde.</p>
                </div>`;
        }
    }
    
    // Format time as "X minutes/hours/days ago"
    function formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} h`;
        if (diffInSeconds < 604800) return `Há ${Math.floor(diffInSeconds / 86400)} d`;
        return date.toLocaleDateString();
    }

    // Small helper to escape HTML when inserting user content into the DOM
    function escapeHtml(unsafe) {
        if (!unsafe && unsafe !== 0) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Location utilities
    function initializeLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    console.log('Location initialized:', userLocation);
                },
                (error) => {
                    console.warn('Location access denied or unavailable:', error);
                    // Use Maputo center as fallback
                    userLocation = {
                        lat: -25.9692,
                        lng: 32.5732,
                        accuracy: 10000
                    };
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        } else {
            // Fallback to Maputo center
            userLocation = {
                lat: -25.9692,
                lng: 32.5732,
                accuracy: 10000
            };
        }
    }

    function getDistanceFromUser(lat, lng) {
        if (!userLocation) return null;
        
        const R = 6371; // Earth's radius in km
        const dLat = (lat - userLocation.lat) * Math.PI / 180;
        const dLng = (lng - userLocation.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    function formatDistance(distance) {
        if (distance === null) return 'Localização indisponível';
        if (distance < 1) return `${Math.round(distance * 1000)}m`;
        if (distance < 10) return `${distance.toFixed(1)}km`;
        return `${Math.round(distance)}km`;
    }

    function appendMessage(msg, isOwn = false) {
        const container = messagesEl();
        if (!container) return;
        
        const div = document.createElement('div');
        
        if (msg.isSystem) {
            // Special styling for system messages (like welcome message)
            div.className = 'chat-message system';
            div.innerHTML = `
                <div class="message-content system-message">
                    <div class="welcome-icon">👋</div>
                    <div>${msg.message}</div>
                </div>
            `;
        } else {
            // Regular message with profile picture
            const time = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const location = msg.location ? ` • ${formatDistance(getDistanceFromUser(msg.location.lat, msg.location.lng))}` : '';
            const senderName = isOwn ? 'You' : (msg.sender_name || 'Unknown User');
            const avatarUrl = msg.sender_avatar || `data:image/svg+xml,%3csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='40' height='40' fill='%23ddd'/%3e%3ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' alignment-baseline='middle'%3e${senderName.charAt(0).toUpperCase()}%3c/text%3e%3c/svg%3e`;
            
            div.className = `chat-message ${isOwn ? 'self' : ''}`;
            div.innerHTML = `
                <div class="message-avatar">
                    <img src="${avatarUrl}" alt="${senderName}'s avatar">
                </div>
                <div class="message-content">
                    <!-- Show sender name for received messages so it's clear who spoke -->
                    ${!isOwn ? `<div class="message-sender">${escapeHtml(senderName)}</div>` : ''}
                    <div class="message-bubble">${escapeHtml(msg.message)}</div>
                    <div class="message-info">
                        <span class="message-time">${time}</span>
                        ${location ? `<span class="message-location">${location}</span>` : ''}
                    </div>
                </div>
            `;
            
            // Update chat header with user info when receiving first message
            if (!isOwn && document.querySelector('#chat-user-avatar img')) {
                document.querySelector('#chat-user-avatar img').src = avatarUrl;
                document.querySelector('#chat-user-avatar img').alt = `${senderName}'s avatar`;
                document.querySelector('#chat-modal-title').textContent = senderName;
            }
        }
        
        // Add data attributes for message tracking
        if (msg.id) {
            div.dataset.messageId = msg.id;
        }
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function createMockChatData() {
        return [
            {
                id: 1,
                message: "Olá! Vi que você perdeu um BI. Posso ter encontrado algo parecido.",
                created_at: new Date(Date.now() - 300000).toISOString(),
                sender_id: 'other-user',
                location: { lat: -25.9720, lng: 32.5750 }
            },
            {
                id: 2,
                message: "Onde exatamente você perdeu? Encontrei um na Av. Julius Nyerere.",
                created_at: new Date(Date.now() - 240000).toISOString(),
                sender_id: 'other-user',
                location: { lat: -25.9720, lng: 32.5750 }
            }
        ];
    }

    let subscription = null;
    let currentDocumentId = null;
    let currentReceiverId = null; // To know who we are talking to

    console.log('Initializing chat module...');
    window.chat = {
        async init(documentId, onNewMessage, receiverId) {
            currentDocumentId = documentId;
            currentChatId = `chat_${documentId}`;
            if (receiverId) {
                currentReceiverId = receiverId;
            }
            
            // Initialize location tracking
            initializeLocation();
            
            try {
                // Get current user info
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;
                
                // Try to use chat-controller if available
                if (window.chatController && receiverId) {
                    try {
                        await window.chatController.initChat(documentId, receiverId, (enrichedMessage) => {
                            appendMessage(enrichedMessage, enrichedMessage.isOwn);
                            onNewMessage?.(enrichedMessage);
                        });
                    } catch (controllerError) {
                        console.warn('Error using chat-controller, falling back to legacy:', controllerError);
                    }
                }
                
                // Show welcome message
                const welcomeMessage = {
                    id: 'welcome-msg',
                    message: `Olá ${user.user_metadata?.full_name || user.email || 'Usuário'}, como posso ajudar você hoje?`,
                    created_at: new Date().toISOString(),
                    sender_id: 'system',
                    isSystem: true
                };
                
                // Clear container and show welcome message
                const container = messagesEl();
                if (container) {
                    container.innerHTML = ''; // Clear existing messages
                    appendMessage(welcomeMessage, false);
                }
                
                // Load existing messages
                this.loadChatHistory();
                
                // Set up real-time subscription if available (fallback if chat-controller not used)
                if (window.subscribeToChats && window.chatsApi && (!window.chatController || !receiverId)) {
                    if (subscription) subscription.unsubscribe?.();
                    subscription = window.subscribeToChats(documentId, async (payload) => {
                        console.log('Real-time payload received:', payload);
                        if (payload && payload.new) {
                            const isOwnMessage = payload.new.sender_id === user.id;
                            
                            // Only show messages that are for this user (either sent by them or received by them)
                            if (payload.new.sender_id === user.id || payload.new.receiver_id === user.id) {
                                // Don't duplicate messages that are already shown (sent by current user)
                                if (!isOwnMessage) {
                                    // Get sender name for new messages
                                    try {
                                        console.log('Fetching profile for sender ID:', payload.new.sender_id);
                                        const userProfiles = await window.profilesApi.getProfilesByIds([payload.new.sender_id]);
                                        console.log('Retrieved profile for new message:', userProfiles);
                                        
                                        if (userProfiles && userProfiles.length > 0) {
                                            const profile = userProfiles[0];
                                            // Use full_name if available, otherwise use phone number, otherwise use partial ID
                                            let displayName = profile.full_name;
                                            if (!displayName && profile.phone_number) {
                                                displayName = `+${profile.phone_number}`;
                                            }
                                            if (!displayName) {
                                                // Use last 4 characters of ID for partial identification
                                                displayName = `User ${profile.id.slice(-4)}`;
                                            }
                                            payload.new.sender_name = displayName;
                                            console.log('Set sender name to:', payload.new.sender_name);
                                        } else {
                                            // Use partial ID as fallback instead of "Unknown User"
                                            payload.new.sender_name = `User ${payload.new.sender_id.slice(-4)}`;
                                            console.log('No profile found, using fallback:', payload.new.sender_name);
                                        }
                                    } catch (error) {
                                        console.error('Error fetching sender name:', error);
                                        payload.new.sender_name = 'Unknown User';
                                    }
                                    
                                    appendMessage(payload.new, false);
                                    onNewMessage?.(payload.new);
                                    
                                    // Mark message as delivered (if method exists)
                                    if (typeof window.chatsApi.markAsDelivered === 'function') {
                                        try {
                                            window.chatsApi.markAsDelivered(documentId, user.id);
                                        } catch (e) {
                                            console.warn('Could not mark message as delivered:', e);
                                        }
                                    }
                                }
                            }
                        } else if (payload && payload.eventType === 'UPDATE') {
                            // Handle message status updates (read, delivered, etc.)
                            const messageEl = document.querySelector(`[data-message-id="${payload.new.id}"]`);
                            if (messageEl) {
                                messageEl.dataset.status = payload.new.status;
                                if (payload.new.status === 'read') {
                                    messageEl.classList.add('read');
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error initializing chat:', error);
                // Fallback to default behavior if user info can't be loaded
                this.loadChatHistory();
            }

            // Wire send button
            const btn = sendBtn();
            const input = inputEl();
            
            if (btn) {
                btn.addEventListener('click', () => this.send());
            }
            
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.send();
                    }
                });
            }
        },

        async loadChatHistory() {
            const container = messagesEl();
            if (!container) return;
            
            container.innerHTML = '';
            
            try {
                if (!window.chatsApi) throw new Error('Chat API not available.');
                
                // Get current user from session or auth state
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || !user.id) {
                    throw new Error('User not authenticated');
                }
                
                const messages = await window.chatsApi.getConversation(currentDocumentId, user.id);
                
                // Get unique user IDs to fetch names (both senders and receivers)
                const senderIds = messages.map(msg => msg.sender_id);
                const receiverIds = messages.map(msg => msg.receiver_id);
                const userIds = [...new Set([...senderIds, ...receiverIds])];
                console.log('Fetching profiles for user IDs:', userIds);
                
                const userProfiles = await window.profilesApi.getProfilesByIds(userIds);
                console.log('Retrieved user profiles:', userProfiles);
                console.log('Number of profiles retrieved:', userProfiles.length);
                console.log('Expected number of profiles:', userIds.length);
                
                // Create a map of user ID to name with better fallbacks
                const userNames = {};
                userProfiles.forEach(profile => {
                    console.log('Processing profile:', profile);
                    // Use full_name if available, otherwise use phone number, otherwise use partial ID
                    let displayName = profile.full_name;
                    console.log('Profile full_name:', profile.full_name);
                    console.log('Profile phone_number:', profile.phone_number);
                    
                    if (!displayName && profile.phone_number) {
                        displayName = `+${profile.phone_number}`;
                        console.log('Using phone number as display name:', displayName);
                    }
                    if (!displayName) {
                        // Use last 4 characters of ID for partial identification
                        displayName = `User ${profile.id.slice(-4)}`;
                        console.log('Using partial ID as display name:', displayName);
                    }
                    userNames[profile.id] = displayName;
                    console.log('Final display name for', profile.id, ':', displayName);
                });
                
                // Add fallbacks for user IDs that don't have profiles
                userIds.forEach(userId => {
                    if (!userNames[userId]) {
                        userNames[userId] = `User ${userId.slice(-4)}`;
                        console.log(`No profile found for user ${userId}, using fallback: ${userNames[userId]}`);
                    }
                });
                
                console.log('User names map:', userNames);
                
                messages.forEach(msg => {
                    const isOwn = msg.sender_id === user.id;
                    msg.sender_name = userNames[msg.sender_id] || 'Unknown User';
                    appendMessage(msg, isOwn);
                });

            } catch (error) {
                console.error('Failed to load chat history:', error);
                container.innerHTML = '<p class="text-center error">Não foi possível carregar o histórico. ' + 
                    (error.message || '') + '</p>';
            }
        },

        async send(messageText) {
            const input = inputEl();
            const text = (messageText || (input && input.value))?.trim();
            if (!text) return;

            try {
                // Get current user from Supabase auth
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;
                if (!user || !user.id) throw new Error('User not authenticated');

                if (!currentDocumentId || !currentReceiverId) {
                    throw new Error('Missing required chat information');
                }

                // Try to use chat-controller if available
                if (window.chatController && typeof window.chatController.sendMessage === 'function') {
                    try {
                        const response = await window.chatController.sendMessage(
                            currentDocumentId,
                            currentReceiverId,
                            text,
                            { location: userLocation, messageType: 'text' }
                        );
                        
                        // Add message to UI
                        const message = {
                            ...response,
                            isOwn: true,
                            sender_name: user.user_metadata?.full_name || user.email || 'Você'
                        };
                        appendMessage(message, true);
                        if (input) input.value = '';
                        
                        return response;
                    } catch (controllerError) {
                        console.warn('Error using chat-controller, falling back to legacy:', controllerError);
                    }
                }

                // Create message object
                const message = {
                    id: `temp-${Date.now()}`,
                    message: text,
                    created_at: new Date().toISOString(),
                    sender_id: user.id,
                    receiver_id: currentReceiverId,
                    document_id: currentDocumentId,
                    status: 'sending',
                    location: userLocation
                };

                // Add message to UI immediately
                appendMessage(message, true);
                if (input) input.value = '';

                // Send through API
                if (window.chatsApi) {
                    try {
                        const response = await window.chatsApi.send({
                            documentId: currentDocumentId,
                            senderId: user.id,
                            receiverId: currentReceiverId,
                            message: text,
                            location: userLocation,
                            messageType: 'text'
                        });

                        // Update message status in UI
                        const messageEl = document.querySelector(`[data-message-id="${message.id}"]`);
                        if (messageEl) {
                            messageEl.dataset.status = 'sent';
                            messageEl.dataset.messageId = response.id || message.id;
                            
                            // Add visual feedback for sent status
                            const statusIcon = document.createElement('span');
                            statusIcon.className = 'message-status';
                            statusIcon.innerHTML = '<i class="fas fa-check"></i>';
                            messageEl.appendChild(statusIcon);
                        }
                        
                        console.log('Message sent successfully:', response);
                        return response;
                    } catch (apiError) {
                        console.error('Failed to send message:', apiError);
                        const messageEl = document.querySelector(`[data-message-id="${message.id}"]`);
                        if (messageEl) {
                            messageEl.dataset.status = 'error';
                            messageEl.title = 'Falha ao enviar: ' + (apiError.message || 'Erro desconhecido');
                            
                            // Add error visual feedback
                            const errorIcon = document.createElement('span');
                            errorIcon.className = 'message-status error';
                            errorIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                            messageEl.appendChild(errorIcon);
                        }
                        throw apiError;
                    }
                }
            } catch (err) {
                console.error('Error in send function:', err);
                window.showToast?.('Erro ao enviar mensagem: ' + (err.message || 'Erro desconhecido'), 'error');
                throw err;
            }
        },

        async openChatModal(documentId, documentTitle, receiverId) {
            console.log('openChatModal called with:', { documentId, documentTitle, receiverId });
            
            const modal = document.getElementById('chat-modal');
            if (!modal) {
                console.error('Chat modal element not found!');
                return;
            }
            
            try {
                // Clear any existing messages first
                const container = messagesEl();
                if (container) container.innerHTML = '';
                
                // Show loading state
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'chat-loading';
                loadingDiv.textContent = 'Carregando conversa...';
                if (container) container.appendChild(loadingDiv);
                
                // Get current user info for welcome message
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;
                
                // If receiverId is not provided, try to determine it from the document and chat history
                if (!receiverId) {
                    console.log('No receiverId provided, attempting to determine from document and chat history...');
                    try {
                        const docRecord = await window.documentsApi.getById(documentId);
                        if (!docRecord) {
                            throw new Error('Document not found');
                        }
                        
                        // Get existing chat messages to find who we've been chatting with
                        const existingMessages = await window.chatsApi.getConversation(documentId, user.id);
                        console.log('Found existing messages:', existingMessages.length);
                        
                        if (existingMessages.length > 0) {
                            // Find the other participant in the conversation
                            const otherParticipants = existingMessages
                                .map(msg => msg.sender_id === user.id ? msg.receiver_id : msg.sender_id)
                                .filter(id => id !== user.id);
                            
                            if (otherParticipants.length > 0) {
                                receiverId = otherParticipants[0]; // Use the first other participant
                                console.log('Determined receiverId from chat history:', receiverId);
                            }
                        }
                        
                        // If still no receiverId and this is not your document, chat with the document owner
                        if (!receiverId && docRecord.user_id !== user.id) {
                            receiverId = docRecord.user_id;
                            console.log('Determined receiverId from document owner:', receiverId);
                        }
                        
                        // If still no receiverId, this might be your own document with no chat history
                        if (!receiverId) {
                            console.log('This appears to be your own document with no existing chat history');
                            throw new Error('This is your own document. You can only chat with people who have found your document.');
                        }
                        
                    } catch (docError) {
                        console.error('Error determining receiverId:', docError);
                        throw new Error('Cannot determine who to chat with: ' + docError.message);
                    }
                }
                
                // Set modal title
                console.log('Modal element found, updating title...');
                const modalTitle = modal.querySelector('.modal-header h3');
                if (modalTitle) {
                    modalTitle.textContent = `Chat - ${documentTitle}`;
                    console.log('Modal title updated');
                } else {
                    console.warn('Modal title element not found');
                }
                
                // Show welcome message
                if (container) {
                    container.removeChild(loadingDiv); // Remove loading
                    
                    const welcomeMessage = {
                        id: 'welcome-msg',
                        message: `Olá ${user.user_metadata?.full_name || user.email || 'Usuário'}, como posso ajudar você hoje?`,
                        created_at: new Date().toISOString(),
                        sender_id: 'system',
                        isSystem: true
                    };
                    
                    appendMessage(welcomeMessage, false);
                }
                
                // Show modal and initialize chat
                console.log('Showing modal...');
                modal.style.display = 'block';
                currentReceiverId = receiverId; // Store the receiver's ID
                currentDocumentId = documentId; // Ensure document ID is set
                
                console.log('Initializing chat with document ID:', documentId, 'and receiver ID:', receiverId);
                this.init(documentId, null, receiverId);

                // Wire header quick actions after modal is open
                const openMapsBtn = document.getElementById('chat-open-maps');
                const shareLocationBtn = document.getElementById('chat-share-location');
                if (openMapsBtn) {
                    openMapsBtn.onclick = () => {
                        const loc = this.getUserLocation();
                        if (loc && window.mapHelper) {
                            window.mapHelper.open(loc.lat, loc.lng);
                        } else {
                            window.showToast?.('Localização indisponível', 'warning');
                        }
                    };
                }
                if (shareLocationBtn) {
                    shareLocationBtn.onclick = () => {
                        const loc = this.getUserLocation();
                        if (!loc) {
                            window.showToast?.('Localização indisponível', 'warning');
                            return;
                        }
                        const link = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
                        this.send(`Minha localização: ${link}`);
                    };
                }
                
                // Mark messages as read when opening chat (if method exists)
                if (window.chatsApi && user && receiverId && typeof window.chatsApi.markAsRead === 'function') {
                    try {
                        window.chatsApi.markAsRead(documentId, user.id, receiverId);
                    } catch (e) {
                        console.warn('Could not mark messages as read:', e);
                    }
                }
                
            } catch (error) {
                console.error('Error in openChatModal:', error);
                window.showToast?.('Erro ao carregar o chat: ' + error.message, 'error');
                
                // Show error message in chat
                const container = messagesEl();
                if (container) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'chat-error';
                    errorDiv.textContent = 'Não foi possível carregar a conversa: ' + error.message;
                    container.appendChild(errorDiv);
                }
            }
            console.log('Chat initialization complete');
        },
        appendMessage,
        loadChatHistoryList,
        
        unsubscribe: function() {
            if (subscription) {
                supabase.removeSubscription(subscription);
                subscription = null;
            }
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        },
        
        // Location utilities
        getUserLocation: function() {
            return userLocation;
        },
        
        formatDistance,
        getDistanceFromUser,
        
        // Initialize chat history tab
        initChatHistoryTab,
        loadChatHistoryList,
        
        // Close chat modal
        closeChatModal: function() {
            const modal = document.getElementById('chat-modal');
            if (modal) {
                modal.style.display = 'none';
                console.log('Chat modal closed');
            }
        }
    };
    
    // Initialize chat history tab when DOM is loaded (guarding addEventListener availability)
    (function onReadyInit() {
        const doWhenReady = () => {
            if (window.chat) {
                window.chat.initChatHistoryTab();
            }
        };

        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('DOMContentLoaded', doWhenReady);
        } else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('load', doWhenReady);
        } else {
            // Fallback
            try { window.onload = doWhenReady; } catch (e) { /* ignore */ }
        }
    })();
    
    // Make chat functions available globally
    window.chat = window.chat || {};
    window.chat.initChatHistoryTab = initChatHistoryTab;
    window.chat.loadChatHistoryList = loadChatHistoryList;
    window.chat.closeChatModal = function() {
        const modal = document.getElementById('chat-modal');
        if (modal) {
            modal.style.display = 'none';
            console.log('Chat modal closed');
        }
    };
    
    return window.chat;
})();

// Initialize chat modal controls (guard addEventListener again)
(function setupChatModal() {
    const init = () => {
        console.log('DOM fully loaded, setting up chat modal...');
        const modal = document.getElementById('chat-modal');
        if (!modal) {
            console.error('Chat modal element not found!');
            return;
        }

        const closeBtn = modal.querySelector('.close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                if (window.chat && window.chat.closeChatModal) {
                    window.chat.closeChatModal();
                }
            });
        }

        // Initialize chat history tab if on notifications page
        if (window.location.hash === '#notificacoes' && window.chat && window.chat.initChatHistoryTab) {
            window.chat.initChatHistoryTab();
        }

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal && window.chat && window.chat.closeChatModal) {
                console.log('Clicked outside modal, closing...');
                window.chat.closeChatModal();
            }
        });

        console.log('Chat module setup complete');
    };

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('DOMContentLoaded', init);
    } else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('load', init);
    } else {
        try { window.onload = init; } catch (e) { /* ignore */ }
    }
})();