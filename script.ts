// Interfaces
interface Document {
    id: number;
    title: string;
    type: string;
    fileName: string;
    status: 'safe' | 'lost';
    owner: string;
}

interface User {
    name: string;
    email: string;
    password?: string;
    isPremium: boolean;
    documents: Document[];
}

interface FoundDocument {
    id: number;
    title: string;
    type: string;
    location: string;
    reporter: string;
}

interface Message {
    sender: string;
    text: string;
    timestamp: number;
    readBy: string[];
}

interface Chat {
    id: string;
    lostDocId: number;
    foundDocId: number;
    participants: string[];
    messages: Message[];
    seenBy: string[];
}


document.addEventListener('DOMContentLoaded', () => {
    // Type assertions for DOM elements
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const signupForm = document.getElementById('signup-form') as HTMLFormElement;
    const demoBtn = document.getElementById('demo-btn') as HTMLButtonElement;
    const showSignup = document.getElementById('show-signup') as HTMLAnchorElement;
    const showLogin = document.getElementById('show-login') as HTMLAnchorElement;
    const loginFormContainer = document.getElementById('login-form-container') as HTMLDivElement;
    const signupFormContainer = document.getElementById('signup-form-container') as HTMLDivElement;
    const authPage = document.getElementById('auth-page') as HTMLDivElement;
    const mainPage = document.getElementById('main-page') as HTMLDivElement;
    const bannerContainer = document.getElementById('banner-container') as HTMLDivElement;
    const notificationContainer = document.getElementById('notification-container') as HTMLDivElement;

    // Check if user is already logged in
    const currentUserJSON = localStorage.getItem('currentUser');
    let currentUser: User | null = currentUserJSON ? JSON.parse(currentUserJSON) : null;

    if (currentUser) {
        loginUser(currentUser, currentUser.email === 'demo@example.com');
    }

    // Toggle between login and signup forms
    showSignup.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        loginFormContainer.style.display = 'none';
        signupFormContainer.style.display = 'block';
    });

    showLogin.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        signupFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
    });

    // Sign up
    signupForm.addEventListener('submit', (e: SubmitEvent) => {
        e.preventDefault();
        const name = (document.getElementById('signup-name') as HTMLInputElement).value;
        const email = (document.getElementById('signup-email') as HTMLInputElement).value;
        const password = (document.getElementById('signup-password') as HTMLInputElement).value;

        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const userExists = users.some(user => user.email === email);

        if (userExists) {
            alert('User with this email already exists.');
        } else {
            const newUser: User = { name, email, password, isPremium: false, documents: [] };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            loginUser(newUser, false);
        }
    });

    // Login
    loginForm.addEventListener('submit', (e: SubmitEvent) => {
        e.preventDefault();
        const email = (document.getElementById('login-email') as HTMLInputElement).value;
        const password = (document.getElementById('login-password') as HTMLInputElement).value;

        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(user => user.email === email && user.password === password);

        if (user) {
            loginUser(user, false);
        } else {
            alert('Invalid email or password.');
        }
    });

    // Demo login
    demoBtn.addEventListener('click', () => {
        const demoUser: User = { name: 'Demo User', email: 'demo@example.com', isPremium: true, documents: [] };
        loginUser(demoUser, true);
    });

    function loginUser(user: User, isDemo: boolean): void {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        authPage.style.display = 'none';
        mainPage.style.display = 'block';
        if (isDemo) {
            bannerContainer.innerHTML = '<div class="demo-banner">Demo Mode</div>';
            (document.querySelector('h1') as HTMLHeadingElement).insertAdjacentHTML('afterend', '<div class="demo-banner">Demo Mode</div>');
        }
        displayDocuments();
        checkNotifications();
        applyTheme();
    }

    // Dark Mode
    const darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLInputElement;

    function applyTheme(): void {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkModeToggle.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            darkModeToggle.checked = false;
        }
    }

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    applyTheme();

    // Notifications
    function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    function checkNotifications(): void {
        if (!currentUser) return;
        const chats: Chat[] = JSON.parse(localStorage.getItem('chats') || '[]');

        // New match notifications
        const unreadChats = chats.filter(chat => chat.participants.includes(currentUser!.email) && !chat.seenBy.includes(currentUser!.email));
        unreadChats.forEach(chat => {
            showNotification('You have a new document match!', 'success');
            const chatIndex = chats.findIndex(c => c.id === chat.id);
            chats[chatIndex].seenBy.push(currentUser!.email);
        });

        // New message notifications
        const userChats = chats.filter(chat => chat.participants.includes(currentUser!.email));
        userChats.forEach(chat => {
            const unreadMessages = chat.messages.filter(msg => msg.sender !== currentUser!.email && !msg.readBy.includes(currentUser!.email));
            if (unreadMessages.length > 0) {
                showNotification(`You have new messages in a chat.`, 'info');
            }
        });

        localStorage.setItem('chats', JSON.stringify(chats));
    }

    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn') as NodeListOf<HTMLButtonElement>;
    const pages = document.querySelectorAll('.page-content') as NodeListOf<HTMLDivElement>;

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page + '-page';

            pages.forEach(page => {
                page.style.display = page.id === pageId ? 'block' : 'none';
            });

            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const page = button.dataset.page;
            if (page === 'lost-feed') {
                displayLostFeed();
            } else if (page === 'found-feed') {
                displayFoundFeed();
            } else if (page === 'chat') {
                displayChatsList();
            } else if (page === 'account') {
                displayAccountPage();
            }
        });
    });

    // My Documents Page
    const addDocForm = document.getElementById('add-doc-form') as HTMLFormElement;
    const documentsList = document.getElementById('documents-list') as HTMLDivElement;

    addDocForm.addEventListener('submit', (e: SubmitEvent) => {
        e.preventDefault();
        const title = (document.getElementById('doc-title') as HTMLInputElement).value;
        const type = (document.getElementById('doc-type') as HTMLSelectElement).value;
        const fileInput = (document.getElementById('doc-file') as HTMLInputElement);
        const fileName = fileInput.files && fileInput.files.length > 0 ? fileInput.files[0].name : 'No file chosen';

        if (!currentUser) return;

        const newDoc: Document = {
            id: Date.now(),
            title,
            type,
            fileName,
            status: 'safe',
            owner: currentUser.email
        };

        if (!currentUser.isPremium && currentUser.documents.length >= 1) {
            alert('Free plan allows only 1 document. Upgrade to Premium for unlimited documents.');
            return;
        }

        currentUser.documents.push(newDoc);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }

        displayDocuments();
        addDocForm.reset();
    });

    function displayDocuments(): void {
        if (!currentUser) return;
        documentsList.innerHTML = '';
        if (currentUser.documents) {
            currentUser.documents.forEach(doc => {
                const docElement = document.createElement('div');
                docElement.classList.add('document-item');
                docElement.innerHTML = `
                    <h3>${doc.title}</h3>
                    <p><strong>Type:</strong> ${doc.type}</p>
                    <p><strong>File:</strong> ${doc.fileName}</p>
                    <p><strong>Status:</strong> ${doc.status}</p>
                `;
                if (doc.status === 'safe') {
                    const markAsLostBtn = document.createElement('button');
                    markAsLostBtn.textContent = 'Mark as Lost';
                    markAsLostBtn.addEventListener('click', () => markDocumentAsLost(doc.id));
                    docElement.appendChild(markAsLostBtn);
                }
                documentsList.appendChild(docElement);
            });
        }
    }

    function markDocumentAsLost(docId: number): void {
        if (!currentUser) return;
        const docIndex = currentUser.documents.findIndex(d => d.id === docId);
        if (docIndex !== -1) {
            currentUser.documents[docIndex].status = 'lost';
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.email === currentUser!.email);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('users', JSON.stringify(users));
            }
            displayDocuments();
            checkForMatches(currentUser.documents[docIndex]);
        }
    }

    // Lost Feed
    const lostDocumentsList = document.getElementById('lost-documents-list') as HTMLDivElement;
    const lostFilterType = document.getElementById('lost-filter-type') as HTMLSelectElement;
    const lostFilterDate = document.getElementById('lost-filter-date') as HTMLInputElement;

    lostFilterType.addEventListener('change', () => displayLostFeed());
    lostFilterDate.addEventListener('change', () => displayLostFeed());

    function displayLostFeed(): void {
        const filterType = lostFilterType.value;
        const filterDate = lostFilterDate.value;

        lostDocumentsList.innerHTML = '';
        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        let lostDocuments: Document[] = [];
        users.forEach(user => {
            const userLostDocs = user.documents.filter(doc => doc.status === 'lost');
            lostDocuments.push(...userLostDocs);
        });

        if (filterType) {
            lostDocuments = lostDocuments.filter(doc => doc.type === filterType);
        }
        if (filterDate) {
            lostDocuments = lostDocuments.filter(doc => new Date(doc.id).toLocaleDateString() === new Date(filterDate).toLocaleDateString());
        }

        lostDocuments.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.classList.add('document-item');
            docElement.innerHTML = `
                <h3>${doc.title}</h3>
                <p><strong>Type:</strong> ${doc.type}</p>
                <p><strong>Owner:</strong> ${doc.owner}</p>
                <p><strong>Date Lost:</strong> ${new Date(doc.id).toLocaleDateString()}</p>
            `;
            lostDocumentsList.appendChild(docElement);
        });
    }

    // Found Feed
    const foundFeedPage = document.getElementById('found-feed-page') as HTMLDivElement;
    foundFeedPage.insertAdjacentHTML('beforeend', `
        <h3>Report a Found Document</h3>
        <form id="found-doc-form">
            <input type="text" id="found-doc-title" placeholder="Document Title" required>
            <select id="found-doc-type" required>
                <option value="">Select Type</option>
                <option value="ID">ID Card</option>
                <option value="Passport">Passport</option>
                <option value="DriversLicense">Driver's License</option>
                <option value="Other">Other</option>
            </select>
            <input type="text" id="found-doc-location" placeholder="Location Found" required>
            <button type="submit">Report Found Document</button>
        </form>
        <div id="found-documents-list"></div>
    `);
    const foundDocForm = document.getElementById('found-doc-form') as HTMLFormElement;
    const foundDocumentsList = document.getElementById('found-documents-list') as HTMLDivElement;
    const foundFilterType = document.getElementById('found-filter-type') as HTMLSelectElement;
    const foundFilterDate = document.getElementById('found-filter-date') as HTMLInputElement;

    foundFilterType.addEventListener('change', () => displayFoundFeed());
    foundFilterDate.addEventListener('change', () => displayFoundFeed());

    foundDocForm.addEventListener('submit', (e: SubmitEvent) => {
        e.preventDefault();
        const title = (document.getElementById('found-doc-title') as HTMLInputElement).value;
        const type = (document.getElementById('found-doc-type') as HTMLSelectElement).value;
        const location = (document.getElementById('found-doc-location') as HTMLInputElement).value;

        if (!currentUser) return;

        const newFoundDoc: FoundDocument = {
            id: Date.now(),
            title,
            type,
            location,
            reporter: currentUser.email
        };

        const foundDocuments: FoundDocument[] = JSON.parse(localStorage.getItem('foundDocuments') || '[]');
        foundDocuments.push(newFoundDoc);
        localStorage.setItem('foundDocuments', JSON.stringify(foundDocuments));
        displayFoundFeed();
        foundDocForm.reset();

        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        users.forEach(user => {
            user.documents.forEach(doc => {
                if (doc.status === 'lost' && doc.title.toLowerCase() === newFoundDoc.title.toLowerCase() && doc.type === newFoundDoc.type) {
                    createChatSession(doc, newFoundDoc);
                }
            });
        });
    });

    function displayFoundFeed(): void {
        const filterType = foundFilterType.value;
        const filterDate = foundFilterDate.value;

        foundDocumentsList.innerHTML = '';
        let foundDocuments: FoundDocument[] = JSON.parse(localStorage.getItem('foundDocuments') || '[]');

        if (filterType) {
            foundDocuments = foundDocuments.filter(doc => doc.type === filterType);
        }
        if (filterDate) {
            foundDocuments = foundDocuments.filter(doc => new Date(doc.id).toLocaleDateString() === new Date(filterDate).toLocaleDateString());
        }

        foundDocuments.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.classList.add('document-item');
            docElement.innerHTML = `
                <h3>${doc.title}</h3>
                <p><strong>Type:</strong> ${doc.type}</p>
                <p><strong>Location Found:</strong> ${doc.location}</p>
                <p><strong>Reporter:</strong> ${doc.reporter}</p>
                <p><strong>Date Found:</strong> ${new Date(doc.id).toLocaleDateString()}</p>
            `;
            foundDocumentsList.appendChild(docElement);
        });
    }

    // Account Page
    const accountName = document.getElementById('account-name') as HTMLSpanElement;
    const accountEmail = document.getElementById('account-email') as HTMLSpanElement;
    const currentPlan = document.getElementById('current-plan') as HTMLSpanElement;
    const premiumToggle = document.getElementById('premium-toggle') as HTMLInputElement;
    const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

    function displayAccountPage(): void {
        if (!currentUser) return;
        accountName.textContent = currentUser.name;
        accountEmail.textContent = currentUser.email;
        currentPlan.textContent = currentUser.isPremium ? 'Premium' : 'Free';
        premiumToggle.checked = currentUser.isPremium;
    }

    premiumToggle.addEventListener('change', () => {
        if (!currentUser) return;
        currentUser.isPremium = premiumToggle.checked;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].isPremium = premiumToggle.checked;
            localStorage.setItem('users', JSON.stringify(users));
        }
        displayAccountPage();
        showNotification('Plan updated successfully!', 'success');
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        authPage.style.display = 'block';
        mainPage.style.display = 'none';
        location.reload();
    });

    // Chat
    const chatsList = document.getElementById('chats-list') as HTMLDivElement;
    const chatWindow = document.getElementById('chat-window') as HTMLDivElement;
    const chatWith = document.getElementById('chat-with') as HTMLHeadingElement;
    const messagesContainer = document.getElementById('messages-container') as HTMLDivElement;
    const sendMessageForm = document.getElementById('send-message-form') as HTMLFormElement;
    const messageInput = document.getElementById('message-input') as HTMLInputElement;
    let activeChatId: string | null = null;

    function checkForMatches(doc: Document): void {
        const foundDocuments: FoundDocument[] = JSON.parse(localStorage.getItem('foundDocuments') || '[]');
        const matchedFoundDoc = foundDocuments.find(foundDoc =>
            foundDoc.title.toLowerCase() === doc.title.toLowerCase() &&
            foundDoc.type === doc.type
        );

        if (matchedFoundDoc) {
            createChatSession(doc, matchedFoundDoc);
        }
    }

    function createChatSession(lostDoc: Document, foundDoc: FoundDocument): void {
        if (!currentUser) return;
        const chats: Chat[] = JSON.parse(localStorage.getItem('chats') || '[]');

        const chatExists = chats.some(chat => chat.lostDocId === lostDoc.id && chat.foundDocId === foundDoc.id);
        if (chatExists) {
            return; // Don't create a duplicate chat
        }

        const newChat: Chat = {
            id: 'chat_' + Date.now(),
            lostDocId: lostDoc.id,
            foundDocId: foundDoc.id,
            participants: [lostDoc.owner, foundDoc.reporter],
            messages: [],
            seenBy: [currentUser.email]
        };
        chats.push(newChat);
        localStorage.setItem('chats', JSON.stringify(chats));
        showNotification(`A match was found for your document "${lostDoc.title}"! A chat has been started.`, 'success');
    }

    function displayChatsList(): void {
        if (!currentUser) return;
        chatsList.innerHTML = '';
        const chats: Chat[] = JSON.parse(localStorage.getItem('chats') || '[]');
        const userChats = chats.filter(chat => chat.participants.includes(currentUser!.email));

        userChats.forEach(chat => {
            const otherUser = chat.participants.find(p => p !== currentUser!.email);
            const chatElement = document.createElement('div');
            chatElement.classList.add('chat-list-item');
            chatElement.textContent = `Chat with ${otherUser}`;
            chatElement.addEventListener('click', () => displayChatWindow(chat.id));
            chatsList.appendChild(chatElement);
        });
    }

    function displayChatWindow(chatId: string): void {
        activeChatId = chatId;
        chatsList.style.display = 'none';
        chatWindow.style.display = 'block';

        const chats: Chat[] = JSON.parse(localStorage.getItem('chats') || '[]');
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) return;
        const chat = chats[chatIndex];

        if (!currentUser) return;
        const otherUser = chat.participants.find(p => p !== currentUser.email);

        chatWith.textContent = `Chat with ${otherUser}`;
        messagesContainer.innerHTML = '';
        chat.messages.forEach(msg => {
            if (msg.sender !== currentUser!.email && !msg.readBy.includes(currentUser!.email)) {
                msg.readBy.push(currentUser!.email);
            }
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            if (msg.sender === currentUser!.email) {
                messageElement.classList.add('sent');
            } else {
                messageElement.classList.add('received');
            }
            messageElement.innerHTML = `<p>${msg.text}</p><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>`;
            messagesContainer.appendChild(messageElement);
        });
        localStorage.setItem('chats', JSON.stringify(chats));
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendMessageForm.addEventListener('submit', (e: SubmitEvent) => {
        e.preventDefault();
        const text = messageInput.value;
        if (!text || !activeChatId) return;

        const chats: Chat[] = JSON.parse(localStorage.getItem('chats') || '[]');
        const chatIndex = chats.findIndex(c => c.id === activeChatId);
        if (chatIndex !== -1) {
            if (!currentUser) return;
            const newMessage: Message = {
                sender: currentUser.email,
                text,
                timestamp: Date.now(),
                readBy: [currentUser.email]
            };
            chats[chatIndex].messages.push(newMessage);
            localStorage.setItem('chats', JSON.stringify(chats));
            displayChatWindow(activeChatId);
            sendMessageForm.reset();
            showNotification('Message sent!', 'success');
        }
    });

    // Initial display
    if (document.querySelector('.nav-btn.active')?.dataset.page === 'my-documents') {
        displayDocuments();
    }
});
