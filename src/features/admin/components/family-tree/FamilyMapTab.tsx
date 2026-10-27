import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useReducedMotion } from 'framer-motion';
import { Globe, Layers3, Loader2, MapPin, RefreshCw, Users } from 'lucide-react';
import { Button, Modal } from '@/shared/components/ui';
import './FamilyMapTab.css';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { getFamilyMapDistribution, retryFamilyMapGeocoding, updateFamilyMemberLocation, type FamilyMapData, type FamilyMapLocation, type FamilyMapMember } from '../../services/familyMapService';
import { VietMapBaseLayer } from './VietMapBaseLayer';

const VIETNAM_CENTER: [number, number] = [16.2, 106.2];

function MapViewport({ locations }: { locations: FamilyMapLocation[] }) {
  const map = useMap();
  const lastFit = useRef('');
  useEffect(() => {
    const signature = locations.map(location => `${location.key}:${location.latitude}:${location.longitude}`).join('|');
    if (signature === lastFit.current) return;
    lastFit.current = signature;
    if (locations.length === 0) {
      map.setView(VIETNAM_CENTER, 5);
    } else if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 13);
    } else {
      map.fitBounds(locations.map(location => [location.latitude, location.longitude]), { padding: [28, 28], maxZoom: 8 });
    }
  }, [locations, map]);
  return null;
}

function LocationPickerEvents({ point, onPick }: { point: [number, number] | null; onPick: (point: [number, number]) => void }) {
  useMapEvents({ click: event => onPick([event.latlng.lat, event.latlng.lng]) });
  return point ? <CircleMarker center={point} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#0f62fe', fillOpacity: 1 }} /> : null;
}

