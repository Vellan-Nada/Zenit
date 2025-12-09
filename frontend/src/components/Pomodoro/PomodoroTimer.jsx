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
  onRestart,
  onSelectMode,
  title = 'Pomodoro',
  playSound = false,
}) => {
  const intervalRef = useRef(null);
  const soundRef = useRef(null);

  // ensure interval is cleared if parent toggles isRunning/secondsLeft externally
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // lazy init audio
  useEffect(() => {
    soundRef.current = new Audio('/sounds/alert.mp3');
  }, []);

  // play sound when timer hits zero and setting is enabled
  useEffect(() => {
    if (secondsLeft === 0 && playSound && soundRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch(() => {});
    }
  }, [secondsLeft, playSound]);

  return (
    <div className="pomodoro-timer">
      <div className="pomodoro-header">
        <h1>{title}</h1>
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
        <button
          type="button"
          className="pomodoro-restart"
          onClick={onRestart}
          aria-label="Restart timer"
        >
          ↻
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
