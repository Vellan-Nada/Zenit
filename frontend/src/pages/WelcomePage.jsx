import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/WelcomePage.module.css';

const IconSvg = ({ children, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
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

const HabitTrackerIcon = ({ className }) => (
  <IconSvg className={className}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </IconSvg>
);

const NoteTakerIcon = ({ className }) => (
  <IconSvg className={className}>
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
    <path d="M15 3v6h6" />
  </IconSvg>
);

const ListTodoIcon = ({ className }) => (
  <IconSvg className={className}>
    <rect x="3" y="5" width="6" height="6" rx="1" />
    <path d="m3 17 2 2 4-4" />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </IconSvg>
);

const TimerIcon = ({ className }) => (
  <IconSvg className={className}>
    <line x1="10" x2="14" y1="2" y2="2" />
    <line x1="12" x2="15" y1="14" y2="11" />
    <circle cx="12" cy="14" r="8" />
  </IconSvg>
);

const SourceDumpIcon = ({ className }) => (
  <IconSvg className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </IconSvg>
);

const JournalIcon = ({ className }) => (
  <IconSvg className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </IconSvg>
);

const FilmIcon = ({ className }) => (
  <IconSvg className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="7" x2="7" y1="3" y2="21" />
    <line x1="17" x2="17" y1="3" y2="21" />
    <line x1="3" x2="21" y1="12" y2="12" />
    <line x1="3" x2="7" y1="7" y2="7" />
    <line x1="3" x2="7" y1="17" y2="17" />
    <line x1="17" x2="21" y1="17" y2="17" />
    <line x1="17" x2="21" y1="7" y2="7" />
  </IconSvg>
);

const ReadingListIcon = ({ className }) => (
  <IconSvg className={className}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M12 8a2 2 0 1 0 0 4 2 2 0 1 0 0-4z" />
  </IconSvg>
);

const WelcomePage = () => {
  const { features = [] } = useOutletContext() || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  const iconMap = {
    habit: HabitTrackerIcon,
    habits: HabitTrackerIcon,
    notes: NoteTakerIcon,
    tasks: ListTodoIcon,
    todos: ListTodoIcon,
    pomodoro: TimerIcon,
    reading: ReadingListIcon,
    watch: FilmIcon,
    journaling: JournalIcon,
    journal: JournalIcon,
    sourceDump: SourceDumpIcon,
    'source-dump': SourceDumpIcon,
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
              {iconMap[feature.key] ? iconMap[feature.key]({ className: styles.iconSvg }) : '⭐'}
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
