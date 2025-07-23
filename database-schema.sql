-- FindMyDocs Database Schema
-- This SQL should be run in the Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Usuário',
    phone TEXT,
    country TEXT DEFAULT 'AO',
    avatar_url TEXT,
    points INTEGER DEFAULT 0,
    documents_count INTEGER DEFAULT 0,
    helped_count INTEGER DEFAULT 0,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bi', 'passaporte', 'carta', 'diri', 'outros')),
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lost', 'found')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lost documents table
CREATE TABLE IF NOT EXISTS lost_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bi', 'passaporte', 'carta', 'diri', 'outros')),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    contact TEXT NOT NULL,
    country TEXT DEFAULT 'AO',
    province TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create found documents table
CREATE TABLE IF NOT EXISTS found_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    finder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bi', 'passaporte', 'carta', 'diri', 'outros')),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    contact TEXT NOT NULL,
    country TEXT DEFAULT 'AO',
    province TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('lost', 'found')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    participants UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document matches table (for AI matching)
CREATE TABLE IF NOT EXISTS document_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lost_document_id UUID REFERENCES lost_documents(id) ON DELETE CASCADE NOT NULL,
    found_document_id UUID REFERENCES found_documents(id) ON DELETE CASCADE NOT NULL,
    similarity_score DECIMAL(3, 2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for document images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Documents images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Users can upload document images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own document images" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own document images" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can manage their own documents" ON documents
FOR ALL USING (auth.uid() = user_id);

-- Lost documents policies
CREATE POLICY "Anyone can view active lost documents" ON lost_documents
FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own lost reports" ON lost_documents
FOR ALL USING (auth.uid() = reporter_id);

-- Found documents policies
CREATE POLICY "Anyone can view active found documents" ON found_documents
FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own found reports" ON found_documents
FOR ALL USING (auth.uid() = finder_id);

-- Chat rooms policies
CREATE POLICY "Users can view chat rooms they created or are participants in" ON chat_rooms
FOR SELECT USING (
    auth.uid() = created_by OR 
    auth.uid() = ANY(participants)
);

CREATE POLICY "Users can create chat rooms" ON chat_rooms
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update chat rooms they created" ON chat_rooms
FOR UPDATE USING (auth.uid() = created_by);

-- Chat messages policies
CREATE POLICY "Users can view messages in their chat rooms" ON chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM chat_rooms 
        WHERE chat_rooms.id = chat_messages.room_id 
        AND (auth.uid() = chat_rooms.created_by OR auth.uid() = ANY(chat_rooms.participants))
    )
);

CREATE POLICY "Users can send messages in their chat rooms" ON chat_messages
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM chat_rooms 
        WHERE chat_rooms.id = room_id 
        AND (auth.uid() = chat_rooms.created_by OR auth.uid() = ANY(chat_rooms.participants))
    )
);

