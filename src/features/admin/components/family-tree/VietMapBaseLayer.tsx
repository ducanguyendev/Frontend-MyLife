import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import '@vietmap/vietmap-gl-leaflet';

type VietMapLayer = L.Layer & { getVietmapMap: () => unknown };
type VietMapLeaflet = typeof L & { vietmapGL?: (options: { style: string }) => VietMapLayer };

const tileKey = import.meta.env.VITE_VIETMAP_TILE_KEY?.trim();
const vietMapLeaflet = L as VietMapLeaflet;
let missingKeyWarningShown = false;

export function VietMapBaseLayer() {
  const map = useMap();

  useEffect(() => {
    if (!tileKey || !vietMapLeaflet.vietmapGL) {
      if (import.meta.env.DEV && !missingKeyWarningShown) {
        console.warn('VIETMAP tile key or Leaflet GL binding is unavailable; using OpenStreetMap.');
        missingKeyWarningShown = true;
      }
      const fallback = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      });
      fallback.addTo(map);
      return () => { map.removeLayer(fallback); };
    }

    const layer = vietMapLeaflet.vietmapGL({
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${encodeURIComponent(tileKey)}`,
    });
    layer.addTo(map);
    const attribution = '&copy; <a href="https://maps.vietmap.vn/">VIETMAP</a> contributors';
    map.attributionControl.addAttribution(attribution);
    return () => {
      map.removeLayer(layer);
      map.attributionControl.removeAttribution(attribution);
    };
  }, [map]);

  return null;
}
