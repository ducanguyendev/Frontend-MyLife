import type { FamilyMember } from "../types";
import type { FamilyViewLayout, FamilyViewLink, FamilyViewNode } from "./familyTreeTypes";

export const FAMILY_CARD_WIDTH = 196;
export const FAMILY_CARD_HEIGHT = 94;
const PARTNER_GAP = 20;
const SIBLING_UNIT_GAP = 34;
const FAMILY_BRANCH_GAP = 20;
const ROOT_UNIT_GAP = 34;
const GENERATION_GAP = 88;
const CANVAS_PADDING = 72;

const pairKey = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b).join(":") || "root";

export interface FamilyUnit {
  key: string;
  members: FamilyMember[];
  memberIds: number[];
  width: number;
  generation: number;
  parentIds: number[];
  parentKey: string;
  centerX: number;
  children: FamilyUnit[];
}

const referencesAsSpouses = (member: FamilyMember, candidate: FamilyMember) =>
  member.spouseId === candidate.id || candidate.spouseId === member.id;

/** Build stable one-person or couple units. A spouse reference from either record is sufficient. */
export function buildFamilyUnits(members: FamilyMember[]): FamilyUnit[] {
  const byId = new Map(members.map(member => [member.id, member]));
  const remaining = new Set(byId.keys());
  const sorted = [...members].sort((a, b) => a.id - b.id);
  const units: FamilyUnit[] = [];

  for (const member of sorted) {
    if (!remaining.has(member.id)) continue;
    const candidate = (member.spouseId == null ? undefined : byId.get(member.spouseId))
      ?? sorted.find(person => person.spouseId === member.id && remaining.has(person.id));
    const spouse = candidate && remaining.has(candidate.id) && candidate.id !== member.id && referencesAsSpouses(member, candidate)
      ? candidate
      : undefined;
    const unitMembers = (spouse ? [member, spouse] : [member]).sort((a, b) => a.id - b.id);
    unitMembers.forEach(person => remaining.delete(person.id));
    const ids = unitMembers.map(person => person.id);
    units.push({
      key: pairKey(ids),
      members: unitMembers,
      memberIds: ids,
      width: unitMembers.length * FAMILY_CARD_WIDTH + Math.max(0, unitMembers.length - 1) * PARTNER_GAP,
      generation: Math.min(...unitMembers.map(person => person.generation)),
      parentIds: [],
      parentKey: "root",
      centerX: 0,
      children: [],
    });
  }

  const parentsByChild = new Map<number, Set<number>>();
  const addParent = (childId: number, parentId: number | undefined) => {
    if (parentId == null || parentId === childId || !byId.has(parentId)) return;
    const parentIds = parentsByChild.get(childId) ?? new Set<number>();
    parentIds.add(parentId);
    parentsByChild.set(childId, parentIds);
  };
  for (const member of members) {
    addParent(member.id, member.fatherId);
    addParent(member.id, member.motherId);
    for (const childId of member.childIds ?? []) addParent(childId, member.id);
  }
  for (const unit of units) {
    const candidates = unit.memberIds
      .map(id => ({ id, parents: [...(parentsByChild.get(id) ?? [])].sort((a, b) => a - b) }))
      .filter(candidate => candidate.parents.length)
      .sort((a, b) => b.parents.length - a.parents.length || a.id - b.id);
    unit.parentIds = candidates[0]?.parents ?? [];
    unit.parentKey = pairKey(unit.parentIds);
  }
  const unitByMemberId = new Map<number, FamilyUnit>();
  for (const unit of units) for (const id of unit.memberIds) unitByMemberId.set(id, unit);
  for (const unit of units) for (const parentId of unit.parentIds) {
    const parentUnit = unitByMemberId.get(parentId);
    if (parentUnit && parentUnit !== unit && !parentUnit.children.includes(unit)) parentUnit.children.push(unit);
  }
  return units;
}

