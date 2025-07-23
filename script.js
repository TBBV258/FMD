// FindMyDocs - Mobile Document Management System with Supabase Integration
// Main JavaScript Application Logic

// Current state
let currentUser = null;
let isLoggedIn = false;
let currentChatDocument = null;
let currentLanguage = 'pt';
let currentTheme = 'light';
let watchPositionId = null;
let currentLocation = null;
let notificationPermission = false;

// DOM Elements
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loadingSpinner = document.getElementById('loading-spinner');
const demoLoginBtn = document.getElementById('demo-login');
const resetAppBtn = document.getElementById('reset-app');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const welcomeTips = document.getElementById('welcome-tips');
const themeToggle = document.getElementById('theme-toggle');
const languageSelector = document.getElementById('language-selector');

// Modal elements
const documentModal = document.getElementById('document-modal');
const lostModal = document.getElementById('lost-modal');
const foundModal = document.getElementById('found-modal');
const chatModal = document.getElementById('chat-modal');
const viewDocumentModal = document.getElementById('view-document-modal');
const addDocumentBtn = document.getElementById('add-document');
const reportLostBtn = document.getElementById('report-lost-btn');
const reportFoundBtn = document.getElementById('report-found-btn');

// Forms
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const documentForm = document.getElementById('document-form');
const lostForm = document.getElementById('lost-form');
const foundForm = document.getElementById('found-form');

// Auth buttons
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');

// Chat elements
const chatMessages = document.getElementById('chat-messages');
const chatInputField = document.getElementById('chat-input-field');
const sendMessageBtn = document.getElementById('send-message');

// Profile elements
const avatarImg = document.getElementById('user-avatar');
const avatarUpload = document.getElementById('avatar-upload');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const logoutBtn = document.getElementById('logout-btn');

// Initialize Supabase service
window.supabaseService = new SupabaseService();

// Initialize Application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('FindMyDocs App Starting...');
    showLoading(true);
    
    try {
        // Wait for Supabase to initialize
        await waitForSupabase();
        
        // Load saved settings
        loadUserSettings();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup country prefixes
        setupCountryPrefix('register-country', 'register-country-flag', 'register-country-prefix');
        
        // Initialize features
        initializeGeolocation();
        initializeNotifications();
        
        // Check authentication state
        await checkAuthState();
        
        showLoading(false);
        console.log('FindMyDocs App Ready!');
    } catch (error) {
        console.error('App initialization error:', error);
        showToast('Erro ao inicializar aplicação: ' + error.message, 'error');
        showLoading(false);
    }
});

// Wait for Supabase service to be ready
async function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabaseService?.supabase) {
            resolve();
        } else {
            const checkSupabase = setInterval(() => {
                if (window.supabaseService?.supabase) {
                    clearInterval(checkSupabase);
                    resolve();
                }
            }, 100);
        }
    });
}

// Load user settings from localStorage
function loadUserSettings() {
    // Load theme
    const savedTheme = localStorage.getItem('findmydocs_theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    
    // Load language
    const savedLanguage = localStorage.getItem('findmydocs_language') || 'pt';
    currentLanguage = savedLanguage;
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }
    updateTranslations();
}

// Setup all event listeners
function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleEmailLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleEmailRegister);
    }
    
    // Demo login button
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', handleDemoLogin);
    }
    
    // Show login modal button
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => openModal('login-modal'));
    }
    
    // Show register modal button
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => openModal('register-modal'));
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Language selector
    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
    
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const section = e.currentTarget.getAttribute('data-section');
            if (section) {
                showSection(section);
                updateActiveNavLink(e.currentTarget);
            }
        });
    });
    
    // Modal buttons
    if (addDocumentBtn) {
        addDocumentBtn.addEventListener('click', () => openModal('document-modal'));
    }
    
    if (reportLostBtn) {
        reportLostBtn.addEventListener('click', () => openModal('lost-modal'));
    }
    
    if (reportFoundBtn) {
        reportFoundBtn.addEventListener('click', () => openModal('found-modal'));
    }
    
    // Form submissions
    if (documentForm) {
        documentForm.addEventListener('submit', handleDocumentSubmit);
    }
    
    if (lostForm) {
        lostForm.addEventListener('submit', handleLostSubmit);
    }
    
    if (foundForm) {
        foundForm.addEventListener('submit', handleFoundSubmit);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Tip close buttons
    document.querySelectorAll('.tip-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const tipCard = e.target.closest('.tip-card');
            if (tipCard) {
                tipCard.style.display = 'none';
            }
        });
    });
    
    // Reset app button
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja resetar a aplicação? Todos os dados locais serão perdidos.')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
}

// Modal management functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Navigation functions
function updateActiveNavLink(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

// Utility functions
function updateDocumentCount() {
    // This will be updated when we load documents from Supabase
    const countElement = document.getElementById('document-count');
    if (countElement) {
        countElement.textContent = '0 total';
    }
}

function updateWelcomeMessage() {
    // This will be updated when we load user profile from Supabase
    const welcomeElement = document.getElementById('welcome-user-name');
    if (welcomeElement) {
        welcomeElement.textContent = 'Bem-vindo!';
    }
}

// GPS Location Functions
function initializeGeolocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                console.log('Location initialized:', currentLocation);
                showToast('Localização ativada', 'success');
                
                watchPositionId = navigator.geolocation.watchPosition(
                    updateCurrentLocation,
                    handleLocationError,
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
                );
            },
            handleLocationError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    } else {
        showToast('Geolocalização não suportada neste dispositivo', 'warning');
    }
}

