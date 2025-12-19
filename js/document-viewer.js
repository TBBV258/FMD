// Document view and edit functionality
async function viewProfileDocument(doc) {
    const previewModal = document.getElementById('document-preview-modal');
    const modalTitle = document.getElementById('preview-modal-title');
    const modalBody = document.getElementById('preview-modal-body');

    if (!previewModal || !modalTitle || !modalBody) {
        console.error('Modal elements not found');
        return;
    }

    try {
        modalTitle.textContent = doc.title || 'Visualizar Documento';
        previewModal.style.display = 'block';

        // Show loading state
        modalBody.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando documento...</p>
            </div>`;

        // Fetch the document details if needed
        const documentDetails = await window.documentsApi.getById(doc.id);
        
        if (!documentDetails || !documentDetails.file_url) {
            throw new Error('Documento não encontrado ou sem arquivo associado.');
        }

        // Prepare preview content based on file type
        const fileUrl = documentDetails.file_url;
        const fileType = documentDetails.file_type?.toLowerCase() || '';
        
        let previewContent = '';
        if (fileType.includes('image')) {
            previewContent = `
                <div class="document-preview image">
                    <img src="${fileUrl}" alt="${doc.title}" class="preview-image">
                </div>`;
        } else if (fileType.includes('pdf')) {
            previewContent = `
                <div class="document-preview pdf">
                    <iframe src="${fileUrl}" frameborder="0" width="100%" height="600px"></iframe>
                </div>`;
        } else {
            previewContent = `
                <div class="document-preview fallback">
                    <i class="fas fa-file-alt fa-3x"></i>
                    <p>Visualização não disponível para este tipo de arquivo.</p>
                    <a href="${fileUrl}" class="btn btn-primary" target="_blank" download>
                        <i class="fas fa-download"></i> Baixar Arquivo
                    </a>
                </div>`;
        }

        // Show document details and preview
        modalBody.innerHTML = `
            <div class="document-info">
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Tipo:</strong> ${doc.type || 'N/A'}
                    </div>
                    <div class="info-item">
                        <strong>Status:</strong> ${doc.status || 'Ativo'}
                    </div>
                    <div class="info-item">
                        <strong>Data de Upload:</strong> 
                        ${new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    ${doc.location ? `
                        <div class="info-item">
                            <strong>Localização:</strong> ${doc.location.address || 'N/A'}
                        </div>` : ''}
                </div>
                ${doc.notes ? `<div class="document-notes">${doc.notes}</div>` : ''}
            </div>
            ${previewContent}`;

    } catch (error) {
        console.error('Error loading document preview:', error);
        modalBody.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Erro ao carregar o documento: ${error.message}</p>
            </div>`;
    }
}

async function editProfileDocument(doc) {
    // Get references to the upload modal elements
    const uploadModal = document.getElementById('upload-modal');
    const modalTitle = document.getElementById('upload-modal-title');
    const titleInput = document.getElementById('document-title');
    const typeSelect = document.getElementById('document-type');
    const notesTextarea = document.getElementById('document-notes');
    const publicCheckbox = document.getElementById('document-public');
    const submitBtn = document.getElementById('submit-document');
    const uploadSpinner = document.getElementById('upload-spinner');

    if (!uploadModal || !modalTitle || !titleInput || !typeSelect || !submitBtn) {
        console.error('Required modal elements not found');
        if (window.showToast) window.showToast('Erro ao abrir modal de edição', 'error');
        return;
    }

    try {
        // Update modal for edit mode
        modalTitle.textContent = 'Editar Documento';
        submitBtn.textContent = 'Salvar Alterações';

        // Fill form with document data
        titleInput.value = doc.title || '';
        typeSelect.value = doc.type || '';
        if (notesTextarea) notesTextarea.value = doc.notes || '';
        if (publicCheckbox) publicCheckbox.checked = doc.is_public || false;

        // Show modal
        uploadModal.style.display = 'block';

        // Update form submission handler
        const form = document.getElementById('upload-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                submitBtn.disabled = true;
                if (uploadSpinner) uploadSpinner.classList.remove('d-none');

                try {
                    const updates = {
                        title: titleInput.value.trim(),
                        type: typeSelect.value,
                        notes: notesTextarea ? notesTextarea.value.trim() : undefined,
                        is_public: publicCheckbox ? publicCheckbox.checked : undefined
                    };

                    await window.documentsApi.update(doc.id, updates);
                    
                    if (window.showToast) window.showToast('Documento atualizado com sucesso!', 'success');
                    uploadModal.style.display = 'none';
                    
                    // Refresh the documents list
                    const { data: { user } } = await window.supabase.auth.getUser();
                    if (user) {
                        await loadProfileDocuments(user.id);
                    }

                } catch (error) {
                    console.error('Error updating document:', error);
                    if (window.showToast) window.showToast('Erro ao atualizar documento: ' + error.message, 'error');
                } finally {
                    submitBtn.disabled = false;
                    if (uploadSpinner) uploadSpinner.classList.add('d-none');
                }
            };
        }

    } catch (error) {
        console.error('Error setting up edit form:', error);
        if (window.showToast) window.showToast('Erro ao configurar formulário de edição', 'error');
    }
}

// Add click handler for preview modal close button
document.addEventListener('DOMContentLoaded', () => {
    const previewModal = document.getElementById('document-preview-modal');
    const closePreviewBtn = document.getElementById('close-preview-modal');

    if (closePreviewBtn && previewModal) {
        closePreviewBtn.addEventListener('click', () => {
            previewModal.style.display = 'none';
        });

        // Close on overlay click
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                previewModal.style.display = 'none';
            }
        });
    }
});