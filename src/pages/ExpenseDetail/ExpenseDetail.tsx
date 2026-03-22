import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import GoBackButton from '../../components/GoBackButton/GoBackButton'
import { useAuth } from '../../contexts/AuthContext'
import { getExpenseById, updateExpense, deleteExpense } from '../../services/expenses'
import { getGroupById } from '../../services/groups'
import { getGroupMembers } from '../../services/members'
import { getGroupBalances, payBalance } from '../../services/balances'
import { formatMoney } from '../../utils/formatMoney'
import { getCurrencySymbol } from '../../utils/currency'
import type { Expense } from '../../types/expense'
import styles from './ExpenseDetail.module.css'
import EditExpenseModal from './EditExpenseModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import ActionButtons from '../../components/ActionButtons/ActionButtons'
import { ApiError } from '../../services/api'
import { normUserId } from '../../utils/userId'

const ExpenseDetail: React.FC = () => {
  const { groupId: groupIdParam, expenseId: expenseIdParam } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [expense, setExpense] = useState<(Expense & { currency: string }) | null>(null)
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [balanceInfo, setBalanceInfo] = useState<{
    exists: boolean
    remaining: number
    creditorId: string
    debtorId: string
  } | null>(null)

  const groupId = groupIdParam ?? ''
  const expenseId = expenseIdParam ?? ''

  useEffect(() => {
    if (!user || !groupId || !expenseId) {
      setLoading(false)
      return
    }
    getExpenseById(groupId, expenseId).then(async (exp) => {
      if (exp) {
        setExpense(exp)
        const group = await getGroupById(groupId)
        setGroupName(group?.name || '')
        const groupMembers = await getGroupMembers(groupId)
        setMembers(groupMembers.map((m) => ({ id: m.id, name: m.name })))

        getGroupBalances(groupId).then(({ balances }) => {
          const payer = exp.participants.find(p => p.isPayer)
          if (payer && user) {
            const found = balances.find(b => b.debtorId === user.id && b.creditorId === payer.userId)
            if (found && found.amount - found.paidAmount > 0.01) {
              setBalanceInfo({
                exists: true,
                remaining: found.amount - found.paidAmount,
                creditorId: found.creditorId,
                debtorId: found.debtorId,
              })
            } else {
              setBalanceInfo(null)
            }
          }
        })
      }
      setLoading(false)
    })
  }, [user, groupId, expenseId])

  const handleUpdate = async (data: {
    description: string
    amount: number
    date: string
    payerId: string
    participantIds: string[]
  }) => {
    if (!expense || !groupId) return
    try {
      const updated = await updateExpense(groupId, expense.id, data)
      setExpense(updated)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        alert('Редактировать может только автор расхода')
        return
      }
      throw e
    }
  }

  const handleDelete = () => {
    if (!expense) return
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!expense || !groupId) return
    // Предварительная проверка долгов
    try {
      const { recommended_transfers } = await getGroupBalances(groupId)
      const active = recommended_transfers.filter(t => t.amount > 0.01)
      if (active.length > 0) {
        const confirm = window.confirm(
          'В группе есть непогашенные долги. Удаление этого расхода пересчитает все долги. Вы уверены?'
        )
        if (!confirm) return
      }
    } catch (e) {
      console.warn('Не удалось проверить наличие долгов', e)
    }
    try {
      await deleteExpense(groupId, expense.id)
      navigate(`/groups/${groupId}`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        alert('Удалить может только автор расхода')
        return
      }
      throw e
    }
  }

  const handlePay = async () => {
    if (!balanceInfo || !groupId) return
    try {
      await payBalance(groupId, balanceInfo.creditorId, balanceInfo.debtorId, balanceInfo.remaining)
      navigate(`/groups/${groupId}`)
    } catch (err: any) {
      console.error('Pay error:', err)
      alert(err?.message || 'Ошибка при оплате')
    }
  }

  if (loading) return <div className={styles.container}>Загрузка...</div>
  if (!expense || !user) return <div className={styles.container}>Расход не найден</div>

  const payer = expense.participants.find((p) => p.isPayer)
  const payerName = members.find((m) => m.id === payer?.userId)?.name || 'Неизвестно'
  const currencySymbol = getCurrencySymbol(expense.currency)
  const canEdit = expense.createdBy === user.id

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Детали расхода</h2>

        {canEdit && (
          <ActionButtons
            primaryLabel="✏️ Редактировать"
            secondaryLabel="🗑️ Удалить"
            onPrimaryClick={() => setIsEditModalOpen(true)}
            onSecondaryClick={handleDelete}
          />
        )}

        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Описание:</span>
            <span>{expense.description}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Сумма:</span>
            <span>
              {formatMoney(expense.amount)} {currencySymbol}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Дата:</span>
            <span>{expense.date}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Группа:</span>
            <span>{groupName}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Плательщик:</span>
            <span>{payerName}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Создан:</span>
            <span>
              {new Date(expense.createdAt).toLocaleString()} —{' '}
              {members.find((m) => m.id === expense.createdBy)?.name || `Пользователь ${expense.createdBy}`}
            </span>
          </div>
          {expense.updatedAt && expense.updatedBy && (
            <div className={styles.row}>
              <span className={styles.label}>Изменён:</span>
              <span>
                {new Date(expense.updatedAt).toLocaleString()} —{' '}
                {members.find((m) => m.id === expense.updatedBy)?.name || `Пользователь ${expense.updatedBy}`}
              </span>
            </div>
          )}
        </div>

        <h3 className={styles.subtitle}>Участники и доли</h3>
        <div className={styles.participants}>
          {expense.participants.map((p) => {
            const member = members.find((m) => m.id === p.userId)
            const name = member?.name || `Пользователь ${p.userId}`
            const isPayer = p.isPayer
            return (
              <div key={p.id} className={styles.participantRow}>
                <div>
                  <span>
                    {name} {isPayer && '👑'}
                  </span>
                  <span className={styles.debt}>
                    Доля: {formatMoney(p.debt)} {currencySymbol}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {balanceInfo && (
          <div className={styles.paySection}>
            <button className={styles.payButton} onClick={handlePay}>
              Оплатить долг ({formatMoney(balanceInfo.remaining)} {currencySymbol})
            </button>
          </div>
        )}
      </div>

      {isEditModalOpen && expense && (
        <EditExpenseModal
          expense={{
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            payerId:
              normUserId(expense.participants.find((p) => p.isPayer)?.userId) ||
              normUserId(expense.participants[0]?.userId),
            participantIds: expense.participants.map((p) => normUserId(p.userId)).filter(Boolean),
          }}
          members={members}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdate}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Удаление расхода"
          message={`Вы уверены, что хотите удалить расход "${expense.description}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Удалить"
          cancelText="Отмена"
        />
      )}
    </>
  )
}

export default ExpenseDetail