function updateCurrentLocation(position) {
    currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
    };
}

function handleLocationError(error) {
    let message = 'Erro ao obter localização';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Permissão de localização negada';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Localização indisponível';
            break;
        case error.TIMEOUT:
            message = 'Timeout ao obter localização';
            break;
    }
    showToast(message, 'warning');
}

// Notification Functions
function initializeNotifications() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                notificationPermission = permission === 'granted';
                if (notificationPermission) {
                    showToast('Notificações ativadas', 'success');
                }
            });
        } else {
            notificationPermission = Notification.permission === 'granted';
        }
    }
}

// Translation function
function t(key) {
    return translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'tel')) {
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

// Theme Management
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

// Language Management
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('findmydocs_language', currentLanguage);
    updateTranslations();
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }
}

// Country Prefix Management
function setupCountryPrefix(selectId, flagId, prefixId) {
    const select = document.getElementById(selectId);
    const flag = document.getElementById(flagId);
    const prefix = document.getElementById(prefixId);
    
    if (select && flag && prefix) {
        select.addEventListener('change', function() {
            const selected = select.options[select.selectedIndex];
            const flagEmoji = selected.getAttribute('data-flag') || '';
            const prefixValue = selected.getAttribute('data-prefix') || '';
            flag.textContent = flagEmoji;
            prefix.textContent = prefixValue;
        });
        
        // Set default to Angola
        select.value = 'AO';
        flag.textContent = '🇦🇴';
        prefix.textContent = '+244';
    }
}

// Navigation Management
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
}

// Toast notification function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
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

