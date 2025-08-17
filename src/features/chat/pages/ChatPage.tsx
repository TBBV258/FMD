import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User, FileText, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseAPI } from '@/lib/api/database';
import type { Chat, ChatMessage, Document } from '@/lib/types';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  console.log('💬 ChatPage: Component rendered for user:', user?.email);

  // Fetch user's chats
  const { data: chats, isLoading: isLoadingChats } = useQuery({
    queryKey: ['user-chats', user?.id],
    queryFn: () => databaseAPI.getUserChats(user?.id || ''),
    enabled: !!user?.id,
  });

  // Fetch messages for selected chat
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat-messages', selectedChat?.id],
    queryFn: () => databaseAPI.getChatMessages(selectedChat?.id || ''),
    enabled: !!selectedChat?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedChat || !user) throw new Error('Chat or user not available');
      
      console.log('📤 ChatPage: Sending message:', message);
      
      const messageData = {
        chat_id: selectedChat.id,
        sender_id: user.id,
        content: message,
        created_at: new Date().toISOString(),
      };
      
      const sentMessage = await databaseAPI.sendChatMessage(messageData);
      console.log('✅ ChatPage: Message sent successfully:', sentMessage);
      
      return sentMessage;
    },
    onSuccess: () => {
      console.log('🎉 Message sent successfully!');
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChat?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-chats', user?.id] });
    },
    onError: (error) => {
      console.error('❌ ChatPage: Send message error:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
    },
  });

  // Filter chats based on search query
  const filteredChats = chats?.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      chat.document_name?.toLowerCase().includes(query) ||
      chat.other_user_name?.toLowerCase().includes(query) ||
      chat.last_message?.toLowerCase().includes(query)
    );
  }) || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    console.log('💬 ChatPage: Sending message');
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleChatSelect = (chat: Chat) => {
    console.log('💬 ChatPage: Selecting chat:', chat.id);
    setSelectedChat(chat);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    return status === 'lost' ? '🚨' : '💚';
  };

  const getDocumentStatusColor = (status: string) => {
    return status === 'lost' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  if (isLoadingChats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('chat.title') || 'Chat'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {chats?.length || 0} {t('chat.conversations') || 'conversas'}
          </p>
        </div>

        {/* Search */}
        <div className="p-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat.search_placeholder') || 'Pesquisar conversas...'}
            fullWidth
          />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchQuery 
                  ? t('chat.no_results') || 'Nenhuma conversa encontrada'
                  : t('chat.no_conversations') || 'Nenhuma conversa ainda'
                }
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {chat.other_user_name || t('chat.unknown_user') || 'Usuário Desconhecido'}
                      </p>
                      {chat.last_message_time && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(chat.last_message_time)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(chat.document_status)}`}>
                        {getDocumentStatusIcon(chat.document_status)} {t(`status.${chat.document_status}`)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {chat.document_name}
                      </span>
                    </div>
                    
                    {chat.last_message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        {chat.last_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {selectedChat.other_user_name || t('chat.unknown_user') || 'Usuário Desconhecido'}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(selectedChat.document_status)}`}>
                      {getDocumentStatusIcon(selectedChat.document_status)} {t(`status.${selectedChat.document_status}`)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedChat.document_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id
                          ? 'text-primary-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>{t('chat.no_messages') || 'Nenhuma mensagem ainda'}</p>
                  <p className="text-sm">{t('chat.start_conversation') || 'Inicie uma conversa!'}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t('chat.placeholder') || 'Digite sua mensagem...'}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                  fullWidth
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  isLoading={sendMessageMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('chat.select_conversation') || 'Selecione uma conversa'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('chat.select_conversation_desc') || 'Escolha uma conversa da lista para começar a mensagear'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
