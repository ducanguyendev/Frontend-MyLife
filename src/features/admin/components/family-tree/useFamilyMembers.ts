import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/shared/api/apiClient';
import { getFeatureErrorKey } from '../../services/featureMessages';
import type { FamilyMember } from './types';

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await apiClient.requestRaw('/api/family-tree', { signal });
      if (signal?.aborted) return;
      if (response.ok) {
        const json = await response.json();
        if (!signal?.aborted) setMembers(json.data || []);
      } else {
        const error = await response.json().catch(() => null);
        if (!signal?.aborted) setLoadError(getFeatureErrorKey(error, 'member_load', response.status));
      }
    } catch (failure) {
      if (!signal?.aborted) setLoadError(getFeatureErrorKey(failure, 'member_load'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMembers(controller.signal);
    return () => controller.abort();
  }, [fetchMembers]);

  return { members, setMembers, loading, loadError, fetchMembers };
}
