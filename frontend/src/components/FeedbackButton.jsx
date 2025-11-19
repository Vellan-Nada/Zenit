import { useRef, useState } from 'react';
import styles from '../styles/TopNav.module.css';

const FeedbackButton = ({ onFeedback }) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className={styles.feedbackButton}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        onMouseLeave={scheduleClose}
      >
        💬 Feedback
      </button>
      {open && (
        <div
          className={styles.tooltip}
          role="dialog"
          aria-label="Feedback prompt"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <p>Give feedback</p>
          <button type="button" onClick={onFeedback}>
            Open form
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackButton;
