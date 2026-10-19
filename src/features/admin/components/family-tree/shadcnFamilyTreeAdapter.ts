import type { FamilyMember } from "./types";

/** Local graph model inspired by the upstream registry's flat parent/partner API. */
export interface ShadcnFamilyPerson {
  id: string;
  name: string;
  sex: "male" | "female" | "unknown";
  parentIds: string[];
  partnerIds: string[];
  generation: number;
  role?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  deathDate?: string | null;
  lifeStatus?: FamilyMember["lifeStatus"];
  source: FamilyMember;
}

export interface ShadcnFamilyUnion {
  id: string;
  partnerIds: string[];
  childIds: string[];
}

export interface ShadcnFamilyTreeModel {
  people: ShadcnFamilyPerson[];
  unions: ShadcnFamilyUnion[];
}

const pairId = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b).join("-");

/** Copy and normalize MyLife relationships into a stable, renderer-owned view model. */
export function adaptMembersToShadcnFamilyTree(members: FamilyMember[]): ShadcnFamilyTreeModel {
  const byId = new Map(members.map(member => [member.id, member]));
  const parentsByChild = new Map<number, Set<number>>();
  const partnersByPerson = new Map<number, Set<number>>();
  const addParent = (childId: number, parentId?: number | null) => {
    if (!byId.has(childId) || parentId == null || parentId === childId || !byId.has(parentId)) return;
    const ids = parentsByChild.get(childId) ?? new Set<number>();
    ids.add(parentId);
    parentsByChild.set(childId, ids);
  };
  const addPartner = (personId: number, partnerId?: number | null) => {
    if (partnerId == null || partnerId === personId || !byId.has(partnerId)) return;
    const ids = partnersByPerson.get(personId) ?? new Set<number>();
    ids.add(partnerId);
    partnersByPerson.set(personId, ids);
  };

  for (const member of members) {
    addParent(member.id, member.fatherId);
    addParent(member.id, member.motherId);
    addPartner(member.id, member.spouseId);
    for (const childId of member.childIds ?? []) addParent(childId, member.id);
  }
  for (const [personId, partnerIds] of partnersByPerson) {
    for (const partnerId of partnerIds) addPartner(partnerId, personId);
  }

  const people = members.map(source => {
    const gender = source.gender?.trim().toLocaleLowerCase();
    const sex = gender && (gender === "male" || gender.includes("nam")) ? "male"
      : gender && (gender === "female" || gender === "nu" || gender.includes("nữ")) ? "female" : "unknown";
    return {
      id: String(source.id),
      name: source.fullName,
      sex,
      parentIds: [...(parentsByChild.get(source.id) ?? [])].sort((a, b) => a - b).map(String),
      partnerIds: [...(partnersByPerson.get(source.id) ?? [])].sort((a, b) => a - b).map(String),
      generation: source.generation,
      role: source.role,
      avatarUrl: source.avatarUrl,
      dateOfBirth: source.dateOfBirth,
      deathDate: source.deathDate,
      lifeStatus: source.lifeStatus,
      source,
    } satisfies ShadcnFamilyPerson;
  });

  const childGroups = new Map<string, Set<number>>();
  for (const [childId, parentIds] of parentsByChild) {
    if (!parentIds.size) continue;
    const sorted = [...parentIds].sort((a, b) => a - b);
    const id = `union-${pairId(sorted)}`;
    const childIds = childGroups.get(id) ?? new Set<number>();
    childIds.add(childId);
    childGroups.set(id, childIds);
  }
  const unions = [...childGroups].map(([id, childIds]) => ({
    id,
    partnerIds: id.slice("union-".length).split("-").filter(Boolean),
    childIds: [...childIds].sort((a, b) => a - b).map(String),
  })).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return { people, unions };
}
