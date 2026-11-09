import { useCallback, useEffect } from 'react';
import { CircleMarker, useMap } from 'react-leaflet';
import { VietMapBaseLayer } from './VietMapBaseLayer';

export function MapVisibilityResize() {
  const map = useMap();
  const resize = useCallback(() => map.invalidateSize({ pan: false, debounceMoveend: true }), [map]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(resize));
    const observer = new ResizeObserver(resize);
    observer.observe(map.getContainer());
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [map, resize]);
  return null;
}

export function FamilyLocationMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  return <>
    <VietMapBaseLayer />
    <MapVisibilityResize />
    <CircleMarker center={[latitude, longitude]} radius={8} pathOptions={{ color: 'var(--surface-primary)', weight: 3, fillColor: 'var(--accent-map)', fillOpacity: 1 }} />
  </>;
}
