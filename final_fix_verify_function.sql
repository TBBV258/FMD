-- Final fix for verify_rls_policies function with explicit casts
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
        schemaname || '.' || tablename AS table_name,
        policyname::text AS policy_name,
        cmd::text AS policy_cmd,
        CASE 
            WHEN roles = '{public}' THEN 'public'
            WHEN roles = '{authenticated}' THEN 'authenticated'
            WHEN roles = '{postgres}' THEN 'postgres'
            ELSE COALESCE(array_to_string(roles, ','), 'all')
        END AS policy_roles
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql;
