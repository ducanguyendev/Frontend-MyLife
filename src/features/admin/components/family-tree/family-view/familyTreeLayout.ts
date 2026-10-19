import type { FamilyMember } from "../types";
import type { FamilyViewLayout, FamilyViewLink, FamilyViewNode } from "./familyTreeTypes";

export const FAMILY_CARD_WIDTH = 218;
export const FAMILY_CARD_HEIGHT = 166;
const PARTNER_GAP = 26;
const UNIT_GAP = 52;
const FAMILY_GAP = 76;
const GENERATION_GAP = 56;
const CANVAS_PADDING = 72;

const pairKey = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b).join(":") || "root";

interface FamilyUnit {
  ids: number[];
  key: string;
  parentKey: string;
  width: number;
  center: number;
}

/** Positions visible household units in sibling clusters and derives one shared descent rail per parent pair. */
export function layoutFamilyView(members: FamilyMember[], showExtendedRelations = false): FamilyViewLayout {
  if (!members.length) return { nodes: [], links: [], width: 0, height: 0 };
  const visibleIds = new Set(members.map(member => member.id));
  const generations = [...new Set(members.map(member => member.generation))].sort((a, b) => a - b);
  const generationIndex = new Map(generations.map((generation, index) => [generation, index]));
  const positions = new Map<number, { x: number; y: number }>();
  const spousePairs = new Set<string>();
  for (const member of members) {
    if (member.spouseId != null && visibleIds.has(member.spouseId) && member.spouseId !== member.id) spousePairs.add(pairKey([member.id, member.spouseId]));
  }

  for (const generation of generations) {
    const rowMembers = members.filter(member => member.generation === generation);
    const remaining = new Map(rowMembers.map(person => [person.id, person]));
    const allUnits: FamilyUnit[] = [];
    for (const person of [...rowMembers].sort((a, b) => a.id - b.id)) {
      if (!remaining.has(person.id)) continue;
      const spouse = person.spouseId == null ? undefined : remaining.get(person.spouseId);
      const ids = spouse ? [person.id, spouse.id].sort((a, b) => a - b) : [person.id];
      ids.forEach(id => remaining.delete(id));
      const parents = [person.fatherId, person.motherId].filter((id): id is number => id != null && visibleIds.has(id));
      const parentKey = pairKey(parents);
      const parentCenters = parents.map(id => positions.get(id)).filter((value): value is { x: number; y: number } => !!value)
        .map(value => value.x + FAMILY_CARD_WIDTH / 2);
      const width = ids.length * FAMILY_CARD_WIDTH + Math.max(0, ids.length - 1) * PARTNER_GAP;
      allUnits.push({ ids, key: ids.join(":"), parentKey, width, center: parentCenters.length ? parentCenters.reduce((sum, x) => sum + x, 0) / parentCenters.length : 0 });
    }
    const compareIdKeys = (first: string, second: string) => {
      const firstIds = first.split(":").map(Number); const secondIds = second.split(":").map(Number);
      for (let index = 0; index < Math.min(firstIds.length, secondIds.length); index++) if (firstIds[index] !== secondIds[index]) return firstIds[index] - secondIds[index];
      return firstIds.length - secondIds.length;
    };
    allUnits.sort((a, b) => a.center - b.center || a.parentKey.localeCompare(b.parentKey) || compareIdKeys(a.key, b.key));
    const totalGaps = allUnits.reduce((sum, unit, index) => sum + (index === 0 ? 0 : allUnits[index - 1].parentKey === unit.parentKey ? UNIT_GAP : FAMILY_GAP), 0);
    const totalWidth = allUnits.reduce((sum, unit) => sum + unit.width, 0) + totalGaps;
    let cursor = CANVAS_PADDING - totalWidth / 2;
    const rank = generationIndex.get(generation) ?? 0;
    for (const [unitIndex, unit] of allUnits.entries()) {
      const unitCenter = cursor + unit.width / 2;
      // Keep separate sibling households grouped while placing each family close to its parents.
      unit.ids.forEach((id, index) => positions.set(id, {
        x: cursor + index * (FAMILY_CARD_WIDTH + PARTNER_GAP),
        y: CANVAS_PADDING + rank * (FAMILY_CARD_HEIGHT + GENERATION_GAP),
      }));
      unit.center = unitCenter;
      const nextUnit = allUnits[unitIndex + 1];
      cursor += unit.width + (nextUnit ? unit.parentKey === nextUnit.parentKey ? UNIT_GAP : FAMILY_GAP : 0);
    }
  }

  // Re-center each generation independently around its family-parent anchors; then normalize the canvas bounds.
  for (const generation of generations.slice(1)) {
    const row = members.filter(member => member.generation === generation);
    const rowXs = row.map(member => positions.get(member.id)!.x);
    const currentCenter = (Math.min(...rowXs) + Math.max(...rowXs) + FAMILY_CARD_WIDTH) / 2;
    const parentCenters = row.flatMap(member => [member.fatherId, member.motherId]
      .filter((id): id is number => id != null).map(id => positions.get(id)?.x)
      .filter((x): x is number => x != null).map(x => x + FAMILY_CARD_WIDTH / 2));
    if (!parentCenters.length) continue;
    const targetCenter = parentCenters.reduce((sum, x) => sum + x, 0) / parentCenters.length;
    const shift = targetCenter - currentCenter;
    for (const member of row) positions.get(member.id)!.x += shift;
  }

  const minX = Math.min(...[...positions.values()].map(position => position.x));
  const maxX = Math.max(...[...positions.values()].map(position => position.x + FAMILY_CARD_WIDTH));
  const minY = Math.min(...[...positions.values()].map(position => position.y));
  const maxY = Math.max(...[...positions.values()].map(position => position.y + FAMILY_CARD_HEIGHT));
  const offsetX = CANVAS_PADDING - minX;
  const offsetY = CANVAS_PADDING - minY;
  for (const position of positions.values()) { position.x += offsetX; position.y += offsetY; }

  const nodes: FamilyViewNode[] = members.map(member => ({
    member, ...positions.get(member.id)!, width: FAMILY_CARD_WIDTH, height: FAMILY_CARD_HEIGHT, generation: member.generation,
  }));
  const nodeById = new Map(nodes.map(node => [node.member.id, node]));
  const links: FamilyViewLink[] = [];

  // Couple connection remains a short center mark; child groups share one trunk and one local sibling rail.
  for (const key of spousePairs) {
    const [firstId, secondId] = key.split(":").map(Number);
    const first = nodeById.get(firstId); const second = nodeById.get(secondId);
    if (!first || !second || first.y !== second.y) continue;
    const x1 = first.x + first.width; const x2 = second.x;
    const y = first.y + first.height / 2;
    links.push({ id: `spouse-${key}`, path: `M ${x1} ${y} L ${x2} ${y}`, kind: "spouse", memberIds: [firstId, secondId], labelX: (x1 + x2) / 2, labelY: y });
  }

  const childGroups = new Map<string, FamilyMember[]>();
  for (const child of members) {
    const parents = [child.fatherId, child.motherId].filter((id): id is number => id != null && visibleIds.has(id));
    if (!parents.length) continue;
    const key = pairKey(parents);
    const group = childGroups.get(key) ?? [];
    group.push(child);
    childGroups.set(key, group);
  }
  for (const [key, children] of childGroups) {
    const parentIds = key.split(":").map(Number);
    const parents = parentIds.map(id => nodeById.get(id)).filter((node): node is FamilyViewNode => !!node);
    if (!parents.length) continue;
    const sourceX = parents.reduce((sum, parent) => sum + parent.x + parent.width / 2, 0) / parents.length;
    const sourceY = Math.max(...parents.map(parent => parent.y + parent.height));
    const childNodes = children.map(child => nodeById.get(child.id)).filter((node): node is FamilyViewNode => !!node);
    if (!childNodes.length) continue;
    const childCenters = childNodes.map(node => node.x + node.width / 2).sort((a, b) => a - b);
    const railY = childNodes[0].y - 30;
    const path = childNodes.length === 1
      ? `M ${sourceX} ${sourceY} C ${sourceX} ${(sourceY + railY) / 2}, ${childCenters[0]} ${(sourceY + railY) / 2}, ${childCenters[0]} ${childNodes[0].y}`
      : `M ${sourceX} ${sourceY} L ${sourceX} ${railY} M ${childCenters[0]} ${railY} L ${childCenters.at(-1)} ${railY} ${childCenters.map((x, index) => `M ${x} ${railY} L ${x} ${childNodes[index].y}`).join(" ")}`;
    links.push({ id: `family-${key}`, path, kind: "family", memberIds: [...parentIds, ...childNodes.map(node => node.member.id)] });
  }

  if (showExtendedRelations) {
    const relationPairs = new Map<string, { firstId: number; secondId: number }>();
    for (const member of members) for (const relation of member.horizontalRelations ?? []) {
      const otherId = Number(relation.memberId);
      if (!visibleIds.has(otherId) || otherId === member.id) continue;
      const key = pairKey([member.id, otherId]);
      if (spousePairs.has(key)) continue;
      relationPairs.set(key, { firstId: Math.min(member.id, otherId), secondId: Math.max(member.id, otherId) });
    }
    for (const [key, pair] of relationPairs) {
      const first = nodeById.get(pair.firstId); const second = nodeById.get(pair.secondId);
      if (!first || !second) continue;
      const x1 = first.x + first.width / 2; const x2 = second.x + second.width / 2;
      const y1 = first.y + first.height / 2; const y2 = second.y + second.height / 2;
      links.push({ id: `extended-${key}`, path: `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 24} ${x2} ${y2}`, kind: "extended", memberIds: [pair.firstId, pair.secondId] });
    }
  }

  return { nodes, links, width: maxX - minX + CANVAS_PADDING * 2, height: maxY - minY + CANVAS_PADDING * 2 };
}
