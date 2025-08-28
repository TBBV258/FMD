// Initialize Supabase with environment variables or build-time configuration
async function initializeSupabase() {
    try {
        // In production, these should come from environment variables or build-time configuration
        // For development, you can set these directly or use a .env file
        const supabaseUrl = window.SUPABASE_URL || process.env.SUPABASE_URL || 'your-supabase-url-here';
        const supabaseKey = window.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key-here';
        
        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase') || supabaseKey.includes('your-supabase')) {
            throw new Error('Missing or invalid Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        }
        
        // Initialize Supabase client
        const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        window.supabaseClient = supabaseClient;
        
        return supabaseClient;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        throw error;
    }
}

// Initialize when DOM is loaded
let supabaseClient = null;
let initializationPromise = null;

// Create a promise that resolves when supabase is initialized
function ensureSupabaseInitialized() {
    if (supabaseClient) {
        return Promise.resolve(supabaseClient);
    }
    
    if (!initializationPromise) {
        initializationPromise = initializeSupabase().then(client => {
            supabaseClient = client;
            console.log('Supabase client initialized successfully');
            return client;
        }).catch(error => {
            console.error('Failed to initialize Supabase client:', error);
            throw error;
        });
    }
    
    return initializationPromise;
}

document.addEventListener('DOMContentLoaded', async () => {
    await ensureSupabaseInitialized();
});

// Storage bucket names
const STORAGE_BUCKETS = {
    DOCUMENTS: 'documents',
    AVATARS: 'avatars'
};

// Database table names
const TABLES = {
    USERS: 'users',
    DOCUMENTS: 'documents',
    CHATS: 'chats',
    NOTIFICATIONS: 'notifications'
};

// Auth functions
const auth = {
    async signUp(email, password, userData = {}) {
        const client = await ensureSupabaseInitialized();
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const client = await ensureSupabaseInitialized();
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    },

    async signInWithGoogle() {
        const client = await ensureSupabaseInitialized();
        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        return data;
    },

    async signOut() {
        const client = await ensureSupabaseInitialized();
        const { error } = await client.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const client = await ensureSupabaseInitialized();
        const { data: { user } } = await client.auth.getUser();
        return user;
    },

    async updateProfile(updates) {
        const client = await ensureSupabaseInitialized();
        const { data, error } = await client.auth.updateUser({
            data: updates
        });
        
        if (error) throw error;
        return data;
    },

    async onAuthStateChange(callback) {
        const client = await ensureSupabaseInitialized();
        return client.auth.onAuthStateChange(callback);
    }
};

// Database functions
const database = {
    // User functions
    async createUserProfile(user) {
        const { data, error } = await supabaseClient
            .from(TABLES.USERS)
            .insert([{
                id: user.id,
                email: user.email,
                first_name: user.user_metadata.first_name || '',
                last_name: user.user_metadata.last_name || '',
                points: 0,
                is_premium: false,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async getUserProfile(userId) {
        const { data, error } = await supabaseClient
            .from(TABLES.USERS)
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        return data;
    },

    async updateUserProfile(userId, updates) {
        const { data, error } = await supabaseClient
            .from(TABLES.USERS)
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    // Document functions
    async createDocument(documentData) {
        const { data, error } = await supabaseClient
            .from(TABLES.DOCUMENTS)
            .insert([documentData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async getUserDocuments(userId) {
        const { data, error } = await supabaseClient
            .from(TABLES.DOCUMENTS)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    },

    async getDocumentById(documentId) {
        const { data, error } = await supabaseClient
            .from(TABLES.DOCUMENTS)
            .select('*')
            .eq('id', documentId)
            .single();
            
        if (error) throw error;
        return data;
    },

    async updateDocument(documentId, updates) {
        const { data, error } = await supabaseClient
            .from(TABLES.DOCUMENTS)
            .update(updates)
            .eq('id', documentId)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async deleteDocument(documentId) {
        const { error } = await supabaseClient
            .from(TABLES.DOCUMENTS)
            .delete()
            .eq('id', documentId);
            
        if (error) throw error;
    },

    async getLostDocuments(filters = {}) {
        let query = supabaseClient
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

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getFoundDocuments(filters = {}) {
        let query = supabaseClient
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

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Chat functions
    async createChat(chatData) {
        const { data, error } = await supabaseClient
            .from(TABLES.CHATS)
            .insert([chatData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async getChatMessages(documentId) {
        const { data, error } = await supabaseClient
            .from(TABLES.CHATS)
            .select(`
                *,
                sender:users!chats_sender_id_fkey(id, first_name, last_name),
                receiver:users!chats_receiver_id_fkey(id, first_name, last_name)
            `)
            .eq('document_id', documentId)
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        return data;
    },

    async getUserChats(userId) {
        const { data, error } = await supabaseClient
            .from(TABLES.CHATS)
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
    },

    // Notification functions
    async createNotification(notificationData) {
        const { data, error } = await supabaseClient
            .from(TABLES.NOTIFICATIONS)
            .insert([notificationData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async getUserNotifications(userId) {
        const { data, error } = await supabaseClient
            .from(TABLES.NOTIFICATIONS)
            .select('*')
            .eq('user_id', userId)
            .eq('read', false)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    },

    async markNotificationAsRead(notificationId) {
        const { error } = await supabaseClient
            .from(TABLES.NOTIFICATIONS)
            .update({ read: true })
            .eq('id', notificationId);
            
        if (error) throw error;
    }
};

// Storage functions
const storage = {
    async uploadFile(bucket, file, path) {
        const client = await ensureSupabaseInitialized();
        const { data, error } = await client.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (error) throw error;
        return data;
    },

    async downloadFile(bucket, path) {
        const client = await ensureSupabaseInitialized();
        const { data, error } = await client.storage
            .from(bucket)
            .download(path);
            
        if (error) throw error;
        return data;
    },

    async getPublicUrl(bucket, path) {
        const client = await ensureSupabaseInitialized();
        const { data } = client.storage
            .from(bucket)
            .getPublicUrl(path);
            
        return data.publicUrl;
    },

    async deleteFile(bucket, path) {
        const client = await ensureSupabaseInitialized();
        const { error } = await client.storage
            .from(bucket)
            .remove([path]);
            
        if (error) throw error;
    },

    async uploadDocumentFiles(files, documentId) {
        const uploadPromises = files.map(async (file, index) => {
            const fileName = `${documentId}/${Date.now()}_${index}.${file.name.split('.').pop()}`;
            const uploadResult = await this.uploadFile(STORAGE_BUCKETS.DOCUMENTS, file, fileName);
            const publicUrl = this.getPublicUrl(STORAGE_BUCKETS.DOCUMENTS, fileName);
            
            return {
                id: `file_${Date.now()}_${index}`,
                filename: fileName,
                originalName: file.name,
                size: file.size,
                mimetype: file.type,
                url: publicUrl
            };
        });

        return Promise.all(uploadPromises);
    },

    async uploadAvatar(file, userId) {
        const fileName = `${userId}/avatar.${file.name.split('.').pop()}`;
        await this.uploadFile(STORAGE_BUCKETS.AVATARS, file, fileName);
        return this.getPublicUrl(STORAGE_BUCKETS.AVATARS, fileName);
    }
};

// Realtime functions
const realtime = {
    subscribeToChats(documentId, callback) {
        return supabaseClient
            .channel(`chats:${documentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLES.CHATS,
                filter: `document_id=eq.${documentId}`
            }, callback)
            .subscribe();
    },

    subscribeToNotifications(userId, callback) {
        return supabaseClient
            .channel(`notifications:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLES.NOTIFICATIONS,
                filter: `user_id=eq.${userId}`
            }, callback)
            .subscribe();
    },

    subscribeToDocumentUpdates(callback) {
        return supabaseClient
            .channel('document_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: TABLES.DOCUMENTS
            }, callback)
            .subscribe();
    },

    async unsubscribe(subscription) {
        const client = await ensureSupabaseInitialized();
        return client.removeChannel(subscription);
    }
};

// Export the client and functions
window.supabaseClient = supabaseClient;
window.auth = auth;
window.database = database;
window.storage = storage;
window.realtime = realtime;
window.STORAGE_BUCKETS = STORAGE_BUCKETS;
window.TABLES = TABLES;
