import { useLayoutEffect, useRef, useState } from 'react';
import HabitRow from './HabitRow.jsx';

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
  const scrollerRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(1200);

  // Measure available width (content area) and force slight overflow so horizontal scroll stays inside the table
  useLayoutEffect(() => {
    const measure = () => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const available = scroller.clientWidth || 0;
      const perDate = 110;
      const base = 480; // rough width for non-date columns
      const needed = base + dates.length * perDate;
      const target = Math.max(needed, available + 25, 900);
      setTableWidth(target);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [dates.length]);

  const tableStyle = { minWidth: `${tableWidth}px` };

  return (
    <div className="habit-table-wrapper">
      <div className="habit-table-scroller" ref={scrollerRef}>
        <table className="habit-table mobile-table" style={tableStyle}>
          <thead>
            <tr>
              <th>#</th>
              <th className="habit-col">Habit</th>
              <th className="actions-col">Actions</th>
              <th className="icon-col">{showIcons ? 'Icon' : ''}</th>
              <th className="streak-col">{showStreak ? 'Streak' : ''}</th>
              {dates.map((date) => (
                <th key={date.iso} className="sticky-dates">
                  {date.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.length === 0 ? (
              <tr>
                <td colSpan={3 + dates.length + 2} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No habits yet. Click “Add Habit” to start tracking.
                </td>
              </tr>
            ) : (
              habits.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  index={index}
                  habit={habit}
                  dates={dates}
                  showIcons={showIcons}
                  showStreak={showStreak}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditHabit}
                  onDelete={onDeleteHabit}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HabitTable;
