import { apiClient } from '@/shared/api/apiClient';
import type { FamilyMember } from '../components/family-tree/types';

export interface RelationshipPathNode { memberId: number; fullName: string; edge?: string | null }
export interface RelationshipResult {
  fromMemberId: number; toMemberId: number; relationshipCode: string; relationshipLabel: string;
  reverseRelationshipCode: string; reverseRelationshipLabel: string; distance: number; path: RelationshipPathNode[];
}
export interface FamilyTimelineEvent {
  id: number; memberId: number | null; memberName: string | null; eventType: string; title: string;
  description: string | null; eventDate: string | null; eventYear: number | null; isApproximate: boolean;
  location: string | null; latitude: number | null; longitude: number | null; relatedMemberId: number | null;
  sourceType: string | null; sourceId: number | null; isDerived: boolean;
}
export interface FamilyMemberProfile {
  member: FamilyMember; relatives: FamilyMember[]; timeline: FamilyTimelineEvent[];
  anniversaries: Array<{ id: number; eventType: string; title: string; originalSolarDate: string | null; nextSolarDate: string; daysUntil: number; place: string | null; notes: string | null }>;
  libraryMemberLinkAvailable: boolean;
}
export interface FamilyTimelineWrite {
  memberId: number | null; eventType: string; title: string; description: string | null;
  eventDate: string | null; eventYear: number | null; isApproximate: boolean; location: string | null;
  latitude: number | null; longitude: number | null; relatedMemberId: number | null;
}

interface ApiEnvelope<T> { success: boolean; data: T }
const dataOf = <T>(response: ApiEnvelope<T>) => response.data;

export async function fetchRelationship(fromMemberId: number, toMemberId: number, signal?: AbortSignal): Promise<RelationshipResult> {
  const url = `/api/family-tree/relationship?fromMemberId=${encodeURIComponent(fromMemberId)}&toMemberId=${encodeURIComponent(toMemberId)}`;
  return dataOf(await apiClient.get<ApiEnvelope<RelationshipResult>>(url, { signal }));
}

export async function fetchMemberProfile(memberId: number, signal?: AbortSignal): Promise<FamilyMemberProfile> {
  return dataOf(await apiClient.get<ApiEnvelope<FamilyMemberProfile>>(`/api/family-tree/${memberId}/profile`, { signal }));
}

export async function fetchFamilyMembers(signal?: AbortSignal): Promise<FamilyMember[]> {
  return dataOf(await apiClient.get<ApiEnvelope<FamilyMember[]>>('/api/family-tree', { signal }));
}

export async function fetchFamilyTimeline(signal?: AbortSignal): Promise<FamilyTimelineEvent[]> {
  return dataOf(await apiClient.get<ApiEnvelope<FamilyTimelineEvent[]>>('/api/family-tree/timeline', { signal }));
}

export async function saveFamilyTimelineEvent(event: FamilyTimelineWrite, id?: number): Promise<FamilyTimelineEvent> {
  const response = id
    ? await apiClient.put<ApiEnvelope<FamilyTimelineEvent>>(`/api/family-tree/timeline/${id}`, event)
    : await apiClient.post<ApiEnvelope<FamilyTimelineEvent>>('/api/family-tree/timeline', event);
  return dataOf(response);
}

export async function deleteFamilyTimelineEvent(id: number): Promise<void> {
  await apiClient.delete(`/api/family-tree/timeline/${id}`);
}
