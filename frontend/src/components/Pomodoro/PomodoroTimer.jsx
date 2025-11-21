import { useEffect, useRef } from 'react';
import ModeTabs from './ModeTabs.jsx';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

const PomodoroTimer = ({
  mode,
  secondsLeft,
  isRunning,
  onToggle,
  onSelectMode,
  title = 'Pomodoro',
}) => {
  const intervalRef = useRef(null);

  // ensure interval is cleared if parent toggles isRunning/secondsLeft externally
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="pomodoro-timer">
      <div className="pomodoro-header">
        <div>
          <p className="pomodoro-subtitle">Plan the work. Crush the goals.</p>
          <h1>{title}</h1>
        </div>
      </div>
      <ModeTabs current={mode} onSelect={onSelectMode} />
      <div className="timer-display">
        <span>{formatTime(secondsLeft)}</span>
      </div>
      <div className="timer-actions">
        <button
          type="button"
          className={`pomodoro-cta ${isRunning ? 'stop' : 'start'}`}
          onClick={onToggle}
        >
          {isRunning ? 'STOP' : 'START'}
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
