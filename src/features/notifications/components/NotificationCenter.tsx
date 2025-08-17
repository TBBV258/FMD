import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, MessageCircle, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseAPI } from '@/lib/api/database';
import type { Notification } from '@/lib/types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  console.log('🔔 NotificationCenter: Component rendered for user:', user?.email);

  // Fetch user notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: () => databaseAPI.getUserNotifications(user?.id || ''),
    enabled: !!user?.id,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await databaseAPI.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (notifications) {
        const unreadNotifications = notifications.filter(n => !n.read);
        await Promise.all(
          unreadNotifications.map(n => databaseAPI.markNotificationAsRead(n.id))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
    },
  });

  // Filter notifications based on active tab
  const filteredNotifications = notifications?.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.read;
    }
    return true;
  }) || [];

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleMarkAsRead = (notificationId: string) => {
    console.log('✅ NotificationCenter: Marking notification as read:', notificationId);
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('✅ NotificationCenter: Marking all notifications as read');
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_found':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'chat_message':
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'location_update':
        return <MapPin className="w-5 h-5 text-purple-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'document_found':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'chat_message':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'location_update':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return t('notifications.just_now') || 'Agora mesmo';
    } else if (diffInMinutes < 60) {
      return t('notifications.minutes_ago', { minutes: Math.floor(diffInMinutes) }) || `${Math.floor(diffInMinutes)}m atrás`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('notifications.hours_ago', { hours }) || `${hours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              {t('notifications.title') || 'Notificações'}
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t('notifications.all') || 'Todas'}
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'unread'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t('notifications.unread') || 'Não lidas'}
              {unreadCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                {t('notifications.mark_all_read') || 'Marcar todas como lidas'}
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Bell className="w-12 h-12 mx-auto mb-2" />
                <p>
                  {activeTab === 'unread'
                    ? t('notifications.no_unread') || 'Nenhuma notificação não lida'
                    : t('notifications.no_notifications') || 'Nenhuma notificação ainda'
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 transition-all duration-200 ${
                    notification.read
                      ? 'opacity-75 hover:opacity-100'
                      : 'opacity-100'
                  } ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatNotificationTime(notification.created_at)}
                          </p>
                        </div>
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsReadMutation.isPending}
                            className="ml-2"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
