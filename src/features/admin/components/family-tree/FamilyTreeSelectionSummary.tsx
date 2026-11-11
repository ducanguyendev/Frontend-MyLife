import { useLanguage } from '@/shared/hooks/useLanguage';
import type { AncestralFamilyHighlight } from './familyTreeHighlight';
import type { FamilyMember } from './types';

export function FamilyTreeSelectionSummary({ highlight, members }: { highlight: AncestralFamilyHighlight; members: FamilyMember[] }) {
  const { t } = useLanguage();
  const selected = members.find(member => member.id === highlight.selectedNodeId);
  if (!selected) return null;
  const details = [...highlight.siblings].map(([id, kind]) => `${members.find(member => member.id === id)?.fullName}: ${t(`family.siblingKind.${kind}`)}`).join('\n');
  return <div className="family-tree-selection" role="status">
    <strong title={selected.fullName}>{selected.fullName}</strong>
    {highlight.siblings.size > 0 && <span title={details}>{t('family.recordedSiblingCount', { count: highlight.siblings.size })}</span>}
    <span className="sr-only">{details}</span>
  </div>;
}
