import type { Chat, ChatMessage } from '@/lib/types';
import { authService } from './AuthService';

export class ChatService {
  async createChat(documentId: string, participantIds: string[]): Promise<Chat> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    console.log('💬 ChatService: Creating chat for document:', documentId);

    const { data: chat, error } = await client
      .from('chats')
      .insert({
        document_id: documentId,
        participant_ids: participantIds,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return chat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data: chats, error } = await client
      .from('chats')
      .select(`
        *,
        documents (name, status, type),
        chat_messages (content, created_at)
      `)
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return chats?.map(chat => ({
      id: chat.id,
      document_id: chat.document_id,
      document_name: chat.documents?.name || 'Documento Desconhecido',
      document_status: chat.documents?.status || 'unknown',
      participant_ids: chat.participant_ids,
      other_user_name: this.getOtherUserName(chat.participant_ids, userId),
      last_message: chat.chat_messages?.[0]?.content || null,
      last_message_time: chat.chat_messages?.[0]?.created_at || null,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
    })) || [];
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data: messages, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return messages || [];
  }

  async sendMessage(chatId: string, senderId: string, content: string): Promise<ChatMessage> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data: message, error } = await client
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update chat timestamp
    await client
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return message;
  }

  private getOtherUserName(participantIds: string[], currentUserId: string): string {
    const otherUserId = participantIds.find(id => id !== currentUserId);
    return otherUserId ? `Usuário ${otherUserId.slice(-4)}` : 'Usuário Desconhecido';
  }
}

export const chatService = new ChatService();
