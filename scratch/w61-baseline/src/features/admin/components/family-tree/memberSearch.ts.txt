import { removeVietnameseTones, type FamilyMember } from './types';

export const normalizeSearchText = (value?: string | null) => removeVietnameseTones(value ?? '').trim().toLowerCase();
export function filterFamilyMembers(members: FamilyMember[], query: string, generation: string) {
  const normalized = normalizeSearchText(query);
  return members.filter(member => (generation === 'all' || String(member.generation) === generation) &&
    (!normalized || [member.fullName, member.role, member.phoneNumber, member.address].some(value => normalizeSearchText(value).includes(normalized))));
}
