import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { databaseAPI } from '@/lib/api/database';
import { NotificationCenter } from './NotificationCenter';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  console.log('🔔 NotificationBell: Component rendered for user:', user?.email);

  // Fetch unread notification count
  const { data: notifications } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: () => databaseAPI.getUserNotifications(user?.id || ''),
    enabled: !!user?.id,
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleNotificationClick = () => {
    console.log('🔔 NotificationBell: Opening notification center');
    setIsNotificationCenterOpen(true);
  };

  const handleCloseNotificationCenter = () => {
    console.log('🔔 NotificationBell: Closing notification center');
    setIsNotificationCenterOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNotificationClick}
        className="relative"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={handleCloseNotificationCenter}
      />
    </>
  );
};
