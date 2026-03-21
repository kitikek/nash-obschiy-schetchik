import React from 'react';
import styles from './ActionButtons.module.css';

interface ActionButtonsProps {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  primaryDisabled = false,
  secondaryDisabled = false,
}) => {
  return (
    <div className={styles.container}>
      <button
        className={styles.primaryButton}
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
      >
        {primaryLabel}
      </button>
      <button
        className={styles.secondaryButton}
        onClick={onSecondaryClick}
        disabled={secondaryDisabled}
      >
        {secondaryLabel}
      </button>
    </div>
  );
};

export default ActionButtons;