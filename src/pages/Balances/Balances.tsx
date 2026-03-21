import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import { useAuth } from '../../contexts/AuthContext';
import { getGroups } from '../../services/groups';
import { getMyBalances } from '../../services/expenses';
import { getCurrencySymbol } from '../../utils/currency';
import { formatMoney } from '../../utils/formatMoney';
import styles from './Balances.module.css';

const Balances: React.FC = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Array<{ to: string; amount: number; currency: string; groupName: string }>>([]);
  const [credits, setCredits] = useState<Array<{ from: string; amount: number; currency: string; groupName: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBalances = async () => {
      const groups = await getGroups();
      const debtsList: typeof debts = [];
      const creditsList: typeof credits = [];

      for (const group of groups) {
        const my = await getMyBalances(group.id, user.id);
        my.owe_to.forEach((item: { user_id: number; amount: number }) => {
          const creditor = group.participants?.find(p => p.id === item.user_id);
          debtsList.push({
            to: creditor?.name || `Пользователь ${item.user_id}`,
            amount: item.amount,
            currency: group.currency,
            groupName: group.name,
          });
        });
        my.owed_by.forEach((item: { user_id: number; amount: number }) => {
          const debtor = group.participants?.find(p => p.id === item.user_id);
          creditsList.push({
            from: debtor?.name || `Пользователь ${item.user_id}`,
            amount: item.amount,
            currency: group.currency,
            groupName: group.name,
          });
        });
      }
      setDebts(debtsList);
      setCredits(creditsList);
      setLoading(false);
    };

    fetchBalances();
  }, [user]);

  if (loading) return <div className={styles.container}>Загрузка...</div>;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Ваши долги</h2>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Вы должны</h3>
          {debts.length === 0 ? (
            <p className={styles.empty}>Нет долгов</p>
          ) : (
            <ul className={styles.list}>
              {debts.map((d, idx) => (
                <li key={idx} className={styles.item}>
                  <span>
                    {d.to} в группе «{d.groupName}»
                  </span>
                  <span className={styles.amount}>
                    {formatMoney(d.amount)} {getCurrencySymbol(d.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Должны вам</h3>
          {credits.length === 0 ? (
            <p className={styles.empty}>Нет долгов</p>
          ) : (
            <ul className={styles.list}>
              {credits.map((c, idx) => (
                <li key={idx} className={styles.item}>
                  <span>
                    {c.from} в группе «{c.groupName}»
                  </span>
                  <span className={styles.amount}>
                    {formatMoney(c.amount)} {getCurrencySymbol(c.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default Balances;