import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  AlertTriangle, 
  MessageCircle, 
  MapPin, 
  User 
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from '@/i18n';

const navigationItems = [
  {
    path: '/dashboard/documents',
    icon: FileText,
    labelKey: 'nav.my_docs',
  },
  {
    path: '/dashboard/feed',
    icon: Search,
    labelKey: 'nav.feed',
  },
  {
    path: '/dashboard/report-lost',
    icon: AlertTriangle,
    labelKey: 'nav.report_lost',
  },
  {
    path: '/dashboard/chat',
    icon: MessageCircle,
    labelKey: 'nav.chat',
  },
  {
    path: '/dashboard/map',
    icon: MapPin,
    labelKey: 'nav.map',
  },
  {
    path: '/dashboard/profile',
    icon: User,
    labelKey: 'nav.profile',
  },
];

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom z-40 shadow-lg">
      <div className="grid grid-cols-6">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center py-3 px-1 text-xs transition-all duration-200 touch-target',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={clsx(
                      'h-6 w-6 mb-1 transition-transform duration-200',
                      isActive ? 'text-primary-600 dark:text-primary-400 scale-110' : ''
                    )} 
                  />
                  <span className="leading-none font-medium">{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
