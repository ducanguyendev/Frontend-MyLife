export type FamilyRenderer = "family-chart" | "family-view" | "react-flow";

/** Resolve renderer flags without allowing the experimental chart into normal builds by accident. */
export function resolveFamilyTreeRenderer(isDevelopment: boolean, configuredRenderer?: string): FamilyRenderer {
  if (configuredRenderer === "family-chart") return isDevelopment ? "family-chart" : "family-view";
  if (configuredRenderer === "react-flow") return "react-flow";
  return "family-view";
}

const requestedRenderer = import.meta.env.VITE_FAMILY_TREE_RENDERER;
export const IS_DEVELOPMENT_BUILD = import.meta.env.DEV;
export const IS_FAMILY_CHART_DEV_POC = IS_DEVELOPMENT_BUILD && requestedRenderer === "family-chart";
export const FAMILY_TREE_RENDERER: FamilyRenderer = requestedRenderer === "react-flow"
  ? "react-flow"
  : IS_FAMILY_CHART_DEV_POC ? "family-chart" : "family-view";
