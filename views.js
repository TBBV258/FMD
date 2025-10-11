// View helpers for rendering UI pieces
(function () {
    window.views = {
        createDocumentCard(doc) {
            const div = document.createElement('div');
            div.className = 'document-card';
            div.dataset.id = doc.id;
            div.innerHTML = `
                <div class="card-body">
                    <h4>${doc.title}</h4>
                    <small class="muted">${doc.type} • ${doc.status}</small>
                    <div class="actions">
                        <button class="btn small view" data-id="${doc.id}">View</button>
                        <button class="btn danger small delete" data-id="${doc.id}">Delete</button>
                    </div>
                </div>`;
            return div;
        }
    };
})();