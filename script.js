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
    initializeEnhancedFeatures();
});

// Initialize enhanced features
function initializeEnhancedFeatures() {
    // Initialize tutorial system
    if (window.tutorialManager) {
        setupTutorialTriggers();
    }
    
    // Initialize search functionality
    if (window.searchManager) {
        setupSearchFunctionality();
    }
    
    // Initialize mobile features
    if (window.mobileManager) {
        setupMobileFeatures();
    }
    
    // Setup error handling
    if (window.ErrorHandler) {
        setupGlobalErrorHandling();
    }
    
    // Setup loading states
    if (window.loadingManager) {
        setupLoadingStates();
    }

    // Listen for appInitialized event to start tutorial
    window.addEventListener('appInitialized', () => {
        if (window.tutorialManager && !window.tutorialManager.isTutorialCompleted('main')) {
            setTimeout(() => {
                window.tutorialManager.startTutorial('main');
            }, 1500);
        }
    });
}

// Setup tutorial triggers
function setupTutorialTriggers() {
    const startTutorialBtn = document.getElementById('start-tutorial');
    if (startTutorialBtn) {
        startTutorialBtn.addEventListener('click', () => {
            // Force restart tutorial when button is clicked
            window.tutorialManager.startTutorial('main', true);
        });
    }

    // Initialize contextual help
    if (window.tutorialManager) {
        // Add help icons to important elements
        const helpTargets = [
            { selector: '#add-document', message: 'Adicione um novo documento aqui' },
            { selector: '[data-section="feed"]', message: 'Veja documentos perdidos/encontrados' },
            { selector: '#search-input', message: 'Pesquise documentos por título ou número' },
            { selector: '[data-section="perfil"]', message: 'Gerencie seu perfil e documentos' }
        ];

        helpTargets.forEach(({ selector, message }) => {
            const element = document.querySelector(selector);
            if (element) {
                const helpIcon = document.createElement('i');
                helpIcon.className = 'fas fa-question-circle help-icon';
                helpIcon.title = message;
                element.appendChild(helpIcon);

                helpIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.tutorialManager.showContextualHelp(element, message);
                });
            }
        });
    }
}

// Setup search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (searchInput && suggestionsContainer) {
        // Debounced search
        const debouncedSearch = window.performanceManager.debounce(async (query) => {
            if (query.length >= 2) {
                const suggestions = window.searchManager.getSearchSuggestions(query);
                showSearchSuggestions(suggestions);
            } else {
                hideSearchSuggestions();
            }
        }, 300, 'search-suggestions');
        
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
        
        // Handle search submission
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
                hideSearchSuggestions();
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                hideSearchSuggestions();
            }
        });
    }
    
    // Setup filter changes
    const filterElements = document.querySelectorAll('#feed-filter-type, #feed-filter-status, #feed-filter-location, #feed-filter-distance');
    filterElements.forEach(element => {
        element.addEventListener('change', () => {
            performSearch();
        });
    });
}

// Show search suggestions
function showSearchSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer || suggestions.length === 0) return;
    
    suggestionsContainer.innerHTML = suggestions.map(suggestion => 
        `<div class="search-suggestion" data-suggestion="${suggestion}">${suggestion}</div>`
    ).join('');
    
    suggestionsContainer.style.display = 'block';
    
    // Add click handlers
    suggestionsContainer.querySelectorAll('.search-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
            const searchInput = document.getElementById('search-input');
            searchInput.value = suggestion.dataset.suggestion;
            performSearch(suggestion.dataset.suggestion);
            hideSearchSuggestions();
        });
    });
}

// Hide search suggestions
function hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

// Perform search
async function performSearch(query = null) {
    const searchInput = document.getElementById('search-input');
    const searchQuery = query || searchInput?.value || '';
    
    const filters = {
        type: document.getElementById('feed-filter-type')?.value || '',
        status: document.getElementById('feed-filter-status')?.value || '',
        location: document.getElementById('feed-filter-location')?.value || '',
        distance: document.getElementById('feed-filter-distance')?.value || ''
    };
    
    // Show loading state
    if (window.loadingManager) {
        window.loadingManager.showLoading('feed-content', 'skeleton', { template: 'feed' });
    }
    
    try {
        const results = await window.searchManager.search(searchQuery, filters);
        displaySearchResults(results);
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'search_execution');
        }
    }
}

