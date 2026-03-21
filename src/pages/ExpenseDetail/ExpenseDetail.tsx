import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import { useAuth } from '../../contexts/AuthContext';
import { getExpenseById, requestPayment, confirmPayment, updateExpense, deleteExpense } from '../../services/expenses';
import { getGroupById } from '../../services/groups';
import { getGroupMembers } from '../../services/members';
import { formatMoney } from '../../utils/formatMoney';
import { getCurrencySymbol } from '../../utils/currency';
import type { Expense } from '../../types/expense';
import styles from './ExpenseDetail.module.css';
import EditExpenseModal from './EditExpenseModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import ActionButtons from '../../components/ActionButtons/ActionButtons';

const ExpenseDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense & { currency: string } | null>(null);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleUpdate = async (data: {
    description: string;
    amount: number;
    date: string;
    payerId: number;
    participantIds: number[];
  }) => {
    if (!expense) return;
    const updated = await updateExpense(expense.id, {
      description: data.description,
      amount: data.amount,
      date: data.date,
      participants: data.participantIds.map((userId, idx) => ({
        id: 0,
        expenseId: expense.id,
        userId,
        debt: data.amount / data.participantIds.length,
        isPayer: userId === data.payerId,
        paid: expense.participants.find(p => p.userId === userId)?.paid || false,
        paymentRequested: expense.participants.find(p => p.userId === userId)?.paymentRequested || false,
      })),
    }, user!.id);
    setExpense({ ...updated, currency: expense.currency });
  };

  const handleDelete = () => {
    if (!expense) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!expense) return;
    await deleteExpense(expense.id);
    navigate(`/groups/${expense.groupId}`);
  };

  if (loading) return <div className={styles.container}>Загрузка...</div>;
  if (!expense || !user) return <div className={styles.container}>Расход не найден</div>;

  const payer = expense.participants.find(p => p.isPayer);
  const isCurrentUserPayer = payer?.userId === user!.id;
  const payerName = members.find(m => m.id === payer?.userId)?.name || 'Неизвестно';
  const currencySymbol = getCurrencySymbol(expense.currency);

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Детали расхода</h2>

        <ActionButtons
          primaryLabel="✏️ Редактировать"
          secondaryLabel="🗑️ Удалить"
          onPrimaryClick={() => setIsEditModalOpen(true)}
          onSecondaryClick={handleDelete}
        />

        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Описание:</span>
            <span>{expense.description}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Сумма:</span>
            <span>{formatMoney(expense.amount)} {currencySymbol}</span>
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
          <div className={styles.row}>
            <span className={styles.label}>Создан:</span>
            <span>
              {new Date(expense.createdAt).toLocaleString()} —{' '}
              {members.find(m => m.id === expense.createdBy)?.name || `Пользователь ${expense.createdBy}`}
            </span>
          </div>
          {expense.updatedAt && expense.updatedBy && (
            <div className={styles.row}>
              <span className={styles.label}>Изменён:</span>
              <span>
                {new Date(expense.updatedAt).toLocaleString()} —{' '}
                {members.find(m => m.id === expense.updatedBy)?.name || `Пользователь ${expense.updatedBy}`}
              </span>
            </div>
          )}
        </div>

        <h3 className={styles.subtitle}>Участники</h3>
        <div className={styles.participants}>
          {expense.participants.map(p => {
            const member = members.find(m => m.id === p.userId);
            const name = member?.name || `Пользователь ${p.userId}`;
            const isPayer = p.isPayer;
            const isCurrent = p.userId === user!.id;

            if (!isCurrentUserPayer && !isCurrent) return null;

            return (
              <div key={p.id} className={styles.participantRow}>
                <div>
                  <span>{name} {isPayer && '👑'}</span>
                  <span className={styles.debt}>Доля: {formatMoney(p.debt)} {currencySymbol}</span>
                </div>
                <div className={styles.status}>
                  {isPayer ? (
                    <span className={styles.paid}>Оплатил (организатор)</span>
                  ) : isCurrentUserPayer ? (
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

      {isEditModalOpen && expense && (
        <EditExpenseModal
          expense={{
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            payerId: expense.participants.find(p => p.isPayer)?.userId || 0,
            participantIds: expense.participants.map(p => p.userId),
          }}
          members={members}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdate}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Удаление расхода"
          message={`Вы уверены, что хотите удалить расход "${expense.description}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Удалить"
          cancelText="Отмена"
        />
      )}
    </>
  );
};

export default ExpenseDetail;