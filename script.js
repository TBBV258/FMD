// Main JavaScript Application Logic

// Current state
let currentUser = null;
let isLoggedIn = false;
let currentChatDocument = null;
let currentLanguage = 'pt';
let currentTheme = 'light';

// DOM Elements
const appSection = document.getElementById('app-section');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const themeToggle = document.getElementById('theme-toggle');
const languageSelector = document.getElementById('language-selector');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function waitForTranslations(timeout = 3000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (window.translations) {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                console.error('Translations object failed to load in time.');
                reject(new Error('Translations failed to load.'));
            }
        }, 50); // Check every 50ms
    });
}

async function initializeApp() {
    try {
        await waitForTranslations();
    } catch (error) {
        console.error(error);
        // We can still try to run the app, but translations will be broken.
    }

    // Check for authenticated user
    try {
        if (window.authApi) {
            const user = await window.authApi.getCurrentUser();
            if (user) {
                currentUser = user;
                isLoggedIn = true;
            } else {
                // No authenticated user found
                window.location.href = 'login.html';
                return;
            }
        } else {
            // No auth API available
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        window.location.href = 'login.html';
        return;
    }
    
    setupNavigation();
    setupTheme();
    setupLanguage();
    loadUserData();
    initializeForms();
    
    // Load initial section
    showSection('documentos');
}

function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });
    
    // Close tip cards
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tip-close')) {
            e.target.closest('.tip-card').remove();
        }
    });
}

function setupTheme() {
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('findmydocs_theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function setupLanguage() {
    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
    
    // Load saved language and apply translations
    const savedLanguage = localStorage.getItem('findmydocs_language') || 'pt';
    // Set the value and apply translations without waiting for DOMContentLoaded again
    if (languageSelector) {
        languageSelector.value = savedLanguage;
    }
    currentLanguage = savedLanguage;
    applyTranslations(savedLanguage);
}

function applyTranslations(lang) {
    if (!window.translations || !window.translations[lang]) {
        console.warn(`Translations for language '${lang}' not found.`);
        return;
    }

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.dataset.i18n;
        const translation = window.translations[lang][key];
        if (translation) {
            el.textContent = translation;
        } else {
            console.warn(`Translation key '${key}' not found for language '${lang}'.`);
        }
    });
}

async function loadUserData() {
    try {
        // Get current user from Supabase
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error || !user) {
            console.error('Error loading user data:', error);
            isLoggedIn = false;
            updateUIForAuthState();
            return;
        }
        
        // Get user profile data
        const { data: profile, error: profileError } = await window.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (profileError) {
            console.error('Error loading profile:', profileError);
        }
        
        currentUser = {
            id: user.id,
            name: profile?.full_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email,
            avatar: profile?.avatar_url || 'https://via.placeholder.com/150',
            points: 0
        };
        
        isLoggedIn = true;
        
        // Update UI with user data
        updateUIForAuthState();
        
        // Initialize points
        if (window.fetchUserActivities) {
            const activities = await window.fetchUserActivities();
            const totalPoints = window.calculateTotalPoints(activities);
            
            // Update points in the UI
            const pointsElement = document.getElementById('profile-points');
            if (pointsElement) {
                pointsElement.textContent = totalPoints;
            }
            
            // Update the points in the stats
            const statPoints = document.getElementById('stat-points');
            if (statPoints) {
                statPoints.textContent = totalPoints;
            }
        }
    } catch (error) {
        console.error('Error in loadUserData:', error);
        isLoggedIn = false;
        updateUIForAuthState();
    }
}

function initializeForms() {
    // Lost document form
    const lostForm = document.getElementById('lost-form');
    if (lostForm) {
        lostForm.addEventListener('submit', handleLostForm);
    }
    
    // Found document form
    const foundForm = document.getElementById('found-form');
    if (foundForm) {
        foundForm.addEventListener('submit', handleFoundForm);
    }
    
    // Add document button
    const addDocumentBtn = document.getElementById('add-document');
    if (addDocumentBtn) {
        addDocumentBtn.addEventListener('click', () => {
            showAddDocumentModal();
        });
    }
}

function showSection(sectionId) {
    // Hide all sections
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav links
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
    
    // Load section-specific data
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'documentos':
            loadDocuments();
            break;
        case 'feed':
            loadFeed();
            break;
        case 'perfil':
            renderProfilePage();
            break;
    }
}

async function loadDocuments() {
    const grid = document.getElementById('documents-grid');
    if (!grid) return;
    
    try {
        const documents = await window.documentsApi.getByUser(currentUser.id);
        grid.innerHTML = '';
        
        if (documents && documents.length > 0) {
            documents.forEach(doc => {
                const card = createDocumentCard(doc);
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<p class="text-center muted">Nenhum documento adicionado ainda</p>';
        }
        
        updateDocumentCount(documents?.length || 0);
    } catch (error) {
        console.error('Error loading documents:', error);
        grid.innerHTML = '<p class="text-center error">Erro ao carregar documentos</p>';
    }
}

function createDocumentCard(doc) {
    const div = document.createElement('div');
    div.className = 'document-card';
    div.dataset.id = doc.id;
    
    const statusClass = doc.status === 'lost' ? 'danger' : doc.status === 'found' ? 'success' : 'primary';
    
    div.innerHTML = `
        <div class="card-body">
            <h4>${doc.title}</h4>
            <p class="muted">Tipo: ${doc.type} • Status: ${doc.status}</p>
            <div class="card-actions">
                <button class="btn small ${statusClass} view-doc" data-id="${doc.id}">Ver</button>
                <button class="btn danger small delete-doc" data-id="${doc.id}">Excluir</button>
            </div>
        </div>`;
    
    // Add event listeners
    const viewBtn = div.querySelector('.view-doc');
    const deleteBtn = div.querySelector('.delete-doc');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', () => viewDocument(doc));
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteDocument(doc.id));
    }
    
    return div;
}

