import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage';
import { ReportLostPage } from '@/features/reports/pages/ReportLostPage';
import { ReportFoundPage } from '@/features/reports/pages/ReportFoundPage';
import { FeedPage } from '@/features/feed/pages/FeedPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { ChatPage } from '@/features/chat/pages/ChatPage';
import { MapPage } from '@/features/map/pages/MapPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('🔒 ProtectedRoute: State:', { isAuthenticated, isLoading });
  
  if (isLoading) {
    console.log('🔒 ProtectedRoute: Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('🔒 ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('🔒 ProtectedRoute: User authenticated, showing children');
  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('🔓 PublicRoute: State:', { isAuthenticated, isLoading });
  
  if (isLoading) {
    console.log('🔓 PublicRoute: Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (isAuthenticated) {
    console.log('🔓 PublicRoute: User already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('🔓 PublicRoute: User not authenticated, showing login page');
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  console.log('🎭 AppRouter: Component function called');
  
  const location = useLocation();
  
  console.log('🔍 AppRouter: Current location:', location.pathname);
  console.log('🔍 AppRouter: Location object:', location);

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route 
          index 
          element={<Navigate to="/dashboard/documents" replace />} 
        />
        <Route 
          path="documents" 
          element={<DocumentsPage />} 
        />
        <Route 
          path="feed" 
          element={<FeedPage />} 
        />
        <Route 
          path="report-lost" 
          element={<ReportLostPage />} 
        />
        <Route 
          path="report-found" 
          element={<ReportFoundPage />} 
        />
        <Route 
          path="profile" 
          element={<ProfilePage />} 
        />
        <Route 
          path="chat" 
          element={<ChatPage />} 
        />
        <Route 
          path="map" 
          element={<MapPage />} 
        />
      </Route>
      
      {/* Default redirect */}
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to="/login" replace />} 
      />
    </Routes>
  );
};
