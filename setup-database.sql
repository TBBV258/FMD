-- FindMyDocs Database Setup Script
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table (for future use)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID, -- Can reference lost_documents or found_documents
    document_type TEXT CHECK (document_type IN ('lost', 'found')),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_lost_documents_reporter_id ON lost_documents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_lost_documents_status ON lost_documents(status);
CREATE INDEX IF NOT EXISTS idx_lost_documents_location ON lost_documents(location);
CREATE INDEX IF NOT EXISTS idx_found_documents_finder_id ON found_documents(finder_id);
CREATE INDEX IF NOT EXISTS idx_found_documents_status ON found_documents(status);
CREATE INDEX IF NOT EXISTS idx_found_documents_location ON found_documents(location);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id);

-- Set up Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Lost documents policies (public read, authenticated insert)
CREATE POLICY "Anyone can view lost documents" ON lost_documents
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Authenticated users can insert lost documents" ON lost_documents
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can update their own lost document reports" ON lost_documents
    FOR UPDATE USING (auth.uid() = reporter_id);

-- Found documents policies (public read, authenticated insert)
CREATE POLICY "Anyone can view found documents" ON found_documents
    FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Authenticated users can insert found documents" ON found_documents
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = finder_id);

CREATE POLICY "Users can update their own found document reports" ON found_documents
    FOR UPDATE USING (auth.uid() = finder_id);

-- Chat messages policies
CREATE POLICY "Users can view their own chat messages" ON chat_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own sent messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'Usuário'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update document count
CREATE OR REPLACE FUNCTION update_document_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles 
    SET documents_count = documents_count + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles 
    SET documents_count = GREATEST(documents_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update document count
DROP TRIGGER IF EXISTS document_count_trigger ON documents;
CREATE TRIGGER document_count_trigger
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_document_count();

-- Function to award points for helping
CREATE OR REPLACE FUNCTION award_points_for_helping()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Award 10 points for reporting found documents
    UPDATE user_profiles 
    SET points = points + 10,
        helped_count = helped_count + 1,
        updated_at = NOW()
    WHERE id = NEW.finder_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to award points
DROP TRIGGER IF EXISTS found_document_points_trigger ON found_documents;
CREATE TRIGGER found_document_points_trigger
  AFTER INSERT ON found_documents
  FOR EACH ROW EXECUTE FUNCTION award_points_for_helping();

-- Insert some sample data (optional - for testing)
-- Note: This will only work after you have at least one authenticated user

-- Example: Insert a demo user profile (you'll need to replace the UUID with actual auth user ID)
-- INSERT INTO user_profiles (id, email, name, phone, country, is_demo) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'demo@findmydocs.com', 'Demo User', '+244123456789', 'AO', true)
-- ON CONFLICT (id) DO NOTHING;