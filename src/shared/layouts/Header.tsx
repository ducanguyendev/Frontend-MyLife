import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Menu, X, User as UserIcon, LogOut, ArrowLeftRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeSwitch } from '../components';
import { LoginModal } from '@/features/auth/components/LoginModal';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { UserProfileModal } from '@/features/profile/components/UserProfileModal';
import { getDisplayNameInitials, getUserDisplayName } from '@/shared/utils/userDisplayName';

const NAV_LINKS = [
  { id: 'home', labelKey: 'navigation.home' },
  { id: 'about', labelKey: 'navigation.about' },
  { id: 'skills', labelKey: 'navigation.skills' },
  { id: 'projects', labelKey: 'navigation.projects' },
  { id: 'experience', labelKey: 'navigation.experience' },
  { id: 'contact', labelKey: 'navigation.contact' },
] as const;

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, isUser, user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const userDisplayName = getUserDisplayName(user, t('common.userProfile.accountFallback', { defaultValue: 'Account' }));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Detect active section
      const scrollPosition = window.scrollY + 100;
      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(link.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lắng nghe sự kiện hết hạn Refresh Token để đóng modal cá nhân và menu
  useEffect(() => {
    const handleExpired = () => {
      setIsProfileModalOpen(false);
      setIsMobileMenuOpen(false);
    };

    // Lắng nghe sự kiện mở Login từ trang Register (sau khi đăng ký thành công)
    const handleOpenLogin = () => {
      setIsLoginModalOpen(true);
    };

    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('ui:openLogin', handleOpenLogin);
    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('ui:openLogin', handleOpenLogin);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80; // Header height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsProfileModalOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    setIsLoginModalOpen(true);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'py-4 bg-white/90 dark:bg-secondary-bg/90 backdrop-blur-md border-b border-gray-100 dark:border-custom-border shadow-sm'
            : 'py-6 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between gap-4">
          {/* Left Side: Logo */}
           <div className="flex items-center">
             <img 
               src={theme === 'dark' ? '/assets/logo-dark.png' : '/assets/logo-light.png'}
               alt="Mylife" 
               className="h-10 w-auto aspect-[261/172] object-contain transition-opacity duration-300 dark:bg-white"
             />
          </div>

          {/* Desktop Navigation */}
          <nav className={`hidden xl:flex items-center justify-center gap-1 p-1 h-10 rounded-full border transition-colors ${
            isScrolled ? 'bg-gray-50/50 dark:bg-primary-bg/50 border-gray-200 dark:border-custom-border' : 'glass-pill'
          }`}>
        {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleNavClick(e, link.id)}
                className={`px-4 h-full flex items-center justify-center rounded-full text-sm whitespace-nowrap font-medium transition-all duration-300 relative z-10 ${
                  activeSection === link.id
                    ? (isScrolled ? 'text-white dark:text-[#111111]' : 'text-[#111111] dark:text-white')
                    : (isScrolled ? 'text-gray-500 dark:text-white/70 hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10' : 'text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10')
                }`}
              >
                {activeSection === link.id && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className={`absolute inset-0 rounded-full border -z-10 ${
                      isScrolled ? 'bg-[#111111] dark:bg-white border-[#111111] dark:border-white' : 'bg-white dark:bg-[#111111] border-white dark:border-[#111111]'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t(link.labelKey)}</span>
              </a>
            ))}
          </nav>

          {/* Header Right */}
          <div className="hidden md:flex items-center gap-2 justify-end">
            <ThemeSwitch />
            <LanguageSwitcher />

            {isUser && (
              <button
                type="button"
                onClick={() => navigate('/mylife')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary-bg/50 hover:bg-secondary-bg border border-custom-border text-secondary-text hover:text-primary-text transition-colors cursor-pointer   "
                aria-label={t('myLife.title')}
                title={t('myLife.title')}
              >
                <LayoutGrid size={17} aria-hidden="true" />
              </button>
            )}

            {isAuthenticated ? (
              <UserMenu
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onSwitchAccount={handleSwitchAccount}
              />
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`px-4 h-10 flex items-center justify-center text-sm font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer    ${
                  isScrolled 
                    ? 'bg-[#111111] dark:bg-white text-white dark:text-black'
                    : 'bg-white dark:bg-[#111111] text-black dark:text-white shadow-sm'
                }`}
              >
                {t('navigation.login')}
              </button>
            )}
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="w-10 h-10 rounded-full overflow-hidden cursor-pointer flex items-center justify-center border border-custom-border   "
                aria-label="Profile"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={userDisplayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-accent text-black font-mono font-bold text-xs flex items-center justify-center">
                    {getDisplayNameInitials(userDisplayName)}
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-1.5 text-xs font-bold bg-white text-black rounded-full cursor-pointer"
              >
                {t('navigation.login')}
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary-text p-2 cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-card mt-2 mx-4 overflow-hidden rounded-2xl border border-white/20"
            >
              <div className="px-6 py-6 flex flex-col gap-4">
                {/* User Info Header on Mobile Drawer if logged in */}
                {isAuthenticated && user && (
                  <div className="p-4 bg-white/10 rounded-xl flex items-center justify-between border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white text-black font-mono font-bold text-sm flex items-center justify-center">
                        {getDisplayNameInitials(userDisplayName)}
                      </div>
                      <div className="min-w-0 text-white">
                        <p className="text-sm font-bold truncate">{userDisplayName}</p>
                        <p className="text-xs text-white/70 truncate">{user.role} · {user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSwitchAccount}
                      className="p-2 text-white/70 hover:text-white"
                    >
                      <ArrowLeftRight size={16} />
                    </button>
                  </div>
                )}

              {NAV_LINKS.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    className={`text-base font-medium tracking-widest uppercase py-3 border-b border-white/10 ${
                      activeSection === link.id ? 'text-white font-bold' : 'text-white/70'
                    }`}
                  >
                    {t(link.labelKey)}
                  </a>
                ))}

                {isAuthenticated && (
                  <div className="pt-2 flex flex-col gap-2">
                    {isUser && (<button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/mylife');
                      }}
                      className="w-full flex items-center gap-3 py-2 text-sm text-white font-medium"
                      aria-label={t('myLife.title')}
                    >
                      <LayoutGrid size={18} />
                      <span>{t('myLife.title')}</span>
                    </button>)}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 py-2 text-sm text-white font-medium"
                    >
                      <UserIcon size={18} />
                      <span>{t('navigation.profile', { defaultValue: 'Thông tin cá nhân' })}</span>
                    </button>
                    <button
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-3 py-2 text-sm text-red-400 font-medium"
                    >
                      <LogOut size={18} />
                      <span>{t('navigation.logout', { defaultValue: 'Đăng xuất' })}</span>
                    </button>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between gap-4">
                  <ThemeSwitch />
                  <LanguageSwitcher isMobile />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Inline Popup Modal Form */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSwitchAccount={handleSwitchAccount}
      />
    </>
  );
};
