import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

console.log('📦 main.tsx: All imports loaded successfully');
console.log('📦 main.tsx: React version:', React.version);
console.log('📦 main.tsx: ReactDOM available:', !!ReactDOM);

console.log('🚀 main.tsx: Starting application initialization...');

// Function to initialize the app
function initializeApp() {
  console.log('🔧 main.tsx: initializeApp function called');
  
  // Check if root element exists
  const rootElement = document.getElementById('root');
  console.log('🔍 main.tsx: Root element found:', !!rootElement, rootElement);
  
  if (!rootElement) {
    console.error('❌ main.tsx: Root element not found!');
    console.error('❌ main.tsx: Document body:', document.body);
    console.error('❌ main.tsx: Document ready state:', document.readyState);
    throw new Error('Root element not found');
  }

  try {
    console.log('🔧 main.tsx: Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('🎬 main.tsx: Rendering App component...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ main.tsx: App component rendered successfully!');
  } catch (error) {
    console.error('❌ main.tsx: Error during app initialization:', error);
    throw error;
  }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  console.log('⏳ main.tsx: DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log('✅ main.tsx: DOM already ready, initializing immediately...');
  initializeApp();
}
