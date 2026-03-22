import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMe, type MeStats } from "../../services/user";
import GoBackButton from "../../components/GoBackButton/GoBackButton";
import styles from "./Profile.module.css";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MeStats | null>(null);

  useEffect(() => {
    fetchMe()
      .then(({ stats: s }) => setStats(s))
      .catch(() => setStats(null));
  }, []);

  const turnover =
    stats?.total_turnover != null
      ? typeof stats.total_turnover === "string"
        ? parseFloat(stats.total_turnover)
        : stats.total_turnover
      : null;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <GoBackButton />
        <h2 className={styles.title}>Профиль</h2>
        <div className={styles.info}>
          <div className={styles.field}>
            <label>Имя:</label>
            <span>{user?.name ?? "—"}</span>
          </div>
          <div className={styles.field}>
            <label>Email:</label>
            <span>{user?.email ?? "—"}</span>
          </div>
          <div className={styles.field}>
            <label>Ваш ID:</label>
            <span>{user?.id ?? "—"}</span>
          </div>
          <div className={styles.field}>
            <label>Всего групп:</label>
            <span>{stats?.groups_count ?? "—"}</span>
          </div>
          <div className={styles.field}>
            <label>Расходов (записей):</label>
            <span>{stats?.expenses_count ?? "—"}</span>
          </div>
          <div className={styles.field}>
            <label>Оборот (все группы):</label>
            <span>
              {turnover != null && !Number.isNaN(turnover)
                ? turnover.toLocaleString("ru-RU") + " ₽"
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
