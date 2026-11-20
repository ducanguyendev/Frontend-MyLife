import { getSiblingDisplayLabelKey, getSiblingSeniority, isBiologicalSibling } from './siblingRelations';
import type { FamilyMember } from './types';

export type ProfileRelation = { memberId: number; labelKey?: string; recordedType?: string };
export type ProfileRelationGroup = { key: string; labelKey: string; hintKey?: string; rows: ProfileRelation[] };

/** Keep recorded links separate from shared-parent evidence, as Mobile does. */
export function classifyMemberRelations(member: FamilyMember, relatives: readonly FamilyMember[]): ProfileRelationGroup[] {
  const validId = (id: number | undefined): id is number => Number.isSafeInteger(id) && Number(id) > 0 && id !== member.id;
  const parents: ProfileRelation[] = [];
  if (validId(member.fatherId)) parents.push({ memberId: member.fatherId, labelKey: 'admin.field_father' });
  if (validId(member.motherId)) parents.push({ memberId: member.motherId, labelKey: 'admin.field_mother' });
  // Preserve Web's reverse child links and one-sided recorded horizontal links.
  const childIds = [...new Set([...(member.childIds ?? []), ...relatives.filter(other => other.fatherId === member.id || other.motherId === member.id).map(other => other.id)])].filter(validId);
  const horizontal = [...(member.horizontalRelations ?? [])];
  for (const other of relatives) {
    for (const relation of other.horizontalRelations ?? []) {
      if (relation.memberId === member.id && ['sibling', 'cousin'].includes(relation.relationType.trim().toLowerCase()) && !horizontal.some(row => row.memberId === other.id && row.relationType.trim().toLowerCase() === relation.relationType.trim().toLowerCase())) {
        horizontal.push({ memberId: other.id, relationType: relation.relationType });
      }
    }
  }
  const recorded = horizontal.filter(row => validId(row.memberId)).map(row => {
    const type = row.relationType.trim().toLowerCase();
    return { memberId: row.memberId, ...(type === 'sibling' ? { labelKey: 'family.relations.recordedSibling' }
      : type === 'cousin' ? { labelKey: 'admin.family_v2.cousins' } : { recordedType: row.relationType }) };
  });
  const inferred = relatives.filter(other => validId(other.id) && isBiologicalSibling(member, other)).map(other => {
    // Match Mobile's gender vocabulary; unknown values stay neutral.
    const gender = other.gender?.trim().toLowerCase();
    const knownGender = ['nam', 'male', 'nữ', 'female'].includes(gender ?? '') ? gender : undefined;
    const seniority = getSiblingSeniority(member, { ...other, gender: knownGender });
    return { memberId: other.id, labelKey: `admin.${getSiblingDisplayLabelKey('biological', seniority)}` };
  });
  return [
    { key: 'parents', labelKey: 'family.relations.parents', rows: parents },
    { key: 'spouse', labelKey: 'admin.field_spouse', rows: validId(member.spouseId) ? [{ memberId: member.spouseId, labelKey: 'admin.field_spouse' }] : [] },
    { key: 'children', labelKey: 'admin.field_children', rows: childIds.map(memberId => ({ memberId, labelKey: 'admin.field_children' })) },
    { key: 'recorded', labelKey: 'family.relations.recorded', hintKey: 'family.relations.recordedHint', rows: recorded },
    { key: 'inferred', labelKey: 'family.relations.sharedParent', hintKey: 'family.relations.sharedParentHint', rows: inferred },
  ];
}
