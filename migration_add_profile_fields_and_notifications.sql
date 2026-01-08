-- ============================================
-- MIGRATION: Add Profile Fields and Notifications Support
-- Execute this script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. UPDATE USER_PROFILES TABLE
-- ============================================

-- Add base_location field (city/province)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS base_location TEXT;

-- Add id_document_url field (optional, for verification)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Ensure delivery_address exists (may already exist from schema)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Ensure rank exists
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'bronze' 
CHECK (rank IN ('bronze', 'silver', 'gold', 'platinum'));

-- Ensure preferences exists with notification settings
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "sms_notifications": true,
  "push_notifications": true,
  "email_notifications": true,
  "sms_high_priority_only": true
}'::jsonb;

-- ============================================
-- 2. FIX NOTIFICATIONS TABLE
-- ============================================

-- Remove duplicate 'read' column if exists (keep is_read)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'read'
    ) THEN
        ALTER TABLE public.notifications DROP COLUMN "read";
    END IF;
END $$;

-- Ensure is_read exists
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Ensure read_at exists
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Ensure data field exists (for metadata)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Update notification types to include all needed types
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'message', 
    'document_match', 
    'document_found', 
    'document_status_change',
    'points_milestone',
    'system', 
    'verification'
));

-- ============================================
-- 3. UPDATE DOCUMENTS TABLE
-- ============================================

-- Ensure tags field supports array
ALTER TABLE public.documents 
ALTER COLUMN tags TYPE TEXT[] USING 
    CASE 
        WHEN tags IS NULL THEN ARRAY[]::TEXT[]
        WHEN tags::TEXT = '' THEN ARRAY[]::TEXT[]
        ELSE ARRAY[tags::TEXT]
    END;

-- Ensure location_metadata exists
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS location_metadata JSONB;

-- Update document types to include all types
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_type_check 
CHECK (type IN (
    'bi', 'passport', 'driver_license', 'dire', 'nuit', 
    'work_card', 'student_card', 'voter_card', 
    'birth_certificate', 'title_deed', 'other',
    'ID card', 'DIRE', 'Passport', 'Bank Doc'
));

-- Update status to include all statuses
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_status_check 
CHECK (status IN ('normal', 'lost', 'found', 'matched', 'returned'));

-- ============================================
-- 4. CREATE PUSH SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT push_subscriptions_user_endpoint_unique UNIQUE (user_id, endpoint)
);

-- Indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_active ON public.push_subscriptions USING btree (is_active);

-- ============================================
-- 5. CREATE EMAIL NOTIFICATION LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_notification_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    provider TEXT,
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT email_notification_logs_pkey PRIMARY KEY (id)
);

-- Indexes for email_notification_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_notification_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_notification_logs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_notification_logs USING btree (created_at DESC);

-- ============================================
-- 6. CREATE DOCUMENT_MATCHES TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.document_matches (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    lost_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    found_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    match_score NUMERIC NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    match_reasons JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT document_matches_pkey PRIMARY KEY (id),
    CONSTRAINT document_matches_unique UNIQUE (lost_document_id, found_document_id)
);

-- Indexes for document_matches
CREATE INDEX IF NOT EXISTS idx_document_matches_lost ON public.document_matches USING btree (lost_document_id);
CREATE INDEX IF NOT EXISTS idx_document_matches_found ON public.document_matches USING btree (found_document_id);
CREATE INDEX IF NOT EXISTS idx_document_matches_status ON public.document_matches USING btree (status);

-- ============================================
-- 7. CREATE POINTS_HISTORY TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.points_history (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'document_upload', 'document_verified', 'document_found', 
        'document_returned', 'helped_someone', 'daily_login', 
        'profile_complete', 'first_document', 'achievement', 'penalty'
    )),
    activity_description TEXT,
    related_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT points_history_pkey PRIMARY KEY (id)
);

-- Indexes for points_history
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON public.points_history USING btree (created_at DESC);

-- ============================================
-- 8. CREATE USER_BADGES TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT NOT NULL,
    badge_icon TEXT NOT NULL,
    badge_rarity TEXT NOT NULL CHECK (badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
    progress INTEGER DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_badges_pkey PRIMARY KEY (id)
);

-- Indexes for user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges USING btree (user_id);

-- ============================================
-- 9. CREATE SMS_NOTIFICATIONS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.sms_notifications (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    message TEXT NOT NULL CHECK (length(message) <= 160),
    notification_type TEXT NOT NULL,
    related_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'cancelled')),
    provider TEXT DEFAULT 'movitel' CHECK (provider IN ('movitel', 'vodacom', 'tmcel', 'twilio', 'vonage', 'africastalking')),
    provider_response JSONB,
    cost_usd NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT sms_notifications_pkey PRIMARY KEY (id)
);

-- Indexes for sms_notifications
CREATE INDEX IF NOT EXISTS idx_sms_notifications_user_id ON public.sms_notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_status ON public.sms_notifications USING btree (status);

-- ============================================
-- 10. UPDATE TRIGGERS
-- ============================================

-- Add trigger for push_subscriptions updated_at
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at 
    BEFORE UPDATE ON public.push_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for document_matches updated_at
DROP TRIGGER IF EXISTS update_document_matches_updated_at ON public.document_matches;
CREATE TRIGGER update_document_matches_updated_at 
    BEFORE UPDATE ON public.document_matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own push subscriptions
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own push subscriptions
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own push subscriptions
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own push subscriptions
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on email_notification_logs
ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own email logs
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_notification_logs;
CREATE POLICY "Users can view own email logs" ON public.email_notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on document_matches
ALTER TABLE public.document_matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches for their documents
DROP POLICY IF EXISTS "Users can view own document matches" ON public.document_matches;
CREATE POLICY "Users can view own document matches" ON public.document_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE (id = lost_document_id OR id = found_document_id) 
            AND user_id = auth.uid()
        )
    );

-- Enable RLS on points_history
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own points history
DROP POLICY IF EXISTS "Users can view own points history" ON public.points_history;
CREATE POLICY "Users can view own points history" ON public.points_history
    FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can view their own badges
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges" ON public.user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on sms_notifications
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own SMS notifications
DROP POLICY IF EXISTS "Users can view own SMS notifications" ON public.sms_notifications;
CREATE POLICY "Users can view own SMS notifications" ON public.sms_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 12. FUNCTIONS FOR NOTIFICATIONS
-- ============================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = timezone('utc'::text, now())
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = timezone('utc'::text, now())
    WHERE user_id = auth.uid() AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New fields added to user_profiles: base_location, id_document_url';
    RAISE NOTICE 'New tables created: push_subscriptions, email_notification_logs';
    RAISE NOTICE 'RLS policies configured for all new tables';
END $$;

