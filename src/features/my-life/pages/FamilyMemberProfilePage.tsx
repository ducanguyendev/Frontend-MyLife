import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, Edit3, MapPin, UsersRound } from 'lucide-react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/shared/components/ui';
import { MemberAvatarImage } from '@/features/admin/components/family-tree/MemberAvatarImage';
import { getSiblingKind } from '@/features/admin/components/family-tree/siblingRelations';
import { MyLifeWorkspaceLayout } from '@/shared/layouts/MyLifeWorkspaceLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { fetchMemberProfile, type FamilyMemberProfile } from '@/features/admin/services/familyV2Service';
import type { FamilyMember } from '@/features/admin/components/family-tree/types';
import { RelationshipExplorer } from '@/features/admin/components/family-tree/RelationshipExplorer';

export const FamilyMemberProfilePage: React.FC = () => {
  const { id } = useParams();
  const memberId = Number(id);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<FamilyMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    fetchMemberProfile(memberId, controller.signal).then(setProfile).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [memberId]);

  const member = profile?.member;
  const relatives = profile?.relatives ?? [];
  const parents = relatives.filter(item => item.id === member?.fatherId || item.id === member?.motherId);
  const spouse = relatives.filter(item => item.id === member?.spouseId);
  const children = relatives.filter(item => item.fatherId === memberId || item.motherId === memberId || member?.childIds?.includes(item.id));
  const siblings = relatives.filter(item => item.id !== memberId && getSiblingKind(member!, item) === 'biological');
  const cousins = relatives.filter(item => item.id !== memberId && getSiblingKind(member!, item) === 'cousin');
  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const birth = member?.dateOfBirth ? new Date(`${member.dateOfBirth.slice(0, 10)}T00:00:00Z`) : null;
  const death = member?.lifeStatus === 'DECEASED' && member.deathDate ? new Date(`${member.deathDate.slice(0, 10)}T00:00:00Z`) : null;
  const hasCoordinates = Number.isFinite(member?.latitude) && Number.isFinite(member?.longitude)
    && Number(member?.latitude) >= -90 && Number(member?.latitude) <= 90 && Number(member?.longitude) >= -180 && Number(member?.longitude) <= 180;

  const relationGroup = (label: string, list: FamilyMember[]) => <div key={label} className="grid gap-2 border-b border-custom-border/60 py-3 last:border-0 sm:grid-cols-[9rem_minmax(0,1fr)]">
    <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-secondary-text">{label}</h3>
    <ul className="m-0 flex flex-wrap gap-2 p-0">{list.length ? list.map(item => <li key={item.id} className="list-none"><Link className="rounded-lg border border-custom-border bg-secondary-bg px-3 py-2 text-sm font-medium text-primary-text hover:border-accent/50" to={`/mylife/family/member/${item.id}`}>{item.fullName}</Link></li>) : <li className="list-none text-sm text-secondary-text">{t('admin.family_v2.not_updated')}</li>}</ul>
  </div>;

  return <MyLifeWorkspaceLayout backTo="/familytree" showDock contentScroll="auto" contentClassName="px-3 py-4 sm:px-5 sm:py-5">
    <main className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} aria-hidden="true" />}>{t('admin.family_v2.back_to_tree')}</Button>
        {member && <Button variant="secondary" onClick={() => navigate('/familytree', { state: { editMemberId: member.id } })} leftIcon={<Edit3 size={16} aria-hidden="true" />}>{t('admin.family_v2.edit_member')}</Button>}
      </div>
      {loading ? <div role="status" className="rounded-2xl border border-custom-border p-10 text-center text-secondary-text">{t('admin.family_v2.loading_profile')}</div>
        : error || !profile || !member ? <div role="alert" className="rounded-2xl border border-custom-border p-10 text-center text-secondary-text">{t('admin.family_v2.profile_error')}</div> : <>
          <header className="flex flex-col gap-4 rounded-3xl border border-custom-border bg-secondary-bg p-5 shadow-sm sm:flex-row sm:items-center sm:p-7">
            <MemberAvatarImage member={member} alt={member.fullName} className="h-24 w-24 shrink-0 rounded-3xl border border-accent/30 object-cover" />
            <div className="min-w-0 flex-1">
              <h1 className="m-0 break-words text-2xl font-black text-primary-text sm:text-3xl">{member.fullName}</h1>
              <p className="mt-2 text-sm text-secondary-text">{birth?.toLocaleDateString(dateLocale, { timeZone: 'UTC' }) ?? t('admin.family_v2.not_updated')} – {death?.toLocaleDateString(dateLocale, { timeZone: 'UTC' }) ?? t(member.lifeStatus === 'DECEASED' ? 'admin.family_v2.not_updated' : 'admin.family_v2.present')}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-secondary-text">
                <span className="rounded-full border border-custom-border px-3 py-1">{t('admin.generation', { defaultValue: 'Generation' })} {member.generation}</span>
                {member.gender && <span className="rounded-full border border-custom-border px-3 py-1">{member.gender}</span>}
                {member.role && <span className="rounded-full border border-custom-border px-3 py-1">{member.role}</span>}
                {member.address && <span className="inline-flex items-center gap-1 rounded-full border border-custom-border px-3 py-1"><MapPin size={12} aria-hidden="true" />{member.address}</span>}
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-custom-border bg-secondary-bg p-4 sm:p-5"><h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-primary-text"><UsersRound size={18} className="text-accent" />{t('admin.family_v2.family_relations')}</h2><dl className="m-0">
            {relationGroup(t('admin.father'), parents.filter(item => item.id === member.fatherId))}
            {relationGroup(t('admin.mother'), parents.filter(item => item.id === member.motherId))}
            {relationGroup(t('admin.field_spouse', { defaultValue: 'Spouse' }), spouse)}
            {relationGroup(t('admin.children'), children)}
            {relationGroup(t('admin.family_v2.biological_siblings'), siblings)}
            {relationGroup(t('admin.family_v2.cousins'), cousins)}
          </dl></section>

          <RelationshipExplorer members={[member, ...relatives]} initialMemberId={member.id} />

          <section className="rounded-2xl border border-custom-border bg-secondary-bg p-4 sm:p-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary-text"><CalendarDays size={18} className="text-accent" />{t('admin.family_v2.member_timeline', { name: member.fullName })}</h2>
            {profile.timeline.length ? <ol className="m-0 space-y-3 border-l-2 border-accent/30 pl-5">{profile.timeline.map(event => <li key={`${event.sourceType}-${event.id}`} className="relative list-none"><span className="absolute -left-[1.63rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" /><p className="m-0 text-xs font-semibold text-secondary-text">{event.eventDate ? new Date(`${event.eventDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString(dateLocale, { timeZone: 'UTC' }) : `${event.isApproximate ? t('admin.family_v2.approximate_date') : ''} ${event.eventYear ?? ''}`}</p><h3 className="m-0 text-sm font-semibold text-primary-text">{event.title}</h3>{event.description && <p className="m-0 text-sm text-secondary-text">{event.description}</p>}</li>)}</ol> : <p className="m-0 text-sm text-secondary-text">{t('admin.family_v2.empty_timeline')}</p>}
          </section>

          <section className="rounded-2xl border border-custom-border bg-secondary-bg p-4 sm:p-5"><h2 className="mb-3 text-lg font-bold text-primary-text">{t('admin.family_v2.anniversaries')}</h2>
            {profile.anniversaries.length ? <ul className="m-0 space-y-2 p-0">{profile.anniversaries.map(item => <li key={item.id} className="list-none rounded-xl border border-custom-border p-3"><strong className="text-primary-text">{item.title}</strong>{item.originalSolarDate && <span className="ml-2 text-sm text-secondary-text">{new Date(`${item.originalSolarDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString(dateLocale, { timeZone: 'UTC' })}</span>}{item.place && <p className="m-0 text-sm text-secondary-text">{item.place}</p>}</li>)}</ul> : <p className="m-0 text-sm text-secondary-text">{t('admin.family_v2.no_anniversaries')}</p>}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-custom-border bg-secondary-bg p-4"><h2 className="mb-2 flex items-center gap-2 font-bold text-primary-text"><MapPin size={17} className="text-accent" />{t('admin.family_v2.location')}</h2><p className="text-sm text-secondary-text">{member.address || t('admin.family_v2.not_updated')}</p>{hasCoordinates && <div className="h-56 overflow-hidden rounded-xl"><MapContainer center={[member.latitude!, member.longitude!]} zoom={13} scrollWheelZoom className="h-full w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[member.latitude!, member.longitude!]} /></MapContainer></div>}</section>
            <section className="rounded-2xl border border-custom-border bg-secondary-bg p-4"><h2 className="mb-2 flex items-center gap-2 font-bold text-primary-text"><BookOpen size={17} className="text-accent" />{t('admin.family_v2.library')}</h2><p className="text-sm text-secondary-text">{profile.libraryMemberLinkAvailable ? t('admin.family_v2.library_related') : t('admin.family_v2.library_not_linked')}</p></section>
          </div>
          {member.biography && <section className="rounded-2xl border border-custom-border bg-secondary-bg p-4"><h2 className="mb-2 font-bold text-primary-text">{t('admin.biography')}</h2><p className="m-0 whitespace-pre-wrap text-sm text-secondary-text">{member.biography}</p></section>}
        </>}
    </main>
  </MyLifeWorkspaceLayout>;
};
