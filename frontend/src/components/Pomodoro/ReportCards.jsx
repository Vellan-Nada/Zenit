const formatHours = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

const ReportCards = ({ totals, averages, streaks }) => {
  return (
    <div className="pomodoro-report-grid">
      <div className="pomodoro-card">
        <h3>Total Focus Time</h3>
        <p className="pomodoro-metric">{formatHours(totals.focusSeconds || 0)}</p>
      </div>
      <div className="pomodoro-card">
        <h3>Averages</h3>
        <ul className="pomodoro-list">
          <li>Daily: {formatHours(averages.daily || 0)}</li>
          <li>Weekly: {formatHours(averages.weekly || 0)}</li>
          <li>Monthly: {formatHours(averages.monthly || 0)}</li>
          <li>Yearly: {formatHours(averages.yearly || 0)}</li>
        </ul>
      </div>
      <div className="pomodoro-card">
        <h3>Current Streak</h3>
        <p className="pomodoro-metric">{streaks.current || 0} days</p>
      </div>
      <div className="pomodoro-card">
        <h3>Best Streak</h3>
        <p className="pomodoro-metric">{streaks.best || 0} days</p>
      </div>
    </div>
  );
};

export default ReportCards;
