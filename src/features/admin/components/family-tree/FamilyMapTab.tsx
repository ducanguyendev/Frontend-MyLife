import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe, Loader2, MapPin, RefreshCw, Users } from 'lucide-react';
import { Button, Card } from '@/shared/components/ui';
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
  const [data, setData] = useState<FamilyMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
    { label: t('admin.family_map.total'), value: data?.totalMembers ?? 0, icon: Users },
    { label: t('admin.family_map.located'), value: data?.locatedMembers ?? 0, icon: MapPin },
    { label: t('admin.family_map.unlocated'), value: data?.unlocatedMembers ?? 0, icon: Globe },
    { label: t('admin.family_map.regions'), value: locations.length, icon: MapPin },
  ], [data, locations.length, t]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <Card className="flex flex-col gap-1">
        <h3 className="flex items-center gap-2 text-xl font-bold text-primary-text">
          <Globe className="text-accent" size={20} />{t('admin.family_map.title')}
        </h3>
        <p className="text-sm text-secondary-text">{t('admin.family_map.description')}</p>
      </Card>

      {loading && !data ? (
        <div role="status" aria-label={t('admin.family_map.loading')} className="flex min-h-72 items-center justify-center rounded-2xl border border-custom-border bg-secondary-bg">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : error && !data ? (
        <Card className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
          <p role="alert" className="text-secondary-text">{t('admin.family_map.error')}</p>
          <Button variant="secondary" onClick={() => { setLoading(true); void load(); }}>
            <RefreshCw size={16} />{t('admin.family_map.retry')}
          </Button>
        </Card>
      ) : data && (
        <>
          {error && <Card className="flex flex-wrap items-center justify-between gap-3" role="alert">
            <span className="text-secondary-text">{t('admin.family_map.error')}</span>
            <Button variant="secondary" onClick={() => { setLoading(true); void load(); }}><RefreshCw size={16} />{t('admin.family_map.retry')}</Button>
          </Card>}
          <section aria-label={t('admin.family_map.statistics')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label} padding="sm" className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={19} /></span>
                <span className="min-w-0"><span className="block text-xs text-secondary-text">{label}</span><strong className="block text-xl text-primary-text">{value}</strong></span>
              </Card>
            ))}
          </section>

          {data.totalMembers === 0 ? (
            <Card className="py-12 text-center text-secondary-text">{t('admin.family_map.empty')}</Card>
          ) : (
            <>
              <Card padding="none" className="overflow-hidden">
                {locations.length > 0 ? (
                  <MapContainer center={VIETNAM_CENTER} zoom={5} scrollWheelZoom className="family-distribution-map h-[420px] w-full sm:h-[520px]">
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
                            <div className="max-w-64 text-sm">
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
                ) : (
                  <div className="flex min-h-72 flex-col items-center justify-center gap-2 p-8 text-center text-secondary-text">
                    <MapPin size={28} className="text-accent" />
                    <p className="font-medium text-primary-text">{t('admin.family_map.no_locations')}</p>
                    <p className="text-sm">{t('admin.family_map.update_address')}</p>
                  </div>
                )}
              </Card>

              {locations.length > 0 && (
                <Card>
                  <h4 className="mb-4 text-lg font-bold text-primary-text">{t('admin.family_map.distribution')}</h4>
                  <ul className="divide-y divide-custom-border">
                    {locations.map(location => {
                      const percentage = data.locatedMembers ? Math.round(location.memberCount / data.locatedMembers * 100) : 0;
                      return <li key={location.key} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                        <span className="font-medium text-primary-text">{location.displayName}</span>
                        <span className="text-sm text-secondary-text">{t('admin.family_map.member_count', { count: location.memberCount })} · {percentage}%</span>
                      </li>;
                    })}
                  </ul>
                </Card>
              )}
            </>
          )}
          {data.pendingGeocodingMembers > 0 && <p role="status" className="text-xs text-secondary-text">{t('admin.family_map.locating')}</p>}
        </>
      )}
    </div>
  );
};
