import { authService } from '@/lib/services/AuthService';
import type { User, UserProfile, Document, Chat, ChatMessage, Notification } from '@/lib/types';
import { TABLES } from '@/lib/services/AuthService';

class DatabaseAPI {
  // User functions - preserving existing logic
  async createUserProfile(user: any): Promise<User> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.USERS)
      .insert([{
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        points: 0,
        is_premium: false,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.USERS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Document functions - preserving existing business logic
  async createDocument(documentData: Partial<Document>): Promise<Document> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.DOCUMENTS)
      .insert([{
        ...documentData,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.DOCUMENTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getDocumentById(documentId: string): Promise<Document> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.DOCUMENTS)
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.DOCUMENTS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDocument(documentId: string): Promise<void> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { error } = await client
      .from(TABLES.DOCUMENTS)
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  }

  // Feed functions - preserving existing filters
  async getLostDocuments(filters: { type?: string; search?: string; limit?: number } = {}): Promise<Document[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    let query = client
      .from(TABLES.DOCUMENTS)
      .select('*')
      .eq('status', 'lost')
      .order('created_at', { ascending: false });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getFoundDocuments(filters: { type?: string; search?: string; limit?: number } = {}): Promise<Document[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    let query = client
      .from(TABLES.DOCUMENTS)
      .select('*')
      .eq('status', 'found')
      .order('created_at', { ascending: false });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Chat functions - preserving existing structure
  async createChat(chatData: Partial<Chat>): Promise<Chat> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.CHATS)
      .insert([{
        ...chatData,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('chats')
      .select(`
        *,
        documents (name, status, type),
        chat_messages (content, created_at)
      `)
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data?.map(chat => ({
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

  async sendChatMessage(messageData: {
    chat_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  }): Promise<ChatMessage> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private getOtherUserName(participantIds: string[], currentUserId: string): string {
    const otherUserId = participantIds.find(id => id !== currentUserId);
    return otherUserId ? `Usuário ${otherUserId.slice(-4)}` : 'Usuário Desconhecido';
  }

  // Notification functions - preserving existing structure
  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.NOTIFICATIONS)
      .insert([{
        ...notificationData,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { error } = await client
      .from(TABLES.NOTIFICATIONS)
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Premium gating check - preserving business logic
  async checkDocumentLimits(userId: string): Promise<{ canAdd: boolean; current: number; limit: number }> {
    const [userProfile, userDocs] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserDocuments(userId),
    ]);

    const normalDocs = userDocs.filter(doc => doc.status === 'normal');
    const limit = userProfile.is_premium ? Infinity : 1;
    
    return {
      canAdd: normalDocs.length < limit,
      current: normalDocs.length,
      limit: userProfile.is_premium ? -1 : limit, // -1 for unlimited
    };
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const client = authService.getClient();
      if (!client) return false;

      const { error } = await client
        .from(TABLES.USERS)
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}

export const databaseAPI = new DatabaseAPI();