// Display search results
function displaySearchResults(results) {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return;
    
    if (results.results.length === 0) {
        feedContent.innerHTML = '<p class="text-center muted">Nenhum documento encontrado com os critérios de pesquisa.</p>';
        return;
    }
    
    feedContent.innerHTML = '';
    results.results.forEach(doc => {
        const card = createFeedCard(doc);
        feedContent.appendChild(card);
    });
}

// Setup mobile features
function setupMobileFeatures() {
    // Add mobile-specific event listeners
    if (window.mobileManager && window.mobileManager.isMobile) {
        // Setup swipe navigation
        setupSwipeNavigation();
        
        // Setup mobile-specific UI adjustments
        setupMobileUI();
    }
}

// Setup swipe navigation
function setupSwipeNavigation() {
    // This is handled by the MobileManager class
    console.log('Swipe navigation enabled for mobile devices');
}

// Setup mobile UI
function setupMobileUI() {
    // Add mobile-specific classes and behaviors
    document.body.classList.add('mobile-enhanced');
}

// Setup global error handling
function setupGlobalErrorHandling() {
    // Wrap existing functions with error handling
    const originalLoadDocuments = window.loadDocuments;
    if (originalLoadDocuments) {
        window.loadDocuments = async function() {
            try {
                await originalLoadDocuments();
            } catch (error) {
                window.ErrorHandler.handle(error, 'load_documents');
            }
        };
    }
    
    const originalLoadFeed = window.loadFeed;
    if (originalLoadFeed) {
        window.loadFeed = async function() {
            try {
                await originalLoadFeed();
            } catch (error) {
                window.ErrorHandler.handle(error, 'load_feed');
            }
        };
    }
}

// Setup loading states
function setupLoadingStates() {
    // Add loading states to existing functions
    const originalShowSection = window.showSection;
    if (originalShowSection) {
        window.showSection = function(sectionId) {
            // Show loading for section-specific content
            if (window.loadingManager) {
                const contentElement = document.getElementById(sectionId);
                if (contentElement) {
                    window.loadingManager.showLoading(sectionId, 'skeleton');
                }
            }
            
            originalShowSection(sectionId);
            
            // Hide loading after a short delay
            setTimeout(() => {
                if (window.loadingManager) {
                    window.loadingManager.hideLoading(sectionId);
                }
            }, 500);
        };
    }
}

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
                window.currentUser = user; // Make globally available
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
    
    // Check if tutorial should start (after successful auth and loading)
    if (window.tutorialManager) {
        const tutorialCompleted = window.tutorialManager.isTutorialCompleted('main');
        if (!tutorialCompleted) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
                window.tutorialManager.startTutorial('main');
            }, 1500);
        }
    }
    
    // Load initial section
    showSection('documentos');
    
    // Disparar evento para iniciar o tutorial (onboarding.js irá escutar isto)
    try {
        window.dispatchEvent(new Event('appInitialized'));
    } catch (e) {
        console.warn('Could not dispatch appInitialized event:', e);
    }
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
    // Set <html lang> for a11y and SEO
    try { document.documentElement.setAttribute('lang', currentLanguage); } catch (e) {}
    applyTranslations(savedLanguage);
    // Start translation observer for dynamically injected content
    setupTranslationObserver();
}

function applyTranslations(lang) {
    if (!window.translations || !window.translations[lang]) {
        console.warn(`Translations for language '${lang}' not found.`);
        return;
    }

    const dict = window.translations[lang];
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const expr = el.dataset.i18n;
        if (!expr) return;
        // Support syntax: "key" or "[attr]key" or multiple mappings split by ';'
        const parts = expr.split(';').map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return;
        parts.forEach(p => {
            const match = p.match(/^\[(.+?)\](.+)$/);
            if (match) {
                const attr = match[1];
                const key = match[2];
                const val = dict[key];
                if (val) el.setAttribute(attr, val);
                else console.warn(`Translation key '${key}' not found for '${lang}'.`);
            } else {
                const key = p;
                const val = dict[key];
                if (val !== undefined) el.textContent = val;
                else console.warn(`Translation key '${key}' not found for '${lang}'.`);
            }
        });
    });
}

