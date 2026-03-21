import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import { useAuth } from '../../contexts/AuthContext';
import { getExpenseById, updateExpense, deleteExpense, getMyBalances, payGroupBalance } from '../../services/expenses';
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
  const [groupBalances, setGroupBalances] = useState<Array<{ balance_id: number; user_id: number; amount: number }>>([]);

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
          const myBalances = await getMyBalances(exp.groupId, user.id);
          setGroupBalances(myBalances.owe_to);
        }
        setLoading(false);
      });
    }
  }, [id, user]);

  const handleUpdate = async (data: {
    description: string;
    amount: number;
    date: string;
    participants: Array<{ userId: number; shareAmount: number; isPayer: boolean }>;
  }) => {
    if (!expense) return;
    const updated = await updateExpense(expense.id, {
      description: data.description,
      amount: data.amount,
      date: data.date,
      participants: data.participants,
    }, user!.id);
    setExpense({ ...updated, currency: expense.currency });
  };

  const handlePayBalance = async (balanceId: number, amount: number) => {
    if (!expense) return;
    await payGroupBalance(expense.groupId, balanceId, amount);
    const myBalances = await getMyBalances(expense.groupId, user!.id);
    setGroupBalances(myBalances.owe_to);
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

            return (
              <div key={p.id} className={styles.participantRow}>
                <div>
                  <span>{name} {isPayer && '👑'}</span>
                  <span className={styles.debt}>Доля: {formatMoney(p.shareAmount)} {currencySymbol}</span>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className={styles.subtitle}>Погашение ваших долгов по группе</h3>
        <div className={styles.participants}>
          {groupBalances.length === 0 ? (
            <p className={styles.paid}>У вас нет непогашенных долгов по этой группе</p>
          ) : (
            groupBalances.map(b => {
              const creditorName = members.find(m => m.id === b.user_id)?.name || `Пользователь ${b.user_id}`;
              return (
                <div key={b.balance_id} className={styles.participantRow}>
                  <span>Вы должны: {creditorName}</span>
                  <button className={styles.confirmButton} onClick={() => handlePayBalance(b.balance_id, b.amount)}>
                    Оплатить {formatMoney(b.amount)} {currencySymbol}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isEditModalOpen && expense && (
        <EditExpenseModal
          expense={{
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            participants: expense.participants.map(p => ({ userId: p.userId, shareAmount: p.shareAmount, isPayer: p.isPayer })),
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