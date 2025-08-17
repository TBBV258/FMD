import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { TopNavigation } from '@/components/common/TopNavigation';

export const DashboardLayout: React.FC = () => {
  console.log('🔍 DashboardLayout: Component rendered');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content */}
      <main className="pb-16 pt-16 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto section-padding">
        <div className="container-responsive">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};
