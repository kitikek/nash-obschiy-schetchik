import React, { useState } from 'react'
import styles from './AddMembersModal.module.css'

interface Props {
  onClose: () => void
  onAdd: (userId: number) => Promise<void>
}

const AddMembersModal: React.FC<Props> = ({ onClose, onAdd }) => {
  const [userIdRaw, setUserIdRaw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const userId = parseInt(userIdRaw.trim(), 10)
    if (!Number.isFinite(userId) || userId <= 0) {
      setError('Введите корректный числовой ID пользователя')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onAdd(userId)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка добавления'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Добавить участника</h2>
        <p className={styles.hint}>
          Укажите числовой ID пользователя (его можно посмотреть в профиле). Добавлять участников может только
          администратор группы.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="number"
            min={1}
            step={1}
            placeholder="ID пользователя"
            value={userIdRaw}
            onChange={(e) => setUserIdRaw(e.target.value)}
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
  )
}

export default AddMembersModal
