import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GoBackButton.module.css';

const GoBackButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(-1)} className={styles.button}>
      ← Назад
    </button>
  );
};

export default GoBackButton;