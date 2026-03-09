import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import AddExpenseModal from './AddExpenseModal';
import AddMembersModal from '../../components/AddMembersModal/AddMembersModal';
import { getExpensesByGroup, createExpense } from '../../services/expenses';
import { getGroupMembers, addMemberToGroup } from '../../services/members';
import { getGroupById } from '../../services/groups';
import { calculateBalances } from '../../utils/calculateBalances';
import { formatMoney } from '../../utils/formatMoney';
import type { Expense } from '../../types/expense';
import type { Transfer } from '../../types/transfer';
import GoBackButton from '../../components/GoBackButton/GoBackButton';
import styles from './GroupDetail.module.css';

const GroupDetail: React.FC = () => {
  const { id } = useParams();
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupAuthorId, setGroupAuthorId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      Promise.all([
        getGroupMembers(id),
        getExpensesByGroup(id),
        getGroupById(Number(id))
      ]).then(([membersData, expensesData, group]) => {
        setMembers(membersData);
        setExpenses(expensesData);
        setGroupName(group?.name || '');
        setGroupAuthorId(group?.authorId || null);
      });
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

  const getUserName = (userId: number) => {
    return members.find(m => m.id === userId)?.name || `Пользователь ${userId}`;
  };

  const hasMembers = members.length > 0;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Расходы группы {groupName}</h2>

        <div className={styles.actionButtons}>
          <button
            className={styles.addButton}
            onClick={() => setIsExpenseModalOpen(true)}
            disabled={!hasMembers}
            title={!hasMembers ? 'Добавьте участников, чтобы создавать расходы' : ''}
          >
            + Добавить расход
          </button>

          <button
            className={styles.addMemberButton}
            onClick={() => setIsMembersModalOpen(true)}
          >
            + Добавить участников
          </button>
        </div>

        {members.length > 0 && (
          <div className={styles.membersSection}>
            <h3 className={styles.membersTitle}>Участники ({members.length})</h3>
            <div className={styles.membersList}>
              {members.map(member => (
                <div key={member.id} className={styles.memberItem}>
                  <span>{member.name}</span>
                  {member.id === groupAuthorId && (
                    <span className={styles.creatorBadge}>создатель</span>
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

        <div className={styles.expenseList}>
          {expenses.map(exp => (
            <Link to={`/expenses/${exp.id}`} key={exp.id} className={styles.expenseCardLink}>
              <div className={styles.expenseCard}>
                <div className={styles.expenseHeader}>
                  <strong>{exp.description}</strong>
                  <span>{formatMoney(exp.amount)} ₽</span>
                </div>
                <div className={styles.expenseDate}>{exp.date}</div>
                <div className={styles.expenseParticipants}>
                  {exp.participants.map(p => (
                    <div key={p.id} className={styles.participantRow}>
                      <span>{getUserName(p.userId)}</span>
                      <span className={p.isPayer ? styles.payer : ''}>
                        {p.isPayer ? '👑 ' : ''}{formatMoney(p.debt)} ₽
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
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
              <strong>{formatMoney(t.amount)} ₽</strong>
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
      </div>
    </>
  );
};

export default GroupDetail;