// Global variables
let currentUser = null;
let currentUserProfile = null;
let currentLanguage = 'pt';
let currentTheme = 'light';
let currentChat = null;
let feedSubscription = null;
let notificationSubscription = null;
let selectedLocation = null;
let currentMap = null;
let authInitialized = false;
let authCheckCompleted = false; // New flag to track auth check completion

// Storage keys
const STORAGE_KEYS = {
    LANGUAGE: 'findmydocs_language',
    THEME: 'findmydocs_theme'
};

// Helper function to show errors
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        toastContainer.appendChild(toast);
    } else {
        document.body.appendChild(toast);
    }
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Helper function to hide loading spinner
function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        // Add hidden class
        spinner.classList.add('hidden');
        
        // Force hide with inline styles (more aggressive)
        spinner.style.setProperty('display', 'none', 'important');
        spinner.style.setProperty('visibility', 'hidden', 'important');
        spinner.style.setProperty('opacity', '0', 'important');
        spinner.style.setProperty('z-index', '-1', 'important');
        spinner.style.setProperty('pointer-events', 'none', 'important');
        
        console.log('✅ Loading spinner hidden aggressively');
    } else {
        console.log('⚠️ Loading spinner element not found');
    }
}

// Force reset loading state (emergency function)
function forceResetLoadingState() {
    console.log('🚨 Force resetting loading state...');
    hideLoadingSpinner();
    authCheckCompleted = true;
    authInitialized = false;
    window.userSignInInProgress = false;
    window.appAlreadyShown = false;
    showLogin();
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starting app initialization...');
    
    try {
        // Load saved preferences
        currentLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'pt';
        currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
        
        // Apply theme and language
        document.body.setAttribute('data-theme', currentTheme);
        updateTranslations();
        
        // Wait for Supabase client to be initialized
        let attempts = 0;
        const maxAttempts = 50;
        
        console.log('⏳ Waiting for Supabase client...');
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            console.error('❌ Supabase client not initialized after maximum attempts');
            showError('Failed to initialize database connection. Please refresh the page.');
            hideLoadingSpinner();
            showLogin();
            return;
        }
        
        console.log('✅ Supabase client ready, setting up auth...');
        
        // Initialize authentication system (only if not already done)
        if (!authInitialized) {
            await initializeAuthentication();
        } else {
            console.log('⚠️ Authentication already initialized, skipping...');
        }
        
        // Set a fallback timeout to ensure login screen is shown
        setTimeout(() => {
            if (!authCheckCompleted) {
                console.warn('⚠️ Auth initialization timeout, showing login screen');
                hideLoadingSpinner();
                showLogin();
                authCheckCompleted = true;
            }
        }, 12000); // Reduced to 12 seconds
        
        // Initialize event listeners
        console.log('🔧 Setting up event listeners...');
        initializeEventListeners();
        
        // Test database connection
        console.log('🔍 Testing database connection...');
        const dbTestResult = await testDatabaseConnection();
        if (!dbTestResult) {
            console.warn('⚠️ Database connection failed, but continuing with auth...');
        }
        
        // Final safety check - if we're still loading after 20 seconds, force show login
        setTimeout(() => {
            if (!authCheckCompleted) {
                console.error('🚨 CRITICAL: App stuck in loading state, forcing login screen');
                hideLoadingSpinner();
                showLogin();
                authCheckCompleted = true;
            }
        }, 20000);
        
        // Additional safety check - hide spinner if user is already logged in
        setTimeout(() => {
            if (currentUser && !document.getElementById('loading-spinner')?.classList.contains('hidden')) {
                console.log('🔍 User logged in but spinner still visible, hiding...');
                hideLoadingSpinner();
            }
        }, 5000);
        
        console.log('✅ App initialization complete!');
        
    } catch (error) {
        console.error('❌ Unexpected error during initialization:', error);
        hideLoadingSpinner();
        showLogin();
    }
});

// Initialize authentication system
async function initializeAuthentication() {
    if (authInitialized) {
        console.log('⚠️ Authentication already initialized, skipping...');
        return;
    }
    
    try {
        // Set up auth state listener (only once)
        const { auth } = window.supabaseClient;
        
        // Track last processed event to prevent duplicates
        let lastProcessedEvent = null;
        let lastProcessedTime = 0;
        let isProcessingAuth = false; // Prevent concurrent auth processing
        
        auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth state changed:', event, session);
            
            // Prevent duplicate events within 2 seconds
            const now = Date.now();
            if (lastProcessedEvent === event && (now - lastProcessedTime) < 2000) {
                console.log('⚠️ Ignoring duplicate auth event:', event);
                return;
            }
            
            // Prevent concurrent processing
            if (isProcessingAuth) {
                console.log('⚠️ Auth event already being processed, skipping:', event);
                return;
            }
            
            lastProcessedEvent = event;
            lastProcessedTime = now;
            isProcessingAuth = true;
            
            try {
                if (event === 'SIGNED_IN' && session?.user) {
                    console.log('👤 Processing SIGNED_IN event for:', session.user.email);
                    await handleUserSignedIn(session.user);
                } else if (event === 'SIGNED_OUT') {
                    console.log('👤 Processing SIGNED_OUT event');
                    handleUserSignedOut();
                } else if (event === 'INITIAL_SESSION') {
                    if (session?.user) {
                        console.log('👤 User already logged in:', session.user.email);
                        await handleUserSignedIn(session.user);
                    } else {
                        console.log('👤 No user logged in, showing login screen');
                        hideLoadingSpinner();
                        showLogin();
                    }
                    authCheckCompleted = true;
                } else if (event === 'TOKEN_REFRESHED') {
                    console.log('🔄 Token refreshed');
                    if (!authCheckCompleted) {
                        // If we haven't completed auth check yet, wait for INITIAL_SESSION
                        console.log('⏳ Waiting for INITIAL_SESSION event...');
                        return;
                    }
                }
            } catch (error) {
                console.error('❌ Error processing auth event:', event, error);
                hideLoadingSpinner();
                showLogin();
                authCheckCompleted = true; // Mark as completed even on error
            } finally {
                isProcessingAuth = false;
            }
        });
        
        // Set a timeout to ensure we don't get stuck in loading state
        setTimeout(() => {
            if (!authCheckCompleted) {
                console.warn('⚠️ Auth check timeout, showing login screen');
                hideLoadingSpinner();
                showLogin();
                authCheckCompleted = true;
            }
        }, 8000); // Reduced to 8 seconds
        
        authInitialized = true;
        console.log('✅ Authentication system initialized');
        
    } catch (error) {
        console.error('❌ Error initializing authentication:', error);
        hideLoadingSpinner();
        showLogin();
        authCheckCompleted = true;
    }
}

