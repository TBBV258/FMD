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
        div.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        
        const time = new Date(msg.created_at || Date.now()).toLocaleTimeString();
        const location = msg.location ? ` • ${formatDistance(getDistanceFromUser(msg.location.lat, msg.location.lng))}` : '';
        
        div.innerHTML = `
            <div class="message-header">
                <span class="message-time">${time}</span>
                <span class="message-location">${location}</span>
            </div>
            <div class="message-content">${msg.message}</div>
        `;
        
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
        init(documentId, onNewMessage) {
            currentDocumentId = documentId;
            currentChatId = `chat_${documentId}`;
            
            // Initialize location tracking
            initializeLocation();
            
            // Load existing messages (mock for now)
            this.loadChatHistory();
            
            // Set up real-time subscription if available
            if (window.subscribeToChats && window.chatsApi) {
                if (subscription) subscription.unsubscribe?.();
                subscription = window.subscribeToChats(documentId, (payload) => {
                    if (payload && payload.new) {
                        appendMessage(payload.new, false);
                        onNewMessage?.(payload.new);
                    }
                });
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
                const messages = await window.chatsApi.getConversation(currentDocumentId, window.currentUser.id);
                
                messages.forEach(msg => {
                    const isOwn = msg.sender_id === window.currentUser.id;
                    appendMessage(msg, isOwn);
                });

            } catch (error) {
                console.error('Failed to load chat history:', error);
                container.innerHTML = '<p class="text-center error">Não foi possível carregar o histórico.</p>';
            }
        },

        async send(messageText) {
            const input = inputEl();
            const text = (messageText || (input && input.value))?.trim();
            if (!text) return;

            const message = {
                id: Date.now(),
                message: text,
                created_at: new Date().toISOString(),
                sender_id: window.currentUser?.id || 'current-user',
                location: userLocation
            };

            // Add message to UI immediately
            appendMessage(message, true);
            if (input) input.value = '';

            // Try to send through API if available
            if (window.chatsApi) {
                try {
                    const senderId = window.currentUser?.id;
                    if (!senderId || !currentReceiverId) {
                        throw new Error('Sender or receiver ID is missing.');
                    }

                    await window.chatsApi.send({
                        documentId: currentDocumentId,
                        senderId: senderId,
                        receiverId: currentReceiverId,
                        message: text,
                        location: userLocation
                    });
                } catch (err) {
                    console.error('Failed to send chat message:', err);
                    window.showToast?.('Erro ao enviar mensagem', 'error');
                    // Optional: remove the message from UI if it failed to send
                }
            }
        },

        openChatModal(documentId, documentTitle, receiverId) {
            console.log('openChatModal called with:', { documentId, documentTitle, receiverId });
            
            const modal = document.getElementById('chat-modal');
            if (!modal) {
                console.error('Chat modal element not found!');
                return;
            }
            
            console.log('Modal element found, updating title...');
            const modalTitle = modal.querySelector('.modal-header h3');
            
            if (modalTitle) {
                modalTitle.textContent = `Chat - ${documentTitle}`;
                console.log('Modal title updated');
            } else {
                console.warn('Modal title element not found');
            }
            
            console.log('Showing modal...');
            modal.style.display = 'block';
            currentReceiverId = receiverId; // Store the receiver's ID
            console.log('Initializing chat with document ID:', documentId);
            this.init(documentId);
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