import { useState } from 'react';
import styles from '../styles/TopNav.module.css';

const MessageSquareIcon = ({ size = 18, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
  </svg>
);

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
        <MessageSquareIcon size={18} aria-hidden="true" />
        Feedback
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