-- Document matches policies
CREATE POLICY "Users can view matches for their documents" ON document_matches
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM lost_documents 
        WHERE lost_documents.id = document_matches.lost_document_id 
        AND lost_documents.reporter_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM found_documents 
        WHERE found_documents.id = document_matches.found_document_id 
        AND found_documents.finder_id = auth.uid()
    )
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Activity log policies
CREATE POLICY "Users can view their own activity" ON activity_log
FOR SELECT USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_lost_documents_status ON lost_documents(status);
CREATE INDEX IF NOT EXISTS idx_lost_documents_type ON lost_documents(type);
CREATE INDEX IF NOT EXISTS idx_lost_documents_country ON lost_documents(country);
CREATE INDEX IF NOT EXISTS idx_lost_documents_created_at ON lost_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_found_documents_status ON found_documents(status);
CREATE INDEX IF NOT EXISTS idx_found_documents_type ON found_documents(type);
CREATE INDEX IF NOT EXISTS idx_found_documents_country ON found_documents(country);
CREATE INDEX IF NOT EXISTS idx_found_documents_created_at ON found_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- Spatial indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_lost_documents_location ON lost_documents USING GIST(ST_Point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_found_documents_location ON found_documents USING GIST(ST_Point(longitude, latitude));

-- Functions for common operations

-- Function to increment user document count
CREATE OR REPLACE FUNCTION increment_user_documents(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET documents_count = documents_count + 1,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement user document count
CREATE OR REPLACE FUNCTION decrement_user_documents(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET documents_count = GREATEST(documents_count - 1, 0),
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add user points
CREATE OR REPLACE FUNCTION add_user_points(user_id UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET points = points + points_to_add,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    user_id UUID,
    action TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
    VALUES (user_id, action, resource_type, resource_id, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    user_id UUID,
    title TEXT,
    message TEXT,
    notification_type TEXT DEFAULT 'info',
    data JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (user_id, title, message, notification_type, data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find nearby documents (for location-based matching)
CREATE OR REPLACE FUNCTION find_nearby_documents(
    lat DECIMAL,
    lng DECIMAL,
    radius_km INTEGER DEFAULT 10,
    doc_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    name TEXT,
    location TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ld.id,
        ld.type,
        ld.name,
        ld.location,
        ROUND(
            ST_Distance(
                ST_Point(lng, lat)::geography,
                ST_Point(ld.longitude, ld.latitude)::geography
            ) / 1000, 2
        ) as distance_km
    FROM lost_documents ld
    WHERE 
        ld.status = 'active' AND
        ld.latitude IS NOT NULL AND 
        ld.longitude IS NOT NULL AND
        ST_Distance(
            ST_Point(lng, lat)::geography,
            ST_Point(ld.longitude, ld.latitude)::geography
        ) <= radius_km * 1000 AND
        (doc_type IS NULL OR ld.type = doc_type)
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lost_documents_updated_at BEFORE UPDATE ON lost_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_found_documents_updated_at BEFORE UPDATE ON found_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_matches_updated_at BEFORE UPDATE ON document_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Views for common queries

-- View for active lost documents with reporter info
CREATE OR REPLACE VIEW active_lost_documents AS
SELECT 
    ld.*,
    up.name as reporter_name,
    up.phone as reporter_phone
FROM lost_documents ld
JOIN user_profiles up ON ld.reporter_id = up.id
WHERE ld.status = 'active';

-- View for active found documents with finder info
CREATE OR REPLACE VIEW active_found_documents AS
SELECT 
    fd.*,
    up.name as finder_name,
    up.phone as finder_phone
FROM found_documents fd
JOIN user_profiles up ON fd.finder_id = up.id
WHERE fd.status = 'active';

-- View for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    up.id,
    up.name,
    up.email,
    up.points,
    up.documents_count,
    up.helped_count,
    COUNT(DISTINCT ld.id) as lost_reports,
    COUNT(DISTINCT fd.id) as found_reports,
    COUNT(DISTINCT cm.id) as messages_sent
FROM user_profiles up
LEFT JOIN lost_documents ld ON up.id = ld.reporter_id
LEFT JOIN found_documents fd ON up.id = fd.finder_id
LEFT JOIN chat_messages cm ON up.id = cm.sender_id
GROUP BY up.id, up.name, up.email, up.points, up.documents_count, up.helped_count;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert initial data (optional - for testing)
-- This would be handled by the application, not the schema

COMMENT ON TABLE user_profiles IS 'User profile information and statistics';
COMMENT ON TABLE documents IS 'User uploaded documents for safekeeping';
COMMENT ON TABLE lost_documents IS 'Reports of lost documents';
COMMENT ON TABLE found_documents IS 'Reports of found documents';
COMMENT ON TABLE chat_rooms IS 'Chat rooms for document recovery coordination';
COMMENT ON TABLE chat_messages IS 'Messages within chat rooms';
COMMENT ON TABLE document_matches IS 'AI-generated matches between lost and found documents';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE activity_log IS 'User activity tracking';