export const FamilyMapTab: React.FC = () => {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<FamilyMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [locationMember, setLocationMember] = useState<FamilyMapMember | null>(null);
  const [locationPoint, setLocationPoint] = useState<[number, number] | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [retryingGeocoding, setRetryingGeocoding] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<'success' | 'error' | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await getFamilyMapDistribution(signal);
      if (signal?.aborted) return;
      setData(result);
      setError(false);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!data?.pendingGeocodingMembers) return;
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [data?.pendingGeocodingMembers, load]);

  const locations = Array.isArray(data?.locations) ? data.locations : [];
  const members = Array.isArray(data?.members) ? data.members : [];
  const stats = useMemo(() => [
    { label: t('admin.family_map.compact_total'), value: data?.totalMembers ?? 0, icon: Users },
    { label: t('admin.family_map.compact_located'), value: data?.locatedMembers ?? 0, icon: MapPin },
    { label: t('admin.family_map.compact_unlocated'), value: data?.unlocatedMembers ?? 0, icon: Globe },
    { label: t('admin.family_map.compact_regions'), value: locations.length, icon: Layers3 },
  ], [data, locations.length, t]);

  const hasGeocodingStatus = Boolean(data && (
    data.pendingGeocodingMembers > 0 || (data.noAddressMembers ?? 0) > 0 || (data.failedGeocodingMembers ?? 0) > 0
  ));
  const retry = () => {
    setLoading(true);
    void load();
  };

  const retryGeocoding = async () => {
    if (retryingGeocoding) return;
    setRetryingGeocoding(true);
    setRetryFeedback(null);
    try {
      await retryFamilyMapGeocoding();
      setRetryFeedback('success');
      setLoading(true);
      await load();
    } catch {
      setRetryFeedback('error');
    } finally {
      setRetryingGeocoding(false);
    }
  };

  const geocodingStatus = hasGeocodingStatus && data ? (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-secondary-text" aria-label={t('admin.family_map.geocoding_status')}>
      {(data.noAddressMembers ?? 0) > 0 && <span>{t('admin.family_map.no_address_status', { count: data.noAddressMembers })}</span>}
      {data.pendingGeocodingMembers > 0 && <span role="status">{t('admin.family_map.pending_status', { count: data.pendingGeocodingMembers })}</span>}
      {(data.failedGeocodingMembers ?? 0) > 0 && <span>{t('admin.family_map.failed_status', { count: data.failedGeocodingMembers })}</span>}
      {(data.failedGeocodingMembers ?? 0) > 0 && (
        <Button type="button" variant="secondary" size="sm" isLoading={retryingGeocoding} disabled={retryingGeocoding} onClick={() => void retryGeocoding()}>
          {t('admin.family_map.retry_geocoding')}
        </Button>
      )}
      {retryFeedback === 'success' && <p role="status">{t('admin.family_map.retry_geocoding_success')}</p>}
      {retryFeedback === 'error' && <p role="alert">{t('admin.family_map.retry_geocoding_error')}</p>}
    </div>
  ) : null;

  const openLocationPicker = (member: FamilyMapMember) => {
    setLocationMember(member);
    setLocationPoint(typeof member.latitude === 'number' && typeof member.longitude === 'number'
      ? [member.latitude, member.longitude]
      : null);
  };

  const confirmLocation = async () => {
    if (!locationMember || !locationPoint) return;
    setSavingLocation(true);
    try {
      await updateFamilyMemberLocation(locationMember.id, locationPoint[0], locationPoint[1]);
      setLocationMember(null);
      await load();
    } catch {
      setError(true);
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className="family-map-workspace flex h-full min-h-0 flex-col gap-2 sm:gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3 px-1">
        <h1 className="min-w-0 truncate text-lg font-bold tracking-tight text-primary-text sm:text-xl">
          {t('admin.family_map.workspace_title')}
        </h1>
        {data && locations.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() => setDistributionOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={distributionOpen}
          >
            <Layers3 size={16} aria-hidden="true" />
            <span>{t('admin.family_map.open_distribution')}</span>
          </Button>
        )}
        {members.length > 0 && (
          <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={() => openLocationPicker(members[0])}>
            <MapPin size={16} aria-hidden="true" />
            <span>{t('admin.family_map.adjust_location')}</span>
          </Button>
        )}
      </div>

      <section className="family-map-surface relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-custom-border bg-secondary-bg shadow-sm" aria-label={t('admin.family_map.workspace_title')}>
        {loading && !data ? (
          <div role="status" aria-label={t('admin.family_map.loading')} className="flex min-h-[min(360px,58dvh)] flex-1 items-center justify-center text-secondary-text">
            <Loader2 className="animate-spin text-accent" size={32} aria-hidden="true" />
          </div>
        ) : error && !data ? (
          <div className="flex min-h-[min(360px,58dvh)] flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p role="alert" className="text-secondary-text">{t('admin.family_map.error')}</p>
            <Button variant="secondary" onClick={retry} leftIcon={<RefreshCw size={16} aria-hidden="true" />}>
              {t('admin.family_map.retry')}
            </Button>
          </div>
        ) : data?.totalMembers === 0 ? (
          <div className="flex min-h-[min(360px,58dvh)] flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-secondary-text">
            <Users size={30} className="text-accent" aria-hidden="true" />
            <p>{t('admin.family_map.empty')}</p>
          </div>
        ) : data && locations.length === 0 ? (
          <div className="flex min-h-[min(360px,58dvh)] flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-secondary-text">
            <MapPin size={30} className="text-accent" aria-hidden="true" />
            <p className="font-medium text-primary-text">{t('admin.family_map.no_locations')}</p>
            <p className="max-w-md text-sm">{t('admin.family_map.update_address')}</p>
            {geocodingStatus}
            {error && <button type="button" className="mt-2 text-sm font-semibold text-accent underline-offset-4 hover:underline" onClick={retry}>{t('admin.family_map.retry')}</button>}
          </div>
        ) : data && locations.length > 0 ? (
          <>
            <MapContainer center={VIETNAM_CENTER} zoom={5} scrollWheelZoom className="family-distribution-map absolute inset-0 z-0 h-full w-full">
              <VietMapBaseLayer />
              <MapViewport locations={locations} />
              {locations.map(location => {
                const radius = Math.min(22, Math.max(8, 7 + Math.sqrt(location.memberCount) * 3));
                const visibleMembers = location.members.slice(0, 6);
                return (
                  <CircleMarker key={location.key} center={[location.latitude, location.longitude]} radius={radius} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0f62fe', fillOpacity: 0.82 }}>
                    <Tooltip direction="top" offset={[0, -radius]}>{location.displayName} · {t('admin.family_map.member_count', { count: location.memberCount })}</Tooltip>
                    <Popup>
                      <div className="family-map-popup-content text-sm">
                        <strong className="text-base">{location.displayName}</strong>
                        <p className="mb-2 text-gray-600">{t('admin.family_map.member_count', { count: location.memberCount })}</p>
                        <p className="mb-1 font-medium">{t('admin.family_map.view_members')}</p>
                        <ul className="space-y-1">{visibleMembers.map(member => <li key={member.id} className="flex items-center justify-between gap-3">• {member.fullName} — {t('admin.family_map.generation', { count: member.generation })}<button type="button" className="font-semibold text-blue-700 underline" onClick={() => { const detail = members.find(item => item.id === member.id); if (detail) openLocationPicker(detail); }}>{t('admin.family_map.adjust_location')}</button></li>)}</ul>
                        {location.memberCount > visibleMembers.length && <p className="mt-1 text-gray-600">{t('admin.family_map.more_members', { count: location.memberCount - visibleMembers.length })}</p>}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            <ul className="family-map-stats-overlay absolute right-2 top-2 z-[450] grid grid-cols-2 gap-1.5 sm:right-3 sm:top-3 sm:gap-2 md:grid-cols-4" aria-label={t('admin.family_map.statistics')}>
              {stats.map(({ label, value, icon: Icon }) => (
                <li key={label} className="family-map-stat-chip inline-flex items-center gap-1.5 rounded-xl border border-custom-border bg-secondary-bg/90 px-2 py-1.5 text-primary-text shadow-sm backdrop-blur-md sm:gap-2 sm:px-2.5">
                  <Icon size={14} className="shrink-0 text-accent" aria-hidden="true" />
                  <strong className="text-xs leading-none sm:text-sm">{value}</strong>
                  <span className="text-[0.65rem] leading-tight text-secondary-text sm:text-xs">{label}</span>
                </li>
              ))}
            </ul>

            {(error || hasGeocodingStatus) && (
              <div className="absolute bottom-8 left-1/2 z-[450] flex max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl border border-custom-border bg-secondary-bg/95 px-3 py-2 text-xs text-secondary-text shadow-sm backdrop-blur-md">
                {error && (
                  <p role="alert" className="flex flex-wrap items-center justify-center gap-2">
                    <span>{t('admin.family_map.error')}</span>
                    <button type="button" onClick={retry} className="shrink-0 font-semibold text-accent underline-offset-4 hover:underline">{t('admin.family_map.retry')}</button>
                  </p>
                )}
                {data.pendingGeocodingMembers > 0 && (
                  <p className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="shrink-0 animate-spin text-accent" aria-hidden="true" />
                    {t('admin.family_map.locating')}
                  </p>
                )}
                {geocodingStatus}
              </div>
            )}
          </>
        ) : null}
      </section>

      <Modal
        isOpen={locationMember !== null}
        onClose={() => setLocationMember(null)}
        title={t('admin.family_map.adjust_location')}
        ariaLabel={t('admin.family_map.adjust_location')}
        maxWidth="lg"
        footer={<div className="flex w-full items-center justify-end gap-3"><Button type="button" variant="secondary" disabled={savingLocation} onClick={() => setLocationMember(null)}>{t('admin.cancel', { defaultValue: 'Cancel' })}</Button><Button type="button" variant="primary" disabled={!locationPoint || savingLocation} isLoading={savingLocation} onClick={() => void confirmLocation()}>{t('admin.family_map.confirm_location')}</Button></div>}
      >
        {locationMember && <div className="space-y-3">
          <label className="block text-sm font-medium text-primary-text" htmlFor="family-map-member-picker">{t('admin.family_map.member')}</label>
          <select id="family-map-member-picker" className="w-full rounded-lg border border-custom-border bg-secondary-bg px-3 py-2 text-primary-text" value={locationMember.id} onChange={event => { const member = members.find(item => item.id === Number(event.target.value)); if (member) openLocationPicker(member); }}>
            {members.map(member => <option key={member.id} value={member.id}>{member.fullName} · {member.address || t('admin.family_map.no_address')}</option>)}
          </select>
          <p className="text-sm text-secondary-text">{t('admin.family_map.tap_map_to_pick')}</p>
          <div className="h-[min(55vh,440px)] overflow-hidden rounded-xl border border-custom-border">
            <MapContainer key={locationMember.id} center={locationPoint ?? VIETNAM_CENTER} zoom={locationPoint ? 13 : 5} scrollWheelZoom className="h-full w-full">
              <VietMapBaseLayer />
              <LocationPickerEvents point={locationPoint} onPick={setLocationPoint} />
            </MapContainer>
          </div>
          <p className="font-mono text-xs text-secondary-text">{locationPoint ? `${locationPoint[0].toFixed(6)}, ${locationPoint[1].toFixed(6)}` : t('admin.family_map.no_point_selected')}</p>
        </div>}
      </Modal>

      <Modal
        isOpen={distributionOpen}
        onClose={() => setDistributionOpen(false)}
        title={t('admin.family_map.distribution')}
        ariaLabel={t('admin.family_map.distribution')}
        maxWidth="md"
        className="family-map-distribution-panel"
        reducedMotion={Boolean(shouldReduceMotion)}
      >
        <div className="space-y-1">
          {locations.map(location => {
            const percentage = data?.locatedMembers ? Math.round(location.memberCount / data.locatedMembers * 100) : 0;
            return (
              <div key={location.key} className="border-b border-custom-border py-4 first:pt-1 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <span className="break-words font-medium text-primary-text">{location.displayName}</span>
                  <span className="shrink-0 text-right text-sm text-secondary-text">
                    {t('admin.family_map.member_count', { count: location.memberCount })} · {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
