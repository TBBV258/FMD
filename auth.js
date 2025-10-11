// auth.js

// A simple function to check for the global dependencies.
function areDependenciesLoaded() {
  return typeof window.supabase !== 'undefined' && window.supabaseClientInitialized;
}

// Track initialization attempts to prevent infinite loops
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 50; // Maximum 5 seconds of retries

function initAuth() {
  initAttempts++;
  
  if (!areDependenciesLoaded()) {
    if (initAttempts < MAX_INIT_ATTEMPTS) {
      console.log(`Waiting for Supabase to load... (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS})`);
      setTimeout(initAuth, 100);
      return;
    } else {
      console.error('Supabase failed to load after maximum attempts. Using fallback authentication.');
      handleAuthFallback();
      return;
    }
  }
  
  // Use a promise-based approach to ensure auth is ready
  return new Promise((resolve) => {
    // Check for an active session
    if (window.supabase && window.supabase.auth) {
      window.supabase.auth.getSession().then(({ data: { session } }) => {
        // Check if the current page is login.html and a session exists
        if (session && window.location.pathname.endsWith('/login.html')) {
          // Redirect to the index page if already logged in
          window.location.href = 'index.html';
        }
        
        // Check if a session exists and the current page is not login.html
        if (!session && !window.location.pathname.endsWith('/login.html')) {
          // Check localStorage for auth token as fallback
          const authToken = localStorage.getItem('auth_token');
          if (!authToken) {
            // Redirect to the login page if no session exists
            window.location.href = 'login.html';
          }
        }
        resolve(); // Resolve the promise once auth is handled
      }).catch((error) => {
        console.error('Error checking session:', error);
        // Fallback to localStorage check
        handleAuthFallback();
        resolve(); // Still resolve to prevent hanging
      });
    } else {
      // Fallback to localStorage check
      handleAuthFallback();
      resolve();
    }
  });
}

function handleAuthFallback() {
  const authToken = localStorage.getItem('auth_token');
  if (!authToken && !window.location.pathname.endsWith('/login.html')) {
    window.location.href = 'login.html';
  }
}

// Call initAuth only after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Listen for Supabase ready event
  window.addEventListener('supabaseReady', () => {
    console.log('Supabase ready event received, initializing auth...');
    initAuth();
  });
  
  // Fallback: if supabaseReady event doesn't fire within 3 seconds, try anyway
  setTimeout(() => {
    if (!window.supabaseClientInitialized) {
      console.log('Supabase ready event timeout, attempting auth initialization...');
      initAuth();
    }
  }, 3000);
});