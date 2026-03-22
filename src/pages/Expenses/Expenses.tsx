import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import GoBackButton from '../../components/GoBackButton/GoBackButton'
import ExpenseCard from '../../components/ExpenseCard/ExpenseCard'
import { useAuth } from '../../contexts/AuthContext'
import { getUserExpensesAggregated } from '../../services/expenses'
import styles from './Expenses.module.css'

const Expenses: React.FC = () => {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<
    Array<{
      id: string
      groupId: string
      description: string
      amount: number
      date: string
      groupName: string
      currency: string
    }>
  >([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    if (!user) return
    getUserExpensesAggregated({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      limitPerGroup: 500,
    }).then(setExpenses)
  }, [user, fromDate, toDate])

  const slice = expenses.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(expenses.length / pageSize))

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Все расходы</h2>
        <div className={styles.filters}>
          <label>
            С:&nbsp;
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            По:&nbsp;
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
        </div>
        <div className={styles.expenseList}>
          {slice.map((exp) => (
            <ExpenseCard
              key={`${exp.groupId}-${exp.id}`}
              id={exp.id}
              groupId={exp.groupId}
              description={exp.description}
              amount={exp.amount}
              date={exp.date}
              groupName={exp.groupName || 'Группа'}
              currency={exp.currency}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Назад
            </button>
            <span>
              Стр. {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Вперёд
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default Expenses
