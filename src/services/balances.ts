import { api } from "./api"
import { mapBalanceDto } from "./apiMappers"
import type { Balance } from "../types/balance"
import type { Transfer } from "../types/transfer"

export interface GroupBalancesPayload {
  balances: Balance[]
  recommended_transfers: Transfer[]
}

type BalanceDto = {
  id: string
  group_id: string
  creditor_id: string
  debtor_id: string
  amount: number | string
  paid_amount: number | string
  last_updated: string
}

export const getGroupBalances = async (groupId: string | number): Promise<GroupBalancesPayload> => {
  const { data } = await api.get<{
    balances: BalanceDto[]
    recommended_transfers: Array<{
      from_user_id: string
      to_user_id: string
      amount: number | string
    }>
  }>(`/groups/${groupId}/balances`)
  return {
    balances: data.balances.map(mapBalanceDto),
    recommended_transfers: (data.recommended_transfers ?? []).map((t) => ({
      debtorId: t.from_user_id,
      creditorId: t.to_user_id,
      amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
    })),
  }
}

export interface BalancesMeRow {
  userId: string
  amount: number
}

export const getGroupBalancesMe = async (
  groupId: string | number
): Promise<{ oweTo: BalancesMeRow[]; owedBy: BalancesMeRow[] }> => {
  const { data } = await api.get<{
    owe_to?: Array<{ user_id: string; amount: number | string }>
    owed_by?: Array<{ user_id: string; amount: number | string }>
  }>(`/groups/${groupId}/balances/me`)
  const owe = data.owe_to ?? []
  const by = data.owed_by ?? []
  return {
    oweTo: owe.map((r) => ({
      userId: r.user_id,
      amount: typeof r.amount === "string" ? parseFloat(r.amount) : r.amount,
    })),
    owedBy: by.map((r) => ({
      userId: r.user_id,
      amount: typeof r.amount === "string" ? parseFloat(r.amount) : r.amount,
    })),
  }
}

export const payBalance = async (
  groupId: string | number,
  balanceId: string | number,
  amount: number
): Promise<Balance> => {
  const { data } = await api.post<{ balance: BalanceDto }>(
    `/groups/${groupId}/balances/${balanceId}/pay`,
    { amount }
  )
  return mapBalanceDto(data.balance)
}
