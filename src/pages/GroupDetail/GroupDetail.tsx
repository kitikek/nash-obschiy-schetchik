import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import AddExpenseModal from './AddExpenseModal';
import AddMembersModal from '../../components/AddMembersModal/AddMembersModal';
import EditGroupModal from './EditGroupModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { getExpensesByGroup, createExpense } from '../../services/expenses';
import { getGroupMembers, addMemberToGroup, removeMemberFromGroup } from '../../services/members';
import { getGroupById, updateGroup, deleteGroup } from '../../services/groups';
import { calculateBalances } from '../../utils/calculateBalances';
import { formatMoney } from '../../utils/formatMoney';
import { getCurrencySymbol } from '../../utils/currency';
import type { Expense } from '../../types/expense';
import type { Transfer } from '../../types/transfer';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import ExpenseCard from '../../components/ExpenseCard/ExpenseCard';
import { useAuth } from '../../contexts/AuthContext';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import styles from './GroupDetail.module.css';

const GroupDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: number; name: string } | null>(null);
  const [group, setGroup] = useState<{
    id: number;
    name: string;
    description?: string;
    currency: string;
    authorId: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        getGroupMembers(id),
        getExpensesByGroup(id),
        getGroupById(Number(id))
      ]).then(([membersData, expensesData, groupData]) => {
        setMembers(membersData);
        setExpenses(expensesData);
        setGroup(groupData || null);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    const result = calculateBalances(expenses);
    setTransfers(result);
  }, [expenses]);

  const handleAddExpense = async (expenseData: {
    description: string;
    amount: number;
    date: string;
    payerId: number;
    participantIds: number[];
  }) => {
    if (!id) return;
    const newExpense = await createExpense(id, expenseData);
    setExpenses([...expenses, newExpense]);
  };

  const handleAddMember = async (email: string) => {
    if (!id) return;
    await addMemberToGroup(id, email);
    const updatedMembers = await getGroupMembers(id);
    setMembers(updatedMembers);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!id) return;
    await removeMemberFromGroup(id, userId);
    const updatedMembers = await getGroupMembers(id);
    setMembers(updatedMembers);
    setMemberToRemove(null);
  };

  const handleUpdateGroup = async (data: {
    name: string;
    description?: string;
    currency: string;
  }) => {
    if (!id) return;
    const updated = await updateGroup(Number(id), data);
    if (updated) {
      setGroup({
        id: updated.id,
        name: updated.name,
        description: updated.description,
        currency: updated.currency,
        authorId: updated.authorId,
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!id) return;
    await deleteGroup(Number(id));
    navigate('/groups');
  };

  const getUserName = (userId: number) => {
    return members.find(m => m.id === userId)?.name || `Пользователь ${userId}`;
  };

  const hasMembers = members.length > 0;

  if (loading) return <div className={styles.container}>Загрузка...</div>;
  if (!group) return <div className={styles.container}>Группа не найдена или была удалена</div>;

  const isCreator = user?.id === group.authorId;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <div className={styles.headerRow}>
          <h2 className={styles.title}>Расходы группы {group.name}</h2>
        </div>

        <ActionButtons
          primaryLabel="✏️ Редактировать группу"
          secondaryLabel="🗑️ Удалить группу"
          onPrimaryClick={() => setIsEditGroupModalOpen(true)}
          onSecondaryClick={() => setShowDeleteConfirm(true)}
        />

        {members.length > 0 && (
          <div className={styles.membersSection}>
            <h3 className={styles.membersTitle}>Участники ({members.length})</h3>
            <div className={styles.membersList}>
              {members.map(member => (
                <div key={member.id} className={styles.memberItem}>
                  <span>
                    {member.name}
                    {member.id === group.authorId && (
                      <span className={styles.creatorBadge}> (создатель)</span>
                    )}
                  </span>
                  {isCreator && member.id !== user?.id && (
                    <button
                      className={styles.removeMemberButton}
                      onClick={() => setMemberToRemove(member)}
                      aria-label="Удалить участника"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasMembers && (
          <p className={styles.noMembersMessage}>
            В группе пока нет участников. Добавьте участников, чтобы начать учитывать расходы.
          </p>
        )}

        {/* Кнопки: сначала добавить участников, потом добавить расход */}
        <div className={styles.actionButtons}>
          <button className="secondary" onClick={() => setIsMembersModalOpen(true)}>
            + Добавить участников
          </button>
          <button onClick={() => setIsExpenseModalOpen(true)} disabled={!hasMembers}>
            + Добавить расход
          </button>
        </div>

        <div className={styles.expenseList}>
          {expenses.map(exp => (
            <ExpenseCard
              key={exp.id}
              id={exp.id}
              description={exp.description}
              amount={exp.amount}
              date={exp.date}
              currency={group.currency}
              participants={exp.participants.map(p => ({
                userId: p.userId,
                name: getUserName(p.userId),
                debt: p.debt,
                isPayer: p.isPayer,
              }))}
            />
          ))}
        </div>

        <h3 className={styles.balancesTitle}>Кому и сколько должны</h3>
        <div className={styles.transfersList}>
          {transfers.length === 0 && <p className={styles.noBalances}>Все расчёты урегулированы</p>}
          {transfers.map((t, idx) => (
            <div key={idx} className={styles.transferItem}>
              <span>
                {getUserName(t.debtorId)} → {getUserName(t.creditorId)}
              </span>
              <strong>{formatMoney(t.amount)} {getCurrencySymbol(group.currency)}</strong>
            </div>
          ))}
        </div>

        {isExpenseModalOpen && (
          <AddExpenseModal
            members={members}
            onClose={() => setIsExpenseModalOpen(false)}
            onAdd={handleAddExpense}
            groupId={id!}
          />
        )}

        {isMembersModalOpen && (
          <AddMembersModal
            onClose={() => setIsMembersModalOpen(false)}
            onAdd={handleAddMember}
          />
        )}

        {isEditGroupModalOpen && group && (
          <EditGroupModal
            group={group}
            onClose={() => setIsEditGroupModalOpen(false)}
            onUpdate={handleUpdateGroup}
          />
        )}

        {showDeleteConfirm && (
          <ConfirmModal
            title="Удаление группы"
            message={`Вы уверены, что хотите удалить группу "${group.name}"? Все расходы и участники будут потеряны.`}
            onConfirm={handleDeleteGroup}
            onCancel={() => setShowDeleteConfirm(false)}
            confirmText="Удалить"
            cancelText="Отмена"
          />
        )}

        {memberToRemove && (
          <ConfirmModal
            title="Удаление участника"
            message={`Вы уверены, что хотите удалить участника "${memberToRemove.name}" из группы?`}
            onConfirm={() => handleRemoveMember(memberToRemove.id)}
            onCancel={() => setMemberToRemove(null)}
            confirmText="Удалить"
            cancelText="Отмена"
          />
        )}
      </div>
    </>
  );
};

export default GroupDetail;