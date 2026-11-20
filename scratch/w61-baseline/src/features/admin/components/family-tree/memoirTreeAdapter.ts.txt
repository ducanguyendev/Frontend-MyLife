import type { FamilyGraph, FamilyPartnershipGroup, FamilyParentChildLink } from "@memoir/tree";
import type { FamilyMember } from "./types";

export type MemoirPerson = FamilyMember & { name: string };
export interface MemoirFamilyUnit {
  id: string;
  partnerIds: number[];
  childIds: number[];
  relation: "spouse" | "coparent";
}
export interface MemoirFamilyTreeModel {
  graph: FamilyGraph<MemoirPerson>;
  units: MemoirFamilyUnit[];
}
const pairKey = (first: number, second: number) => [first, second].sort((a, b) => a - b).join(":");
const coupleId = (first: number, second: number) => `couple-${pairKey(first, second).replace(":", "-")}`;
const singleId = (parent: number) => `single-${parent}`;
const familyUnitId = (parentIds: number[]) => parentIds.length === 1 ? singleId(parentIds[0])
  : parentIds.length === 2 ? coupleId(parentIds[0], parentIds[1])
    : `family-${parentIds.join(":")}`;

/** Map API records into Memoir graph mode without changing or persisting the source records. */
export function adaptMembersToMemoirTree(members: FamilyMember[], subjectId: number | null): MemoirFamilyTreeModel {
  const byId = new Map(members.map(member => [member.id, member]));
  const people: Record<string, MemoirPerson> = {};
  for (const member of members) people[String(member.id)] = { ...member, name: member.fullName };

  const spousePairs = new Map<string, number[]>();
  for (const member of members) {
    const spouseId = member.spouseId;
    if (spouseId == null || spouseId === member.id || !byId.has(spouseId)) continue;
    spousePairs.set(coupleId(member.id, spouseId), [member.id, spouseId].sort((a, b) => a - b));
  }

  const childUnits = new Map<number, { id: string; parentIds: number[] }>();
  const reverseParents = new Map<number, Set<number>>();
  for (const parent of members) for (const childId of parent.childIds ?? []) {
    if (childId === parent.id || !byId.has(childId)) continue;
    const parentIds = reverseParents.get(childId) ?? new Set<number>();
    parentIds.add(parent.id);
    reverseParents.set(childId, parentIds);
  }
  for (const child of members) {
    const parentIds = [...new Set([
      child.fatherId,
      child.motherId,
      ...(reverseParents.get(child.id) ?? []),
    ].filter((id): id is number => id != null && id !== child.id && byId.has(id)))].sort((a, b) => a - b);
    if (!parentIds.length) continue;
    const id = familyUnitId(parentIds);
    childUnits.set(child.id, { id, parentIds });
    if (parentIds.length > 1 && !spousePairs.has(id)) spousePairs.set(id, parentIds);
  }

  const unitChildren = new Map<string, Set<number>>();
  for (const [childId, unit] of childUnits) {
    const ids = unitChildren.get(unit.id) ?? new Set<number>();
    ids.add(childId);
    unitChildren.set(unit.id, ids);
  }

  const partnershipGroups: FamilyPartnershipGroup[] = [];
  const parentChildLinks: FamilyParentChildLink[] = [];
  const units: MemoirFamilyUnit[] = [];
  const groupIds = new Set<string>();
  for (const [id, partnerIds] of [...spousePairs].sort(([a], [b]) => a.localeCompare(b))) {
    if (partnerIds.some(partnerId => !byId.has(partnerId)) || partnerIds.length < 2) continue;
    const children = [...(unitChildren.get(id) ?? [])].sort((a, b) => a - b);
    const isDeclaredSpousePair = members.some(member => member.spouseId != null && member.spouseId !== member.id
      && byId.has(member.spouseId) && coupleId(member.id, member.spouseId) === id);
    partnershipGroups.push({ id, partners: partnerIds.map(String), relation: isDeclaredSpousePair ? "spouse" : "coparent" });
    groupIds.add(id);
    units.push({ id, partnerIds, childIds: children, relation: isDeclaredSpousePair ? "spouse" : "coparent" });
  }
  for (const [childId, unit] of [...childUnits].sort(([a], [b]) => a - b)) {
    if (!groupIds.has(unit.id)) {
      partnershipGroups.push({ id: unit.id, partners: unit.parentIds.map(String), relation: "coparent" });
      groupIds.add(unit.id);
      units.push({ id: unit.id, partnerIds: unit.parentIds, childIds: [...(unitChildren.get(unit.id) ?? [])].sort((a, b) => a - b), relation: "coparent" });
    }
    for (const parentId of unit.parentIds) parentChildLinks.push({
      id: `parent-${parentId}-child-${childId}`,
      groupId: unit.id,
      parentId: String(parentId),
      childId: String(childId),
      relation: "biological",
    });
  }
  units.sort((a, b) => a.id.localeCompare(b.id));

  const subject = subjectId != null && byId.has(subjectId) ? String(subjectId) : String(members[0]?.id ?? "");
  return { graph: { people, subject, partnershipGroups, parentChildLinks }, units };
}
