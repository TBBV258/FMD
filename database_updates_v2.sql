-- Database Updates for Enhanced Points System

-- 1. Create activity log table to track points history
CREATE TABLE IF NOT EXISTS public.points_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    points_awarded INTEGER NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT points_positive CHECK (points_awarded > 0)
);

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_points_activity_log_user_id ON public.points_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_points_activity_log_created_at ON public.points_activity_log(created_at);

-- 3. Update the award_user_points function with security improvements
CREATE OR REPLACE FUNCTION public.award_user_points(
    p_user_id UUID,
    p_points_to_award INTEGER,
    p_activity_type TEXT,
    p_document_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
    v_new_rank TEXT;
    v_old_rank TEXT;
    v_result JSONB;
BEGIN
    -- Validate input
    IF p_points_to_award <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Points must be greater than 0');
    END IF;
    
    -- Get current points and rank
    SELECT points INTO v_current_points
    FROM public.user_profiles 
    WHERE id = p_user_id
    FOR UPDATE; -- Lock the row to prevent race conditions
    
    -- Get current rank
    SELECT name INTO v_old_rank
    FROM (
        SELECT name, min_points,
               ROW_NUMBER() OVER (ORDER BY min_points DESC) as rn
        FROM (
            VALUES 
                ('Novato', 0),
                ('Iniciante', 50),
                ('Intermediário', 100),
                ('Avançado', 200),
                ('Expert', 500),
                ('Lenda', 1000)
        ) AS ranks(name, min_points)
    ) ranked
    WHERE min_points <= COALESCE(v_current_points, 0)
    ORDER BY min_points DESC
    LIMIT 1;
    
    -- Update user's points
    UPDATE public.user_profiles 
    SET 
        points = COALESCE(points, 0) + p_points_to_award,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING points INTO v_current_points;
    
    -- Log the activity
    INSERT INTO public.points_activity_log 
        (user_id, activity_type, points_awarded, document_id)
    VALUES 
        (p_user_id, p_activity_type, p_points_to_award, p_document_id);
    
    -- Get new rank
    SELECT name INTO v_new_rank
    FROM (
        SELECT name, min_points,
               ROW_NUMBER() OVER (ORDER BY min_points DESC) as rn
        FROM (
            VALUES 
                ('Novato', 0),
                ('Iniciante', 50),
                ('Intermediário', 100),
                ('Avançado', 200),
                ('Expert', 500),
                ('Lenda', 1000)
        ) AS ranks(name, min_points)
    ) ranked
    WHERE min_points <= v_current_points
    ORDER BY min_points DESC
    LIMIT 1;
    
    -- Prepare result
    v_result := jsonb_build_object(
        'success', true,
        'points', v_current_points,
        'points_awarded', p_points_to_award,
        'rank', v_new_rank,
        'rank_changed', COALESCE(v_old_rank, '') <> COALESCE(v_new_rank, '')
    );
    
    -- If rank changed, add to result
    IF v_old_rank IS DISTINCT FROM v_new_rank THEN
        v_result := v_result || jsonb_build_object('new_rank', v_new_rank);
    END IF;
    
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- 4. Create a view for leaderboard
CREATE OR REPLACE VIEW public.leaderboard AS
WITH ranked_users AS (
    SELECT 
        up.id,
        up.full_name,
        up.avatar_url,
        up.points,
        (
            SELECT name
            FROM (
                SELECT name, min_points
                FROM (
                    VALUES 
                        ('Novato', 0),
                        ('Iniciante', 50),
                        ('Intermediário', 100),
                        ('Avançado', 200),
                        ('Expert', 500),
                        ('Lenda', 1000)
                ) ranks(name, min_points)
                WHERE min_points <= up.points
                ORDER BY min_points DESC
                LIMIT 1
            ) as rank_name,
            ROW_NUMBER() OVER (ORDER BY up.points DESC) as position
        FROM public.user_profiles up
        WHERE up.points > 0
        ORDER BY up.points DESC
        LIMIT 100
)
SELECT * FROM ranked_users;

-- 5. Set up Row Level Security (RLS) and permissions
ALTER TABLE public.points_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own activity logs" 
ON public.points_activity_log 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert activity logs" 
ON public.points_activity_log 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.points_activity_log TO authenticated;

-- 6. Create a function to get user's activity history
CREATE OR REPLACE FUNCTION public.get_user_activity(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
)
RETURNS TABLE (
    id UUID,
    activity_type TEXT,
    points_awarded INTEGER,
    document_id UUID,
    document_title TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        l.id,
        l.activity_type,
        l.points_awarded,
        l.document_id,
        d.title as document_title,
        l.created_at
    FROM public.points_activity_log l
    LEFT JOIN public.documents d ON l.document_id = d.id
    WHERE l.user_id = p_user_id
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
$$;

-- 7. Create a function to get user's rank position
CREATE OR REPLACE FUNCTION public.get_user_rank_position(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT position
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY points DESC) as position
        FROM public.user_profiles
        WHERE points > 0
    ) ranked
    WHERE id = p_user_id;
$$;
