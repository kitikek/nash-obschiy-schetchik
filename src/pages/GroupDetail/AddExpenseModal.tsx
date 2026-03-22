import React, { useState } from 'react';
import styles from './AddExpenseModal.module.css';

interface Member {
  id: string;
  name: string;
}

interface Props {
  groupId: string;
  members: Member[];          // список участников группы
  onClose: () => void;
  onAdd: (expenseData: {
    description: string;
    amount: number;
    date: string;
    payerId: string;
    participantIds: string[];
  }) => Promise<void>;
}
const AddExpenseModal: React.FC<Props> = ({ members, onClose, onAdd }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState<string>(members[0]?.id || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    members.map(m => m.id)
  );

  const [participantsError, setParticipantsError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setParticipantsError('');

    if (!description || !amount || !payerId) {
        alert('Заполните все поля');
        return;
    }

    if (selectedParticipants.length < 2) {
        setParticipantsError('По правилам сервера в расходе должны участвовать минимум 2 человека');
        return;
    }

    if (!selectedParticipants.includes(payerId)) {
        setParticipantsError('Плательщик должен быть среди участников');
        return;
    }

    setLoading(true);
    try {
      await onAdd({
        description,
        amount: parseFloat(amount),
        date,
        payerId,
        participantIds: selectedParticipants,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось сохранить расход';
      setParticipantsError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Добавить расход</h2>
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

          {participantsError && (
            <div className={styles.errorMessage}>{participantsError}</div>
            )}

          <div className={styles.buttons}>
            <button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Добавить'}</button>
            <button type="button" onClick={onClose} className={styles.cancel} disabled={loading}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;