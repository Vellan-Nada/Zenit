import { useRef, useState } from 'react';
import styles from '../styles/TopNav.module.css';

const DonationButton = ({ onDonate }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.pillButton}
        onClick={onDonate}
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
          <p>Give a one-time $5 donation to support EverDay.</p>
        </div>
      )}
    </div>
  );
};

export default DonationButton;
