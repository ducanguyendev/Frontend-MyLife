import { useAuth } from '@/features/auth/context/AuthContext';
import { LanguageButton, LanguageOptionList } from './preferences/PreferenceControls';

/** Compatibility entry point for Register and the legacy public navigation. */
export function LanguageSwitcher({ isMobile = false }: { isMobile?: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading || isAuthenticated) return null;
  return isMobile ? <LanguageOptionList/> : <LanguageButton/>;
}
export default LanguageSwitcher;