async function loadFeed() {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return;

    feedContent.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>A carregar o feed...</p></div>';

    try {
        if (!window.documentsApi) throw new Error('API de documentos não inicializada.');

        const documents = await window.documentsApi.getAllPublicDocuments();

        if (!documents || documents.length === 0) {
            feedContent.innerHTML = '<p class="text-center muted">Nenhum documento perdido ou encontrado reportado ainda.</p>';
            return;
        }

        // Get all unique user IDs from the documents
        const userIds = [...new Set(documents.map(doc => doc.user_id))];
        
        // Fetch the profiles for these users
        const profiles = await window.profilesApi.getProfilesByIds(userIds);
        const profilesMap = new Map(profiles.map(p => [p.id, p]));

        feedContent.innerHTML = ''; // Clear loading state
        documents.forEach(doc => {
            const reporterProfile = profilesMap.get(doc.user_id);
            const card = createFeedCard(doc, reporterProfile);
            feedContent.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading feed:', error);
        feedContent.innerHTML = '<p class="text-center error">Não foi possível carregar o feed. Tente novamente mais tarde.</p>';
    }
}

// --- Chat Initiation from Feed ---
document.body.addEventListener('click', (e) => {
    if (e.target.matches('.contact-reporter-btn')) {
        const docId = e.target.dataset.docId;
        const reporterId = e.target.dataset.reporterId;

        if (!docId || !reporterId) {
            console.error('Missing document or reporter ID for chat.');
            return;
        }

        if (window.chat && typeof window.chat.openChatModal === 'function') {
            // We need the document title to display in the chat header.
            // We can fetch the document again or get it from the card.
            const docTitle = e.target.closest('.document-card').querySelector('h4').textContent;
            window.chat.openChatModal(docId, docTitle, reporterId);
        } else {
            console.error('Chat module not available.');
            showToast('A funcionalidade de chat não está disponível.', 'error');
        }
    }
});

function createFeedCard(doc, reporterProfile) {
    const div = document.createElement('div');
    div.className = 'feed-item';

    const isOwnDocument = doc.user_id === currentUser?.id;
    const reporterName = reporterProfile?.full_name || 'Utilizador Anónimo';
    const statusText = doc.status === 'lost' ? 'perdido' : 'encontrado';
    const location = doc.location?.address || 'local não especificado';

    // Determine which buttons to show
    let actionsHtml = '';
    if (isOwnDocument) {
        actionsHtml = `<button class="btn small secondary view-doc" data-id="${doc.id}">Ver Detalhes</button>`;
    } else {
        actionsHtml = `<button class="btn small primary contact-reporter-btn" data-doc-id="${doc.id}" data-reporter-id="${doc.user_id}">Contactar</button>`;
    }

    div.innerHTML = `
        <div class="document-card">
            <div class="card-body">
                <h4>${doc.title}</h4>
                <p class="muted">Status: <span class="status-${doc.status}">${statusText}</span></p>
                <p class="muted">Local: ${location}</p>
                <p class="muted">Reportado por: ${reporterName}</p>
                <div class="card-actions">
                    ${actionsHtml}
                </div>
            </div>
        </div>`;

    return div;
}

function loadProfile() {
    updateProfileInfo();
}

async function updateProfileInfo() {
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const statDocuments = document.getElementById('stat-documents');
    const statPoints = document.getElementById('stat-points');
    const statHelped = document.getElementById('stat-helped');
    
    if (profileName) profileName.textContent = currentUser.name || 'Demo User';
    if (profileEmail) profileEmail.textContent = currentUser.email || 'demo@example.com';
    
    try {
        // Get user's documents count
        const { data: documents, error: docsError } = await window.supabase
            .from('documents')
            .select('id', { count: 'exact' })
            .eq('user_id', currentUser.id);
            
        if (!docsError && statDocuments) {
            statDocuments.textContent = documents?.length || '0';
        }
        
        // Get user's points from activities
        if (window.calculateTotalPoints) {
            const activities = await window.fetchUserActivities?.() || [];
            const totalPoints = window.calculateTotalPoints(activities);
            if (statPoints) statPoints.textContent = totalPoints;
        } else if (statPoints) {
            statPoints.textContent = '0';
        }
        
        // Get helped count (documents marked as returned)
        const { data: helpedDocs, error: helpedError } = await window.supabase
            .from('documents')
            .select('id', { count: 'exact' })
            .eq('returned_by', currentUser.id);
            
        if (!helpedError && statHelped) {
            statHelped.textContent = helpedDocs?.length || '0';
        }
    } catch (error) {
        console.error('Error updating profile info:', error);
        // Fallback to default values
        if (statDocuments) statDocuments.textContent = '0';
        if (statPoints) statPoints.textContent = '0';
        if (statHelped) statHelped.textContent = '0';
    }
}

function updateDocumentCount(count = 0) {
    const documentCount = document.getElementById('document-count');
    if (documentCount) {
        documentCount.textContent = `${count} total`;
    }
}

async function handleLostForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        userId: currentUser.id,
        title: document.getElementById('lost-title').value,
        type: document.getElementById('lost-type').value,
        status: 'lost',
        location: { address: document.getElementById('lost-location').value },
        fileUrl: ''
    };
    
    try {
        await window.documentsApi.create(data);
        showToast('Documento perdido reportado com sucesso!', 'success');
        
        // Award points for reporting lost document
        await trackDocumentLost();
        
        e.target.reset();
        loadFeed(); // Refresh the feed with the new document
        showSection('feed'); // Redirect to the feed section
    } catch (error) {
        console.error('Error reporting lost document:', error);
        showToast('Erro ao reportar documento perdido', 'error');
    }
}

async function handleFoundForm(e) {
    e.preventDefault();
    
    const data = {
        userId: currentUser.id,
        title: document.getElementById('found-title').value,
        type: document.getElementById('found-type').value,
        status: 'found',
        location: { address: document.getElementById('found-location').value },
        fileUrl: ''
    };
    
    try {
        await window.documentsApi.create(data);
        showToast('Documento encontrado reportado com sucesso!', 'success');
        
        // Award points for reporting found document
        await trackDocumentFound();
        
        e.target.reset();
        loadFeed(); // Refresh the feed with the new document
        showSection('feed'); // Ensure user is on the feed section
    } catch (error) {
        console.error('Error reporting found document:', error);
        showToast('Erro ao reportar documento encontrado', 'error');
    }
}

function viewDocument(doc) {
    showToast(`Visualizando: ${doc.title}`, 'info');
}

async function deleteDocument(docId) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
        return;
    }
    
    try {
        await window.documentsApi.deleteDoc(docId);
        showToast('Documento excluído com sucesso!', 'success');
        loadDocuments();
    } catch (error) {
        console.error('Error deleting document:', error);
        showToast('Erro ao excluir documento', 'error');
    }
}

