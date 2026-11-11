import type { FamilyMember } from './types';

export type SiblingKind = 'biological' | 'cousin';
export type SiblingSeniority =
  | 'older-brother' | 'older-sister' | 'older-unknown'
  | 'younger-brother' | 'younger-sister' | 'younger-unknown'
  | 'unknown';

export function isBiologicalSibling(a: Pick<FamilyMember, 'fatherId' | 'motherId'>, b: Pick<FamilyMember, 'fatherId' | 'motherId'>): boolean {
  const hasKnownFather = Number.isFinite(a.fatherId) && Number(a.fatherId) > 0 && Number.isFinite(b.fatherId) && Number(b.fatherId) > 0;
  const hasKnownMother = Number.isFinite(a.motherId) && Number(a.motherId) > 0 && Number.isFinite(b.motherId) && Number(b.motherId) > 0;
  const sameKnownFather = hasKnownFather && a.fatherId === b.fatherId;
  const sameKnownMother = hasKnownMother && a.motherId === b.motherId;
  return sameKnownFather || sameKnownMother;
}

function hasSiblingRelation(from: FamilyMember, toId: number): boolean {
  return (from.horizontalRelations || []).some(relation =>
    Number(relation.memberId) === toId && relation.relationType?.trim().toLowerCase() === 'sibling'
  );
}

export function hasExplicitSiblingRelation(a: FamilyMember, b: FamilyMember): boolean {
  return hasSiblingRelation(a, b.id) || hasSiblingRelation(b, a.id);
}

export function getSiblingKind(current: FamilyMember, other: FamilyMember): SiblingKind | null {
  if (isBiologicalSibling(current, other)) return 'biological';
  return hasExplicitSiblingRelation(current, other) ? 'cousin' : null;
}

function parseBirthDate(value?: string): number | null {
  if (!value?.trim()) return null;
  const dateOnly = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const timestamp = Date.parse(`${dateOnly}T00:00:00.000Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== dateOnly) return null;
    return timestamp;
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getSiblingSeniority(
  current: Pick<FamilyMember, 'dateOfBirth'>,
  other: Pick<FamilyMember, 'dateOfBirth' | 'gender'>
): SiblingSeniority {
  const currentDate = parseBirthDate(current.dateOfBirth);
  const otherDate = parseBirthDate(other.dateOfBirth);
  if (currentDate === null || otherDate === null || currentDate === otherDate) return 'unknown';

  const seniority = otherDate < currentDate ? 'older' : 'younger';
  const gender = other.gender?.trim().toLocaleLowerCase();
  if (gender === 'nam' || gender === 'male') return `${seniority}-brother`;
  if (gender === 'nữ' || gender === 'nu' || gender === 'female') return `${seniority}-sister`;
  return `${seniority}-unknown`;
}

export function getSiblingDisplayLabelKey(kind: SiblingKind, seniority: SiblingSeniority): string {
  if (seniority === 'unknown') return kind === 'biological' ? 'sibling_neutral_biological' : 'sibling_neutral_cousin';
  return `sibling_${kind}_${seniority.replace('-', '_')}`;
}
