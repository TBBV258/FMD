// chat-controller.js
// Controlador completo de chat com real-time subscriptions

/**
 * ChatController - Gerencia chats em tempo real usando Supabase Realtime
 */
export class ChatController {
    constructor() {
        this.subscriptions = new Map();
        this.currentChats = new Map();
        this.messageListeners = new Set();
        this.unreadCounts = new Map();
        
        // Verificar se Supabase está disponível (sem erro se não estiver)
        try {
            if (typeof window === 'undefined' || !window.supabase) {
                console.warn('Supabase not available, ChatController will use fallback mode');
            }
        } catch (error) {
            console.warn('Error checking Supabase availability:', error);
        }
    }

    /**
     * Inicializa um chat para um documento específico
     * @param {string} documentId - ID do documento
     * @param {string} receiverId - ID do usuário receptor
     * @param {Function} onNewMessage - Callback para novas mensagens
     * @returns {Promise<void>}
     */
    async initChat(documentId, receiverId, onNewMessage) {
        if (!documentId || !receiverId) {
            throw new Error('documentId and receiverId are required');
        }

        // Verificar se Supabase está disponível
        if (!window.supabase) {
            console.warn('Supabase not available, cannot initialize chat');
            return;
        }

        const chatKey = `${documentId}_${receiverId}`;
        
        // Se já existe subscription para este chat, não criar outra
        if (this.subscriptions.has(chatKey)) {
            console.log('Chat already initialized for:', chatKey);
            return;
        }

        try {
            // Obter usuário atual
            const { data: { user }, error: userError } = await window.supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('User not authenticated');

            // Criar subscription para mensagens deste documento
            const channel = window.supabase
                .channel(`chat_${documentId}_${Date.now()}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'chats',
                        filter: `document_id=eq.${documentId}`
                    },
                    async (payload) => {
                        await this.handleRealtimeMessage(payload, user.id, onNewMessage);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('Subscribed to chat:', documentId);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('Error subscribing to chat:', documentId);
                    }
                });

            this.subscriptions.set(chatKey, channel);
            this.currentChats.set(chatKey, { documentId, receiverId, channel });

            // Adicionar listener para atualizar contadores de não lidas
            this.messageListeners.add(onNewMessage);

        } catch (error) {
            console.error('Error initializing chat:', error);
            throw error;
        }
    }

    /**
     * Processa mensagens recebidas em tempo real
     * @private
     * @param {Object} payload - Payload do Supabase Realtime
     * @param {string} currentUserId - ID do usuário atual
     * @param {Function} onNewMessage - Callback para novas mensagens
     */
    async handleRealtimeMessage(payload, currentUserId, onNewMessage) {
        try {
            if (!payload || !payload.new) return;
            if (!currentUserId) return;

            const message = payload.new;
            if (!message || !message.sender_id) return;

            const isOwnMessage = message.sender_id === currentUserId;

            // Só processar mensagens relevantes para o usuário atual
            if (message.sender_id !== currentUserId && message.receiver_id !== currentUserId) {
                return;
            }

            // Não duplicar mensagens próprias (já foram adicionadas ao enviar)
            if (isOwnMessage && payload.eventType === 'INSERT') {
                return;
            }

            // Buscar informações do remetente
            let senderInfo = null;
            if (!isOwnMessage) {
                try {
                    senderInfo = await this.getUserProfile(message.sender_id);
                } catch (error) {
                    console.warn('Could not fetch sender profile:', error);
                }
            }

            // Adicionar informações do remetente à mensagem
            const enrichedMessage = {
                ...message,
                sender_name: senderInfo?.full_name || senderInfo?.display_name || `User ${(message.sender_id || '').slice(-4)}`,
                sender_avatar: senderInfo?.avatar_url || null,
                isOwn: isOwnMessage
            };

            // Atualizar contador de não lidas se for mensagem recebida
            if (!isOwnMessage && message.document_id) {
                const chatKey = `${message.document_id}_${message.sender_id}`;
                const currentCount = this.unreadCounts.get(chatKey) || 0;
                this.unreadCounts.set(chatKey, currentCount + 1);
            }

            // Chamar callback
            if (onNewMessage && typeof onNewMessage === 'function') {
                try {
                    onNewMessage(enrichedMessage);
                } catch (error) {
                    console.error('Error in onNewMessage callback:', error);
                }
            }

            // Notificar todos os listeners
            this.messageListeners.forEach(listener => {
                try {
                    if (typeof listener === 'function') {
                        listener(enrichedMessage);
                    }
                } catch (error) {
                    console.error('Error in message listener:', error);
                }
            });

        } catch (error) {
            console.error('Error handling realtime message:', error);
        }
    }

    /**
     * Obtém perfil do usuário
     * @private
     * @param {string} userId - ID do usuário
     * @returns {Promise<Object|null>}
     */
    async getUserProfile(userId) {
        try {
            // Tentar usar profilesApi primeiro
            if (window.profilesApi && typeof window.profilesApi.get === 'function') {
                return await window.profilesApi.get(userId);
            }

            // Fallback para Supabase direto
            if (window.supabase) {
                const { data, error } = await window.supabase
                    .from('user_profiles')
                    .select('id, full_name, display_name, avatar_url, phone_number')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                return data;
            }

            return null;
        } catch (error) {
            console.warn('Error fetching user profile:', error);
            return null;
        }
    }

    /**
     * Envia uma mensagem
     * @param {string} documentId - ID do documento
     * @param {string} receiverId - ID do receptor
     * @param {string} messageText - Texto da mensagem
     * @param {Object} options - Opções adicionais (location, etc)
     * @returns {Promise<Object>}
     */
    async sendMessage(documentId, receiverId, messageText, options = {}) {
        if (!documentId || !receiverId || !messageText) {
            throw new Error('documentId, receiverId, and messageText are required');
        }

        try {
            // Obter usuário atual
            const { data: { user }, error: userError } = await window.supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('User not authenticated');

            // Preparar dados da mensagem
            const messageData = {
                document_id: documentId,
                sender_id: user.id,
                receiver_id: receiverId,
                message: messageText.trim(),
                status: 'sent',
                message_type: options.messageType || 'text',
                created_at: new Date().toISOString()
            };

            // Adicionar localização se fornecida
            if (options.location) {
                messageData.location = options.location;
            }

            // Enviar via API
            if (window.chatsApi && typeof window.chatsApi.send === 'function') {
                return await window.chatsApi.send({
                    documentId,
                    senderId: user.id,
                    receiverId,
                    message: messageText,
                    location: options.location,
                    messageType: options.messageType || 'text'
                });
            }

            // Fallback: inserir diretamente no Supabase
            if (window.supabase) {
                const { data, error } = await window.supabase
                    .from('chats')
                    .insert([messageData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }

            throw new Error('No chat API available');

        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Carrega histórico de mensagens
     * @param {string} documentId - ID do documento
     * @param {number} limit - Limite de mensagens
     * @returns {Promise<Array>}
     */
    async loadChatHistory(documentId, limit = 50) {
        if (!documentId) {
            throw new Error('documentId is required');
        }

        try {
            // Obter usuário atual
            const { data: { user }, error: userError } = await window.supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('User not authenticated');

            // Usar chatsApi se disponível
            if (window.chatsApi && typeof window.chatsApi.getConversation === 'function') {
                return await window.chatsApi.getConversation(documentId, user.id);
            }

            // Fallback: buscar diretamente do Supabase
            if (window.supabase) {
                const { data, error } = await window.supabase
                    .from('chats')
                    .select('*')
                    .eq('document_id', documentId)
                    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                    .order('created_at', { ascending: true })
                    .limit(limit);

                if (error) throw error;
                return data || [];
            }

            return [];

        } catch (error) {
            console.error('Error loading chat history:', error);
            throw error;
        }
    }

    /**
     * Marca mensagens como lidas
     * @param {string} documentId - ID do documento
     * @param {string} senderId - ID do remetente
     * @returns {Promise<void>}
     */
    async markAsRead(documentId, senderId) {
        try {
            // Obter usuário atual
            const { data: { user }, error: userError } = await window.supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('User not authenticated');

            // Atualizar mensagens não lidas
            if (window.supabase) {
                const { error } = await window.supabase
                    .from('chats')
                    .update({ 
                        status: 'read',
                        read_at: new Date().toISOString()
                    })
                    .eq('document_id', documentId)
                    .eq('sender_id', senderId)
                    .eq('receiver_id', user.id)
                    .eq('status', 'sent');

                if (error) throw error;

                // Resetar contador de não lidas
                const chatKey = `${documentId}_${senderId}`;
                this.unreadCounts.set(chatKey, 0);
            }

        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }

    /**
     * Obtém contagem de mensagens não lidas para um chat
     * @param {string} documentId - ID do documento
     * @param {string} senderId - ID do remetente
     * @returns {number}
     */
    getUnreadCount(documentId, senderId) {
        const chatKey = `${documentId}_${senderId}`;
        return this.unreadCounts.get(chatKey) || 0;
    }

    /**
     * Adiciona listener para novas mensagens
     * @param {Function} listener - Função callback
     */
    addMessageListener(listener) {
        if (typeof listener === 'function') {
            this.messageListeners.add(listener);
        }
    }

    /**
     * Remove listener de mensagens
     * @param {Function} listener - Função callback
     */
    removeMessageListener(listener) {
        this.messageListeners.delete(listener);
    }

    /**
     * Fecha um chat e remove subscription
     * @param {string} documentId - ID do documento
     * @param {string} receiverId - ID do receptor
     */
    closeChat(documentId, receiverId) {
        try {
            const chatKey = `${documentId}_${receiverId}`;
            const chat = this.currentChats.get(chatKey);

            if (chat && chat.channel && window.supabase) {
                try {
                    window.supabase.removeChannel(chat.channel);
                } catch (error) {
                    console.warn('Error removing channel:', error);
                }
                this.subscriptions.delete(chatKey);
                this.currentChats.delete(chatKey);
                console.log('Chat closed:', chatKey);
            }
        } catch (error) {
            console.error('Error closing chat:', error);
        }
    }

    /**
     * Fecha todos os chats e limpa recursos
     */
    cleanup() {
        try {
            // Remover todas as subscriptions
            if (window.supabase) {
                this.subscriptions.forEach((channel, key) => {
                    try {
                        window.supabase.removeChannel(channel);
                    } catch (error) {
                        console.warn('Error removing channel:', error);
                    }
                });
            }

            this.subscriptions.clear();
            this.currentChats.clear();
            this.messageListeners.clear();
            this.unreadCounts.clear();
        } catch (error) {
            console.error('Error in cleanup:', error);
        }
    }
}

// Criar instância global apenas quando necessário (lazy initialization)
// Não inicializar automaticamente para evitar quebrar a página se houver erros
if (typeof window !== 'undefined') {
    try {
        // Não criar imediatamente para evitar erros se Supabase não estiver pronto
        Object.defineProperty(window, 'chatController', {
            get: function() {
                if (!this._chatController) {
                    try {
                        this._chatController = new ChatController();
                    } catch (error) {
                        console.error('Error creating ChatController:', error);
                        // Retornar um objeto vazio para não quebrar código que depende dele
                        return {
                            initChat: () => Promise.resolve(),
                            sendMessage: () => Promise.reject(new Error('ChatController not available')),
                            loadChatHistory: () => Promise.resolve([]),
                            markAsRead: () => Promise.resolve(),
                            getUnreadCount: () => 0,
                            addMessageListener: () => {},
                            removeMessageListener: () => {},
                            closeChat: () => {},
                            cleanup: () => {}
                        };
                    }
                }
                return this._chatController;
            },
            configurable: true
        });
    } catch (error) {
        console.error('Error setting up chatController:', error);
        // Criar um fallback seguro
        window.chatController = {
            initChat: () => Promise.resolve(),
            sendMessage: () => Promise.reject(new Error('ChatController not available')),
            loadChatHistory: () => Promise.resolve([]),
            markAsRead: () => Promise.resolve(),
            getUnreadCount: () => 0,
            addMessageListener: () => {},
            removeMessageListener: () => {},
            closeChat: () => {},
            cleanup: () => {}
        };
    }
}

export default ChatController;
