import { useRef, useState } from 'react';
import styles from '../styles/TopNav.module.css';

const HeartIcon = ({ size = 18, className }) => (
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
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
);

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
        <HeartIcon size={18} aria-hidden="true" />
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
