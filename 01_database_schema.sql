-- ============================================
-- FIND MY DOCUMENTS (FMD) - COMPLETE DATABASE SCHEMA
-- Execute this script in order in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    country TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    points INTEGER DEFAULT 0,
    document_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);

-- ============================================
-- 2. DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ID card', 'DIRE', 'Passport', 'Bank Doc')),
    status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'lost', 'found')),
    description TEXT,
    document_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    issue_place TEXT,
    issuing_authority TEXT,
    country_of_issue TEXT,
    location JSONB,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_path TEXT,
    file_size BIGINT,
    file_type TEXT,
    thumbnail_url TEXT,
    hash_local TEXT,
    is_public BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    verification_notes TEXT,
    tags TEXT[],
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT documents_pkey PRIMARY KEY (id)
);

-- ============================================
-- 3. CHATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    reply_to_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chats_pkey PRIMARY KEY (id),
    CONSTRAINT chats_no_self_message CHECK (sender_id != receiver_id)
);

-- ============================================
-- 4. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'document_match', 'document_found', 'system', 'verification')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- ============================================
-- 5. POINTS ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.points_activity_log (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('document_upload', 'document_verified', 'document_found', 'message_sent', 'daily_login')),
    points_awarded INTEGER NOT NULL CHECK (points_awarded > 0),
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT points_activity_log_pkey PRIMARY KEY (id)
);

-- ============================================
-- 6. VERIFICATION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
    verification_notes TEXT,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT verification_requests_pkey PRIMARY KEY (id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents USING btree (status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents USING btree (type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON public.documents USING btree (is_public);
CREATE INDEX IF NOT EXISTS idx_documents_location ON public.documents USING gin (location);

-- Chats indexes
CREATE INDEX IF NOT EXISTS idx_chats_document_id ON public.chats USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON public.chats USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_receiver_id ON public.chats USING btree (receiver_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats USING btree (status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);

-- Points activity log indexes
CREATE INDEX IF NOT EXISTS idx_points_user_id ON public.points_activity_log USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON public.points_activity_log USING btree (created_at DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON public.verification_requests;
CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON public.verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS FOR AUTOMATIC OPERATIONS
-- ============================================

-- Function to update user document count
CREATE OR REPLACE FUNCTION update_user_document_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.user_profiles SET document_count = document_count + 1 WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.user_profiles SET document_count = document_count - 1 WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply document count trigger
DROP TRIGGER IF EXISTS update_user_document_count_trigger ON public.documents;
CREATE TRIGGER update_user_document_count_trigger
    AFTER INSERT OR DELETE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_user_document_count();
