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

            container.querySelectorAll('.view-doc').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const doc = docs.find(x => x.id === id);
                    if (window.showToast) {
                        window.showToast(`Viewing: ${doc.title}`, 'info');
                    }
                });
            });

        } catch (err) {
            console.error('Failed to load documents', err);
            container.innerHTML = '<p class="error">Failed to load documents</p>';
        }
    }

    // wire add button
    document.addEventListener('DOMContentLoaded', () => {
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