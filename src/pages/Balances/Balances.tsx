import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../../components/Navbar/Navbar";
import GoBackButton from "../../components/GoBackButton/GoBackButton";
import { useAuth } from "../../contexts/AuthContext";
import { getGroups } from "../../services/groups";
import { getGroupBalancesMe, payBalance } from "../../services/balances";
import { getGroupMembers } from "../../services/members";
import { getCurrencySymbol } from "../../utils/currency";
import { formatMoney } from "../../utils/formatMoney";
import styles from "./Balances.module.css";

interface Debt {
  to: string;
  amount: number;
  currency: string;
  groupName: string;
  groupId: string;
  debtorId: string;
  creditorId: string;
}

interface Credit {
  from: string;
  amount: number;
  currency: string;
  groupName: string;
  groupId: string;
  debtorId: string;
  creditorId: string;
}

const Balances: React.FC = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const groups = await getGroups();
    const debtsList: Debt[] = [];
    const creditsList: Credit[] = [];

    for (const group of groups) {
      let members: { id: string; name: string }[] = [];
      try {
        members = await getGroupMembers(group.id);
      } catch (error) {
        console.error(
          `Не удалось загрузить участников группы ${group.id}`,
          error,
        );
      }

      const getName = (id: string | number) => {
        const userId = String(id);
        const member = members.find((m) => String(m.id) === userId);
        return member?.name ?? `Пользователь ${userId}`;
      };

      const me = await getGroupBalancesMe(group.id);

      me.oweTo.forEach((row) => {
        debtsList.push({
          to: getName(row.userId),
          amount: row.amount,
          currency: group.currency,
          groupName: group.name,
          groupId: group.id,
          debtorId: user.id,
          creditorId: row.userId,
        });
      });

      me.owedBy.forEach((row) => {
        creditsList.push({
          from: getName(row.userId),
          amount: row.amount,
          currency: group.currency,
          groupName: group.name,
          groupId: group.id,
          debtorId: row.userId,
          creditorId: user.id,
        });
      });
    }

    setDebts(debtsList);
    setCredits(creditsList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePay = async (
    groupId: string,
    creditorId: string,
    debtorId: string,
    amount: number,
  ) => {
    try {
      await payBalance(groupId, creditorId, debtorId, amount);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Ошибка при оплате");
    }
  };

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
                  <span className={styles.itemText}>
                    {d.to} в группе «{d.groupName}»
                  </span>
                  <div className={styles.itemActions}>
                    <span className={styles.amount}>
                      {formatMoney(d.amount)} {getCurrencySymbol(d.currency)}
                    </span>
                    <button
                      className={styles.payButton}
                      onClick={() =>
                        handlePay(d.groupId, d.creditorId, d.debtorId, d.amount)
                      }
                    >
                      Оплатить
                    </button>
                  </div>
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
                  <span className={styles.itemText}>
                    {c.from} в группе «{c.groupName}»
                  </span>
                  <div className={styles.itemActions}>
                    <span className={styles.amount}>
                      {formatMoney(c.amount)} {getCurrencySymbol(c.currency)}
                    </span>
                  </div>
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
