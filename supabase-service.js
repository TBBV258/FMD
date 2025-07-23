// Supabase Service Layer for FindMyDocs
class SupabaseService {
    constructor() {
        this.supabaseUrl = 'https://vltgwacvosllvwsnenao.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdGd3YWN2b3NsbHZ3c25lbmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTk4MjQsImV4cCI6MjA2ODg3NTgyNH0.WSoQxPHT2LoY4Ob059i2omxs9xUFg9kGu3eotrvQ_b8';
        this.supabase = null;
        this.currentUser = null;
        this.subscriptions = [];
        
        this.init();
    }

    async init() {
        try {
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('Supabase initialized successfully');
            
            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                console.log('Existing session found:', this.currentUser);
            }
            
            // Listen for auth changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session);
                this.currentUser = session?.user || null;
                if (event === 'SIGNED_IN' && this.currentUser) {
                    this.onUserSignedIn();
                } else if (event === 'SIGNED_OUT') {
                    this.onUserSignedOut();
                }
            });
            
            return true;
        } catch (error) {
            console.error('Supabase initialization error:', error);
            return false;
        }
    }

    // Authentication Methods
    async signUp(email, password, metadata = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });
            
            if (error) throw error;
            
            // Create user profile
            if (data.user) {
                await this.createUserProfile(data.user, metadata);
            }
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.currentUser = data.user;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signInWithPhone(phone, password) {
        // For demo purposes, create an email from phone
        const email = `${phone.replace(/\D/g, '')}@findmydocs.demo`;
        return await this.signIn(email, password);
    }

    async signUpWithPhone(phone, password, metadata = {}) {
        // For demo purposes, create an email from phone
        const email = `${phone.replace(/\D/g, '')}@findmydocs.demo`;
        return await this.signUp(email, password, { ...metadata, phone });
    }

    async signUpWithEmail(email, password, metadata = {}) {
        return await this.signUp(email, password, metadata);
    }

    async signInWithEmail(email, password) {
        return await this.signIn(email, password);
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.cleanup();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async signInAsDemo() {
        try {
            // Create a demo user
            const demoEmail = `demo_${Date.now()}@findmydocs.demo`;
            const demoPassword = 'demo123456';
            
            const signUpResult = await this.signUp(demoEmail, demoPassword, {
                name: 'Demo User',
                phone: '+244 000 000 000',
                country: 'AO',
                is_demo: true
            });
            
            if (signUpResult.success) {
                return await this.signIn(demoEmail, demoPassword);
            }
            
            return signUpResult;
        } catch (error) {
            console.error('Demo sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // User Profile Methods
    async createUserProfile(user, metadata = {}) {
        try {
            const profile = {
                id: user.id,
                email: user.email,
                name: metadata.name || 'Usuario',
                phone: metadata.phone || '',
                country: metadata.country || 'AO',
                avatar_url: null,
                points: 0,
                documents_count: 0,
                helped_count: 0,
                is_demo: metadata.is_demo || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('user_profiles')
                .insert(profile)
                .select()
                .single();

            if (error) throw error;
            return { success: true, profile: data };
        } catch (error) {
            console.error('Create profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(userId = null) {
        try {
            const id = userId || this.currentUser?.id;
            if (!id) throw new Error('No user ID provided');

            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, profile: data };
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserProfile(updates) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const { data, error } = await this.supabase
                .from('user_profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, profile: data };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    // Document Methods
    async createDocument(documentData) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const document = {
                ...documentData,
                user_id: this.currentUser.id,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('documents')
                .insert(document)
                .select()
                .single();

            if (error) throw error;

            // Update user document count
            await this.incrementUserDocumentCount();

            return { success: true, document: data };
        } catch (error) {
            console.error('Create document error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserDocuments() {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const { data, error } = await this.supabase
                .from('documents')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, documents: data || [] };
        } catch (error) {
            console.error('Get documents error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateDocument(documentId, updates) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const { data, error } = await this.supabase
                .from('documents')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', documentId)
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, document: data };
        } catch (error) {
            console.error('Update document error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteDocument(documentId) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const { error } = await this.supabase
                .from('documents')
                .delete()
                .eq('id', documentId)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            // Update user document count
            await this.decrementUserDocumentCount();

            return { success: true };
        } catch (error) {
            console.error('Delete document error:', error);
            return { success: false, error: error.message };
        }
    }

    // Lost Documents Methods
    async createLostReport(reportData) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const report = {
                ...reportData,
                reporter_id: this.currentUser.id,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('lost_documents')
                .insert(report)
                .select()
                .single();

            if (error) throw error;
            return { success: true, report: data };
        } catch (error) {
            console.error('Create lost report error:', error);
            return { success: false, error: error.message };
        }
    }

    async getLostDocuments(filters = {}) {
        try {
            let query = this.supabase
                .from('lost_documents')
                .select(`
                    *,
                    reporter:user_profiles(name, phone)
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.country) {
                query = query.eq('country', filters.country);
            }
            if (filters.province) {
                query = query.eq('province', filters.province);
            }
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, documents: data || [] };
        } catch (error) {
            console.error('Get lost documents error:', error);
            return { success: false, error: error.message };
        }
    }

    // Found Documents Methods
    async createFoundReport(reportData) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const report = {
                ...reportData,
                finder_id: this.currentUser.id,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('found_documents')
                .insert(report)
                .select()
                .single();

            if (error) throw error;

            // Award points for helping
            await this.addUserPoints(10);

            return { success: true, report: data };
        } catch (error) {
            console.error('Create found report error:', error);
            return { success: false, error: error.message };
        }
    }

    async getFoundDocuments(filters = {}) {
        try {
            let query = this.supabase
                .from('found_documents')
                .select(`
                    *,
                    finder:user_profiles(name, phone)
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.country) {
                query = query.eq('country', filters.country);
            }
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, documents: data || [] };
        } catch (error) {
            console.error('Get found documents error:', error);
            return { success: false, error: error.message };
        }
    }

    // Chat Methods
    async createChatRoom(documentId, documentType) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const room = {
                document_id: documentId,
                document_type: documentType,
                created_by: this.currentUser.id,
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('chat_rooms')
                .insert(room)
                .select()
                .single();

            if (error) throw error;
            return { success: true, room: data };
        } catch (error) {
            console.error('Create chat room error:', error);
            return { success: false, error: error.message };
        }
    }

    async sendMessage(roomId, message) {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const messageData = {
                room_id: roomId,
                sender_id: this.currentUser.id,
                message: message,
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('chat_messages')
                .insert(messageData)
                .select()
                .single();

            if (error) throw error;
            return { success: true, message: data };
        } catch (error) {
            console.error('Send message error:', error);
            return { success: false, error: error.message };
        }
    }

    async getChatMessages(roomId) {
        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:user_profiles(name, avatar_url)
                `)
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { success: true, messages: data || [] };
        } catch (error) {
            console.error('Get chat messages error:', error);
            return { success: false, error: error.message };
        }
    }

    // File Upload Methods
    async uploadFile(file, bucket = 'documents') {
        try {
            if (!this.currentUser) throw new Error('No authenticated user');

            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}/${Date.now()}.${fileExt}`;

            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return { success: true, url: publicUrl, path: fileName };
        } catch (error) {
            console.error('Upload file error:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time Subscriptions
    subscribeToLostDocuments(callback) {
        const subscription = this.supabase
            .channel('lost_documents')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'lost_documents' },
                callback
            )
            .subscribe();

        this.subscriptions.push(subscription);
        return subscription;
    }

    subscribeToFoundDocuments(callback) {
        const subscription = this.supabase
            .channel('found_documents')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'found_documents' },
                callback
            )
            .subscribe();

        this.subscriptions.push(subscription);
        return subscription;
    }

    subscribeToChatMessages(roomId, callback) {
        const subscription = this.supabase
            .channel(`chat_${roomId}`)
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'chat_messages',
                    filter: `room_id=eq.${roomId}`
                },
                callback
            )
            .subscribe();

        this.subscriptions.push(subscription);
        return subscription;
    }

    // Utility Methods
    async incrementUserDocumentCount() {
        try {
            if (!this.currentUser) return;

            await this.supabase.rpc('increment_user_documents', {
                user_id: this.currentUser.id
            });
        } catch (error) {
            console.error('Increment document count error:', error);
        }
    }

    async decrementUserDocumentCount() {
        try {
            if (!this.currentUser) return;

            await this.supabase.rpc('decrement_user_documents', {
                user_id: this.currentUser.id
            });
        } catch (error) {
            console.error('Decrement document count error:', error);
        }
    }

    async addUserPoints(points) {
        try {
            if (!this.currentUser) return;

            await this.supabase.rpc('add_user_points', {
                user_id: this.currentUser.id,
                points_to_add: points
            });
        } catch (error) {
            console.error('Add user points error:', error);
        }
    }

    // Event Handlers
    onUserSignedIn() {
        console.log('User signed in:', this.currentUser);
        // Setup real-time subscriptions
        this.setupRealtimeSubscriptions();
    }

    onUserSignedOut() {
        console.log('User signed out');
        this.cleanup();
    }

    setupRealtimeSubscriptions() {
        // Subscribe to lost documents updates
        this.subscribeToLostDocuments((payload) => {
            window.dispatchEvent(new CustomEvent('lostDocumentUpdate', { detail: payload }));
        });

        // Subscribe to found documents updates
        this.subscribeToFoundDocuments((payload) => {
            window.dispatchEvent(new CustomEvent('foundDocumentUpdate', { detail: payload }));
        });
    }

    cleanup() {
        // Unsubscribe from all channels
        this.subscriptions.forEach(subscription => {
            this.supabase.removeChannel(subscription);
        });
        this.subscriptions = [];
    }

    // Helper Methods
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    async waitForAuth() {
        return new Promise((resolve) => {
            if (this.currentUser) {
                resolve(this.currentUser);
            } else {
                const unsubscribe = this.supabase.auth.onAuthStateChange((event, session) => {
                    if (session?.user) {
                        unsubscribe.data.subscription.unsubscribe();
                        resolve(session.user);
                    }
                });
            }
        });
    }
}

// Create global instance
window.supabaseService = new SupabaseService();
