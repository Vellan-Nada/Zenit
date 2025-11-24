import HabitRow from './HabitRow.jsx';
import { useEffect, useRef, useState } from 'react';

const HabitTable = ({
  habits,
  dates,
  showIcons,
  showStreak,
  isPremium,
  onToggleStatus,
  onEditHabit,
  onDeleteHabit,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const fixedRowRefs = useRef([]);
  const dateRowRefs = useRef([]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const syncHeights = () => {
      habits.forEach((_, idx) => {
        const fixedRow = fixedRowRefs.current[idx];
        const dateRow = dateRowRefs.current[idx];
        if (fixedRow && dateRow) {
          dateRow.style.height = 'auto';
          const h = fixedRow.getBoundingClientRect().height;
          dateRow.style.height = `${h}px`;
        }
      });
    };
    if (!isMobile) {
      syncHeights();
      window.addEventListener('resize', syncHeights);
      return () => window.removeEventListener('resize', syncHeights);
    }
    return undefined;
  }, [habits, dates, isMobile]);

  if (!habits.length) {
    return (
      <div className="habit-empty">
        <p>No habits yet. Click “Add Habit” to start tracking.</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="habit-table-wrapper">
        <div className="habit-table-scroller mobile">
          <table className="habit-table mobile-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="habit-col">Habit</th>
                <th className="actions-col">Actions</th>
                {showIcons && <th className="icon-col">Icon</th>}
                {showStreak && isPremium && <th className="streak-col">Streak</th>}
                {dates.map((date) => (
                  <th key={date.iso} className="sticky-dates">
                    {date.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  index={index}
                  habit={habit}
                  dates={dates}
                  showIcons={showIcons}
                  showStreak={showStreak && isPremium}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditHabit}
                  onDelete={onDeleteHabit}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="habit-table-wrapper dual-table">
      <div className="habit-table-fixed">
        <table className="habit-table">
          <thead>
            <tr>
              <th className="sticky-col">#</th>
              <th className="sticky-col habit-col">Habit</th>
              <th className="sticky-col actions-col">Actions</th>
              {showIcons && <th className="sticky-col icon-col">Icon</th>}
              {showStreak && isPremium && <th className="sticky-col streak-col">Streak</th>}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit, index) => (
              <HabitRow
                key={`fixed-${habit.id}`}
                rowRef={(el) => (fixedRowRefs.current[index] = el)}
                mode="fixed"
                index={index}
                habit={habit}
                dates={dates}
                showIcons={showIcons}
                showStreak={showStreak && isPremium}
                onToggleStatus={onToggleStatus}
                onEdit={onEditHabit}
                onDelete={onDeleteHabit}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="habit-table-dates">
        <div className="habit-date-scroller">
          <table className="habit-table">
            <thead>
              <tr>
                {dates.map((date) => (
                  <th key={date.iso} className="sticky-dates">
                    {date.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit, index) => (
                <HabitRow
                  key={`dates-${habit.id}`}
                  rowRef={(el) => (dateRowRefs.current[index] = el)}
                  mode="dates"
                  index={index}
                  habit={habit}
                  dates={dates}
                  showIcons={showIcons}
                  showStreak={showStreak && isPremium}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditHabit}
                  onDelete={onDeleteHabit}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HabitTable;