// Observe DOM changes to auto-translate newly added nodes with data-i18n
let translationObserver = null;
let translationObserverTimer = null;
function setupTranslationObserver() {
    if (translationObserver) return;
    try {
        translationObserver = new MutationObserver(() => {
            // Debounce to avoid excessive calls during large DOM updates
            if (translationObserverTimer) clearTimeout(translationObserverTimer);
            translationObserverTimer = setTimeout(() => {
                applyTranslations(currentLanguage);
            }, 50);
        });
        translationObserver.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
        console.warn('Translation observer not initialized:', e);
    }
}

function loadUserData() {
    if (!currentUser) return;
    
    // Update welcome message with user's name
    const welcomeTitles = document.querySelectorAll('.welcome-title, .welcome-tips h2, .welcome-message');
    if (welcomeTitles.length > 0) {
        // Get user's display name from their profile or email
        const userDisplayName = currentUser.user_metadata?.full_name || 
                              currentUser.identities?.[0]?.identity_data?.name ||
                              currentUser.email?.split('@')[0] || 
                              'Usuário';
        
        // Update all welcome messages on the page
        welcomeTitles.forEach(title => {
            title.textContent = `Bem-vindo, ${userDisplayName}!`;
        });
        
        // Also update any elements that might be using the username directly
        const usernameDisplays = document.querySelectorAll('[data-username]');
        usernameDisplays.forEach(el => {
            el.textContent = userDisplayName;
        });
    }
    
    // Load user documents
    loadDocuments();
    
    // Load user profile
    loadProfile();
}

