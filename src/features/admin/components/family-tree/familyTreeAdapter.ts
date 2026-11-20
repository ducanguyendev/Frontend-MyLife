import type { FamilyMember } from "./types";

/** Engine-neutral view of a MyLife person. Relationship ids are copied verbatim from the API. */
export interface TreePerson {
  id: number;
  name: string;
  avatar?: string;
  fatherId?: number;
  motherId?: number;
  spouseId?: number;
  childIds: number[];
  generation: number;
  role?: string;
  gender?: string;
  dateOfBirth?: string;
  lifeStatus?: FamilyMember["lifeStatus"];
  deathDate?: string | null;
  horizontalRelations: NonNullable<FamilyMember["horizontalRelations"]>;
}

export interface FamilyTreeIndex {
  byId: Map<number, FamilyMember>;
  childrenByParent: Map<number, Set<number>>;
}

export function buildFamilyTreeIndex(members: FamilyMember[]): FamilyTreeIndex {
  const byId = new Map(members.map(member => [member.id, member]));
  const childrenByParent = new Map<number, Set<number>>();
  const link = (parentId: number | undefined, childId: number) => {
    if (parentId == null || parentId === childId || !byId.has(parentId) || !byId.has(childId)) return;
    const children = childrenByParent.get(parentId) ?? new Set<number>();
    children.add(childId);
    childrenByParent.set(parentId, children);
  };
  for (const member of members) {
    for (const childId of member.childIds ?? []) link(member.id, childId);
    for (const parentId of [member.fatherId, member.motherId]) link(parentId, member.id);
  }
  return { byId, childrenByParent };
}

export function adaptFamilyMembers(members: FamilyMember[]): TreePerson[] {
  const ids = new Set(members.map(member => member.id));
  return members.map(member => ({
    id: member.id,
    name: member.fullName,
    avatar: member.avatarUrl,
    fatherId: member.fatherId != null && member.fatherId !== member.id && ids.has(member.fatherId) ? member.fatherId : undefined,
    motherId: member.motherId != null && member.motherId !== member.id && ids.has(member.motherId) ? member.motherId : undefined,
    spouseId: member.spouseId != null && member.spouseId !== member.id && ids.has(member.spouseId) ? member.spouseId : undefined,
    childIds: [...new Set((member.childIds ?? []).filter(id => id !== member.id && ids.has(id)))],
    generation: member.generation,
    role: member.role,
    gender: member.gender,
    dateOfBirth: member.dateOfBirth,
    lifeStatus: member.lifeStatus,
    deathDate: member.deathDate,
    horizontalRelations: member.horizontalRelations ?? [],
  }));
}

/** Prefer a member in the latest generation, with a deterministic id tie-break. */
export function chooseInitialFocus(people: TreePerson[]): number | null {
  if (!people.length) return null;
  return [...people].sort((a, b) => b.generation - a.generation || a.id - b.id)[0].id;
}

