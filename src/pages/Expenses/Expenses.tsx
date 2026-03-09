import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import { useAuth } from '../../contexts/AuthContext';
import { getUserExpenses } from '../../services/expenses';
import { getGroupById } from '../../services/groups';
import { formatMoney } from '../../utils/formatMoney';
import styles from './Expenses.module.css';

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [groupNames, setGroupNames] = useState<Record<number, string>>({});

  useEffect(() => {
    if (user) {
      getUserExpenses(user.id).then(async (data) => {
        setExpenses(data);
        // Загружаем названия групп
        const groupIds = [...new Set(data.map(e => e.groupId))];
        const names: Record<number, string> = {};
        await Promise.all(groupIds.map(async id => {
          const group = await getGroupById(id);
          if (group) names[id] = group.name;
        }));
        setGroupNames(names);
      });
    }
  }, [user]);

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Все расходы</h2>
        <div className={styles.expenseList}>
          {expenses.map(exp => (
            <Link to={`/expenses/${exp.id}`} key={exp.id} className={styles.expenseCard}>
              <div className={styles.expenseHeader}>
                <strong>{exp.description}</strong>
                <span>{formatMoney(exp.amount)} ₽</span>
              </div>
              <div className={styles.expenseMeta}>
                <span>{groupNames[exp.groupId] || 'Загрузка...'}</span>
                <span>{exp.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Expenses;