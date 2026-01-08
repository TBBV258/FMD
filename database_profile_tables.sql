-- ============================================
-- PROFILE FEATURES - DATABASE SCHEMA
-- Execute this script in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USER_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language TEXT DEFAULT 'pt' CHECK (language IN ('pt', 'en', 'fr')),
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    currency TEXT DEFAULT 'MZN',
    timezone TEXT DEFAULT 'Africa/Maputo',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    auto_backup BOOLEAN DEFAULT false,
    backup_frequency TEXT DEFAULT 'weekly' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
    last_backup_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_settings_pkey PRIMARY KEY (id),
    CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
);

-- ============================================
-- 2. USER_PRIVACY_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    show_phone_number BOOLEAN DEFAULT false,
    require_contact_request BOOLEAN DEFAULT true,
    show_exact_location BOOLEAN DEFAULT false,
    show_document_count BOOLEAN DEFAULT true,
    show_points BOOLEAN DEFAULT true,
    allow_profile_search BOOLEAN DEFAULT true,
    share_analytics BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_privacy_settings_pkey PRIMARY KEY (id),
    CONSTRAINT user_privacy_settings_user_id_unique UNIQUE (user_id)
);

-- ============================================
-- 3. USER_SECURITY_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_security_settings (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    two_factor_backup_codes TEXT[],
    two_factor_enabled_at TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE,
    login_notifications BOOLEAN DEFAULT true,
    suspicious_activity_alerts BOOLEAN DEFAULT true,
    session_timeout_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_security_settings_pkey PRIMARY KEY (id),
    CONSTRAINT user_security_settings_user_id_unique UNIQUE (user_id)
);

-- ============================================
-- 4. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium', 'enterprise')),
    billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'annual')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    payment_method TEXT,
    payment_provider TEXT,
    amount_paid NUMERIC(10, 2),
    currency TEXT DEFAULT 'MZN',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT subscriptions_pkey PRIMARY KEY (id)
);

-- ============================================
-- 5. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'MZN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT,
    payment_provider TEXT,
    payment_provider_transaction_id TEXT,
    description TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT invoices_pkey PRIMARY KEY (id)
);

-- ============================================
-- 6. DOCUMENT_HIGHLIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_highlights (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    highlight_type TEXT NOT NULL DEFAULT 'feed_top' CHECK (highlight_type IN ('feed_top', 'featured', 'urgent')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT document_highlights_pkey PRIMARY KEY (id)
);

-- ============================================
-- 7. CONTACT_REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contact_requests (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT contact_requests_pkey PRIMARY KEY (id),
    CONSTRAINT contact_requests_unique UNIQUE (requester_id, target_user_id, document_id)
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings USING btree (user_id);

-- Privacy settings indexes
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON public.user_privacy_settings USING btree (user_id);

-- Security settings indexes
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON public.user_security_settings USING btree (user_id);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions USING btree (expires_at);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices USING btree (subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices USING btree (status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices USING btree (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices USING btree (created_at DESC);

-- Document highlights indexes
CREATE INDEX IF NOT EXISTS idx_document_highlights_document_id ON public.document_highlights USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_document_highlights_user_id ON public.document_highlights USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_document_highlights_is_active ON public.document_highlights USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_document_highlights_end_date ON public.document_highlights USING btree (end_date);

-- Contact requests indexes
CREATE INDEX IF NOT EXISTS idx_contact_requests_requester_id ON public.contact_requests USING btree (requester_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_target_user_id ON public.contact_requests USING btree (target_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON public.contact_requests USING btree (status);

-- ============================================
-- 9. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Use existing update_updated_at_column function
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON public.user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_privacy_settings_updated_at ON public.user_privacy_settings;
CREATE TRIGGER update_user_privacy_settings_updated_at 
    BEFORE UPDATE ON public.user_privacy_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_security_settings_updated_at ON public.user_security_settings;
CREATE TRIGGER update_user_security_settings_updated_at 
    BEFORE UPDATE ON public.user_security_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON public.invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_highlights_updated_at ON public.document_highlights;
CREATE TRIGGER update_document_highlights_updated_at 
    BEFORE UPDATE ON public.document_highlights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON public.contact_requests;
CREATE TRIGGER update_contact_requests_updated_at 
    BEFORE UPDATE ON public.contact_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- User Settings RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Privacy Settings RLS
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can view own privacy settings" ON public.user_privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can insert own privacy settings" ON public.user_privacy_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can update own privacy settings" ON public.user_privacy_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Security Settings RLS
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own security settings" ON public.user_security_settings;
CREATE POLICY "Users can view own security settings" ON public.user_security_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own security settings" ON public.user_security_settings;
CREATE POLICY "Users can insert own security settings" ON public.user_security_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own security settings" ON public.user_security_settings;
CREATE POLICY "Users can update own security settings" ON public.user_security_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Invoices RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Document Highlights RLS
ALTER TABLE public.document_highlights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own document highlights" ON public.document_highlights;
CREATE POLICY "Users can view own document highlights" ON public.document_highlights
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own document highlights" ON public.document_highlights;
CREATE POLICY "Users can insert own document highlights" ON public.document_highlights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own document highlights" ON public.document_highlights;
CREATE POLICY "Users can update own document highlights" ON public.document_highlights
    FOR UPDATE USING (auth.uid() = user_id);

-- Contact Requests RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contact requests" ON public.contact_requests;
CREATE POLICY "Users can view own contact requests" ON public.contact_requests
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_user_id);

DROP POLICY IF EXISTS "Users can create contact requests" ON public.contact_requests;
CREATE POLICY "Users can create contact requests" ON public.contact_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update own contact requests" ON public.contact_requests;
CREATE POLICY "Users can update own contact requests" ON public.contact_requests
    FOR UPDATE USING (auth.uid() = target_user_id OR auth.uid() = requester_id);

-- ============================================
-- 11. FUNCTIONS
-- ============================================

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM public.invoices WHERE invoice_number = new_number) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate expired highlights
CREATE OR REPLACE FUNCTION deactivate_expired_highlights()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.document_highlights
    SET is_active = false, updated_at = timezone('utc'::text, now())
    WHERE is_active = true AND end_date < timezone('utc'::text, now());
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. INITIAL DATA SETUP
-- ============================================

-- Create default settings for existing users (optional, can be done on-demand)
-- This would be handled by the application when user first accesses settings

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Profile features database schema created successfully!';
    RAISE NOTICE 'Tables created: user_settings, user_privacy_settings, user_security_settings, subscriptions, invoices, document_highlights, contact_requests';
    RAISE NOTICE 'RLS policies configured for all tables';
    RAISE NOTICE 'Indexes and triggers created';
END $$;

