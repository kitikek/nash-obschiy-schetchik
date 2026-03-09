import React, { useState } from 'react';
import styles from './CreateGroupModal.module.css';

interface Props {
  onClose: () => void;
  onCreate: (groupData: { name: string; description: string; currency: string }) => void;
}

const CreateGroupModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('RUB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name, description, currency });
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