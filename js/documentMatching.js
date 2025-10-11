// Document Matching and Notification System
class DocumentMatcher {
    constructor() {
        this.supabase = supabase;
        this.setupEventListeners();
        this.initializeRealtimeSubscription();
    }

    // Initialize real-time subscription for document changes
    initializeRealtimeSubscription() {
        if (!this.supabase) {
            console.error('Supabase client not available');
            return;
        }

        // Subscribe to document inserts
        this.subscription = this.supabase
            .channel('document-inserts')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'documents' 
                }, 
                this.handleNewDocument.bind(this)
            )
            .subscribe();
    }

    // Handle new document insertions
    async handleNewDocument(payload) {
        try {
            const newDoc = payload.new;
            console.log('New document created:', newDoc);
            
            // Skip if it's not a found/lost document
            if (!['found', 'lost'].includes(newDoc.status)) {
                return;
            }

            // Find matching documents
            const matches = await this.findMatchingDocuments(newDoc);
            
            // Create notifications for each match
            for (const match of matches) {
                await this.createNotification(match.user_id, newDoc);
            }
        } catch (error) {
            console.error('Error handling new document:', error);
        }
    }

    // Find documents that match the criteria
    async findMatchingDocuments(newDoc) {
        try {
            const { data: matches, error } = await this.supabase
                .from('documents')
                .select('*')
                .eq('type', newDoc.type)
                .eq('document_number', newDoc.document_number)
                .eq('status', newDoc.status === 'found' ? 'lost' : 'found')
                .neq('user_id', newDoc.user_id); // Don't match user's own documents

            if (error) throw error;
            return matches || [];
        } catch (error) {
            console.error('Error finding matching documents:', error);
            return [];
        }
    }

    // Create a notification for a match
    async createNotification(userId, matchedDoc) {
        try {
            const notification = {
                user_id: userId,
                type: 'document_match',
                title: 'Document Match Found!',
                message: `A ${matchedDoc.status} document matches your ${matchedDoc.status === 'found' ? 'lost' : 'found'} document.`,
                action_url: `/document/${matchedDoc.id}`,
                metadata: {
                    document_id: matchedDoc.id,
                    match_type: matchedDoc.status,
                    document_number: matchedDoc.document_number,
                    document_type: matchedDoc.type
                }
            };

            const { data, error } = await this.supabase
                .from('notifications')
                .insert([notification])
                .select();

            if (error) throw error;

            // Show a toast notification
            if (window.showToast) {
                window.showToast(notification.message, 'success');
            }

            return data;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    }

    // Setup event listeners for document form submission
    setupEventListeners() {
        // Listen for document form submission
        document.addEventListener('submit', async (e) => {
            if (e.target.matches('#document-form, [data-document-form]')) {
                e.preventDefault();
                
                const form = e.target;
                const formData = new FormData(form);
                const documentData = {
                    type: formData.get('type'),
                    document_number: formData.get('document_number'),
                    status: formData.get('status'),
                    title: formData.get('title') || `${formData.get('type')} ${formData.get('document_number')}`,
                    description: formData.get('description') || '',
                    // Add other form fields as needed
                };

                try {
                    // Save the document
                    const { data: savedDoc, error } = await this.supabase
                        .from('documents')
                        .insert([documentData])
                        .select()
                        .single();

                    if (error) throw error;

                    // Show success message
                    if (window.showToast) {
                        window.showToast('Document saved successfully!', 'success');
                    }

                    // Close modal if exists
                    const modal = document.getElementById('document-modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }

                    // Reload documents if the function exists
                    if (window.loadDocuments) {
                        window.loadDocuments();
                    }

                    // The real-time subscription will handle the matching
                    
                } catch (error) {
                    console.error('Error saving document:', error);
                    if (window.showToast) {
                        window.showToast('Failed to save document: ' + (error.message || 'Unknown error'), 'error');
                    }
                }
            }
        });
    }
}

// Initialize the document matcher when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase !== 'undefined') {
        window.documentMatcher = new DocumentMatcher();
    } else {
        console.error('Supabase client not available for document matching');
    }
});
