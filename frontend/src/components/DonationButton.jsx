import { useRef, useState } from 'react';
import styles from '../styles/TopNav.module.css';

const DonationButton = ({ onDonate }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className={styles.pillButton}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span aria-hidden="true">❤️</span>
        Donate
      </button>
      {open && (
        <div
          className={styles.tooltip}
          role="dialog"
          aria-label="Donation prompt"
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
