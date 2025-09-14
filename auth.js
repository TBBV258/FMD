// auth.js

// A simple function to check for the global dependencies.
function areDependenciesLoaded() {
  return typeof window.supabase !== 'undefined' && window.supabaseClientInitialized;
}

function initAuth() {
  if (!areDependenciesLoaded()) {
    console.error('Supabase client is not available. Check your script loading order.');
    // Retry after a short delay
    setTimeout(initAuth, 100);
    return;
  }
  
  // Use a promise-based approach to ensure auth is ready
  return new Promise((resolve) => {
    // Check for an active session
    if (window.supabase && window.supabase.auth) {
      window.supabase.auth.getSession().then(({ data: { session } }) => {
        // Check if the current page is login.html and a session exists
        if (session && window.location.pathname.endsWith('/login.html')) {
          // Redirect to the index page if already logged in
          window.location.href = '/index.html';
        }
        
        // Check if a session exists and the current page is not login.html
        if (!session && !window.location.pathname.endsWith('/login.html')) {
          // Check localStorage for auth token as fallback
          const authToken = localStorage.getItem('auth_token');
          if (!authToken) {
            // Redirect to the login page if no session exists
            window.location.href = '/login.html';
          }
        }
        resolve(); // Resolve the promise once auth is handled
      }).catch((error) => {
        console.error('Error checking session:', error);
        // Fallback to localStorage check
        const authToken = localStorage.getItem('auth_token');
        if (!authToken && !window.location.pathname.endsWith('/login.html')) {
          window.location.href = '/login.html';
        }
        resolve(); // Still resolve to prevent hanging
      });
    } else {
      // Fallback to localStorage check
      const authToken = localStorage.getItem('auth_token');
      if (!authToken && !window.location.pathname.endsWith('/login.html')) {
        window.location.href = '/login.html';
      }
      resolve();
    }
  });
}

// Call initAuth only after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});