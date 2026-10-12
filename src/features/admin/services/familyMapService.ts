import { apiClient } from '@/shared/api/apiClient';

export interface FamilyMapMember {
  id: number;
  fullName: string;
  generation: number;
}

export interface FamilyMapLocation {
  key: string;
  displayName: string;
  latitude: number;
  longitude: number;
  memberCount: number;
  members: FamilyMapMember[];
}

export interface FamilyMapData {
  totalMembers: number;
  locatedMembers: number;
  unlocatedMembers: number;
  pendingGeocodingMembers: number;
  locations: FamilyMapLocation[];
}

interface FamilyMapResponse {
  success: boolean;
  data: FamilyMapData;
}

export async function getFamilyMapDistribution(signal?: AbortSignal): Promise<FamilyMapData> {
  const response = await apiClient.get<FamilyMapResponse>('/api/family-tree/map', { signal });
  return response.data;
}
