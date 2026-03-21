import React, { useState, useEffect } from 'react';
import styles from './EditExpenseModal.module.css';

interface Member {
  id: number;
  name: string;
}

interface Props {
  expense: {
    id: number;
    description: string;
    amount: number;
    date: string;
    participants: Array<{ userId: number; shareAmount: number; isPayer: boolean }>;
  };
  members: Member[];
  onClose: () => void;
  onUpdate: (expenseData: {
    description: string;
    amount: number;
    date: string;
    participants: Array<{ userId: number; shareAmount: number; isPayer: boolean }>;
  }) => Promise<void>;
}

const EditExpenseModal: React.FC<Props> = ({ expense, members, onClose, onUpdate }) => {
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [date, setDate] = useState(expense.date);
  const [payerId, setPayerId] = useState<number>(expense.participants.find(p => p.isPayer)?.userId || 0);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>(expense.participants.map(p => p.userId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedParticipants(expense.participants.map(p => p.userId));
    setPayerId(expense.participants.find(p => p.isPayer)?.userId || 0);
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!description || !amount || !payerId || selectedParticipants.length < 2) {
      setError('Заполните все поля и выберите минимум двух участников');
      return;
    }
    if (!selectedParticipants.includes(payerId)) {
      setError('Плательщик должен быть среди участников');
      return;
    }
    const totalAmount = parseFloat(amount);
    const cents = Math.round(totalAmount * 100);
    const base = Math.floor(cents / selectedParticipants.length);
    const remainder = cents - base * selectedParticipants.length;
    const participants = selectedParticipants.map((userId, index) => ({
      userId,
      shareAmount: (base + (index === 0 ? remainder : 0)) / 100,
      isPayer: userId === payerId,
    }));

    setLoading(true);
    try {
      await onUpdate({
        description,
        amount: totalAmount,
        date,
        participants,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (memberId: number) => {
    setSelectedParticipants(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Редактировать расход</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Сумма"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div className={styles.section}>
            <label>Кто заплатил?</label>
            <div className={styles.radioGroup}>
              {members.map(member => (
                <label key={member.id} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="payer"
                    value={member.id}
                    checked={payerId === member.id}
                    onChange={() => setPayerId(member.id)}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <label>Участники расхода (кто делит сумму):</label>
            <div className={styles.checkboxGroup}>
              {members.map(member => (
                <label key={member.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(member.id)}
                    onChange={() => toggleParticipant(member.id)}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttons}>
            <button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" onClick={onClose} className={styles.cancel}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;