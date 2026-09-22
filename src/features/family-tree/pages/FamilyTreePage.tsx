import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useTheme } from '@/shared/context/ThemeContext';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { UserProfileModal } from '@/features/profile/components/UserProfileModal';
import { FamilyTreeManager } from '@/features/admin/components/FamilyTreeManager';

export const FamilyTreePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
  }), []);

  const showToast = useCallback((text: string, ok: boolean) => {
    showNotification({
      message: text,
      type: ok ? 'success' : 'error',
    });
  }, [showNotification]);

  return (
    <div className="relative min-h-screen bg-primary-bg font-sans overflow-x-hidden transition-colors duration-300 flex flex-col">
      {/* Floating Top Header Navigation */}
      <header className="sticky top-4 z-40 mx-auto w-[96%] max-w-[1400px] glass-nav rounded-2xl md:rounded-full px-4 py-3 flex items-center justify-between gap-4 shadow-sm mb-6">
        {/* Left: Back & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/Home')}
            className="w-8 h-8 rounded-full bg-secondary-bg/60 hover:bg-secondary-bg border border-custom-border text-secondary-text hover:text-primary-text flex items-center justify-center transition-colors cursor-pointer"
            title={t('common.back', { defaultValue: 'Quay lại' })}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent text-primary-bg flex items-center justify-center font-bold text-sm shadow-md">
              ML
            </div>
            <span className="font-bold tracking-tight text-primary-text text-lg hidden sm:block">
              MyLife
            </span>
          </div>
        </div>

        {/* Center: Title / Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-secondary-text">
          <span className="cursor-pointer hover:text-primary-text" onClick={() => navigate('/Home')}>
            {t('navigation.home', { defaultValue: 'Trang chủ' })}
          </span>
          <span>/</span>
          <span className="text-accent">{t('admin.family_tree', { defaultValue: 'Quản lý Gia phả' })}</span>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-bg/50 hover:bg-secondary-bg border border-custom-border text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <LanguageSwitcher />

          <button
            onClick={() => navigate('/Home')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-bg/50 hover:bg-secondary-bg border border-custom-border text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
            title="Home"
          >
            <Home size={14} />
          </button>

          <div className="h-4 w-px bg-custom-border mx-1" />

          {/* User Menu */}
          <UserMenu
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onSwitchAccount={() => {
              logout();
              navigate('/');
            }}
          />
        </div>
      </header>

      {/* Main Family Tree Manager Container */}
      <main className="relative z-10 flex-1 w-[96%] max-w-[1400px] mx-auto pb-12">
        <div className="glass-pill rounded-3xl p-4 sm:p-6 shadow-xl border border-custom-border overflow-hidden min-h-[700px]">
          <FamilyTreeManager showToast={showToast} getHeaders={getHeaders} />
        </div>
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSwitchAccount={() => {
          setIsProfileModalOpen(false);
          logout();
          navigate('/');
        }}
      />
    </div>
  );
};
export default FamilyTreePage;
