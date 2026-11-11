import { normalizeDisplayText } from '@/shared/utils/normalizeDisplayText';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, Check, ChevronDown, Loader2, Network, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, FloatingField } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { fetchFamilyMembers, fetchRelationship, type RelationshipResult } from '../../services/familyV2Service';
import { MemberAvatarImage } from './MemberAvatarImage';
import type { FamilyMember } from './types';
import { getRelationshipPresentation } from './relationshipPresentation';

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase().trim();

export const RelationshipExplorer: React.FC<{ members: FamilyMember[]; initialMemberId?: number }> = ({ members: nearbyMembers, initialMemberId }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [members, setMembers] = useState(nearbyMembers);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(false);
  const [reloadMembers, setReloadMembers] = useState(0);
  const referenceId = initialMemberId ?? nearbyMembers[0]?.id;
  const reference = nearbyMembers.find(item => item.id === referenceId) ?? members.find(item => item.id === referenceId);
  const [toId, setToId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFocused, setPickerFocused] = useState(false);
  const [popupPosition, setPopupPosition] = useState<React.CSSProperties>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLUListElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setMembersLoading(true);
    setMembersError(false);
    fetchFamilyMembers(controller.signal).then(allMembers => {
      if (!controller.signal.aborted) setMembers(allMembers);
    }).catch(() => {
      if (!controller.signal.aborted) setMembersError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setMembersLoading(false);
    });
    return () => controller.abort();
  }, [reloadMembers]);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setToId(null); setQuery(''); setPickerOpen(false); setActiveIndex(0);
    setResult(null); setError(false); setLoading(false);
  }, [referenceId]);

  useLayoutEffect(() => {
    if (!pickerOpen) return;
    const reposition = () => {
      const rect = pickerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const placeBelow = below >= 240 || below >= above;
      const width = Math.min(rect.width, window.innerWidth - 16);
      setPopupPosition({
        position: 'fixed', width, left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        maxHeight: Math.min(320, Math.max(0, placeBelow ? below : above)),
        ...(placeBelow ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }),
      });
    };
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [pickerOpen]);
  useEffect(() => {
    if (!pickerOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node) && !popupRef.current?.contains(event.target as Node)) {
        setPickerOpen(false); setQuery('');
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [pickerOpen]);

  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of members) counts.set(normalizeSearch(member.fullName), (counts.get(normalizeSearch(member.fullName)) ?? 0) + 1);
    return counts;
  }, [members]);
  const options = useMemo(() => members.filter(item => item.id !== referenceId && normalizeSearch(`${item.fullName} ${item.address ?? ''}`).includes(normalizeSearch(query)))
    .sort((a, b) => a.fullName.localeCompare(b.fullName)), [members, referenceId, query]);
  const selectedTarget = members.find(item => item.id === toId && item.id !== referenceId);
  const labelFloated = pickerFocused || pickerOpen || toId !== null;

  useEffect(() => {
    if (pickerOpen) popupRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, pickerOpen, options]);

  const openPicker = () => {
    if (membersLoading || membersError) return;
    if (!pickerOpen) {
      setQuery('');
      const selectedIndex = members.filter(item => item.id !== referenceId).sort((a, b) => a.fullName.localeCompare(b.fullName)).findIndex(item => item.id === toId);
      setActiveIndex(Math.max(0, selectedIndex));
    }
    setPickerOpen(true);
    inputRef.current?.focus();
  };

  const invalidateRelationship = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false); setError(false); setResult(null);
  };

  const chooseTarget = (id: number) => {
    if (id === referenceId || !members.some(member => member.id === id)) return;
    invalidateRelationship();
    const deselecting = toId === id;
    setToId(deselecting ? null : id);
    setQuery('');
    setActiveIndex(deselecting ? 0 : activeIndex);
    setPickerOpen(deselecting);
    if (deselecting) inputRef.current?.focus();
  };

  const calculate = async () => {
    if (!referenceId || !selectedTarget || toId == null || membersLoading || membersError) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const requestedTarget = toId;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const relation = await fetchRelationship(referenceId, requestedTarget, controller.signal);
      if (!getRelationshipPresentation(relation, referenceId, requestedTarget)) throw new Error('Relationship endpoints do not match the request.');
      if (!controller.signal.aborted && requestRef.current === controller) setResult(relation);
    } catch {
      if (!controller.signal.aborted && requestRef.current === controller) setError(true);
    } finally {
      if (!controller.signal.aborted && requestRef.current === controller) setLoading(false);
    }
  };

  const presentation = result && referenceId != null && toId != null ? getRelationshipPresentation(result, referenceId, toId) : null;
  const sourceMember = members.find(item => item.id === referenceId) ?? reference;
  const targetMember = selectedTarget;
  const displayPath = presentation?.displayPath ?? [];
  const verticalPath = presentation?.verticalPath ?? false;

  return <section className="family-explorer space-y-4" aria-labelledby="relationship-explorer-title">
    <div className="flex items-center gap-2"><Network size={18} className="text-accent" aria-hidden="true" /><h2 id="relationship-explorer-title" className="m-0 text-base font-semibold text-primary-text">{t('admin.family_v2.relationship')}</h2></div>
    <p className="family-explorer__description">{t('family.exploreHint')}</p>
    {members.length < 2 && !membersLoading ? <p className="m-0 text-sm text-secondary-text">{t('admin.family_v2.need_two_members')}</p> : <>
      <div className="family-explorer__fields">
        <div className="family-explorer__reference" aria-label={t('admin.family_v2.reference_person')}>
          <FloatingField label={t('admin.family_v2.reference_person')} fieldId="relationship-reference-member" hasValue={Boolean(reference)} alwaysFloating leading={reference ? <MemberAvatarImage member={reference} alt="" className="family-explorer__reference-avatar"/> : undefined}>
            <input id="relationship-reference-member" data-ui-control aria-label={t('admin.family_v2.reference_person')} value={normalizeDisplayText(reference?.fullName ?? '')} readOnly tabIndex={-1}/>
          </FloatingField>
        </div>
        <ArrowDown className="family-explorer__direction" size={18} aria-hidden="true" />
        <div className="family-explorer__picker" ref={pickerRef} onFocusCapture={() => setPickerFocused(true)} onBlurCapture={event => {
          if (pickerRef.current?.contains(event.relatedTarget as Node) || popupRef.current?.contains(event.relatedTarget as Node)) return;
          setPickerFocused(false); setPickerOpen(false); setQuery('');
        }}>
          <FloatingField label={t('admin.family_v2.choose_person')} fieldId="relationship-member-search" active={labelFloated} hasValue={toId !== null} disabled={membersLoading || membersError} leading={<Search size={17} aria-hidden="true"/>} trailing={<button type="button" tabIndex={-1} className="family-explorer__toggle" aria-label={t('admin.family_v2.open_member_picker')} aria-expanded={pickerOpen} aria-controls={pickerOpen ? 'relationship-member-options' : undefined} disabled={membersLoading || membersError} onPointerDown={event => event.preventDefault()} onClick={() => { if (pickerOpen) { setPickerOpen(false); setQuery(''); } else openPicker(); }}><ChevronDown size={18}/></button>}>
            <input ref={inputRef} id="relationship-member-search" data-ui-control role="combobox" aria-autocomplete="list" aria-expanded={pickerOpen} aria-controls={pickerOpen ? 'relationship-member-options' : undefined} aria-activedescendant={pickerOpen && options[activeIndex] ? `relationship-member-option-${options[activeIndex].id}` : undefined} autoComplete="off" value={pickerOpen ? query : normalizeDisplayText(selectedTarget?.fullName ?? '')} placeholder={pickerFocused || pickerOpen ? t('admin.family_v2.search_member') : undefined} disabled={membersLoading || membersError} onFocus={openPicker} onClick={() => { if (!pickerOpen) openPicker(); }} onChange={event => { setQuery(event.target.value); setPickerOpen(true); setActiveIndex(0); }} onKeyDown={event => {
              if (event.key === 'ArrowDown' && options.length) { event.preventDefault(); if (!pickerOpen) openPicker(); else setActiveIndex(index => Math.min(index + 1, options.length - 1)); }
              else if (event.key === 'ArrowUp' && options.length) { event.preventDefault(); if (!pickerOpen) openPicker(); else setActiveIndex(index => Math.max(index - 1, 0)); }
              else if (event.key === 'Enter' && pickerOpen && options[activeIndex]) { event.preventDefault(); chooseTarget(options[activeIndex].id); }
              else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setPickerOpen(false); setQuery(''); }
              else if (event.key === 'Tab') { setPickerOpen(false); setQuery(''); }
            }}/>
          </FloatingField>
          {pickerOpen && createPortal(<ul ref={popupRef} id="relationship-member-options" className="family-explorer__options" style={popupPosition} role="listbox" aria-label={t('admin.family_v2.choose_person')}>
            {options.map((item, index) => <li key={item.id} id={`relationship-member-option-${item.id}`} role="option" aria-selected={item.id === toId} onMouseEnter={() => setActiveIndex(index)} onPointerDown={event => event.preventDefault()} onClick={() => chooseTarget(item.id)} className={index === activeIndex ? 'is-active' : ''}><MemberAvatarImage member={item} alt="" className="family-relation-avatar"/><span>{normalizeDisplayText(item.fullName)}{(duplicateNames.get(normalizeSearch(item.fullName)) ?? 0) > 1 && item.address && <small className="family-explorer__option-meta">{normalizeDisplayText(item.address)}</small>}</span>{item.id === toId && <Check size={16}/>}</li>)}
            {!options.length && <li className="family-explorer__empty">{t('admin.family_v2.no_matching_members')}</li>}
          </ul>, document.body)}
        </div>
      </div>
      {membersLoading && <p role="status" className="m-0 text-sm text-secondary-text">{t('admin.family_v2.loading_members')}</p>}
      {membersError && <p role="alert" className="m-0 text-sm text-error">{t('admin.family_v2.members_error')} <button type="button" className="underline" onClick={() => setReloadMembers(value => value + 1)}>{t('admin.family_v2.retry')}</button></p>}
      <Button type="button" variant="secondary" disabled={!referenceId || !selectedTarget || loading || membersLoading || membersError} onClick={() => void calculate()}>
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{t('admin.family_v2.view_relationship')}
      </Button>
      {error && <p role="alert" className="m-0 text-sm text-error">{t('admin.family_v2.relationship_error')} <button type="button" className="underline" onClick={() => void calculate()}>{t('admin.family_v2.retry')}</button></p>}
      {presentation && <div className="family-explorer__result" aria-live="polite">
        <p className="family-explorer__answer"><strong>{normalizeDisplayText(targetMember?.fullName)}</strong> {t('admin.family_v2.is_the')} <b>{t(`admin.family_v2.code_${presentation.code}`, { defaultValue: presentation.label })}</b> {t('admin.family_v2.of_the')} <strong>{normalizeDisplayText(sourceMember?.fullName)}</strong>.</p>
        {displayPath.length > 0 && <ol className={`family-explorer__path${verticalPath ? ' is-vertical' : ''}`}>
          {displayPath.map((node, index) => <React.Fragment key={`${node.memberId}-${index}`}>
            {index > 0 && <li aria-label={t(`admin.family_v2.edge_${(node.edge ?? 'related').toLowerCase()}`)} className="family-explorer__edge"><span aria-hidden="true">{verticalPath ? '↓' : '→'}</span><small>{t(`admin.family_v2.edge_${(node.edge ?? 'related').toLowerCase()}`)}</small></li>}
            <li className="list-none"><button type="button" className="family-explorer__step" onClick={() => navigate(`/mylife/family/member/${node.memberId}`)}><MemberAvatarImage member={members.find(item => item.id === node.memberId) ?? { id: node.memberId, fullName: node.fullName } as FamilyMember} alt="" className="family-relation-avatar"/>{normalizeDisplayText(node.fullName)}</button></li>
          </React.Fragment>)}
        </ol>}
        {presentation.code === 'unknown' && <p className="m-0 text-sm text-secondary-text">{t('admin.family_v2.no_relationship_path')}</p>}
      </div>}
    </>}
  </section>;
};
