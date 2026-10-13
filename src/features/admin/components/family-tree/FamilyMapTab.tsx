import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useReducedMotion } from 'framer-motion';
import { Globe, Layers3, Loader2, MapPin, RefreshCw, Users } from 'lucide-react';
import { Button, Modal } from '@/shared/components/ui';
import './FamilyMapTab.css';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { getFamilyMapDistribution, type FamilyMapData, type FamilyMapLocation } from '../../services/familyMapService';

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
      map.setView([locations[0].latitude, locations[0].longitude], 8);
    } else {
      map.fitBounds(locations.map(location => [location.latitude, location.longitude]), { padding: [28, 28], maxZoom: 8 });
    }
  }, [locations, map]);
  return null;
}

export const FamilyMapTab: React.FC = () => {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<FamilyMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [distributionOpen, setDistributionOpen] = useState(false);

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

  const locations = data?.locations ?? [];
  const stats = useMemo(() => [
    { label: t('admin.family_map.compact_total'), value: data?.totalMembers ?? 0, icon: Users },
    { label: t('admin.family_map.compact_located'), value: data?.locatedMembers ?? 0, icon: MapPin },
    { label: t('admin.family_map.compact_unlocated'), value: data?.unlocatedMembers ?? 0, icon: Globe },
    { label: t('admin.family_map.compact_regions'), value: locations.length, icon: Layers3 },
  ], [data, locations.length, t]);

  const retry = () => {
    setLoading(true);
    void load();
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
            {error && <button type="button" className="mt-2 text-sm font-semibold text-accent underline-offset-4 hover:underline" onClick={retry}>{t('admin.family_map.retry')}</button>}
          </div>
        ) : data && locations.length > 0 ? (
          <>
            <MapContainer center={VIETNAM_CENTER} zoom={5} scrollWheelZoom className="family-distribution-map absolute inset-0 z-0 h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
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
                        <ul className="space-y-1">{visibleMembers.map(member => <li key={member.id}>• {member.fullName} — {t('admin.family_map.generation', { count: member.generation })}</li>)}</ul>
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

            {(error || data.pendingGeocodingMembers > 0) && (
              <div className="absolute bottom-8 left-1/2 z-[450] flex max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl border border-custom-border bg-secondary-bg/95 px-3 py-2 text-xs text-secondary-text shadow-sm backdrop-blur-md">
                {error && (
                  <p role="alert" className="flex flex-wrap items-center justify-center gap-2">
                    <span>{t('admin.family_map.error')}</span>
                    <button type="button" onClick={retry} className="shrink-0 font-semibold text-accent underline-offset-4 hover:underline">{t('admin.family_map.retry')}</button>
                  </p>
                )}
                {data.pendingGeocodingMembers > 0 && (
                  <p role="status" className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="shrink-0 animate-spin text-accent" aria-hidden="true" />
                    {t('admin.family_map.locating')}
                  </p>
                )}
              </div>
            )}
          </>
        ) : null}
      </section>

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
