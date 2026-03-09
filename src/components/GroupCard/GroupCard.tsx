import React from 'react';
import { Link } from 'react-router-dom';
import styles from './GroupCard.module.css';
import type { Group } from '../../types/group';

interface Props {
  group: Group;
}

const GroupCard: React.FC<Props> = ({ group }) => {
  const balance = group.userBalance ?? 0;
  const balanceSign = balance > 0 ? '+' : '';

  return (
    <Link to={`/groups/${group.id}`} className={styles.card}>
      <div className={styles.name}>{group.name}</div>

      <div className={styles.meta}>
        <span>
          Участников: {group.participants?.length || 0} &nbsp;
          Расходов: {group.expensesCount || 0}
        </span>
        <span>
          Обновлено:{' '}
          {group.updatedAt
            ? new Date(group.updatedAt).toLocaleDateString()
            : 'сегодня'}
        </span>
      </div>

      <div className={styles.balance}>
        Ваш баланс: {balanceSign}{balance.toLocaleString()} Р
      </div>
    </Link>
  );
};

export default GroupCard;