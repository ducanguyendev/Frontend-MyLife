import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowUpRight, Layers3, Loader2, MapPin, Minus, Plus, RefreshCw, Search, Users } from 'lucide-react';
import { Button, Modal, Select, SelectItem, PageHeader, Loading, ErrorState, EmptyState } from '@/shared/components/ui';
import './FamilyMapTab.css';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { getFamilyMapDistribution, retryFamilyMapGeocoding, updateFamilyMemberLocation, type FamilyMapData, type FamilyMapLocation, type FamilyMapMember } from '../../services/familyMapService';
import { VietMapBaseLayer } from './VietMapBaseLayer';
import { MapVisibilityResize } from './FamilyLocationMap';

const VIETNAM_CENTER: [number, number] = [16.2, 106.2];
type ExplorerFilter = 'all' | 'located' | 'unlocated';

const searchValue = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

function MapViewport({ locations, fitRequest, selected }: { locations: FamilyMapLocation[]; fitRequest: number; selected: FamilyMapLocation | null }) {
  const map = useMap();
  const selectedKey = selected?.key;
  const selectedLatitude = selected?.latitude;
  const selectedLongitude = selected?.longitude;
  const lastFit = useRef('');
  const lastRequest = useRef(fitRequest);
  useEffect(() => {
    const signature = locations.map(location => `${location.key}:${location.latitude}:${location.longitude}`).join('|');
    if (signature === lastFit.current) return;
    lastFit.current = signature;
    if (!locations.length) map.setView(VIETNAM_CENTER, 5);
    else if (locations.length === 1) map.setView([locations[0].latitude, locations[0].longitude], 12);
    else map.fitBounds(L.latLngBounds(locations.map(location => [location.latitude, location.longitude])), { padding: [48, 48], maxZoom: 9 });
  }, [locations, map]);
  useEffect(() => {
    if (lastRequest.current === fitRequest) return;
    lastRequest.current = fitRequest;
    if (locations.length === 1) map.setView([locations[0].latitude, locations[0].longitude], 12);
    else if (locations.length > 1) map.fitBounds(L.latLngBounds(locations.map(location => [location.latitude, location.longitude])), { padding: [48, 48], maxZoom: 10 });
    else map.setView(VIETNAM_CENTER, 5);
  }, [fitRequest, locations, map]);
  useEffect(() => {
    if (selectedLatitude === undefined || selectedLongitude === undefined) return;
    map.flyTo([selectedLatitude, selectedLongitude], Math.max(map.getZoom(), 12), { duration: 0.45 });
  }, [map, selectedKey, selectedLatitude, selectedLongitude]);
  return null;
}

function MapControls({ onFit, fitLabel, zoomInLabel, zoomOutLabel }: { onFit: () => void; fitLabel: string; zoomInLabel: string; zoomOutLabel: string }) {
  const map = useMap();
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    L.DomEvent.disableClickPropagation(toolbar);
    L.DomEvent.disableScrollPropagation(toolbar);
    return () => { L.DomEvent.off(toolbar); };
  }, []);
  return <div ref={toolbarRef} className="family-map-controls" role="group" aria-label={fitLabel}>
    <button type="button" aria-label={zoomInLabel} title={zoomInLabel} onClick={() => map.zoomIn()}><Plus size={17}/></button>
    <button type="button" aria-label={zoomOutLabel} title={zoomOutLabel} onClick={() => map.zoomOut()}><Minus size={17}/></button>
    <span className="family-map-controls__divider"/>
    <button type="button" aria-label={fitLabel} title={fitLabel} onClick={onFit}><Layers3 size={17}/></button>
  </div>;
}

function LocationEditorControls({ point, fitLabel, zoomInLabel, zoomOutLabel }: { point: [number, number] | null; fitLabel: string; zoomInLabel: string; zoomOutLabel: string }) {
  const map = useMap();
  return <MapControls onFit={() => map.setView(point ?? VIETNAM_CENTER, point ? 13 : 5)} fitLabel={fitLabel} zoomInLabel={zoomInLabel} zoomOutLabel={zoomOutLabel}/>;
}

function LocationPickerEvents({ point, onPick }: { point: [number, number] | null; onPick: (point: [number, number]) => void }) {
  useMapEvents({ click: event => onPick([event.latlng.lat, event.latlng.lng]) });
  return <><MapVisibilityResize/>{point ? <CircleMarker center={point} radius={9} pathOptions={{ color: 'var(--surface-primary)', weight: 3, fillColor: 'var(--accent-map)', fillOpacity: 1 }} /> : null}</>;
}

