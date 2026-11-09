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
      const result = await fetchFamilyMembers(signal);
      if (signal?.aborted) return;
      if ('errorKey' in result) setLoadError(result.errorKey);
      else setMembers(result.members);
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

export async function fetchFamilyMembers(signal?: AbortSignal): Promise<{ members: FamilyMember[] } | { errorKey: string }> {
  try {
    const response = await apiClient.requestRaw('/api/family-tree', { signal });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return { errorKey: getFeatureErrorKey(error, 'member_load', response.status) };
    }
    const json = await response.json();
    return { members: Array.isArray(json.data) ? json.data as FamilyMember[] : [] };
  } catch (failure) {
    if (signal?.aborted) return { members: [] };
    return { errorKey: getFeatureErrorKey(failure, 'member_load') };
  }
}
