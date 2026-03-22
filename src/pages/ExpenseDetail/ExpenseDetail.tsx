import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import GoBackButton from '../../components/GoBackButton/GoBackButton'
import { useAuth } from '../../contexts/AuthContext'
import { getExpenseById, updateExpense, deleteExpense } from '../../services/expenses'
import { getGroupById } from '../../services/groups'
import { getGroupMembers } from '../../services/members'
import { formatMoney } from '../../utils/formatMoney'
import { getCurrencySymbol } from '../../utils/currency'
import type { Expense } from '../../types/expense'
import styles from './ExpenseDetail.module.css'
import EditExpenseModal from './EditExpenseModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import ActionButtons from '../../components/ActionButtons/ActionButtons'
import { ApiError } from '../../services/api'

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
        const groupMembers = await getGroupMembers(groupId.toString())
        setMembers(groupMembers.map((m) => ({ id: m.id, name: m.name })))
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
        <p className={styles.hint}>Статусы «оплачено» между участниками ведётся через балансы группы на сервере.</p>
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
      </div>

      {isEditModalOpen && expense && (
        <EditExpenseModal
          expense={{
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            payerId: expense.participants.find((p) => p.isPayer)?.userId || 0,
            participantIds: expense.participants.map((p) => p.userId),
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
