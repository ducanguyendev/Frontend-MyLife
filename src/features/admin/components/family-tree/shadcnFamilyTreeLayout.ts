import type { FamilyMember } from "./types";
import type { FamilyViewLayout, FamilyViewLink, FamilyViewNode } from "./family-view/familyTreeTypes";

export const SHADCN_TREE_CARD_WIDTH = 190;
export const SHADCN_TREE_CARD_HEIGHT = 90;
const PARTNER_GAP = 28;
const SIBLING_GAP = 40;
const FAMILY_GAP = 84;
const GENERATION_GAP = 72;
const PADDING = 72;

interface HouseholdUnit { ids: number[]; width: number }
interface RowGroup { key: string; parentIds: number[]; units: HouseholdUnit[]; width: number; anchorOffset: number; target: number }

export interface RowGroupPosition { key: string; width: number; target: number }
export interface FamilyConnectorGeometry {
  path: string;
  sourceX: number;
  sourceY: number;
  railLeft: number;
  railRight: number;
  railY: number;
  junctionX: number;
  childCenters: number[];
}

export interface ParentUnionSource {
  sourceX: number;
  sourceY: number;
  couple: boolean;
  singleParent: boolean;
}

/** Minimize squared movement from desired centers subject to ordered, non-overlapping groups. */
export function resolveRowGroupPositions(groups: RowGroupPosition[], gap: number): number[] {
  if (!groups.length) return [];
  const ordered = [...groups].sort((a, b) => a.target - b.target || a.key.localeCompare(b.key, undefined, { numeric: true }));
  const offsets: number[] = [];
  let occupied = 0;
  for (const group of ordered) {
    offsets.push(occupied);
    occupied += group.width + gap;
  }
  const pools: { start: number; end: number; sum: number; count: number }[] = [];
  ordered.forEach((group, index) => {
    pools.push({ start: index, end: index, sum: group.target - group.width / 2 - offsets[index], count: 1 });
    while (pools.length > 1) {
      const right = pools[pools.length - 1];
      const left = pools[pools.length - 2];
      if (left.sum / left.count <= right.sum / right.count) break;
      pools.splice(-2, 2, { start: left.start, end: right.end, sum: left.sum + right.sum, count: left.count + right.count });
    }
  });
  const starts = Array<number>(ordered.length);
  for (const pool of pools) {
    const base = pool.sum / pool.count;
    for (let index = pool.start; index <= pool.end; index++) starts[index] = base + offsets[index];
  }
  const byKey = new Map(ordered.map((group, index) => [group.key, starts[index]]));
  return groups.map(group => byKey.get(group.key)!);
}

