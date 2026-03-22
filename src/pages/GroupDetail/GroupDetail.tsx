import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import AddExpenseModal from './AddExpenseModal'
import AddMembersModal from '../../components/AddMembersModal/AddMembersModal'
import EditGroupModal from './EditGroupModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { getExpensesByGroup, createExpense } from '../../services/expenses'
import { getGroupMembers, addMemberToGroup, removeMemberFromGroup, type GroupMemberView } from '../../services/members'
import { getGroupById, updateGroup, deleteGroup } from '../../services/groups'
import { getGroupBalances } from '../../services/balances'
import { formatMoney } from '../../utils/formatMoney'
import { getCurrencySymbol } from '../../utils/currency'
import type { Expense } from '../../types/expense'
import type { Transfer } from '../../types/transfer'
import GoBackButton from '../../components/GoBackButton/GoBackButton'
import ExpenseCard from '../../components/ExpenseCard/ExpenseCard'
import { useAuth } from '../../contexts/AuthContext'
import ActionButtons from '../../components/ActionButtons/ActionButtons'
import { ApiError } from '../../services/api'
import styles from './GroupDetail.module.css'

const GroupDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [members, setMembers] = useState<GroupMemberView[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<GroupMemberView | null>(null)
  const [group, setGroup] = useState<{
    id: number
    name: string
    description?: string
    currency: string
    authorId: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  const gid = id ? Number(id) : NaN

  const reloadBalances = useCallback(async () => {
    if (!Number.isFinite(gid)) return
    try {
      const { recommended_transfers } = await getGroupBalances(gid)
      setTransfers(recommended_transfers)
    } catch {
      setTransfers([])
    }
  }, [gid])

  const reloadExpenses = useCallback(async () => {
    if (!Number.isFinite(gid)) return
    const { items } = await getExpensesByGroup(gid, { page: 1, limit: 200 })
    setExpenses(items)
  }, [gid])

  useEffect(() => {
    if (!id || !Number.isFinite(gid)) return
    setLoading(true)
    setListError('')
    Promise.all([
      getGroupMembers(id),
      getExpensesByGroup(id, { page: 1, limit: 200 }),
      getGroupById(gid),
      getGroupBalances(gid).catch(() => ({ recommended_transfers: [] as Transfer[] })),
    ])
      .then(([membersData, expensesRes, groupData, bal]) => {
        setMembers(membersData)
        setExpenses(expensesRes.items)
        setTransfers(bal.recommended_transfers ?? [])
        setGroup(
          groupData
            ? {
                id: groupData.id,
                name: groupData.name,
                description: groupData.description,
                currency: groupData.currency,
                authorId: groupData.authorId,
              }
            : null
        )
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setListError('Не удалось загрузить группу')
      })
  }, [id, gid])

  const handleAddExpense = async (expenseData: {
    description: string
    amount: number
    date: string
    payerId: number
    participantIds: number[]
  }) => {
    if (!id) return
    await createExpense(id, expenseData)
    await reloadExpenses()
    await reloadBalances()
  }

  const handleAddMember = async (userId: number) => {
    if (!id) return
    try {
      await addMemberToGroup(id, userId)
      const updatedMembers = await getGroupMembers(id)
      setMembers(updatedMembers)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 403) throw new Error('Нет прав добавлять участников')
        if (e.status === 409) throw new Error('Участник уже в группе или конфликт правил')
      }
      throw e
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!id) return
    try {
      await removeMemberFromGroup(id, userId)
      const updatedMembers = await getGroupMembers(id)
      setMembers(updatedMembers)
      setMemberToRemove(null)
      await reloadBalances()
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 403) {
          setMemberToRemove(null)
          alert('Нет прав удалять участников')
          return
        }
        if (e.status === 409) {
          setMemberToRemove(null)
          alert('Нельзя удалить участника: есть непогашенные долги или это создатель группы')
          return
        }
      }
      throw e
    }
  }

  const handleUpdateGroup = async (data: { name: string; description?: string; currency: string }) => {
    if (!id) return
    const updated = await updateGroup(Number(id), data)
    if (updated) {
      setGroup({
        id: updated.id,
        name: updated.name,
        description: updated.description,
        currency: updated.currency,
        authorId: updated.authorId,
      })
    }
  }

  const handleDeleteGroup = async () => {
    if (!id) return
    try {
      await deleteGroup(Number(id))
      navigate('/groups')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        alert('Нельзя удалить группу: есть незакрытые долги или ограничения сервера')
        return
      }
      throw e
    }
  }

  const getUserName = (userId: number) => {
    return members.find((m) => m.id === userId)?.name || `Пользователь ${userId}`
  }

  const hasMembers = members.length > 0
  const canManageMembers = Boolean(user && members.some((m) => m.id === user.id && m.isAdmin))

  if (loading) return <div className={styles.container}>Загрузка...</div>
  if (listError) return <div className={styles.container}>{listError}</div>
  if (!group) return <div className={styles.container}>Группа не найдена или нет доступа</div>

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <div className={styles.headerRow}>
          <h2 className={styles.title}>Расходы группы {group.name}</h2>
        </div>

        <ActionButtons
          primaryLabel="✏️ Редактировать группу"
          secondaryLabel="🗑️ Удалить группу"
          onPrimaryClick={() => setIsEditGroupModalOpen(true)}
          onSecondaryClick={() => setShowDeleteConfirm(true)}
        />

        {members.length > 0 && (
          <div className={styles.membersSection}>
            <h3 className={styles.membersTitle}>Участники ({members.length})</h3>
            <div className={styles.membersList}>
              {members.map((member) => (
                <div key={member.id} className={styles.memberItem}>
                  <span>
                    {member.name}
                    {member.id === group.authorId && <span className={styles.creatorBadge}> (создатель)</span>}
                  </span>
                  {canManageMembers && member.id !== user?.id && member.id !== group.authorId && (
                    <button
                      className={styles.removeMemberButton}
                      onClick={() => setMemberToRemove(member)}
                      aria-label="Удалить участника"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasMembers && (
          <p className={styles.noMembersMessage}>
            В группе пока нет участников. Добавьте участников, чтобы начать учитывать расходы.
          </p>
        )}

        <div className={styles.actionButtons}>
          {canManageMembers && (
            <button className="secondary" type="button" onClick={() => setIsMembersModalOpen(true)}>
              + Добавить участников
            </button>
          )}
          <button type="button" onClick={() => setIsExpenseModalOpen(true)} disabled={!hasMembers}>
            + Добавить расход
          </button>
        </div>

        <div className={styles.expenseList}>
          {expenses.map((exp) => (
            <ExpenseCard
              key={exp.id}
              id={exp.id}
              groupId={group.id}
              description={exp.description}
              amount={exp.amount}
              date={exp.date}
              currency={group.currency}
              participants={exp.participants.map((p) => ({
                userId: p.userId,
                name: getUserName(p.userId),
                debt: p.debt,
                isPayer: p.isPayer,
              }))}
            />
          ))}
        </div>

        <h3 className={styles.balancesTitle}>Кому и сколько должны</h3>
        <div className={styles.transfersList}>
          {transfers.length === 0 && <p className={styles.noBalances}>Все расчёты урегулированы</p>}
          {transfers.map((t, idx) => (
            <div key={idx} className={styles.transferItem}>
              <span>
                {getUserName(t.debtorId)} → {getUserName(t.creditorId)}
              </span>
              <strong>
                {formatMoney(t.amount)} {getCurrencySymbol(group.currency)}
              </strong>
            </div>
          ))}
        </div>

        {isExpenseModalOpen && (
          <AddExpenseModal
            members={members}
            onClose={() => setIsExpenseModalOpen(false)}
            onAdd={handleAddExpense}
            groupId={id!}
          />
        )}

        {isMembersModalOpen && (
          <AddMembersModal onClose={() => setIsMembersModalOpen(false)} onAdd={handleAddMember} />
        )}

        {isEditGroupModalOpen && group && (
          <EditGroupModal
            group={group}
            onClose={() => setIsEditGroupModalOpen(false)}
            onUpdate={handleUpdateGroup}
          />
        )}

        {showDeleteConfirm && (
          <ConfirmModal
            title="Удаление группы"
            message={`Вы уверены, что хотите удалить группу "${group.name}"?`}
            onConfirm={handleDeleteGroup}
            onCancel={() => setShowDeleteConfirm(false)}
            confirmText="Удалить"
            cancelText="Отмена"
          />
        )}

        {memberToRemove && (
          <ConfirmModal
            title="Удаление участника"
            message={`Вы уверены, что хотите удалить участника "${memberToRemove.name}" из группы?`}
            onConfirm={() => handleRemoveMember(memberToRemove.id)}
            onCancel={() => setMemberToRemove(null)}
            confirmText="Удалить"
            cancelText="Отмена"
          />
        )}
      </div>
    </>
  )
}

export default GroupDetail
