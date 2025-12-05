import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/WelcomePage.module.css';

const WelcomePage = () => {
  const { features = [] } = useOutletContext() || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  const iconMap = {
    habit: '✓',
    habits: '✓',
    notes: '✎',
    tasks: '☑',
    todos: '☑',
    pomodoro: '⏲',
    reading: '▤',
    watch: '▶',
    journaling: '✎',
    journal: '✎',
    sourceDump: '▢',
    'source-dump': '▢',
  };
  const routeMap = {
    habits: '/habits',
    habit: '/habits',
    notes: '/notes',
    todos: '/tasks',
    tasks: '/tasks',
    pomodoro: '/pomodoro',
    reading: '/reading',
    watch: '/watch',
    journaling: '/journaling',
    journal: '/journaling',
    sourceDump: '/source-dump',
    'source-dump': '/source-dump',
  };

  const ordering = {
    habits: 0,
    notes: 1,
    todos: 2,
    pomodoro: 3,
    sourceDump: 4,
    journaling: 5,
    reading: 6,
    watch: 7,
  };

  const sortedFeatures = [...features].sort((a, b) => {
    const aKey = a.key;
    const bKey = b.key;
    const aOrder = ordering[aKey] ?? Number.MAX_SAFE_INTEGER;
    const bOrder = ordering[bKey] ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        {user && <span className={styles.heroBadge}>Welcome back!</span>}
        <h1>Welcome to EverDay</h1>
        <p>
          EverDay unifies your habits, notes, todos, focus cycles, inspiration and thoughts into one calm workspace.
        </p>
      </header>

      <section className={styles.cardGrid}>
        {sortedFeatures.map((feature) => (
          <div
            key={feature.key}
            className={styles.toolCard}
            role="button"
            tabIndex={0}
            onClick={() => routeMap[feature.key] && navigate(routeMap[feature.key])}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && routeMap[feature.key]) {
                e.preventDefault();
                navigate(routeMap[feature.key]);
              }
            }}
          >
            <div className={styles.toolAccent} />
            <div className={`${styles.iconBadge} ${styles[`icon-${feature.key}`] || ''}`}>
              {iconMap[feature.key] || '⭐'}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </section>
    </article>
  );
};

export default WelcomePage;
