import { api } from "./api"
import { getGroups } from "./groups"
import {
  mapExpenseDto,
  type ExpenseDto,
  type ExpenseParticipantDto,
} from "./apiMappers"
import type { Expense } from "../types/expense"
import { splitTotalEqually } from "../utils/splitExpenseShares"

export type CreateExpenseInput = {
  description: string
  amount: number
  date: string
  payerId: string
  participantIds: string[]
}

export interface ExpensesListParams {
  page?: number
  limit?: number
  from_date?: string
  to_date?: string
}

type ListItem = ExpenseDto & { participants?: ExpenseParticipantDto[] }

function toParticipantPayload(
  total: number,
  payerId: string,
  participantIds: string[]
): { user_id: string; share_amount: number; is_payer: boolean }[] {
  const shares = splitTotalEqually(total, participantIds)
  return shares.map((s) => ({
    user_id: s.user_id,
    share_amount: s.share_amount,
    is_payer: s.user_id === payerId,
  }))
}

async function getGroupCurrency(groupId: string | number): Promise<string> {
  const { data } = await api.get<{ group: { currency?: string } }>(`/groups/${groupId}`)
  return data.group?.currency ?? "RUB"
}

function rowToDto(row: ListItem): ExpenseDto {
  return {
    id: row.id,
    group_id: row.group_id,
    description: row.description,
    total_amount: row.total_amount,
    expense_date: row.expense_date,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
    is_deleted: row.is_deleted,
  }
}

export const getExpensesByGroup = async (
  groupId: string | number,
  params?: ExpensesListParams,
  options?: { loadParticipants?: boolean }
): Promise<{ items: Expense[]; total: number; page: number; currency: string }> => {
  const currency = await getGroupCurrency(groupId)
  const loadParts = options?.loadParticipants !== false
  const { data } = await api.get<{ items: ListItem[]; total: number; page: number }>(
    `/groups/${groupId}/expenses`,
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        from_date: params?.from_date,
        to_date: params?.to_date,
      },
    }
  )

  const items: Expense[] = await Promise.all(
    data.items.map(async (row) => {
      let parts = row.participants
      if (loadParts && (!parts || parts.length === 0)) {
        try {
          const { data: one } = await api.get<{
            expense: ExpenseDto
            participants: ExpenseParticipantDto[]
          }>(`/groups/${groupId}/expenses/${row.id}`)
          parts = one.participants
        } catch {
          parts = []
        }
      }
      return mapExpenseDto(rowToDto(row), parts ?? [], currency) as Expense
    })
  )

  return { items, total: data.total, page: data.page, currency }
}

export const createExpense = async (
  groupId: string | number,
  data: CreateExpenseInput
): Promise<Expense & { currency: string }> => {
  const currency = await getGroupCurrency(groupId)
  const participants = toParticipantPayload(data.amount, data.payerId, data.participantIds)
  const { data: res } = await api.post<{ expense: ExpenseDto }>(`/groups/${groupId}/expenses`, {
    description: data.description,
    total_amount: data.amount,
    expense_date: data.date,
    participants,
  })
  const { data: one } = await api.get<{
    expense: ExpenseDto
    participants: ExpenseParticipantDto[]
  }>(`/groups/${groupId}/expenses/${res.expense.id}`)
  return mapExpenseDto(one.expense, one.participants, currency)
}

export const getExpenseById = async (
  groupId: string | number,
  expenseId: string | number
): Promise<(Expense & { currency: string }) | undefined> => {
  try {
    const currency = await getGroupCurrency(groupId)
    const { data } = await api.get<{
      expense: ExpenseDto
      participants: ExpenseParticipantDto[]
    }>(`/groups/${groupId}/expenses/${expenseId}`)
    return mapExpenseDto(data.expense, data.participants, currency)
  } catch {
    return undefined
  }
}

export const updateExpense = async (
  groupId: string | number,
  expenseId: string | number,
  data: {
    description: string
    amount: number
    date: string
    payerId: string
    participantIds: string[]
  }
): Promise<Expense & { currency: string }> => {
  const currency = await getGroupCurrency(groupId)
  const participants = toParticipantPayload(
    data.amount,
    data.payerId,
    data.participantIds
  )
  await api.put<{ expense: ExpenseDto }>(`/groups/${groupId}/expenses/${expenseId}`, {
    description: data.description,
    total_amount: data.amount,
    expense_date: data.date,
    participants,
  })
  const { data: one } = await api.get<{
    expense: ExpenseDto
    participants: ExpenseParticipantDto[]
  }>(`/groups/${groupId}/expenses/${expenseId}`)
  return mapExpenseDto(one.expense, one.participants, currency)
}

export const deleteExpense = async (groupId: string | number, expenseId: string | number): Promise<void> => {
  await api.delete(`/groups/${groupId}/expenses/${expenseId}`)
}

export interface UserExpenseRow extends Expense {
  currency: string
  groupName: string
  groupId: string
}

export const getUserExpensesAggregated = async (params?: {
  from_date?: string
  to_date?: string
  limitPerGroup?: number
}): Promise<UserExpenseRow[]> => {
  const groups = await getGroups()
  const rows: UserExpenseRow[] = []
  const lim = params?.limitPerGroup ?? 200
  for (const g of groups) {
    const { items } = await getExpensesByGroup(g.id, {
      page: 1,
      limit: lim,
      from_date: params?.from_date,
      to_date: params?.to_date,
    }, { loadParticipants: false })
    for (const exp of items) {
      rows.push({
        ...exp,
        currency: g.currency,
        groupName: g.name,
        groupId: g.id,
      })
    }
  }
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return rows
}
