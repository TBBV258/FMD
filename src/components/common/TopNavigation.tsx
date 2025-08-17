import React, { useState } from 'react';
import { Crown, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEntitlements } from '@/lib/hooks/useEntitlements';
import { useTranslation } from '@/i18n';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

export const TopNavigation: React.FC = () => {
  const { signOut, profile } = useAuth();
  const entitlements = useEntitlements();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => 
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('findmydocs_theme', newTheme);
  };

  const handleLogout = async () => {
    try {
      console.log('🔐 TopNavigation: Logging out...');
      await signOut();
      console.log('✅ TopNavigation: Logout successful');
    } catch (error) {
      console.error('❌ TopNavigation: Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-top z-50 shadow-sm">
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-500 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/fmd-logo.jpg" 
                alt="FindMyDocs Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
              FindMyDocs
            </span>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <NotificationBell />
            
            {!entitlements.canAccessAllDocumentTypes && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Crown className="h-4 w-4" />}
                className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                {t('nav.upgrade')}
              </Button>
            )}

            <div className="flex items-center gap-1">
              <Button
                variant={currentLanguage === 'pt' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('pt')}
                className="px-3 py-2 text-sm"
              >
                PT
              </Button>
              <Button
                variant={currentLanguage === 'en' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="px-3 py-2 text-sm"
              >
                EN
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 touch-target"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
                      <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex flex-col gap-3 space-responsive-sm">
                <div className="flex justify-center">
                  <NotificationBell />
                </div>
                
                {!entitlements.canAccessAllDocumentTypes && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Crown className="h-4 w-4" />}
                                      className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 justify-start touch-target"
                >
                  {t('nav.upgrade')}
                </Button>
                )}

              <div className="flex flex-col gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2">{t('nav.language')}:</span>
                <div className="flex gap-2">
                  <Button
                    variant={currentLanguage === 'pt' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('pt')}
                    className="flex-1 touch-target"
                  >
                    PT
                  </Button>
                  <Button
                    variant={currentLanguage === 'en' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className="flex-1 touch-target"
                  >
                    EN
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                leftIcon={isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                className="justify-start touch-target"
              >
                {isDark ? t('nav.light_mode') : t('nav.dark_mode')}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="h-4 w-4" />}
                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 touch-target"
              >
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
