import type { ReactNode } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, Languages, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { SegmentedControl } from '@/design-system/components/Controls';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useTheme, type ThemePreference } from '@/shared/context/ThemeContext';
import { supportedLanguages } from '@/shared/i18n/languages';
import { normalizeDisplayText } from '@/shared/utils/normalizeDisplayText';
import './PreferenceControls.css';

const themeOptions = [
  { value: 'system', Icon: Monitor }, { value: 'light', Icon: Sun }, { value: 'dark', Icon: Moon },
] as const;

/** Button/portal composition uses the existing Radix selection and focus infrastructure. */
function PreferencePopover({ title, value, onChange, trigger, children, kind }: {
  title: string; value: string; onChange: (value: string) => void; trigger: ReactNode; children: ReactNode; kind: string;
}) {
  return <Select.Root value={value} onValueChange={onChange}>
    <Select.Trigger asChild>
      <Button variant="secondary" size="sm" className="preference-trigger" aria-label={title} title={title} data-preference-trigger={kind}>
        {trigger}<Select.Icon asChild><ChevronDown size={12} aria-hidden="true"/></Select.Icon>
      </Button>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content position="popper" align="end" sideOffset={8} collisionPadding={12} aria-label={title} className="preference-popover" data-preference-popover={kind}>
        <div className="preference-popover__heading">{normalizeDisplayText(title)}</div>
        <Select.Viewport className="preference-options">{children}</Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}

export function ThemeModeButton() {
  const { t } = useLanguage();
  const { preference, setPreference } = useTheme();
  const Icon = themeOptions.find(option => option.value === preference)!.Icon;
  return <PreferencePopover title={t('appShell.appearance')} value={preference} onChange={value => setPreference(value as ThemePreference)} kind="theme"
    trigger={<Icon className="preference-mode-icon" size={16} aria-hidden="true"/>}>
    {themeOptions.map(({ value, Icon: OptionIcon }) => <Select.Item key={value} value={value} className="preference-option">
      <OptionIcon size={17} aria-hidden="true"/>
      <span className="preference-option__copy"><Select.ItemText>{t(`appShell.${value}`)}</Select.ItemText><span className="preference-option__description">{t(`appShell.${value}Description`)}</span></span>
      <Select.ItemIndicator className="preference-option__check"><Check size={16} aria-hidden="true"/></Select.ItemIndicator>
    </Select.Item>)}
  </PreferencePopover>;
}

/** One native-name registry and selected treatment for popovers and expanded panels. */
export function LanguageOptionList({ selectItems = false }: { selectItems?: boolean }) {
  const { t, language, setLanguage } = useLanguage();
  const options = supportedLanguages.map(option => {
    const text = <span className="preference-option__copy">{normalizeDisplayText(option.label)}</span>;
    return selectItems ? <Select.Item key={option.code} value={option.code} className="preference-option">
      <Select.ItemText>{text}</Select.ItemText><Select.ItemIndicator className="preference-option__check"><Check size={16} aria-hidden="true"/></Select.ItemIndicator>
    </Select.Item> : <button type="button" key={option.code} className="preference-option" aria-pressed={language === option.code} lang={option.code}
      onClick={() => setLanguage(option.code)}>{text}{language === option.code && <Check className="preference-option__check" size={16} aria-hidden="true"/>}</button>;
  });
  return selectItems ? <>{options}</> : <div className="preference-options preference-options--expanded" role="group" aria-label={t('appShell.language')}
    onKeyDown={event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault(); buttons[next]?.focus(); buttons[next]?.click();
    }}>{options}</div>;
}

export function LanguageButton() {
  const { t, language, setLanguage } = useLanguage();
  const selected = supportedLanguages.find(option => option.code === language)!;
  return <PreferencePopover title={t('appShell.language')} value={language} onChange={value => {
    const option = supportedLanguages.find(item => item.code === value);
    if (option) setLanguage(option.code);
  }} kind="language" trigger={<><Languages size={16} aria-hidden="true"/><span className="preference-language-code">{selected.shortLabel}</span></>}>
    <LanguageOptionList selectItems/>
  </PreferencePopover>;
}

export function AppearanceLanguagePanel() {
  const { t } = useLanguage();
  const { preference, setPreference } = useTheme();
  return <div className="appearance-language-panel">
    <section className="appearance-theme" aria-labelledby="appearance-theme-heading">
      <h4 id="appearance-theme-heading">{t('appShell.appearance')}</h4>
      <SegmentedControl label={t('appShell.appearance')} value={preference} onChange={setPreference}
        options={themeOptions.map(({ value, Icon }) => ({ value, label: t(`appShell.${value}`), icon: <Icon size={17} aria-hidden="true"/> }))}/>
      <p className="preference-option__description">{t(`appShell.${preference}Description`)}</p>
    </section>
    <section aria-labelledby="appearance-language-heading"><h4 id="appearance-language-heading">{t('appShell.language')}</h4><LanguageOptionList/></section>
  </div>;
}

export function AppearanceLanguageModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  return <Modal isOpen={isOpen} onClose={onClose} title={t('appShell.preferences')} description={t('appShell.preferencesDescription')} maxWidth="md" className="appearance-language-modal">
    <AppearanceLanguagePanel/>
  </Modal>;
}