export const FamilyMapTab: React.FC = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<FamilyMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [locationMember, setLocationMember] = useState<FamilyMapMember | null>(null);
  const [locationPoint, setLocationPoint] = useState<[number, number] | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [retryingGeocoding, setRetryingGeocoding] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<'success' | 'error' | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ExplorerFilter>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedUnlocatedId, setSelectedUnlocatedId] = useState<number | null>(null);
  const [fitRequest, setFitRequest] = useState(0);

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
  const members = data?.members ?? [];
  const selected = locations.find(location => location.key === selectedKey) ?? null;
  const unlocatedMembers = members.filter(member => !(typeof member.latitude === 'number' && typeof member.longitude === 'number'));
  const normalizedQuery = searchValue(query);
  const visibleLocations = locations.filter(location => {
    if (filter === 'unlocated') return false;
    if (!normalizedQuery) return true;
    return searchValue(location.displayName).includes(normalizedQuery) || location.members.some(member => searchValue(member.fullName).includes(normalizedQuery));
  });
  const visibleUnlocated = unlocatedMembers.filter(member => {
    if (filter === 'located') return false;
    if (!normalizedQuery) return true;
    return searchValue(member.fullName).includes(normalizedQuery) || searchValue(member.address ?? '').includes(normalizedQuery);
  });

  const hasGeocodingStatus = Boolean(data && (data.pendingGeocodingMembers > 0 || data.noAddressMembers > 0 || data.failedGeocodingMembers > 0));
  const retry = () => { setLoading(true); void load(); };
  const retryGeocoding = async () => {
    if (retryingGeocoding) return;
    setRetryingGeocoding(true); setRetryFeedback(null);
    try { await retryFamilyMapGeocoding(); setRetryFeedback('success'); setLoading(true); await load(); }
    catch { setRetryFeedback('error'); }
    finally { setRetryingGeocoding(false); }
  };
  const openLocationPicker = (member: FamilyMapMember) => {
    setLocationMember(member);
    setLocationPoint(typeof member.latitude === 'number' && typeof member.longitude === 'number' ? [member.latitude, member.longitude] : null);
  };
  const confirmLocation = async () => {
    if (!locationMember || !locationPoint) return;
    setSavingLocation(true);
    try { await updateFamilyMemberLocation(locationMember.id, locationPoint[0], locationPoint[1]); setLocationMember(null); await load(); }
    catch { setError(true); }
    finally { setSavingLocation(false); }
  };
  const stats = [
    { label: t('admin.family_map.compact_located'), value: data?.locatedMembers ?? 0, icon: Users },
    { label: t('admin.family_map.compact_regions'), value: locations.length, icon: MapPin },
    { label: t('admin.family_map.compact_unlocated'), value: data?.unlocatedMembers ?? 0, icon: Layers3 },
  ];
  const selectLocation = (location: FamilyMapLocation) => { setSelectedKey(location.key); setSelectedUnlocatedId(null); };
  const mapErrorOrStatus = error || hasGeocodingStatus ? <div className="family-map-notice">
    {error && <p role="alert">{t('admin.family_map.error')} <button type="button" onClick={retry}>{t('admin.family_map.retry')}</button></p>}
    {data?.pendingGeocodingMembers ? <p><Loader2 size={14} className="animate-spin"/>{t('admin.family_map.locating')}</p> : null}
    {data?.noAddressMembers ? <span>{t('admin.family_map.no_address_status', { count: data.noAddressMembers })}</span> : null}
    {data?.failedGeocodingMembers ? <><span>{t('admin.family_map.failed_status', { count: data.failedGeocodingMembers })}</span><Button type="button" variant="secondary" size="sm" isLoading={retryingGeocoding} onClick={() => void retryGeocoding()}>{t('admin.family_map.retry_geocoding')}</Button></> : null}
    {retryFeedback === 'success' && <span role="status">{t('admin.family_map.retry_geocoding_success')}</span>}
    {retryFeedback === 'error' && <span role="alert">{t('admin.family_map.retry_geocoding_error')}</span>}
  </div> : null;

  return <div className="family-map-workspace flex h-full min-h-0 flex-col gap-3">
    <PageHeader eyebrow={t('admin.family_map.eyebrow')} title={t('admin.family_map.workspace_title')} description={t('admin.family_map.page_description')} actions={members.length > 0 ? <Button type="button" variant="secondary" size="sm" onClick={() => openLocationPicker(members[0])}><MapPin size={16}/><span>{t('admin.family_map.adjust_location')}</span></Button> : undefined}/>
    {data && <ul className="family-map-summary" aria-label={t('admin.family_map.statistics')}>
      {stats.map(({ label, value, icon: Icon }) => <li key={label}><span className="family-map-summary__icon"><Icon size={17}/></span><span className="family-map-summary__value">{value}</span><span className="family-map-summary__label">{label}</span></li>)}
    </ul>}

    {loading && !data ? <Loading label={t('admin.family_map.loading')}/> : error && !data ? <ErrorState message={t('admin.family_map.error')} action={<Button variant="secondary" onClick={retry} leftIcon={<RefreshCw size={16}/>}>{t('admin.family_map.retry')}</Button>}/> : data?.totalMembers === 0 ? <EmptyState title={t('admin.family_map.empty')}/> : <div className="family-map-explorer-layout">
      <aside className="family-map-explorer" aria-label={t('admin.family_map.explorer')}>
        <div className="family-map-explorer__heading"><div><span>{t('admin.family_map.explorer_eyebrow')}</span><h2>{t('admin.family_map.explorer')}</h2></div><span className="family-map-explorer__count">{data?.locatedMembers ?? 0}</span></div>
        <label className="family-map-search" data-field-shell><Search size={17} aria-hidden="true"/><span className="sr-only">{t('admin.family_map.search_label')}</span><input data-ui-control value={query} onChange={event => setQuery(event.target.value)} placeholder={t('admin.family_map.search_placeholder')} /></label>
        <div className="family-map-filter" role="group" aria-label={t('admin.family_map.filter_label')}>
          {(['all', 'located', 'unlocated'] as ExplorerFilter[]).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(`admin.family_map.filter_${value}`)}</button>)}
        </div>
        <div className="family-map-explorer__list">
          {visibleLocations.map(location => <button type="button" key={location.key} className={`family-map-location${selectedKey === location.key ? ' is-selected' : ''}`} aria-pressed={selectedKey === location.key} onClick={() => selectLocation(location)}>
            <span className="family-map-location__pin"><MapPin size={17}/></span><span className="family-map-location__body"><strong>{location.displayName || t('admin.family_map.unknown_location')}</strong><span>{t('admin.family_map.member_count', { count: location.memberCount })}</span><span className="family-map-location__people">{location.members.slice(0, 3).map(member => <i key={member.id}>{member.fullName.trim().split(/\s+/).at(-1)?.[0] ?? '?'}</i>)}{location.memberCount > 3 && <i>+{location.memberCount - 3}</i>}<small>{location.members.slice(0, 2).map(member => member.fullName).join(', ')}{location.memberCount > 2 ? ` +${location.memberCount - 2}` : ''}</small></span></span><ArrowUpRight size={15} className="family-map-location__arrow"/>
          </button>)}
          {visibleUnlocated.length > 0 && <div className="family-map-unlocated"><h3>{t('admin.family_map.unlocated_heading')} <span>{visibleUnlocated.length}</span></h3>{visibleUnlocated.map(member => <div key={member.id} className={`family-map-unlocated__member${selectedUnlocatedId === member.id ? ' is-selected' : ''}`}><button type="button" className="family-map-unlocated__name" onClick={() => { setSelectedKey(null); setSelectedUnlocatedId(member.id); }}><span className="family-map-avatar">{member.fullName.trim().split(/\s+/).at(-1)?.[0] ?? '?'}</span><span><strong>{member.fullName}</strong><small>{member.address || t('admin.family_map.no_address')}</small></span></button><button type="button" className="family-map-unlocated__edit" aria-label={`${t('admin.family_map.adjust_location')}: ${member.fullName}`} onClick={() => openLocationPicker(member)}><MapPin size={15}/></button></div>)}</div>}
          {visibleLocations.length === 0 && visibleUnlocated.length === 0 && <div className="family-map-list-empty">{normalizedQuery ? t('admin.family_map.search_empty') : t('admin.family_map.filter_empty')}</div>}
        </div>
        {selected && <section className="family-map-detail" aria-live="polite"><p>{t('admin.family_map.selected_location')}</p><h3>{selected.displayName || t('admin.family_map.unknown_location')}</h3><span>{t('admin.family_map.member_count', { count: selected.memberCount })}</span><ul>{selected.members.map(member => <li key={member.id}><span className="family-map-avatar">{member.fullName.trim().split(/\s+/).at(-1)?.[0] ?? '?'}</span><span>{member.fullName}</span><Link to={`/mylife/family/member/${member.id}`} aria-label={`${t('admin.family_map.view_profile')}: ${member.fullName}`} title={t('admin.family_map.view_profile')}><ArrowUpRight size={15}/></Link></li>)}</ul></section>}
        {mapErrorOrStatus}
      </aside>
      <section className="family-map-canvas" aria-label={t('admin.family_map.canvas_label')}>
        <MapContainer center={VIETNAM_CENTER} zoom={5} scrollWheelZoom zoomControl={false} className="family-distribution-map">
          <VietMapBaseLayer/><MapViewport locations={locations} fitRequest={fitRequest} selected={selected}/>
          <MapControls onFit={() => setFitRequest(value => value + 1)} fitLabel={t('admin.family_map.fit_all')} zoomInLabel={t('admin.family_map.zoom_in')} zoomOutLabel={t('admin.family_map.zoom_out')}/>
          {locations.map(location => {
            const active = selectedKey === location.key;
            const radius = Math.min(22, Math.max(9, 8 + Math.sqrt(location.memberCount) * 2.5));
            return <CircleMarker key={location.key} center={[location.latitude, location.longitude]} radius={radius} eventHandlers={{ click: () => selectLocation(location) }} pathOptions={{ color: active ? '#fffdf8' : 'var(--surface-primary)', weight: active ? 4 : 2, fillColor: active ? '#2f776f' : 'var(--accent-map)', fillOpacity: 0.94, className: 'family-map-marker' }}>
              <Tooltip direction="top" offset={[0, -radius]}>{location.displayName || t('admin.family_map.unknown_location')} · {t('admin.family_map.member_count', { count: location.memberCount })}</Tooltip>
              <Popup><div className="family-map-popup-content"><strong>{location.displayName || t('admin.family_map.unknown_location')}</strong><p>{t('admin.family_map.member_count', { count: location.memberCount })}</p>{location.members.slice(0, 5).map(member => <Link key={member.id} to={`/mylife/family/member/${member.id}`} className="family-map-popup-member">{member.fullName}<ArrowUpRight size={13}/></Link>)}{location.memberCount > 5 && <small>{t('admin.family_map.more_members', { count: location.memberCount - 5 })}</small>}</div></Popup>
            </CircleMarker>;
          })}
        </MapContainer>
        {locations.length === 0 && <div className="family-map-no-pins"><MapPin size={21}/><span>{t('admin.family_map.no_locations')}</span></div>}
      </section>
    </div>}

    <Modal isOpen={locationMember !== null} onClose={() => setLocationMember(null)} title={t('admin.family_map.adjust_location')} ariaLabel={t('admin.family_map.adjust_location')} maxWidth="full" className="family-location-modal" footer={<div className="flex w-full items-center justify-end gap-3"><Button type="button" variant="secondary" disabled={savingLocation} onClick={() => setLocationMember(null)}>{t('admin.cancel', { defaultValue: 'Cancel' })}</Button><Button type="button" variant="primary" disabled={!locationPoint || savingLocation} isLoading={savingLocation} onClick={() => void confirmLocation()}>{t('admin.family_map.confirm_location')}</Button></div>}>
      {locationMember && <div className="family-location-modal__body"><aside className="family-location-modal__info"><Select aria-label={t('admin.family_map.member')} appearance="simple" value={String(locationMember.id)} onValueChange={value => { const member = members.find(item => item.id === Number(value)); if (member) openLocationPicker(member); }}>{members.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.fullName} · {member.address || t('admin.family_map.no_address')}</SelectItem>)}</Select><p className="m-0 text-sm text-secondary-text">{t('admin.family_map.tap_map_to_pick')}</p><div><span className="text-xs font-semibold text-secondary-text">{t('admin.family_map.member')}</span><p className="m-0 font-medium text-primary-text">{locationMember.fullName}</p><p className="m-0 text-sm text-secondary-text">{locationMember.address || t('admin.family_map.no_address')}</p></div><div><span className="text-xs font-semibold text-secondary-text">{t('admin.family_map.selected_coordinates')}</span><p className="m-0 font-mono text-xs text-primary-text">{locationPoint ? `${locationPoint[0].toFixed(6)}, ${locationPoint[1].toFixed(6)}` : '—'}</p></div></aside><div className="family-location-modal__map"><MapContainer key={locationMember.id} center={locationPoint ?? VIETNAM_CENTER} zoom={locationPoint ? 13 : 5} scrollWheelZoom zoomControl={false} className="family-location-modal__leaflet"><VietMapBaseLayer/><LocationPickerEvents point={locationPoint} onPick={setLocationPoint}/><LocationEditorControls point={locationPoint} fitLabel={t('admin.family_map.fit_all')} zoomInLabel={t('admin.family_map.zoom_in')} zoomOutLabel={t('admin.family_map.zoom_out')}/></MapContainer></div></div>}
    </Modal>
  </div>;
};
