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
                contact: document.getElementById('lost-contact').value,
                status: 'lost',
                created_at: new Date().toISOString()
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
                contact: document.getElementById('found-contact').value,
                status: 'found',
                created_at: new Date().toISOString()
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

            // Add user ID to the document data
            const documentData = {
                ...formData,
                user_id: user.id,
                // Add metadata for better search and filtering
                metadata: {
                    contact: formData.contact,
                    location: formData.location
                }
            };

            // Remove fields that shouldn't be in the main document record
            delete documentData.contact;

            // Insert the document
            const { data: savedDoc, error } = await this.supabase
                .from('documents')
                .insert([documentData])
                .select()
                .single();

            if (error) throw error;

            // Show success message
            const message = formType === 'lost' 
                ? 'Documento reportado como perdido com sucesso! Será notificado se for encontrado.'
                : 'Documento reportado como encontrado! Verifique seus contatos para mais informações.';
            
            if (window.showToast) {
                window.showToast(message, 'success');
            }

            // Reset form
            this.resetForm(formType);
            
            // Redirect to documents section
            showSection('documentos');
            
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
    resetForm(formType) {
        const form = document.getElementById(`${formType}-form`);
        if (form) form.reset();
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
