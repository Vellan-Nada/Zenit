import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/Sidebar.module.css';
import ProfileMenu from './ProfileMenu.jsx';

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

  return (
    <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
      <button type="button" className={styles.closeButton} onClick={onClose}>
        ✕
      </button>
      <NavLink to="/" className={styles.brandLink}>
        <div className={styles.brand}>
          <h1>EverDay</h1>
          <span>All-in-one productivity space</span>
        </div>
      </NavLink>

      <div>
        <nav className={styles.nav} aria-label="Feature navigation">
          {navItems.map((item) => (
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
              >
                {item.label}
              </NavLink>
            </div>
          ))}
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
