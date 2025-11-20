import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/Sidebar.module.css';
import ProfileMenu from './ProfileMenu.jsx';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Habit Tracker', path: '/habits' },
  { label: 'Notes', path: '/notes' },
  { label: 'To Do List', path: '/tasks' },
  { label: 'Pomodoro', path: '/pomodoro' },
  { label: 'Reading List', path: '/reading' },
  { label: 'Movie & Series', path: '/watch' },
  { label: 'Journaling', path: '/journaling' },
  { label: 'Source Dump', path: '/source-dump' },
  { label: 'AI Helper', path: '/ai-helper' },
];

const Sidebar = ({ onUpgradeClick = () => {}, onManageSubscription = () => {} }) => {
  const { planTier } = useAuth();
  const showUpgradeCta = planTier !== 'pro';
  const ctaTitle = planTier === 'plus' ? 'Ready for AI superpowers?' : 'Unlock EverDay Pro';
  const ctaDescription =
    planTier === 'plus'
      ? 'Upgrade to Pro for AI helper access and saved threads.'
      : 'Get AI helper boosts, deep insights, and data backups.';
  const ctaButton = planTier === 'plus' ? 'Go Pro' : 'See plans';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h1>EverDay</h1>
        <span>All-in-one productivity space</span>
      </div>

      <div>
        <div className={styles.navSectionTitle}>Workspace</div>
        <nav className={styles.nav} aria-label="Feature navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {showUpgradeCta && (
        <div className={styles.ctaCard}>
          <strong>{ctaTitle}</strong>
          <p>{ctaDescription}</p>
          <button type="button" onClick={onUpgradeClick}>
            {ctaButton}
          </button>
        </div>
      )}

      <ProfileMenu onUpgradeClick={onUpgradeClick} onManageSubscription={onManageSubscription} />
    </aside>
  );
};

export default Sidebar;
