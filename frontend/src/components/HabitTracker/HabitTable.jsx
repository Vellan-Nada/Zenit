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
  if (!habits.length) {
    return (
      <div className="habit-empty">
        <p>No habits yet. Click “Add Habit” to start tracking.</p>
      </div>
    );
  }

  // Set a dynamic table width so horizontal scrolling appears when many date columns exist
  const tableMinWidth = Math.max(900, 600 + dates.length * 140);
  const tableStyle = { minWidth: `${tableMinWidth}px` };

  return (
    <div className="habit-table-wrapper">
      <div className="habit-table-scroller">
        <table className="habit-table mobile-table" style={tableStyle}>
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
};

export default HabitTable;