/** Keep immediate family context around focus and reveal nearby descendants progressively by tree size. */
export function getVisibleFamilyMembers(
  members: FamilyMember[], focusedId: number | null, expandedIds: ReadonlySet<number>, showAll = false, index = buildFamilyTreeIndex(members),
): FamilyMember[] {
  if (showAll || focusedId == null) return members;
  const byId = index.byId;
  const focused = byId.get(focusedId) ?? byId.get(chooseInitialFocus(adaptFamilyMembers(members)) ?? -1);
  if (!focused) return members.slice(0, 1);
  const visible = new Set<number>();
  const add = (id?: number | null) => { if (id != null && byId.has(id)) visible.add(id); };
  add(focused.id);
  add(focused.fatherId);
  add(focused.motherId);
  add(focused.spouseId);
  const parentIds = new Set([focused.fatherId, focused.motherId].filter((id): id is number => id != null));
  for (const member of members) {
    if (member.childIds?.includes(focused.id)) parentIds.add(member.id);
  }
  for (const parentId of parentIds) add(parentId);
  const nearbyLimit = members.length > 30 ? 12 : Number.POSITIVE_INFINITY;
  const distanceFromFocus = (first: FamilyMember, second: FamilyMember) => Math.abs(first.id - second.id) || first.id - second.id;
  const peers = members.filter(member => member.id !== focused.id && [...parentIds].some(id => {
    const parent = byId.get(id);
    return member.fatherId === id || member.motherId === id || parent?.childIds?.includes(member.id);
  })).sort((a, b) => distanceFromFocus(a, focused) - distanceFromFocus(b, focused));
  for (const member of peers.slice(0, Math.max(0, nearbyLimit - 1))) add(member.id);
  const directChildren = [...(index.childrenByParent.get(focused.id) ?? [])]
    .sort((a, b) => Math.abs(a - focused.id) - Math.abs(b - focused.id) || a - b);
  for (const childId of directChildren.slice(0, nearbyLimit)) add(childId);
  for (const parentId of parentIds) {
    const parent = byId.get(parentId);
    add(parent?.fatherId);
    add(parent?.motherId);
  }
  // Show spouses for visible siblings as part of their family-unit context.
  for (const member of members) {
    const isSibling = parentIds.size > 0 && [...parentIds].some(id => member.fatherId === id || member.motherId === id || byId.get(id)?.childIds?.includes(member.id));
    if (isSibling && visible.has(member.id)) add(member.spouseId);
  }
  // Small trees may show the focused descendant branch; medium trees get one nearby descendant level.
  // Large trees remain compact and expose deeper relatives through the per-card expand controls.
  const automaticDepth = members.length <= 15 ? Number.POSITIVE_INFINITY : members.length <= 30 ? 2 : 0;
  const revealFrom = (rootId: number, depth: number, ancestry = new Set<number>([rootId])) => {
    if (depth <= 0) return;
    for (const childId of index.childrenByParent.get(rootId) ?? []) {
      if (ancestry.has(childId)) continue;
      add(childId);
      revealFrom(childId, depth - 1, new Set([...ancestry, childId]));
    }
  };
  revealFrom(focused.id, automaticDepth);
  if (focused.spouseId != null) revealFrom(focused.spouseId, automaticDepth);

  // Expanded cards reveal one more generation at a time, keeping rendering proportional to the open branch.
  for (const id of expandedIds) {
    if (!visible.has(id)) continue;
    for (const childId of index.childrenByParent.get(id) ?? []) add(childId);
  }
  return members.filter(member => visible.has(member.id));
}

export function getHiddenDescendantCount(member: FamilyMember, index: FamilyTreeIndex, visibleIds: ReadonlySet<number>): number {
  const pending = [...(index.childrenByParent.get(member.id) ?? [])];
  const visited = new Set<number>();
  while (pending.length) {
    const id = pending.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    pending.push(...(index.childrenByParent.get(id) ?? []));
  }
  return [...visited].filter(id => !visibleIds.has(id)).length;
}

/** Highlight the active member's actual household relations without lighting unrelated sibling branches. */
export function getRelatedFamilyMemberIds(
  members: FamilyMember[], activeId: number | null, showExtendedRelations = false,
): Set<number> {
  if (activeId == null) return new Set();
  const byId = new Map(members.map(member => [member.id, member]));
  const active = byId.get(activeId);
  if (!active) return new Set([activeId]);
  const related = new Set<number>([activeId]);
  const add = (id?: number | null) => { if (id != null && byId.has(id)) related.add(id); };
  const parents = [active.fatherId, active.motherId].filter((id): id is number => id != null);
  add(active.spouseId);
  for (const id of parents) add(id);
  for (const id of active.childIds ?? []) add(id);
  for (const member of members) {
    const isChild = member.fatherId === activeId || member.motherId === activeId || member.childIds?.includes(activeId);
    const isSpouse = member.spouseId === activeId;
    if (isChild || isSpouse) add(member.id);
  }
  if (showExtendedRelations) {
    for (const relation of active.horizontalRelations ?? []) add(Number(relation.memberId));
    for (const member of members) if (member.horizontalRelations?.some(relation => Number(relation.memberId) === activeId)) add(member.id);
  }
  return related;
}
