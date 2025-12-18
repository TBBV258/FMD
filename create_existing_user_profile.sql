-- Create profile for existing user
INSERT INTO public.user_profiles (id, full_name, plan, created_at, updated_at)
VALUES (
    '8b283b89-d6ed-4183-90ab-568915c41db9',
    'Existing User',
    'free',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
