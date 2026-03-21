import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import { useAuth } from '../../contexts/AuthContext';
import { getGroups } from '../../services/groups';
import { getExpensesByGroup } from '../../services/expenses';
import { calculateBalances } from '../../utils/calculateBalances';
import { getCurrencySymbol } from '../../utils/currency';
import { formatMoney } from '../../utils/formatMoney';
import type { Transfer } from '../../types/transfer';
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
        const expenses = await getExpensesByGroup(group.id);
        const transfers = calculateBalances(expenses);
        transfers.forEach((t: Transfer) => {
          if (t.debtorId === user.id) {
            const creditor = group.participants?.find(p => p.id === t.creditorId);
            debtsList.push({
              to: creditor?.name || `Пользователь ${t.creditorId}`,
              amount: t.amount,
              currency: group.currency,
              groupName: group.name,
            });
          } else if (t.creditorId === user.id) {
            const debtor = group.participants?.find(p => p.id === t.debtorId);
            creditsList.push({
              from: debtor?.name || `Пользователь ${t.debtorId}`,
              amount: t.amount,
              currency: group.currency,
              groupName: group.name,
            });
          }
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