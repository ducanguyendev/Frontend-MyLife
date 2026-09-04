import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { User, LogOut, ArrowLeftRight, ChevronDown, Shield, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserMenuProps {
  onOpenProfile: () => void;
  onSwitchAccount: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenProfile, onSwitchAccount }) => {
  const { t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar, user?.email]);

  if (!user) return null;

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  const avatarSrc = user.avatar || authService.getAvatarUrl(user.email);

  const handleProfileClick = () => {
    setIsOpen(false);
    onOpenProfile();
  };

  const handleSwitchClick = () => {
    setIsOpen(false);
    onSwitchAccount();
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button: User Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-custom-border hover:border-accent bg-secondary-bg/60 hover:bg-secondary-bg transition-all cursor-pointer group"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-custom-border shadow-sm">
          {!imgError ? (
            <img
              src={avatarSrc}
              alt={user.email}
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-accent text-black font-mono font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-secondary-bg" />
        </div>

        <span className="text-xs font-semibold text-primary-text max-w-[120px] truncate hidden lg:inline">
          {user.email}
        </span>

        <ChevronDown
          size={14}
          className={`text-secondary-text group-hover:text-primary-text transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-64 bg-secondary-bg border border-custom-border rounded-2xl shadow-2xl p-2 z-50 text-primary-text font-sans backdrop-blur-lg"
          >
            {/* Header with info */}
            <div className="px-3 py-3 border-b border-custom-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-custom-border shadow-sm shrink-0">
                  {!imgError ? (
                    <img
                      src={avatarSrc}
                      alt={user.email}
                      onError={() => setImgError(true)}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-accent text-black font-mono font-bold text-sm flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-primary-text truncate">{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                    <Shield size={10} />
                    {user.role === 'ADMIN' || user.role === 'Administrator'
                      ? t('navigation.roleAdmin', { defaultValue: 'Quản trị viên' })
                      : t('navigation.roleMember', { defaultValue: 'Thành viên' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="py-1 space-y-0.5">
              {/* Admin Dashboard (Only visible for Admin) */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/Home/Admin');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-accent hover:bg-accent/10 transition-colors text-left cursor-pointer group"
                >
                  <LayoutDashboard size={16} className="text-accent" />
                  <span className="font-semibold">Quản trị hệ thống</span>
                </button>
              )}

              {/* Profile Details */}
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-primary-text hover:bg-primary-bg transition-colors text-left cursor-pointer group"
              >
                <User size={16} className="text-secondary-text group-hover:text-accent transition-colors" />
                <span>{t('navigation.profile', { defaultValue: 'Thông tin cá nhân' })}</span>
              </button>

              {/* Switch Account */}
              <button
                onClick={handleSwitchClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-primary-text hover:bg-primary-bg transition-colors text-left cursor-pointer group"
              >
                <ArrowLeftRight size={16} className="text-secondary-text group-hover:text-accent transition-colors" />
                <span>{t('navigation.switchAccount', { defaultValue: 'Chuyển đổi tài khoản' })}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-custom-border/60 my-1" />

            {/* Logout */}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left cursor-pointer group"
            >
              <LogOut size={16} className="text-red-500" />
              <span>{t('navigation.logout', { defaultValue: 'Đăng xuất' })}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
