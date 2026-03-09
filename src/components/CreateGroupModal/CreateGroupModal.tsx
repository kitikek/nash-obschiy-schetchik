import React, { useState } from 'react';
import styles from './CreateGroupModal.module.css';

interface Participant {
  email: string;
  name?: string;
}

interface Props {
  onClose: () => void;
  onCreate: (groupData: {
    name: string;
    description: string;
    currency: string;
    participants: Participant[];
  }) => void;
}

const CreateGroupModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const handleAddParticipant = () => {
    if (!participantEmail.trim()) return;
    if (!participantEmail.includes('@')) {
      alert('Введите корректный email');
      return;
    }
    setParticipants([...participants, { email: participantEmail }]);
    setParticipantEmail('');
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter(p => p.email !== email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name, description, currency, participants });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Создать группу</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Название группы"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Описание (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="RUB">🇷🇺 RUB</option>
            <option value="USD">🇺🇸 USD</option>
            <option value="EUR">🇪🇺 EUR</option>
          </select>

          <div className={styles.participantSection}>
            <label>Участники (по email):</label>
            <div className={styles.addParticipant}>
              <input
                type="email"
                placeholder="email@example.com"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
              />
              <button type="button" onClick={handleAddParticipant} className={styles.addButton}>
                Добавить
              </button>
            </div>
            <div className={styles.participantList}>
              {participants.map(p => (
                <div key={p.email} className={styles.participantItem}>
                  <span>{p.email}</span>
                  <button type="button" onClick={() => handleRemoveParticipant(p.email)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.buttons}>
            <button type="submit">Создать</button>
            <button type="button" onClick={onClose} className={styles.cancel}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;