// País e prefixo nos formulários de contato
function setupCountryPrefix(selectId, prefixId) {
    const select = document.getElementById(selectId);
    const prefix = document.getElementById(prefixId);
    if (select && prefix) {
        select.addEventListener('change', function() {
            const selected = select.options[select.selectedIndex];
            const p = selected.getAttribute('data-prefix') || '';
            prefix.textContent = p;
        });
        // Default para Moçambique
        select.value = 'MZ';
        prefix.textContent = '+258';
    }
}

setupCountryPrefix('document-country', 'document-prefix');
setupCountryPrefix('lost-country', 'lost-prefix');
setupCountryPrefix('found-country', 'found-prefix');
// Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        // Mantém idioma e tema
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, currentLanguage);
        localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
        location.reload();
    });
}
// --- Navegação barra inferior mobile ---
function setupBottomNavBar() {
    const navItems = document.querySelectorAll('#bottom-nav-bar .nav-item');
    const sectionMap = {
        'documentos': 'documentos',
        'feed': 'feed',
        'relatar-perda': 'relatar-perda',
        'relatar-encontrado': 'relatar-encontrado',
        'perfil': 'perfil'
    };
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            // Esconde todas as seções
            document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
            // Mostra a seção correspondente
            const target = this.getAttribute('data-nav-target');
            if (sectionMap[target]) {
                const sec = document.getElementById(sectionMap[target]);
                if (sec) sec.classList.add('active');
            }
            // Esconde dicas de boas-vindas se não for documentos
            if (typeof welcomeTips !== 'undefined' && welcomeTips) {
                welcomeTips.style.display = (target === 'documentos') ? 'block' : 'none';
            }
        });
    });
    // Sincroniza estado inicial
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        const id = activeSection.id;
        navItems.forEach(i => i.classList.remove('active'));
        const match = Array.from(navItems).find(i => i.getAttribute('data-nav-target') === id);
        if (match) match.classList.add('active');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupBottomNavBar);
} else {
    setupBottomNavBar();
}
// DOM Elements
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const demoLoginBtn = document.getElementById('demo-login');
const resetAppBtn = document.getElementById('reset-app');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const welcomeTips = document.getElementById('welcome-tips');
const themeToggle = document.getElementById('theme-toggle');

// Modal elements
const documentModal = document.getElementById('document-modal');
const lostModal = document.getElementById('lost-modal');
const foundModal = document.getElementById('found-modal');
const chatModal = document.getElementById('chat-modal');
const upgradeModal = document.getElementById('upgrade-modal');
const addDocumentBtn = document.getElementById('add-document');
const reportLostBtn = document.getElementById('report-lost-btn');
const reportFoundBtn = document.getElementById('report-found-btn');

// Profile avatar upload
const avatarImg = document.getElementById('user-avatar');
const avatarUpload = document.getElementById('avatar-upload');
const changeAvatarBtn = document.getElementById('change-avatar-btn');

if (changeAvatarBtn && avatarUpload && avatarImg) {
    changeAvatarBtn.addEventListener('click', () => {
        avatarUpload.click();
    });
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione uma imagem válida.', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Imagem muito grande. Máximo 5MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            avatarImg.src = ev.target.result;
            localStorage.setItem('profile_avatar', ev.target.result);
            showToast('Foto de perfil atualizada!', 'success');
        };
        reader.readAsDataURL(file);
    });
    // Carregar avatar salvo
    const savedAvatar = localStorage.getItem('profile_avatar');
    if (savedAvatar) {
        avatarImg.src = savedAvatar;
    }
}

// Forms
// Login/Register
const loginForm = document.getElementById('login-form');
const loginCountrySelect = document.getElementById('login-country');
const loginCountryFlag = document.getElementById('login-country-flag');
const loginCountryPrefix = document.getElementById('login-country-prefix');

if (loginCountrySelect && loginCountryFlag && loginCountryPrefix) {
    loginCountrySelect.addEventListener('change', function() {
        const selected = loginCountrySelect.options[loginCountrySelect.selectedIndex];
        const flag = selected.getAttribute('data-flag') || '';
        const prefix = selected.getAttribute('data-prefix') || '';
        loginCountryFlag.textContent = flag;
        loginCountryPrefix.textContent = prefix;
    });
    // Set default to Angola
    loginCountrySelect.value = 'AO';
    loginCountryFlag.textContent = '🇦🇴';
    loginCountryPrefix.textContent = '+244';
}

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Aqui você pode implementar lógica de autenticação/registro
        // Exemplo: salvar login no localStorage e mostrar app
        localStorage.setItem('findmydocs_is_logged_in', 'true');
        showApp();
        showToast('Login/Register efetuado com sucesso!', 'success');
    });
}
const documentForm = document.getElementById('document-form');
const lostForm = document.getElementById('lost-form');
const foundForm = document.getElementById('found-form');

// Chat elements
const chatMessages = document.getElementById('chat-messages');
const chatInputField = document.getElementById('chat-input-field');
const sendMessageBtn = document.getElementById('send-message');

// Data keys for localStorage (keeping for settings only)
const STORAGE_KEYS = {
    LANGUAGE: 'findmydocs_language',
    THEME: 'findmydocs_theme',
    MEMBER_SINCE: 'findmydocs_member_since',
    USER_POINTS: 'findmydocs_user_points',
    IS_LOGGED_IN: 'findmydocs_is_logged_in',
    CHAT_MESSAGES: 'findmydocs_chat_messages',
    LOST_DOCUMENTS: 'findmydocs_lost_documents',
    FOUND_DOCUMENTS: 'findmydocs_found_documents',
    DOCUMENTS: 'findmydocs_documents'
};

