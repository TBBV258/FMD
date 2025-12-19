// Documents helpers: basic load/create/delete and render
(function () {
    const gridId = 'documents-grid';

    function renderCard(doc) {
        const div = document.createElement('div');
        div.className = 'document-card';
        div.dataset.id = doc.id;
        div.innerHTML = `
            <div class="card-body">
                <h4>${doc.title}</h4>
                <p class="muted">Type: ${doc.type} • Status: ${doc.status}</p>
                <div class="card-actions">
                    <button class="btn small view-doc" data-id="${doc.id}">View</button>
                    <button class="btn danger small delete-doc" data-id="${doc.id}">Delete</button>
                </div>
            </div>`;
        return div;
    }

    async function loadAndRender(userId) {
        const container = document.getElementById(gridId);
        if (!container) return;
        container.innerHTML = '';
        if (!window.documentsApi) {
            console.warn('documentsApi not initialized');
            return;
        }

        try {
            const docs = await window.documentsApi.getByUser(userId);
            if (!docs || docs.length === 0) {
                container.innerHTML = '<p class="muted">No documents</p>';
                return;
            }
            docs.forEach(d => container.appendChild(renderCard(d)));

            // attach delete handlers
            container.querySelectorAll('.delete-doc').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if (!confirm('Delete this document?')) return;
                    try {
                        await window.documentsApi.deleteDoc(id);
                        loadAndRender(userId);
                    } catch (err) { console.error(err); }
                });
            });


        } catch (err) {
            console.error('Failed to load documents', err);
            container.innerHTML = '<p class="error">Failed to load documents</p>';
        }
    }

    // --- Global Document Preview Modal Logic ---
    function setupDocumentPreview() {
        const previewModal = document.getElementById('document-preview-modal');
        const modalTitle = document.getElementById('preview-modal-title');
        const modalBody = document.getElementById('preview-modal-body');
        const closeModalBtn = document.getElementById('close-preview-modal');

        if (!previewModal || !modalTitle || !modalBody || !closeModalBtn) {
            console.warn('Elementos do modal de pré-visualização não encontrados. A funcionalidade de visualização está desativada.');
            return;
        }

        const closePreviewModal = () => {
            previewModal.style.display = 'none';
            modalBody.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Carregando documento...</p></div>'; // Reset body
        };

        closeModalBtn.addEventListener('click', closePreviewModal);
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) { // Click on overlay
                closePreviewModal();
            }
        });

        // Event delegation for all '.view-doc' buttons
        document.body.addEventListener('click', async (e) => {
            if (e.target.matches('.view-doc')) {
                const docId = e.target.dataset.id;
                if (!docId) return;

                if (!window.documentsApi) {
                    console.error('API de documentos não está disponível.');
                    return;
                }

                try {
                    // Fetch the specific document by its ID
                    const doc = await window.documentsApi.getById(docId);

                    if (!doc || !doc.file_url) {
                        if (window.showToast) window.showToast('Documento não encontrado ou sem arquivo associado.', 'error');
                        return;
                    }

                    modalTitle.textContent = doc.title;
                    previewModal.style.display = 'flex';

                    const fileUrl = doc.file_url;
                    const fileType = doc.file_type || '';
                    const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(fileType) || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                    const isPdf = fileType === 'application/pdf' || fileUrl.match(/\.pdf$/i);

                    if (isImage) {
                        modalBody.innerHTML = `<img src="${fileUrl}" alt="${doc.title}" style="max-width: 100%; max-height: 75vh; display: block; margin: auto;">`;
                    } else if (isPdf) {
                        modalBody.innerHTML = `<iframe src="${fileUrl}" style="width: 100%; height: 75vh; border: none;"></iframe>`;
                    } else {
                        modalBody.innerHTML = `
                            <div style="text-align: center; padding: 2rem;">
                                <p>A pré-visualização não está disponível para este tipo de arquivo.</p>
                                <a href="${fileUrl}" class="btn primary" target="_blank" rel="noopener noreferrer">
                                    <i class="fas fa-download"></i> Baixar Documento
                                </a>
                            </div>`;
                    }
                } catch (error) {
                    console.error('Erro ao buscar documento para visualização:', error);
                    if (window.showToast) window.showToast('Não foi possível carregar o documento.', 'error');
                }
            }
        });
    }

    // wire add button and setup preview
    document.addEventListener('DOMContentLoaded', () => {
        setupDocumentPreview(); // Initialize the preview functionality

        const addBtn = document.getElementById('add-document');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                // Open a simple prompt for demo purposes
                const title = prompt('Document title');
                if (!title) return;
                const type = prompt('Type (ID card, Passport, Bank Doc)', 'ID card');
                const location = { address: 'Unknown' };
                const userId = window.currentUser?.id;
                if (!userId) {
                    console.error('No user ID available');
                    return;
                }
                window.documentsApi.create({ userId, title, type, location, fileUrl: '' })
                    .then(() => loadAndRender(userId))
                    .catch(err => console.error(err));
            });
        }
    });

    window.docs = { loadAndRender, renderCard };
})();