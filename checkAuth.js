// Check authentication state on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    // Check if user has an active Supabase session
    // No localStorage fallback - user must have valid session
    if (window.supabase && window.supabase.auth) {
        window.supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no active session, redirect to login page
                window.location.href = 'login.html';
            }
        }).catch((error) => {
            console.error('Error checking session:', error);
            // On error, redirect to login page
            window.location.href = 'login.html';
        });
    } else {
        // If Supabase is not available, redirect to login page
        window.location.href = 'login.html';
    }
}