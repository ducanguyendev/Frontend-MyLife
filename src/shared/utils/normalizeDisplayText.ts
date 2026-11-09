/** Presentation only: never use this to rewrite input state or API payloads. */
export function normalizeDisplayText(value: string | null | undefined): string {
  return value?.normalize('NFC') ?? '';
}