// Event listeners
function initializeEventListeners() {
    try {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        const themeToggleApp = document.getElementById('theme-toggle-app');
        themeToggle?.addEventListener('click', toggleTheme);
        themeToggleApp?.addEventListener('click', toggleTheme);
        
        // Language toggle
        const langPt = document.getElementById('lang-pt');
        const langEn = document.getElementById('lang-en');
        langPt?.addEventListener('click', () => setLanguage('pt'));
        langEn?.addEventListener('click', () => setLanguage('en'));
        
        // Auth forms
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const signupBtn = document.getElementById('signup-btn');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        loginForm?.addEventListener('submit', handleLogin);
        signupForm?.addEventListener('submit', handleSignup);
        signupBtn?.addEventListener('click', () => showModal('signup-modal'));
        googleLoginBtn?.addEventListener('click', handleGoogleLogin);
        logoutBtn?.addEventListener('click', handleLogout);
        
        // Document management
        const addDocumentBtn = document.getElementById('add-document');
        const documentForm = document.getElementById('document-form');
        addDocumentBtn?.addEventListener('click', () => showModal('document-modal'));
        documentForm?.addEventListener('submit', handleAddDocument);
        
        // Lost/Found forms
        const lostForm = document.getElementById('lost-form');
        const foundForm = document.getElementById('found-form');
        lostForm?.addEventListener('submit', handleReportLost);
        foundForm?.addEventListener('submit', handleReportFound);
        
        // Feed tabs
        const feedTabs = document.querySelectorAll('.feed-tab');
        feedTabs.forEach(tab => {
            tab.addEventListener('click', handleFeedTabChange);
        });
        
        // Feed filters
        const feedTypeFilter = document.getElementById('feed-type-filter');
        const feedSearch = document.getElementById('feed-search');
        feedTypeFilter?.addEventListener('change', handleFeedFilterChange);
        feedSearch?.addEventListener('input', debounce(handleFeedFilterChange, 500));
        
        // Chat
        const chatInput = document.getElementById('chat-input');
        const sendMessageBtn = document.getElementById('send-message');
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });
        sendMessageBtn?.addEventListener('click', handleSendMessage);
        
        // Location
        const lostLocationBtn = document.getElementById('lost-location-btn');
        const foundLocationBtn = document.getElementById('found-location-btn');
        const confirmLocationBtn = document.getElementById('confirm-location');
        lostLocationBtn?.addEventListener('click', () => openLocationModal('lost'));
        foundLocationBtn?.addEventListener('click', () => openLocationModal('found'));
        confirmLocationBtn?.addEventListener('click', confirmLocation);
        
        // File uploads
        setupFileUpload('document-upload-area', 'document-files');
        setupFileUpload('lost-upload-area', 'lost-files');
        setupFileUpload('found-upload-area', 'found-files');
        
        // Modal management
        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                hideModal(modal.id);
            });
        });
        
        // Bottom navigation
        setupBottomNavigation();
        
        // Profile actions
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const avatarUpload = document.getElementById('avatar-upload');
        changeAvatarBtn?.addEventListener('click', () => {
            document.getElementById('avatar-upload').click();
        });
        avatarUpload?.addEventListener('change', handleAvatarUpload);
        
        // Country prefix setup
        setupCountryPrefix('lost-country', 'lost-prefix');
        setupCountryPrefix('found-country', 'found-prefix');
        
        console.log('✅ All event listeners set up successfully!');
        
    } catch (error) {
        console.error('❌ Error setting up event listeners:', error);
        throw error;
    }
}

