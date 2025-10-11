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
        
        // Initialize ranking modal
        if (typeof initializeRankingModal === 'function') {
            initializeRankingModal();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        // We can still try to run the app, but some features might be broken.
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
        // Load user documents
        loadDocuments();
        
        // Update profile info
        updateProfileInfo();
        
        // Update document count
        updateDocumentCount();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Fetch user profile to get the full name
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
            
        // Update welcome message with user's name
        const welcomeElement = document.querySelector('[data-i18n="welcome.title"]');
        if (welcomeElement) {
            const userName = profile?.full_name || user.email?.split('@')[0] || 'Usuário';
            welcomeElement.textContent = `Bem-vindo, ${userName}!`;
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
        
        // Fallback to show at least the email if available
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const welcomeElement = document.querySelector('[data-i18n="welcome.title"]');
                if (welcomeElement) {
                    const userName = user.email?.split('@')[0] || 'Usuário';
                    welcomeElement.textContent = `Bem-vindo, ${userName}!`;
                }
            }
        } catch (e) {
            console.error('Error in fallback user name display:', e);
        }
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
    
    const isOwnDocument = doc.user_id === (window.currentUser?.id || null);
    
    div.innerHTML = `
        <div class="card-body">
            <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 0.5rem;">
                <div class="document-icon" style="background: ${statusClass === 'danger' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)'}; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="fas ${statusClass === 'danger' ? 'fa-exclamation-triangle' : 'fa-check-circle'}" style="font-size: 1.2rem; color: ${statusClass === 'danger' ? 'var(--danger-color)' : 'var(--success-color)'};"></i>
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 1.1rem;">${doc.title}</h4>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <span class="status-badge" style="background: ${statusClass === 'danger' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)'}; color: ${statusClass === 'danger' ? 'var(--danger-color)' : 'var(--success-color)'}; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 500;">
                            ${doc.status === 'lost' ? 'Perdido' : 'Encontrado'}
                        </span>
                        <span style="font-size: 0.8rem; color: var(--text-light);">${doc.type}</span>
                    </div>
                </div>
            </div>
            
            <div class="card-actions" style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                <button class="btn small ${statusClass} view-doc" data-id="${doc.id}" style="flex: 1;">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
                
                ${!isOwnDocument ? `
                <button class="btn small primary contact-reporter-btn" data-doc-id="${doc.id}" data-reporter-id="${doc.user_id}" style="flex: 1;">
                    <i class="fas fa-comments"></i> Chat
                </button>
                ` : ''}
                
                <button class="btn small danger delete-doc" data-id="${doc.id}" style="width: auto; padding: 0.4rem 0.8rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    
    // Add event listeners
    const viewBtn = div.querySelector('.view-doc');
    const deleteBtn = div.querySelector('.delete-doc');
    const contactBtn = div.querySelector('.contact-reporter-btn');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', () => viewDocument(doc));
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteDocument(doc.id));
    }
    
    if (contactBtn) {
        contactBtn.addEventListener('click', (e) => {
            console.log('Contact button clicked');
            const docId = e.target.dataset.docId;
            const reporterId = e.target.dataset.reporterId;
            
            console.log('Document ID:', docId, 'Reporter ID:', reporterId);
            
            if (!docId || !reporterId) {
                console.error('Missing document or reporter ID for chat.');
                return;
            }
            
            console.log('Checking chat module...');
            console.log('window.chat:', window.chat);
            console.log('window.chat.openChatModal:', window.chat?.openChatModal);
            
            if (window.chat && typeof window.chat.openChatModal === 'function') {
                console.log('Opening chat modal...');
                const docTitle = e.target.closest('.document-card').querySelector('h4').textContent;
                console.log('Document title:', docTitle);
                window.chat.openChatModal(docId, docTitle, reporterId);
                console.log('Chat modal should be open now');
            } else {
                console.error('Chat module not available or openChatModal is not a function');
                showToast('A funcionalidade de chat não está disponível.', 'error');
            }
        });
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
        actionsHtml = `
            <button class="btn small secondary view-doc" data-id="${doc.id}">
                <i class="fas fa-eye"></i> Ver Detalhes
            </button>`;
            actionsHtml = `
            <button class="btn small primary contact-reporter-btn" data-doc-id="${doc.id}" data-reporter-id="${doc.user_id}">
                <i class="fas fa-comment-dots"></i> Contactar
            </button>`;
    } else {
        actionsHtml = `
            <button class="btn small primary contact-reporter-btn" data-doc-id="${doc.id}" data-reporter-id="${doc.user_id}">
                <i class="fas fa-comment-dots"></i> Contactar
            </button>`;
    }

    div.innerHTML = `
        <div class="document-card">
            <div class="card-body">
                <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem;">
                    <div class="document-icon" style="background: ${doc.status === 'lost' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)'}; width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas ${doc.status === 'lost' ? 'fa-exclamation-circle' : 'fa-check-circle'}" style="font-size: 1.5rem; color: ${doc.status === 'lost' ? 'var(--danger-color)' : 'var(--success-color)'};"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4>${doc.title}</h4>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <span class="status-${doc.status}" style="font-weight: 500; font-size: 0.8rem; background: ${doc.status === 'lost' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)'}; color: ${doc.status === 'lost' ? 'var(--danger-color)' : 'var(--success-color)'}; padding: 0.2rem 0.5rem; border-radius: 12px;">
                                ${doc.status === 'lost' ? 'Perdido' : 'Encontrado'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map-marker-alt" style="color: var(--text-light); font-size: 0.9rem; width: 16px; text-align: center;"></i>
                        <span style="font-size: 0.85rem; color: var(--text-light);">${location}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-user" style="color: var(--text-light); font-size: 0.9rem; width: 16px; text-align: center;"></i>
                        <span style="font-size: 0.85rem; color: var(--text-light);">Reportado por: <strong>${reporterName}</strong></span>
                    </div>
                    ${doc.created_at ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="far fa-clock" style="color: var(--text-light); font-size: 0.9rem; width: 16px; text-align: center;"></i>
                        <span style="font-size: 0.8rem; color: var(--text-light);">${new Date(doc.created_at).toLocaleDateString('pt-PT')}</span>
                    </div>` : ''}
                </div>
                
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
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return;
        
        // Set user info
        if (profileName) profileName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
        if (profileEmail) profileEmail.textContent = user.email || '';
        
        // Fetch user's documents count
        const { count: docCount, error: docError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
            
        if (!docError && statDocuments) {
            statDocuments.textContent = docCount || '0';
        }
        
        // Fetch user's points (assuming you have a user_profiles table with points)
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('points')
            .eq('id', user.id)
            .single();
            
        if (!profileError && statPoints) {
            statPoints.textContent = profile?.points || '0';
        }
        
        // Fetch count of people helped (documents found by this user)
        const { count: helpedCount, error: helpedError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('found_by', user.id)
            .not('found_by', 'is', null);
            
        if (!helpedError && statHelped) {
            statHelped.textContent = helpedCount || '0';
        }
        
        // Log any errors that occurred
        if (docError) console.error('Error fetching document count:', docError);
        if (profileError) console.error('Error fetching user points:', profileError);
        if (helpedError) console.error('Error fetching helped count:', helpedError);
        
    } catch (error) {
        console.error('Error in updateProfileInfo:', error);
        // Fallback to default values if there's an error
        if (profileName) profileName.textContent = 'Usuário';
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
    showToast(`Visualizando: ${doc.title}`, 'info');
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

// Ranking Modal Functions
function initializeRankingModal() {
    const rankingModal = document.getElementById('ranking-modal');
    const closeRankingModal = document.getElementById('close-ranking-modal');
    const closeRankingBtn = document.getElementById('close-ranking-btn');
    const viewRankingBtn = document.getElementById('view-ranking-btn');
    const rankBadge = document.getElementById('profile-rank');

    // Open modal when clicking the ranking button or badge
    if (viewRankingBtn) {
        viewRankingBtn.addEventListener('click', openRankingModal);
    }
    
    if (rankBadge) {
        rankBadge.addEventListener('click', openRankingModal);
    }

    // Close modal when clicking the close button
    if (closeRankingModal) {
        closeRankingModal.addEventListener('click', closeRankingModalFunc);
    }
    
    if (closeRankingBtn) {
        closeRankingBtn.addEventListener('click', closeRankingModalFunc);
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === rankingModal) {
            closeRankingModalFunc();
        }
    });

    // Load ranking data when modal is opened
    rankingModal.addEventListener('show', loadRankingData);
}

function openRankingModal() {
    const rankingModal = document.getElementById('ranking-modal');
    if (rankingModal) {
        rankingModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        rankingModal.dispatchEvent(new Event('show'));
    }
}

function closeRankingModalFunc() {
    const rankingModal = document.getElementById('ranking-modal');
    if (rankingModal) {
        rankingModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

async function loadRankingData() {
    try {
        // Get current user points
        const pointsElement = document.getElementById('profile-points');
        const currentPoints = pointsElement ? parseInt(pointsElement.textContent) || 0 : 0;

        // Define ranking levels
        const ranks = [
            { name: 'Novato', minPoints: 0, color: '#6c757d' },
            { name: 'Iniciante', minPoints: 100, color: '#17a2b8' },
            { name: 'Intermediário', minPoints: 500, color: '#28a745' },
            { name: 'Avançado', minPoints: 1500, color: '#007bff' },
            { name: 'Especialista', minPoints: 3000, color: '#6f42c1' },
            { name: 'Mestre', minPoints: 5000, color: '#fd7e14' },
            { name: 'Lendário', minPoints: 10000, color: '#dc3545' },
        ];

        // Find current and next rank
        let currentRank, nextRank;
        for (let i = 0; i < ranks.length; i++) {
            if (i === ranks.length - 1 || (currentPoints >= ranks[i].minPoints && 
                (i === ranks.length - 1 || currentPoints < ranks[i + 1].minPoints))) {
                currentRank = ranks[i];
                nextRank = i < ranks.length - 1 ? ranks[i + 1] : null;
                break;
            }
        }

        // Update UI with current rank
        const currentRankBadge = document.getElementById('current-rank-badge');
        if (currentRankBadge) {
            currentRankBadge.textContent = currentRank.name;
            currentRankBadge.style.backgroundColor = `${currentRank.color}20`;
            currentRankBadge.style.color = currentRank.color;
            currentRankBadge.style.border = `1px solid ${currentRank.color}`;
        }

        // Update progress bar and next rank info
        const progressBar = document.getElementById('ranking-progress');
        const currentPointsEl = document.getElementById('current-points');
        const nextRankPointsEl = document.getElementById('next-rank-points');
        const nextRankNameEl = document.getElementById('next-rank-name');

        if (nextRank) {
            const progress = ((currentPoints - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100;
            if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            if (currentPointsEl) currentPointsEl.textContent = currentPoints;
            if (nextRankPointsEl) nextRankPointsEl.textContent = nextRank.minPoints;
            if (nextRankNameEl) nextRankNameEl.textContent = nextRank.name;
        } else {
            if (progressBar) progressBar.style.width = '100%';
            if (currentPointsEl) currentPointsEl.textContent = currentPoints;
            if (nextRankPointsEl) nextRankPointsEl.textContent = '';
            if (nextRankNameEl) nextRankNameEl.textContent = 'Máximo alcançado!';
        }

        // Populate rank list
        const rankList = document.getElementById('rank-list');
        if (rankList) {
            rankList.innerHTML = ranks.map(rank => {
                const isCurrent = rank.name === currentRank.name;
                const isUnlocked = rank.minPoints <= currentPoints;
                
                return `
                    <li class="rank-item ${isCurrent ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}">
                        <div class="rank-icon">
                            ${isUnlocked ? '<i class="fas fa-unlock"></i>' : '<i class="fas fa-lock"></i>'}
                        </div>
                        <div class="rank-info">
                            <span class="rank-name">${rank.name}</span>
                            <span class="rank-points">${rank.minPoints} pontos</span>
                        </div>
                        ${isCurrent ? '<span class="current-badge">Atual</span>' : ''}
                    </li>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading ranking data:', error);
        showToast('Erro ao carregar informações de ranking', 'error');
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
            
            showToast('Foto do perfil atualizada com sucesso!', 'success');
            
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

async function trackDocumentFound() {
    await awardPoints('document_found', 50);
}

async function trackDocumentLost() {
    await awardPoints('document_lost', 10);
}

async function trackProfileUpdate() {
    await awardPoints('profile_updated', 10);
}

async function trackHelpProvided() {
    await awardPoints('help_provided', 30);
}

// Make functions globally available
window.showSection = showSection;
window.showToast = showToast;
window.renderProfilePage = renderProfilePage;
window.handleLogout = handleLogout;
window.awardPoints = awardPoints;