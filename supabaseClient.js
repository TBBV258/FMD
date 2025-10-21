// Initialize the Supabase client
(function() {
    'use strict';
    
    // Check if already initialized to prevent duplicate declarations
    if (window.supabaseClientInitialized) {
        console.log('Supabase client already initialized');
        return;
    }
    
    const supabaseUrl = 'https://amwkpnruxlxvgelgucit.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtd2twbnJ1eGx4dmdlbGd1Y2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjQyNzksImV4cCI6MjA3MTEwMDI3OX0.Aig88y-2xy4isACVB6zQ4n3zUrTAG_ZuwRFisqplG4U';
    
    // Check if Supabase library is loaded
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        console.error('Supabase library not loaded. Make sure to include the Supabase JavaScript library before this file.');
        return;
    }
    
    try {
        // Initialize the client
        window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('Supabase client initialized successfully');
        
        // Mark as initialized
        window.supabaseClientInitialized = true;
        
        // Initialize APIs
        initializeAPIs();
        
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        // Continue with fallback mode
        window.supabaseClientInitialized = false;
        initializeFallbackAPIs();
    }
    
    function initializeAPIs() {
        // Documents API
        window.documentsApi = {
            async getById(id) {
                try {
                    const { data: document, error } = await window.supabase
                        .from('documents')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (error) throw error;
                    return document;
                } catch (error) {
                    console.error('Get document by ID error:', error);
                    return null;
                }
            },

            async create(data) {
                try {
                    const { data: document, error } = await window.supabase
                        .from('documents')
                        .insert([{
                            user_id: data.userId,
                            title: data.title,
                            type: data.type,
                            status: data.status || 'normal',
                            location: data.location,
                            file_url: data.fileUrl || '',
                            file_name: data.fileName || '',
                            file_path: data.filePath || '',
                            file_size: data.fileSize || null,
                            file_type: data.fileType || '',
                            hash_local: data.hashLocal || '',
                            document_number: data.documentNumber || '',
                            issue_date: data.issueDate || null,
                            expiry_date: data.expiryDate || null,
                            issue_place: data.issuePlace || '',
                            issuing_authority: data.issuingAuthority || '',
                            country_of_issue: data.countryOfIssue || '',
                            thumbnail_url: data.thumbnailUrl || '',
                            location_lost_found: data.locationLostFound || null,
                            last_known_location: data.lastKnownLocation || null,
                            location_metadata: data.locationMetadata || null,
                            is_verified: data.isVerified || false,
                            verification_status: data.verificationStatus || 'pending',
                            verification_notes: data.verificationNotes || '',
                            description: data.description || '',
                            tags: data.tags || [],
                            is_public: data.isPublic || false,
                            is_archived: data.isArchived || false
                        }])
                        .select()
                        .single();
                    if (error) throw error;
                    return document;
                } catch (error) {
                    console.error('Create document error:', error);
                    return createFallbackDocument(data);
                }
            },
            
            async getByUser(userId) {
                try {
                    const { data: documents, error } = await window.supabase
                        .from('documents')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });
                    if (error) throw error;
                    return documents;
                } catch (error) {
                    console.error('Get documents error:', error);
                    return getFallbackDocuments();
                }
            },
            
            async update(id, data) {
                try {
                    const updateData = {};
                    
                    // Only update fields that are provided
                    if (data.title !== undefined) updateData.title = data.title;
                    if (data.type !== undefined) updateData.type = data.type;
                    if (data.status !== undefined) updateData.status = data.status;
                    if (data.location !== undefined) updateData.location = data.location;
                    if (data.fileUrl !== undefined) updateData.file_url = data.fileUrl;
                    if (data.fileName !== undefined) updateData.file_name = data.fileName;
                    if (data.filePath !== undefined) updateData.file_path = data.filePath;
                    if (data.fileSize !== undefined) updateData.file_size = data.fileSize;
                    if (data.fileType !== undefined) updateData.file_type = data.fileType;
                    if (data.hashLocal !== undefined) updateData.hash_local = data.hashLocal;
                    if (data.documentNumber !== undefined) updateData.document_number = data.documentNumber;
                    if (data.issueDate !== undefined) updateData.issue_date = data.issueDate;
                    if (data.expiryDate !== undefined) updateData.expiry_date = data.expiryDate;
                    if (data.issuePlace !== undefined) updateData.issue_place = data.issuePlace;
                    if (data.issuingAuthority !== undefined) updateData.issuing_authority = data.issuingAuthority;
                    if (data.countryOfIssue !== undefined) updateData.country_of_issue = data.countryOfIssue;
                    if (data.thumbnailUrl !== undefined) updateData.thumbnail_url = data.thumbnailUrl;
                    if (data.locationLostFound !== undefined) updateData.location_lost_found = data.locationLostFound;
                    if (data.lastKnownLocation !== undefined) updateData.last_known_location = data.lastKnownLocation;
                    if (data.locationMetadata !== undefined) updateData.location_metadata = data.locationMetadata;
                    if (data.isVerified !== undefined) updateData.is_verified = data.isVerified;
                    if (data.verificationStatus !== undefined) updateData.verification_status = data.verificationStatus;
                    if (data.verificationNotes !== undefined) updateData.verification_notes = data.verificationNotes;
                    if (data.description !== undefined) updateData.description = data.description;
                    if (data.tags !== undefined) updateData.tags = data.tags;
                    if (data.isPublic !== undefined) updateData.is_public = data.isPublic;
                    if (data.isArchived !== undefined) updateData.is_archived = data.isArchived;
                    
                    // Always update the updated_at timestamp
                    updateData.updated_at = new Date().toISOString();
                    
                    const { data: document, error } = await window.supabase
                        .from('documents')
                        .update(updateData)
                        .eq('id', id)
                        .select()
                        .single();
                    if (error) throw error;
                    return document;
                } catch (error) {
                    console.error('Update document error:', error);
                    return null;
                }
            },
            
            async deleteDoc(id) {
                try {
                    const { error } = await window.supabase
                        .from('documents')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    return true;
                } catch (error) {
                    console.error('Delete document error:', error);
                    return false;
                }
            },

            async getAllPublicDocuments() {
                try {
                    const { data: documents, error } = await window.supabase
                        .from('documents')
                        .select('*') // Removed problematic join
                        .in('status', ['lost', 'found'])
                        .order('created_at', { ascending: false });
                    if (error) throw error;
                    return documents;
                } catch (error) {
                    console.error('Get all public documents error:', error);
                    return [];
                }
            }
        };
        
        // Profiles API
        window.profilesApi = {
            async getProfilesByIds(userIds) {
                try {
                    const { data: profiles, error } = await window.supabase
                        .from('user_profiles')
                        .select('id, full_name, avatar_url')
                        .in('id', userIds);
                    if (error) throw error;
                    return profiles;
                } catch (error) {
                    console.error('Get profiles by IDs error:', error);
                    return [];
                }
            },

            async create(userId, data) {
                try {
                    const { data: profile, error } = await window.supabase
                        .from('user_profiles')
                        .insert([{
                            id: userId,
                            full_name: data.fullName || '',
                            phone_number: data.phoneNumber || '',
                            country: data.country || 'MZ',
                            avatar_url: data.avatarUrl || '',
                            points: data.points || 0,
                            document_count: data.documentCount || 0,
                            plan: data.plan || 'free'
                        }])
                        .select()
                        .single();
                    if (error) throw error;
                    return profile;
                } catch (error) {
                    console.error('Create profile error:', error);
                    return null;
                }
            },
            
            async get(userId) {
                try {
                    const { data: profile, error } = await window.supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();
                    if (error) throw error;
                    return profile;
                } catch (error) {
                    console.error('Get profile error:', error);
                    return null;
                }
            },
            
            async update(userId, data) {
                try {
                    const updateData = {};
                    
                    if (data.fullName !== undefined) updateData.full_name = data.fullName;
                    if (data.phoneNumber !== undefined) updateData.phone_number = data.phoneNumber;
                    if (data.country !== undefined) updateData.country = data.country;
                    if (data.plan !== undefined) updateData.plan = data.plan;
                    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
                    if (data.points !== undefined) updateData.points = data.points;
                    if (data.documentCount !== undefined) updateData.document_count = data.documentCount;
                    
                    // Always update the updated_at timestamp
                    updateData.updated_at = new Date().toISOString();
                    
                    const { data: profile, error } = await window.supabase
                        .from('user_profiles')
                        .update(updateData)
                        .eq('id', userId)
                        .select()
                        .single();
                    if (error) throw error;
                    return profile;
                } catch (error) {
                    console.error('Update profile error:', error);
                    return null;
                }
            }
        };
        
        // Chats API
        window.chatsApi = {
            async send(data) {
                try {
                    const { data: message, error } = await window.supabase
                        .from('chats')
                        .insert([{
                            document_id: data.documentId,
                            sender_id: data.senderId,
                            receiver_id: data.receiverId,
                            message: data.message
                        }])
                        .select()
                        .single();
                    if (error) throw error;
                    return message;
                } catch (error) {
                    console.error('Send message error:', error);
                    return null;
                }
            },
            
            async getConversation(documentId, userId) {
                try {
                    const { data: messages, error } = await window.supabase
                        .from('chats')
                        .select('*')
                        .eq('document_id', documentId)
                        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                        .order('created_at', { ascending: true });
                    if (error) throw error;
                    return messages;
                } catch (error) {
                    console.error('Get conversation error:', error);
                    return [];
                }
            }
        };
        
        // Auth API
        window.authApi = {
            async signUp(email, password, userData) {
                try {
                    const { data: authData, error: signUpError } = await window.supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                full_name: userData.fullName,
                                phone_number: userData.phoneNumber,
                                country: userData.country || 'MZ'
                            }
                        }
                    });
                    if (signUpError) throw signUpError;
                    return authData;
                } catch (error) {
                    console.error('Sign up error:', error);
                    throw error;
                }
            },
            
            async signIn(email, password) {
                try {
                    const { data, error } = await window.supabase.auth.signInWithPassword({
                        email,
                        password
                    });
                    if (error) throw error;
                    return data;
                } catch (error) {
                    console.error('Sign in error:', error);
                    throw error;
                }
            },
            
            async signInWithGoogle() {
                try {
                    const { data, error } = await window.supabase.auth.signInWithOAuth({
                        provider: 'google'
                    });
                    if (error) throw error;
                    return data;
                } catch (error) {
                    console.error('Google sign in error:', error);
                    throw error;
                }
            },
            
            async signOut() {
                try {
                    const { error } = await window.supabase.auth.signOut();
                    if (error) throw error;
                } catch (error) {
                    console.error('Sign out error:', error);
                    throw error;
                }
            },
            
            async getCurrentUser() {
                try {
                    const { data: { user }, error } = await window.supabase.auth.getUser();
                    if (error) throw error;
                    return user;
                } catch (error) {
                    console.error('Get user error:', error);
                    return null;
                }
            },
            
            async getSession() {
                try {
                    const { data: { session }, error } = await window.supabase.auth.getSession();
                    if (error) throw error;
                    return session;
                } catch (error) {
                    console.error('Get session error:', error);
                    return null;
                }
            },
            
            async resetPassword(email) {
                try {
                    const { error } = await window.supabase.auth.resetPasswordForEmail(email);
                    if (error) throw error;
                } catch (error) {
                    console.error('Reset password error:', error);
                    throw error;
                }
            }
        };
        
        // Real-time subscriptions
        window.subscribeToDocuments = (userId, callback) => {
            return window.supabase
                .channel('documents')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'documents',
                        filter: `user_id=eq.${userId}`
                    },
                    callback
                )
                .subscribe();
        };
        
        window.subscribeToChats = (documentId, callback) => {
            return window.supabase
                .channel('chats')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'chats',
                        filter: `document_id=eq.${documentId}`
                    },
                    callback
                )
                .subscribe();
        };
        
        console.log('All APIs initialized successfully');
    }
    
    // Fallback functions for when Supabase is not available
    function initializeFallbackAPIs() {
        console.log('Initializing fallback APIs...');
        
        window.documentsApi = {
            async create(data) { return createFallbackDocument(data); },
            async getByUser(userId) { return getFallbackDocuments(); },
            async update(id, data) { return null; },
            async deleteDoc(id) { return true; }
        };
        
        window.profilesApi = {
            async create(userId, data) { return null; },
            async get(userId) { return null; },
            async update(userId, data) { return null; }
        };
        
        window.chatsApi = {
            async send(data) { return null; },
            async getConversation(documentId, userId) { return []; }
        };
        
        window.authApi = {
            async signUp(email, password, userData) { throw new Error('Authentication not available'); },
            async signIn(email, password) { throw new Error('Authentication not available'); },
            async signInWithGoogle() { throw new Error('Authentication not available'); },
            async signOut() { throw new Error('Authentication not available'); },
            async getCurrentUser() { return null; },
            async getSession() { return null; },
            async resetPassword(email) { throw new Error('Authentication not available'); }
        };
        
        window.subscribeToDocuments = () => ({ unsubscribe: () => {} });
        window.subscribeToChats = () => ({ unsubscribe: () => {} });
    }
    
    function createFallbackDocument(data) {
        // Return null instead of creating a fake document
        console.warn('Fallback mode: Document creation failed.');
        return null;
    }
    
    function getFallbackDocuments() {
        // Return an empty array instead of fake documents
        console.warn('Fallback mode: Could not fetch documents.');
        return [];
    }
})();