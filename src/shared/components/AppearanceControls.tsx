import { useAuth } from '@/features/auth/context/AuthContext';
import { ThemeModeButton, LanguageButton } from './preferences/PreferenceControls';

/** Public utilities; authenticated preferences live in the existing account menu. */
export function AppearanceControls() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading || isAuthenticated) return null;
  return <div className="appearance-controls"><ThemeModeButton/><LanguageButton/></div>;
}
