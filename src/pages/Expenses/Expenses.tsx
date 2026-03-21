import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import ExpenseCard from '../../components/ExpenseCard/ExpenseCard';
import { useAuth } from '../../contexts/AuthContext';
import { getUserExpenses } from '../../services/expenses';
import styles from './Expenses.module.css';

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      getUserExpenses(user.id).then(setExpenses);
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
            <ExpenseCard
              key={exp.id}
              id={exp.id}
              description={exp.description}
              amount={exp.amount}
              date={exp.date}
              groupName={exp.groupName || 'Группа'}
              currency={exp.currency}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Expenses;