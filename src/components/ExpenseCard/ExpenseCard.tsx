import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ExpenseCard.module.css';
import { formatMoney } from '../../utils/formatMoney';
import { getCurrencySymbol } from '../../utils/currency';

interface ExpenseCardProps {
  id: number;
  groupId: number;
  description: string;
  amount: number;
  date: string;
  groupName?: string;
  currency?: string;
  participants?: { userId: number; name: string; debt: number; isPayer: boolean }[];
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  id,
  groupId,
  description,
  amount,
  date,
  groupName,
  currency = 'RUB',
  participants = [],
}) => {
  return (
    <Link to={`/groups/${groupId}/expenses/${id}`} className={styles.card}>
      <div className={styles.header}>
        <strong>{description}</strong>
        <span>{formatMoney(amount)} {getCurrencySymbol(currency)}</span>
      </div>
      <div className={styles.meta}>
        {groupName && <span>{groupName}</span>}
        <span>{date}</span>
      </div>
      {participants.length > 0 && (
        <div className={styles.participants}>
          {participants.map(p => (
            <div key={p.userId} className={styles.participant}>
              <span>{p.name}</span>
              <span className={p.isPayer ? styles.payer : ''}>
                {p.isPayer ? '👑 ' : ''}{formatMoney(p.debt)} {getCurrencySymbol(currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
};

export default ExpenseCard;