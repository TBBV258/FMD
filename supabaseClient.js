// Fetch configuration from server
async function initializeSupabase() {
    try {
        // Try to fetch from server first
        const response = await fetch('/api/config');
        if (response.ok) {
            const config = await response.json();
            
            if (!config.supabaseUrl || !config.supabaseKey) {
                throw new Error('Missing Supabase configuration');
            }
            
            // Initialize Supabase client
            const supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
            window.supabaseClient = supabaseClient;
            
            return supabaseClient;
        } else {
            throw new Error('Failed to fetch config from server');
        }
    } catch (error) {
        console.error('Failed to initialize Supabase from server:', error);
        
        // Fallback: try to use environment variables or default config
        // This is useful for development when running the HTML file directly
        const fallbackUrl = 'https://your-project.supabase.co'; // Replace with your actual Supabase URL
        const fallbackKey = 'your-anon-key'; // Replace with your actual anon key
        
        if (fallbackUrl && fallbackKey && fallbackUrl !== 'https://your-project.supabase.co') {
            console.log('Using fallback Supabase configuration');
            const supabaseClient = window.supabase.createClient(fallbackUrl, fallbackKey);
            window.supabaseClient = supabaseClient;
            return supabaseClient;
        }
        
        throw new Error('No Supabase configuration available');
    }
}

// Initialize when DOM is loaded
let supabaseClient = null;
let isInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔧 Supabase: Starting initialization...');
        supabaseClient = await initializeSupabase();
        isInitialized = true;
        
        // Make sure the client is available globally
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase client initialized successfully');
        console.log('🌐 Supabase client available at window.supabaseClient:', !!window.supabaseClient);
        
        // Auth listeners are now handled in script.js to avoid conflicts
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        // Show user-friendly error message
        showError('Failed to connect to database. Please check your connection and refresh the page.');
    }
});

// Helper function to show errors
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

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
        try {
            console.log('🔐 Attempting sign up with email:', email, 'userData:', userData);
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });
            
            if (error) {
                console.error('❌ Sign up error:', error);
                throw error;
            }
            
            console.log('✅ Sign up successful:', data.user?.email);
            
            // Try to create user profile in our users table
            if (data.user) {
                try {
                    console.log('🔧 Creating user profile in database...');
                    const { error: profileError } = await supabaseClient
                        .from(TABLES.USERS)
                        .insert({
                            id: data.user.id,
                            email: data.user.email,
                            first_name: userData.first_name || '',
                            last_name: userData.last_name || '',
                            points: 0,
                            is_premium: false
                        });
                    
                    if (profileError) {
                        console.error('❌ Failed to create user profile:', profileError);
                        // Don't throw here - the user account was created, just the profile failed
                        // This might be due to missing database tables
                    } else {
                        console.log('✅ User profile created successfully');
                    }
                } catch (profileError) {
                    console.error('❌ Error creating user profile:', profileError);
                }
            }
            
            return data;
        } catch (error) {
            console.error('❌ Sign up failed:', error);
            throw error;
        }
    },

    async signIn(email, password) {
        try {
            console.log('🔐 Attempting sign in with email:', email);
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                console.error('❌ Sign in error:', error);
                throw error;
            }
            
            console.log('✅ Sign in successful:', data.user?.email);
            return data;
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            throw error;
        }
    },

    async signInWithGoogle() {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    },

    async updateProfile(updates) {
        const { data, error } = await supabaseClient.auth.updateUser({
            data: updates
        });
        
        if (error) throw error;
        return data;
    },

    onAuthStateChange(callback) {
        return supabaseClient.auth.onAuthStateChange(callback);
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
        console.log('🔍 Database: Getting document by ID:', documentId);
        
        const { data, error } = await supabaseClient
            .from(TABLES.DOCUMENTS)
            .select('*')
            .eq('id', documentId)
            .single();
            
        if (error) {
            console.error('❌ Database: Error getting document by ID:', error);
            throw error;
        }
        
        console.log('✅ Database: Document retrieved successfully:', data);
        return data;
    },

    async updateDocument(documentId, updates) {
        console.log('🔄 Database: Updating document', documentId, 'with:', updates);
        
        const { data, error } = await supabaseClient
            .from(TABLES.DOCUMENTS)
            .update(updates)
            .eq('id', documentId)
            .select()
            .single();
            
        if (error) {
            console.error('❌ Database: Error updating document:', error);
            throw error;
        }
        
        console.log('✅ Database: Document updated successfully:', data);
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
        const { data, error } = await supabaseClient.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (error) throw error;
        return data;
    },

    async downloadFile(bucket, path) {
        const { data, error } = await supabaseClient.storage
            .from(bucket)
            .download(path);
            
        if (error) throw error;
        return data;
    },

    async getPublicUrl(bucket, path) {
        const { data } = supabaseClient.storage
            .from(bucket)
            .getPublicUrl(path);
            
        return data.publicUrl;
    },

    async deleteFile(bucket, path) {
        const { error } = await supabaseClient.storage
            .from(bucket)
            .remove([path]);
            
        if (error) throw error;
    },

    async uploadDocumentFiles(files, documentId) {
        console.log('📤 Storage: Starting file upload for document:', documentId, 'Files count:', files.length);
        
        const uploadPromises = files.map(async (file, index) => {
            const fileName = `${documentId}/${Date.now()}_${index}.${file.name.split('.').pop()}`;
            console.log('📤 Storage: Uploading file:', file.name, 'as:', fileName);
            
            const uploadResult = await this.uploadFile(STORAGE_BUCKETS.DOCUMENTS, file, fileName);
            const publicUrl = this.getPublicUrl(STORAGE_BUCKETS.DOCUMENTS, fileName);
            
            const fileData = {
                id: `file_${Date.now()}_${index}`,
                filename: fileName,
                originalName: file.name,
                size: file.size,
                mimetype: file.type,
                url: publicUrl
            };
            
            console.log('📤 Storage: File uploaded successfully:', fileData);
            return fileData;
        });

        const results = await Promise.all(uploadPromises);
        console.log('📤 Storage: All files uploaded successfully:', results);
        return results;
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

    unsubscribe(subscription) {
        return supabaseClient.removeChannel(subscription);
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
