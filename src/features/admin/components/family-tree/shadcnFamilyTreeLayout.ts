import type { FamilyMember } from "./types";
import type { FamilyViewLayout, FamilyViewLink, FamilyViewNode } from "./family-view/familyTreeTypes";

export const SHADCN_TREE_CARD_WIDTH = 190;
export const SHADCN_TREE_CARD_HEIGHT = 90;
const PARTNER_GAP = 28;
const SIBLING_GAP = 40;
const FAMILY_GAP = 84;
const GENERATION_GAP = 72;
const PADDING = 72;

const siblingUnitGap = (left: HouseholdUnit, right: HouseholdUnit) =>
  left.children.length > 0 && right.children.length > 0 ? FAMILY_GAP : SIBLING_GAP;
const measureHouseholdGroup = (households: HouseholdUnit[], widthOf: (household: HouseholdUnit) => number) =>
  households.reduce((width, household, index) => width + widthOf(household) + (index ? siblingUnitGap(households[index - 1], household) : 0), 0);

interface HouseholdUnit {
  key: string;
  ids: number[];
  width: number;
  subtreeWidth: number;
  generation: number;
  parentIds: number[];
  children: HouseholdUnit[];
}
interface ChildHouseholdGroup { key: string; parentIds: number[]; households: HouseholdUnit[] }

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

export interface RowGroupPosition { key: string; width: number; target: number }

/** Collision fallback helper retained for experiments; recursive subtree layout does not use it. */
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

/** Return the couple midpoint when known, otherwise anchor deterministically to the lowest member id. */
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

export interface ParentUnionSource {
  sourceX: number;
  sourceY: number;
  couple: boolean;
  singleParent: boolean;
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

  // Build each spouse pair once, then attach its descendants to the household as a whole.
  const remaining = new Set(visibleIds);
  const units: HouseholdUnit[] = [];
  for (const member of [...members].sort((a, b) => a.id - b.id)) {
    if (!remaining.has(member.id)) continue;
    const spouseId = member.spouseId != null && visibleIds.has(member.spouseId)
      ? member.spouseId
      : members.find(candidate => candidate.spouseId === member.id && remaining.has(candidate.id))?.id;
    const spouse = spouseId != null && spouseId !== member.id && remaining.has(spouseId) ? byId.get(spouseId) : undefined;
    const unitMembers = (spouse ? [member, spouse] : [member]).sort((a, b) => a.id - b.id);
    const ids = unitMembers.map(person => person.id);
    ids.forEach(id => remaining.delete(id));
    const parentCandidates = unitMembers.map(person => [...(parentsByChild.get(person.id) ?? [])].sort((a, b) => a - b));
    const parentIds = parentCandidates.sort((a, b) => b.length - a.length || pairKey(a).localeCompare(pairKey(b), undefined, { numeric: true }))[0] ?? [];
    const width = ids.length * SHADCN_TREE_CARD_WIDTH + Math.max(0, ids.length - 1) * PARTNER_GAP;
    units.push({ key: pairKey(ids), ids, width, subtreeWidth: width, generation: Math.min(...unitMembers.map(person => person.generation)), parentIds, children: [] });
  }

