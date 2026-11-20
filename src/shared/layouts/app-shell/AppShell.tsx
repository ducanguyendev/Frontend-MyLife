import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BookHeart, CalendarDays, ChevronRight, Home, Images, Leaf, MapPin, Menu, ShieldCheck, TreePine, UserRound } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { UserProfileModal } from '@/features/profile/components/UserProfileModal';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Modal } from '@/shared/components/ui/Modal';
import { IconButton } from '@/design-system/components/Controls';
import './AppShell.css';

export function AppShell({ children, contentScroll = 'auto', contentClassName = '', breadcrumbName }: {
  children: ReactNode; contentScroll?: 'auto' | 'hidden'; contentClassName?: string; breadcrumbName?: string;
}) {
  const { t } = useLanguage();
  const { isAdmin, isUser, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const primary = [
    { to: '/mylife', label: t('appShell.home'), Icon: Home, end: true },
    { to: '/familytree', label: t('appShell.family'), Icon: TreePine },
  ];
  const memories = [
    { to: '/timeline', label: t('appShell.timeline'), Icon: BookHeart },
    { to: '/anniversaries', label: t('appShell.calendar'), Icon: CalendarDays },
    { to: '/library', label: t('appShell.library'), Icon: Images },
  ];
  const isMemberRoute = pathname.startsWith('/mylife/family/member/');
  const isMemoriesRoute = memories.some(item => pathname === item.to || pathname.startsWith(item.to + '/'));
  const openProfile = () => { setDrawerOpen(false); setProfileOpen(true); };
  const switchAccount = async () => { setProfileOpen(false); await logout(); navigate('/'); };
  const link = ({ to, label, Icon, end }: typeof primary[number]) => <NavLink key={to} end={end} to={to} onClick={() => setDrawerOpen(false)} title={label}
    className={({ isActive }) => `app-nav__link ${isActive || (to === '/familytree' && pathname.startsWith('/mylife/family/member/')) ? 'is-active' : ''}`}>
    <Icon size={19} aria-hidden="true"/><span>{label}</span>
  </NavLink>;
  const navigation = <nav className="app-nav" aria-label={t('appShell.navigation')}>
    <div className="app-nav__group">{(isUser ? primary : primary.slice(0, 1)).map(link)}</div>
    {isUser && <div className="app-nav__group">
      <Link to="/timeline" title={t('appShell.memories')} onClick={() => setDrawerOpen(false)} className={`app-nav__link ${isMemoriesRoute ? 'is-active' : ''}`}><BookHeart size={19} aria-hidden="true"/><span>{t('appShell.memories')}</span></Link>
      <div className="app-nav__subnav">{memories.map(({ to, label, Icon }) => <Link key={to} to={to} title={label} onClick={() => setDrawerOpen(false)} aria-current={pathname === to ? 'page' : undefined} className="app-nav__sub-link"><Icon size={15} aria-hidden="true"/><span>{label}</span></Link>)}</div>
    </div>}
    <div className="app-nav__group">{isUser && link({ to: '/map', label: t('appShell.map'), Icon: MapPin })}
      <button type="button" className="app-nav__link" title={t('appShell.me')} onClick={openProfile}><UserRound size={19} aria-hidden="true"/><span>{t('appShell.me')}</span></button>
      {isAdmin && link({ to: '/Home/Admin', label: t('appShell.admin'), Icon: ShieldCheck })}
    </div>
  </nav>;
  return <div className="app-shell">
    <a className="app-shell__skip" href="#app-content">{t('appShell.skipContent')}</a>
    <aside className="app-shell__sidebar">
      <Link to="/mylife" className="app-shell__brand"><span className="app-shell__brand-mark"><Leaf size={23}/></span><span>MyLife<small>{t('appShell.tagline')}</small></span></Link>
      {navigation}
      <div className="app-shell__sidebar-note"><Leaf size={17}/><span>{t('appShell.archiveNote')}</span></div>
    </aside>
    <div className="app-shell__workspace">
      <header className="app-shell__header">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton className="app-shell__menu-toggle" variant="ghost" label={t('appShell.openNavigation')} onClick={() => setDrawerOpen(true)}><Menu size={20}/></IconButton>
          <>{isMemberRoute && <nav className="app-shell__breadcrumb" aria-label={t('family.breadcrumb')}><Link to="/familytree">{t('appShell.family')}</Link><ChevronRight size={13} aria-hidden="true"/><Link to="/familytree">{t('family.members')}</Link><ChevronRight size={13} aria-hidden="true"/><strong aria-current="page">{breadcrumbName || t('appShell.member')}</strong></nav>}</>
        </div>
        <div className="app-shell__utilities">
          <UserMenu appearance="shell" onOpenProfile={openProfile} onSwitchAccount={switchAccount}/>
        </div>
      </header>
      <main id="app-content" tabIndex={-1} className={`app-shell__content app-shell__content--${contentScroll}`}>
        <div className={`app-shell__page ${contentScroll === 'hidden' ? 'app-shell__page--canvas' : ''} ${contentClassName}`}>{children}</div>
      </main>
    </div>
    <Modal isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={t('appShell.navigation')} placement="drawer" maxWidth="sm">
      <Link to="/mylife" onClick={() => setDrawerOpen(false)} className="mb-6 flex items-center gap-3 text-xl font-semibold"><Leaf className="text-accent"/>MyLife</Link>{navigation}
    </Modal>
    <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} onSwitchAccount={switchAccount}/>
  </div>;
}
