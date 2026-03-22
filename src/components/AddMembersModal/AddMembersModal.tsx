import React, { useState } from 'react'
import styles from './AddMembersModal.module.css'
import { findUserByEmail } from '../../services/user'

interface Props {
  onClose: () => void
  onAdd: (userId: string) => Promise<void>
}

const AddMembersModal: React.FC<Props> = ({ onClose, onAdd }) => {
  const [email, setEmail] = useState('')
  const [foundUser, setFoundUser] = useState<{ id: string; name: string } | null>(null)
  const [searchError, setSearchError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail.includes('@')) {
      setSearchError('Введите корректный email')
      return
    }
    setSearchError('')
    setLoading(true)
    try {
      const user = await findUserByEmail(trimmedEmail)
      if (!user) {
        setSearchError('Пользователь с таким email не найден')
        setFoundUser(null)
        return
      }
      setFoundUser({ id: user.id, name: user.username })
      setSearchError('')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foundUser) {
      setSearchError('Сначала найдите пользователя')
      return
    }
    setSearchError('')
    setLoading(true)
    try {
      await onAdd(foundUser.id)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка добавления'
      setSearchError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Добавить участника</h2>
        <p className={styles.hint}>
          Введите email пользователя и нажмите "Найти". Добавлять участников может только
          администратор группы.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.searchRow}>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFoundUser(null); setSearchError('') }}
              disabled={loading}
            />
            <button type="button" onClick={handleSearch} disabled={loading || !email.trim()}>
              Найти
            </button>
          </div>
          {foundUser && (
            <div className={styles.foundUser}>
              <span className={styles.userName}>{foundUser.name}</span>
              <span className={styles.userEmail}>{email}</span>
            </div>
          )}
          {searchError && <div className={styles.error}>{searchError}</div>}
          <div className={styles.buttons}>
            <button type="submit" disabled={loading || !foundUser}>
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