  const unitByMemberId = new Map<number, HouseholdUnit>();
  for (const unit of units) for (const id of unit.ids) unitByMemberId.set(id, unit);
  const childrenByParentUnit = new Map<string, ChildHouseholdGroup[]>();
  const roots = new Set(units);
  for (const unit of units) {
    const parentUnits = [...new Set(unit.parentIds.map(id => unitByMemberId.get(id)).filter((parent): parent is HouseholdUnit => Boolean(parent)))];
    const eligibleParents = parentUnits.filter(parent => parent.generation < unit.generation).sort((a, b) => a.generation - b.generation || a.ids[0] - b.ids[0]);
    if (!eligibleParents.length) continue;
    // A normal couple resolves to one household. For incomplete or blended parent records,
    // anchor once to the deterministic earliest parent household and keep all parent edges.
    const owner = eligibleParents[0];
    const parentKey = pairKey(unit.parentIds);
    const groups = childrenByParentUnit.get(owner.key) ?? [];
    let group = groups.find(candidate => candidate.key === parentKey);
    if (!group) {
      group = { key: parentKey, parentIds: unit.parentIds, households: [] };
      groups.push(group);
      childrenByParentUnit.set(owner.key, groups);
    }
    group.households.push(unit);
    owner.children.push(unit);
    roots.delete(unit);
  }
  units.forEach(unit => { unit.subtreeWidth = unit.width; });
  // Recompute widths from the leaves upward after the hierarchy is complete.
  const measureCache = new Map<string, number>();
  const computeSubtreeWidth = (unit: HouseholdUnit, ancestry = new Set<string>()): number => {
    if (measureCache.has(unit.key)) return measureCache.get(unit.key)!;
    if (ancestry.has(unit.key)) return unit.width;
    const nextAncestry = new Set(ancestry).add(unit.key);
    const groups = [...(childrenByParentUnit.get(unit.key) ?? [])].sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
    const descendantsWidth = groups.reduce((sum, group, groupIndex) => {
      const groupWidth = measureHouseholdGroup(group.households, child => computeSubtreeWidth(child, nextAncestry));
      return sum + groupWidth + (groupIndex ? FAMILY_GAP : 0);
    }, 0);
    const width = Math.max(unit.width, descendantsWidth);
    unit.subtreeWidth = width;
    measureCache.set(unit.key, width);
    return width;
  };
  const orderedRoots = [...roots].sort((a, b) => a.generation - b.generation || a.ids[0] - b.ids[0]);
  orderedRoots.forEach(root => computeSubtreeWidth(root));
  // Orphaned cycles or malformed parent references stay visible as deterministic root households.
  for (const unit of units) if (!measureCache.has(unit.key)) computeSubtreeWidth(unit);

  const placeUnit = (unit: HouseholdUnit, left: number, allottedWidth: number, ancestry = new Set<string>()) => {
    if (ancestry.has(unit.key)) return;
    const nextAncestry = new Set(ancestry).add(unit.key);
    const unitLeft = left + (allottedWidth - unit.width) / 2;
    const y = PADDING + (unit.generation - minGeneration) * (SHADCN_TREE_CARD_HEIGHT + GENERATION_GAP);
    unit.ids.forEach((id, index) => positions.set(id, { x: unitLeft + index * (SHADCN_TREE_CARD_WIDTH + PARTNER_GAP), y }));

    const groups = [...(childrenByParentUnit.get(unit.key) ?? [])].sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
    const groupWidths = groups.map(group => measureHouseholdGroup(group.households, child => child.subtreeWidth));
    const childWidth = groupWidths.reduce((sum, width) => sum + width, 0) + Math.max(0, groups.length - 1) * FAMILY_GAP;
    let groupLeft = unitLeft + (unit.width - childWidth) / 2;
    groups.forEach((group, groupIndex) => {
      let childLeft = groupLeft;
      for (const [childIndex, child] of group.households.entries()) {
        placeUnit(child, childLeft, child.subtreeWidth, nextAncestry);
        childLeft += child.subtreeWidth + (childIndex < group.households.length - 1 ? siblingUnitGap(child, group.households[childIndex + 1]) : 0);
      }
      groupLeft += groupWidths[groupIndex] + FAMILY_GAP;
    });
  };

