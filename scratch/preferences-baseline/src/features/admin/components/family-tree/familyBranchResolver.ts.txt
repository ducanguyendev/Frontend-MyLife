import type { FamilyViewLink } from "./family-view/familyTreeTypes";
import type { FamilyMember } from "./types";

/** Resolve the selected person's ancestry and their own household/descendant branch. */
export function getFamilyBranchMemberIds(members: FamilyMember[], memberId: number): Set<number> {
  const byId = new Map(members.map(member => [member.id, member]));
  const included = new Set<number>();
  const add = (id?: number | null) => { if (id != null && byId.has(id)) included.add(id); };
  const childIdsByParent = new Map<number, Set<number>>();
  const addChild = (parentId: number | undefined, childId: number) => {
    if (parentId == null || !byId.has(parentId) || !byId.has(childId)) return;
    const children = childIdsByParent.get(parentId) ?? new Set<number>();
    children.add(childId); childIdsByParent.set(parentId, children);
  };
  for (const member of members) {
    addChild(member.fatherId, member.id); addChild(member.motherId, member.id);
    for (const childId of member.childIds ?? []) addChild(member.id, childId);
  }

  const selected = byId.get(memberId);
  if (!selected) return included;

  // Walk only the selected person's ancestor line. Add each ancestor's partner so
  // the parent household remains intact; do not traverse that partner's sibling branches.
  const ancestors: number[] = [selected.id];
  const visitedAncestors = new Set<number>();
  while (ancestors.length && visitedAncestors.size < members.length) {
    const id = ancestors.pop()!;
    if (visitedAncestors.has(id)) continue;
    visitedAncestors.add(id); add(id);
    const person = byId.get(id);
    if (!person) continue;
    add(person.spouseId);
    for (const parentId of [person.fatherId, person.motherId]) {
      if (parentId != null && byId.has(parentId)) ancestors.push(parentId);
    }
  }

  // Descend only from the selected person and their spouse, preserving spouses
  // and child households without importing cousins from shared ancestors.
  const descendants = [selected.id, ...(selected.spouseId != null ? [selected.spouseId] : [])];
  const visitedDescendants = new Set<number>();
  while (descendants.length && visitedDescendants.size < members.length) {
    const id = descendants.pop()!;
    if (visitedDescendants.has(id)) continue;
    visitedDescendants.add(id); add(id);
    const person = byId.get(id);
    if (person?.spouseId != null) { add(person.spouseId); descendants.push(person.spouseId); }
    for (const childId of childIdsByParent.get(id) ?? []) {
      add(childId); descendants.push(childId);
      const child = byId.get(childId);
      if (child?.spouseId != null) { add(child.spouseId); descendants.push(child.spouseId); }
    }
  }
  return included;
}

/** Highlight only connectors used by the resolved branch, including the correct child drop. */
export function getFamilyBranchEdgeIds(branchMemberIds: ReadonlySet<number>, links: FamilyViewLink[]): Set<string> {
  const result = new Set<string>();
  for (const link of links) {
    const source = link.sourceMemberIds ?? (link.kind === "family" || link.kind === "family-child" ? [] : link.memberIds);
    const target = link.targetMemberIds ?? link.memberIds;
    const sourceIncluded = source.length > 0 && source.every(id => branchMemberIds.has(id));
    const targetIncluded = link.kind === "family" || link.kind === "family-child"
      ? target.some(id => branchMemberIds.has(id))
      : target.length > 0 && target.every(id => branchMemberIds.has(id));
    if (sourceIncluded && targetIncluded) result.add(link.id);
  }
  return result;
}
