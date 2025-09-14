-- Database Schema Updates for FindMyDocument
-- Execute these SQL commands in your Supabase SQL Editor

-- 1. Add new columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;

-- 2. Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS policies for the documents bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON public.user_profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- 5. Add constraints for points
ALTER TABLE public.user_profiles 
ADD CONSTRAINT IF NOT EXISTS check_points_positive CHECK (points >= 0);

-- 6. Create a function to award points (optional)
CREATE OR REPLACE FUNCTION award_user_points(user_id uuid, points_to_award integer, activity_type text)
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles 
    SET points = points + points_to_award,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Log the activity (optional - you can create an activities table later)
    RAISE NOTICE 'Awarded % points to user % for activity: %', points_to_award, user_id, activity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION award_user_points TO authenticated;

-- 8. Update existing users to have 0 points if they don't have any
UPDATE public.user_profiles 
SET points = 0 
WHERE points IS NULL;