  const forestWidth = orderedRoots.reduce((sum, root, index) => sum + root.subtreeWidth + (index ? FAMILY_GAP : 0), 0);
  let rootLeft = -forestWidth / 2;
  for (const root of orderedRoots) {
    placeUnit(root, rootLeft, root.subtreeWidth);
    rootLeft += root.subtreeWidth + FAMILY_GAP;
  }
  for (const unit of units) {
    if (positions.has(unit.ids[0])) continue;
    placeUnit(unit, rootLeft, unit.subtreeWidth);
    rootLeft += unit.subtreeWidth + FAMILY_GAP;
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

  const childrenByUnion = new Map<string, { parentIds: number[]; households: HouseholdUnit[] }>();
  for (const unit of units) {
    for (const childId of unit.ids) {
      const parentIds = [...(parentsByChild.get(childId) ?? [])].sort((a, b) => a - b);
      if (!parentIds.length) continue;
      const key = `${pairKey(parentIds)}:${unit.generation}`;
      const group = childrenByUnion.get(key) ?? { parentIds, households: [] };
      if (!group.households.some(household => household.key === unit.key)) group.households.push(unit);
      childrenByUnion.set(key, group);
    }
  }
  for (const [key, group] of childrenByUnion) {
    group.households.sort((a, b) => {
      const aX = a.ids.reduce((sum, id) => sum + (byNodeId.get(id)?.x ?? 0) + SHADCN_TREE_CARD_WIDTH / 2, 0) / a.ids.length;
      const bX = b.ids.reduce((sum, id) => sum + (byNodeId.get(id)?.x ?? 0) + SHADCN_TREE_CARD_WIDTH / 2, 0) / b.ids.length;
      return aX - bX || a.ids[0] - b.ids[0];
    });
    const parents = group.parentIds.map(id => byNodeId.get(id)).filter((node): node is FamilyViewNode => Boolean(node));
    const childHouseholds = group.households.map(household => household.ids.map(id => byNodeId.get(id)).filter((node): node is FamilyViewNode => Boolean(node))).filter(household => household.length);
    const children = childHouseholds.flat();
    if (!parents.length || !childHouseholds.length) continue;
    const source = getParentUnionSource(parents.map(node => ({ id: node.member.id, x: node.x, y: node.y, width: node.width, height: node.height })), coupleKeys);
    if (!source) continue;
    const connectorSourceX = source.sourceX;
    const connectorSourceY = source.sourceY;
    const childCenters = childHouseholds.map(household => (Math.min(...household.map(node => node.x)) + Math.max(...household.map(node => node.x + node.width)))/2);
    const parentBottom = Math.max(...parents.map(node => node.y + node.height));
    const childTop = Math.min(...children.map(node => node.y));
    const railY = parentBottom + (childTop - parentBottom) * .5;
    const familyMemberIds = [...group.parentIds, ...group.households.flatMap(household => household.ids)];
    if (childHouseholds.length === 1) {
      const childHousehold = childHouseholds[0]; const childX = childCenters[0]; const childY = Math.min(...childHousehold.map(node => node.y));
      const path = !source.singleParent
        ? `M ${connectorSourceX} ${connectorSourceY} L ${connectorSourceX} ${railY} L ${childX} ${railY} L ${childX} ${childY}`
        : Math.abs(connectorSourceX - childX) < .5 ? `M ${connectorSourceX} ${connectorSourceY} L ${childX} ${childY}` : `M ${connectorSourceX} ${connectorSourceY} L ${connectorSourceX} ${railY} L ${childX} ${railY} L ${childX} ${childY}`;
      links.push({ id: `family-${key}`, path, kind: "family", memberIds: familyMemberIds, sourceMemberIds: group.parentIds, targetMemberIds: childHousehold.flatMap(node => [node.member.id]) });
      continue;
    }
    const connector = buildFamilyConnectorGeometry(connectorSourceX, connectorSourceY, railY, childCenters);
    if (!connector) continue;
    links.push({ id: `family-${key}`, path: connector.path, kind: "family", memberIds: familyMemberIds, sourceMemberIds: group.parentIds, targetMemberIds: group.households.flatMap(household => household.ids) });
    childHouseholds.forEach((household, index) => {
      const childX = childCenters[index]; const childY = Math.min(...household.map(node => node.y));
      links.push({ id: `family-child-${key}-${group.households[index].key}`, path: `M ${childX} ${railY} L ${childX} ${childY}`, kind: "family-child", memberIds: familyMemberIds, sourceMemberIds: group.parentIds, targetMemberIds: group.households[index].ids });
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
