/**
 * Равное деление total с остатком на первого участника (как в спеке бекенда).
 */
export function splitTotalEqually(
  total: number,
  userIds: string[]
): { user_id: string; share_amount: number }[] {
  if (userIds.length === 0) return []
  const cents = Math.round(total * 100)
  const n = userIds.length
  const base = Math.floor(cents / n)
  const remainder = cents - base * n
  return userIds.map((user_id, i) => ({
    user_id,
    share_amount: (base + (i === 0 ? remainder : 0)) / 100,
  }))
}