// Current state
let currentUser = null;
let isLoggedIn = false;
let currentChatDocument = null;
let currentLanguage = 'pt';
let currentTheme = 'light';

// Utility Functions
function generateId() {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString(currentLanguage === 'pt' ? 'pt-BR' : 'en-US');
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; margin-left: 10px;">&times;</button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' && element.type === 'text') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load preferences
    currentLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'pt';
    currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    
    // Set language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }
    
    // Wait for translations to load
    setTimeout(() => {
        updateTranslations();
        updateNavigationText();
    }, 100);
    
    // Check if user is already logged in
    if (localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true') {
        showApp();
    }

    // Initialize event listeners
    initializeEventListeners();
    
    // Load initial data
    loadUserPoints();
    loadDocuments();
    loadLostDocuments();
    loadFoundDocuments();
    initializeFeedData();
    updateProfileStats();
    
    // Set member since date if not exists
    if (!localStorage.getItem(STORAGE_KEYS.MEMBER_SINCE)) {
        localStorage.setItem(STORAGE_KEYS.MEMBER_SINCE, new Date().toISOString());
    }
    updateMemberSince();
});

// Event Listeners
function initializeEventListeners() {
    // Login
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', handleDemoLogin);
    }
    
    // Reset app
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', handleResetApp);
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Modal controls
    setupModalControls();
    
    // Forms
    if (documentForm) {
        documentForm.addEventListener('submit', handleAddDocument);
    }
    if (lostForm) {
        lostForm.addEventListener('submit', handleReportLost);
    }
    if (foundForm) {
        foundForm.addEventListener('submit', handleReportFound);
    }
    
    // Search functionality
    setupSearchFunctionality();
    
    // Chat
    setupChatFunctionality();
    
    // Tips close buttons
    setupTipsControls();
    
    // Language selector
    setupLanguageSelector();
    
    // File upload
    setupFileUpload();
    
    // Upgrade button
    setupUpgradeButton();
    
    // Feed functionality
    setupFeedFunctionality();
}

