const HEAVENLY_STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
const EARTHLY_BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;

export const MIN_SUPPORTED_LUNAR_YEAR = 1800;
export const MAX_SUPPORTED_LUNAR_YEAR = 2200;

export function isSupportedLunarYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_SUPPORTED_LUNAR_YEAR && year <= MAX_SUPPORTED_LUNAR_YEAR;
}

export function getLunarYearCanChi(year: number): string | null {
  if (!isSupportedLunarYear(year)) return null;
  const canIndex = (year + 6) % HEAVENLY_STEMS.length;
  const chiIndex = (year + 8) % EARTHLY_BRANCHES.length;
  return `${HEAVENLY_STEMS[canIndex]} ${EARTHLY_BRANCHES[chiIndex]}`;
}

export function formatLunarYearLabel(year: number): string | null {
  const canChi = getLunarYearCanChi(year);
  return canChi ? `${year} – ${canChi}` : null;
}
