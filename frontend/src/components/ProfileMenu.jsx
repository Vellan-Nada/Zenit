import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/ProfileMenu.module.css';

const LogOutIcon = ({ size = 18, className }) => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const planLabels = {
  free: 'Free member',
  plus: 'Plus member',
  pro: 'Pro member',
};

const ProfileMenu = ({ onUpgradeClick = () => {}, onManageSubscription = () => {} }) => {
  const { user, profile, planTier, signOut } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) {
    return (
      <div className={styles.guestBox}>
        <p>Sign in to personalize EverDay</p>
        <button type="button" onClick={() => navigate('/login')}>
          Sign in
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => navigate('/signup')}>
          Create account
        </button>
      </div>
    );
  }

  const displayName =
    profile?.username ||
    profile?.full_name ||
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    'there';
  const planLabel = planLabels[planTier] || planLabels.free;
  const showUpgradeAction = planTier === 'free';
  const upgradeLabel = 'Upgrade to Plus';
  const showManageSubscription = planTier === 'pro';

  const handleManage = () => {
    setOpen(false);
    onManageSubscription();
  };

  const handleUpgrade = () => {
    setOpen(false);
    onUpgradeClick();
  };

  return (
    <div className={styles.profileContainer} ref={containerRef}>
      <button type="button" className={styles.profileTrigger} onClick={() => setOpen((prev) => !prev)}>
        <span className={styles.avatar}>{displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
        <div className={styles.profileDetails}>
          <strong>{displayName}</strong>
          <span>{planLabel}</span>
        </div>
        <span aria-hidden="true" className={styles.caret}>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <p title={user.email}>{user.email}</p>
            <span className={styles.planPill}>{planLabel}</span>
          </div>
          <div className={styles.dropdownActions}>
            {showUpgradeAction && (
              <button type="button" onClick={handleUpgrade}>
                {upgradeLabel}
              </button>
            )}
            {showManageSubscription && (
              <button type="button" onClick={handleManage}>
                Manage subscription
              </button>
            )}
            {planTier !== 'free' && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('/upgrade');
                }}
              >
                Subscription settings
              </button>
            )}
          </div>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            <LogOutIcon size={18} aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