// Test database connection
async function testDatabaseConnection() {
    try {
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Database connection failed:', error);
            if (error.message.includes('relation "users" does not exist')) {
                showToast('❌ Database tables not set up. Please run the database setup script first.', 'error');
            } else if (error.message.includes('permission denied')) {
                showToast('❌ Database permissions issue. Check your Supabase configuration.', 'error');
            } else {
                showToast('❌ Database connection error: ' + error.message, 'error');
            }
            return false;
        }
        
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database test failed:', error);
        showToast('❌ Cannot connect to database. Check your internet connection.', 'error');
        return false;
    }
}

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    // Validate form inputs
    if (!email) {
        showToast('Por favor, insira seu email.', 'error');
        document.getElementById('login-email').focus();
        return;
    }
    
    if (!password) {
        showToast('Por favor, insira sua senha.', 'error');
        document.getElementById('login-password').focus();
        return;
    }
    
    if (!email.includes('@')) {
        showToast('Por favor, insira um email válido.', 'error');
        document.getElementById('login-password').focus();
        return;
    }
    
    // Show loading state on the login form
    const loginForm = document.getElementById('login-form');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner-small"></div> Carregando...';
    
    try {
        console.log('🔐 Attempting login with email:', email);
        
        // Clear any existing sign-in progress flag
        if (window.userSignInInProgress) {
            window.userSignInInProgress = false;
        }
        
        const { auth } = window.supabaseClient;
        const { data, error } = await auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✅ Login request sent successfully');
        // The auth state change listener will handle the success case
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Erro no login. Verifique suas credenciais.';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email ou senha incorretos.';
        } else if (error.message.includes('missing email or phone')) {
            errorMessage = 'Por favor, insira email e senha.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor, confirme seu email antes de fazer login.';
        } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
        }
        
        showToast(errorMessage, 'error');
        
        // Reset form loading state
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const firstName = document.getElementById('signup-first-name').value.trim();
    const lastName = document.getElementById('signup-last-name').value.trim();
    
    // Validate form inputs
    if (!email) {
        showToast('Por favor, insira seu email.', 'error');
        document.getElementById('signup-email').focus();
        return;
    }
    
    if (!email.includes('@')) {
        showToast('Por favor, insira um email válido.', 'error');
        document.getElementById('signup-email').focus();
        return;
    }
    
    if (!password) {
        showToast('Por favor, insira uma senha.', 'error');
        document.getElementById('signup-password').focus();
        return;
    }
    
    if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
        document.getElementById('signup-password').focus();
        return;
    }
    
    if (!firstName) {
        showToast('Por favor, insira seu nome.', 'error');
        document.getElementById('signup-first-name').focus();
        return;
    }
    
    if (!lastName) {
        showToast('Por favor, insira seu sobrenome.', 'error');
        document.getElementById('signup-last-name').focus();
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('🔐 Attempting signup with email:', email);
        const { auth } = window.supabaseClient;
        await auth.signUp(email, password, {
            first_name: firstName,
            last_name: lastName
        });
        
        hideModal('signup-modal');
        showToast('Conta criada com sucesso! Verifique seu email para confirmar.', 'success');
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Erro ao criar conta.';
        
        if (error.message.includes('Database error saving new user')) {
            errorMessage = 'Erro no banco de dados. Verifique se o email já não está em uso.';
        } else if (error.message.includes('User already registered')) {
            errorMessage = 'Este email já está registrado. Tente fazer login.';
        } else if (error.message.includes('Password should be at least 6 characters')) {
            errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Por favor, insira um email válido.';
        }
        
        showToast(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleGoogleLogin() {
    try {
        const { auth } = window.supabaseClient;
        await auth.signInWithGoogle();
    } catch (error) {
        console.error('Google login error:', error);
        showToast(error.message || 'Erro no login com Google.', 'error');
    }
}

async function handleLogout() {
    try {
        const { auth } = window.supabaseClient;
        await auth.signOut();
        showToast('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Erro no logout.', 'error');
    }
}

async function handleUserSignedIn(user) {
    // Prevent multiple simultaneous sign-in handling
    if (window.userSignInInProgress) {
        console.log('⚠️ User sign-in already in progress, skipping...');
        return;
    }
    
    // Also check if we already have this user loaded
    if (currentUser && currentUser.id === user.id && window.appAlreadyShown) {
        console.log('⚠️ User already loaded and app shown, skipping...');
        return;
    }
    
    window.userSignInInProgress = true;
    console.log('👤 Handling user sign in for:', user.email);
    
    try {
        currentUser = user;
        
        // Get or create user profile
        try {
            currentUserProfile = await database.getUserProfile(user.id);
            console.log('✅ User profile found:', currentUserProfile);
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            // Fallback: try to create profile manually if trigger failed
            try {
                currentUserProfile = await database.createUserProfile(user);
                console.log('✅ User profile created manually:', currentUserProfile);
            } catch (createError) {
                console.error('❌ Failed to create user profile:', createError);
                throw createError;
            }
        }
        
        // Update UI
        updateUserInterface();
        
        // Load user data
        await loadUserDocuments();
        await loadFeedData();
        
        // Setup realtime subscriptions
        setupRealtimeSubscriptions();
        
        // Show the app
        showApp();
        
        // Show success message only if not already shown
        if (!window.appAlreadyShown) {
            showToast('Login realizado com sucesso!', 'success');
        }
        
        // Mark auth as completed and ensure loading spinner is hidden
        authCheckCompleted = true;
        hideLoadingSpinner();
        
    } catch (error) {
        console.error('Error handling signed in user:', error);
        showToast('Erro ao carregar dados do usuário.', 'error');
        // On error, still mark as completed and show login
        authCheckCompleted = true;
        hideLoadingSpinner();
        showLogin();
    } finally {
        window.userSignInInProgress = false;
    }
}

function handleUserSignedOut() {
    currentUser = null;
    currentUserProfile = null;
    
    // Reset app state flags
    window.appAlreadyShown = false;
    window.userSignInInProgress = false;
    authCheckCompleted = false; // Reset auth check for next login
    
    // Clean up subscriptions
    if (feedSubscription) {
        realtime.unsubscribe(feedSubscription);
        feedSubscription = null;
    }
    if (notificationSubscription) {
        realtime.unsubscribe(notificationSubscription);
        notificationSubscription = null;
    }
    
    showLogin();
}

// Document management
async function handleAddDocument(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(e.target);
        const files = document.getElementById('document-files').files;
        
        console.log('📁 Files to upload:', files.length);
        
        // Debug: Log all form data
        console.log('🔍 Form data entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        // Validate required fields
        const type = formData.get('document-type');
        const name = formData.get('document-name');
        const number = formData.get('document-number');
        
        console.log('🔍 Raw form values:', { type, name, number });
        
        if (!type || !name || !number) {
            console.error('❌ Missing required fields:', { type, name, number });
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        console.log('✅ Form validation passed:', { type, name, number });
        
        // Check free plan limits
        if (!currentUserProfile.is_premium) {
            const userDocs = await database.getUserDocuments(currentUser.id);
            if (userDocs.length >= 1) {
                showModal('upgrade-modal');
                return;
            }
        }
        
        // Create document first (let database generate the ID)
        const documentData = {
            user_id: currentUser.id,
            type: formData.get('document-type'),
            name: formData.get('document-name'),
            number: formData.get('document-number'),
            description: formData.get('document-description') || null,
            status: 'normal',
            files: [],
            created_at: new Date().toISOString()
        };
        
        console.log('📄 Creating document with data:', documentData);
        const createdDocument = await database.createDocument(documentData);
        console.log('✅ Document created:', createdDocument);
        
        // Upload files if any (using the real document ID)
        if (files.length > 0) {
            console.log('📤 Uploading files for document ID:', createdDocument.id);
            const uploadedFiles = await storage.uploadDocumentFiles(Array.from(files), createdDocument.id);
            console.log('📤 Files uploaded successfully:', uploadedFiles);
            
            // Update document with file information
            console.log('🔄 Updating document with files:', { files: uploadedFiles });
            const updatedDocument = await database.updateDocument(createdDocument.id, { files: uploadedFiles });
            console.log('✅ Document updated with files:', updatedDocument);
            
            // Verify the update worked by querying the document again
            console.log('🔍 Verifying document update...');
            const verificationDoc = await database.getDocumentById(createdDocument.id);
            console.log('🔍 Verification - Document after update:', verificationDoc);
            console.log('🔍 Verification - Files field:', verificationDoc.files);
        }
        
        // Reset form and close modal
        e.target.reset();
        hideModal('document-modal');
        
        // Reload documents
        await loadUserDocuments();
        
        showToast(t('message.document_added') || 'Documento adicionado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Error adding document:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        showToast(error.message || 'Erro ao adicionar documento.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleReportLost(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(e.target);
        const files = document.getElementById('lost-files').files;
        
        console.log('📁 Lost files to upload:', files.length);
        
        // Debug: Log all form data
        console.log('🔍 Lost form data entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        // Validate required fields
        const type = formData.get('lost-document-type');
        const name = formData.get('lost-document-name');
        const location = formData.get('lost-location');
        const contact = formData.get('lost-contact');
        
        console.log('🔍 Raw lost form values:', { type, name, location, contact });
        
        if (!type || !name || !location || !contact) {
            console.error('❌ Missing required fields for lost document:', { type, name, location, contact });
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        console.log('✅ Lost form validation passed:', { type, name, location, contact });
        
        // Create lost document report first (let database generate the ID)
        const documentData = {
            user_id: currentUser.id,
            type: formData.get('lost-document-type'),
            name: formData.get('lost-document-name'),
            description: formData.get('lost-description'),
            location: formData.get('lost-location'),
            contact_info: formData.get('lost-contact'),
            status: 'lost',
            files: [],
            latitude: selectedLocation?.lat || null,
            longitude: selectedLocation?.lng || null,
            created_at: new Date().toISOString()
        };
        
        console.log('📄 Creating lost document with data:', documentData);
        const createdDocument = await database.createDocument(documentData);
        console.log('✅ Lost document created:', createdDocument);
        
        // Upload files if any (using the real document ID)
        if (files.length > 0) {
            console.log('📤 Uploading lost files for document ID:', createdDocument.id);
            const uploadedFiles = await storage.uploadDocumentFiles(Array.from(files), createdDocument.id);
            console.log('📤 Lost files uploaded successfully:', uploadedFiles);
            
            // Update document with file information
            console.log('🔄 Updating lost document with files:', { files: uploadedFiles });
            const updatedDocument = await database.updateDocument(createdDocument.id, { files: uploadedFiles });
            console.log('✅ Lost document updated with files:', updatedDocument);
            
            // Verify the update worked by querying the document again
            console.log('🔍 Verifying lost document update...');
            const verificationDoc = await database.getDocumentById(createdDocument.id);
            console.log('🔍 Verification - Lost document after update:', verificationDoc);
            console.log('🔍 Verification - Files field:', verificationDoc.files);
        }
        
        // Reset form
        e.target.reset();
        selectedLocation = null;
        
        // Reload feed data
        await loadFeedData();
        
        showToast(t('message.lost_reported') || 'Documento perdido reportado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Error reporting lost document:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        showToast(error.message || 'Erro ao reportar documento perdido.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleReportFound(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(e.target);
        const files = document.getElementById('found-files').files;
        
        console.log('📁 Found files to upload:', files.length);
        
        // Debug: Log all form data
        console.log('🔍 Found form data entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        // Validate required fields
        const type = formData.get('found-document-type');
        const name = formData.get('found-document-name');
        const location = formData.get('found-location');
        const contact = formData.get('found-contact');
        
        console.log('🔍 Raw found form values:', { type, name, location, contact });
        
        if (!type || !name || !location || !contact) {
            console.error('❌ Missing required fields for found document:', { type, name, location, contact });
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        console.log('✅ Found form validation passed:', { type, name, location, contact });
        
        // Create found document report first (let database generate the ID)
        const documentData = {
            user_id: currentUser.id,
            type: formData.get('found-document-type'),
            name: formData.get('found-document-name'),
            description: formData.get('found-description'),
            location: formData.get('found-location'),
            contact_info: formData.get('found-contact'),
            status: 'found',
            files: [],
            latitude: selectedLocation?.lat || null,
            longitude: selectedLocation?.lng || null,
            created_at: new Date().toISOString()
        };
        
        console.log('📄 Creating found document with data:', documentData);
        const createdDocument = await database.createDocument(documentData);
        console.log('✅ Found document created:', createdDocument);
        
        // Upload files if any (using the real document ID)
        if (files.length > 0) {
            console.log('📤 Uploading found files for document ID:', createdDocument.id);
            const uploadedFiles = await storage.uploadDocumentFiles(Array.from(files), createdDocument.id);
            console.log('📤 Found files uploaded successfully:', uploadedFiles);
            
            // Update document with file information
            console.log('🔄 Updating found document with files:', { files: uploadedFiles });
            const updatedDocument = await database.updateDocument(createdDocument.id, { files: uploadedFiles });
            console.log('✅ Found document updated with files:', updatedDocument);
            
            // Verify the update worked by querying the document again
            console.log('🔍 Verifying found document update...');
            const verificationDoc = await database.getDocumentById(createdDocument.id);
            console.log('🔍 Verification - Found document after update:', verificationDoc);
            console.log('🔍 Verification - Files field:', verificationDoc.files);
        }
        
        // Check for potential matches and create notification
        await checkForMatches(createdDocument);
        
        // Reset form
        e.target.reset();
        selectedLocation = null;
        
        // Reload feed data
        await loadFeedData();
        
        showToast(t('message.found_reported') || 'Documento encontrado reportado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Error reporting found document:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        showToast(error.message || 'Erro ao reportar documento encontrado.', 'error');
    } finally {
        showLoading(false);
    }
}

// Data loading functions
async function loadUserDocuments() {
    try {
        const documents = await database.getUserDocuments(currentUser.id);
        renderDocuments(documents);
        updateDocumentStats(documents);
    } catch (error) {
        console.error('Error loading documents:', error);
        showToast('Erro ao carregar documentos.', 'error');
    }
}

async function loadFeedData() {
    try {
        const activeTab = document.querySelector('.feed-tab.active').dataset.tab;
        const filters = {
            type: document.getElementById('feed-type-filter').value,
            search: document.getElementById('feed-search').value
        };
        
        let documents;
        if (activeTab === 'lost') {
            documents = await database.getLostDocuments(filters);
        } else {
            documents = await database.getFoundDocuments(filters);
        }
        
        renderFeedData(documents, activeTab);
    } catch (error) {
        console.error('Error loading feed data:', error);
        showToast('Erro ao carregar feed.', 'error');
    }
}

// Render functions
function renderDocuments(documents) {
    const container = document.getElementById('documents-list');
    
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3 data-i18n="documents.no_documents">Nenhum documento adicionado ainda</h3>
                <p data-i18n="documents.add_first">Clique em "Adicionar Documento" para começar</p>
            </div>
        `;
        updateTranslations();
        return;
    }
    
    container.innerHTML = documents.map(doc => `
        <div class="document-card" data-document-id="${doc.id}">
            <div class="document-header">
                <div class="document-type">
                    <i class="fas ${getDocumentIcon(doc.type)}"></i>
                    <span data-i18n="type.${doc.type}">${t('type.' + doc.type)}</span>
                </div>
                <div class="document-status status-${doc.status}">
                    <span data-i18n="status.${doc.status}">${t('status.' + doc.status)}</span>
                </div>
            </div>
            <div class="document-content">
                <h3>${doc.name}</h3>
                ${doc.number ? `<p class="document-number">${doc.number}</p>` : ''}
                ${doc.description ? `<p class="document-description">${doc.description}</p>` : ''}
                <p class="document-date">${formatDate(doc.created_at)}</p>
            </div>
            <div class="document-actions">
                <button class="btn icon" onclick="viewDocument('${doc.id}')" data-i18n="documents.view" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn icon" onclick="editDocument('${doc.id}')" data-i18n="documents.edit" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${doc.status === 'normal' ? `
                    <button class="btn icon danger" onclick="markAsLost('${doc.id}')" data-i18n="documents.mark_lost" title="Marcar como Perdido">
                        <i class="fas fa-exclamation-triangle"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    updateTranslations();
}

function renderFeedData(documents, type) {
    const container = document.getElementById('feed-content');
    
    if (!documents || documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas ${type === 'lost' ? 'fa-search' : 'fa-hand-holding'}"></i>
                <h3 data-i18n="${type}.no_documents">Nenhum documento ${type === 'lost' ? 'perdido' : 'encontrado'}</h3>
                <p data-i18n="${type}.be_first">Seja o primeiro a reportar</p>
            </div>
        `;
        updateTranslations();
        return;
    }
    
    container.innerHTML = documents.map(doc => `
        <div class="feed-card" data-document-id="${doc.id}">
            <div class="feed-header">
                <div class="document-type">
                    <i class="fas ${getDocumentIcon(doc.type)}"></i>
                    <span data-i18n="type.${doc.type}">${t('type.' + doc.type)}</span>
                </div>
                <div class="feed-date">${formatDate(doc.created_at)}</div>
            </div>
            <div class="feed-content">
                <h3>${doc.name}</h3>
                ${doc.description ? `<p>${doc.description}</p>` : ''}
                <div class="feed-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${doc.location}</span>
                </div>
            </div>
            <div class="feed-actions">
                ${doc.user_id !== currentUser.id ? `
                    <button class="btn primary" onclick="startChat('${doc.id}')">
                        <i class="fas fa-comments"></i>
                        <span data-i18n="documents.contact">Contatar</span>
                    </button>
                ` : ''}
                ${doc.latitude && doc.longitude ? `
                    <button class="btn secondary" onclick="showLocation(${doc.latitude}, ${doc.longitude})">
                        <i class="fas fa-map"></i>
                        <span data-i18n="common.location">Localização</span>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    updateTranslations();
}

// Chat functions
async function startChat(documentId) {
    try {
        const document = await database.getDocumentById(documentId);
        currentChat = {
            documentId,
            document,
            otherUserId: document.user_id
        };
        
        await loadChatMessages();
        showModal('chat-modal');
        
        // Subscribe to new messages
        setupChatSubscription(documentId);
    } catch (error) {
        console.error('Error starting chat:', error);
        showToast('Erro ao iniciar conversa.', 'error');
    }
}

async function loadChatMessages() {
    if (!currentChat) return;
    
    try {
        const messages = await database.getChatMessages(currentChat.documentId);
        renderChatMessages(messages);
    } catch (error) {
        console.error('Error loading chat messages:', error);
        showToast('Erro ao carregar mensagens.', 'error');
    }
}

function renderChatMessages(messages) {
    const container = document.getElementById('chat-messages');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <p>Inicie a conversa enviando uma mensagem</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(message => `
        <div class="chat-message ${message.sender_id === currentUser.id ? 'own' : 'other'}">
            <div class="message-content">${message.message}</div>
            <div class="message-time">${formatTime(message.created_at)}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function handleSendMessage() {
    if (!currentChat) return;
    
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
        await database.createChat({
            document_id: currentChat.documentId,
            sender_id: currentUser.id,
            receiver_id: currentChat.otherUserId,
            message: message,
            created_at: new Date().toISOString()
        });
        
        input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Erro ao enviar mensagem.', 'error');
    }
}

// Location functions
function openLocationModal(context) {
    selectedLocation = null;
    showModal('location-modal');
    initializeMap();
}

function initializeMap() {
    const mapContainer = document.getElementById('map');
    
    // Initialize Leaflet map
    if (currentMap) {
        currentMap.remove();
    }
    
    currentMap = L.map('map').setView([-25.966, 32.583], 10); // Default to Maputo, Mozambique
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(currentMap);
    
    // Add click event
    currentMap.on('click', (e) => {
        selectedLocation = e.latlng;
        
        // Clear previous markers
        currentMap.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                currentMap.removeLayer(layer);
            }
        });
        
        // Add new marker
        L.marker([e.latlng.lat, e.latlng.lng]).addTo(currentMap);
        
        // Update location display
        document.getElementById('selected-location').innerHTML = `
            <p><strong>Localização selecionada:</strong></p>
            <p>Latitude: ${e.latlng.lat.toFixed(6)}</p>
            <p>Longitude: ${e.latlng.lng.toFixed(6)}</p>
        `;
    });
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            currentMap.setView([latitude, longitude], 13);
        });
    }
}

function confirmLocation() {
    if (!selectedLocation) {
        showToast('Por favor, selecione uma localização no mapa.', 'error');
        return;
    }
    
    // Update the relevant location input
    const activeForm = document.querySelector('.content-section.active form');
    if (activeForm) {
        const locationInput = activeForm.querySelector('input[id$="-location"]');
        if (locationInput) {
            locationInput.value = `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
        }
    }
    
    hideModal('location-modal');
    showToast('Localização selecionada com sucesso!', 'success');
}

function showLocation(lat, lng) {
    selectedLocation = { lat, lng };
    showModal('location-modal');
    initializeMap();
    
    setTimeout(() => {
        currentMap.setView([lat, lng], 15);
        L.marker([lat, lng]).addTo(currentMap);
    }, 500);
}

// Realtime subscriptions
function setupRealtimeSubscriptions() {
    // Subscribe to document updates
    feedSubscription = realtime.subscribeToDocumentUpdates((payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            loadFeedData();
        }
    });
    
    // Subscribe to notifications
    notificationSubscription = realtime.subscribeToNotifications(currentUser.id, (payload) => {
        if (payload.eventType === 'INSERT') {
            showNotification(payload.new);
        }
    });
}

function setupChatSubscription(documentId) {
    if (currentChat?.subscription) {
        realtime.unsubscribe(currentChat.subscription);
    }
    
    currentChat.subscription = realtime.subscribeToChats(documentId, (payload) => {
        if (payload.eventType === 'INSERT') {
            loadChatMessages();
        }
    });
}

// Utility functions
async function checkForMatches(foundDocument) {
    try {
        const lostDocuments = await database.getLostDocuments({
            type: foundDocument.type
        });
        
        // Simple matching logic - can be enhanced
        const matches = lostDocuments.filter(lost => 
            lost.type === foundDocument.type &&
            lost.user_id !== foundDocument.user_id
        );
        
        // Create notifications for potential matches
        for (const match of matches) {
            await database.createNotification({
                user_id: match.user_id,
                type: 'match_found',
                title: 'Possível documento encontrado!',
                message: `Alguém reportou ter encontrado um ${foundDocument.name} em ${foundDocument.location}`,
                data: { 
                    found_document_id: foundDocument.id,
                    lost_document_id: match.id
                },
                read: false,
                created_at: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error checking for matches:', error);
    }
}

async function markAsLost(documentId) {
    if (!confirm(t('message.confirm_mark_lost'))) return;
    
    try {
        await database.updateDocument(documentId, {
            status: 'lost',
            updated_at: new Date().toISOString()
        });
        
        await loadUserDocuments();
        await loadFeedData();
        
        showToast(t('message.document_marked_lost'), 'success');
    } catch (error) {
        console.error('Error marking document as lost:', error);
        showToast('Erro ao marcar documento como perdido.', 'error');
    }
}

async function viewDocument(documentId) {
    try {
        const document = await database.getDocumentById(documentId);
        // Implement document view modal
        console.log('View document:', document);
    } catch (error) {
        console.error('Error viewing document:', error);
    }
}

async function editDocument(documentId) {
    try {
        const document = await database.getDocumentById(documentId);
        // Implement document edit functionality
        console.log('Edit document:', document);
    } catch (error) {
        console.error('Error editing document:', error);
    }
}

function getDocumentIcon(type) {
    const icons = {
        'bi': 'fa-id-card',
        'passaporte': 'fa-passport',
        'carta': 'fa-car',
        'outros': 'fa-file-alt'
    };
    return icons[type] || 'fa-file-alt';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'pt' ? 'pt-BR' : 'en-US');
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString(currentLanguage === 'pt' ? 'pt-BR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// File upload setup
function setupFileUpload(areaId, inputId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    
    if (!area || !input) return;
    
    area.addEventListener('click', () => input.click());
    
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });
    
    area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
    });
    
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            input.files = files;
            updateFileUploadDisplay(area, files);
        }
    });
    
    input.addEventListener('change', (e) => {
        updateFileUploadDisplay(area, e.target.files);
    });
}

function updateFileUploadDisplay(area, files) {
    if (files.length > 0) {
        const fileNames = Array.from(files).map(f => f.name).join(', ');
        area.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
            <p>${files.length} arquivo(s) selecionado(s)</p>
            <small>${fileNames}</small>
        `;
    }
}

// Avatar upload
async function handleAvatarUpload(e) {
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
    
    try {
        showLoading(true);
        const avatarUrl = await storage.uploadAvatar(file, currentUser.id);
        
        // Update user profile
        await database.updateUserProfile(currentUser.id, { avatar_url: avatarUrl });
        
        // Update UI
        document.getElementById('user-avatar').src = avatarUrl;
        
        showToast('Foto de perfil atualizada!', 'success');
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showToast('Erro ao atualizar foto de perfil.', 'error');
    } finally {
        showLoading(false);
    }
}

// Country prefix setup
function setupCountryPrefix(selectId, prefixId) {
    const select = document.getElementById(selectId);
    const prefix = document.getElementById(prefixId);
    
    if (!select || !prefix) return;
    
    select.addEventListener('change', function() {
        const selected = select.options[select.selectedIndex];
        const p = selected.getAttribute('data-prefix') || '';
        prefix.textContent = p;
    });
    
    // Set default
    select.value = 'AO';
    prefix.textContent = '+244';
}

// Feed management
function handleFeedTabChange(e) {
    document.querySelectorAll('.feed-tab').forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    loadFeedData();
}

function handleFeedFilterChange() {
    loadFeedData();
}

// Bottom navigation
function setupBottomNavigation() {
    console.log('🧭 Setting up bottom navigation...');
    const navItems = document.querySelectorAll('#bottom-nav-bar .nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    console.log('📱 Found nav items:', navItems.length);
    console.log('📱 Found content sections:', sections.length);
    
    navItems.forEach((item, index) => {
        console.log(`📱 Nav item ${index}:`, item.dataset.navTarget);
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🧭 Nav item clicked:', item.dataset.navTarget);
            
            // Check if app section is visible before allowing navigation
            const appSection = document.getElementById('app-section');
            if (appSection && appSection.classList.contains('hidden')) {
                console.log('⚠️ App section is hidden, navigation blocked');
                return;
            }
            
            const target = item.dataset.navTarget;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            console.log('✅ Active nav item updated');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                console.log('📱 Section hidden:', section.id);
            });
            
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.classList.add('active');
                console.log('✅ Target section shown:', target);
            } else {
                console.error('❌ Target section not found:', target);
            }
            
            // Hide welcome tips if not on documents page
            const welcomeTips = document.getElementById('welcome-tips');
            if (welcomeTips) {
                welcomeTips.style.display = target === 'documentos' ? 'block' : 'none';
                console.log('📱 Welcome tips visibility updated for:', target);
            }
        });
    });
    
    console.log('✅ Bottom navigation setup complete');
}

// UI update functions
function updateUserInterface() {
    if (!currentUserProfile) return;
    
    // Update user info
    document.getElementById('user-name').textContent = 
        `${currentUserProfile.first_name} ${currentUserProfile.last_name}`;
    document.getElementById('user-email').textContent = currentUser.email;
    
    // Update points display
    document.querySelectorAll('.points-value').forEach(el => {
        el.textContent = currentUserProfile.points || 0;
    });
    document.getElementById('profile-points').textContent = currentUserProfile.points || 0;
    
    // Update avatar if available
    if (currentUserProfile.avatar_url) {
        document.getElementById('user-avatar').src = currentUserProfile.avatar_url;
    }
}

function updateDocumentStats(documents) {
    const total = documents.length;
    const lost = documents.filter(doc => doc.status === 'lost').length;
    
    document.getElementById('total-documents').textContent = total;
    document.getElementById('lost-documents').textContent = lost;
    document.getElementById('profile-documents').textContent = total;
}

// Theme and language functions
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
    
    // Update theme toggle icons
    const icons = document.querySelectorAll('#theme-toggle i, #theme-toggle-app i');
    icons.forEach(icon => {
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    });
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`lang-${lang}`).classList.add('active');
    
    updateTranslations();
}

// UI helper functions
function showApp() {
    // Prevent multiple app shows
    if (window.appAlreadyShown) {
        console.log('⚠️ App already shown, skipping...');
        return;
    }
    
    // Also check if we're already showing the app
    const appSection = document.getElementById('app-section');
    if (appSection && !appSection.classList.contains('hidden')) {
        console.log('⚠️ App section already visible, skipping...');
        return;
    }
    
    console.log('🚀 showApp() called');
    
    const loginSection = document.getElementById('login-section');
    
    if (loginSection) {
        loginSection.classList.add('hidden');
        loginSection.style.display = 'none';
        loginSection.style.visibility = 'hidden';
        loginSection.style.opacity = '0';
        loginSection.style.zIndex = '-1';
        console.log('✅ login-section hidden');
    }
    
    if (appSection) {
        appSection.classList.remove('hidden');
        appSection.style.display = 'block';
        appSection.style.visibility = 'visible';
        appSection.style.opacity = '1';
        appSection.style.zIndex = '1';
        console.log('✅ app-section shown');
        
        // Show the default content section (documentos)
        const defaultSection = document.getElementById('documentos');
        if (defaultSection) {
            defaultSection.classList.add('active');
            console.log('✅ Default content section shown:', defaultSection.id);
        }
        
        // Update bottom navigation to show first tab as active
        const firstNavItem = document.querySelector('#bottom-nav-bar .nav-item');
        if (firstNavItem) {
            document.querySelectorAll('#bottom-nav-bar .nav-item').forEach(item => item.classList.remove('active'));
            firstNavItem.classList.add('active');
            console.log('✅ Bottom navigation updated');
        }
        
        window.appAlreadyShown = true;
        
        // Ensure loading spinner is hidden when app is shown
        hideLoadingSpinner();
    }
}

function showLogin() {
    console.log('🔍 showLogin() called - looking for elements...');
    
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    
    console.log('📱 login-section found:', !!loginSection);
    console.log('📱 app-section found:', !!appSection);
    
    if (loginSection) {
        loginSection.classList.remove('hidden');
        loginSection.style.display = 'block';
        loginSection.style.visibility = 'visible';
        loginSection.style.opacity = '1';
        loginSection.style.zIndex = '1000';
        console.log('✅ login-section shown');
    } else {
        console.error('❌ login-section element not found!');
    }
    
    if (appSection) {
        appSection.classList.add('hidden');
        appSection.style.display = 'none';
        appSection.style.visibility = 'hidden';
        appSection.style.opacity = '0';
        appSection.style.zIndex = '-1';
        console.log('✅ app-section hidden');
        
        // Also hide all content sections inside the app section
        const contentSections = appSection.querySelectorAll('.content-section');
        contentSections.forEach(section => {
            section.classList.remove('active');
            console.log('📱 Content section hidden:', section.id);
        });
    } else {
        console.error('❌ app-section element not found!');
    }
    
    // Also make sure loading spinner is hidden
    hideLoadingSpinner();
    
    // Reset any form loading states
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    }
    
    console.log('🔍 Current page state:');
    console.log('  - login-section hidden:', loginSection?.classList.contains('hidden'));
    console.log('  - app-section hidden:', appSection?.classList.contains('hidden'));
    console.log('  - loading-spinner hidden:', document.getElementById('loading-spinner')?.classList.contains('hidden'));
}

function showModal(modalId) {
    console.log('🚪 showModal() called with modalId:', modalId);
    console.log('🔍 Stack trace:', new Error().stack);
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal shown:', modalId);
    } else {
        console.error('❌ Modal not found:', modalId);
    }
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Clean up chat subscription when closing chat modal
    if (modalId === 'chat-modal' && currentChat?.subscription) {
        realtime.unsubscribe(currentChat.subscription);
        currentChat = null;
    }
}

function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

function showNotification(notification) {
    showToast(notification.message, 'info');
    
    // Play notification sound if available
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Nps2MdBDuY3vLEbCcH');
        audio.play();
    } catch (e) {
        // Ignore if audio fails
    }
}

// Utility functions
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

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
}

function t(key) {
    return translations[currentLanguage]?.[key] || translations['pt']?.[key] || key;
}

// Export utility functions for debugging (available in browser console)
window.forceResetLoadingState = forceResetLoadingState;
window.hideLoadingSpinner = hideLoadingSpinner;