// Theme functionality
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    if (icon) {
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Login functionality
async function handleDemoLogin() {
    try {
        // Simulate demo login without API call
        currentUser = 'Demo User';
        isLoggedIn = true;
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
        
        // Initialize demo data if not exists
        if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
            localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.LOST_DOCUMENTS)) {
            // Mock data for lost documents
            const mockLostDocuments = [
                {
                    id: generateId(),
                    type: 'bi',
                    name: 'Bilhete de Identidade',
                    number: '1234567890',
                    location: 'Praça dos Trabalhadores, Maputo',
                    description: 'BI perdido na praça, cor azul, foto recente',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Maria Silva',
                    contact: '+258 84 123 4567',
                    province: 'maputo'
                },
                {
                    id: generateId(),
                    type: 'passaporte',
                    name: 'Passaporte',
                    number: 'P123456',
                    location: 'Aeroporto Internacional de Maputo',
                    description: 'Passaporte vermelho, emitido em 2023',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'João Santos',
                    contact: '+258 82 987 6543',
                    province: 'maputo'
                },
                {
                    id: generateId(),
                    type: 'carta',
                    name: 'Carta de Condução',
                    number: 'CD789012',
                    location: 'Baixa de Maputo, próximo ao Mercado Central',
                    description: 'Carta de condução categoria B, válida até 2025',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Carlos Manuel',
                    contact: '+258 87 456 7890',
                    province: 'maputo'
                },
                {
                    id: generateId(),
                    type: 'bi',
                    name: 'Bilhete de Identidade',
                    number: '2345678901',
                    location: 'Praça da Independência, Beira',
                    description: 'BI perdido durante o festival, cor verde',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'António Beira',
                    contact: '+258 84 234 5678',
                    province: 'beira'
                },
                {
                    id: generateId(),
                    type: 'passaporte',
                    name: 'Passaporte',
                    number: 'P234567',
                    location: 'Porto de Nacala, Nampula',
                    description: 'Passaporte azul marinho, emitido em 2022',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Fátima Nampula',
                    contact: '+258 82 345 6789',
                    province: 'nampula'
                },
                {
                    id: generateId(),
                    type: 'carta',
                    name: 'Carta de Condução',
                    number: 'CD234567',
                    location: 'Universidade Zambeze, Quelimane',
                    description: 'Carta de condução categoria C, válida até 2024',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'José Quelimane',
                    contact: '+258 87 567 8901',
                    province: 'quelimane'
                },
                {
                    id: generateId(),
                    type: 'bi',
                    name: 'Bilhete de Identidade',
                    number: '3456789012',
                    location: 'Mercado do Pescado, Pemba',
                    description: 'BI perdido durante compras, cor azul, foto recente',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Amélia Pemba',
                    contact: '+258 84 567 8901',
                    province: 'pemba'
                },
                {
                    id: generateId(),
                    type: 'passaporte',
                    name: 'Passaporte',
                    number: 'P456789',
                    location: 'Universidade Lúrio, Nampula',
                    description: 'Passaporte perdido na biblioteca, cor preta',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Eduardo Nampula',
                    contact: '+258 82 678 9012',
                    province: 'nampula'
                },
                {
                    id: generateId(),
                    type: 'carta',
                    name: 'Carta de Condução',
                    number: 'CD567890',
                    location: 'Praça dos Heróis, Xai-Xai',
                    description: 'Carta de condução categoria A, válida até 2026',
                    status: 'lost',
                    dateReported: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Joaquim Gaza',
                    contact: '+258 87 789 0123',
                    province: 'xai-xai'
                }
            ];
            localStorage.setItem(STORAGE_KEYS.LOST_DOCUMENTS, JSON.stringify(mockLostDocuments));
        }
        if (!localStorage.getItem(STORAGE_KEYS.FOUND_DOCUMENTS)) {
            // Mock data for found documents
            const mockFoundDocuments = [
                {
                    id: generateId(),
                    type: 'bi',
                    name: 'Bilhete de Identidade',
                    number: '9876543210',
                    location: 'Shopping Maputo Sul, Matola',
                    description: 'BI encontrado no estacionamento, cor verde',
                    status: 'found',
                    dateReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Ana Pereira',
                    contact: '+258 85 234 5678',
                    province: 'matola'
                },
                {
                    id: generateId(),
                    type: 'passaporte',
                    name: 'Passaporte',
                    number: 'P654321',
                    location: 'Praia da Costa do Sol, Maputo',
                    description: 'Passaporte azul marinho, encontrado na praia',
                    status: 'found',
                    dateReported: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Pedro Costa',
                    contact: '+258 83 345 6789',
                    province: 'maputo'
                },
                {
                    id: generateId(),
                    type: 'carta',
                    name: 'Carta de Condução',
                    number: 'CD345678',
                    location: 'Universidade Eduardo Mondlane, Maputo',
                    description: 'Carta de condução encontrada na biblioteca',
                    status: 'found',
                    dateReported: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Sofia António',
                    contact: '+258 86 567 8901',
                    province: 'maputo'
                },
                {
                    id: generateId(),
                    type: 'bi',
                    name: 'Bilhete de Identidade',
                    number: '3456789012',
                    location: 'Mercado Municipal, Tete',
                    description: 'BI encontrado na praça de alimentação',
                    status: 'found',
                    dateReported: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Manuel Tete',
                    contact: '+258 84 456 7890',
                    province: 'tete'
                },
                {
                    id: generateId(),
                    type: 'passaporte',
                    name: 'Passaporte',
                    number: 'P345678',
                    location: 'Praia do Tofo, Inhambane',
                    description: 'Passaporte encontrado na praia, cor preta',
                    status: 'found',
                    dateReported: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Rosa Inhambane',
                    contact: '+258 82 456 7890',
                    province: 'xai-xai'
                },
                {
                    id: generateId(),
                    type: 'carta',
                    name: 'Carta de Condução',
                    number: 'CD456789',
                    location: 'Shopping Polana, Maputo',
                    description: 'Carta de condução encontrada no cinema',
                    status: 'found',
                    dateReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Carlos Maputo',
                    contact: '+258 87 678 9012',
                    province: 'maputo'
                },
                {
                    id: generateId(),
                    type: 'bi',
                    name: 'Bilhete de Identidade',
                    number: '4567890123',
                    location: 'Praia de Tofo, Inhambane',
                    description: 'BI encontrado na praia, cor verde, foto antiga',
                    status: 'found',
                    dateReported: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Maria Inhambane',
                    contact: '+258 84 678 9012',
                    province: 'inhambane'
                },
                {
                    id: generateId(),
                    type: 'passaporte',
                    name: 'Passaporte',
                    number: 'P567890',
                    location: 'Aeroporto de Nacala, Nampula',
                    description: 'Passaporte encontrado no terminal de chegadas',
                    status: 'found',
                    dateReported: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'António Nacala',
                    contact: '+258 82 789 0123',
                    province: 'nampula'
                },
                {
                    id: generateId(),
                    type: 'carta',
                    name: 'Carta de Condução',
                    number: 'CD678901',
                    location: 'Universidade Pedagógica, Beira',
                    description: 'Carta de condução encontrada no estacionamento',
                    status: 'found',
                    dateReported: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
                    reportedBy: 'Carlos Beira',
                    contact: '+258 87 890 1234',
                    province: 'beira'
                }
            ];
            localStorage.setItem(STORAGE_KEYS.FOUND_DOCUMENTS, JSON.stringify(mockFoundDocuments));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)) {
            localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify([]));
        }
        
        showApp();
        showToast(t('message.welcome_demo') || 'Bem-vindo! Você está usando a versão demo.', 'success');
        
        // Load initial data
        loadUserPoints();
        loadDocuments();
        loadLostDocuments();
        loadFoundDocuments();
        initializeFeedData();
        updateProfileStats();
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Erro ao fazer login', 'error');
    }
}

function showApp() {
    if (loginSection) loginSection.classList.add('hidden');
    if (appSection) appSection.classList.remove('hidden');
    
    // Show welcome section initially
    showSection('documentos');
}

function handleResetApp() {
    if (confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita.')) {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        location.reload();
    }
}

// Navigation
function handleNavigation(e) {
    const targetSection = e.target.closest('.nav-link').dataset.section;
    
    // Update active nav link
    navLinks.forEach(link => link.classList.remove('active'));
    e.target.closest('.nav-link').classList.add('active');
    
    // Show target section
    showSection(targetSection);
}

