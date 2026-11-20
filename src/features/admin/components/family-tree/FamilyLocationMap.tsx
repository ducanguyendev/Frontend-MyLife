import { useEffect, useRef } from 'react';
import { CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Focus, Minus, Plus } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { VietMapBaseLayer } from './VietMapBaseLayer';

export function MapVisibilityResize() {
  const map = useMap();
  useEffect(() => {
    let disposed = false;
    let frame = 0;
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!disposed && map.getContainer().isConnected) map.invalidateSize({ pan: false, debounceMoveend: true });
      });
    };
    const initialFrame = requestAnimationFrame(resize);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(map.getContainer());
    window.addEventListener('resize', resize);
    return () => {
      disposed = true;
      cancelAnimationFrame(initialFrame);
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [map]);
  return null;
}

/** One compact control group for the workspace, editor and profile map. */
export function FamilyMapControls({ onFit }: { onFit: (map: L.Map) => void }) {
  const map = useMap();
  const { t } = useLanguage();
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    L.DomEvent.disableClickPropagation(toolbar);
    L.DomEvent.disableScrollPropagation(toolbar);
    return () => { L.DomEvent.off(toolbar); };
  }, []);
  const fitLabel = t('admin.family_map.fit_all');
  const zoomInLabel = t('admin.family_map.zoom_in');
  const zoomOutLabel = t('admin.family_map.zoom_out');
  return <div ref={toolbarRef} className="family-map-controls" role="group" aria-label={fitLabel}>
    <button type="button" aria-label={zoomInLabel} title={zoomInLabel} onClick={() => map.zoomIn()}><Plus size={17}/></button>
    <button type="button" aria-label={zoomOutLabel} title={zoomOutLabel} onClick={() => map.zoomOut()}><Minus size={17}/></button>
    <span className="family-map-controls__divider"/>
    <button type="button" aria-label={fitLabel} title={fitLabel} onClick={() => onFit(map)}><Focus size={17}/></button>
  </div>;
}

export function FamilyLocationMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  return <>
    <VietMapBaseLayer />
    <MapVisibilityResize />
    <FamilyMapControls onFit={map => map.setView([latitude, longitude], 13)} />
    <CircleMarker center={[latitude, longitude]} radius={8} pathOptions={{ color: 'var(--surface-primary)', weight: 3, fillColor: 'var(--accent-map)', fillOpacity: 1 }} />
  </>;
}
