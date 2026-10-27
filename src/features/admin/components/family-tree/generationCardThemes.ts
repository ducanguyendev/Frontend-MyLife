export type GenerationCardMotif = "tree" | "branch" | "leaf" | "blossom" | "sun" | "bird" | "flower" | "seed" | "vine" | "harvest";

export interface GenerationCardTheme {
  key: string;
  className: string;
  badgeClassName: string;
  motif: GenerationCardMotif;
}

const THEMES: GenerationCardTheme[] = [
  { key: "origin", className: "family-member-card--origin", badgeClassName: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800", motif: "tree" },
  { key: "branch", className: "family-member-card--branch", badgeClassName: "bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-800", motif: "branch" },
  { key: "leaf", className: "family-member-card--leaf", badgeClassName: "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800", motif: "leaf" },
  { key: "blossom", className: "family-member-card--blossom", badgeClassName: "bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-800", motif: "blossom" },
  { key: "sun", className: "family-member-card--sun", badgeClassName: "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800", motif: "sun" },
  { key: "bird", className: "family-member-card--bird", badgeClassName: "bg-cyan-100 text-cyan-900 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-800", motif: "bird" },
  { key: "flower", className: "family-member-card--flower", badgeClassName: "bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-800", motif: "flower" },
  { key: "seed", className: "family-member-card--seed", badgeClassName: "bg-lime-100 text-lime-900 border-lime-200 dark:bg-lime-900/40 dark:text-lime-200 dark:border-lime-800", motif: "seed" },
  { key: "vine", className: "family-member-card--vine", badgeClassName: "bg-teal-100 text-teal-900 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-800", motif: "vine" },
  { key: "harvest", className: "family-member-card--harvest", badgeClassName: "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800", motif: "harvest" },
];

const NEUTRAL_THEME: GenerationCardTheme = {
  key: "neutral",
  className: "family-member-card--neutral",
  badgeClassName: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  motif: "tree",
};

/** Returns a stable generation palette; generations after four cycle through the extended palette. */
export const getGenerationCardTheme = (generation?: number | null): GenerationCardTheme => {
  if (!Number.isInteger(generation) || (generation ?? 0) < 1) return NEUTRAL_THEME;
  const index = generation! <= 4 ? generation! - 1 : 4 + ((generation! - 5) % (THEMES.length - 4));
  return THEMES[index];
};
