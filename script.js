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

// Storage keys (keeping for theme and language preferences only)
const STORAGE_KEYS = {
    LANGUAGE: 'findmydocs_language',
    THEME: 'findmydocs_theme'
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Load saved preferences
    currentLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'pt';
    currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    
    // Apply theme and language
    document.body.setAttribute('data-theme', currentTheme);
    updateTranslations();
    
    // Initialize auth state listener
    await auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            handleUserSignedIn(session.user);
        } else if (event === 'SIGNED_OUT') {
            handleUserSignedOut();
        }
    });
    
    // Check if user is already logged in
    const user = await auth.getCurrentUser();
    if (user) {
        await handleUserSignedIn(user);
    } else {
        showLogin();
    }
    
    // Initialize event listeners
    initializeEventListeners();
});

// Event listeners
function initializeEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-app')?.addEventListener('click', toggleTheme);
    
    // Language toggle
    document.getElementById('lang-pt')?.addEventListener('click', () => setLanguage('pt'));
    document.getElementById('lang-en')?.addEventListener('click', () => setLanguage('en'));
    
    // Auth forms
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    document.getElementById('signup-btn')?.addEventListener('click', () => showModal('signup-modal'));
    document.getElementById('google-login-btn')?.addEventListener('click', handleGoogleLogin);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Document management
    document.getElementById('add-document')?.addEventListener('click', () => showModal('document-modal'));
    document.getElementById('document-form')?.addEventListener('submit', handleAddDocument);
    
    // Lost/Found forms
    document.getElementById('lost-form')?.addEventListener('submit', handleReportLost);
    document.getElementById('found-form')?.addEventListener('submit', handleReportFound);
    
    // Feed tabs
    document.querySelectorAll('.feed-tab').forEach(tab => {
        tab.addEventListener('click', handleFeedTabChange);
    });
    
    // Feed filters
    document.getElementById('feed-type-filter')?.addEventListener('change', handleFeedFilterChange);
    document.getElementById('feed-search')?.addEventListener('input', debounce(handleFeedFilterChange, 500));
    
    // Chat
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
    document.getElementById('send-message')?.addEventListener('click', handleSendMessage);
    
    // Location
    document.getElementById('lost-location-btn')?.addEventListener('click', () => openLocationModal('lost'));
    document.getElementById('found-location-btn')?.addEventListener('click', () => openLocationModal('found'));
    document.getElementById('confirm-location')?.addEventListener('click', confirmLocation);
    
    // File uploads
    setupFileUpload('document-upload-area', 'document-files');
    setupFileUpload('lost-upload-area', 'lost-files');
    setupFileUpload('found-upload-area', 'found-files');
    
    // Modal management
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // Bottom navigation
    setupBottomNavigation();
    
    // Upgrade button
    document.getElementById('upgrade-btn')?.addEventListener('click', () => showModal('upgrade-modal'));
    
    // Profile actions
    document.getElementById('change-avatar-btn')?.addEventListener('click', () => {
        document.getElementById('avatar-upload').click();
    });
    document.getElementById('avatar-upload')?.addEventListener('change', handleAvatarUpload);
    
    // Country prefix setup
    setupCountryPrefix('lost-country', 'lost-prefix');
    setupCountryPrefix('found-country', 'found-prefix');
}

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        await auth.signIn(email, password);
        showToast(t('message.login_success') || 'Login realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Erro no login. Verifique suas credenciais.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const firstName = document.getElementById('signup-first-name').value;
        const lastName = document.getElementById('signup-last-name').value;
        
        await auth.signUp(email, password, {
            first_name: firstName,
            last_name: lastName
        });
        
        hideModal('signup-modal');
        showToast('Conta criada com sucesso! Verifique seu email.', 'success');
    } catch (error) {
        console.error('Signup error:', error);
        showToast(error.message || 'Erro ao criar conta.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleGoogleLogin() {
    try {
        await auth.signInWithGoogle();
    } catch (error) {
        console.error('Google login error:', error);
        showToast(error.message || 'Erro no login com Google.', 'error');
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showToast('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Erro no logout.', 'error');
    }
}

async function handleUserSignedIn(user) {
    currentUser = user;
    
    try {
        // Get or create user profile
        try {
            currentUserProfile = await database.getUserProfile(user.id);
        } catch (error) {
            if (error.code === 'PGRST116') { // Not found
                currentUserProfile = await database.createUserProfile(user);
            } else {
                throw error;
            }
        }
        
        // Update UI
        updateUserInterface();
        
        // Load user data
        await loadUserDocuments();
        await loadFeedData();
        
        // Setup realtime subscriptions
        setupRealtimeSubscriptions();
        
        showApp();
    } catch (error) {
        console.error('Error handling signed in user:', error);
        showToast('Erro ao carregar dados do usuário.', 'error');
    }
}

function handleUserSignedOut() {
    currentUser = null;
    currentUserProfile = null;
    
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
        
        // Check free plan limits
        if (!currentUserProfile.is_premium) {
            const userDocs = await database.getUserDocuments(currentUser.id);
            if (userDocs.length >= 1) {
                showModal('upgrade-modal');
                return;
            }
        }
        
        // Upload files if any
        let uploadedFiles = [];
        if (files.length > 0) {
            const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            uploadedFiles = await storage.uploadDocumentFiles(Array.from(files), documentId);
        }
        
        // Create document
        const documentData = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: currentUser.id,
            type: formData.get('type'),
            name: formData.get('name'),
            number: formData.get('number'),
            description: formData.get('description') || null,
            status: 'normal',
            files: uploadedFiles,
            created_at: new Date().toISOString()
        };
        
        await database.createDocument(documentData);
        
        // Reset form and close modal
        e.target.reset();
        hideModal('document-modal');
        
        // Reload documents
        await loadUserDocuments();
        
        showToast(t('message.document_added') || 'Documento adicionado com sucesso!', 'success');
    } catch (error) {
        console.error('Error adding document:', error);
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
        
        // Upload files if any
        let uploadedFiles = [];
        if (files.length > 0) {
            const documentId = `lost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            uploadedFiles = await storage.uploadDocumentFiles(Array.from(files), documentId);
        }
        
        // Create lost document report
        const documentData = {
            id: `lost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: currentUser.id,
            type: formData.get('document_type'),
            name: formData.get('document_name'),
            description: formData.get('description'),
            location: formData.get('location'),
            contact_info: formData.get('contact_info'),
            status: 'lost',
            files: uploadedFiles,
            latitude: selectedLocation?.lat || null,
            longitude: selectedLocation?.lng || null,
            created_at: new Date().toISOString()
        };
        
        await database.createDocument(documentData);
        
        // Reset form
        e.target.reset();
        selectedLocation = null;
        
        // Reload feed data
        await loadFeedData();
        
        showToast(t('message.lost_reported') || 'Documento perdido reportado com sucesso!', 'success');
    } catch (error) {
        console.error('Error reporting lost document:', error);
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
        
        // Upload files if any
        let uploadedFiles = [];
        if (files.length > 0) {
            const documentId = `found_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            uploadedFiles = await storage.uploadDocumentFiles(Array.from(files), documentId);
        }
        
        // Create found document report
        const documentData = {
            id: `found_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: currentUser.id,
            type: formData.get('document_type'),
            name: formData.get('document_name'),
            description: formData.get('description'),
            location: formData.get('location'),
            contact_info: formData.get('contact_info'),
            status: 'found',
            files: uploadedFiles,
            latitude: selectedLocation?.lat || null,
            longitude: selectedLocation?.lng || null,
            created_at: new Date().toISOString()
        };
        
        await database.createDocument(documentData);
        
        // Check for potential matches and create notification
        await checkForMatches(documentData);
        
        // Reset form
        e.target.reset();
        selectedLocation = null;
        
        // Reload feed data
        await loadFeedData();
        
        showToast(t('message.found_reported') || 'Documento encontrado reportado com sucesso!', 'success');
    } catch (error) {
        console.error('Error reporting found document:', error);
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
            <div class="message-content">${escapeHtml(message.message)}</div>
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
    const navItems = document.querySelectorAll('#bottom-nav-bar .nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const target = item.dataset.navTarget;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(target)?.classList.add('active');
            
            // Hide welcome tips if not on documents page
            const welcomeTips = document.getElementById('welcome-tips');
            if (welcomeTips) {
                welcomeTips.style.display = target === 'documentos' ? 'block' : 'none';
            }
        });
    });
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
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
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
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
