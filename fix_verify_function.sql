-- Fix verify_rls_policies function
DROP FUNCTION IF EXISTS verify_rls_policies();

CREATE OR REPLACE FUNCTION verify_rls_policies()
RETURNS TABLE(
    table_name TEXT,
    policy_name TEXT,
    policy_cmd TEXT,
    policy_roles TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        policyname as policy_name,
        cmd as policy_cmd,
        CASE 
            WHEN roles = '{public}' THEN 'public'
            WHEN roles = '{authenticated}' THEN 'authenticated'
            WHEN roles = '{postgres}' THEN 'postgres'
            ELSE COALESCE(array_to_string(roles, ','), 'all')
        END as policy_roles
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql;
