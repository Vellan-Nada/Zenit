const modes = [
  { key: 'pomodoro', label: 'Pomodoro' },
  { key: 'short_break', label: 'Short break' },
  { key: 'long_break', label: 'Long break' },
];

const ModeTabs = ({ current, onSelect }) => {
  return (
    <div className="pomodoro-tabs">
      {modes.map((mode) => {
        const active = current === mode.key;
        return (
          <button
            key={mode.key}
            type="button"
            className={`pomodoro-tab ${active ? 'active' : ''}`}
            onClick={() => onSelect(mode.key)}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};

export default ModeTabs;