// Add this function to update the welcome message when the user's profile is loaded
function updateWelcomeMessage() {
    if (!currentUser) return;
    
    const userName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário';
    
    // Update welcome title in the profile section
    const welcomeTitle = document.querySelector('.welcome-title');
    if (welcomeTitle) {
        welcomeTitle.textContent = `Bem-vindo, ${userName}!`;
    }
    
    // Update welcome message in the tips section
    const welcomeTipsTitle = document.querySelector('.welcome-tips h2');
    if (welcomeTipsTitle) {
        welcomeTipsTitle.textContent = `Bem-vindo, ${userName}!`;
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

    // Autofocus chat input when chat modal opens
    const chatModal = document.getElementById('chat-modal');
    if (chatModal) {
        const observer = new MutationObserver(() => {
            if (getComputedStyle(chatModal).display !== 'none') {
                setTimeout(() => document.getElementById('chat-input-field')?.focus(), 50);
            }
        });
        observer.observe(chatModal, { attributes: true, attributeFilter: ['style', 'class'] });
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

    // Re-apply translations after section switch (new content may appear)
    applyTranslations(currentLanguage);
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
    // Ensure any newly injected elements get translated
    applyTranslations(currentLanguage);
}

function createDocumentCard(doc) {
    const div = document.createElement('div');
    div.className = 'document-card';
    div.dataset.id = doc.id;
    
    const statusClass = doc.status === 'lost' ? 'danger' : doc.status === 'found' ? 'success' : 'primary';
    
    div.innerHTML = `
        <div class="card-body">
            <h4>${doc.title}</h4>
            <p class="muted">Tipo: ${doc.type} • <span data-i18n="documents.status_label">Status</span>: <span class="status-${doc.status}" data-i18n="status.${doc.status}">${doc.status}</span></p>
            <div class="card-actions">
                <button class="btn small ${statusClass} view-doc" data-id="${doc.id}" data-i18n="actions.view">Ver</button>
                <button class="btn danger small delete-doc" data-id="${doc.id}" data-i18n="actions.delete">Excluir</button>
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

        // Apply filters
        const filteredDocuments = applyFeedFilters(documents);

        if (filteredDocuments.length === 0) {
            feedContent.innerHTML = '<p class="text-center muted">Nenhum documento encontrado com os filtros aplicados.</p>';
            return;
        }

        // Get all unique user IDs from the filtered documents
        const userIds = [...new Set(filteredDocuments.map(doc => doc.user_id))];
        
        // Fetch the profiles for these users
        const profiles = await window.profilesApi.getProfilesByIds(userIds);
        const profilesMap = new Map(profiles.map(p => [p.id, p]));

        feedContent.innerHTML = ''; // Clear loading state
        filteredDocuments.forEach(doc => {
            const reporterProfile = profilesMap.get(doc.user_id);
            const card = createFeedCard(doc, reporterProfile);
            feedContent.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading feed:', error);
        feedContent.innerHTML = '<p class="text-center error">Não foi possível carregar o feed. Tente novamente mais tarde.</p>';
    }
    // Translate dynamic feed cards
    applyTranslations(currentLanguage);
}

function applyFeedFilters(documents) {
    const typeFilter = document.getElementById('feed-filter-type')?.value || '';
    const statusFilter = document.getElementById('feed-filter-status')?.value || '';

    return documents.filter(doc => {
        const typeMatch = !typeFilter || doc.type === typeFilter;
        const statusMatch = !statusFilter || doc.status === statusFilter;
        return typeMatch && statusMatch;
    });
}

/**
 * Gets the number of people the user has helped by returning documents
 */
async function getHelpedCount(userId) {
    try {
        if (!window.documentsApi) return 0;
        
        // Get all documents found by this user
        const foundDocs = await window.documentsApi.getByFinder(userId);
        if (!foundDocs || foundDocs.length === 0) return 0;
        
        // Count how many have been returned to their owners
        let helpedCount = 0;
        for (const doc of foundDocs) {
            if (doc.status === 'returned' || doc.returned_to_owner) {
                helpedCount++;
            }
        }
        
        return helpedCount;
    } catch (error) {
        console.error('Error getting helped count:', error);
        return 0;
    }
}

/**
 * Calculates the total points for a user
 */
async function calculateUserPoints(userId) {
    try {
        if (!window.pointsApi) return 0;
        
        // Get all points transactions for the user
        const transactions = await window.pointsApi.getUserTransactions(userId);
        if (!transactions || transactions.length === 0) return 0;
        
        // Sum up all points (positive and negative)
        return transactions.reduce((total, txn) => total + txn.points, 0);
    } catch (error) {
        console.error('Error calculating user points:', error);
        return 0;
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
    const location = doc.location?.address || '';

    // Determine which buttons to show
    let actionsHtml = '';
    let ownershipIndicator = '';
    
    if (isOwnDocument) {
        actionsHtml = `<button class="btn small secondary view-doc" data-id="${doc.id}" data-i18n="actions.details">Ver Detalhes</button>`;
        ownershipIndicator = '<div class="ownership-badge my-document"><i class="fas fa-user"></i> <span data-i18n="feed.my_document">Meu Documento</span></div>';
    } else {
        actionsHtml = `<button class="btn small primary contact-reporter-btn" data-doc-id="${doc.id}" data-reporter-id="${doc.user_id}" data-i18n="actions.contact">Contactar</button>`;
        ownershipIndicator = `<div class="ownership-badge reported-document"><i class="fas fa-user-plus"></i> <span data-i18n="feed.reported_by">Reportado por</span>: ${reporterName}</div>`;
    }

    // Build document details
    let documentDetails = '';
    if (doc.document_number) {
        documentDetails += `<p class="muted"><span data-i18n="documents.document_number">Número</span>: ${doc.document_number}</p>`;
    }
    if (doc.type) {
        documentDetails += `<p class="muted"><span data-i18n="documents.type_label">Tipo</span>: ${doc.type}</p>`;
    }
    if (doc.description) {
        documentDetails += `<p class="muted"><span data-i18n="documents.description_optional">Descrição</span>: ${doc.description}</p>`;
    }

    // Build document image if available and public
    let documentImage = '';
    if (doc.file_url && doc.is_public) {
        documentImage = `
            <div class="document-image">
                <img src="${doc.file_url}" alt="${doc.title}" style="max-width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin: 0.5rem 0;">
            </div>
        `;
    }

    div.innerHTML = `
        <div class="document-card ${isOwnDocument ? 'my-document' : 'reported-document'}">
            <div class="card-body">
                ${ownershipIndicator}
                <h4>${doc.title}</h4>
                <p class="muted"><span data-i18n="feed.status">Status</span>: <span class="status-${doc.status}" data-i18n="status.${doc.status}">${doc.status}</span></p>
                <p class="muted"><span data-i18n="feed.location">Local</span>: ${location || '<span class="muted" data-i18n="feed.location">Local</span>'}</p>
                ${documentDetails}
                ${documentImage}
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

function updateProfileInfo() {
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const statDocuments = document.getElementById('stat-documents');
    const statPoints = document.getElementById('stat-points');
    const statHelped = document.getElementById('stat-helped');
    
    if (profileName) profileName.textContent = currentUser.name || 'Demo User';
    if (profileEmail) profileEmail.textContent = currentUser.email || 'demo@example.com';
    if (statDocuments) statDocuments.textContent = '1';
    if (statPoints) statPoints.textContent = '250';
    if (statHelped) statHelped.textContent = '3';
}

function updateDocumentCount(count = 0) {
    const documentCount = document.getElementById('document-count');
    if (documentCount) {
        documentCount.textContent = `${count} total`;
    }
}

async function handleLostForm(e) {
    e.preventDefault();
    
    const address = document.getElementById('lost-location').value.trim();
    const lat = parseFloat(document.getElementById('lost-lat')?.value || '');
    const lng = parseFloat(document.getElementById('lost-lng')?.value || '');
    const phone = document.getElementById('lost-contact')?.value || '';

    // Basic validation
    if (!address) {
        showToast('Indique o local onde perdeu o documento', 'warning');
        return;
    }
    if (phone && !/^[- +()0-9]{7,}$/.test(phone)) {
        showToast('Número de contacto inválido', 'warning');
        return;
    }

    const location = Number.isFinite(lat) && Number.isFinite(lng)
        ? { address, lat, lng }
        : { address };

    const data = {
        userId: currentUser.id,
        title: document.getElementById('lost-title').value,
        type: document.getElementById('lost-type').value,
        status: 'lost',
        location,
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
    
    const address = document.getElementById('found-location').value.trim();
    const lat = parseFloat(document.getElementById('found-lat')?.value || '');
    const lng = parseFloat(document.getElementById('found-lng')?.value || '');
    const phone = document.getElementById('found-contact')?.value || '';

    if (!address) {
        showToast('Indique o local onde encontrou o documento', 'warning');
        return;
    }
    if (phone && !/^[- +()0-9]{7,}$/.test(phone)) {
        showToast('Número de contacto inválido', 'warning');
        return;
    }

    const location = Number.isFinite(lat) && Number.isFinite(lng)
        ? { address, lat, lng }
        : { address };

    const data = {
        userId: currentUser.id,
        title: document.getElementById('found-title').value,
        type: document.getElementById('found-type').value,
        status: 'found',
        location,
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
    try { document.documentElement.setAttribute('lang', currentLanguage); } catch (e) {}
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
                window.currentUser = user; // Make globally available
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
        
        // Update document count and helped counter
        const documents = await window.documentsApi.getByUser(user.id);
        const docCount = documents?.length || 0;
        if (profileDocCount) profileDocCount.textContent = docCount.toString();
        
        // Update helped counter with real data
        const helpedCount = await getHelpedCount(user.id);
        const profileHelped = document.getElementById('profile-helped');
        if (profileHelped) profileHelped.textContent = helpedCount.toString();
        
        // Update points
        const profilePoints = document.getElementById('profile-points');
        if (profilePoints) {
            const points = await calculateUserPoints(user.id);
            profilePoints.textContent = points.toString();
        }
        
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
    applyTranslations(currentLanguage);
}

function createProfileDocumentCard(doc) {
    const div = document.createElement('div');
    div.className = 'document-card';
    div.dataset.id = doc.id;
    
    const statusClass = doc.status === 'lost' ? 'danger' : doc.status === 'found' ? 'success' : 'primary';
    const statusText = doc.status;
    
    div.innerHTML = `
        <div class="card-body">
            <h4>${doc.title}</h4>
            <p class="muted">Tipo: ${doc.type} • <span data-i18n="documents.status_label">Status</span>: <span data-i18n="status.${statusText}">${statusText}</span></p>
            <div class="card-actions">
                <button class="btn small ${statusClass} view-profile-doc" data-id="${doc.id}" data-i18n="actions.view">Ver</button>
                <button class="btn small secondary edit-profile-doc" data-id="${doc.id}" data-i18n="actions.edit">Editar</button>
                ${doc.status === 'normal' ? 
                    `<button class="btn small warning mark-lost-doc" data-id="${doc.id}" data-i18n="actions.mark_lost">Marcar Perdido</button>` :
                    doc.status === 'lost' ? 
                    `<button class="btn small success cancel-lost-doc" data-id="${doc.id}" data-i18n="actions.cancel_lost">Cancelar Perdido</button>` : ''
                }
                <button class="btn small info chat-doc-btn" data-id="${doc.id}" data-title="${doc.title}">
                    <i class="fas fa-comments"></i> <span data-i18n="actions.chat">Chat</span>
                </button>
                <button class="btn danger small delete-profile-doc" data-id="${doc.id}" data-i18n="actions.delete">Excluir</button>
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
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API fails
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
    const uploadModalClose = document.getElementById('close-upload-modal');
    const uploadCancel = document.getElementById('cancel-upload');
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('drop-zone');
    const filePreview = document.getElementById('file-preview');
    const browseBtn = document.getElementById('browse-btn');
    
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
        const onFileChange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            // Lightweight preview: show file name and size
            if (filePreview) {
                const sizeKB = Math.round(file.size / 1024);
                filePreview.innerHTML = `<div class="file-item uploading"><div class="file-icon"><i class="fas fa-file"></i></div><div class="file-info"><div class="file-name">${file.name}</div><p class="file-meta"><span class="file-size">${sizeKB} KB</span></p></div></div>`;
            }
        };

        if (browseBtn) browseBtn.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', onFileChange);

        // Drag and drop
        dropzone.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropzone.classList.add('drag-over');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
        dropzone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropzone.classList.remove('drag-over');
            const files = event.dataTransfer.files;
            if (files && files.length > 0) {
                fileInput.files = files;
                const changeEvent = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(changeEvent);
            }
        });
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
    const previewContainer = document.getElementById('file-preview');
    const uploadSubmit = document.getElementById('upload-submit');
    
    if (form) form.reset();
    if (previewContainer) previewContainer.innerHTML = '';
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
        showToast('Por favor, selecione um documento para fazer upload', 'error');
        return;
    }
    
    const docType = document.getElementById('document-type').value;
    const docTitle = document.getElementById('document-title')?.value || '';
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
    // Ensure tutorial manager exists and wire start button
    try {
        if (window.tutorialManager) {
            const tutorialBtn = document.getElementById('start-tutorial');
            if (tutorialBtn) {
                tutorialBtn.addEventListener('click', () => window.tutorialManager.startTutorial('main', true));
            }
        }
    } catch (e) { console.warn('Tutorial init failed', e); }
    
    // Initialize profile logout button
    const profileLogoutBtn = document.getElementById('profile-logout-btn');
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', handleLogout);
    }

    // Initialize ranking modal
    initializeRankingModal();
    
    // Initialize feed filters
    initializeFeedFilters();

    // Global: enable ESC to close any open modal and trap focus inside
    setupGlobalModalAccessibility();
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

// Ranking Modal Functions
function initializeRankingModal() {
    const viewRankingBtn = document.getElementById('view-ranking-progress');
    const rankingModal = document.getElementById('ranking-modal');
    const closeRankingModal = document.getElementById('close-ranking-modal');

    if (viewRankingBtn) {
        viewRankingBtn.addEventListener('click', () => {
            openRankingModal();
        });
    }

    if (closeRankingModal) {
        closeRankingModal.addEventListener('click', () => {
            rankingModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (rankingModal) {
        rankingModal.addEventListener('click', (e) => {
            if (e.target === rankingModal) {
                rankingModal.style.display = 'none';
            }
        });
    }
}

async function openRankingModal() {
    const rankingModal = document.getElementById('ranking-modal');
    const modalBody = document.getElementById('ranking-modal-body');
    
    if (!rankingModal || !modalBody) return;
    
    rankingModal.style.display = 'block';
    
    try {
        // Show loading state
        modalBody.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando progresso de ranking...</p>
            </div>
        `;
        
        // Get current user's ranking data
        const user = window.currentUser;
        if (!user) {
            throw new Error('Usuário não autenticado');
        }
        
        // Get user profile with points
        const userProfile = await window.profilesApi.get(user.id);
        if (!userProfile) {
            throw new Error('Perfil do usuário não encontrado');
        }
        
        const currentPoints = userProfile.points || 0;
        
        // Define ranking levels
        const rankingLevels = [
            { name: 'Novato', minPoints: 0, maxPoints: 49, color: '#6c757d' },
            { name: 'Iniciante', minPoints: 50, maxPoints: 99, color: '#28a745' },
            { name: 'Intermediário', minPoints: 100, maxPoints: 199, color: '#007bff' },
            { name: 'Avançado', minPoints: 200, maxPoints: 499, color: '#fd7e14' },
            { name: 'Expert', minPoints: 500, maxPoints: 999, color: '#e83e8c' },
            { name: 'Lenda', minPoints: 1000, maxPoints: Infinity, color: '#FFD700' }
        ];
        
        // Find current rank
        const currentRank = rankingLevels.find(rank => 
            currentPoints >= rank.minPoints && currentPoints <= rank.maxPoints
        ) || rankingLevels[0];
        
        // Find next rank
        const currentIndex = rankingLevels.indexOf(currentRank);
        const nextRank = currentIndex < rankingLevels.length - 1 ? rankingLevels[currentIndex + 1] : null;
        
        // Calculate progress to next rank
        let progressPercentage = 100;
        let pointsToNext = 0;
        
        if (nextRank) {
            const pointsInCurrentRank = currentPoints - currentRank.minPoints;
            const totalPointsNeeded = nextRank.minPoints - currentRank.minPoints;
            progressPercentage = Math.min(100, (pointsInCurrentRank / totalPointsNeeded) * 100);
            pointsToNext = nextRank.minPoints - currentPoints;
        }
        
        // Generate ranking modal content
        modalBody.innerHTML = `
            <div class="ranking-progress-container">
                <div class="current-rank-display">
                    <div class="rank-badge-large" style="background: ${currentRank.color};">
                        <i class="fas fa-trophy"></i>
                        ${currentRank.name}
                    </div>
                    <div class="current-points">
                        <span class="points-number">${currentPoints}</span>
                        <span class="points-label">pontos</span>
                    </div>
                </div>
                
                ${nextRank ? `
                    <div class="progress-to-next">
                        <h4>Progresso para ${nextRank.name}</h4>
                        <div class="progress-bar-container">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercentage}%; background: ${nextRank.color};"></div>
                            </div>
                            <div class="progress-text">
                                <span>${Math.round(progressPercentage)}%</span>
                                <span>${pointsToNext} pontos restantes</span>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="max-rank-achieved">
                        <h4><i class="fas fa-crown"></i> Nível Máximo Alcançado!</h4>
                        <p>Parabéns! Você alcançou o nível mais alto do ranking.</p>
                    </div>
                `}
                
                <div class="ranking-levels-list">
                    <h4>Todos os Níveis</h4>
                    <div class="levels-grid">
                        ${rankingLevels.map((level, index) => `
                            <div class="level-item ${level === currentRank ? 'current' : ''} ${currentPoints >= level.minPoints ? 'unlocked' : 'locked'}">
                                <div class="level-icon" style="background: ${level.color};">
                                    <i class="fas fa-${index === rankingLevels.length - 1 ? 'crown' : 'trophy'}"></i>
                                </div>
                                <div class="level-info">
                                    <div class="level-name">${level.name}</div>
                                    <div class="level-points">${level.minPoints}+ pontos</div>
                                </div>
                                ${level === currentRank ? '<div class="current-badge">Atual</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="ranking-tips">
                    <h4><i class="fas fa-lightbulb"></i> Como Ganhar Mais Pontos</h4>
                    <ul>
                        <li><i class="fas fa-plus"></i> Adicionar documentos: +10 pontos</li>
                        <li><i class="fas fa-search"></i> Encontrar documento perdido: +25 pontos</li>
                        <li><i class="fas fa-handshake"></i> Ajudar outros usuários: +15 pontos</li>
                        <li><i class="fas fa-check-circle"></i> Verificar documentos: +5 pontos</li>
                    </ul>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading ranking data:', error);
        modalBody.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar dados de ranking</p>
                <p class="error-detail">${error.message}</p>
            </div>
        `;
    }
}

// Accessibility helpers for modals: ESC to close, focus trap, restore focus
function setupGlobalModalAccessibility() {
    const modalSelectors = ['upload-modal', 'chat-modal', 'ranking-modal', 'payment-modal', 'document-preview-modal'];

    // Keep track of last focused element before opening a modal
    let lastFocusedBeforeOpen = null;

    function getFocusable(container) {
        if (!container) return [];
        const selectors = [
            'a[href]', 'button:not([disabled])', 'textarea:not([disabled])', 'input:not([disabled])',
            'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
        ];
        return Array.from(container.querySelectorAll(selectors.join(',')))
            .filter(el => el.offsetParent !== null || el === document.activeElement);
    }

    function isOpen(el) {
        return el && getComputedStyle(el).display !== 'none';
    }

    // Observe clicks that open modals to store last focus
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        // If a click is about to open any known modal, remember focus
        if (target.closest('#profile-add-document, #add-document, .contact-reporter-btn, #view-ranking-progress, .payment-btn, .view-doc, .view-profile-doc')) {
            lastFocusedBeforeOpen = document.activeElement;
        }
    }, true);

    // Keydown: ESC close and focus trap
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' && e.key !== 'Tab') return;

        const openModal = modalSelectors
            .map(id => document.getElementById(id))
            .find(m => isOpen(m));
        if (!openModal) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            // Try to click a close button if available
            const closeBtn = openModal.querySelector('.close-btn, .close');
            if (closeBtn) {
                (closeBtn instanceof HTMLElement) && closeBtn.click();
            } else {
                openModal.style.display = 'none';
            }
            // Restore focus
            if (lastFocusedBeforeOpen && lastFocusedBeforeOpen.focus) {
                setTimeout(() => lastFocusedBeforeOpen.focus(), 0);
            }
            return;
        }

        if (e.key === 'Tab') {
            const content = openModal.querySelector('.modal-content');
            const focusables = getFocusable(content);
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;

            if (e.shiftKey) {
                if (active === first || !content.contains(active)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last || !content.contains(active)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    });

    // When opening each modal, move focus to its content for screen readers
    modalSelectors.forEach(id => {
        const modal = document.getElementById(id);
        if (!modal) return;
        const observer = new MutationObserver(() => {
            if (isOpen(modal)) {
                const content = modal.querySelector('.modal-content');
                if (content instanceof HTMLElement) {
                    content.focus();
                }
            }
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
    });
}

// Feed Filters Functions
function initializeFeedFilters() {
    const typeFilter = document.getElementById('feed-filter-type');
    const statusFilter = document.getElementById('feed-filter-status');

    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            loadFeed();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadFeed();
        });
    }
}

// Make functions globally available
window.showSection = showSection;
window.showToast = showToast;
window.renderProfilePage = renderProfilePage;
window.handleLogout = handleLogout;
window.awardPoints = awardPoints;
window.openRankingModal = openRankingModal;