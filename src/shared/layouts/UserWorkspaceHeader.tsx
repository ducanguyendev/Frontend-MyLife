import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { UserProfileModal } from '@/features/profile/components/UserProfileModal';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ThemeSwitch } from '@/shared/components';
import { useLanguage } from '@/shared/hooks/useLanguage';

interface UserWorkspaceHeaderProps {
  backTo: string;
}

export const UserWorkspaceHeader: React.FC<UserWorkspaceHeaderProps> = ({ backTo }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSwitchAccount = async () => {
    setIsProfileModalOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-3 z-40 mx-auto mt-3 flex w-[96%] max-w-[1400px] items-center justify-between gap-2 rounded-2xl border border-custom-border bg-secondary-bg/90 px-2 py-2 shadow-sm backdrop-blur-md sm:gap-3 sm:px-4 md:rounded-full">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to={backTo}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-custom-border bg-secondary-bg/60 text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label={t('common.back', { defaultValue: 'Back' })}
            title={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <span className="hidden truncate text-base font-bold tracking-tight text-primary-text sm:inline sm:text-lg">MyLife</span>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeSwitch />
          <LanguageSwitcher />
          <UserMenu
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onSwitchAccount={handleSwitchAccount}
          />
        </div>
      </header>
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSwitchAccount={handleSwitchAccount}
      />
    </>
  );
};
