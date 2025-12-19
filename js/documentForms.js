// Document Forms Handler
class DocumentForms {
    constructor() {
        this.supabase = supabase;
        this.initializeForms();
    }

    // Initialize all document forms
    initializeForms() {
        this.initializeLostForm();
        this.initializeFoundForm();
    }

    // Initialize Lost Document Form
    initializeLostForm() {
        const form = document.getElementById('lost-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                type: document.getElementById('lost-type').value,
                document_number: document.getElementById('lost-document-number')?.value || '',
                title: document.getElementById('lost-title').value,
                description: document.getElementById('lost-description').value,
                location: document.getElementById('lost-location').value,
                contact: document.getElementById('lost-phone').value,
                status: 'lost',
                created_at: new Date().toISOString(),
                // New fields
                issue_date: document.getElementById('lost-issue-date').value,
                expiry_date: document.getElementById('lost-expiry-date').value || null,
                issue_place: document.getElementById('lost-issue-place').value,
                issuing_authority: document.getElementById('lost-issuing-authority').value,
                country_of_issue: document.getElementById('lost-country-issue').value,
                metadata: {
                    phone: document.getElementById('lost-phone').value,
                    location: document.getElementById('lost-location').value
                }
            };

            await this.submitDocument(formData, 'lost');
        });
    }

    // Initialize Found Document Form
    initializeFoundForm() {
        const form = document.getElementById('found-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                type: document.getElementById('found-type').value,
                document_number: document.getElementById('found-document-number')?.value || '',
                title: document.getElementById('found-title').value,
                description: document.getElementById('found-description').value,
                location: document.getElementById('found-location').value,
                contact: document.getElementById('found-phone').value,
                status: 'found',
                created_at: new Date().toISOString(),
                // New fields
                issue_date: document.getElementById('found-issue-date').value || null,
                expiry_date: document.getElementById('found-expiry-date').value || null,
                issue_place: document.getElementById('found-issue-place').value || null,
                metadata: {
                    finder_phone: document.getElementById('found-phone').value,
                    location_found: document.getElementById('found-location').value,
                    found_date: new Date().toISOString()
                }
            };

            await this.submitDocument(formData, 'found');
        });
    }

    // Submit document to the database
    async submitDocument(formData, formType) {
        try {
            // Get current user
            const { data: { user }, error: userError } = await this.supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('User not authenticated');

            // Check for matching documents if this is a found document
            if (formType === 'found' && formData.document_number) {
                const { data: matchingDocs, error: matchError } = await this.supabase
                    .from('documents')
                    .select('*')
                    .eq('document_number', formData.document_number)
                    .eq('status', 'lost')
                    .limit(1);

                if (matchError) throw matchError;

                if (matchingDocs && matchingDocs.length > 0) {
                    // Found a match - update the status and notify the owner
                    const matchedDoc = matchingDocs[0];
                    await this.handleDocumentMatch(matchedDoc, formData);
                    
                    if (window.showToast) {
                        window.showToast('Documento correspondente encontrado! O proprietário será notificado.', 'success');
                    }
                    
                    // Redirect to chat with the document owner
                    if (window.showSection) {
                        showSection('chat');
                        // You would need to implement chat initialization with the document owner here
                    }
                    
                    return;
                }
            }

            // Add user ID to the document data
            const documentData = {
                ...formData,
                user_id: user.id,
                // Ensure metadata exists and includes our custom fields
                metadata: {
                    ...(formData.metadata || {}),
                    contact: formData.contact,
                    location: formData.location,
                    status: formType,
                    last_updated: new Date().toISOString()
                }
            };

            // Remove contact from top level since we store it in metadata
            delete documentData.contact;

            // Insert the document
            const { data: savedDoc, error } = await this.supabase
                .from('documents')
                .insert([documentData])
                .select()
                .single();

            if (error) throw error;

            // Show success message
            let message = '';
            if (formType === 'lost') {
                message = 'Documento reportado como perdido com sucesso! Você será notificado se for encontrado.';
            } else {
                message = 'Documento reportado como encontrado! Verifique seus contatos para mais informações.';
                
                // If we get here, no match was found, but we can still check for potential matches
                await this.checkForPotentialMatches(formData);
            }
            
            if (window.showToast) {
                window.showToast(message, 'success');
            }

            // Reset form
            this.resetForm(formType);
            
            // Redirect to documents section
            if (window.showSection) {
                showSection('documentos');
            }
            
            // Refresh documents list if the function exists
            if (window.loadDocuments) {
                window.loadDocuments();
            }

            return savedDoc;

        } catch (error) {
            console.error('Error submitting document:', error);
            if (window.showToast) {
                window.showToast('Erro ao salvar documento: ' + (error.message || 'Erro desconhecido'), 'error');
            }
            return null;
        }
    }

    // Reset form fields
    // Handle document match found
    async handleDocumentMatch(lostDoc, foundDocData) {
        try {
            // Update the lost document status to 'found'
            await this.supabase
                .from('documents')
                .update({ 
                    status: 'found',
                    found_by: foundDocData.user_id,
                    found_at: new Date().toISOString(),
                    metadata: {
                        ...(lostDoc.metadata || {}),
                        finder_contact: foundDocData.contact,
                        match_date: new Date().toISOString()
                    }
                })
                .eq('id', lostDoc.id);

            // Create a notification for the document owner
            await this.supabase
                .from('notifications')
                .insert([{
                    user_id: lostDoc.user_id,
                    type: 'document_found',
                    title: 'Seu documento foi encontrado!',
                    message: `Seu documento ${lostDoc.title} (${lostDoc.document_number}) foi encontrado. Entre em contato para recuperá-lo.`,
                    action_url: `/chat?user_id=${foundDocData.user_id}`,
                    metadata: {
                        document_id: lostDoc.id,
                        finder_id: foundDocData.user_id,
                        finder_contact: foundDocData.contact
                    }
                }]);

            // Create a chat room between the owner and finder
            const { data: chatRoom, error: chatError } = await this.supabase
                .from('chat_rooms')
                .insert([{
                    name: `Documento: ${lostDoc.document_number}`,
                    is_group: false,
                    created_by: foundDocData.user_id,
                    metadata: {
                        document_id: lostDoc.id,
                        document_number: lostDoc.document_number,
                        document_type: lostDoc.type
                    }
                }])
                .select()
                .single();

            if (chatError) throw chatError;

            // Add both users to the chat room
            await this.supabase
                .from('chat_participants')
                .insert([
                    { room_id: chatRoom.id, user_id: lostDoc.user_id, is_admin: true },
                    { room_id: chatRoom.id, user_id: foundDocData.user_id, is_admin: true }
                ]);

            // Send an initial message
            await this.supabase
                .from('chat_messages')
                .insert([{
                    room_id: chatRoom.id,
                    user_id: foundDocData.user_id,
                    content: `Olá! Encontrei seu documento ${lostDoc.type} (${lostDoc.document_number}). Vamos combinar a devolução?`,
                    message_type: 'text'
                }]);

        } catch (error) {
            console.error('Error handling document match:', error);
            throw error;
        }
    }

    // Check for potential matches (fuzzy matching)
    async checkForPotentialMatches(foundDoc) {
        try {
            // First try exact match
            const { data: exactMatches } = await this.supabase
                .from('documents')
                .select('*')
                .eq('document_number', foundDoc.document_number)
                .eq('status', 'lost')
                .limit(1);

            if (exactMatches && exactMatches.length > 0) {
                await this.handleDocumentMatch(exactMatches[0], foundDoc);
                return true;
            }

            // If no exact match, try fuzzy matching on document type and other fields
            const { data: fuzzyMatches } = await this.supabase
                .from('documents')
                .select('*')
                .eq('type', foundDoc.type)
                .eq('status', 'lost')
                .ilike('title', `%${foundDoc.title}%`);

            if (fuzzyMatches && fuzzyMatches.length > 0) {
                // For simplicity, just take the first match
                // In a real app, you might want to show a list of potential matches
                await this.handleDocumentMatch(fuzzyMatches[0], foundDoc);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking for potential matches:', error);
            return false;
        }
    }

    resetForm(formType) {
        const form = document.getElementById(`${formType}-form`);
        if (form) {
            form.reset();
            // Reset any custom fields or UI elements
            const dateInputs = form.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => input.value = '');
        }
        
        // Show appropriate success message
        if (window.showToast) {
            const message = formType === 'lost' 
                ? 'Documento reportado como perdido com sucesso! Você será notificado se for encontrado.'
                : 'Documento reportado como encontrado! Verificaremos se há correspondências.';
            window.showToast(message, 'success');
        }
    }
}

// Initialize document forms when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase !== 'undefined') {
        window.documentForms = new DocumentForms();
    } else {
        console.error('Supabase client not available for document forms');
    }
});
