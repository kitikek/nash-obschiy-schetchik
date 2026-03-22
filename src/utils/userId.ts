/** Единый формат user id в UI (JSON с бекенда может дать number). */
export function normUserId(id: string | number | undefined | null): string {
  if (id === undefined || id === null) return ""
  const s = String(id).trim()
  return s === "undefined" || s === "null" ? "" : s
}

export function sameUserId(
  a: string | number | undefined | null,
  b: string | number | undefined | null
): boolean {
  return normUserId(a) === normUserId(b)
}
