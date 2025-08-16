const { createClient } = require('@supabase/supabase-js');

class SupabaseStorage {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!this.supabaseUrl || !this.supabaseKey) {
            throw new Error('Missing Supabase configuration');
        }
        
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    // Document operations
    async createDocument(documentData) {
        const { data, error } = await this.supabase
            .from('documents')
            .insert([documentData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async getUserDocuments(userId) {
        const { data, error } = await this.supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    }

    async getDocumentById(documentId) {
        const { data, error } = await this.supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();
            
        if (error) throw error;
        return data;
    }

    async updateDocument(documentId, updates) {
        const { data, error } = await this.supabase
            .from('documents')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', documentId)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async deleteDocument(documentId) {
        const { error } = await this.supabase
            .from('documents')
            .delete()
            .eq('id', documentId);
            
        if (error) throw error;
    }

    async getLostDocuments(filters = {}) {
        let query = this.supabase
            .from('documents')
            .select(`
                *,
                users (
                    first_name,
                    last_name
                )
            `)
            .eq('status', 'lost')
            .order('created_at', { ascending: false });

        if (filters.type) {
            query = query.eq('type', filters.type);
        }

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async getFoundDocuments(filters = {}) {
        let query = this.supabase
            .from('documents')
            .select(`
                *,
                users (
                    first_name,
                    last_name
                )
            `)
            .eq('status', 'found')
            .order('created_at', { ascending: false });

        if (filters.type) {
            query = query.eq('type', filters.type);
        }

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // User operations
    async createUserProfile(userData) {
        const { data, error } = await this.supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async getUserProfile(userId) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        return data;
    }

    async updateUserProfile(userId, updates) {
        const { data, error } = await this.supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    // Chat operations
    async createChat(chatData) {
        const { data, error } = await this.supabase
            .from('chats')
            .insert([chatData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async getChatMessages(documentId, userId) {
        const { data, error } = await this.supabase
            .from('chats')
            .select(`
                *,
                sender:users!chats_sender_id_fkey(id, first_name, last_name),
                receiver:users!chats_receiver_id_fkey(id, first_name, last_name)
            `)
            .eq('document_id', documentId)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        return data;
    }

    async getUserChats(userId) {
        const { data, error } = await this.supabase
            .from('chats')
            .select(`
                *,
                document:documents(id, name, type),
                sender:users!chats_sender_id_fkey(id, first_name, last_name),
                receiver:users!chats_receiver_id_fkey(id, first_name, last_name)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    }

    // Notification operations
    async createNotification(notificationData) {
        const { data, error } = await this.supabase
            .from('notifications')
            .insert([notificationData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async getUserNotifications(userId) {
        const { data, error } = await this.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    }

    async markNotificationAsRead(notificationId) {
        const { error } = await this.supabase
            .from('notifications')
            .update({ read: true, updated_at: new Date().toISOString() })
            .eq('id', notificationId);
            
        if (error) throw error;
    }

    // File operations
    async uploadFile(bucket, file, path) {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (error) throw error;
        return data;
    }

    async downloadFile(bucket, path) {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .download(path);
            
        if (error) throw error;
        return data;
    }

    async getPublicUrl(bucket, path) {
        const { data } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(path);
            
        return data.publicUrl;
    }

    async deleteFile(bucket, path) {
        const { error } = await this.supabase.storage
            .from(bucket)
            .remove([path]);
            
        if (error) throw error;
    }

    // Realtime subscriptions
    subscribeToChats(documentId, callback) {
        return this.supabase
            .channel(`chats:${documentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chats',
                filter: `document_id=eq.${documentId}`
            }, callback)
            .subscribe();
    }

    subscribeToNotifications(userId, callback) {
        return this.supabase
            .channel(`notifications:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, callback)
            .subscribe();
    }

    subscribeToDocumentUpdates(callback) {
        return this.supabase
            .channel('document_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'documents'
            }, callback)
            .subscribe();
    }

    unsubscribe(subscription) {
        return this.supabase.removeChannel(subscription);
    }

    // Points and gamification
    async awardPoints(userId, points, reason) {
        // Get current points
        const { data: user, error: fetchError } = await this.supabase
            .from('users')
            .select('points')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        const newPoints = (user.points || 0) + points;

        // Update points
        const { error: updateError } = await this.supabase
            .from('users')
            .update({ points: newPoints, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Create notification
        await this.createNotification({
            user_id: userId,
            type: 'points_awarded',
            title: 'Pontos Ganhos!',
            message: `Você ganhou ${points} pontos: ${reason}`,
            data: { points },
            read: false,
            created_at: new Date().toISOString()
        });

        return newPoints;
    }

    // Search and matching
    async findPotentialMatches(document) {
        const oppositeStatus = document.status === 'lost' ? 'found' : 'lost';
        
        const { data, error } = await this.supabase
            .from('documents')
            .select('*')
            .eq('status', oppositeStatus)
            .eq('type', document.type)
            .neq('user_id', document.user_id);

        if (error) throw error;
        return data || [];
    }
}

module.exports = { SupabaseStorage };
