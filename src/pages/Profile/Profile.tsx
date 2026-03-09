import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTotalExpenses, getUserGroupsCount } from '../../services/user';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import styles from './Profile.module.css';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    if (user) {
      getUserGroupsCount(user.id).then(setTotalGroups);
      getUserTotalExpenses(user.id).then(setTotalExpenses);
    }
  }, [user]);

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Профиль</h2>
        <div className={styles.info}>
          <div className={styles.field}>
            <label>Имя:</label>
            <span>{user?.name || 'Анна'}</span>
          </div>
          <div className={styles.field}>
            <label>Email:</label>
            <span>{user?.email || 'anna@example.com'}</span>
          </div>
          <div className={styles.field}>
            <label>Всего групп:</label>
            <span>{totalGroups}</span>
          </div>
          <div className={styles.field}>
            <label>Общие траты:</label>
            <span>{totalExpenses.toLocaleString()} ₽</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;