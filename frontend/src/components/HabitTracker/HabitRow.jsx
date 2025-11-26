import { getIconSymbol } from './iconConfig.js';

const HabitRow = ({
  index,
  habit,
  dates,
  showIcons,
  showStreak,
  onToggleStatus,
  onEdit,
  onDelete,
  rowRef,
}) => {
  const renderFixedCols = () => (
    <>
      <td>{index + 1}</td>
      <td className="habit-col">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{habit.name}</strong>
        </div>
      </td>
      <td className="actions-col">
        <div className="habit-row-actions">
          <button type="button" onClick={() => onEdit(habit)}>
            Edit
          </button>
          <button type="button" onClick={() => onDelete(habit)}>
            Delete
          </button>
        </div>
      </td>
      <td className="icon-col">
        {showIcons && <span className="habit-icon">{getIconSymbol(habit.icon_key) || '📌'}</span>}
      </td>
      <td className="streak-col">
        {showStreak && (
          <span title={`Current: ${habit.currentStreak} • Best: ${habit.best_streak}`}>
            {habit.currentStreak}-day
          </span>
        )}
      </td>
    </>
  );

  const renderDateCols = () =>
    dates.map((date) => {
      const cellStatus = habit.statusByDate[date.iso];
      let className = 'status-cell status-empty';
      let symbol = '';
      let content = null;
      let clickable = true;
      if (cellStatus === 'na') {
        className = 'status-cell status-na';
        clickable = false;
      } else if (cellStatus === 'completed') {
        className = 'status-cell status-completed';
        symbol = '✔';
      } else if (cellStatus === 'failed') {
        className = 'status-cell status-failed';
        symbol = '✖';
      } else if (cellStatus === 'none') {
        className = 'status-cell status-choice';
        clickable = false;
        content = (
          <div className="status-choice-options">
            <button type="button" onClick={() => onToggleStatus(habit, date, 'completed')}>
              ✔
            </button>
            <button type="button" onClick={() => onToggleStatus(habit, date, 'failed')}>
              ✖
            </button>
          </div>
        );
      }
      return (
        <td key={date.iso} className="sticky-dates">
          <div
            className={className}
            onClick={() => clickable && onToggleStatus(habit, date)}
            role={clickable ? 'button' : 'group'}
            aria-label={`Toggle ${habit.name} on ${date.label}`}
          >
            {content || symbol}
          </div>
        </td>
      );
    });

  return (
    <tr ref={rowRef}>
      {renderFixedCols()}
      {renderDateCols()}
    </tr>
  );
};

export default HabitRow;
