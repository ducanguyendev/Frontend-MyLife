import type { Datum, Data } from "family-chart";
import type { FamilyMember } from "./types";

export type FamilyChartPersonData = Datum["data"] & {
  name: string;
  avatar: string;
  role: string;
  generation: number;
  gender: "M" | "F";
  birthYear: string;
  memorial: string;
  deceased: boolean;
  hiddenCount: number;
  expanded: boolean;
  labels: { view: string; edit: string; delete: string; focus: string; expand: string; collapse: string; generation: string };
};

export type FamilyChartPerson = Omit<Datum, "data"> & { data: FamilyChartPersonData };

const safeGender = (gender?: string): "M" | "F" => {
  const normalized = gender?.trim().toLocaleLowerCase();
  return normalized && ["f", "female", "nu", "nữ"].some(value => normalized === value || normalized.includes(value)) ? "F" : "M";
};

/** Convert MyLife records into family-chart's v0.9 relation shape without mutating API data. */
export function adaptMembersToFamilyChart(
  members: FamilyMember[],
  options: {
    hiddenCounts?: ReadonlyMap<number, number>;
    expandedIds?: ReadonlySet<number>;
    labels?: { view?: string; edit?: string; delete?: string; focus?: string; expand?: (count: number) => string; collapse?: string; generation?: (generation: number) => string };
  } = {},
): Data {
  const byId = new Map(members.map(member => [member.id, member]));
  const relations = new Map(members.map(member => [member.id, { parents: new Set<number>(), spouses: new Set<number>(), children: new Set<number>() }]));
  const add = (ownerId: number, relation: "parents" | "spouses" | "children", targetId?: number | null) => {
    if (targetId == null || ownerId === targetId || !byId.has(ownerId) || !byId.has(targetId)) return;
    relations.get(ownerId)?.[relation].add(targetId);
  };

  for (const member of members) {
    add(member.id, "parents", member.fatherId);
    add(member.id, "parents", member.motherId);
    for (const childId of member.childIds ?? []) add(member.id, "children", childId);
    add(member.id, "spouses", member.spouseId);
  }

  // Keep the parent/child view reciprocal and spouse pairs symmetric as family-chart requires.
  for (const member of members) {
    const rel = relations.get(member.id)!;
    for (const parentId of rel.parents) relations.get(parentId)?.children.add(member.id);
    for (const childId of rel.children) relations.get(childId)?.parents.add(member.id);
    for (const spouseId of rel.spouses) relations.get(spouseId)?.spouses.add(member.id);
  }

  return members.map(member => {
    const date = member.dateOfBirth ? new Date(member.dateOfBirth) : null;
    const deathDate = member.deathDate ? new Date(member.deathDate) : null;
    const birthYear = date && Number.isFinite(date.getTime()) ? String(date.getFullYear()) : "";
    const deathYear = deathDate && Number.isFinite(deathDate.getTime()) ? String(deathDate.getFullYear()) : "";
    const rel = relations.get(member.id)!;
    const hiddenCount = options.hiddenCounts?.get(member.id) ?? 0;
    return {
      id: String(member.id),
      data: {
        name: member.fullName,
        avatar: member.avatarUrl ?? "",
        role: member.role ?? "Thành viên",
        generation: member.generation,
        gender: safeGender(member.gender),
        birthYear,
        memorial: deathYear ? `${birthYear} – ${deathYear}` : "†",
        deceased: member.lifeStatus === "DECEASED",
        hiddenCount,
        expanded: options.expandedIds?.has(member.id) ?? false,
        labels: {
          view: options.labels?.view ?? "Chi tiết", edit: options.labels?.edit ?? "Sửa", delete: options.labels?.delete ?? "Xóa", focus: options.labels?.focus ?? "Xem nhánh này",
          expand: options.labels?.expand?.(hiddenCount) ?? `Hiện ${hiddenCount} hậu duệ`, collapse: options.labels?.collapse ?? "Thu gọn",
          generation: options.labels?.generation?.(member.generation) ?? `Đời ${member.generation}`,
        },
      },
      rels: {
        parents: [...rel.parents].map(String),
        spouses: [...rel.spouses].map(String),
        children: [...rel.children].map(String),
      },
    } satisfies FamilyChartPerson;
  });
}

/** Escape all user-controlled strings before the library inserts the custom card with innerHTML. */
export function escapeFamilyChartHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

/** Avoid scriptable URLs in custom card image attributes. */
export function safeFamilyChartImageUrl(value: unknown): string {
  const url = String(value ?? "").trim();
  if (/^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(url)) return url;
  if (/^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(url)) return url;
  return "";
}
