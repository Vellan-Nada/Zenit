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
  const dateCount = dates.length || 1;
  const tableStyle = {
    '--date-count': dateCount,
  };

  return (
    <div className="habit-table-wrapper">
      <div className="habit-table-scroller">
        <table className="habit-table mobile-table" style={tableStyle}>
          <thead>
            <tr>
              <th className="col-index">#</th>
              <th className="col-habit">Habit</th>
              <th className="col-icon">{showIcons ? 'Icon' : ''}</th>
              <th className="col-streak">{showStreak ? 'Streak' : ''}</th>
              <th className="col-actions">Actions</th>
              {dates.map((date) => (
                <th key={date.iso} className="col-date">
                  {date.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.length === 0 ? (
              <tr>
                <td colSpan={5 + dates.length} style={{ textAlign: 'center', padding: '1.5rem' }}>
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
