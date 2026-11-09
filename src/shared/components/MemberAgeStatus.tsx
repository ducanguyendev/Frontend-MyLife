import { Cake } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { getMemberAgeDisplay, type MemberAgeSource } from '@/shared/utils/memberAge';
import './MemberAgeStatus.css';

/** No grave icon is available in the installed icon set. Match Lucide's 24px grid. */
export function TombstoneIcon() {
  return <svg className="member-age-status__icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M5 20V9a7 7 0 0 1 14 0v11M3 20h18M9 10h6M10 14h4"/>
  </svg>;
}

export function MemberAgeStatus({ member, layout = 'inline' }: { member: MemberAgeSource; layout?: 'inline' | 'stacked' }) {
  const { t } = useLanguage();
  const display = getMemberAgeDisplay(member);
  const primary = display.kind === 'living'
    ? display.currentAge === null ? t('family.age.unknown') : t('family.age.current', { age: display.currentAge, count: display.currentAge })
    : display.ageAtDeath === null ? t('family.age.deceased') : t('family.age.atDeath', { age: display.ageAtDeath });
  const secondary = display.kind === 'deceased' && display.currentEquivalentAge !== null
    ? t(layout === 'stacked' ? 'family.age.wouldBeDetail' : 'family.age.wouldBe', { age: display.currentEquivalentAge }) : null;

  return <span className="member-age-status" data-member-age-status={display.kind} data-layout={layout}>
    {display.kind === 'deceased' ? <TombstoneIcon/> : <Cake className="member-age-status__icon" size={14} strokeWidth={1.75} aria-hidden="true"/>}
    <span className="member-age-status__text">
      <span>{primary}</span>{secondary && <>{layout === 'inline' && ' · '}<span className="member-age-status__secondary">{secondary}</span></>}
    </span>
  </span>;
}
