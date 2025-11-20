const HistoryList = ({ items, onRestore, onDelete }) => {
  if (!items.length) return null;
  return (
    <div className="history-card">
      <h3>History</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Habits you removed recently.</p>
      <div className="history-list">
        {items.map((habit) => (
          <div key={habit.id} className="history-item">
            <div>
              <strong>{habit.name}</strong>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Best streak: {habit.best_streak} days
              </p>
            </div>
            <div className="history-item-actions">
              <button type="button" onClick={() => onRestore(habit)}>
                Add back
              </button>
              <button type="button" className="danger" onClick={() => onDelete(habit)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
