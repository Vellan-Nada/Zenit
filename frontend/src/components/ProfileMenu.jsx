import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/ProfileMenu.module.css';

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
        <p>Sign in to personalize EverDay.</p>
        <button type="button" onClick={() => navigate('/login')}>
          Sign in
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => navigate('/signup')}>
          Create account
        </button>
      </div>
    );
  }

  const displayName = profile?.username || profile?.full_name || user.user_metadata?.username || user.user_metadata?.full_name || user.email;
  const planLabel = planLabels[planTier] || planLabels.free;
  const showUpgradeAction = planTier === 'free' || planTier === 'plus';
  const upgradeLabel = planTier === 'plus' ? 'Upgrade to Pro' : 'Upgrade plan';
  const showManageSubscription = planTier !== 'free';

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
            <p>{user.email}</p>
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
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/upgrade');
              }}
            >
              Subscription settings
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/ai-helper');
              }}
            >
              Personalization
            </button>
          </div>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
