import type { FamilyMember } from "./types";
import type { FamilyViewLayout, FamilyViewLink, FamilyViewNode } from "./family-view/familyTreeTypes";

export const SHADCN_TREE_CARD_WIDTH = 232;
export const SHADCN_TREE_CARD_HEIGHT = 178;
const PARTNER_GAP = 18;
const SIBLING_GAP = 40;
const FAMILY_GAP = 84;
const GENERATION_GAP = 52;
const PADDING = 72;

interface HouseholdUnit { ids: number[]; anchorId: number; width: number; anchorOffset: number }
interface RowGroup { key: string; parentIds: number[]; units: HouseholdUnit[]; width: number; anchorOffset: number; target: number }

const pairKey = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b).join(":") || "root";
const householdKey = (first: number, second: number) => [first, second].sort((a, b) => a - b).join(":");

/** Places explicit generation lanes and family clusters, centring sibling anchors over their parent unit. */
export function layoutShadcnFamilyTree(members: FamilyMember[], showExtendedRelations = false): FamilyViewLayout {
  if (!members.length) return { nodes: [], links: [], width: 0, height: 0 };
  const byId = new Map(members.map(member => [member.id, member]));
  const visibleIds = new Set(byId.keys());
  const parentsByChild = new Map<number, Set<number>>();
  const addParent = (childId: number, parentId?: number | null) => {
    if (parentId == null || parentId === childId || !visibleIds.has(parentId)) return;
    const parents = parentsByChild.get(childId) ?? new Set<number>();
    parents.add(parentId); parentsByChild.set(childId, parents);
  };
  for (const member of members) {
    addParent(member.id, member.fatherId); addParent(member.id, member.motherId);
    for (const childId of member.childIds ?? []) addParent(childId, member.id);
  }

  const spousePairs = new Map<string, number[]>();
  for (const member of members) {
    const spouseId = member.spouseId;
    if (spouseId == null || spouseId === member.id || !visibleIds.has(spouseId)) continue;
    spousePairs.set(householdKey(member.id, spouseId), [member.id, spouseId].sort((a, b) => a - b));
  }

  const generations = [...new Set(members.map(member => member.generation))].sort((a, b) => a - b);
  const minGeneration = generations[0];
  const positions = new Map<number, { x: number; y: number }>();
  const placeUnit = (unit: HouseholdUnit, startX: number, y: number) => {
    unit.ids.forEach((id, index) => positions.set(id, { x: startX + index * (SHADCN_TREE_CARD_WIDTH + PARTNER_GAP), y }));
  };

  for (const generation of generations) {
    const row = members.filter(member => member.generation === generation).sort((a, b) => a.id - b.id);
    const rowIds = new Set(row.map(member => member.id));
    const parentGroups = new Map<string, { parentIds: number[]; children: FamilyMember[] }>();
    for (const child of row) {
      const parentIds = [...(parentsByChild.get(child.id) ?? [])].filter(id => rowIds.has(id) || positions.has(id));
      const key = pairKey(parentIds);
      const group = parentGroups.get(key) ?? { parentIds, children: [] };
      group.children.push(child); parentGroups.set(key, group);
    }

    const consumed = new Set<number>();
    const rowGroups: RowGroup[] = [];
    const known = [...parentGroups].filter(([key]) => key !== "root").sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    const roots = [...(parentGroups.get("root")?.children ?? [])];
    const makeUnits = (people: FamilyMember[]): HouseholdUnit[] => {
      const units: HouseholdUnit[] = [];
      for (const person of [...people].sort((a, b) => a.id - b.id)) {
        if (consumed.has(person.id)) continue;
        const spouseId = person.spouseId;
        const spouse = spouseId == null || !rowIds.has(spouseId) || consumed.has(spouseId) ? undefined : byId.get(spouseId);
        const ids = spouse ? [person.id, spouse.id].sort((a, b) => a - b) : [person.id];
        ids.forEach(id => consumed.add(id));
        const width = ids.length * SHADCN_TREE_CARD_WIDTH + Math.max(0, ids.length - 1) * PARTNER_GAP;
        units.push({ ids, anchorId: person.id, width, anchorOffset: ids.indexOf(person.id) * (SHADCN_TREE_CARD_WIDTH + PARTNER_GAP) + SHADCN_TREE_CARD_WIDTH / 2 });
      }
      return units;
    };
    for (const [key, group] of known) {
      const units = makeUnits(group.children);
      if (!units.length) continue;
      const width = units.reduce((sum, unit) => sum + unit.width, 0) + Math.max(0, units.length - 1) * SIBLING_GAP;
      let offset = 0; const anchors: number[] = [];
      for (const unit of units) { anchors.push(offset + unit.anchorOffset); offset += unit.width + SIBLING_GAP; }
      const positionedParents = group.parentIds.map(id => positions.get(id)).filter((position): position is { x: number; y: number } => Boolean(position));
      const target = positionedParents.length
        ? positionedParents.reduce((sum, position) => sum + position.x + SHADCN_TREE_CARD_WIDTH / 2, 0) / positionedParents.length
        : rowGroups.length * (width + FAMILY_GAP);
      rowGroups.push({ key, parentIds: group.parentIds, units, width, anchorOffset: anchors.reduce((sum, anchor) => sum + anchor, 0) / anchors.length, target });
    }
    if (roots.length) {
      const units = makeUnits(roots);
      const width = units.reduce((sum, unit) => sum + unit.width, 0) + Math.max(0, units.length - 1) * FAMILY_GAP;
      let offset = 0; const anchors: number[] = [];
      for (const unit of units) { anchors.push(offset + unit.anchorOffset); offset += unit.width + FAMILY_GAP; }
      rowGroups.push({ key: "root", parentIds: [], units, width, anchorOffset: anchors.reduce((sum, anchor) => sum + anchor, 0) / Math.max(1, anchors.length), target: 0 });
    }
    rowGroups.sort((a, b) => a.target - b.target || a.key.localeCompare(b.key, undefined, { numeric: true }));

    const y = PADDING + (generation - minGeneration) * (SHADCN_TREE_CARD_HEIGHT + GENERATION_GAP);
    if (generation === minGeneration || rowGroups.every(group => group.key === "root")) {
      const totalWidth = rowGroups.reduce((sum, group, index) => sum + group.width + (index ? FAMILY_GAP : 0), 0);
      let cursor = -totalWidth / 2;
      for (const group of rowGroups) {
        let unitX = cursor;
        for (const [index, unit] of group.units.entries()) { placeUnit(unit, unitX, y); unitX += unit.width + (index < group.units.length - 1 ? FAMILY_GAP : 0); }
        cursor += group.width + FAMILY_GAP;
      }
      continue;
    }

    let previousRight = Number.NEGATIVE_INFINITY;
    for (const group of rowGroups) {
      let startX = group.target - group.anchorOffset;
      if (startX < previousRight + FAMILY_GAP) startX = previousRight + FAMILY_GAP;
      let unitX = startX;
      for (const [index, unit] of group.units.entries()) {
        placeUnit(unit, unitX, y);
        unitX += unit.width + (index < group.units.length - 1 ? SIBLING_GAP : 0);
      }
      previousRight = startX + group.width;
    }
  }

  const minX = Math.min(...[...positions.values()].map(position => position.x));
  const maxX = Math.max(...[...positions.values()].map(position => position.x + SHADCN_TREE_CARD_WIDTH));
  for (const position of positions.values()) position.x += PADDING - minX;
  const nodes: FamilyViewNode[] = members.map(member => ({ member, ...positions.get(member.id)!, width: SHADCN_TREE_CARD_WIDTH, height: SHADCN_TREE_CARD_HEIGHT, generation: member.generation }));
  const byNodeId = new Map(nodes.map(node => [node.member.id, node]));
  const links: FamilyViewLink[] = [];

  for (const [key, ids] of spousePairs) {
    const [firstId, secondId] = ids.map(id => byNodeId.get(id));
    if (!firstId || !secondId || firstId.y !== secondId.y) continue;
    const x1 = firstId.x + firstId.width + 3; const x2 = secondId.x - 3; const y = firstId.y + firstId.height / 2;
    links.push({ id: `spouse-${key}`, path: `M ${x1} ${y} L ${x2} ${y}`, kind: "spouse", memberIds: ids, labelX: (x1 + x2) / 2, labelY: y });
  }

  const childrenByUnion = new Map<string, { parentIds: number[]; children: FamilyMember[] }>();
  for (const child of members) {
    const parentIds = [...(parentsByChild.get(child.id) ?? [])].sort((a, b) => a - b);
    if (!parentIds.length) continue;
    const key = `${pairKey(parentIds)}:${child.generation}`;
    const group = childrenByUnion.get(key) ?? { parentIds, children: [] };
    group.children.push(child); childrenByUnion.set(key, group);
  }
  for (const [key, group] of childrenByUnion) {
    const parents = group.parentIds.map(id => byNodeId.get(id)).filter((node): node is FamilyViewNode => Boolean(node));
    const children = group.children.map(child => byNodeId.get(child.id)).filter((node): node is FamilyViewNode => Boolean(node));
    if (!parents.length || !children.length) continue;
    const sourceX = parents.reduce((sum, node) => sum + node.x + node.width / 2, 0) / parents.length;
    const sourceY = Math.max(...parents.map(node => node.y + node.height));
    const childCenters = children.map(node => node.x + node.width / 2).sort((a, b) => a - b);
    const railY = children[0].y - 30;
    if (children.length === 1) {
      const child = children[0]; const childX = child.x + child.width / 2;
      const path = Math.abs(sourceX - childX) < .5 ? `M ${sourceX} ${sourceY} L ${childX} ${child.y}` : `M ${sourceX} ${sourceY} L ${sourceX} ${railY} L ${childX} ${railY} L ${childX} ${child.y}`;
      links.push({ id: `family-${key}`, path, kind: "family", memberIds: [...group.parentIds, child.member.id] });
      continue;
    }
    links.push({ id: `family-${key}`, path: `M ${sourceX} ${sourceY} L ${sourceX} ${railY} M ${childCenters[0]} ${railY} L ${childCenters.at(-1)} ${railY}`, kind: "family", memberIds: group.parentIds });
    children.forEach(child => {
      const childX = child.x + child.width / 2;
      links.push({ id: `family-child-${key}-${child.member.id}`, path: `M ${childX} ${railY} L ${childX} ${child.y}`, kind: "family-child", memberIds: [child.member.id] });
    });
  }

  if (showExtendedRelations) {
    const relationPairs = new Map<string, [number, number]>();
    for (const member of members) for (const relation of member.horizontalRelations ?? []) {
      const otherId = Number(relation.memberId);
      if (!visibleIds.has(otherId) || otherId === member.id) continue;
      const ids = [member.id, otherId].sort((a, b) => a - b) as [number, number];
      relationPairs.set(householdKey(...ids), ids);
    }
    for (const [key, ids] of relationPairs) {
      if (spousePairs.has(key)) continue;
      const first = byNodeId.get(ids[0]); const second = byNodeId.get(ids[1]);
      if (!first || !second) continue;
      const x1 = first.x + first.width / 2; const x2 = second.x + second.width / 2;
      const y1 = first.y + first.height / 2; const y2 = second.y + second.height / 2;
      links.push({ id: `extended-${key}`, path: `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 24} ${x2} ${y2}`, kind: "extended", memberIds: ids });
    }
  }

  const minY = Math.min(...[...positions.values()].map(position => position.y));
  const maxY = Math.max(...nodes.map(node => node.y + node.height));
  return { nodes, links, width: maxX - minX + PADDING * 2, height: maxY - minY + PADDING * 2 };
}
