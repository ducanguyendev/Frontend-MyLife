export type FamilyRenderer = "family-chart" | "family-view" | "react-flow";

export const IS_FAMILY_CHART_DEV_POC = import.meta.env.DEV;
export const FAMILY_TREE_RENDERER: FamilyRenderer = IS_FAMILY_CHART_DEV_POC ? "family-chart" : "family-view";
