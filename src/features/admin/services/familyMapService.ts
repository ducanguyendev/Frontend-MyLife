import { apiClient } from '@/shared/api/apiClient';

export interface FamilyMapMember {
  id: number;
  fullName: string;
  generation: number;
  address?: string | null;
  status: "NO_ADDRESS" | "PENDING" | "LOCATED" | "FAILED" | "UNAVAILABLE";
  latitude?: number | null;
  longitude?: number | null;
  locationDisplayName?: string | null;
  locationSource?: "GEOCODED" | "MANUAL" | null;
}

export interface FamilyMapLocationMember {
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
  members: FamilyMapLocationMember[];
}

export interface FamilyMapData {
  totalMembers: number;
  locatedMembers: number;
  unlocatedMembers: number;
  pendingGeocodingMembers: number;
  noAddressMembers: number;
  failedGeocodingMembers: number;
  locations: FamilyMapLocation[];
  members: FamilyMapMember[];
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finiteNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' && !(typeof value === 'string' && value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const coordinate = (value: unknown, min: number, max: number): number | null => {
  const parsed = finiteNumber(value);
  return parsed !== null && parsed >= min && parsed <= max ? parsed : null;
};

const normalizeLocationMember = (value: unknown): FamilyMapLocationMember | null => {
  if (!isRecord(value)) return null;
  const id = finiteNumber(value.id);
  if (id === null || !Number.isInteger(id)) return null;
  return {
    id,
    fullName: typeof value.fullName === 'string' ? value.fullName : '',
    generation: finiteNumber(value.generation) ?? 0,
  };
};

const normalizeMember = (value: unknown): FamilyMapMember | null => {
  const member = normalizeLocationMember(value);
  if (!member || !isRecord(value)) return null;
  const latitude = coordinate(value.latitude, -90, 90);
  const longitude = coordinate(value.longitude, -180, 180);
  const statuses = ['NO_ADDRESS', 'PENDING', 'LOCATED', 'FAILED', 'UNAVAILABLE'] as const;
  const status = typeof value.status === 'string' && statuses.includes(value.status as typeof statuses[number])
    ? value.status as FamilyMapMember['status']
    : latitude !== null && longitude !== null ? 'LOCATED' : 'UNAVAILABLE';
  const source = value.locationSource === 'MANUAL' || value.locationSource === 'GEOCODED'
    ? value.locationSource
    : null;
  return {
    ...member,
    address: typeof value.address === 'string' ? value.address : null,
    status,
    latitude,
    longitude,
    locationDisplayName: typeof value.locationDisplayName === 'string' ? value.locationDisplayName : null,
    locationSource: source,
  };
};

/** Normalize the backend response before any map/UI code reads optional fields. */
export function normalizeFamilyMapData(value: unknown): FamilyMapData {
  if (!isRecord(value)) throw new TypeError('Invalid family map response data');

  const rawLocations = Array.isArray(value.locations) ? value.locations : [];
  const locations = rawLocations.flatMap((entry, index): FamilyMapLocation[] => {
    if (!isRecord(entry)) return [];
    const latitude = coordinate(entry.latitude, -90, 90);
    const longitude = coordinate(entry.longitude, -180, 180);
    if (latitude === null || longitude === null) return [];

    const members = (Array.isArray(entry.members) ? entry.members : [])
      .map(normalizeLocationMember)
      .filter((member): member is FamilyMapLocationMember => member !== null);
    const reportedCount = finiteNumber(entry.memberCount);
    const memberCount = reportedCount !== null && reportedCount >= 0
      ? Math.floor(reportedCount)
      : members.length;
    const key = typeof entry.key === 'string' && entry.key.length > 0
      ? entry.key
      : `${latitude.toFixed(5)}:${longitude.toFixed(5)}:${index}`;

    return [{
      key,
      displayName: typeof entry.displayName === 'string' ? entry.displayName : '',
      latitude,
      longitude,
      memberCount,
      members,
    }];
  });

  const fromApi = (Array.isArray(value.members) ? value.members : [])
    .map(normalizeMember)
    .filter((member): member is FamilyMapMember => member !== null);
  const fromLocations = locations.flatMap(location => location.members.map(member => ({
    ...member,
    address: null,
    status: 'LOCATED' as const,
    latitude: location.latitude,
    longitude: location.longitude,
    locationDisplayName: location.displayName || null,
    locationSource: null,
  })));
  const members = fromApi.length > 0 ? fromApi : fromLocations;
  const locatedFromLocations = locations.reduce((sum, location) => sum + location.memberCount, 0);
  const totalMembers = finiteNumber(value.totalMembers) ?? members.length;
  const locatedMembers = finiteNumber(value.locatedMembers) ?? locatedFromLocations;

  return {
    totalMembers: Math.max(0, Math.floor(totalMembers)),
    locatedMembers: Math.max(0, Math.floor(locatedMembers)),
    unlocatedMembers: Math.max(0, Math.floor(finiteNumber(value.unlocatedMembers) ?? totalMembers - locatedMembers)),
    pendingGeocodingMembers: Math.max(0, Math.floor(finiteNumber(value.pendingGeocodingMembers) ?? 0)),
    noAddressMembers: Math.max(0, Math.floor(finiteNumber(value.noAddressMembers) ?? 0)),
    failedGeocodingMembers: Math.max(0, Math.floor(finiteNumber(value.failedGeocodingMembers) ?? 0)),
    locations,
    members,
  };
}

export async function updateFamilyMemberLocation(
  memberId: number,
  latitude: number,
  longitude: number,
  displayName?: string,
): Promise<void> {
  await apiClient.put(`/api/family-tree/${memberId}/location`, { latitude, longitude, displayName });
}

export async function getFamilyMapDistribution(signal?: AbortSignal): Promise<FamilyMapData> {
  const response = await apiClient.get<unknown>('/api/family-tree/map', { signal });
  if (!isRecord(response) || !('data' in response)) {
    throw new TypeError('Invalid family map API envelope');
  }
  return normalizeFamilyMapData(response.data);
}

export async function retryFamilyMapGeocoding(): Promise<{ queued: number; skippedManual: number; skippedLocated: number; noAddress: number }> {
  const response = await apiClient.post<unknown>('/api/family-tree/map/retry-geocoding');
  if (!isRecord(response) || !isRecord(response.data)) {
    throw new TypeError('Invalid family map retry API response');
  }
  const count = (value: unknown) => Math.max(0, Math.floor(finiteNumber(value) ?? 0));
  return {
    queued: count(response.data.queued),
    skippedManual: count(response.data.skippedManual),
    skippedLocated: count(response.data.skippedLocated),
    noAddress: count(response.data.noAddress),
  };
}
