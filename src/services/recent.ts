import { getGroups } from "./groups"
import { getExpensesByGroup } from "./expenses"

export interface RecentExpenseItem {
  id: string
  description: string
  amount: number
  date: string
  groupName: string
  groupId: string
  currency: string
}

export const getRecentExpenses = async (limit: number = 5): Promise<RecentExpenseItem[]> => {
  const groups = await getGroups()
  const perGroup = Math.max(3, Math.ceil(limit / Math.max(groups.length, 1)))
  const chunks = await Promise.all(
    groups.map(async (g) => {
      const { items, currency } = await getExpensesByGroup(
        g.id,
        { page: 1, limit: perGroup },
        { loadParticipants: false }
      )
      return items.map((exp) => ({
        id: exp.id,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        groupName: g.name,
        groupId: g.id,
        currency,
      }))
    })
  )
  const merged = chunks.flat()
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return merged.slice(0, limit)
}
