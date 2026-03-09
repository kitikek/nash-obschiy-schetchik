import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import GroupCard from '../../components/GroupCard/GroupCard';
import CreateGroupModal from '../../components/CreateGroupModal/CreateGroupModal';
import { useAuth } from '../../contexts/AuthContext';
import { getGroups, createGroup } from '../../services/groups';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import { calculateUserBalance } from '../../utils/calculateUserBalance';
import styles from './Groups.module.css';
import type { Group } from '../../types/group';

const GroupsList: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getGroups().then(allGroups => {
      const mappedGroups = allGroups.map(g => ({
        ...g,
        expensesCount: g.expenses?.length || 0,
        userBalance: user ? calculateUserBalance(g, user.id) : 0,
        updatedAt: g.updatedAt || g.createdAt
      }));
      setGroups(mappedGroups);
    });
  }, [user]);

  const handleCreateGroup = async (groupData: { name: string; description?: string; currency: string }) => {
    if (!user) return;
    const newGroup = await createGroup({ ...groupData, authorId: user.id });
        setGroups(prev => [
        ...prev,
        {
            ...newGroup,
            participants: [user],
            expenses: [], // добавить
            expensesCount: 0,
            userBalance: 0,
            updatedAt: newGroup.createdAt
        }
        ]);
  };

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
          {groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </div>

      {isModalOpen && (
        <CreateGroupModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </>
  );
};

export default GroupsList;