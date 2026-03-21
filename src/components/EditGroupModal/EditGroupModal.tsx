import React, { useState } from 'react';
import styles from './EditGroupModal.module.css';

interface Props {
  group: {
    id: number;
    name: string;
    description: string;
    currency: string;
  };
  onClose: () => void;
  onUpdate: (data: { name: string; description: string; currency: string }) => Promise<void>;
}

const EditGroupModal: React.FC<Props> = ({ group, onClose, onUpdate }) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [currency, setCurrency] = useState(group.currency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Название группы не может быть пустым');
      return;
    }
    setLoading(true);
    try {
      await onUpdate({ name, description, currency });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Редактировать группу</h2>
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

export default EditGroupModal;