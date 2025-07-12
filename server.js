// Country prefix and flag info for contact (for frontend usage)
const countryPrefixes = [
    { code: 'MZ', name: 'Mozambique', prefix: '+258', flag: '🇲🇿' },
    { code: 'PT', name: 'Portugal', prefix: '+351', flag: '🇵🇹' },
    { code: 'BR', name: 'Brazil', prefix: '+55', flag: '🇧🇷' },
    { code: 'ZA', name: 'South Africa', prefix: '+27', flag: '🇿🇦' },
    { code: 'AO', name: 'Angola', prefix: '+244', flag: '🇦🇴' },
    { code: 'US', name: 'United States', prefix: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', prefix: '+44', flag: '🇬🇧' },
    { code: 'IN', name: 'India', prefix: '+91', flag: '🇮🇳' },
    { code: 'FR', name: 'France', prefix: '+33', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', prefix: '+34', flag: '🇪🇸' },
    // Add more as needed
];

app.get('/api/country-prefixes', (req, res) => {
    res.json(countryPrefixes);
});
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Import our database storage
const { storage } = require('./server/storage.ts');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage_multer,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (PNG, JPG, JPEG) and PDF files are allowed'));
        }
    }
});

// Simple demo authentication for now
let currentDemoUser = null;
let registeredUsers = [];

// Auth endpoints

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (registeredUsers.find(u => u.email === email)) {
        return res.status(409).json({ error: 'User already exists' });
    }
    const newUser = {
        id: 'user_' + Date.now(),
        email,
        password, // In production, hash this!
        firstName,
        lastName,
        points: 0,
        isPremium: false
    };
    registeredUsers.push(newUser);
    currentDemoUser = { ...newUser };
    res.json({ success: true, user: { ...newUser, password: undefined } });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = registeredUsers.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    currentDemoUser = { ...user };
    res.json({ success: true, user: { ...user, password: undefined } });
});

// Demo login
app.post('/api/auth/demo', (req, res) => {
    currentDemoUser = {
        id: 'demo_user_' + Date.now(),
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        points: 0,
        isPremium: false
    };
    res.json({
        success: true,
        user: currentDemoUser
    });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    currentDemoUser = null;
    res.json({ success: true });
});

app.get('/api/auth/user', (req, res) => {
    if (currentDemoUser) {
        const { password, ...userNoPass } = currentDemoUser;
        res.json(userNoPass);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Document endpoints
app.get('/api/documents', async (req, res) => {
    try {
        if (!currentDemoUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        // For demo, return empty array for now
        // In real app: const documents = await storage.getUserDocuments(currentDemoUser.id);
        const documents = [];
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

app.post('/api/documents', upload.array('files', 5), async (req, res) => {
    try {
        if (!currentDemoUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { type, name, number, description } = req.body;
        
        if (!type || !name || !number) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Process uploaded files
        const files = req.files ? req.files.map(file => ({
            id: uuidv4(),
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        })) : [];

        const documentData = {
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: currentDemoUser.id,
            type,
            name,
            number,
            description: description || null,
            status: 'active',
            files,
            dateAdded: new Date().toISOString()
        };

        // For demo, just return success
        // In real app: const document = await storage.createDocument(documentData);
        
        res.json({
            success: true,
            document: documentData
        });
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

// Lost documents endpoints
app.get('/api/lost-documents', async (req, res) => {
    try {
        // For demo, return mock data for Mozambique
        const mockLostDocuments = [
            {
                id: 'lost_1',
                userId: 'user_1',
                documentType: 'bi',
                documentName: 'Bilhete de Identidade',
                locationLost: 'Maputo Centro, próximo ao Mercado Central',
                description: 'BI com número começando em 123456789',
                contactInfo: '+258 84 123 4567',
                status: 'lost',
                dateReported: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                files: []
            },
            {
                id: 'lost_2',
                userId: 'user_2',
                documentType: 'passaporte',
                documentName: 'Passaporte Moçambicano',
                locationLost: 'Aeroporto Internacional de Maputo',
                description: 'Passaporte azul, perdido na área de check-in',
                contactInfo: '+258 87 987 6543',
                status: 'lost',
                dateReported: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                files: []
            }
        ];
        
        res.json(mockLostDocuments);
    } catch (error) {
        console.error('Error fetching lost documents:', error);
        res.status(500).json({ error: 'Failed to fetch lost documents' });
    }
});

app.post('/api/lost-documents', upload.array('files', 5), async (req, res) => {
    try {
        if (!currentDemoUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { document_type, document_name, location_lost, description, contact_info } = req.body;
        
        if (!document_type || !document_name || !location_lost || !contact_info) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Process uploaded files
        const files = req.files ? req.files.map(file => ({
            id: uuidv4(),
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        })) : [];

        const lostDocumentData = {
            id: 'lost_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: currentDemoUser.id,
            documentType: document_type,
            documentName: document_name,
            locationLost: location_lost,
            description: description || null,
            contactInfo: contact_info,
            status: 'lost',
            files,
            dateReported: new Date().toISOString()
        };

        // For demo, just return success
        // In real app: const lostDocument = await storage.createLostDocument(lostDocumentData);
        
        res.json({
            success: true,
            lostDocument: lostDocumentData
        });
    } catch (error) {
        console.error('Error creating lost document:', error);
        res.status(500).json({ error: 'Failed to report lost document' });
    }
});

// Found documents endpoints
app.get('/api/found-documents', async (req, res) => {
    try {
        // For demo, return mock data for Mozambique
        const mockFoundDocuments = [
            {
                id: 'found_1',
                userId: 'user_3',
                documentType: 'carta',
                documentName: 'Carta de Condução',
                locationFound: 'Matola, perto da estação de comboios',
                description: 'Carta de condução encontrada no chão',
                contactInfo: '+258 82 555 1234',
                status: 'found',
                dateReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                files: []
            }
        ];
        
        res.json(mockFoundDocuments);
    } catch (error) {
        console.error('Error fetching found documents:', error);
        res.status(500).json({ error: 'Failed to fetch found documents' });
    }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`FindMyDocs server running on port ${PORT}`);
});

module.exports = app;
