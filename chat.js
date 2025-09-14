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
    let currentChatId = null;

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

        loadChatHistory() {
            const container = messagesEl();
            if (!container) return;
            
            container.innerHTML = '';
            
            // Load mock chat data for demonstration
            const mockMessages = createMockChatData();
            mockMessages.forEach(msg => {
                appendMessage(msg, false);
            });
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
                    const senderId = window.currentUser?.id || null;
                    const receiverId = window.currentChatParticipant?.id || null;
                    await window.chatsApi.send({ 
                        documentId: currentDocumentId, 
                        senderId, 
                        receiverId, 
                        message: text,
                        location: userLocation
                    });
                } catch (err) {
                    console.error('Failed to send chat message:', err);
                    window.showToast?.('Erro ao enviar mensagem', 'error');
                }
            } else {
                // Mock successful send
                console.log('Mock message sent:', message);
                
                // Simulate reply after 2 seconds
                setTimeout(() => {
                    const reply = {
                        id: Date.now() + 1,
                        message: "Obrigado pela mensagem! Vou verificar se é o seu documento.",
                        created_at: new Date().toISOString(),
                        sender_id: 'other-user',
                        location: { lat: -25.9720, lng: 32.5750 }
                    };
                    appendMessage(reply, false);
                }, 2000);
            }
        },

        openChatModal(documentId, documentTitle) {
            const modal = document.getElementById('chat-modal');
            const modalTitle = modal.querySelector('.modal-header h3');
            
            if (modalTitle) {
                modalTitle.textContent = `Chat - ${documentTitle}`;
            }
            
            modal.style.display = 'block';
            this.init(documentId);
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
        const modal = document.getElementById('chat-modal');
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.chat.closeChatModal();
            });
        }
        
        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    window.chat.closeChatModal();
                }
            });
        }
    });
})();