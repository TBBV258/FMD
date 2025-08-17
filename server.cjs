const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config.cjs');

const app = express();

// Initialize Supabase client
const supabaseUrl = config.SUPABASE_URL;
const supabaseKey = config.SUPABASE_ANON_KEY;

// Check if using placeholder credentials
if (supabaseUrl === 'https://your-project-id.supabase.co' || supabaseKey === 'your-anon-key-here') {
    console.error('⚠️  WARNING: Using placeholder Supabase credentials!');
    console.error('Please update config.js with your actual Supabase credentials.');
    console.error('Get them from: https://supabase.com/dashboard/project/[YOUR_PROJECT]/settings/api');
    console.error('');
}

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('.'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
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

// Auth middleware
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Configuration endpoint for frontend
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseKey
    });
});

// Document endpoints
app.get('/api/documents', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

app.post('/api/documents', requireAuth, upload.array('files', 5), async (req, res) => {
    try {
        const { type, name, number, description, status = 'normal', location, contact_info } = req.body;
        
        if (!type || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check free plan limits for normal documents
        if (status === 'normal') {
            const { data: userProfile } = await supabase
                .from('users')
                .select('is_premium')
                .eq('id', req.user.id)
                .single();

            if (!userProfile?.is_premium) {
                const { data: existingDocs } = await supabase
                    .from('documents')
                    .select('id')
                    .eq('user_id', req.user.id)
                    .eq('status', 'normal');

                if (existingDocs && existingDocs.length >= 1) {
                    return res.status(403).json({ 
                        error: 'Free plan limit reached. Upgrade to Premium for unlimited documents.',
                        needsUpgrade: true 
                    });
                }
            }
        }

        // Process uploaded files
        let files = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    // Upload to Supabase Storage
                    const fileName = `${Date.now()}_${file.originalname}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(fileName, fs.readFileSync(file.path), {
                            contentType: file.mimetype,
                            cacheControl: '3600'
                        });

                    if (uploadError) throw uploadError;

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('documents')
                        .getPublicUrl(fileName);

                    files.push({
                        id: fileName,
                        filename: fileName,
                        originalName: file.originalname,
                        size: file.size,
                        mimetype: file.mimetype,
                        url: publicUrl
                    });

                    // Clean up local file
                    fs.unlinkSync(file.path);
                } catch (fileError) {
                    console.error('Error uploading file:', fileError);
                    // Continue with other files
                }
            }
        }

        // Create document record
        const documentData = {
            user_id: req.user.id,
            type,
            name,
            number: number || null,
            description: description || null,
            status,
            location: location || null,
            contact_info: contact_info || null,
            files: files.length > 0 ? files : null,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('documents')
            .insert([documentData])
            .select()
            .single();

        if (error) throw error;

        // Award points for reporting found documents
        if (status === 'found') {
            await awardPoints(req.user.id, 50, 'Found document reported');
        }

        res.json({
            success: true,
            document: data
        });
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

app.put('/api/documents/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verify ownership
        const { data: document, error: fetchError } = await supabase
            .from('documents')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchError || !document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (document.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { data, error } = await supabase
            .from('documents')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

app.delete('/api/documents/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const { data: document, error: fetchError } = await supabase
            .from('documents')
            .select('user_id, files')
            .eq('id', id)
            .single();

        if (fetchError || !document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (document.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Delete files from storage
        if (document.files && Array.isArray(document.files)) {
            for (const file of document.files) {
                try {
                    await supabase.storage
                        .from('documents')
                        .remove([file.filename]);
                } catch (fileError) {
                    console.error('Error deleting file:', fileError);
                }
            }
        }

        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Feed endpoints
app.get('/api/lost-documents', async (req, res) => {
    try {
        const { type, search, limit = 50 } = req.query;
        
        let query = supabase
            .from('documents')
            .select(`
                *,
                users (
                    first_name,
                    last_name
                )
            `)
            .eq('status', 'lost')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (type) {
            query = query.eq('type', type);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching lost documents:', error);
        res.status(500).json({ error: 'Failed to fetch lost documents' });
    }
});

app.get('/api/found-documents', async (req, res) => {
    try {
        const { type, search, limit = 50 } = req.query;
        
        let query = supabase
            .from('documents')
            .select(`
                *,
                users (
                    first_name,
                    last_name
                )
            `)
            .eq('status', 'found')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (type) {
            query = query.eq('type', type);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching found documents:', error);
        res.status(500).json({ error: 'Failed to fetch found documents' });
    }
});

// Chat endpoints
app.get('/api/chats/:documentId', requireAuth, async (req, res) => {
    try {
        const { documentId } = req.params;

        const { data, error } = await supabase
            .from('chats')
            .select(`
                *,
                sender:users!chats_sender_id_fkey(id, first_name, last_name),
                receiver:users!chats_receiver_id_fkey(id, first_name, last_name)
            `)
            .eq('document_id', documentId)
            .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
});

app.post('/api/chats', requireAuth, async (req, res) => {
    try {
        const { document_id, receiver_id, message } = req.body;

        if (!document_id || !receiver_id || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const chatData = {
            document_id,
            sender_id: req.user.id,
            receiver_id,
            message,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('chats')
            .insert([chatData])
            .select()
            .single();

        if (error) throw error;

        // Create notification for receiver
        await createNotification(receiver_id, 'new_message', 'Nova mensagem', 
            `Você recebeu uma nova mensagem sobre um documento`, { chat_id: data.id });

        res.json(data);
    } catch (error) {
        console.error('Error creating chat message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// User profile endpoints
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            // User profile doesn't exist, create it
            const newProfile = {
                id: req.user.id,
                email: req.user.email,
                first_name: req.user.user_metadata?.first_name || '',
                last_name: req.user.user_metadata?.last_name || '',
                points: 0,
                is_premium: false,
                created_at: new Date().toISOString()
            };

            const { data: createdProfile, error: createError } = await supabase
                .from('users')
                .insert([newProfile])
                .select()
                .single();

            if (createError) throw createError;
            return res.json(createdProfile);
        }

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.put('/api/profile', requireAuth, async (req, res) => {
    try {
        const updates = req.body;
        delete updates.id; // Prevent ID changes
        delete updates.email; // Prevent email changes through this endpoint

        const { data, error } = await supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Notifications endpoints
app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Avatar upload endpoint
app.post('/api/upload-avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Supabase Storage
        const fileName = `avatars/${req.user.id}_${Date.now()}.${req.file.originalname.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, fs.readFileSync(req.file.path), {
                contentType: req.file.mimetype,
                cacheControl: '3600'
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Update user profile
        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
            .eq('id', req.user.id);

        if (updateError) throw updateError;

        // Clean up local file
        fs.unlinkSync(req.file.path);

        res.json({ avatar_url: publicUrl });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// Utility functions
async function awardPoints(userId, points, reason) {
    try {
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('points')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        const newPoints = (user.points || 0) + points;

        const { error: updateError } = await supabase
            .from('users')
            .update({ points: newPoints, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Create notification
        await createNotification(userId, 'points_awarded', 'Pontos Ganhos!', 
            `Você ganhou ${points} pontos: ${reason}`, { points });
    } catch (error) {
        console.error('Error awarding points:', error);
    }
}

async function createNotification(userId, type, title, message, data = null) {
    try {
        const notificationData = {
            user_id: userId,
            type,
            title,
            message,
            data,
            read: false,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('notifications')
            .insert([notificationData]);

        if (error) throw error;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`🚀 FindMyDocs server running on port ${config.PORT}`);
    console.log(`🌐 Access the app at: http://localhost:${config.PORT}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    console.log(`📱 Environment: ${config.NODE_ENV}`);
});

module.exports = app;