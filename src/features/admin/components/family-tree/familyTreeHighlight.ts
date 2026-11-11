import type { FamilyMember } from './types';
import type { FamilyViewLink, FamilyRenderSegment } from './family-view/familyTreeTypes';
import { getSiblingKind } from './siblingRelations';

export const parentChildEdgeId = (parentId: number, childId: number) => `parent:${parentId}:${childId}`;
export const spouseEdgeId = (first: number, second: number) => `spouse:${Math.min(first, second)}:${Math.max(first, second)}`;

export interface FamilyRelationshipGraph {
  memberIds: Set<number>;
  membersById: Map<number, FamilyMember>;
  parentsByChild: Map<number, Set<number>>;
  partnersByMember: Map<number, Set<number>>;
}

/** Only recorded links are evidence. A parent's spouse is never an inferred parent. */
export function buildFamilyRelationshipGraph(members: readonly FamilyMember[]): FamilyRelationshipGraph {
  const memberIds = new Set(members.map(member => member.id));
  const membersById = new Map(members.map(member => [member.id, member]));
  const parentsByChild = new Map<number, Set<number>>();
  const partnersByMember = new Map<number, Set<number>>();
  const add = (map: Map<number, Set<number>>, key: number, value: number) => {
    const values = map.get(key) ?? new Set<number>();
    values.add(value); map.set(key, values);
  };
  const parent = (parentId: number | undefined, childId: number) => {
    if (parentId == null || parentId === childId || !memberIds.has(parentId) || !memberIds.has(childId)) return;
    add(parentsByChild, childId, parentId);
  };
  for (const member of members) {
    parent(member.fatherId, member.id); parent(member.motherId, member.id);
    for (const childId of member.childIds ?? []) parent(member.id, childId);
    if (member.spouseId != null && member.spouseId !== member.id && memberIds.has(member.spouseId)) {
      add(partnersByMember, member.id, member.spouseId); add(partnersByMember, member.spouseId, member.id);
    }
  }
  return { memberIds, membersById, parentsByChild, partnersByMember };
}

// The current API has no parentage type. These describe recorded parent sets,
// never biological certainty, age ordering, or gender inferred from names.
export type RecordedSiblingKind = 'same-recorded-parents' | 'different-recorded-parents' | 'shared-parent-unknown';
export interface AncestralFamilyHighlight {
  selectedNodeId: number | null;
  highlightedNodeIds: Set<number>;
  highlightedSemanticEdgeIds: Set<string>;
  highlightedRenderSegmentIds: Set<string>;
  siblings: Map<number, RecordedSiblingKind>;
}

/** Selected member, all recorded ancestors, and verified shared-parent siblings only. */
export function getAncestralLineageHighlight(graph: FamilyRelationshipGraph, selectedMemberId: number | null, links: readonly FamilyViewLink[] = []): AncestralFamilyHighlight {
  const result: AncestralFamilyHighlight = { selectedNodeId: null, highlightedNodeIds: new Set(), highlightedSemanticEdgeIds: new Set(), highlightedRenderSegmentIds: new Set(), siblings: new Map() };
  if (selectedMemberId == null || !graph.memberIds.has(selectedMemberId)) return result;
  result.selectedNodeId = selectedMemberId;
  result.highlightedNodeIds.add(selectedMemberId);

  // Walk actual parent edges. A visited set makes incomplete/cyclic records safe.
  const visited = new Set<number>([selectedMemberId]);
  const pending = [selectedMemberId];
  while (pending.length) {
    const childId = pending.pop()!;
    for (const parentId of graph.parentsByChild.get(childId) ?? []) {
      result.highlightedSemanticEdgeIds.add(parentChildEdgeId(parentId, childId));
      result.highlightedNodeIds.add(parentId);
      if (!visited.has(parentId)) { visited.add(parentId); pending.push(parentId); }
    }
  }

  const selectedParents = graph.parentsByChild.get(selectedMemberId) ?? new Set<number>();
  const selectedMember = graph.membersById.get(selectedMemberId)!;
  // Parent records can be missing while both children retain the same known ID.
  const candidates = graph.membersById.keys();
  const selectedKnownParents = new Set([selectedMember.fatherId, selectedMember.motherId].filter((id): id is number => id != null));
  for (const siblingId of candidates) {
    if (siblingId === selectedMemberId) continue;
    const siblingMember = graph.membersById.get(siblingId);
    // Generic horizontal relationships do not verify parentage. Only known
    // shared father/mother IDs confirm a sibling for lineage focus.
    if (!siblingMember || getSiblingKind(selectedMember, siblingMember) !== 'biological') continue;
    const siblingParents = graph.parentsByChild.get(siblingId) ?? new Set<number>();
    const siblingKnownParents = new Set([siblingMember.fatherId, siblingMember.motherId].filter((id): id is number => id != null));
    const shared = [...selectedKnownParents].filter(id => siblingKnownParents.has(id));
    if (!shared.length) continue;
    const kind = selectedKnownParents.size === 2 && siblingKnownParents.size === 2
      ? shared.length === 2 ? 'same-recorded-parents' : 'different-recorded-parents'
      : 'shared-parent-unknown';
    result.siblings.set(siblingId, kind);
    result.highlightedNodeIds.add(siblingId);
    // Only parent-to-selected and parent-to-sibling paths are activated. The
    // connector segment mapper then excludes unrelated sibling branches.
    for (const parentId of shared) {
      if (siblingParents.has(parentId)) result.highlightedSemanticEdgeIds.add(parentChildEdgeId(parentId, siblingId));
      if (selectedParents.has(parentId)) result.highlightedSemanticEdgeIds.add(parentChildEdgeId(parentId, selectedMemberId));
    }
  }
  result.highlightedRenderSegmentIds = getHighlightedRenderSegmentIds(links, result.highlightedSemanticEdgeIds);
  return result;
}

export function getFamilyRenderSegments(link: FamilyViewLink): FamilyRenderSegment[] {
  if (link.segments) return link.segments;
  return [{ id: link.id, path: link.path, semanticEdgeIds: link.kind === 'spouse' && link.memberIds.length === 2
    ? [spouseEdgeId(link.memberIds[0], link.memberIds[1])] : [] }];
}

export function getHighlightedRenderSegmentIds(links: readonly FamilyViewLink[], semanticEdgeIds: ReadonlySet<string>): Set<string> {
  return new Set(links.flatMap(getFamilyRenderSegments)
    .filter(segment => segment.semanticEdgeIds.some(id => semanticEdgeIds.has(id))).map(segment => segment.id));
}

/** Explicit branch mode keeps its broader membership, with the same precise geometry. */
export function getBranchSemanticEdgeIds(graph: FamilyRelationshipGraph, memberIds: ReadonlySet<number>): Set<string> {
  const edges = new Set<string>();
  for (const [childId, parents] of graph.parentsByChild) for (const parentId of parents) {
    if (memberIds.has(parentId) && memberIds.has(childId)) edges.add(parentChildEdgeId(parentId, childId));
  }
  for (const [id, partners] of graph.partnersByMember) for (const partnerId of partners) {
    if (memberIds.has(id) && memberIds.has(partnerId)) edges.add(spouseEdgeId(id, partnerId));
  }
  return edges;
}
