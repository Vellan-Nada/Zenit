import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/Sidebar.module.css';
import ProfileMenu from './ProfileMenu.jsx';

const IconBase = ({ children, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const DashboardIcon = ({ className }) => (
  <IconBase className={className}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </IconBase>
);

const HabitIcon = ({ className }) => (
  <IconBase className={className}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </IconBase>
);

const NoteIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5Z" />
    <path d="M15 3v6h6" />
  </IconBase>
);

const TodoIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="5" width="6" height="6" rx="1" />
    <path d="m3 17 2 2 4-4" />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </IconBase>
);

const TimerIcon = ({ className }) => (
  <IconBase className={className}>
    <line x1="10" x2="14" y1="2" y2="2" />
    <line x1="12" x2="15" y1="14" y2="11" />
    <circle cx="12" cy="14" r="8" />
  </IconBase>
);

const SourceIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </IconBase>
);

const JournalIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </IconBase>
);

const BookIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M12 8a2 2 0 1 0 0 4 2 2 0 1 0 0-4z" />
  </IconBase>
);

const FilmIcon = ({ className }) => (
  <IconBase className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="7" x2="7" y1="3" y2="21" />
    <line x1="17" x2="17" y1="3" y2="21" />
    <line x1="3" x2="21" y1="12" y2="12" />
    <line x1="3" x2="7" y1="7" y2="7" />
    <line x1="3" x2="7" y1="17" y2="17" />
    <line x1="17" x2="21" y1="17" y2="17" />
    <line x1="17" x2="21" y1="7" y2="7" />
  </IconBase>
);

const Logo = ({ size = 40, variant = 1, className = '' }) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 40 40',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
  };

  const bg = <rect width="40" height="40" rx="12" fill="null" />;

  if (variant === 1) {
    return (
      <svg {...commonProps}>
        {bg}
        <path
          d="M12 28L18.5 19.5L23.5 24.5L29 13"
          stroke="black"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="29" cy="13" r="2.5" fill="black" />
        <path d="M12 28L12 28.01" stroke="black" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return null;
};

const defaultNavItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Habit Tracker', path: '/habits' },
  { label: 'Notes', path: '/notes' },
  { label: 'To Do List', path: '/tasks' },
  { label: 'Pomodoro', path: '/pomodoro' },
  { label: 'Source Dump', path: '/source-dump' },
  { label: 'Journaling', path: '/journaling' },
  { label: 'Reading List', path: '/reading' },
  { label: 'Movie & Series', path: '/watch' },
];

const Sidebar = ({
  onUpgradeClick = () => {},
  onManageSubscription = () => {},
  isMobileOpen = false,
  onClose = () => {},
}) => {
  const { planTier, user } = useAuth();
  const [navItems, setNavItems] = useState(defaultNavItems);
  const draggingPathRef = useRef(null);
  const dragImageRef = useRef(null);
  const [draggingPath, setDraggingPath] = useState(null);
  const [dragOverPath, setDragOverPath] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Load custom order from profile.nav_order (json array of paths)
  useEffect(() => {
    const loadOrder = async () => {
      if (!user) {
        setNavItems(defaultNavItems);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('nav_order')
        .eq('id', user.id)
        .single();
      if (error || !data?.nav_order) {
        setNavItems(defaultNavItems);
        return;
      }
      const orderPaths = data.nav_order.filter((p) => defaultNavItems.some((n) => n.path === p));
      const remaining = defaultNavItems.filter((n) => !orderPaths.includes(n.path));
      const ordered = [...orderPaths.map((p) => defaultNavItems.find((n) => n.path === p)), ...remaining];
      setNavItems(ordered);
    };
    loadOrder();
  }, [user]);

  const persistOrder = async (items) => {
    if (!user) return;
    setSavingOrder(true);
    try {
      await supabase.from('profiles').update({ nav_order: items.map((i) => i.path) }).eq('id', user.id);
    } catch (err) {
      console.error('Failed to save nav order', err);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragStart = (e, path) => {
    draggingPathRef.current = path;
    setDraggingPath(path);
    setDragOverPath(null);
    e.dataTransfer.effectAllowed = 'move';
    // Build a custom drag image with the feature name
    const box = document.createElement('div');
    box.textContent = navItems.find((n) => n.path === path)?.label || '';
    box.style.padding = '8px 12px';
    box.style.background = 'rgba(59, 130, 246, 0.85)';
    box.style.color = '#fff';
    box.style.borderRadius = '10px';
    box.style.boxShadow = '0 8px 18px rgba(15, 23, 42, 0.18)';
    box.style.fontWeight = '600';
    box.style.pointerEvents = 'none';
    box.style.position = 'absolute';
    box.style.top = '-1000px'; // keep offscreen
    document.body.appendChild(box);
    dragImageRef.current = box;
    e.dataTransfer.setDragImage(box, box.offsetWidth / 2, box.offsetHeight / 2);
  };

  const handleDrop = (targetPath) => {
    const sourcePath = draggingPathRef.current;
    draggingPathRef.current = null;
    setDraggingPath(null);
    setDragOverPath(null);
    if (!sourcePath || sourcePath === targetPath) return;
    const next = [...navItems];
    const fromIndex = next.findIndex((n) => n.path === sourcePath);
    const toIndex = next.findIndex((n) => n.path === targetPath);
    if (fromIndex === -1 || toIndex === -1) return;
    next.splice(toIndex, 0, ...next.splice(fromIndex, 1));
    setNavItems(next);
    persistOrder(next);
  };

  const handleDragOver = (path, e) => {
    e.preventDefault();
    if (dragOverPath !== path) setDragOverPath(path);
  };

  const handleDragEnd = () => {
    draggingPathRef.current = null;
    setDraggingPath(null);
    setDragOverPath(null);
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
  };

  const showUpgradeCta = false;
  const iconMap = {
    '/': DashboardIcon,
    '/habits': HabitIcon,
    '/notes': NoteIcon,
    '/tasks': TodoIcon,
    '/pomodoro': TimerIcon,
    '/source-dump': SourceIcon,
    '/journaling': JournalIcon,
    '/reading': BookIcon,
    '/watch': FilmIcon,
  };

  return (
    <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
      <button type="button" className={styles.closeButton} onClick={onClose}>
        ✕
      </button>
      <div className={styles.sidebarHeader}>
        <div className={styles.brandRow}>
          <NavLink to="/" className={styles.brandLink} onClick={onClose} aria-label="Go to dashboard">
            <Logo className={styles.logoIcon} />
          </NavLink>
          <div className={styles.brand}>
            <h1>EverDay</h1>
          </div>
        </div>
      </div>

      <div className={styles.sidebarBody}>
        <nav className={styles.nav} aria-label="Feature navigation">
          {navItems.map((item) => {
            const Icon = iconMap[item.path];
            return (
              <div
                key={item.path}
                className={`${styles.draggableItem} ${draggingPath === item.path ? styles.dragging : ''} ${
                  dragOverPath === item.path ? styles.dragOver : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, item.path)}
                onDragOver={(e) => handleDragOver(item.path, e)}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(item.path)}
                aria-label={`Reorder ${item.label}`}
              >
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                  onClick={isMobileOpen ? onClose : undefined}
                >
                  {Icon ? <Icon className={styles.navIcon} /> : null}
                  {item.label}
                </NavLink>
              </div>
            );
          })}
          {savingOrder && <div className={styles.saveHint}>Saving order…</div>}
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
