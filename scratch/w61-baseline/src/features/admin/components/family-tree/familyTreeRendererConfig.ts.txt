export type FamilyRenderer = "family-view" | "shadcn-family-tree" | "family-chart" | "memoir" | "react-flow";

/** Resolve renderer flags without allowing the experimental chart into normal builds by accident. */
export function resolveFamilyTreeRenderer(isDevelopment: boolean, configuredRenderer?: string): FamilyRenderer {
  if (configuredRenderer === "family-chart") return isDevelopment ? "family-chart" : "family-view";
  if (configuredRenderer === "memoir") return isDevelopment ? "memoir" : "family-view";
  if (configuredRenderer === "shadcn-family-tree") return isDevelopment ? "shadcn-family-tree" : "family-view";
  if (configuredRenderer === "react-flow") return "react-flow";
  return "family-view";
}

const requestedRenderer = import.meta.env.VITE_FAMILY_TREE_RENDERER;
export const IS_DEVELOPMENT_BUILD = import.meta.env.DEV;
export const IS_FAMILY_CHART_DEV_POC = IS_DEVELOPMENT_BUILD && requestedRenderer === "family-chart";
export const IS_MEMOIR_DEV_POC = IS_DEVELOPMENT_BUILD && requestedRenderer === "memoir";
export const IS_SHADCN_FAMILY_TREE_DEV_POC = IS_DEVELOPMENT_BUILD && requestedRenderer === "shadcn-family-tree";
export const FAMILY_TREE_RENDERER: FamilyRenderer = resolveFamilyTreeRenderer(IS_DEVELOPMENT_BUILD, requestedRenderer);
