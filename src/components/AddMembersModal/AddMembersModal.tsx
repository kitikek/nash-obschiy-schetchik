// src/components/AddMembersModal/AddMembersModal.tsx
import React, { useState } from 'react';
import styles from './AddMembersModal.module.css';

interface Props {
  onClose: () => void;
  onAdd: (email: string) => Promise<void>;
}

const AddMembersModal: React.FC<Props> = ({ onClose, onAdd }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onAdd(email);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка добавления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Добавить участника</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email участника"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.buttons}>
            <button type="submit" disabled={loading}>
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
            <button type="button" onClick={onClose} className={styles.cancel} disabled={loading}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMembersModal;