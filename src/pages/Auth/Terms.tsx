import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Auth.module.css';

const Terms: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Условия использования</h2>
      <div className={styles.termsContent}>
        <p>Это демонстрационный проект «Наш Общий Счётчик». Все данные хранятся локально и используются только для отработки функционала.</p>
        <p>Регистрируясь, вы соглашаетесь с тем, что:</p>
        <ul>
          <li>Вы ознакомлены с учебным характером приложения.</li>
          <li>Не будете использовать приложение в реальных финансовых операциях без проверки данных.</li>
          <li>Разработчики не несут ответственности за возможные ошибки расчётов.</li>
        </ul>
        <p>Для реального использования рекомендуется дождаться полноценного запуска с защитой данных.</p>
      </div>
      <p className={styles.switch}>
        <Link to="/register">Вернуться к регистрации</Link>
      </p>
    </div>
  );
};

export default Terms;