-- Fix Missing User Profile
-- This script creates a profile for the user ID that's showing as "User 8f33" in the chat

-- First, let's check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'c75c867e-aa1f-4653-8e12-efbedb788f33';

-- If the user exists in auth.users but not in user_profiles, create the profile
INSERT INTO public.user_profiles (
    id,
    plan,
    document_count,
    created_at,
    updated_at,
    phone_number,
    country,
    full_name,
    avatar_url,
    points
) VALUES (
    'c75c867e-aa1f-4653-8e12-efbedb788f33',
    'free',
    0,
    NOW(),
    NOW(),
    NULL, -- You can add a phone number if you know it
    NULL, -- You can add a country if you know it
    'Kevin Walaka', -- Based on your data, this should be the name
    NULL, -- You can add an avatar URL if you have one
    0
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Verify the profile was created
SELECT id, full_name, phone_number, plan, created_at 
FROM public.user_profiles 
WHERE id = 'c75c867e-aa1f-4653-8e12-efbedb788f33';
