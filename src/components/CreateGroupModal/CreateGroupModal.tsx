import React, { useState } from 'react';
import styles from './CreateGroupModal.module.css';
import { findUserByEmail } from '../../services/user';

interface Participant {
  id: string;
  email: string;
  name: string;
}

interface Props {
  onClose: () => void;
  onCreate: (groupData: {
    name: string;
    description: string;
    currency: string;
    participantIds: string[];
  }) => void;
}

const CreateGroupModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleAddParticipant = async () => {
    const email = participantEmail.trim();
    if (!email) return;
    if (!email.includes('@')) {
      setSearchError('Введите корректный email');
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        setSearchError('Пользователь с таким email не найден');
        return;
      }
      if (participants.some(p => p.email === email)) {
        setSearchError('Этот пользователь уже добавлен');
        return;
      }
      setParticipants([...participants, { id: user.id, email, name: user.username }]);
      setParticipantEmail('');
    } finally {
      setSearching(false);
    }
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter(p => p.email !== email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name,
      description,
      currency,
      participantIds: participants.map((p) => String(p.id).trim()).filter(Boolean),
    });
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
                onChange={(e) => { setParticipantEmail(e.target.value); setSearchError(''); }}
                disabled={searching}
              />
              <button type="button" onClick={handleAddParticipant} className={styles.addButton} disabled={searching}>
                {searching ? '...' : 'Добавить'}
              </button>
            </div>
            {searchError && <div className={styles.error}>{searchError}</div>}
            <div className={styles.participantList}>
              {participants.map(p => (
                <div key={p.email} className={styles.participantItem}>
                  <span className={styles.participantName}>{p.name}</span>
                  <span className={styles.participantEmail}>{p.email}</span>
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