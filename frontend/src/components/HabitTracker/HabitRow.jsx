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
  const EditIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );

  const renderFixedCols = () => (
    <>
      <td className="col-index">{index + 1}</td>
      <td className="col-habit">
        <div className="habit-name-cell">
          <strong title={habit.name} className="habit-name-ellipsis">
            {habit.name}
          </strong>
          <div className="habit-mobile-meta">
            {showIcons && <span className="habit-icon">{getIconSymbol(habit.icon_key) || '📌'}</span>}
            {showStreak && (
              <span className="habit-streak-mobile" title={`Current: ${habit.currentStreak} • Best: ${habit.best_streak}`}>
                🔥 {habit.currentStreak}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="col-icon">
        {showIcons && <span className="habit-icon">{getIconSymbol(habit.icon_key) || '📌'}</span>}
      </td>
      <td className="col-streak">
        {showStreak && (
          <span title={`Current: ${habit.currentStreak} • Best: ${habit.best_streak}`}>
            {habit.currentStreak}-day
          </span>
        )}
      </td>
      <td className="col-actions">
        <div className="habit-row-actions">
          <button type="button" className="icon-action" onClick={() => onEdit(habit)} aria-label="Edit habit">
            <EditIcon />
          </button>
          <button
            type="button"
            className="icon-action"
            onClick={() => onDelete(habit)}
            aria-label="Delete habit"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </>
  );

  const renderDateCols = () =>
    dates.map((date) => {
      const today = new Date().toISOString().slice(0, 10);
      const cellStatus = habit.statusByDate[date.iso];
      const isToday = date.iso === today;
      const isPast = date.iso < today;
      let className = 'status-cell status-empty';
      let symbol = '';
      let content = null;
      let clickable = true;

      if (cellStatus === 'na') {
        className = 'status-cell status-na';
        clickable = false;
      } else if (isToday && cellStatus == null) {
        className = 'status-cell status-choice';
        clickable = false;
        content = (
          <div className="status-choice-options">
            <button
              type="button"
              className="status-choice-btn status-choice-completed"
              onClick={() => onToggleStatus(habit, date, 'completed')}
            >
              ✔
            </button>
            <button
              type="button"
              className="status-choice-btn status-choice-failed"
              onClick={() => onToggleStatus(habit, date, 'failed')}
            >
              ✖
            </button>
          </div>
        );
      } else {
        const displayStatus = cellStatus == null && isPast ? 'failed' : cellStatus;
        if (displayStatus === 'completed') {
          className = 'status-cell status-completed';
          symbol = '✔';
        } else if (displayStatus === 'failed') {
          className = 'status-cell status-failed';
          symbol = '✖';
        }
      }
      return (
        <td key={date.iso} className="col-date">
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