// Authentication Functions
async function checkAuthState() {
    try {
        // Check if there's a current user session
        if (currentUser && isLoggedIn) {
            await showApp();
            return;
        }
        
        // Try to get user from Supabase
        const user = await window.supabaseService.getCurrentUser();
        if (user) {
            currentUser = user;
            isLoggedIn = true;
            await showApp();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLogin();
    }
}

async function handleEmailLogin(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!email || !password) {
            throw new Error('Por favor, preencha todos os campos');
        }
        
        const result = await window.supabaseService.signInWithEmail(email, password);
        
        if (result.success) {
            currentUser = result.user;
            isLoggedIn = true;
            showToast('Login realizado com sucesso!', 'success');
            closeModal('login-modal');
            await showApp();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Erro no login: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleEmailRegister(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(event.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const country = formData.get('country');
        const phone = formData.get('phone');
        
        if (!name || !email || !password || !confirmPassword || !country || !phone) {
            throw new Error('Por favor, preencha todos os campos');
        }
        
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem');
        }
        
        if (password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        
        const result = await window.supabaseService.signUpWithEmail(email, password, {
            name: name,
            phone: phone,
            country: country
        });
        
        if (result.success) {
            showToast('Conta criada com sucesso! Verifique seu email para confirmar.', 'success');
            closeModal('register-modal');
            openModal('login-modal');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('Erro no registro: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleDemoLogin() {
    showLoading(true);
    
    try {
        console.log('Starting demo login...');
        
        // Create a demo user session without Supabase authentication
        currentUser = {
            id: 'demo-user-' + Date.now(),
            email: 'demo@findmydocs.com',
            user_metadata: {
                name: 'Usuário Demo',
                phone: '+244123456789',
                country: 'AO'
            }
        };
        
        isLoggedIn = true;
        console.log('Demo user created:', currentUser);
        showToast('Bem-vindo! Você está usando a versão demo.', 'success');
        
        // Show app immediately without timeout
        console.log('Calling showApp...');
        await showApp();
        console.log('ShowApp completed');
        
        // Initialize notification system
        if (!documentMatchNotifier) {
            documentMatchNotifier = new DocumentMatchNotifier();
        }
        
    } catch (error) {
        console.error('Demo login error:', error);
        showToast('Erro no login demo: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    showLoading(true);
    
    try {
        const result = await window.supabaseService.signOut();
        
        if (result.success) {
            currentUser = null;
            isLoggedIn = false;
            showToast('Logout realizado com sucesso!', 'success');
            showLogin();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Erro no logout: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// UI Functions
function showLogin() {
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    
    if (loginSection) {
        loginSection.style.display = 'flex';
        loginSection.classList.remove('hidden');
    }
    if (appSection) {
        appSection.style.display = 'none';
        appSection.classList.add('hidden');
    }
}

async function showApp() {
    console.log('ShowApp function called');
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    
    console.log('Login section found:', !!loginSection);
    console.log('App section found:', !!appSection);
    
    if (loginSection) {
        loginSection.style.display = 'none';
        loginSection.classList.add('hidden');
        console.log('Login section hidden');
    }
    if (appSection) {
        appSection.style.display = 'block';
        appSection.classList.remove('hidden');
        console.log('App section shown, classes:', appSection.className);
    }
    
    // Load user data only if we have a real database connection
    try {
        if (currentUser && !currentUser.id.startsWith('demo-user')) {
            await loadUserProfile();
            await loadUserDocuments();
            await loadLostDocuments();
            await loadFoundDocuments();
        } else {
            // Demo mode - show mock data
            displayDemoData();
        }
        
        // Update UI
        updateDocumentCount();
        updateWelcomeMessage();
    } catch (error) {
        console.error('Error loading app data:', error);
        displayDemoData();
    }
}

function displayDemoData() {
    // Set demo profile data
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileDocuments = document.getElementById('profile-documents');
    const profilePoints = document.getElementById('profile-points');
    const profileHelped = document.getElementById('profile-helped');
    const welcomeUserName = document.getElementById('welcome-user-name');
    
    if (profileName) profileName.textContent = 'Usuário Demo';
    if (profileEmail) profileEmail.textContent = 'demo@findmydocs.com';
    if (profileDocuments) profileDocuments.textContent = '3';
    if (profilePoints) profilePoints.textContent = '150';
    if (profileHelped) profileHelped.textContent = '2';
    if (welcomeUserName) welcomeUserName.textContent = 'Bem-vindo, Usuário Demo!';
    
    // Update document count display
    const docCount = document.getElementById('document-count');
    if (docCount) docCount.textContent = '2';
    
    // Show demo documents
    const documentsGrid = document.getElementById('documents-grid');
    if (documentsGrid) {
        documentsGrid.innerHTML = `
            <div class="document-card">
                <div class="document-header">
                    <div class="document-type">
                        <i class="fas fa-id-card"></i>
                        <span>BI (Bilhete de Identidade)</span>
                    </div>
                    <div class="document-status active">
                        <span>Ativo</span>
                    </div>
                </div>
                <div class="document-content">
                    <h4>João Silva</h4>
                    <p class="document-number">123456789AO</p>
                    <p class="document-description">Documento de identidade principal</p>
                </div>
                <div class="document-actions">
                    <button class="btn small secondary" onclick="showToast('Funcionalidade disponível apenas com conta real', 'info')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </div>
            <div class="document-card">
                <div class="document-header">
                    <div class="document-type">
                        <i class="fas fa-id-card"></i>
                        <span>Carta de Condução</span>
                    </div>
                    <div class="document-status active">
                        <span>Ativo</span>
                    </div>
                </div>
                <div class="document-content">
                    <h4>João Silva</h4>
                    <p class="document-number">CC987654321</p>
                    <p class="document-description">Carta de condução categoria B</p>
                </div>
                <div class="document-actions">
                    <button class="btn small secondary" onclick="showToast('Funcionalidade disponível apenas com conta real', 'info')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </div>
        `;
    }
}

// Real-time notification system for document matches
class DocumentMatchNotifier {
    constructor() {
        this.matchedDocuments = new Set();
        this.notificationPermission = false;
        this.init();
    }
    
    async init() {
        // Request notification permission
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                this.notificationPermission = permission === 'granted';
            } else {
                this.notificationPermission = Notification.permission === 'granted';
            }
        }
        
        // Start checking for matches every 30 seconds
        setInterval(() => this.checkForMatches(), 30000);
        
        // Initial check
        setTimeout(() => this.checkForMatches(), 2000);
    }
    
    checkForMatches() {
        if (!currentUser || !isLoggedIn) return;
        
        const userDocuments = this.getUserDocuments();
        const lostDocuments = this.getLostDocuments();
        const foundDocuments = this.getFoundDocuments();
        
        // Check for matches between user's documents and found documents
        userDocuments.forEach(userDoc => {
            if (userDoc.status === 'lost') {
                foundDocuments.forEach(foundDoc => {
                    if (this.isDocumentMatch(userDoc, foundDoc)) {
                        const matchId = `${userDoc.id}-${foundDoc.id}`;
                        if (!this.matchedDocuments.has(matchId)) {
                            this.matchedDocuments.add(matchId);
                            this.showMatchNotification(userDoc, foundDoc, 'found');
                        }
                    }
                });
            }
        });
        
        // Check for matches between user's found reports and lost documents
        const userFoundReports = this.getUserFoundReports();
        userFoundReports.forEach(foundReport => {
            lostDocuments.forEach(lostDoc => {
                if (this.isDocumentMatch(foundReport, lostDoc)) {
                    const matchId = `${foundReport.id}-${lostDoc.id}`;
                    if (!this.matchedDocuments.has(matchId)) {
                        this.matchedDocuments.add(matchId);
                        this.showMatchNotification(foundReport, lostDoc, 'lost');
                    }
                }
            });
        });
    }
    
    isDocumentMatch(doc1, doc2) {
        // Match by document type
        if (doc1.type !== doc2.type) return false;
        
        // Match by name (fuzzy matching)
        if (doc1.name && doc2.name) {
            const name1 = doc1.name.toLowerCase().trim();
            const name2 = doc2.name.toLowerCase().trim();
            
            // Exact match
            if (name1 === name2) return true;
            
            // Similar names (Levenshtein distance)
            if (this.calculateSimilarity(name1, name2) > 0.8) return true;
        }
        
        // Match by document number
        if (doc1.number && doc2.number) {
            const num1 = doc1.number.replace(/\s/g, '').toLowerCase();
            const num2 = doc2.number.replace(/\s/g, '').toLowerCase();
            if (num1 === num2) return true;
        }
        
        // Match by location proximity (if both have location data)
        if (doc1.location && doc2.location) {
            const loc1 = doc1.location.toLowerCase();
            const loc2 = doc2.location.toLowerCase();
            if (loc1.includes(loc2) || loc2.includes(loc1)) return true;
        }
        
        return false;
    }
    
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    
    showMatchNotification(userDoc, matchDoc, type) {
        const title = type === 'found' 
            ? 'Possível Documento Encontrado!' 
            : 'Possível Proprietário Encontrado!';
            
        const body = type === 'found'
            ? `Seu documento ${userDoc.name} pode ter sido encontrado em ${matchDoc.location}`
            : `O documento ${matchDoc.name} que você encontrou pode pertencer a alguém`;
        
        // Browser notification
        if (this.notificationPermission) {
            const notification = new Notification(title, {
                body: body,
                icon: 'logofmd.jpg',
                tag: `match-${userDoc.id}-${matchDoc.id}`,
                requireInteraction: true
            });
            
            notification.onclick = () => {
                window.focus();
                this.showMatchModal(userDoc, matchDoc, type);
                notification.close();
            };
            
            setTimeout(() => notification.close(), 10000);
        }
        
        // In-app notification
        this.showInAppNotification(title, body, () => {
            this.showMatchModal(userDoc, matchDoc, type);
        });
        
        // Add notification badge
        this.addNotificationBadge();
    }
    
    showInAppNotification(title, body, onClick) {
        const notification = document.createElement('div');
        notification.className = 'match-notification';
        notification.innerHTML = `
            <div class="match-notification-content">
                <div class="match-notification-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="match-notification-text">
                    <h4>${title}</h4>
                    <p>${body}</p>
                </div>
                <div class="match-notification-actions">
                    <button class="match-notification-view">Ver</button>
                    <button class="match-notification-close">&times;</button>
                </div>
            </div>
        `;
        
        notification.querySelector('.match-notification-view').addEventListener('click', () => {
            onClick();
            notification.remove();
        });
        
        notification.querySelector('.match-notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        document.body.appendChild(notification);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 15000);
        
        // Slide in animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }
    
    showMatchModal(userDoc, matchDoc, type) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'match-modal';
        
        const isFoundMatch = type === 'found';
        const primaryDoc = isFoundMatch ? userDoc : matchDoc;
        const secondaryDoc = isFoundMatch ? matchDoc : userDoc;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isFoundMatch ? 'Documento Possivelmente Encontrado' : 'Possível Proprietário Encontrado'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="match-details">
                    <div class="match-score">
                        <div class="match-indicator">
                            <i class="fas fa-check-circle"></i>
                            <span>Match encontrado!</span>
                        </div>
                    </div>
                    
                    <div class="document-comparison">
                        <div class="doc-card">
                            <h4>${isFoundMatch ? 'Seu Documento Perdido' : 'Documento que Você Encontrou'}</h4>
                            <div class="doc-info">
                                <p><strong>Tipo:</strong> ${this.getDocumentTypeLabel(primaryDoc.type)}</p>
                                <p><strong>Nome:</strong> ${primaryDoc.name}</p>
                                ${primaryDoc.number ? `<p><strong>Número:</strong> ${primaryDoc.number}</p>` : ''}
                                <p><strong>Local:</strong> ${primaryDoc.location}</p>
                                ${primaryDoc.date ? `<p><strong>Data:</strong> ${new Date(primaryDoc.date).toLocaleDateString()}</p>` : ''}
                            </div>
                        </div>
                        
                        <div class="match-arrow">
                            <i class="fas fa-arrows-alt-h"></i>
                        </div>
                        
                        <div class="doc-card">
                            <h4>${isFoundMatch ? 'Documento Encontrado' : 'Documento Perdido'}</h4>
                            <div class="doc-info">
                                <p><strong>Tipo:</strong> ${this.getDocumentTypeLabel(secondaryDoc.type)}</p>
                                <p><strong>Nome:</strong> ${secondaryDoc.name}</p>
                                ${secondaryDoc.number ? `<p><strong>Número:</strong> ${secondaryDoc.number}</p>` : ''}
                                <p><strong>Local:</strong> ${secondaryDoc.location}</p>
                                ${secondaryDoc.contact ? `<p><strong>Contato:</strong> ${secondaryDoc.contact}</p>` : ''}
                                ${secondaryDoc.date ? `<p><strong>Data:</strong> ${new Date(secondaryDoc.date).toLocaleDateString()}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="match-actions">
                        <button class="btn primary" onclick="documentMatchNotifier.initiateContact('${secondaryDoc.id}', '${secondaryDoc.contact}')">
                            <i class="fas fa-phone"></i>
                            Entrar em Contato
                        </button>
                        <button class="btn secondary" onclick="documentMatchNotifier.reportMatch('${primaryDoc.id}', '${secondaryDoc.id}', ${isFoundMatch})">
                            <i class="fas fa-flag"></i>
                            Reportar Match
                        </button>
                        <button class="btn danger" onclick="documentMatchNotifier.dismissMatch('${primaryDoc.id}', '${secondaryDoc.id}')">
                            <i class="fas fa-times"></i>
                            Não é o Mesmo
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Close modal handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    getDocumentTypeLabel(type) {
        const types = {
            'bi': 'BI (Bilhete de Identidade)',
            'passaporte': 'Passaporte',
            'carta': 'Carta de Condução',
            'diri': 'Diri',
            'outros': 'Outros'
        };
        return types[type] || type;
    }
    
    initiateContact(docId, contact) {
        if (contact) {
            // Open chat modal or phone contact
            showToast(`Contato: ${contact}`, 'info');
            // You could implement a direct messaging system here
        } else {
            showToast('Informações de contato não disponíveis', 'warning');
        }
        document.getElementById('match-modal')?.remove();
    }
    
    reportMatch(doc1Id, doc2Id, isFoundMatch) {
        // Report successful match for analytics/improvement
        console.log('Match reported:', { doc1Id, doc2Id, isFoundMatch });
        showToast('Match reportado com sucesso!', 'success');
        document.getElementById('match-modal')?.remove();
    }
    
    dismissMatch(doc1Id, doc2Id) {
        // Add to dismissed matches to avoid showing again
        const dismissedKey = `dismissed-${doc1Id}-${doc2Id}`;
        localStorage.setItem(dismissedKey, 'true');
        this.matchedDocuments.delete(`${doc1Id}-${doc2Id}`);
        showToast('Match descartado', 'info');
        document.getElementById('match-modal')?.remove();
    }
    
    addNotificationBadge() {
        // Add a notification badge to the navigation
        const navLink = document.querySelector('.nav-link[data-section="feed"]');
        if (navLink && !navLink.querySelector('.notification-badge')) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = '!';
            navLink.appendChild(badge);
        }
    }
    
    getUserDocuments() {
        // Get user's personal documents from localStorage or return demo data
        if (currentUser && currentUser.id.startsWith('demo-user')) {
            return [
                {
                    id: 'demo-doc-1',
                    type: 'bi',  
                    name: 'João Silva',
                    number: '123456789AO',
                    location: 'Luanda',
                    status: 'lost',
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
        }
        
        try {
            return JSON.parse(localStorage.getItem('user_documents') || '[]');
        } catch {
            return [];
        }
    }
    
    getLostDocuments() {
        // Get lost documents from localStorage or return demo data
        if (currentUser && currentUser.id.startsWith('demo-user')) {
            return [
                {
                    id: 'lost-demo-1',
                    type: 'carta',
                    name: 'Maria Santos',
                    number: 'CC987654',
                    location: 'Maputo',
                    contact: '+258 84 123 4567',
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'lost-demo-2', 
                    type: 'passaporte',
                    name: 'Pedro Costa',
                    number: 'PT123456',
                    location: 'Porto',
                    contact: '+351 91 234 5678',
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
        }
        
        try {
            return JSON.parse(localStorage.getItem('lost_documents') || '[]');
        } catch {
            return [];
        }
    }
    
    getFoundDocuments() {
        // Get found documents from localStorage or return demo data
        if (currentUser && currentUser.id.startsWith('demo-user')) {
            return [
                {
                    id: 'found-demo-1',
                    type: 'bi',
                    name: 'João Silva',
                    number: '123456789AO', 
                    location: 'Luanda, Rua da Missão',
                    contact: '+244 92 345 6789',
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'found-demo-2',
                    type: 'carta',
                    name: 'Ana Ferreira',
                    number: 'CC456789',
                    location: 'Benguela',
                    contact: '+244 93 456 7890', 
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
        }
        
        try {
            return JSON.parse(localStorage.getItem('found_documents') || '[]');
        } catch {
            return [];
        }
    }
    
    getUserFoundReports() {
        // Get documents that the current user reported as found
        try {
            const foundDocs = JSON.parse(localStorage.getItem('found_documents') || '[]');
            return foundDocs.filter(doc => doc.reporterId === currentUser?.id);
        } catch {
            return [];
        }
    }
}

// Initialize the notification system
let documentMatchNotifier;

function showLoading(show) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        if (show) {
            loadingSpinner.style.display = 'flex';
        } else {
            loadingSpinner.style.display = 'none';
        }
    }
}

// Data Loading Functions
async function loadUserProfile() {
    try {
        const result = await window.supabaseService.getUserProfile();
        
        if (result.success && result.profile) {
            const profile = result.profile;
            
            // Update profile display
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            const profileDocuments = document.getElementById('profile-documents');
            const profilePoints = document.getElementById('profile-points');
            const profileHelped = document.getElementById('profile-helped');
            
            if (profileName) profileName.textContent = profile.name || 'Usuário';
            if (profileEmail) profileEmail.textContent = profile.email || '';
            if (profileDocuments) profileDocuments.textContent = profile.documents_count || 0;
            if (profilePoints) profilePoints.textContent = profile.points || 0;
            if (profileHelped) profileHelped.textContent = profile.helped_count || 0;
            
            // Update welcome message
            const welcomeUserName = document.getElementById('welcome-user-name');
            if (welcomeUserName) {
                welcomeUserName.textContent = `Bem-vindo, ${profile.name || 'Usuário'}!`;
            }
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

async function loadUserDocuments() {
    try {
        const result = await window.supabaseService.getUserDocuments();
        
        if (result.success) {
            displayDocuments(result.documents || []);
        } else {
            console.error('Load documents error:', result.error);
        }
    } catch (error) {
        console.error('Load documents error:', error);
    }
}

async function loadLostDocuments(filters = {}) {
    try {
        const result = await window.supabaseService.getLostDocuments(filters);
        
        if (result.success) {
            displayLostDocuments(result.documents || []);
        } else {
            console.error('Load lost documents error:', result.error);
        }
    } catch (error) {
        console.error('Load lost documents error:', error);
    }
}

async function loadFoundDocuments(filters = {}) {
    try {
        const result = await window.supabaseService.getFoundDocuments(filters);
        
        if (result.success) {
            displayFoundDocuments(result.documents || []);
        } else {
            console.error('Load found documents error:', result.error);
        }
    } catch (error) {
        console.error('Load found documents error:', error);
    }
}

// Document Management Functions
async function handleDocumentSubmit(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(event.target);
        const documentData = {
            type: formData.get('type'),
            name: formData.get('name'),
            number: formData.get('number'),
            description: formData.get('description') || ''
        };
        
        // Handle image upload
        const imageFile = formData.get('image');
        if (imageFile && imageFile.size > 0) {
            const uploadResult = await window.supabaseService.uploadFile(imageFile);
            if (uploadResult.success) {
                documentData.image_url = uploadResult.url;
            }
        }
        
        const result = await window.supabaseService.createDocument(documentData);
        
        if (result.success) {
            showToast('Documento adicionado com sucesso!', 'success');
            closeModal('document-modal');
            await loadUserDocuments();
            await loadUserProfile();
            updateDocumentCount();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Document submit error:', error);
        showToast('Erro ao adicionar documento: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleLostSubmit(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(event.target);
        const reportData = {
            type: formData.get('type'),
            name: formData.get('name'),
            location: formData.get('location'),
            description: formData.get('description'),
            contact: formData.get('contact'),
            country: 'AO', // Default for now
            province: 'Luanda' // Default for now
        };
        
        // Add current location if available
        if (currentLocation) {
            reportData.latitude = currentLocation.latitude;
            reportData.longitude = currentLocation.longitude;
        }
        
        // Handle image upload
        const imageFile = formData.get('image');
        if (imageFile && imageFile.size > 0) {
            const uploadResult = await window.supabaseService.uploadFile(imageFile);
            if (uploadResult.success) {
                reportData.image_url = uploadResult.url;
            }
        }
        
        const result = await window.supabaseService.createLostReport(reportData);
        
        if (result.success) {
            showToast('Documento perdido reportado com sucesso!', 'success');
            closeModal('lost-modal');
            await loadLostDocuments();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Lost report submit error:', error);
        showToast('Erro ao reportar documento perdido: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleFoundSubmit(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(event.target);
        const reportData = {
            type: formData.get('type'),
            name: formData.get('name'),
            location: formData.get('location'),
            description: formData.get('description'),
            contact: formData.get('contact'),
            country: 'AO', // Default for now
            province: 'Luanda' // Default for now
        };
        
        // Add current location if available
        if (currentLocation) {
            reportData.latitude = currentLocation.latitude;
            reportData.longitude = currentLocation.longitude;
        }
        
        // Handle image upload
        const imageFile = formData.get('image');
        if (imageFile && imageFile.size > 0) {
            const uploadResult = await window.supabaseService.uploadFile(imageFile);
            if (uploadResult.success) {
                reportData.image_url = uploadResult.url;
            }
        }
        
        const result = await window.supabaseService.createFoundReport(reportData);
        
        if (result.success) {
            showToast('Documento encontrado reportado com sucesso! Obrigado por ajudar!', 'success');
            closeModal('found-modal');
            await loadFoundDocuments();
            await loadUserProfile(); // Refresh to show updated points
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Found report submit error:', error);
        showToast('Erro ao reportar documento encontrado: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display Functions
function displayDocuments(documents) {
    const grid = document.getElementById('documents-grid');
    
    if (!documents || documents.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Nenhum documento adicionado ainda</h3>
                <p>Clique em "Adicionar Novo Documento" para adicionar seu primeiro documento.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = documents.map(doc => `
        <div class="document-card" data-id="${doc.id}">
            <div class="document-header">
                <div class="document-type">
                    <i class="fas fa-id-card"></i>
                    <span>${getDocumentTypeName(doc.type)}</span>
                </div>
                <div class="document-status ${doc.status}">
                    <span>${getStatusName(doc.status)}</span>
                </div>
            </div>
            <div class="document-content">
                <h4>${doc.name}</h4>
                <p class="document-number">${doc.number}</p>
                ${doc.description ? `<p class="document-description">${doc.description}</p>` : ''}
                ${doc.image_url ? `<img src="${doc.image_url}" alt="Documento" class="document-image">` : ''}
            </div>
            <div class="document-actions">
                <button class="btn small secondary" onclick="viewDocument('${doc.id}')">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn small primary" onclick="editDocument('${doc.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                ${doc.status === 'active' ? 
                    `<button class="btn small warning" onclick="markAsLost('${doc.id}')">
                        <i class="fas fa-exclamation-triangle"></i> Marcar como Perdido
                    </button>` : 
                    `<button class="btn small success" onclick="markAsFound('${doc.id}')">
                        <i class="fas fa-check"></i> Marcar como Encontrado
                    </button>`
                }
            </div>
            <div class="document-footer">
                <small>Criado em ${formatDate(doc.created_at)}</small>
            </div>
        </div>
    `).join('');
}

function displayLostDocuments(documents) {
    const grid = document.getElementById('lost-documents-grid');
    const countElement = document.getElementById('lost-count');
    
    if (countElement) {
        countElement.textContent = `${documents.length} documentos`;
    }
    
    if (!documents || documents.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum documento perdido reportado</h3>
                <p>Seja o primeiro a reportar um documento perdido.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = documents.map(doc => `
        <div class="document-card lost" data-id="${doc.id}">
            <div class="document-header">
                <div class="document-type">
                    <i class="fas fa-search"></i>
                    <span>${getDocumentTypeName(doc.type)}</span>
                </div>
                <div class="document-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${doc.location}</span>
                </div>
            </div>
            <div class="document-content">
                <h4>PERDIDO: ${doc.name}</h4>
                <p class="document-description">${doc.description}</p>
                ${doc.image_url ? `<img src="${doc.image_url}" alt="Documento perdido" class="document-image">` : ''}
            </div>
            <div class="document-actions">
                <button class="btn small primary" onclick="contactReporter('${doc.id}', 'lost')">
                    <i class="fas fa-phone"></i> Contatar
                </button>
                <button class="btn small success" onclick="claimDocument('${doc.id}', 'lost')">
                    <i class="fas fa-hand-paper"></i> Este é meu
                </button>
            </div>
            <div class="document-footer">
                <small>Reportado em ${formatDate(doc.created_at)} por ${doc.reporter?.name || 'Anônimo'}</small>
            </div>
        </div>
    `).join('');
}

function displayFoundDocuments(documents) {
    const grid = document.getElementById('found-documents-grid');
    const countElement = document.getElementById('found-count');
    
    if (countElement) {
        countElement.textContent = `${documents.length} documentos`;
    }
    
    if (!documents || documents.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-hand-holding"></i>
                <h3>Nenhum documento encontrado reportado</h3>
                <p>Ajude outros reportando documentos que você encontrou.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = documents.map(doc => `
        <div class="document-card found" data-id="${doc.id}">
            <div class="document-header">
                <div class="document-type">
                    <i class="fas fa-hand-holding"></i>
                    <span>${getDocumentTypeName(doc.type)}</span>
                </div>
                <div class="document-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${doc.location}</span>
                </div>
            </div>
            <div class="document-content">
                <h4>ENCONTRADO: ${doc.name}</h4>
                <p class="document-description">${doc.description}</p>
                ${doc.image_url ? `<img src="${doc.image_url}" alt="Documento encontrado" class="document-image">` : ''}
            </div>
            <div class="document-actions">
                <button class="btn small primary" onclick="contactFinder('${doc.id}', 'found')">
                    <i class="fas fa-phone"></i> Contatar
                </button>
                <button class="btn small success" onclick="claimDocument('${doc.id}', 'found')">
                    <i class="fas fa-hand-paper"></i> Este é meu
                </button>
            </div>
            <div class="document-footer">
                <small>Encontrado em ${formatDate(doc.created_at)} por ${doc.finder?.name || 'Anônimo'}</small>
            </div>
        </div>
    `).join('');
}

// Helper Functions
function getDocumentTypeName(type) {
    const types = {
        'bi': 'BI (Bilhete de Identidade)',
        'passaporte': 'Passaporte',
        'carta': 'Carta de Condução',
        'diri': 'Diri',
        'outros': 'Outros'
    };
    return types[type] || type;
}

function getStatusName(status) {
    const statuses = {
        'active': 'Ativo',
        'lost': 'Perdido',
        'found': 'Encontrado'
    };
    return statuses[status] || status;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString(currentLanguage === 'pt' ? 'pt-BR' : 'en-US');
}

function updateDocumentCount() {
    const grid = document.getElementById('documents-grid');
    const cards = grid.querySelectorAll('.document-card');
    const countElement = document.getElementById('document-count');
    
    if (countElement) {
        countElement.textContent = `${cards.length} total`;
    }
}

function updateWelcomeMessage() {
    // Hide tips section if user has documents
    const grid = document.getElementById('documents-grid');
    const cards = grid.querySelectorAll('.document-card');
    
    if (cards.length > 0 && welcomeTips) {
        welcomeTips.style.display = 'none';
    } else if (welcomeTips) {
        welcomeTips.style.display = 'block';
    }
}

// Location Services
function initializeLocationServices() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                console.log('Location initialized:', currentLocation);
                showToast('Localização ativada', 'success');
                
                watchPositionId = navigator.geolocation.watchPosition(
                    updateCurrentLocation,
                    handleLocationError,
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
                );
            },
            handleLocationError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    } else {
        showToast('Geolocalização não suportada neste dispositivo', 'warning');
    }
}

function updateCurrentLocation(position) {
    currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
    };
}

function handleLocationError(error) {
    let message = 'Erro ao obter localização';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Permissão de localização negada';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Localização indisponível';
            break;
        case error.TIMEOUT:
            message = 'Timeout ao obter localização';
            break;
    }
    showToast(message, 'warning');
}

function getSearchFilters(type) {
    const search = document.getElementById(`search-${type}`)?.value || '';
    const typeFilter = document.getElementById(`filter-${type}-type`)?.value || '';
    const countryFilter = document.getElementById(`filter-${type}-country`)?.value || '';
    const provinceFilter = document.getElementById(`filter-${type}-province`)?.value || '';
    
    return {
        search,
        type: typeFilter,
        country: countryFilter,
        province: provinceFilter
    };
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function generateId() {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// GPS Location Functions
function initializeGeolocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                console.log('Location initialized:', currentLocation);
                showToast('Localização ativada', 'success');
                
                watchPositionId = navigator.geolocation.watchPosition(
                    updateCurrentLocation,
                    handleLocationError,
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
                );
            },
            handleLocationError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    } else {
        showToast('Geolocalização não suportada neste dispositivo', 'warning');
    }
}

function updateCurrentLocation(position) {
    currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
    };
}

function handleLocationError(error) {
    let message = 'Erro ao obter localização';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Permissão de localização negada';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Localização indisponível';
            break;
        case error.TIMEOUT:
            message = 'Timeout ao obter localização';
            break;
    }
    showToast(message, 'warning');
}

// Notification Functions
function initializeNotifications() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                notificationPermission = permission === 'granted';
                if (notificationPermission) {
                    showToast('Notificações ativadas', 'success');
                }
            });
        } else {
            notificationPermission = Notification.permission === 'granted';
        }
    }
}

function showNotification(title, body, icon = null, data = null) {
    if (notificationPermission && 'Notification' in window) {
        const notification = new Notification(title, {
            body: body,
            icon: icon || '/favicon.ico',
            data: data,
            tag: 'findmydocs-notification'
        });
        
        notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            if (data && data.action) {
                handleNotificationClick(data);
            }
        };
        
        setTimeout(() => notification.close(), 5000);
    }
}

function handleNotificationClick(data) {
    if (data.action === 'view_document') {
        viewDocument(data.documentId);
    } else if (data.action === 'view_match') {
        showSection('feed');
    } else if (data.action === 'chat') {
        openChat(data.documentId);
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
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

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add click outside to close functionality
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
        
        // Add close button functionality
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modalId));
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Navigation Management
function showSection(sectionId) {
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
    
    // Load section-specific data
    if (sectionId === 'relatar-perda') {
        loadLostDocuments();
    } else if (sectionId === 'relatar-encontrado') {
        loadFoundDocuments();
    } else if (sectionId === 'perfil') {
        loadUserProfile();
    }
}

// Document Actions
async function viewDocument(documentId) {
    // Implementation for viewing document details
    console.log('View document:', documentId);
}

async function editDocument(documentId) {
    // Implementation for editing document
    console.log('Edit document:', documentId);
}

async function markAsLost(documentId) {
    if (confirm('Tem certeza de que deseja marcar este documento como perdido?')) {
        try {
            const result = await window.supabaseService.updateDocument(documentId, { status: 'lost' });
            if (result.success) {
                showToast('Documento marcado como perdido', 'success');
                await loadUserDocuments();
            }
        } catch (error) {
            showToast('Erro ao marcar documento como perdido', 'error');
        }
    }
}

async function markAsFound(documentId) {
    try {
        const result = await window.supabaseService.updateDocument(documentId, { status: 'active' });
        if (result.success) {
            showToast('Documento marcado como encontrado', 'success');
            await loadUserDocuments();
        }
    } catch (error) {
        showToast('Erro ao marcar documento como encontrado', 'error');
    }
}

function contactReporter(documentId, type) {
    // Implementation for contacting document reporter
    console.log('Contact reporter:', documentId, type);
}

function contactFinder(documentId, type) {
    // Implementation for contacting document finder
    console.log('Contact finder:', documentId, type);
}

function claimDocument(documentId, type) {
    // Implementation for claiming document
    console.log('Claim document:', documentId, type);
}

// Settings Management
function loadUserSettings() {
    // Load theme
    const savedTheme = localStorage.getItem('findmydocs_theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    
    // Load language
    const savedLanguage = localStorage.getItem('findmydocs_language') || 'pt';
    currentLanguage = savedLanguage;
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }
    updateTranslations();
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
    updateTranslations();
    if (languageSelector) {
        languageSelector.value = currentLanguage;
    }
}

function t(key) {
    return translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'tel')) {
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

// Country Prefix Management
function setupCountryPrefix(selectId, flagId, prefixId) {
    const select = document.getElementById(selectId);
    const flag = document.getElementById(flagId);
    const prefix = document.getElementById(prefixId);
    
    if (select && flag && prefix) {
        select.addEventListener('change', function() {
            const selected = select.options[select.selectedIndex];
            const flagEmoji = selected.getAttribute('data-flag') || '';
            const prefixValue = selected.getAttribute('data-prefix') || '';
            flag.textContent = flagEmoji;
            prefix.textContent = prefixValue;
        });
        
        // Set default to Angola
        select.value = 'AO';
        flag.textContent = '🇦🇴';
        prefix.textContent = '+244';
    }
}

// Reset App
async function resetApp() {
    if (confirm('Tem certeza de que deseja resetar a aplicação? Todos os dados serão perdidos.')) {
        try {
            await handleLogout();
            localStorage.clear();
            location.reload();
        } catch (error) {
            console.error('Reset app error:', error);
            showToast('Erro ao resetar aplicação', 'error');
        }
    }
}

// New Authentication Functions
async function handleRegisterSubmit(e) {
    e.preventDefault();
    showLoading(true);
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const country = formData.get('country');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (!name || !email || !country || !phone || !password || !confirmPassword) {
        showToast('Por favor, preencha todos os campos', 'error');
        showLoading(false);
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('As senhas não coincidem', 'error');
        showLoading(false);
        return;
    }
    
    if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres', 'error');
        showLoading(false);
        return;
    }
    
    try {
        const result = await window.supabaseService.signUpWithEmail(email, password, {
            name: name,
            phone: phone,
            country: country
        });
        
        if (result.error) {
            throw result.error;
        }
        
        showToast('Conta criada com sucesso! Faça login para continuar.', 'success');
        closeModal('register-modal');
        openModal('login-modal');
        
    } catch (error) {
        console.error('Register error:', error);
        showToast('Erro ao criar conta: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Export for global access
window.showSection = showSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.viewDocument = viewDocument;
window.editDocument = editDocument;
window.markAsLost = markAsLost;
window.markAsFound = markAsFound;
window.contactReporter = contactReporter;
window.contactFinder = contactFinder;
window.claimDocument = claimDocument;
window.handleRegisterSubmit = handleRegisterSubmit;
