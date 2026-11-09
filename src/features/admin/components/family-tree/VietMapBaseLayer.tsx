import { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '@/shared/context/ThemeContext';
import { useLanguage } from '@/shared/hooks/useLanguage';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import '@vietmap/vietmap-gl-leaflet';
import './FamilyMapSurface.css';

type VietMapLayer = L.Layer & { getVietmapMap: () => unknown };
type VietMapLeaflet = typeof L & { vietmapGL?: (options: { style: string }) => VietMapLayer };

const tileKey = import.meta.env.VITE_VIETMAP_TILE_KEY?.trim();
const vietMapLeaflet = L as VietMapLeaflet;
export const VIETMAP_STYLE_URL = (key: string, theme: 'light' | 'dark') => `https://maps.vietmap.vn/maps/styles/${theme === 'dark' ? 'dm' : 'lm'}/style.json?apikey=${encodeURIComponent(key)}`;

export function VietMapBaseLayer({ onFailure, retryKey = 0 }: { onFailure?: (failed: boolean) => void; retryKey?: number }) {
  const map = useMap();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reportFailure = useCallback((value: boolean) => { setFailed(value); onFailure?.(value); }, [onFailure]);

  useEffect(() => {
    if (!tileKey || !vietMapLeaflet.vietmapGL) {
      reportFailure(true);
      return;
    }

    reportFailure(false);
    let layer: VietMapLayer;
    try {
      layer = vietMapLeaflet.vietmapGL({ style: VIETMAP_STYLE_URL(tileKey, theme) });
      layer.addTo(map);
    } catch {
      reportFailure(true);
      return;
    }
    const glMap = layer.getVietmapMap() as { on?: (event: string, handler: () => void) => void; off?: (event: string, handler: () => void) => void };
    const onError = () => reportFailure(true);
    glMap.on?.('error', onError);
    return () => {
      glMap.off?.('error', onError);
      map.removeLayer(layer);
    };
  }, [map, retryKey, attempt, reportFailure, theme]);

  return failed ? <div className="family-map-provider-error" role="alert">{t('admin.family_map.vietmap_error')} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t('admin.family_map.retry')}</button></div> : null;
}
