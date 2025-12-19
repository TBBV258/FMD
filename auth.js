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
  
  // Only check if user is on login page and has an active session
  // No automatic login - user must manually authenticate
  return new Promise((resolve) => {
    if (window.supabase && window.supabase.auth) {
      window.supabase.auth.getSession().then(({ data: { session } }) => {
        // Only redirect from login page if user is already authenticated
        if (session && window.location.pathname.endsWith('login.html')) {
          console.log('User already authenticated, redirecting to main app');
          window.location.href = 'index.html';
        }
        resolve();
      }).catch((error) => {
        console.error('Error checking session:', error);
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Call initAuth only after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});