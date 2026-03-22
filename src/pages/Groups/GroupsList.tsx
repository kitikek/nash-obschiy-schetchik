import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import GroupCard from '../../components/GroupCard/GroupCard'
import CreateGroupModal from '../../components/CreateGroupModal/CreateGroupModal'
import { useAuth } from '../../contexts/AuthContext'
import { getGroups, createGroup } from '../../services/groups'
import GoBackButton from '../../components/GoBackButton/GoBackButton'
import styles from './Groups.module.css'
import type { Group } from '../../types/group'

const GroupsList: React.FC = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    getGroups().then((allGroups) => {
      const mappedGroups = allGroups.map((g) => ({
        ...g,
        updatedAt: g.updatedAt || g.createdAt,
      }))
      setGroups(mappedGroups)
    })
  }, [user])

  const handleCreateGroup = async (groupData: { name: string; description?: string; currency: string }) => {
    const newGroup = await createGroup({
      name: groupData.name,
      description: groupData.description,
      currency: groupData.currency,
    })
    setGroups((prev) => [
      ...prev,
      {
        ...newGroup,
        participants: user ? [user] : [],
        expensesCount: 0,
        userBalance: newGroup.userBalance ?? 0,
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
