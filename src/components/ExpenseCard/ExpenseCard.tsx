import styles from "./ExpenseCard.module.css"

interface Props {
  title: string
  amount: number
  date: string
  payer: string
  share: number
}

const ExpenseCard = ({ title, amount, date, payer, share }: Props) => {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <strong>{title}</strong>
        <span>{amount} ₽</span>
      </div>

      <div className={styles.details}>
        <span>{date}</span>
        <span>Оплатил: {payer}</span>
      </div>

      <div className={styles.share}>
        Ваша доля: {share} ₽
      </div>
    </div>
  )
}

export default ExpenseCard
