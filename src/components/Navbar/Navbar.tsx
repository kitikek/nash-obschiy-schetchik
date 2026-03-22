import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          Наш Общий Счетчик
        </Link>
        <div className={styles.links}>
          <Link to="/balances" className={styles.link}>
            Долги
          </Link>
          <Link to="/profile" className={styles.link}>
            {user?.name || 'Профиль'}
          </Link>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;