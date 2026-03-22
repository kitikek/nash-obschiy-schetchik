import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import CreateGroupModal from '../../components/CreateGroupModal/CreateGroupModal'
import GroupCard from '../../components/GroupCard/GroupCard'
import ExpenseCard from '../../components/ExpenseCard/ExpenseCard'
import { useAuth } from '../../contexts/AuthContext'
import { getRecentExpenses } from '../../services/recent'
import { createGroup, getGroups } from '../../services/groups'
import { getExpensesByGroup } from '../../services/expenses'
import { getGroupBalancesMe } from '../../services/balances'
import styles from './Dashboard.module.css'
import type { Group } from '../../types/group'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  const [greeting, setGreeting] = useState('')
  const [search, setSearch] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [recentExpenses, setRecentExpenses] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [expenseSearch, setExpenseSearch] = useState('')
  const [filteredRecent, setFilteredRecent] = useState<any[]>([])

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Доброе утро')
    else if (hour < 18) setGreeting('Добрый день')
    else setGreeting('Добрый вечер')
  }, [])

  useEffect(() => {
    getRecentExpenses(20).then((data) => {
      setRecentExpenses(data)
      setFilteredRecent(data)
    })

    getGroups().then(async (allGroups) => {
      const groupsWithData = await Promise.all(
        allGroups.map(async (group) => {
          try {
            const { total } = await getExpensesByGroup(group.id, { page: 1, limit: 1 })
            const { oweTo, owedBy } = await getGroupBalancesMe(group.id)
            const totalOwe = oweTo.reduce((sum, row) => sum + row.amount, 0)
            const totalOwed = owedBy.reduce((sum, row) => sum + row.amount, 0)
            const balance = totalOwed - totalOwe
            return { ...group, expensesCount: total, userBalance: balance }
          } catch {
            return { ...group, expensesCount: 0, userBalance: 0 }
          }
        })
      )
      setGroups(groupsWithData)
    })
  }, [user])

  useEffect(() => {
    setFilteredGroups(groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())))
  }, [search, groups])

  useEffect(() => {
    setFilteredRecent(
      recentExpenses.filter((exp) => exp.description.toLowerCase().includes(expenseSearch.toLowerCase()))
    )
  }, [expenseSearch, recentExpenses])

  const handleCreateGroup = async (groupData: {
    name: string
    description?: string
    currency: string
    participantIds?: string[]
  }) => {
    const newGroup = await createGroup({
      name: groupData.name,
      description: groupData.description,
      currency: groupData.currency,
      participantIds: groupData.participantIds,
    })
    setGroups((prev) => [
      ...prev,
      {
        ...newGroup,
        participants: user ? [user] : [],
        expensesCount: 0,
        userBalance: 0,
        updatedAt: newGroup.createdAt,
      },
    ])
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h2 className={styles.greeting}>
          {greeting}, {user?.name || 'гость'}!
        </h2>

        <section className={styles.groupsSection}>
          <div className={styles.groupsHeader}>
            <h3 className={styles.sectionTitle}>Мои группы ({groups.length})</h3>
            <Link to="/groups" className={styles.viewAllLink}>
              Смотреть все
            </Link>
          </div>

          <button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
            + Создать группу
          </button>

          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Поиск групп..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          {filteredGroups.length === 0 && <p className={styles.emptyText}>Групп пока нет</p>}

          <div className={styles.groupsList}>
            {filteredGroups.slice(0, 4).map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>

        <section className={styles.recentSection}>
          <div className={styles.recentHeader}>
            <h3 className={styles.sectionTitle}>Последние платежи</h3>
            <Link to="/expenses" className={styles.viewAllLink}>
              Смотреть все
            </Link>
          </div>

          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Поиск платежей..."
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          <div className={styles.recentList}>
            {filteredRecent.slice(0, 4).map((exp) => (
              <ExpenseCard
                key={`${exp.groupId}-${exp.id}`}
                id={exp.id}
                groupId={exp.groupId}
                description={exp.description}
                amount={exp.amount}
                date={exp.date}
                groupName={exp.groupName}
                currency={exp.currency}
              />
            ))}
          </div>
        </section>
      </div>

      {isCreateModalOpen && (
        <CreateGroupModal onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateGroup} />
      )}
    </>
  )
}

export default Dashboard