function showSection(sectionName) {
    // Hide welcome tips when navigating away from home
    if (welcomeTips) {
        welcomeTips.style.display = sectionName === 'documentos' ? 'block' : 'none';
    }
    
    // Hide all sections
    contentSections.forEach(section => section.classList.remove('active'));
    
    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function updateNavigationText() {
    const navButtons = document.querySelectorAll('.nav-link span');
    
    if (currentLanguage === 'en') {
        if (navButtons[0]) navButtons[0].textContent = 'Home';
        if (navButtons[1]) navButtons[1].textContent = 'Report Lost';
        if (navButtons[2]) navButtons[2].textContent = 'Report Found';
        if (navButtons[3]) navButtons[3].textContent = 'Reset';
    } else {
        if (navButtons[0]) navButtons[0].textContent = 'Início';
        if (navButtons[1]) navButtons[1].textContent = 'Relatar Perda';
        if (navButtons[2]) navButtons[2].textContent = 'Relatar Encontrado';
        if (navButtons[3]) navButtons[3].textContent = 'Reset';
    }
}

// Modal controls
function setupModalControls() {
    // Add document modal
    if (addDocumentBtn && documentModal) {
        addDocumentBtn.addEventListener('click', () => {
            documentModal.classList.add('active');
        });
    }
    
    // Report lost modal
    if (reportLostBtn && lostModal) {
        reportLostBtn.addEventListener('click', () => {
            lostModal.classList.add('active');
        });
    }
    
    // Report found modal
    if (reportFoundBtn && foundModal) {
        reportFoundBtn.addEventListener('click', () => {
            foundModal.classList.add('active');
        });
    }
    
    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });
    
    // Cancel buttons
    const cancelDocument = document.getElementById('cancel-document');
    const cancelLost = document.getElementById('cancel-lost');
    const cancelFound = document.getElementById('cancel-found');
    
    if (cancelDocument && documentModal) {
        cancelDocument.addEventListener('click', () => {
            documentModal.classList.remove('active');
        });
    }
    
    if (cancelLost && lostModal) {
        cancelLost.addEventListener('click', () => {
            lostModal.classList.remove('active');
        });
    }
    
    if (cancelFound && foundModal) {
        cancelFound.addEventListener('click', () => {
            foundModal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Language selector
function setupLanguageSelector() {
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            updateTranslations();
            updateNavigationText();
        });
    }
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
}

// File upload functionality
function setupFileUpload() {
    // Document upload
    const fileInput = document.getElementById('document-image');
    const uploadedFilesDiv = document.getElementById('uploaded-files');
    let uploadedFiles = [];
    if (fileInput && uploadedFilesDiv) {
        const fileUploadArea = fileInput.closest('.file-upload-area');
        if (fileUploadArea) {
            fileUploadArea.addEventListener('click', () => fileInput.click());
        }
        fileInput.addEventListener('change', (e) => handleFileInputChange(e, uploadedFiles, uploadedFilesDiv));
        document.querySelectorAll('.modal .close, #cancel-document').forEach(btn => {
            btn.addEventListener('click', () => {
                uploadedFiles.length = 0;
                displayUploadedFiles(uploadedFiles, uploadedFilesDiv);
                if (fileInput) fileInput.value = '';
            });
        });
    }

    // Lost document upload
    const lostFileInput = document.getElementById('lost-document-files');
    if (lostFileInput) {
        lostFileInput.addEventListener('change', (e) => {
            // Optionally handle lost document file uploads here
        });
    }

    // Found document upload
    const foundFileInput = document.getElementById('found-image');
    if (foundFileInput) {
        foundFileInput.addEventListener('change', (e) => {
            // Optionally handle found document file uploads here
        });
    }
}

function handleFileInputChange(e, uploadedFiles, uploadedFilesDiv) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
            showToast(`Arquivo ${file.name} é muito grande. Tamanho máximo é 5MB.`, 'error');
            return;
        }
        const fileData = {
            id: generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            data: null
        };
        const reader = new FileReader();
        reader.onload = (ev) => {
            fileData.data = ev.target.result;
            uploadedFiles.push(fileData);
            displayUploadedFiles(uploadedFiles, uploadedFilesDiv);
        };
        reader.readAsDataURL(file);
    });
}

function displayUploadedFiles(uploadedFiles, uploadedFilesDiv) {
    uploadedFilesDiv.innerHTML = '';
    uploadedFiles.forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'uploaded-file';
        fileDiv.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file"></i>
                <span>${file.name}</span>
                <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button class="remove-file" onclick="removeUploadedFile('${file.id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        uploadedFilesDiv.appendChild(fileDiv);
    });
}

