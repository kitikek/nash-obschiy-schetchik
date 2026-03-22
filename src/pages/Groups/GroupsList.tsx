import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import GroupCard from '../../components/GroupCard/GroupCard'
import CreateGroupModal from '../../components/CreateGroupModal/CreateGroupModal'
import { useAuth } from '../../contexts/AuthContext'
import { getGroups, createGroup } from '../../services/groups'
import { getExpensesByGroup } from '../../services/expenses'
import { getGroupBalancesMe } from '../../services/balances'
import GoBackButton from '../../components/GoBackButton/GoBackButton'
import styles from './Groups.module.css'
import type { Group } from '../../types/group'

const GroupsList: React.FC = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
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

  const handleCreateGroup = async (groupData: { name: string; description?: string; currency: string; participantIds?: string[] }) => {
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
        <GoBackButton />
        <h2 className={styles.title}>Мои группы</h2>

        <button className={styles.createButton} onClick={() => setIsModalOpen(true)}>
          + Создать группу
        </button>

        <div className={styles.groupList}>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </div>

      {isModalOpen && (
        <CreateGroupModal onClose={() => setIsModalOpen(false)} onCreate={handleCreateGroup} />
      )}
    </>
  )
}

export default GroupsList