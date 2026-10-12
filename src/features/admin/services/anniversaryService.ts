import { apiClient } from '@/shared/api/apiClient';

export type AnniversaryEventType = 'DEATH_ANNIVERSARY' | 'FAMILY_EVENT';

export interface FamilyAnniversary {
  id: number;
  eventType: AnniversaryEventType;
  title: string;
  relatedMemberId: number | null;
  relatedMemberName: string | null;
  relatedMemberGeneration: number | null;
  relatedMemberRole: string | null;
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  nextSolarDate: string;
  daysUntil: number;
  place: string | null;
  host: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyAnniversaryPayload {
  eventType: AnniversaryEventType;
  title: string;
  relatedMemberId: number | null;
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  place: string | null;
  host: string | null;
  notes: string | null;
}

interface ApiEnvelope<T> { success: boolean; data: T }
const route = '/api/family-tree/anniversaries';

export const anniversaryService = {
  async getAnniversaries(signal?: AbortSignal) {
    const response = await apiClient.get<ApiEnvelope<FamilyAnniversary[]>>(route, { signal });
    return response.data;
  },
  async getAnniversary(id: number) {
    return (await apiClient.get<ApiEnvelope<FamilyAnniversary>>(`${route}/${id}`)).data;
  },
  async createAnniversary(payload: FamilyAnniversaryPayload) {
    return (await apiClient.post<ApiEnvelope<FamilyAnniversary>>(route, payload)).data;
  },
  async updateAnniversary(id: number, payload: FamilyAnniversaryPayload) {
    return (await apiClient.put<ApiEnvelope<FamilyAnniversary>>(`${route}/${id}`, payload)).data;
  },
  deleteAnniversary: (id: number) => apiClient.delete<void>(`${route}/${id}`),
  async convertLunarToSolar(day: number, month: number, year: number, isLeapMonth: boolean) {
    const query = new URLSearchParams({ day: String(day), month: String(month), year: String(year), isLeapMonth: String(isLeapMonth) });
    return (await apiClient.get<ApiEnvelope<{ solarDate: string }>>(`${route}/lunar-to-solar?${query}`)).data;
  },
};
