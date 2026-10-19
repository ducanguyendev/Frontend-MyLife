import type { FamilyMember } from "../types";

export interface FamilyViewNode {
  member: FamilyMember;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
}

export interface FamilyViewLink {
  id: string;
  path: string;
  kind: "family" | "spouse" | "extended";
  memberIds: number[];
  labelX?: number;
  labelY?: number;
}

export interface FamilyViewLayout {
  nodes: FamilyViewNode[];
  links: FamilyViewLink[];
  width: number;
  height: number;
}
