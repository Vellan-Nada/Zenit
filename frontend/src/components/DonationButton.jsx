import { useRef, useState } from 'react';
import styles from '../styles/TopNav.module.css';

const DonationButton = ({ onDonate }) => {
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
        className={styles.pillButton}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        onMouseLeave={scheduleClose}
      >
        <span aria-hidden="true">❤️</span>
        Donate
      </button>
      {open && (
        <div
          className={styles.tooltip}
          role="dialog"
          aria-label="Donation prompt"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <p>Consider giving a $5 donation to support my work. I appreciate your support!</p>
          <button type="button" onClick={onDonate}>
            Donate $5
          </button>
        </div>
      )}
    </div>
  );
};

export default DonationButton;
