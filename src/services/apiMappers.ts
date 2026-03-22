import type { User } from "../types/user"
import type { Group } from "../types/group"
import type { Expense } from "../types/expense"
import type { ExpenseParticipant } from "../types/expenseParticipant"
import type { Balance } from "../types/balance"

/** Backend user DTO (snake_case) */
export interface UserDto {
  id: number
  username: string
  email: string
  phone?: string | null
  created_at?: string
  last_login?: string | null
}

export function mapUserDto(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.username,
    email: dto.email,
    phone: dto.phone ?? undefined,
    registrationDate: dto.created_at?.split("T")[0] ?? "",
    lastLogin: dto.last_login ?? undefined,
  }
}

export interface GroupDto {
  id: number
  name: string
  description?: string | null
  currency?: string
  created_by: number
  created_at: string
  updated_at?: string | null
  is_active: boolean
}

export function mapGroupDto(dto: GroupDto, extras?: Partial<Group>): Group {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? undefined,
    authorId: dto.created_by,
    createdAt: dto.created_at?.split("T")[0] ?? dto.created_at,
    updatedAt: dto.updated_at?.split("T")[0] ?? dto.updated_at ?? undefined,
    status: dto.is_active,
    currency: dto.currency ?? "RUB",
    ...extras,
  }
}

export interface ExpenseParticipantDto {
  id?: number
  user_id: number
  share_amount: number | string
  is_payer: boolean
}

export interface ExpenseDto {
  id: number
  group_id: number
  description: string
  total_amount: number | string
  expense_date: string
  created_by: number
  created_at: string
  updated_at?: string | null
  updated_by?: number | null
  is_deleted: boolean
}

export function mapExpenseDto(
  dto: ExpenseDto,
  participants: ExpenseParticipantDto[],
  currency: string
): Expense & { currency: string } {
  const total =
    typeof dto.total_amount === "string"
      ? parseFloat(dto.total_amount)
      : dto.total_amount
  const mappedParticipants: ExpenseParticipant[] = participants.map((p, idx) => {
    const share =
      typeof p.share_amount === "string" ? parseFloat(p.share_amount) : p.share_amount
    return {
      id: p.id ?? p.user_id * 100000 + idx,
      expenseId: dto.id,
      userId: p.user_id,
      debt: share,
      isPayer: p.is_payer,
      paid: false,
      paymentRequested: false,
    }
  })
  return {
    id: dto.id,
    groupId: dto.group_id,
    description: dto.description,
    amount: total,
    date: dto.expense_date,
    createdBy: dto.created_by,
    createdAt: dto.created_at,
    updatedBy: dto.updated_by ?? undefined,
    updatedAt: dto.updated_at ?? undefined,
    isDeleted: dto.is_deleted,
    participants: mappedParticipants,
    currency,
  }
}

export function mapBalanceDto(dto: {
  id: number
  group_id: number
  creditor_id: number
  debtor_id: number
  amount: number | string
  paid_amount: number | string
  last_updated: string
}): Balance {
  return {
    id: dto.id,
    groupId: dto.group_id,
    creditorId: dto.creditor_id,
    debtorId: dto.debtor_id,
    amount: typeof dto.amount === "string" ? parseFloat(dto.amount) : dto.amount,
    paidAmount:
      typeof dto.paid_amount === "string"
        ? parseFloat(dto.paid_amount)
        : dto.paid_amount,
    lastUpdated: dto.last_updated,
  }
}
