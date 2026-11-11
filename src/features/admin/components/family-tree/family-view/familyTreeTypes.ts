import type { FamilyMember } from "../types";

export interface FamilyViewNode {
  member: FamilyMember;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
}

export interface FamilyRenderSegment {
  id: string;
  path: string;
  semanticEdgeIds: string[];
}

export interface FamilyViewLink {
  id: string;
  path: string;
  kind: "family" | "family-child" | "spouse" | "extended";
  memberIds: number[];
  sourceMemberIds?: number[];
  targetMemberIds?: number[];
  segments?: FamilyRenderSegment[];
  labelX?: number;
  labelY?: number;
}

export interface FamilyViewLayout {
  nodes: FamilyViewNode[];
  links: FamilyViewLink[];
  width: number;
  height: number;
}
