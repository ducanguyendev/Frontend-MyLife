import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, LogIn, User as UserIcon, LogOut, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { LoginModal } from '../components/LoginModal';
import { UserMenu } from '../components/UserMenu';
import { UserProfileModal } from '../components/UserProfileModal';

interface NavLinkItem {
  id: string;
  labelKey: string;
  type: 'scroll' | 'route';
  path?: string;
  defaultValue?: string;
}

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navLinks: NavLinkItem[] = [
    { id: 'home', labelKey: 'navigation.home', type: 'scroll' },
    { id: 'about', labelKey: 'navigation.about', type: 'scroll' },
    { id: 'skills', labelKey: 'navigation.skills', type: 'scroll' },
    { id: 'projects', labelKey: 'navigation.projects', type: 'scroll' },
    { id: 'experience', labelKey: 'navigation.experience', type: 'scroll' },
    { id: 'family-tree', labelKey: 'navigation.familyTree', defaultValue: 'Gia Phả', type: 'route', path: '/family-tree' },
    { id: 'expense-tracker', labelKey: 'navigation.expenseTracker', defaultValue: 'Chi Tiêu', type: 'route', path: '/expense-tracker' },
    { id: 'contact', labelKey: 'navigation.contact', type: 'scroll' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Detect active section chỉ khi đang ở trang chủ
      if (window.location.pathname === '/' || window.location.pathname === '/home') {
        const scrollPosition = window.scrollY + 100;
        for (const link of navLinks) {
          if (link.type === 'scroll') {
            const el = document.getElementById(link.id);
            if (el) {
              const top = el.offsetTop;
              const height = el.offsetHeight;
              if (scrollPosition >= top && scrollPosition < top + height) {
                setActiveSection(link.id);
              }
            }
          }
        }
      } else {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lắng nghe sự kiện hết hạn Refresh Token để tự động mở form Đăng nhập
  useEffect(() => {
    const handleExpired = () => {
      setIsProfileModalOpen(false);
      setIsMobileMenuOpen(false);
      setIsLoginModalOpen(true);
    };

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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: NavLinkItem) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (link.type === 'route' && link.path) {
      navigate(link.path);
      setActiveSection(link.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(link.id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(link.id);
        if (el) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = el.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }
      setActiveSection(link.id);
    }
  };

  const handleSwitchAccount = () => {
    setIsProfileModalOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    setIsLoginModalOpen(true);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-45 transition-all duration-300 ${
          isScrolled
            ? 'bg-primary-bg/85 backdrop-blur-md border-b border-custom-border py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Left Side */}
          <div className="w-24 min-h-[1px]"></div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-8">
            {navLinks.map((link) => {
              const labelText = t(link.labelKey) !== link.labelKey ? t(link.labelKey) : (link.defaultValue || link.id);
              return (
                <a
                  key={link.id}
                  href={link.type === 'route' ? link.path : `#${link.id}`}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`text-sm font-medium tracking-widest uppercase transition-colors relative py-1 ${
                    activeSection === link.id
                      ? 'text-primary-text font-semibold'
                      : 'text-secondary-text hover:text-primary-text'
                  }`}
                >
                  {labelText}
                  {activeSection === link.id && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary-text"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Header Right */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />

            <button
              onClick={toggleTheme}
              className="text-primary-text hover:text-accent transition-colors p-2 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {isAuthenticated ? (
              <UserMenu
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onSwitchAccount={handleSwitchAccount}
              />
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-full border border-custom-border text-primary-text hover:bg-primary-text hover:text-primary-bg transition-all cursor-pointer flex items-center gap-2"
              >
                <LogIn size={15} />
                {t('common.login')}
              </button>
            )}
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="text-primary-text p-2 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="w-8 h-8 rounded-full overflow-hidden cursor-pointer flex items-center justify-center border border-custom-border"
                aria-label="Profile"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.email}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-accent text-black font-mono font-bold text-xs flex items-center justify-center">
                    {user?.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="p-2 text-primary-text cursor-pointer"
                aria-label="Login"
              >
                <LogIn size={20} />
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
              className="md:hidden bg-primary-bg border-b border-custom-border overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {isAuthenticated && user && (
                  <div className="p-4 bg-secondary-bg/80 border border-custom-border rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent text-black font-mono font-bold text-sm flex items-center justify-center">
                        {user.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary-text truncate">{user.email}</p>
                        <p className="text-[10px] text-accent font-semibold">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSwitchAccount}
                      className="p-2 text-secondary-text hover:text-accent"
                      title="Chuyển đổi tài khoản"
                    >
                      <ArrowLeftRight size={16} />
                    </button>
                  </div>
                )}

                {navLinks.map((link) => {
                  const labelText = t(link.labelKey) !== link.labelKey ? t(link.labelKey) : (link.defaultValue || link.id);
                  return (
                    <a
                      key={link.id}
                      href={link.type === 'route' ? link.path : `#${link.id}`}
                      onClick={(e) => handleNavClick(e, link)}
                      className={`text-base font-medium tracking-widest uppercase py-2 border-b border-custom-border/50 ${
                        activeSection === link.id ? 'text-primary-text font-bold' : 'text-secondary-text'
                      }`}
                    >
                      {labelText}
                    </a>
                  );
                })}

                {isAuthenticated && (
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 py-2 text-sm text-primary-text font-medium"
                    >
                      <UserIcon size={18} className="text-accent" />
                      <span>{t('navigation.profile', { defaultValue: 'Thông tin cá nhân' })}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-3 py-2 text-sm text-red-500 font-medium"
                    >
                      <LogOut size={18} />
                      <span>{t('navigation.logout', { defaultValue: 'Đăng xuất' })}</span>
                    </button>
                  </div>
                )}

                <LanguageSwitcher isMobile />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSwitchAccount={handleSwitchAccount}
      />
    </>
  );
};