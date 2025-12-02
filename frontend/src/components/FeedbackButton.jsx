import { useState } from 'react';
import styles from '../styles/TopNav.module.css';

const FeedbackButton = ({ onFeedback }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.feedbackButton}
        onClick={onFeedback}
        aria-expanded={open}
      >
        💬 Feedback
      </button>
      {open && (
        <div
          className={styles.tooltip}
          role="dialog"
          aria-label="Feedback prompt"
        >
          <p>Share feedback to help us improve.</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackButton;