// Document management
async function handleAddDocument(e) {
    e.preventDefault();
    
    const newDocument = {
        id: generateId(),
        type: document.getElementById('document-type').value,
        name: document.getElementById('document-name').value,
        description: document.getElementById('document-description').value,
        status: 'active',
        dateAdded: new Date().toISOString()
    };
    // Validate required fields
    if (!newDocument.type || !newDocument.name) {
        showToast(t('message.fill_required') || 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    try {
        // Get existing documents
        const documents = getDocuments();
        
        // Add new document
        documents.push(newDocument);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
        
        // Close modal and reset form
        if (documentModal) documentModal.classList.remove('active');
        if (documentForm) documentForm.reset();
        
        // Reload documents display
        loadDocuments();
        updateProfileStats();
        
        showToast(t('message.document_added') || 'Documento adicionado com sucesso!', 'success');
    } catch (error) {
        console.error('Error adding document:', error);
        showToast('Erro ao adicionar documento', 'error');
    }
}

async function loadDocuments() {
    try {
        // Get documents from localStorage instead of API
        const documents = getDocuments();
        
        const documentsGrid = document.getElementById('documents-grid');
        const documentCount = document.getElementById('document-count');
        
        if (!documentsGrid) return;
        
        // Update count
        if (documentCount) {
            documentCount.textContent = `${documents.length} total`;
        }
        
        // Clear grid
        documentsGrid.innerHTML = '';
        
        if (documents.length === 0) {
            documentsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h3>${t('documents.no_documents') || 'Nenhum documento adicionado ainda'}</h3>
                    <p>${t('documents.add_first') || 'Clique em "Adicionar Novo Documento" para adicionar seu primeiro documento.'}</p>
                </div>
            `;
            return;
        }
        
        // Render documents
        documents.forEach(doc => {
            const documentCard = createDocumentCard(doc, true);
            documentsGrid.appendChild(documentCard);
        });
        
        // Update profile stats after loading documents
        updateProfileStats();
        
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

function createDocumentCard(doc, isOwner = false) {
    const card = document.createElement('div');
    card.className = 'document-card';
    
    const statusText = doc.status === 'lost' ? t('status.lost') || 'Perdido' : 
                      doc.status === 'found' ? t('status.found') || 'Encontrado' :
                      t('status.active') || 'Ativo';
    
    card.innerHTML = `
        <h3>${doc.name}</h3>
        <div class="document-id">ID: ${doc.number}</div>
        <p><strong>Tipo:</strong> ${getDocumentTypeName(doc.type)}</p>
        ${doc.description ? `<p><strong>Descrição:</strong> ${doc.description}</p>` : ''}
        <span class="status ${doc.status}">${statusText}</span>
        <p><small>Adicionado em: ${formatDate(doc.dateAdded)}</small></p>
        <div class="card-actions">
            ${isOwner ? `
                <button class="btn secondary small" onclick="viewDocument('${doc.id}')">
                    <i class="fas fa-eye"></i> ${t('documents.view') || 'Ver'}
                </button>
                ${doc.status === 'active' ? `
                    <button class="btn danger small" onclick="markAsLost('${doc.id}')">
                        <i class="fas fa-exclamation-triangle"></i> ${t('documents.mark_lost') || 'Marcar como Perdido'}
                    </button>
                ` : doc.status === 'lost' ? `
                    <button class="btn success small" onclick="cancelLostStatus('${doc.id}')">
                        <i class="fas fa-check"></i> ${t('documents.cancel_lost') || 'Cancelar Status de Perdido'}
                    </button>
                ` : ''}
            ` : `
                <button class="btn primary small" onclick="contactOwner('${doc.id}')">
                    <i class="fas fa-comment"></i> ${t('documents.contact') || 'Contato'}
                </button>
                <button class="btn success small" onclick="claimDocument('${doc.id}')">
                    <i class="fas fa-hand-paper"></i> ${t('documents.this_is_mine') || 'Este é meu'}
                </button>
            `}
        </div>
    `;
    
    return card;
}

function getDocumentTypeName(type) {
    switch (type) {
        case 'bi': return t('type.bi') || 'BI (Bilhete de Identidade)';
        case 'passaporte': return t('type.passaporte') || 'Passaporte';
        case 'carta': return t('type.carta') || 'Carta de Condução';
        case 'outros': return t('type.outros') || 'Outros';
        default: return type;
    }
}

// Global functions for document actions
window.viewDocument = function(docId) {
    const documents = getDocuments();
    const doc = documents.find(d => d.id === docId);
    if (doc) {
        showToast(`Visualizando documento: ${doc.name} (${doc.number})`, 'info');
    }
};

window.markAsLost = function(docId) {
    if (confirm(t('message.confirm_mark_lost') || 'Tem certeza de que deseja marcar este documento como perdido?')) {
        const documents = getDocuments();
        const docIndex = documents.findIndex(d => d.id === docId);
        if (docIndex !== -1) {
            documents[docIndex].status = 'lost';
            documents[docIndex].dateLost = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
            
            // Also add to lost documents feed
            const lostDoc = {...documents[docIndex], reportedBy: currentUser, contact: '+258 00 000 0000'};
            saveLostDocument(lostDoc);
            
            loadDocuments();
            loadLostDocuments();
            addUserPoints(5);
            showToast(t('message.document_marked_lost') || 'Documento marcado como perdido!', 'warning');
        }
    }
};

window.cancelLostStatus = function(docId) {
    const documents = getDocuments();
    const docIndex = documents.findIndex(d => d.id === docId);
    if (docIndex !== -1) {
        documents[docIndex].status = 'active';
        delete documents[docIndex].dateLost;
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
        
        // Remove from lost documents feed
        const lostDocs = getLostDocuments();
        const filteredLostDocs = lostDocs.filter(d => d.id !== docId);
        localStorage.setItem(STORAGE_KEYS.LOST_DOCUMENTS, JSON.stringify(filteredLostDocs));
        
        loadDocuments();
        loadLostDocuments();
        showToast('Status de perdido cancelado!', 'success');
    }
};

window.contactOwner = function(docId) {
    currentChatDocument = docId;
    if (chatModal) {
        chatModal.classList.add('active');
        loadChatMessages(docId);
    }
};

window.claimDocument = function(docId) {
    showToast('Funcionalidade de reivindicação será implementada em breve.', 'info');
};

// Lost documents functionality
async function handleReportLost(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('document_type', document.getElementById('lost-document-type').value);
    formData.append('document_name', document.getElementById('lost-document-name').value);
    formData.append('location_lost', document.getElementById('lost-location').value);
    formData.append('description', document.getElementById('lost-description').value);
    formData.append('contact_info', getFullPhone('lost-country', 'lost-prefix', 'lost-contact'));
    
    // Add files from lost document form
    const fileInput = document.getElementById('lost-document-files');
    if (fileInput && fileInput.files) {
        for (let file of fileInput.files) {
            formData.append('files', file);
        }
    }
    
    // Validate required fields
    if (!formData.get('document_type') || !formData.get('document_name') || !formData.get('location_lost') || !formData.get('contact_info')) {
        showToast(t('message.fill_required') || 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/lost-documents', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Close modal and reset form
            if (lostModal) lostModal.classList.remove('active');
            if (lostForm) lostForm.reset();
            
            // Reload lost documents display
            loadLostDocuments();
            updateProfileStats();
            
            showToast(t('message.lost_reported') || 'Documento perdido reportado com sucesso!', 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'Erro ao reportar documento perdido', 'error');
        }
    } catch (error) {
        console.error('Error reporting lost document:', error);
        showToast('Erro de conexão', 'error');
    }
    
    // Reload lost documents display
    loadLostDocuments();
    
    // Award points
    addUserPoints(15);
    
    showToast(t('message.lost_reported') || 'Documento perdido reportado com sucesso!', 'warning');
}

function saveLostDocument(document) {
    const lostDocuments = getLostDocuments();
    lostDocuments.push(document);
    localStorage.setItem(STORAGE_KEYS.LOST_DOCUMENTS, JSON.stringify(lostDocuments));
}

function getLostDocuments() {
    const documents = localStorage.getItem(STORAGE_KEYS.LOST_DOCUMENTS);
    return documents ? JSON.parse(documents) : [];
}

function loadLostDocuments() {
    const lostDocuments = getLostDocuments();
    const lostGrid = document.getElementById('lost-documents-grid');
    const lostCount = document.getElementById('lost-count');
    
    if (!lostGrid) return;
    
    // Update count
    if (lostCount) {
        const countText = t('lost.documents_found') || 'documentos encontrados';
        lostCount.innerHTML = `${lostDocuments.length} <span>${countText}</span>`;
    }
    
    // Clear grid
    lostGrid.innerHTML = '';
    
    if (lostDocuments.length === 0) {
        lostGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>${t('lost.no_documents') || 'Nenhum documento perdido reportado'}</h3>
                <p>${t('lost.be_first') || 'Seja o primeiro a reportar um documento perdido.'}</p>
            </div>
        `;
        return;
    }
    
    // Render lost documents
    lostDocuments.forEach(doc => {
        const documentCard = createLostDocumentCard(doc);
        lostGrid.appendChild(documentCard);
    });
}

function createLostDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'document-card';
    
    card.innerHTML = `
        <h3>${doc.name}</h3>
        <div class="document-id">Tipo: ${getDocumentTypeName(doc.type)}</div>
        <p><strong>Local perdido:</strong> ${doc.location}</p>
        ${doc.description ? `<p><strong>Descrição:</strong> ${doc.description}</p>` : ''}
        <span class="status lost">${t('status.lost') || 'Perdido'}</span>
        <p><small>Reportado em: ${formatDate(doc.dateReported)}</small></p>
        <p><small>Por: ${doc.reportedBy}</small></p>
        <div class="card-actions">
            <button class="btn primary small" onclick="contactOwner('${doc.id}')">
                <i class="fas fa-comment"></i> ${t('documents.contact') || 'Contato'}
            </button>
            <button class="btn success small" onclick="reportFound('${doc.id}')">
                <i class="fas fa-hand-paper"></i> Encontrei
            </button>
        </div>
    `;
    
    return card;
}

// Found documents functionality
function handleReportFound(e) {
    e.preventDefault();
    
    const foundData = {
        id: generateId(),
        type: document.getElementById('found-document-type').value,
        name: document.getElementById('found-document-name').value,
        location: document.getElementById('found-location').value,
        description: document.getElementById('found-description').value,
        contact: getFullPhone('found-country', 'found-prefix', 'found-contact'),
        status: 'found',
        dateReported: new Date().toISOString(),
        reportedBy: currentUser
    };
    
    // Validate required fields
    if (!foundData.type || !foundData.name || !foundData.location || !foundData.contact) {
        showToast(t('message.fill_required') || 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    // Save found document
    saveFoundDocument(foundData);
    
    // Close modal and reset form
    if (foundModal) foundModal.classList.remove('active');
    if (foundForm) foundForm.reset();
    
    // Reload found documents display
    loadFoundDocuments();
    
    // Award points
    addUserPoints(20);
    
    showToast(t('message.found_reported') || 'Documento encontrado reportado com sucesso! Obrigado por ajudar!', 'success');
}

function saveFoundDocument(document) {
    const foundDocuments = getFoundDocuments();
    foundDocuments.push(document);
    localStorage.setItem(STORAGE_KEYS.FOUND_DOCUMENTS, JSON.stringify(foundDocuments));
}

function getFoundDocuments() {
    const documents = localStorage.getItem(STORAGE_KEYS.FOUND_DOCUMENTS);
    return documents ? JSON.parse(documents) : [];
}

function loadFoundDocuments() {
    const foundDocuments = getFoundDocuments();
    const foundGrid = document.getElementById('found-documents-grid');
    const foundCount = document.getElementById('found-count');
    
    if (!foundGrid) return;
    
    // Update count
    if (foundCount) {
        const countText = t('lost.documents_found') || 'documentos encontrados';
        foundCount.innerHTML = `${foundDocuments.length} <span>${countText}</span>`;
    }
    
    // Clear grid
    foundGrid.innerHTML = '';
    
    if (foundDocuments.length === 0) {
        foundGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell"></i>
                <h3>${t('found.no_documents') || 'Nenhum documento encontrado reportado'}</h3>
                <p>${t('found.help_others') || 'Ajude outros reportando documentos que você encontrou.'}</p>
            </div>
        `;
        return;
    }
    
    // Render found documents
    foundDocuments.forEach(doc => {
        const documentCard = createFoundDocumentCard(doc);
        foundGrid.appendChild(documentCard);
    });
}

function createFoundDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'document-card';
    
    card.innerHTML = `
        <h3>${doc.name}</h3>
        <div class="document-id">Tipo: ${getDocumentTypeName(doc.type)}</div>
        <p><strong>Local encontrado:</strong> ${doc.location}</p>
        ${doc.description ? `<p><strong>Descrição:</strong> ${doc.description}</p>` : ''}
        <span class="status found">${t('status.found') || 'Encontrado'}</span>
        <p><small>Reportado em: ${formatDate(doc.dateReported)}</small></p>
        <p><small>Por: ${doc.reportedBy}</small></p>
        <div class="card-actions">
            <button class="btn primary small" onclick="contactFinder('${doc.id}')">
                <i class="fas fa-comment"></i> ${t('documents.contact') || 'Contato'}
            </button>
            <button class="btn success small" onclick="claimDocument('${doc.id}')">
                <i class="fas fa-hand-paper"></i> ${t('documents.this_is_mine') || 'Este é meu'}
            </button>
        </div>
    `;
    
    return card;
}

window.contactFinder = function(docId) {
    currentChatDocument = docId;
    if (chatModal) {
        chatModal.classList.add('active');
        loadChatMessages(docId);
    }
};

window.reportFound = function(docId) {
    if (foundModal) {
        foundModal.classList.add('active');
    }
};

// Search functionality
function setupSearchFunctionality() {
    const searchLost = document.getElementById('search-lost');
    const filterLostType = document.getElementById('filter-lost-type');
    const filterLostCountry = document.getElementById('filter-lost-country');
    const filterLostProvince = document.getElementById('filter-lost-province');
    const searchFound = document.getElementById('search-found');
    const filterFoundType = document.getElementById('filter-found-type');
    const filterFoundCountry = document.getElementById('filter-found-country');
    const filterFoundProvince = document.getElementById('filter-found-province');

    if (searchLost && filterLostType && filterLostCountry && filterLostProvince) {
        searchLost.addEventListener('input', filterLostDocuments);
        filterLostType.addEventListener('change', filterLostDocuments);
        filterLostCountry.addEventListener('change', filterLostDocuments);
        filterLostProvince.addEventListener('change', filterLostDocuments);
    }

    if (searchFound && filterFoundType && filterFoundCountry && filterFoundProvince) {
        searchFound.addEventListener('input', filterFoundDocuments);
        filterFoundType.addEventListener('change', filterFoundDocuments);
        filterFoundCountry.addEventListener('change', filterFoundDocuments);
        filterFoundProvince.addEventListener('change', filterFoundDocuments);
    }
}

function filterLostDocuments() {
    const searchTerm = document.getElementById('search-lost').value.toLowerCase();
    const typeFilter = document.getElementById('filter-lost-type').value;
    const countryFilter = document.getElementById('filter-lost-country').value;
    const provinceFilter = document.getElementById('filter-lost-province').value;

    const lostDocuments = getLostDocuments();
    const filteredDocs = lostDocuments.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm) || 
                             (doc.location && doc.location.toLowerCase().includes(searchTerm)) ||
                             (doc.description && doc.description.toLowerCase().includes(searchTerm));
        const matchesType = !typeFilter || doc.type === typeFilter;
        const matchesCountry = !countryFilter || (doc.country && doc.country === countryFilter);
        const matchesProvince = !provinceFilter || (doc.province && doc.province === provinceFilter);
        return matchesSearch && matchesType && matchesCountry && matchesProvince;
    });
    displayFilteredLostDocuments(filteredDocs);
}

function filterFoundDocuments() {
    const searchTerm = document.getElementById('search-found').value.toLowerCase();
    const typeFilter = document.getElementById('filter-found-type').value;
    const countryFilter = document.getElementById('filter-found-country').value;
    const provinceFilter = document.getElementById('filter-found-province').value;

    const foundDocuments = getFoundDocuments();
    const filteredDocs = foundDocuments.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm) || 
                             (doc.location && doc.location.toLowerCase().includes(searchTerm)) ||
                             (doc.description && doc.description.toLowerCase().includes(searchTerm));
        const matchesType = !typeFilter || doc.type === typeFilter;
        const matchesCountry = !countryFilter || (doc.country && doc.country === countryFilter);
        const matchesProvince = !provinceFilter || (doc.province && doc.province === provinceFilter);
        return matchesSearch && matchesType && matchesCountry && matchesProvince;
    });
    displayFilteredFoundDocuments(filteredDocs);
}

function displayFilteredLostDocuments(documents) {
    const lostGrid = document.getElementById('lost-documents-grid');
    const lostCount = document.getElementById('lost-count');
    
    if (!lostGrid) return;
    
    // Update count
    if (lostCount) {
        const countText = t('lost.documents_found') || 'documentos encontrados';
        lostCount.innerHTML = `${documents.length} <span>${countText}</span>`;
    }
    
    // Clear grid
    lostGrid.innerHTML = '';
    
    if (documents.length === 0) {
        lostGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum documento encontrado</h3>
                <p>Tente ajustar os filtros de busca.</p>
            </div>
        `;
        return;
    }
    
    // Render filtered documents
    documents.forEach(doc => {
        const documentCard = createLostDocumentCard(doc);
        lostGrid.appendChild(documentCard);
    });
}

function displayFilteredFoundDocuments(documents) {
    const foundGrid = document.getElementById('found-documents-grid');
    const foundCount = document.getElementById('found-count');
    
    if (!foundGrid) return;
    
    // Update count
    if (foundCount) {
        const countText = t('lost.documents_found') || 'documentos encontrados';
        foundCount.innerHTML = `${documents.length} <span>${countText}</span>`;
    }
    
    // Clear grid
    foundGrid.innerHTML = '';
    
    if (documents.length === 0) {
        foundGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum documento encontrado</h3>
                <p>Tente ajustar os filtros de busca.</p>
            </div>
        `;
        return;
    }
    
    // Render filtered documents
    documents.forEach(doc => {
        const documentCard = createFoundDocumentCard(doc);
        foundGrid.appendChild(documentCard);
    });
}

// Chat functionality
function setupChatFunctionality() {
    if (sendMessageBtn && chatInputField) {
        sendMessageBtn.addEventListener('click', sendMessage);
        chatInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function sendMessage() {
    const message = chatInputField.value.trim();
    if (!message || !currentChatDocument) return;
    
    const messageData = {
        id: generateId(),
        documentId: currentChatDocument,
        sender: currentUser,
        message: message,
        timestamp: new Date().toISOString()
    };
    
    // Save message
    const messages = getChatMessages();
    messages.push(messageData);
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    
    // Clear input
    chatInputField.value = '';
    
    // Reload chat
    loadChatMessages(currentChatDocument);
    
    // Add points for engagement
    addUserPoints(2);
}

function getChatMessages() {
    const messages = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    return messages ? JSON.parse(messages) : [];
}

function loadChatMessages(documentId) {
    if (!chatMessages) return;
    
    const allMessages = getChatMessages();
    const docMessages = allMessages.filter(msg => msg.documentId === documentId);
    
    chatMessages.innerHTML = '';
    
    if (docMessages.length === 0) {
        chatMessages.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment"></i>
                <h3>Nenhuma mensagem ainda</h3>
                <p>Inicie a conversa enviando uma mensagem.</p>
            </div>
        `;
        return;
    }
    
    docMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${msg.sender === currentUser ? 'own' : 'other'}`;
        messageDiv.innerHTML = `
            <div class="sender">${msg.sender}</div>
            <div class="message">${msg.message}</div>
            <div class="time">${formatDate(msg.timestamp)}</div>
        `;
        chatMessages.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Tips functionality
function setupTipsControls() {
    document.querySelectorAll('.tip-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.tip-card').style.display = 'none';
        });
    });
}

// Upgrade functionality
function setupUpgradeButton() {
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (upgradeModal) {
                upgradeModal.classList.add('active');
            }
        });
    });
    
    // Mock upgrade buttons
    document.querySelectorAll('.pricing-card .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.setItem(STORAGE_KEYS.IS_PREMIUM, 'true');
            if (upgradeModal) {
                upgradeModal.classList.remove('active');
            }
            showToast('Upgrade realizado com sucesso! Agora você tem acesso Premium.', 'success');
        });
    });
}

function isPremium() {
    return localStorage.getItem(STORAGE_KEYS.IS_PREMIUM) === 'true';
}

// Feed functionality
function setupFeedFunctionality() {
    const feedFilter = document.getElementById('feed-filter');
    const feedLocation = document.getElementById('feed-location');
    
    if (feedFilter) {
        feedFilter.addEventListener('change', updateFeed);
    }
    if (feedLocation) {
        feedLocation.addEventListener('change', updateFeed);
    }
}

function initializeFeedData() {
    updateFeed();
}

function updateFeed() {
    const feedGrid = document.getElementById('feed-grid');
    if (!feedGrid) return;
    
    const lostDocs = getLostDocuments();
    const foundDocs = getFoundDocuments();
    
    let allDocs = [];
    
    const filterValue = document.getElementById('feed-filter')?.value || 'all';
    const locationValue = document.getElementById('feed-location')?.value || 'all';
    
    if (filterValue === 'all' || filterValue === 'lost') {
        allDocs = allDocs.concat(lostDocs);
    }
    if (filterValue === 'all' || filterValue === 'found') {
        allDocs = allDocs.concat(foundDocs);
    }
    
    // Sort by date
    allDocs.sort((a, b) => new Date(b.dateReported) - new Date(a.dateReported));
    
    // Clear grid
    feedGrid.innerHTML = '';
    
    if (allDocs.length === 0) {
        feedGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>Nenhum documento no feed</h3>
                <p>Seja o primeiro a reportar um documento perdido ou encontrado.</p>
            </div>
        `;
        return;
    }
    
    // Render documents
    allDocs.forEach(doc => {
        const card = doc.status === 'lost' ? createLostDocumentCard(doc) : createFoundDocumentCard(doc);
        feedGrid.appendChild(card);
    });
}

// Points system
function addUserPoints(points) {
    const currentPoints = getUserPoints();
    const newPoints = currentPoints + points;
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
    updatePointsDisplay();
}

function getUserPoints() {
    const points = localStorage.getItem(STORAGE_KEYS.USER_POINTS);
    return points ? parseInt(points) : 0;
}

function loadUserPoints() {
    updatePointsDisplay();
}

function updatePointsDisplay() {
    const pointsElement = document.getElementById('user-points');
    const profilePointsElement = document.getElementById('profile-points');
    
    const points = getUserPoints();
    
    if (pointsElement) {
        pointsElement.textContent = points;
    }
    if (profilePointsElement) {
        profilePointsElement.textContent = points;
    }
}

// Profile functionality
function updateProfileStats() {
    const documents = getDocuments();
    const lostDocs = getLostDocuments();
    const foundDocs = getFoundDocuments();
    
    const profileDocuments = document.getElementById('profile-documents');
    const profileHelped = document.getElementById('profile-helped');
    
    if (profileDocuments) {
        profileDocuments.textContent = documents.length;
    }
    if (profileHelped) {
        profileHelped.textContent = foundDocs.filter(doc => doc.reportedBy === currentUser).length;
    }
}

function updateMemberSince() {
    const memberSinceElement = document.getElementById('member-since');
    if (memberSinceElement) {
        const memberSince = localStorage.getItem(STORAGE_KEYS.MEMBER_SINCE);
        if (memberSince) {
            memberSinceElement.textContent = formatDate(memberSince);
        }
    }
}

function getDocuments() {
    const documents = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return documents ? JSON.parse(documents) : [];
}
