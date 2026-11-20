import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Menu, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { UserProfileModal } from '@/features/profile/components/UserProfileModal';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { AppearanceControls } from '@/shared/components/AppearanceControls';
import { Button, Modal } from '@/shared/components/ui';
import { IconButton } from '@/design-system/components/Controls';

export const landingLinks = [
  { id: 'story', key: 'product' }, { id: 'family-story', key: 'family' },
  { id: 'memories', key: 'memories' }, { id: 'library-story', key: 'library' }, { id: 'places', key: 'places' },
] as const;

export function LandingHeader({ onLogin }: { onLogin: () => void }) {
  const { t } = useLanguage();
  const { isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const entry = isAdmin ? '/Home/Admin' : '/mylife';
  const entryLabel = t(isAdmin ? 'landing.enterAdmin' : 'landing.enter');
  const login = () => { setMenuOpen(false); onLogin(); };
  const switchAccount = async () => { setProfileOpen(false); await logout(); onLogin(); };
  return <>
    <header className="landing-header">
      <div className="landing-header__inner">
        <Link to="/" className="landing-brand" aria-label={t('landing.publicHome')}><Leaf size={25} strokeWidth={1.6}/><span>MyLife<span className="landing-brand__dot">.</span></span></Link>
        <nav className="landing-header__nav" aria-label={t('landing.navigation')}>
          {landingLinks.map(link => <a key={link.id} href={`#${link.id}`}>{t(`landing.${link.key}`)}</a>)}
        </nav>
        <div className="landing-header__utilities"><div className="landing-header__preferences"><AppearanceControls /></div>
          <div className="landing-header__desktop-actions">
            {!isLoading && (isAuthenticated ? <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={14}/>} onClick={() => navigate(entry)}>{entryLabel}</Button> : <><Button variant="ghost" size="sm" onClick={login}>{t('landing.login')}</Button><Button size="sm" onClick={() => navigate('/Register')}>{t('landing.register')}</Button></>)}
          </div>
          {!isLoading && isAuthenticated && <UserMenu appearance="shell" onOpenProfile={() => setProfileOpen(true)} onSwitchAccount={switchAccount}/>}
          <IconButton label={t('landing.menu')} variant="ghost" className="landing-header__menu" onClick={() => setMenuOpen(true)}><Menu size={21}/></IconButton>
        </div>
      </div>
    </header>
    <Modal isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="MyLife" placement="drawer" maxWidth="sm">
      <nav className="landing-mobile-nav" aria-label={t('landing.navigation')}>{landingLinks.map(link => <a key={link.id} href={`#${link.id}`} onClick={() => setMenuOpen(false)}>{t(`landing.${link.key}`)}<ArrowUpRight size={16}/></a>)}</nav>
      {!isAuthenticated && !isLoading && <div className="landing-mobile-preferences"><AppearanceControls/></div>}
      <div className="mt-8 grid gap-3">{isAuthenticated ? <><Button onClick={() => { setMenuOpen(false); navigate(entry); }}>{entryLabel}</Button><Button variant="secondary" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}>{t('navigation.profile')}</Button></> : <><Button onClick={() => { setMenuOpen(false); navigate('/Register'); }}>{t('landing.createAccount')}</Button><Button variant="secondary" onClick={login}>{t('landing.login')}</Button></>}</div>
    </Modal>
    <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} onSwitchAccount={switchAccount}/>
  </>;
}
