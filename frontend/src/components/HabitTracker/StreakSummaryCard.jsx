import { getIconSymbol } from './iconConfig.js';

const FlameIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 -1 24 26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ overflow: 'visible' }}
  >
    <path d="M8.5 14.5C10.5 12.5 10.5 9 7 6c-1.5 4-4 6.5-4 10a9 9 0 0 0 18 0c0-5-3.5-7.5-5.5-10.5-.5 3-2 5-5 9Z" />
  </svg>
);

const StreakSummaryCard = ({ habits }) => {
  if (!habits.length) return null;

  const sorted = [...habits]
    .filter((habit) => habit.currentStreak > 0)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 5);

  if (!sorted.length) return null;

  return (
    <div className="streak-card">
      <div className="streak-card-header">
        <FlameIcon />
        <span>Top Streaks</span>
      </div>
      <ul className="streak-list">
        {sorted.map((habit, idx) => (
          <li key={habit.id} className="streak-row">
            <div className="streak-left">
              <span className="streak-rank">#{idx + 1}</span>
              <span className="streak-icon">{getIconSymbol(habit.icon_key) || '🏆'}</span>
              <span className="streak-name">{habit.name}</span>
            </div>
            <div className="streak-days">
              {habit.currentStreak} day{habit.currentStreak === 1 ? '' : 's'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StreakSummaryCard;
