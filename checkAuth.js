// Check authentication state on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    // For now, we'll just check if there's a token in localStorage
    const isAuthenticated = localStorage.getItem('auth_token');
    
    if (!isAuthenticated) {
        // If not authenticated, redirect to login page
        window.location.href = 'login.html';
    }
}