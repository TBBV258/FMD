// Chat and Location System for FMD
(function () {
    const messagesEl = () => document.getElementById('chat-messages');
    const inputEl = () => document.getElementById('chat-input-field');
    const sendBtn = () => document.getElementById('send-message');

    let userLocation = null;
    let watchId = null;

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
            // Regular message styling
            div.className = `chat-message ${isOwn ? 'own' : 'other'}`;
            const time = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const location = msg.location ? ` • ${formatDistance(getDistanceFromUser(msg.location.lat, msg.location.lng))}` : '';
            
            // Get sender name
            const senderName = isOwn ? 'You' : (msg.sender_name || 'Unknown User');
            
            div.innerHTML = `
                <div class="message-header">
                    <span class="sender-name">${senderName}</span>
                    <span class="message-time">${time}</span>
                    <span class="message-location">${location}</span>
                </div>
                <div class="message-content">${msg.message}</div>
            `;
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
        async init(documentId, onNewMessage) {
            currentDocumentId = documentId;
            currentChatId = `chat_${documentId}`;
            
            // Initialize location tracking
            initializeLocation();
            
            try {
                // Get current user info
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;
                
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
                
                // Set up real-time subscription if available
                if (window.subscribeToChats && window.chatsApi) {
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
                                    
                                    // Mark message as delivered
                                    window.chatsApi.markAsDelivered(documentId, user.id);
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
                        const document = await window.documentsApi.getById(documentId);
                        if (!document) {
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
                        if (!receiverId && document.user_id !== user.id) {
                            receiverId = document.user_id;
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
                this.init(documentId);
                
                // Mark messages as read when opening chat
                if (window.chatsApi && user && receiverId) {
                    window.chatsApi.markAsRead(documentId, user.id, receiverId);
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

        closeChatModal() {
            const modal = document.getElementById('chat-modal');
            modal.style.display = 'none';
            this.unsubscribe();
        },

        appendMessage,
        
        unsubscribe() {
            if (subscription && subscription.unsubscribe) {
                subscription.unsubscribe();
            }
            subscription = null;
            
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        },

        // Location utilities
        getUserLocation() {
            return userLocation;
        },

        formatDistance,
        getDistanceFromUser
    };

    // Initialize chat modal controls
    document.addEventListener('DOMContentLoaded', () => {
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
                window.chat.closeChatModal();
            });
        } else {
            console.warn('Close button not found in chat modal');
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('Clicked outside modal, closing...');
                window.chat.closeChatModal();
            }
        });
        
        console.log('Chat module setup complete');
    });
})();