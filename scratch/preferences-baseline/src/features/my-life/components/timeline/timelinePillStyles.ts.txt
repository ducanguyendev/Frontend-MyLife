export function getTimelinePillClass(active: boolean): string {
  const base = 'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-secondary-bg';
  const state = active
    ? 'border-accent bg-accent/10 text-accent'
    : 'border-custom-border text-secondary-text hover:border-accent/30 hover:text-primary-text';
  return `${base} ${state}`;
}