/** Build a single connected orthogonal trunk and sibling rail for a parent union. */
export function buildFamilyConnectorGeometry(sourceX: number, sourceY: number, railY: number, centers: number[]): FamilyConnectorGeometry | null {
  const childCenters = [...centers].sort((a, b) => a - b);
  if (!childCenters.length) return null;
  const railLeft = childCenters[0];
  const railRight = childCenters[childCenters.length - 1];
  const junctionX = Math.max(railLeft, Math.min(railRight, sourceX));
  const points = [[sourceX, sourceY], [sourceX, railY], [railLeft, railY], [railRight, railY]]
    .filter((point, index, all) => index === 0 || Math.abs(point[0] - all[index - 1][0]) > .01 || Math.abs(point[1] - all[index - 1][1]) > .01);
  const path = points.map(([x, y], index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ");
  return { path, sourceX, sourceY, railLeft, railRight, railY, junctionX, childCenters };
}

const pairKey = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b).join(":") || "root";
const householdKey = (first: number, second: number) => [first, second].sort((a, b) => a - b).join(":");

/** Anchor a known couple at its midpoint; otherwise use one deterministic parent's center. */
export function getUnionAnchorX(parents: Array<{ id: number; x: number; width: number }>, coupleKeys: Set<string>): number | null {
  if (!parents.length) return null;
  for (let first = 0; first < parents.length; first++) {
    for (let second = first + 1; second < parents.length; second++) {
      if (coupleKeys.has(householdKey(parents[first].id, parents[second].id))) {
        return (parents[first].x + parents[first].width / 2 + parents[second].x + parents[second].width / 2) / 2;
      }
    }
  }
  const parent = [...parents].sort((a, b) => a.id - b.id)[0];
  return parent.x + parent.width / 2;
}

/** Match a couple's spouse connector midpoint; only a true single parent starts at card bottom. */
export function getParentUnionSource(parents: Array<{ id: number; x: number; y: number; width: number; height: number }>, coupleKeys: Set<string>): ParentUnionSource | null {
  if (!parents.length) return null;
  for (let first = 0; first < parents.length; first++) {
    for (let second = first + 1; second < parents.length; second++) {
      const left = parents[first]; const right = parents[second];
      if (!coupleKeys.has(householdKey(left.id, right.id))) continue;
      const leftNode = left.x <= right.x ? left : right;
      const rightNode = left.x <= right.x ? right : left;
      return {
        sourceX: ((leftNode.x + leftNode.width) + rightNode.x) / 2,
        sourceY: leftNode.y + leftNode.height / 2,
        couple: true,
        singleParent: false,
      };
    }
  }
  if (parents.length > 1) {
    const first = [...parents].sort((a, b) => a.x - b.x)[0];
    const last = [...parents].sort((a, b) => a.x - b.x).at(-1)!;
    return { sourceX: (first.x + first.width / 2 + last.x + last.width / 2) / 2, sourceY: first.y + first.height / 2, couple: false, singleParent: false };
  }
  const parent = parents[0];
  return { sourceX: parent.x + parent.width / 2, sourceY: parent.y + parent.height, couple: false, singleParent: true };
}

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
  // Treat a one-sided spouseId as an undirected couple reference.
  for (const member of members) {
    const spouse = members.find(candidate => candidate.spouseId === member.id);
    if (spouse) spousePairs.set(householdKey(member.id, spouse.id), [member.id, spouse.id].sort((a, b) => a - b));
  }
  const coupleKeys = new Set(spousePairs.keys());

  // Complete a single known parent into that parent's visible couple unless the
  // child explicitly names a different second parent.
  for (const child of members) {
    const parents = parentsByChild.get(child.id);
    if (parents?.size !== 1) continue;
    const parentId = [...parents][0];
    const parent = byId.get(parentId);
    const spouseId = parent?.spouseId != null && visibleIds.has(parent.spouseId)
      ? parent.spouseId
      : members.find(candidate => candidate.spouseId === parentId)?.id;
    if (spouseId == null || spouseId === child.id || !visibleIds.has(spouseId)) continue;
    const childExplicitParents = [child.fatherId, child.motherId].filter((id): id is number => id != null && visibleIds.has(id));
    if (childExplicitParents.some(id => id !== parentId && id !== spouseId)) continue;
    parents.add(spouseId);
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
        const spouseId = person.spouseId != null && rowIds.has(person.spouseId)
          ? person.spouseId
          : row.find(candidate => candidate.spouseId === person.id && !consumed.has(candidate.id))?.id;
        const spouse = spouseId == null || !rowIds.has(spouseId) || consumed.has(spouseId) ? undefined : byId.get(spouseId);
        const ids = spouse ? [person.id, spouse.id].sort((a, b) => a - b) : [person.id];
        ids.forEach(id => consumed.add(id));
        const width = ids.length * SHADCN_TREE_CARD_WIDTH + Math.max(0, ids.length - 1) * PARTNER_GAP;
        units.push({ ids, width });
      }
      return units;
    };
    for (const [key, group] of known) {
      const units = makeUnits(group.children);
      if (!units.length) continue;
      const width = units.reduce((sum, unit) => sum + unit.width, 0) + Math.max(0, units.length - 1) * SIBLING_GAP;
      let unitOffset = 0;
      const childAnchorOffsets: number[] = [];
      for (const unit of units) {
        for (const child of group.children) {
          const cardIndex = unit.ids.indexOf(child.id);
          if (cardIndex >= 0) childAnchorOffsets.push(unitOffset + cardIndex * (SHADCN_TREE_CARD_WIDTH + PARTNER_GAP) + SHADCN_TREE_CARD_WIDTH / 2);
        }
        unitOffset += unit.width + SIBLING_GAP;
      }
      const positionedParents = group.parentIds.flatMap(id => {
        const position = positions.get(id);
        return position ? [{ id, x: position.x, width: SHADCN_TREE_CARD_WIDTH }] : [];
      });
      const target = getUnionAnchorX(positionedParents, coupleKeys)
        ?? (rowGroups.length * (width + FAMILY_GAP));
      const childGroupCenter = childAnchorOffsets.length
        ? (Math.min(...childAnchorOffsets) + Math.max(...childAnchorOffsets)) / 2
        : width / 2;
      rowGroups.push({ key, parentIds: group.parentIds, units, width, anchorOffset: childGroupCenter, target });
    }
    if (roots.length) {
      const units = makeUnits(roots);
      const width = units.reduce((sum, unit) => sum + unit.width, 0) + Math.max(0, units.length - 1) * FAMILY_GAP;
      rowGroups.push({ key: "root", parentIds: [], units, width, anchorOffset: width / 2, target: 0 });
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

    const starts = resolveRowGroupPositions(rowGroups.map(group => ({
      key: group.key,
      width: group.width,
      target: group.target + group.width / 2 - group.anchorOffset,
    })), FAMILY_GAP);
    for (const [groupIndex, group] of rowGroups.entries()) {
      const startX = starts[groupIndex];
      let unitX = startX;
      for (const [index, unit] of group.units.entries()) {
        placeUnit(unit, unitX, y);
        unitX += unit.width + (index < group.units.length - 1 ? SIBLING_GAP : 0);
      }
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
    const sourceX = getUnionAnchorX(parents.map(node => ({ id: node.member.id, x: node.x, width: node.width })), coupleKeys);
    if (sourceX == null) continue;
    const source = getParentUnionSource(parents.map(node => ({ id: node.member.id, x: node.x, y: node.y, width: node.width, height: node.height })), coupleKeys);
    if (!source) continue;
    const connectorSourceX = source.sourceX;
    const connectorSourceY = source.sourceY;
    const childCenters = children.map(node => node.x + node.width / 2).sort((a, b) => a - b);
    const parentBottom = Math.max(...parents.map(node => node.y + node.height));
    const childTop = Math.min(...children.map(node => node.y));
    const railY = parentBottom + (childTop - parentBottom) * .5;
    if (children.length === 1) {
      const child = children[0]; const childX = child.x + child.width / 2;
      const path = !source.singleParent
        ? `M ${connectorSourceX} ${connectorSourceY} L ${connectorSourceX} ${railY} L ${childX} ${railY} L ${childX} ${child.y}`
        : Math.abs(connectorSourceX - childX) < .5 ? `M ${connectorSourceX} ${connectorSourceY} L ${childX} ${child.y}` : `M ${connectorSourceX} ${connectorSourceY} L ${connectorSourceX} ${railY} L ${childX} ${railY} L ${childX} ${child.y}`;
      links.push({ id: `family-${key}`, path, kind: "family", memberIds: [...group.parentIds, child.member.id] });
      continue;
    }
    const connector = buildFamilyConnectorGeometry(connectorSourceX, connectorSourceY, railY, childCenters);
    if (!connector) continue;
    links.push({ id: `family-${key}`, path: connector.path, kind: "family", memberIds: [...group.parentIds, ...children.map(child => child.member.id)] });
    children.forEach(child => {
      const childX = child.x + child.width / 2;
      links.push({ id: `family-child-${key}-${child.member.id}`, path: `M ${childX} ${railY} L ${childX} ${child.y}`, kind: "family-child", memberIds: [...group.parentIds, ...children.map(member => member.member.id)] });
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