/** Positions household units by their parent-family anchors and draws one shared sibling rail. */
export function layoutFamilyView(members: FamilyMember[], showExtendedRelations = false): FamilyViewLayout {
  if (!members.length) return { nodes: [], links: [], width: 0, height: 0 };
  const visibleIds = new Set(members.map(member => member.id));
  const parentsByChild = new Map<number, Set<number>>();
  const addParent = (childId: number, parentId: number | undefined) => {
    if (parentId == null || parentId === childId || !visibleIds.has(parentId)) return;
    const parentIds = parentsByChild.get(childId) ?? new Set<number>();
    parentIds.add(parentId);
    parentsByChild.set(childId, parentIds);
  };
  for (const member of members) {
    addParent(member.id, member.fatherId);
    addParent(member.id, member.motherId);
    for (const childId of member.childIds ?? []) if (visibleIds.has(childId)) addParent(childId, member.id);
  }

  const units = buildFamilyUnits(members);

  const generations = [...new Set(units.map(unit => unit.generation))].sort((a, b) => a - b);
  const generationIndex = new Map(generations.map((generation, index) => [generation, index]));
  const positions = new Map<number, { x: number; y: number }>();

  for (const generation of generations) {
    const rowUnits = units.filter(unit => unit.generation === generation);
    const groups = new Map<string, FamilyUnit[]>();
    for (const unit of rowUnits) {
      const group = groups.get(unit.parentKey) ?? [];
      group.push(unit);
      groups.set(unit.parentKey, group);
    }

    const resolveAnchor = (unit: FamilyUnit): number | null => {
      const anchors = unit.parentIds.map(id => positions.get(id)).filter((position): position is { x: number; y: number } => !!position);
      return anchors.length ? anchors.reduce((sum, position) => sum + position.x + FAMILY_CARD_WIDTH / 2, 0) / anchors.length : null;
    };
    const orderedGroups = [...groups.entries()].map(([key, familyUnits]) => {
      familyUnits.sort((a, b) => a.parentIds[0] - b.parentIds[0] || a.memberIds[0] - b.memberIds[0]);
      const anchorCandidates = familyUnits.map(resolveAnchor).filter((x): x is number => x != null);
      const anchor = anchorCandidates.length ? anchorCandidates.reduce((sum, x) => sum + x, 0) / anchorCandidates.length : null;
      const unitGap = key === "root" ? ROOT_UNIT_GAP : SIBLING_UNIT_GAP;
      return { key, familyUnits, anchor, unitGap, width: familyUnits.reduce((sum, unit) => sum + unit.width, 0) + Math.max(0, familyUnits.length - 1) * unitGap };
    }).sort((a, b) => (a.anchor ?? Number.POSITIVE_INFINITY) - (b.anchor ?? Number.POSITIVE_INFINITY) || a.key.localeCompare(b.key, undefined, { numeric: true }));

    let cursor = CANVAS_PADDING;
    const rank = generationIndex.get(generation) ?? 0;
    const y = CANVAS_PADDING + rank * (FAMILY_CARD_HEIGHT + GENERATION_GAP);
    for (const [groupIndex, group] of orderedGroups.entries()) {
      const gap = groupIndex === 0 ? 0 : FAMILY_BRANCH_GAP;
      const desiredLeft = group.anchor == null ? cursor : group.anchor - group.width / 2;
      const left = Math.max(cursor + gap, desiredLeft);
      let unitCursor = left;
      for (const [unitIndex, unit] of group.familyUnits.entries()) {
        unit.centerX = unitCursor + unit.width / 2;
        for (const [memberIndex, memberId] of unit.memberIds.entries()) {
          positions.set(memberId, { x: unitCursor + memberIndex * (FAMILY_CARD_WIDTH + PARTNER_GAP), y });
        }
        unitCursor += unit.width + (unitIndex < group.familyUnits.length - 1 ? group.unitGap : 0);
      }
      cursor = left + group.width;
    }
  }

  const minX = Math.min(...[...positions.values()].map(position => position.x));
  const maxX = Math.max(...[...positions.values()].map(position => position.x + FAMILY_CARD_WIDTH));
  const minY = Math.min(...[...positions.values()].map(position => position.y));
  const maxY = Math.max(...[...positions.values()].map(position => position.y + FAMILY_CARD_HEIGHT));
  const offsetX = CANVAS_PADDING - minX;
  const offsetY = CANVAS_PADDING - minY;
  for (const [id, position] of positions) positions.set(id, { x: position.x + offsetX, y: position.y + offsetY });
  for (const unit of units) unit.centerX += offsetX;

  const nodes: FamilyViewNode[] = members.map(member => ({
    member, ...positions.get(member.id)!, width: FAMILY_CARD_WIDTH, height: FAMILY_CARD_HEIGHT, generation: member.generation,
  }));
  const nodeById = new Map(nodes.map(node => [node.member.id, node]));
  const links: FamilyViewLink[] = [];

  // Spouse edges occupy only the gap between adjacent cards and carry one visible heart badge.
  for (const unit of units) {
    if (unit.memberIds.length !== 2) continue;
    const [firstId, secondId] = unit.memberIds;
    const first = nodeById.get(firstId); const second = nodeById.get(secondId);
    if (!first || !second || first.y !== second.y) continue;
    const x1 = first.x + first.width; const x2 = second.x;
    const y = first.y + first.height / 2;
    links.push({ id: `spouse-${unit.key}`, path: `M ${x1} ${y} L ${x2} ${y}`, kind: "spouse", memberIds: [firstId, secondId], labelX: (x1 + x2) / 2, labelY: y });
  }

  // Group each person's actual parents independently; this also supports couples whose records
  // contain one-sided spouseId links and reverse-only childIds relationships.
  const childGroups = new Map<string, { parentIds: number[]; children: FamilyMember[] }>();
  for (const child of members) {
    const parentIds = [...(parentsByChild.get(child.id) ?? [])].sort((a, b) => a - b);
    if (!parentIds.length) continue;
    const key = pairKey(parentIds);
    const group = childGroups.get(key) ?? { parentIds, children: [] };
    group.children.push(child);
    childGroups.set(key, group);
  }
  for (const [key, group] of childGroups) {
    const parents = group.parentIds.map(id => nodeById.get(id)).filter((node): node is FamilyViewNode => !!node);
    const children = group.children.map(child => nodeById.get(child.id)).filter((node): node is FamilyViewNode => !!node);
    if (!parents.length || !children.length) continue;
    const sourceX = parents.reduce((sum, parent) => sum + parent.x + parent.width / 2, 0) / parents.length;
    const sourceY = Math.max(...parents.map(parent => parent.y + parent.height));
    const childCenters = children.map(node => node.x + node.width / 2).sort((a, b) => a - b);
    const targetY = Math.min(...children.map(node => node.y));
    const railY = sourceY <= targetY ? sourceY + (targetY - sourceY) / 2 : targetY + (sourceY - targetY) / 2;
    const linkedIds = [...group.parentIds, ...children.map(node => node.member.id)];
    links.push({
      id: `family-${key}`,
      path: `M ${sourceX} ${sourceY} L ${sourceX} ${railY} M ${childCenters[0]} ${railY} L ${childCenters.at(-1)} ${railY}`,
      kind: "family",
      memberIds: linkedIds,
    });
    children.forEach(child => {
      const childCenter = child.x + child.width / 2;
      links.push({ id: `family-child-${key}-${child.member.id}`, path: `M ${childCenter} ${railY} L ${childCenter} ${child.y}`, kind: "family-child", memberIds: [child.member.id] });
    });
  }

  if (showExtendedRelations) {
    const relationPairs = new Map<string, { firstId: number; secondId: number }>();
    for (const member of members) for (const relation of member.horizontalRelations ?? []) {
      const otherId = Number(relation.memberId);
      if (!visibleIds.has(otherId) || otherId === member.id) continue;
      const key = pairKey([member.id, otherId]);
      if (units.some(unit => unit.memberIds.length === 2 && unit.key === key)) continue;
      relationPairs.set(key, { firstId: Math.min(member.id, otherId), secondId: Math.max(member.id, otherId) });
    }
    for (const [key, pair] of relationPairs) {
      const first = nodeById.get(pair.firstId); const second = nodeById.get(pair.secondId);
      if (!first || !second) continue;
      const sameRow = first.y === second.y;
      const x1 = sameRow ? (first.x < second.x ? first.x + first.width : first.x) : first.x + first.width / 2;
      const x2 = sameRow ? (first.x < second.x ? second.x : second.x + second.width) : second.x + second.width / 2;
      const y1 = sameRow ? first.y + first.height / 2 : first.y + first.height;
      const y2 = sameRow ? second.y + second.height / 2 : second.y;
      const middleY = (y1 + y2) / 2;
      links.push({ id: `extended-${key}`, path: `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${middleY - 18} ${x2} ${y2}`, kind: "extended", memberIds: [pair.firstId, pair.secondId] });
    }
  }

  return { nodes, links, width: maxX - minX + CANVAS_PADDING * 2, height: maxY - minY + CANVAS_PADDING * 2 };
}
