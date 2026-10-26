import React, { useMemo, useState } from 'react';
import { ArrowDown, Loader2, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, SelectItem } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { fetchRelationship, type RelationshipResult } from '../../services/familyV2Service';
import type { FamilyMember } from './types';

export const RelationshipExplorer: React.FC<{ members: FamilyMember[]; initialMemberId?: number }> = ({ members, initialMemberId }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const firstId = initialMemberId && members.some(item => item.id === initialMemberId) ? initialMemberId : members[0]?.id;
  const initialTarget = members.find(item => item.id !== firstId)?.id;
  const [fromId, setFromId] = useState(firstId ? String(firstId) : '');
  const [toId, setToId] = useState(initialTarget ? String(initialTarget) : '');
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const options = useMemo(() => [...members].sort((a, b) => a.fullName.localeCompare(b.fullName)), [members]);

  const calculate = async () => {
    if (!fromId || !toId) return;
    setLoading(true); setError(false);
    try { setResult(await fetchRelationship(Number(fromId), Number(toId))); }
    catch { setResult(null); setError(true); }
    finally { setLoading(false); }
  };

  const selectedFrom = members.find(item => item.id === Number(fromId));
  const selectedTo = members.find(item => item.id === Number(toId));
  return <section className="space-y-4 rounded-2xl border border-custom-border bg-primary-bg/45 p-4" aria-labelledby="relationship-explorer-title">
    <div className="flex items-center gap-2"><Network size={18} className="text-accent" aria-hidden="true" /><h2 id="relationship-explorer-title" className="m-0 text-base font-semibold text-primary-text">{t('admin.family_v2.relationship')}</h2></div>
    {members.length < 2 ? <p className="m-0 text-sm text-secondary-text">{t('admin.family_v2.need_two_members')}</p> : <>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <label className="space-y-1 text-sm font-medium text-primary-text">{t('admin.family_v2.person_a')}
          <Select aria-label={t('admin.family_v2.person_a')} value={fromId} onValueChange={setFromId}>
            {options.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.fullName}</SelectItem>)}
          </Select>
        </label>
        <ArrowDown className="mx-auto text-secondary-text sm:mb-3 sm:rotate-[-90deg]" size={18} aria-hidden="true" />
        <label className="space-y-1 text-sm font-medium text-primary-text">{t('admin.family_v2.person_b')}
          <Select aria-label={t('admin.family_v2.person_b')} value={toId} onValueChange={setToId}>
            {options.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.fullName}</SelectItem>)}
          </Select>
        </label>
      </div>
      <Button type="button" variant="secondary" disabled={!fromId || !toId || loading} onClick={() => void calculate()}>
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{t('admin.family_v2.view_relationship')}
      </Button>
      {error && <p role="alert" className="m-0 text-sm text-error">{t('admin.family_v2.relationship_error')}</p>}
      {result && <div className="space-y-3 rounded-xl border border-accent/20 bg-secondary-bg p-4" aria-live="polite">
        <p className="m-0 text-center text-sm text-secondary-text">{selectedTo?.fullName} <span>{t('admin.family_v2.is_the')}</span> <strong className="text-accent">{t(`admin.family_v2.code_${result.relationshipCode.toLowerCase()}`, { defaultValue: result.relationshipLabel })}</strong> {t('admin.family_v2.of_the')} {selectedFrom?.fullName}</p>
        {result.path.length > 0 ? <ol className="m-0 flex flex-wrap items-center justify-center gap-2 p-0 text-sm">
          {result.path.map((node, index) => <React.Fragment key={`${node.memberId}-${index}`}>
            {index > 0 && <li aria-label={t(`admin.family_v2.edge_${(node.edge ?? 'related').toLowerCase()}`)} className="list-none text-secondary-text">↓ <span className="text-xs">{t(`admin.family_v2.edge_${(node.edge ?? 'related').toLowerCase()}`)}</span></li>}
            <li className="list-none"><button type="button" className="rounded-lg px-1 font-semibold text-primary-text hover:text-accent" onClick={() => navigate(`/mylife/family/member/${node.memberId}`)}>{node.fullName}</button></li>
          </React.Fragment>)}
        </ol> : <p className="m-0 text-center text-sm text-secondary-text">{t('admin.family_v2.no_relationship_path')}</p>}
      </div>}
    </>}
  </section>;
};