function showAddDocumentModal() {
    showToast('Modal de adicionar documento em desenvolvimento', 'info');
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('findmydocs_theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = themeToggle?.querySelector('i');
    if (icon) {
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('findmydocs_language', currentLanguage);
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }
    applyTranslations(lang); // Apply the new language
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; cursor: pointer; margin-left: 10px; color: inherit;"
                    aria-label="Fechar">&times;</button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Country flag mapping
const countryFlags = {
    'MZ': '🇲🇿',
    'ZA': '🇿🇦',
    'FR': '🇫🇷',
    'GB': '🇬🇧',
    'US': '🇺🇸',
    // Add more countries as needed
};

// Profile Page Functions
async function renderProfilePage() {
    const loadingDiv = document.getElementById('profile-loading');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profilePlan = document.getElementById('profile-plan');
    const profileDocCount = document.getElementById('profile-doc-count');
    const profileDocumentsGrid = document.getElementById('profile-documents-grid');
    
    // Show loading state
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
    }
    
    try {
        // Get user session
        let user = currentUser;
        if (window.authApi) {
            const sessionUser = await window.authApi.getCurrentUser();
            if (sessionUser) {
                user = sessionUser;
                currentUser = user;
            }
        }
        
        // Get user profile data
        let userProfile = null;
        if (window.profilesApi && user.id) {
            try {
                userProfile = await window.profilesApi.get(user.id);
            } catch (error) {
                console.log('Profile not found, using defaults');
            }
        }
        
        // Update profile info
        if (profileName) profileName.textContent = user.user_metadata?.full_name || user.email || 'User';
        if (profileEmail) profileEmail.textContent = user.email || 'user@example.com';
        
        // Update avatar if available
        const avatarImg = document.getElementById('profile-avatar');
        if (avatarImg && userProfile?.avatar_url) {
            avatarImg.src = userProfile.avatar_url;
        }

        // Update country flag
        const flagSpan = document.getElementById('profile-country-flag');
        if (flagSpan && userProfile?.country) {
            flagSpan.textContent = countryFlags[userProfile.country.toUpperCase()] || '🏳️';
        }
        
        const plan = userProfile?.plan || 'free';
        if (profilePlan) {
            profilePlan.textContent = plan;
            profilePlan.className = `plan-badge ${plan}`;
        }
        
        // Load user documents
        await loadProfileDocuments(user.id);
        
        // Update document count
        const documents = await window.documentsApi.getByUser(user.id);
        const docCount = documents?.length || 0;
        if (profileDocCount) profileDocCount.textContent = docCount.toString();
        
        // Update points display
        const userPoints = userProfile?.points || 0;
        updatePointsDisplay(userPoints);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Erro ao carregar perfil', 'error');
    } finally {
        // Hide loading state
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }
}

async function loadProfileDocuments(userId) {
    const grid = document.getElementById('profile-documents-grid');
    if (!grid) return;
    
    try {
        const documents = await window.documentsApi.getByUser(userId);
        grid.innerHTML = '';
        
        if (documents && documents.length > 0) {
            documents.forEach(doc => {
                const card = createProfileDocumentCard(doc);
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<p class="text-center muted">Nenhum documento adicionado ainda</p>';
        }
    } catch (error) {
        console.error('Error loading profile documents:', error);
        grid.innerHTML = '<p class="text-center error">Erro ao carregar documentos</p>';
    }
}

function createProfileDocumentCard(doc) {
    const div = document.createElement('div');
    div.className = 'document-card';
    div.dataset.id = doc.id;
    
    const statusClass = doc.status === 'lost' ? 'danger' : doc.status === 'found' ? 'success' : 'primary';
    const statusText = doc.status === 'lost' ? 'Perdido' : doc.status === 'found' ? 'Encontrado' : 'Normal';
    
    div.innerHTML = `
        <div class="card-body">
            <h4>${doc.title}</h4>
            <p class="muted">Tipo: ${doc.type} • Status: ${statusText}</p>
            <div class="card-actions">
                <button class="btn small ${statusClass} view-profile-doc" data-id="${doc.id}">Ver</button>
                <button class="btn small secondary edit-profile-doc" data-id="${doc.id}">Editar</button>
                ${doc.status === 'normal' ? 
                    `<button class="btn small warning mark-lost-doc" data-id="${doc.id}">Marcar Perdido</button>` :
                    doc.status === 'lost' ? 
                    `<button class="btn small success cancel-lost-doc" data-id="${doc.id}">Cancelar Perdido</button>` : ''
                }
                <button class="btn small info chat-doc-btn" data-id="${doc.id}" data-title="${doc.title}">
                    <i class="fas fa-comments"></i> Chat
                </button>
                <button class="btn danger small delete-profile-doc" data-id="${doc.id}">Excluir</button>
            </div>
        </div>`;
    
    // Add event listeners
    const viewBtn = div.querySelector('.view-profile-doc');
    const editBtn = div.querySelector('.edit-profile-doc');
    const markLostBtn = div.querySelector('.mark-lost-doc');
    const cancelLostBtn = div.querySelector('.cancel-lost-doc');
    const chatBtn = div.querySelector('.chat-doc-btn');
    const deleteBtn = div.querySelector('.delete-profile-doc');
    
    if (viewBtn) viewBtn.addEventListener('click', () => viewProfileDocument(doc));
    if (editBtn) editBtn.addEventListener('click', () => editProfileDocument(doc));
    if (markLostBtn) markLostBtn.addEventListener('click', () => markDocumentAsLost(doc.id));
    if (cancelLostBtn) cancelLostBtn.addEventListener('click', () => cancelDocumentLost(doc.id));
    if (chatBtn) chatBtn.addEventListener('click', () => window.chat.openChatModal(doc.id, doc.title));
    if (deleteBtn) deleteBtn.addEventListener('click', () => deleteProfileDocument(doc.id));
    
    return div;
}

// Document Actions
function viewProfileDocument(doc) {
    // Get modal elements
    const modal = document.getElementById('document-preview-modal');
    const modalTitle = document.getElementById('preview-modal-title');
    const modalBody = document.getElementById('preview-modal-body');
    
    // Show loading state
    modalBody.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando documento...</p>
        </div>
    `;
    
    // Show the modal immediately with loading state
    modal.style.display = 'block';
    
    // Format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'Não informada';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');
        } catch (e) {
            return 'Data inválida';
        }
    };

    // Format status
    const statusConfig = {
        'normal': { text: 'Normal', class: 'primary' },
        'lost': { text: 'Perdido', class: 'danger' },
        'found': { text: 'Encontrado', class: 'success' },
        'expired': { text: 'Expirado', class: 'warning' },
        'reported': { text: 'Reportado', class: 'info' },
        'active': { text: 'Ativo', class: 'success' },
        'inactive': { text: 'Inativo', class: 'secondary' },
        'pending': { text: 'Pendente', class: 'warning' },
        'approved': { text: 'Aprovado', class: 'success' },
        'rejected': { text: 'Rejeitado', class: 'danger' },
        'verified': { text: 'Verificado', class: 'success' },
        'unverified': { text: 'Não Verificado', class: 'warning' },
        'blocked': { text: 'Bloqueado', class: 'danger' },
        'archived': { text: 'Arquivado', class: 'secondary' },
        'draft': { text: 'Rascunho', class: 'info' },
        'published': { text: 'Publicado', class: 'success' },
        'deleted': { text: 'Excluído', class: 'danger' },
        'suspended': { text: 'Suspenso', class: 'warning' },
        'banned': { text: 'Banido', class: 'danger' },
        'under_review': { text: 'Em Análise', class: 'warning' },
        'completed': { text: 'Concluído', class: 'success' },
        'cancelled': { text: 'Cancelado', class: 'danger' },
        'refunded': { text: 'Reembolsado', class: 'info' },
        'failed': { text: 'Falhou', class: 'danger' },
        'processing': { text: 'Processando', class: 'info' },
        'shipped': { text: 'Enviado', class: 'success' },
        'delivered': { text: 'Entregue', class: 'success' },
        'returned': { text: 'Devolvido', class: 'warning' },
        'exchanged': { text: 'Trocado', class: 'info' },
        'on_hold': { text: 'Em Espera', class: 'warning' },
        'out_of_stock': { text: 'Fora de Estoque', class: 'danger' },
        'pre_order': { text: 'Pré-venda', class: 'info' },
        'backorder': { text: 'Sob Encomenda', class: 'warning' },
        'discontinued': { text: 'Descontinuado', class: 'secondary' },
        'coming_soon': { text: 'Em Breve', class: 'info' },
        'new': { text: 'Novo', class: 'success' },
        'used': { text: 'Usado', class: 'info' },
        'refurbished': { text: 'Recondicionado', class: 'info' },
        'damaged': { text: 'Danificado', class: 'danger' },
        'recalled': { text: 'Recolhido', class: 'danger' },
        'recall_issued': { text: 'Recall Emitido', class: 'warning' },
        'recall_completed': { text: 'Recall Concluído', class: 'info' },
        'recall_cancelled': { text: 'Recall Cancelado', class: 'secondary' },
        'recall_in_progress': { text: 'Recall em Andamento', class: 'warning' },
        'recall_pending': { text: 'Recall Pendente', class: 'warning' },
        'recall_failed': { text: 'Recall Falhou', class: 'danger' },
        'recall_successful': { text: 'Recall Bem-sucedido', class: 'success' },
        'recall_partial': { text: 'Recall Parcial', class: 'warning' },
        'recall_verified': { text: 'Recall Verificado', class: 'success' },
        'recall_unverified': { text: 'Recall Não Verificado', class: 'warning' },
        'recall_approved': { text: 'Recall Aprovado', class: 'success' },
        'recall_rejected': { text: 'Recall Rejeitado', class: 'danger' },
        'recall_archived': { text: 'Recall Arquivado', class: 'secondary' },
        'recall_deleted': { text: 'Recall Excluído', class: 'danger' },
        'recall_blocked': { text: 'Recall Bloqueado', class: 'danger' },
        'recall_suspended': { text: 'Recall Suspenso', class: 'warning' },
        'recall_banned': { text: 'Recall Banido', class: 'danger' },
        'recall_under_review': { text: 'Recall em Análise', class: 'warning' },
        'recall_completed': { text: 'Recall Concluído', class: 'success' },
        'recall_cancelled': { text: 'Recall Cancelado', class: 'danger' },
        'recall_refunded': { text: 'Recall Reembolsado', class: 'info' },
        'recall_failed': { text: 'Recall Falhou', class: 'danger' },
        'recall_processing': { text: 'Recall em Processamento', class: 'info' },
        'recall_shipped': { text: 'Recall Enviado', class: 'success' },
        'recall_delivered': { text: 'Recall Entregue', class: 'success' },
        'recall_returned': { text: 'Recall Devolvido', class: 'warning' },
        'recall_exchanged': { text: 'Recall Trocado', class: 'info' },
        'recall_on_hold': { text: 'Recall em Espera', class: 'warning' },
        'recall_out_of_stock': { text: 'Recall Fora de Estoque', class: 'danger' },
        'recall_pre_order': { text: 'Recall em Pré-venda', class: 'info' },
        'recall_backorder': { text: 'Recall Sob Encomenda', class: 'warning' },
        'recall_discontinued': { text: 'Recall Descontinuado', class: 'secondary' },
        'recall_coming_soon': { text: 'Recall em Breve', class: 'info' },
        'recall_new': { text: 'Recall Novo', class: 'success' },
        'recall_used': { text: 'Recall Usado', class: 'info' },
        'recall_refurbished': { text: 'Recall Recondicionado', class: 'info' },
        'recall_damaged': { text: 'Recall Danificado', class: 'danger' }
    };
    
    const status = statusConfig[doc.status?.toLowerCase()] || { text: doc.status || 'Desconhecido', class: 'secondary' };
    
    // Check if the document has expired
    const isDocExpired = doc.expiry_date ? isExpired(doc.expiry_date) : false;
    if (isDocExpired && status.text !== 'Expirado') {
        status.text = 'Expirado';
        status.class = 'warning';
    }
    
    // Create document details HTML
    const docHtml = `
        <div class="document-preview-container">
            <div class="document-preview-header">
                <h3>${doc.title || 'Documento sem título'}</h3>
                <span class="status-badge ${status.class}">${status.text}</span>
            </div>
            
            <div class="document-preview-content">
                <!-- Document Preview Section -->
                <div class="document-preview-section">
                    <h4><i class="fas fa-file-alt"></i> Visualização do Documento</h4>
                    ${doc.file_url ? `
                        <div class="document-preview">
                            ${isImageFile(doc.file_type) ? `
                                <img src="${doc.file_url}" 
                                     alt="${doc.title || 'Documento'}" 
                                     class="document-image"
                                     onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'no-preview\'><i class=\'fas fa-file-alt\'></i><p>Erro ao carregar a imagem</p></div>';">
                            ` : `
                                <div class="document-file-preview">
                                    <i class="fas ${getFileIcon(doc.file_type)} fa-4x"></i>
                                    <p>${doc.file_name || 'Documento'}</p>
                                    <small>${doc.file_type || 'Tipo de arquivo desconhecido'}</small>
                                </div>
                            `}
                        </div>
                        
                        <div class="document-preview-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                            <a href="${doc.file_url}" 
                               class="btn primary"
                               download="${doc.file_name || 'documento'}"
                               style="flex: 1; text-align: center;">
                                <i class="fas fa-download"></i> Baixar Documento
                            </a>
                            <button class="btn secondary" id="print-document-btn" style="flex: 1;">
                                <i class="fas fa-print"></i> Imprimir
                            </button>
                        </div>
                    ` : `
                        <div class="no-preview">
                            <i class="fas fa-file-alt"></i>
                            <p>Nenhuma visualização disponível</p>
                            <small>Este documento não possui um arquivo anexado.</small>
                        </div>
                    `}
                </div>
                
                <!-- Document Details Section -->
                <div class="document-details-section">
                    <h4><i class="fas fa-info-circle"></i> Detalhes do Documento</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Tipo:</span>
                            <span class="detail-value">${doc.type || 'Não especificado'}</span>
                        </div>
                        
                        ${doc.document_number ? `
                            <div class="detail-item">
                                <span class="detail-label">Número:</span>
                                <span class="detail-value">${doc.document_number}</span>
                            </div>
                        ` : ''}
                        
                        ${doc.issue_date ? `
                            <div class="detail-item">
                                <span class="detail-label">Data de Emissão:</span>
                                <span class="detail-value">${formatDate(doc.issue_date)}</span>
                            </div>
                        ` : ''}
                        
                        ${doc.expiry_date ? `
                            <div class="detail-item">
                                <span class="detail-label">Data de Validade:</span>
                                <span class="detail-value ${isDocExpired ? 'expired' : ''}">
                                    ${formatDate(doc.expiry_date)}
                                    ${isDocExpired ? ' (Expirado)' : ''}
                                </span>
                            </div>
                        ` : ''}
                        
                        ${doc.issue_place ? `
                            <div class="detail-item">
                                <span class="detail-label">Local de Emissão:</span>
                                <span class="detail-value">${doc.issue_place}</span>
                            </div>
                        ` : ''}
                        
                        ${doc.issuing_authority ? `
                            <div class="detail-item">
                                <span class="detail-label">Autoridade Emissora:</span>
                                <span class="detail-value">${doc.issuing_authority}</span>
                            </div>
                        ` : ''}
                        
                        ${doc.country_of_issue ? `
                            <div class="detail-item">
                                <span class="detail-label">País de Emissão:</span>
                                <span class="detail-value">${doc.country_of_issue}</span>
                            </div>
                        ` : ''}
                        
                        ${doc.created_at ? `
                            <div class="detail-item">
                                <span class="detail-label">Carregado em:</span>
                                <span class="detail-value">${formatDate(doc.created_at)}</span>
                            </div>
                        ` : ''}
                        
                        ${doc.updated_at ? `
                            <div class="detail-item">
                                <span class="detail-label">Atualizado em:</span>
                                <span class="detail-value">${formatDate(doc.updated_at)}</span>
                            </div>
                        ` : ''}
                        
                        ${doc.file_size ? `
                            <div class="detail-item">
                                <span class="detail-label">Tamanho do Arquivo:</span>
                                <span class="detail-value">${formatFileSize(doc.file_size)}</span>
                            </div>
                        ` : ''}
                        
                        ${doc.file_type ? `
                            <div class="detail-item">
                                <span class="detail-label">Tipo de Arquivo:</span>
                                <span class="detail-value">${doc.file_type}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${doc.description ? `
                        <div class="document-description">
                            <h5>Observações:</h5>
                            <p>${doc.description.replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}
                    
                    ${doc.tags?.length > 0 ? `
                        <div class="document-tags" style="margin-top: 1rem;">
                            <h5>Tags:</h5>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                                ${doc.tags.map(tag => `
                                    <span style="background: #e9ecef; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85em; color: #495057;">
                                        #${tag}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${doc.location_lost_found ? `
                        <div class="document-location" style="margin-top: 1.5rem;">
                            <h5>Localização:</h5>
                            <div id="map-preview" style="height: 200px; margin-top: 10px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px dashed #ddd;">
                                <div style="text-align: center; padding: 1rem;">
                                    <i class="fas fa-map-marker-alt" style="font-size: 2rem; color: #6c757d; margin-bottom: 0.5rem;"></i>
                                    <p style="color: #6c757d; margin: 0;">${doc.location_lost_found}</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="document-actions">
                ${doc.file_url ? `
                    <a href="${doc.file_url}" 
                       download="${doc.file_name || 'documento'}" 
                       class="btn primary">
                        <i class="fas fa-download"></i> Baixar
                    </a>
                ` : ''}
                <button class="btn secondary" id="print-document-btn">
                    <i class="fas fa-print"></i> Imprimir
                </button>
                <button class="btn" id="close-preview-btn">
                    <i class="fas fa-times"></i> Fechar
                </button>
            </div>
        </div>
    `;
    
    // Set modal content
    modalBody.innerHTML = docHtml;
    
    // Add event listeners
    const closeBtn = document.getElementById('close-preview-btn');
    const closeModalBtn = document.getElementById('close-preview-modal');
    const printBtn = document.getElementById('print-document-btn');
    
    const closeModal = () => {
        modal.style.display = 'none';
        // Reset modal content to loading state for next time
        modalBody.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando documento...</p>
            </div>
        `;
    };
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside the content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
    
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
    
    // Initialize map if location is available
    if (doc.location_lat && doc.location_lng) {
        initializeMap(doc.location_lat, doc.location_lng, doc.location_address || 'Localização do documento');
    }
}

// Helper function to check if a file is an image
function isImageFile(fileType) {
    return fileType && fileType.startsWith('image/');
}

// Helper function to format file size
function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to check if a date is expired
function isExpired(dateString) {
    if (!dateString) return false;
    try {
        const expiryDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return expiryDate < today;
    } catch (e) {
        console.error('Error checking expiry date:', e);
        return false;
    }
}

// Helper function to get file icon based on file type
function getFileIcon(fileType) {
    if (!fileType) return 'fa-file';
    
    const typeMap = {
        // Images
        'image/': 'fa-file-image',
        // Documents
        'application/pdf': 'fa-file-pdf',
        'application/msword': 'fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
        'application/vnd.ms-excel': 'fa-file-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fa-file-excel',
        'application/vnd.ms-powerpoint': 'fa-file-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fa-file-powerpoint',
        'text/plain': 'fa-file-alt',
        'text/csv': 'fa-file-csv',
        // Archives
        'application/zip': 'fa-file-archive',
        'application/x-rar-compressed': 'fa-file-archive',
        'application/x-7z-compressed': 'fa-file-archive',
        'application/x-tar': 'fa-file-archive',
        'application/x-gzip': 'fa-file-archive',
        // Code
        'text/html': 'fa-file-code',
        'text/css': 'fa-file-code',
        'text/javascript': 'fa-file-code',
        'application/json': 'fa-file-code',
        // Audio/Video
        'audio/': 'fa-file-audio',
        'video/': 'fa-file-video'
    };
    
    // Check for exact matches first
    if (typeMap[fileType]) {
        return typeMap[fileType];
    }
    
    // Check for partial matches (e.g., image/, audio/, etc.)
    for (const [key, icon] of Object.entries(typeMap)) {
        if (key.endsWith('/') && fileType.startsWith(key)) {
            return icon;
        }
    }
    
    // Default icon
    return 'fa-file';
}

// Initialize map for document location
function initializeMap(lat, lng, title) {
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        console.warn('Leaflet not loaded, skipping map initialization');
        return;
    }
    
    try {
        const mapElement = document.getElementById('map-preview');
        if (!mapElement) return;
        
        // Clear any existing map
        mapElement.innerHTML = '';
        
        // Create map
        const map = L.map('map-preview').setView([lat, lng], 15);
        
        // Add tile layer (you may need to use your own tile provider)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add marker
        L.marker([lat, lng])
            .addTo(map)
            .bindPopup(title || 'Localização do documento')
            .openPopup();
            
    } catch (error) {
        console.error('Error initializing map:', error);
        const mapElement = document.getElementById('map-preview');
        if (mapElement) {
            mapElement.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #721c24; background: #f8d7da; border-radius: 4px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar o mapa: ${error.message}</p>
                </div>
            `;
        }
    }
}

function editProfileDocument(doc) {
    showToast(`Editando: ${doc.title}`, 'info');
}

async function markDocumentAsLost(docId) {
    if (!confirm('Tem certeza que deseja marcar este documento como perdido? Ele será visível no feed público.')) {
        return;
    }
    
    try {
        await window.documentsApi.update(docId, { status: 'lost' });
        showToast('Documento marcado como perdido!', 'success');
        renderProfilePage(); // Reload profile
    } catch (error) {
        console.error('Error marking document as lost:', error);
        showToast('Erro ao marcar documento como perdido', 'error');
    }
}

async function cancelDocumentLost(docId) {
    if (!confirm('Tem certeza que deseja cancelar o status de perdido?')) {
        return;
    }
    
    try {
        await window.documentsApi.update(docId, { status: 'normal' });
        showToast('Status de perdido cancelado!', 'success');
        renderProfilePage(); // Reload profile
    } catch (error) {
        console.error('Error canceling lost status:', error);
        showToast('Erro ao cancelar status de perdido', 'error');
    }
}

async function deleteProfileDocument(docId) {
    if (!confirm('Tem certeza que deseja excluir este documento permanentemente?')) {
        return;
    }
    
    try {
        await window.documentsApi.deleteDoc(docId);
        showToast('Documento excluído com sucesso!', 'success');
        renderProfilePage(); // Reload profile
    } catch (error) {
        console.error('Error deleting document:', error);
        showToast('Erro ao excluir documento', 'error');
    }
}

// Logout Function
async function handleLogout() {
    try {
        if (window.authApi) {
            await window.authApi.signOut();
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('remember_me');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API fails
        localStorage.removeItem('auth_token');
        localStorage.removeItem('remember_me');
        window.location.href = 'login.html';
    }
}

// Upload Modal Functions
let selectedFile = null;
let processedImageBlob = null;

function initializeUploadModal() {
    const uploadModal = document.getElementById('upload-modal');
    const profileAddBtn = document.getElementById('profile-add-document');
    const addDocumentBtn = document.getElementById('add-document');
    const uploadModalClose = document.getElementById('upload-modal-close');
    const uploadCancel = document.getElementById('upload-cancel');
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('upload-file');
    const dropzone = document.getElementById('file-upload-dropzone');
    
    // Open modal events
    if (profileAddBtn) {
        profileAddBtn.addEventListener('click', openUploadModal);
    }
    if (addDocumentBtn) {
        addDocumentBtn.addEventListener('click', openUploadModal);
    }
    
    // Close modal events
    if (uploadModalClose) {
        uploadModalClose.addEventListener('click', closeUploadModal);
    }
    if (uploadCancel) {
        uploadCancel.addEventListener('click', closeUploadModal);
    }
    
    // File input and dropzone
    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('drop', handleFileDrop);
        dropzone.addEventListener('dragleave', handleDragLeave);
    }
    
    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadSubmit);
    }
}

async function openUploadModal() {
    // Check user plan limits
    const plan = document.getElementById('profile-plan')?.textContent || 'free';
    const docCount = parseInt(document.getElementById('profile-doc-count')?.textContent || '0');
    
    if (plan === 'free' && docCount >= 1) {
        showToast('Plano Gratuito: Limite de 1 documento (BI) atingido', 'warning');
        return;
    }
    
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.style.display = 'block';
        resetUploadForm();
    }
}

function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.style.display = 'none';
        resetUploadForm();
    }
}

function resetUploadForm() {
    const form = document.getElementById('upload-form');
    const previewContainer = document.getElementById('image-preview-container');
    const uploadSubmit = document.getElementById('upload-submit');
    
    if (form) form.reset();
    if (previewContainer) previewContainer.style.display = 'none';
    if (uploadSubmit) uploadSubmit.disabled = true;
    
    selectedFile = null;
    processedImageBlob = null;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processSelectedFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processSelectedFile(files[0]);
    }
}

function processSelectedFile(file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione apenas arquivos de imagem', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showToast('Arquivo muito grande. Máximo 5MB', 'error');
        return;
    }
    
    selectedFile = file;
    previewAndProcessImage(file);
}

function previewAndProcessImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            processImageWithWatermark(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function processImageWithWatermark(img) {
    const canvas = document.getElementById('image-preview-canvas');
    const ctx = canvas.getContext('2d');
    const previewContainer = document.getElementById('image-preview-container');
    const uploadSubmit = document.getElementById('upload-submit');
    
    // Calculate dimensions (compress for mobile)
    const maxWidth = 800;
    const maxHeight = 600;
    let { width, height } = img;
    
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Add watermark
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    
    const watermarkText = 'FMD - Identificação Apenas';
    const textWidth = ctx.measureText(watermarkText).width;
    const x = (width - textWidth) / 2;
    const y = height - 30;
    
    ctx.strokeText(watermarkText, x, y);
    ctx.fillText(watermarkText, x, y);
    
    // Show preview
    if (previewContainer) {
        previewContainer.style.display = 'block';
    }
    
    // Convert to blob for upload
    canvas.toBlob((blob) => {
        processedImageBlob = blob;
        if (uploadSubmit) {
            uploadSubmit.disabled = false;
        }
    }, 'image/jpeg', 0.8); // 80% quality compression
}

async function handleUploadSubmit(event) {
    event.preventDefault();
    
    if (!processedImageBlob) {
        showToast('Por favor, selecione uma imagem primeiro', 'error');
        return;
    }
    
    const docType = document.getElementById('upload-doc-type').value;
    const docTitle = document.getElementById('upload-doc-title').value;
    const loadingDiv = document.getElementById('upload-loading');
    const uploadSubmit = document.getElementById('upload-submit');
    
    if (!docType || !docTitle) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    // Show loading
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (uploadSubmit) uploadSubmit.disabled = true;
    
    try {
        const userId = currentUser.id;
        const fileName = `${userId}/${Date.now()}_${docType.replace(' ', '_')}.jpg`;
        
        let fileUrl = '';
        
        // Try to upload to Supabase Storage
        if (window.supabase && window.supabase.storage) {
            try {
                const { data, error } = await window.supabase.storage
                    .from('documents')
                    .upload(fileName, processedImageBlob, { upsert: false });
                
                if (error) {
                    console.error('Storage upload error:', error);
                    if (error.message.includes('Bucket not found')) {
                        showToast('Storage bucket not configured. Please create a "documents" bucket in Supabase.', 'warning');
                    } else {
                        showToast('Storage upload failed: ' + error.message, 'warning');
                    }
                    // Continue without file URL
                } else {
                    // Get public URL
                    const { data: urlData } = window.supabase.storage
                        .from('documents')
                        .getPublicUrl(fileName);
                    
                    fileUrl = urlData.publicUrl;
                    console.log('File uploaded successfully:', fileUrl);
                }
            } catch (storageError) {
                console.error('Storage upload error:', storageError);
                showToast('Storage upload failed. Document will be saved without file.', 'warning');
                // Continue with local fallback
            }
        } else {
            console.log('Supabase storage not available, saving without file URL');
        }
        
        // Create document record
        const documentData = {
            userId: userId,
            title: docTitle,
            type: docType,
            status: 'normal',
            location: { address: 'Não especificado' },
            fileUrl: fileUrl
        };
        
        await window.documentsApi.create(documentData);
        
        // Update user profile document count
        if (window.profilesApi) {
            try {
                const profile = await window.profilesApi.get(userId);
                if (profile) {
                    await window.profilesApi.update(userId, {
                        ...profile,
                        document_count: (profile.document_count || 0) + 1
                    });
                }
            } catch (profileError) {
                console.log('Profile update skipped:', profileError);
            }
        }
        
        showToast('Documento enviado com sucesso!', 'success');
        
        // Award points for uploading document
        await trackDocumentUpload();
        closeUploadModal();
        
        // Reload profile if we're on profile page
        const profileSection = document.getElementById('perfil');
        if (profileSection && profileSection.classList.contains('active')) {
            renderProfilePage();
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Erro ao enviar documento: ' + error.message, 'error');
    } finally {
        // Hide loading
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (uploadSubmit) uploadSubmit.disabled = false;
    }
}

// Initialize upload modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeUploadModal, 100);
    setTimeout(initializeAvatarUpload, 100);
    
    // Initialize points popup
    const pointsDisplay = document.getElementById('points-display');
    const pointsPopup = document.getElementById('points-popup');
    const closePointsPopup = document.getElementById('close-points-popup');
    
    if (pointsDisplay && pointsPopup) {
        pointsDisplay.addEventListener('click', () => {
            pointsPopup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closePointsPopup) {
        closePointsPopup.addEventListener('click', () => {
            pointsPopup.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === pointsPopup) {
            pointsPopup.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Initialize profile logout button
    const profileLogoutBtn = document.getElementById('profile-logout-btn');
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', handleLogout);
    }
});

// Avatar Upload Functions
function initializeAvatarUpload() {
    const avatarUploadBtn = document.getElementById('avatar-upload-btn');
    if (avatarUploadBtn) {
        avatarUploadBtn.addEventListener('click', openAvatarUpload);
    }
}

function openAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleAvatarUpload(file);
        }
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

async function handleAvatarUpload(file) {
    // Validate file
    if (!file || !file.type) {
        showToast('Arquivo inválido. Por favor, selecione um arquivo de imagem.', 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione apenas arquivos de imagem (JPEG, PNG, etc.)', 'error');
        return;
    }
    
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        showToast(`Arquivo muito grande. Tamanho máximo permitido: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`, 'error');
        return;
    }
    
    try {
        showToast('Processando imagem...', 'info');
        
        // Get current user with error handling
        let user;
        try {
            const { data: { user: authUser }, error: userError } = await window.supabase.auth.getUser();
            if (userError) throw userError;
            if (!authUser) throw new Error('Usuário não autenticado');
            user = authUser;
        } catch (authError) {
            console.error('Erro de autenticação:', authError);
            showToast('Sessão expirada. Por favor, faça login novamente.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Process image to create avatar with error handling
        let processedBlob;
        try {
            processedBlob = await processAvatarImage(file);
        } catch (processError) {
            console.error('Erro ao processar imagem:', processError);
            showToast('Erro ao processar a imagem. Tente com outra foto.', 'error');
            return;
        }

        // Generate a simple filename with user ID and timestamp
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = `${user.id}_${timestamp}.${fileExt}`;  // Simple filename with user ID and timestamp
        
        try {
            showToast('Enviando foto do perfil...', 'info');
            
            // First, try to find and delete existing avatars for this user
            try {
                const { data: existingFiles, error: listError } = await window.supabase.storage
                    .from('avatars')
                    .list('', { search: `${user.id}_` });
                    
                if (!listError && Array.isArray(existingFiles) && existingFiles.length > 0) {
                    const filesToDelete = existingFiles.map(f => f.name);
                    const { error: deleteError } = await window.supabase.storage
                        .from('avatars')
                        .remove(filesToDelete);
                        
                    if (deleteError) {
                        console.warn('Aviso: Não foi possível remover avatares antigos:', deleteError);
                    }
                }
            } catch (cleanupError) {
                console.warn('Aviso ao limpar avatares antigos:', cleanupError);
                // Continue with upload even if cleanup fails
            }
            
            // First, try to delete any existing avatars for this user
            try {
                const { data: existingFiles, error: listError } = await window.supabase.storage
                    .from('avatars')
                    .list('', { search: `${user.id}_` });
                    
                if (!listError && Array.isArray(existingFiles) && existingFiles.length > 0) {
                    const filesToDelete = existingFiles.map(f => f.name);
                    await window.supabase.storage
                        .from('avatars')
                        .remove(filesToDelete);
                }
            } catch (cleanupError) {
                console.warn('Warning cleaning up old avatars:', cleanupError);
                // Continue with upload even if cleanup fails
            }
            
            // Upload new avatar
            const { error: uploadError } = await window.supabase.storage
                .from('avatars')
                .upload(fileName, processedBlob, {
                    contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (uploadError) throw uploadError;
            
            // Get public URL with cache busting
            const { data: { publicUrl } } = window.supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
                
            const avatarUrl = `${publicUrl}?t=${timestamp}`;
            
            // Update user profile with new avatar URL
            const { error: updateError } = await window.supabase
                .from('user_profiles')
                .update({ 
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
                
            if (updateError) throw updateError;
            
            // Update the avatar image in the UI
            const avatarImg = document.getElementById('profile-avatar');
            const avatarPreview = document.getElementById('avatar-preview');
            const elementsToUpdate = [avatarImg, avatarPreview].filter(el => el);
            
            elementsToUpdate.forEach(el => {
                el.src = avatarUrl;
                el.onload = () => URL.revokeObjectURL(avatarUrl);
            });
            
            // Close the modal if open
            const avatarModal = document.getElementById('avatar-upload-modal');
            if (avatarModal) {
                avatarModal.style.display = 'none';
            }
            
            showToast('Foto de perfil atualizada com sucesso!', 'success');
            
            // Track profile update for points
            await trackProfileUpdate();
            
            // Award points for updating profile
            try {
                await awardPoints('profile_updated', 10);
            } catch (pointsError) {
                console.warn('Não foi possível adicionar pontos:', pointsError);
                // Don't show error to user for points failure
            }
            
        } catch (error) {
            console.error('Erro no upload do avatar:', error);
            let errorMessage = 'Erro ao atualizar a foto do perfil';
            
            // More specific error messages based on the error
            if (error.message && error.message.includes('new row violates row-level security policy')) {
                errorMessage = 'Permissão negada. Verifique as configurações de segurança.';
            } else if (error.message && error.message.includes('not found')) {
                errorMessage = 'Pasta de destino não encontrada. Contate o suporte.';
            } else if (error.message && error.message.includes('file size limit exceeded')) {
                errorMessage = 'Arquivo muito grande. Tente uma imagem menor.';
            }
            
            showToast(`${errorMessage} (${error.message || 'Erro desconhecido'})`, 'error');
        }
        
    } catch (error) {
        console.error('Erro inesperado no upload do avatar:', error);
        showToast('Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.', 'error');
    }
}

function processAvatarImage(file) {
    return new Promise((resolve, reject) => {
        // Validate input
        if (!file || !(file instanceof Blob)) {
            return reject(new Error('Arquivo inválido'));
        }
        
        const reader = new FileReader();
        
        reader.onerror = () => {
            reject(new Error('Erro ao ler o arquivo'));
        };
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onerror = () => {
                reject(new Error('Erro ao carregar a imagem'));
            };
            
            img.onload = function() {
                try {
                    // Create canvas with optimal size (400x400 for better quality)
                    const targetSize = 400;
                    const canvas = document.createElement('canvas');
                    canvas.width = targetSize;
                    canvas.height = targetSize;
                    
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('Não foi possível obter o contexto 2D');
                    }
                    
                    // Calculate dimensions to maintain aspect ratio and center
                    const sourceAspect = img.width / img.height;
                    const targetAspect = 1; // Square
                    let drawWidth = targetSize;
                    let drawHeight = targetSize;
                    let offsetX = 0;
                    let offsetY = 0;
                    
                    if (sourceAspect > targetAspect) {
                        // Source is wider than target
                        drawHeight = targetSize;
                        drawWidth = targetSize * sourceAspect;
                        offsetX = (drawWidth - targetSize) / -2;
                    } else {
                        // Source is taller than target or square
                        drawWidth = targetSize;
                        drawHeight = targetSize / sourceAspect;
                        offsetY = (drawHeight - targetSize) / -2;
                    }
                    
                    // Draw image with high quality settings
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    
                    // Convert to blob with quality based on file size
                    let quality = 0.8; // Default quality
                    if (file.size > 1024 * 1024) { // If file > 1MB
                        quality = 0.7;
                    } else if (file.size > 500 * 1024) { // If file > 500KB
                        quality = 0.8;
                    }
                    
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Falha ao processar a imagem'));
                                return;
                            }
                            
                            // If the resulting blob is still too large, reduce quality further
                            if (blob.size > 500 * 1024) { // 500KB
                                canvas.toBlob(
                                    (smallerBlob) => resolve(smallerBlob || blob),
                                    'image/jpeg',
                                    0.6
                                );
                            } else {
                                resolve(blob);
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                    
                } catch (error) {
                    console.error('Erro no processamento da imagem:', error);
                    reject(new Error('Erro ao processar a imagem'));
                }
            };
            
            // Start loading the image
            img.src = e.target.result;
        };
        
        // Start reading the file
        reader.readAsDataURL(file);
    });
}

// Points System
async function awardPoints(activity, points) {
    try {
        if (!currentUser?.id) return;
        
        // Get current user profile
        const userProfile = await window.profilesApi.get(currentUser.id);
        if (!userProfile) return;
        
        // Calculate new points total
        const currentPoints = userProfile.points || 0;
        const newPoints = currentPoints + points;
        
        // Update profile with new points
        await window.profilesApi.update(currentUser.id, {
            points: newPoints
        });
        
        // Show points notification
        showToast(`+${points} pontos! (${activity})`, 'success');
        
        // Update points display if on profile page
        updatePointsDisplay(newPoints);
        
        console.log(`Awarded ${points} points for ${activity}. Total: ${newPoints}`);
        
    } catch (error) {
        console.error('Error awarding points:', error);
    }
}

function updatePointsDisplay(points) {
    const pointsElement = document.getElementById('profile-points');
    if (pointsElement) {
        pointsElement.textContent = points.toString();
    }
    
    // Update rank badge
    updateRankDisplay(points);
}

function updateRankDisplay(points) {
    const rankElement = document.getElementById('profile-rank');
    if (!rankElement) return;
    
    let rank = 'Novato';
    let rankClass = 'rank-badge';
    
    if (points >= 1000) {
        rank = 'Lenda';
        rankClass = 'rank-badge rank-legend';
    } else if (points >= 500) {
        rank = 'Expert';
        rankClass = 'rank-badge rank-expert';
    } else if (points >= 200) {
        rank = 'Avançado';
        rankClass = 'rank-badge rank-advanced';
    } else if (points >= 100) {
        rank = 'Intermediário';
        rankClass = 'rank-badge rank-intermediate';
    } else if (points >= 50) {
        rank = 'Iniciante';
        rankClass = 'rank-badge rank-beginner';
    }
    
    rankElement.textContent = rank;
    rankElement.className = rankClass;
}

// Activity tracking functions
async function trackDocumentUpload() {
    await awardPoints('document_uploaded', 20);
}

async function trackDocumentFound(documentId) {
    try {
        if (window.logActivity) {
            await window.logActivity('document_found', { documentId });
            
            // Update points display
            const pointsElement = document.getElementById('profile-points');
            if (pointsElement) {
                const currentPoints = parseInt(pointsElement.textContent) || 0;
                pointsElement.textContent = currentPoints + 50; // 50 points for finding a document
            }
            
            if (window.showToast) {
                window.showToast('Documento encontrado! +50 pontos ganhos!', 'success');
            }
        }
    } catch (error) {
        console.error('Error tracking document found:', error);
    }
}

async function trackDocumentLost(documentId) {
    try {
        if (window.logActivity) {
            await window.logActivity('document_lost', { documentId });
            
            // No points for losing a document, just track the activity
            if (window.showToast) {
                window.showToast('Documento marcado como perdido. Por favor, verifique sua área de documentos perdidos.', 'info');
            }
        }
    } catch (error) {
        console.error('Error tracking document lost:', error);
    }
}

async function trackProfileUpdate() {
    try {
        if (window.logActivity) {
            // Check if this is the first time the user is updating their profile
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) return;
            
            // Check if we've already awarded points for profile completion
            const profileCompletedKey = `profile_completed_${user.id}`;
            if (!localStorage.getItem(profileCompletedKey)) {
                // Log points for profile completion
                await window.logActivity('profile_completed');
                localStorage.setItem(profileCompletedKey, 'true');
                
                // Update the points display
                const pointsElement = document.getElementById('profile-points');
                if (pointsElement) {
                    const currentPoints = parseInt(pointsElement.textContent) || 0;
                    pointsElement.textContent = currentPoints + 50; // 50 points for profile completion
                }
                
                if (window.showToast) {
                    window.showToast('Perfil completo! +50 pontos ganhos!', 'success');
                }
            }
        }
    } catch (error) {
        console.error('Error tracking profile update:', error);
    }
}

async function trackHelpProvided(documentId, helpedUserId) {
    try {
        if (window.logActivity) {
            await window.logActivity('help_provided', { 
                documentId,
                helpedUserId,
                points: 200 // 200 points for helping return a document
            });
            
            // Update points display
            const pointsElement = document.getElementById('profile-points');
            if (pointsElement) {
                const currentPoints = parseInt(pointsElement.textContent) || 0;
                pointsElement.textContent = currentPoints + 200;
            }
            
            // Update helped count
            const statHelped = document.getElementById('stat-helped');
            if (statHelped) {
                const currentHelped = parseInt(statHelped.textContent) || 0;
                statHelped.textContent = currentHelped + 1;
            }
            
            if (window.showToast) {
                window.showToast('Obrigado por ajudar! +200 pontos ganhos!', 'success');
            }
        }
    } catch (error) {
        console.error('Error tracking help provided:', error);
    }
}

// Update UI based on authentication state
function updateUIForAuthState() {
    const authElements = document.querySelectorAll('.auth-only');
    const unauthElements = document.querySelectorAll('.unauth-only');
    const userGreeting = document.getElementById('user-greeting');
    const userAvatar = document.getElementById('user-avatar');
    
    if (isLoggedIn && currentUser) {
        // User is logged in
        authElements.forEach(el => el.style.display = '');
        unauthElements.forEach(el => el.style.display = 'none');
        
        if (userGreeting) {
            userGreeting.textContent = `Olá, ${currentUser.name}`;
        }
        
        if (userAvatar) {
            userAvatar.src = currentUser.avatar;
            userAvatar.alt = currentUser.name;
        }
    } else {
        // User is not logged in
        authElements.forEach(el => el.style.display = 'none');
        unauthElements.forEach(el => el.style.display = '');
    }
}

// Make functions globally available
window.showSection = showSection;
window.showToast = showToast;
window.renderProfilePage = renderProfilePage;
window.updateUIForAuthState = updateUIForAuthState;
window.handleLogout = handleLogout;
window.awardPoints = awardPoints;