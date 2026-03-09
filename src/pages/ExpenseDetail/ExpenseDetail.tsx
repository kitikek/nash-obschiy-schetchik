import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import { useAuth } from '../../contexts/AuthContext';
import { getExpenseById, requestPayment, confirmPayment } from '../../services/expenses';
import { getGroupById } from '../../services/groups';
import { getGroupMembers } from '../../services/members';
import { formatMoney } from '../../utils/formatMoney';
import type { Expense } from '../../types/expense';
import type { ExpenseParticipant } from '../../types/expenseParticipant';
import styles from './ExpenseDetail.module.css';

const ExpenseDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      const expenseId = parseInt(id, 10);
      getExpenseById(expenseId).then(async (exp) => {
        if (exp) {
          setExpense(exp);
          const group = await getGroupById(exp.groupId);
          setGroupName(group?.name || '');
          const groupMembers = await getGroupMembers(exp.groupId.toString());
          setMembers(groupMembers);
        }
        setLoading(false);
      });
    }
  }, [id, user]);

  const handleRequestPayment = async (participantId: number) => {
    try {
      await requestPayment(participantId);
      setExpense(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map(p =>
            p.id === participantId ? { ...p, paymentRequested: true } : p
          ),
        };
      });
    } catch (error) {
      console.error('Ошибка при запросе оплаты', error);
    }
  };

  const handleConfirmPayment = async (participantId: number) => {
    try {
      await confirmPayment(participantId);
      setExpense(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map(p =>
            p.id === participantId ? { ...p, paid: true, paymentRequested: false } : p
          ),
        };
      });
    } catch (error) {
      console.error('Ошибка при подтверждении оплаты', error);
    }
  };

  if (loading) return <div className={styles.container}>Загрузка...</div>;
  if (!expense || !user) return <div className={styles.container}>Расход не найден</div>;

  const payer = expense.participants.find(p => p.isPayer);
  const isCurrentUserPayer = payer?.userId === user.id;
  const payerName = members.find(m => m.id === payer?.userId)?.name || 'Неизвестно';

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Детали расхода</h2>

        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Описание:</span>
            <span>{expense.description}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Сумма:</span>
            <span>{formatMoney(expense.amount)} ₽</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Дата:</span>
            <span>{expense.date}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Группа:</span>
            <span>{groupName}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Плательщик:</span>
            <span>{payerName}</span>
          </div>
        </div>

        <h3 className={styles.subtitle}>Участники</h3>
        <div className={styles.participants}>
          {expense.participants.map(p => {
            const member = members.find(m => m.id === p.userId);
            const name = member?.name || `Пользователь ${p.userId}`;
            const isPayer = p.isPayer;
            const isCurrent = p.userId === user.id;

            // Плательщик видит всех, остальные — только себя
            if (!isCurrentUserPayer && !isCurrent) return null;

            return (
              <div key={p.id} className={styles.participantRow}>
                <div>
                  <span>{name} {isPayer && '👑'}</span>
                  <span className={styles.debt}>Доля: {formatMoney(p.debt)} ₽</span>
                </div>
                <div className={styles.status}>
                  {isPayer ? (
                    <span className={styles.paid}>Оплатил (организатор)</span>
                  ) : isCurrentUserPayer ? (
                    // Плательщик видит запросы и может подтвердить
                    p.paymentRequested ? (
                      <button
                        className={styles.confirmButton}
                        onClick={() => handleConfirmPayment(p.id)}
                      >
                        Подтвердить оплату
                      </button>
                    ) : p.paid ? (
                      <span className={styles.paid}>✅ Оплачено</span>
                    ) : (
                      <span className={styles.unpaid}>⏳ Ожидание</span>
                    )
                  ) : isCurrent ? (
                    // Текущий неплательщик видит свой статус и может запросить подтверждение
                    p.paid ? (
                      <span className={styles.paid}>✅ Оплачено</span>
                    ) : p.paymentRequested ? (
                      <span className={styles.pending}>⏳ Ожидает подтверждения</span>
                    ) : (
                      <button
                        className={styles.requestButton}
                        onClick={() => handleRequestPayment(p.id)}
                      >
                        Я оплатил
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ExpenseDetail;