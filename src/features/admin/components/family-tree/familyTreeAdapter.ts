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

/** Keep immediate family context around focus; reveal deeper descendants only after expansion. */
export function getVisibleFamilyMembers(
  members: FamilyMember[], focusedId: number | null, expandedIds: ReadonlySet<number>, showAll = false, index = buildFamilyTreeIndex(members),
): FamilyMember[] {
  if (showAll || members.length <= 12 || focusedId == null) return members;
  const byId = index.byId;
  const focused = byId.get(focusedId) ?? byId.get(chooseInitialFocus(adaptFamilyMembers(members)) ?? -1);
  if (!focused) return members.slice(0, 1);
  const visible = new Set<number>();
  const add = (id?: number | null) => { if (id != null && byId.has(id)) visible.add(id); };
  add(focused.id);
  add(focused.fatherId);
  add(focused.motherId);
  add(focused.spouseId);
  const parentIds = [focused.fatherId, focused.motherId].filter((id): id is number => id != null);
  for (const member of members) {
    if (member.fatherId === focused.id || member.motherId === focused.id || member.childIds?.includes(focused.id)) add(member.id);
    else if (parentIds.some(id => member.fatherId === id || member.motherId === id)) add(member.id);
  }
  for (const id of focused.childIds ?? []) add(id);
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
