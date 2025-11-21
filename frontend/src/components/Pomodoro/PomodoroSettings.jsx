import { useEffect, useState } from 'react';

const intOr = (val, fallback) => {
  const n = Number(val);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.floor(n);
};

const PomodoroSettings = ({ open, onClose, settings, onSave, saving }) => {
  const [form, setForm] = useState(settings);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  if (!open) return null;

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = () => {
    const next = {
      pomodoro_minutes: intOr(form.pomodoro_minutes, 1),
      short_break_minutes: intOr(form.short_break_minutes, 1),
      long_break_minutes: intOr(form.long_break_minutes, 1),
      long_break_after_sessions: intOr(form.long_break_after_sessions, 1),
      play_sound: Boolean(form.play_sound),
    };
    if (
      next.pomodoro_minutes < 1 ||
      next.short_break_minutes < 1 ||
      next.long_break_minutes < 1 ||
      next.long_break_after_sessions < 1
    ) {
      setError('All durations must be positive.');
      return;
    }
    setError(null);
    onSave(next);
  };

  return (
    <div className="pomodoro-modal" role="dialog" aria-modal="true">
      <div className="pomodoro-modal-content">
        <div className="pomodoro-modal-header">
          <h2>Settings</h2>
          <button type="button" onClick={onClose} className="pomodoro-close">✕</button>
        </div>
        <div className="pomodoro-form-grid">
          <label>
            <span>Pomodoro (minutes)</span>
            <input
              type="number"
              min="1"
              value={form.pomodoro_minutes || ''}
              onChange={(e) => handleChange('pomodoro_minutes', e.target.value)}
            />
          </label>
          <label>
            <span>Short break (minutes)</span>
            <input
              type="number"
              min="1"
              value={form.short_break_minutes || ''}
              onChange={(e) => handleChange('short_break_minutes', e.target.value)}
            />
          </label>
          <label>
            <span>Long break (minutes)</span>
            <input
              type="number"
              min="1"
              value={form.long_break_minutes || ''}
              onChange={(e) => handleChange('long_break_minutes', e.target.value)}
            />
          </label>
          <label>
            <span>Long break after sessions</span>
            <input
              type="number"
              min="1"
              value={form.long_break_after_sessions || ''}
              onChange={(e) => handleChange('long_break_after_sessions', e.target.value)}
            />
          </label>
          <label className="pomodoro-toggle-row">
            <input
              type="checkbox"
              checked={form.play_sound}
              onChange={(e) => handleChange('play_sound', e.target.checked)}
            />
            <span>Play alert sound on completion</span>
          </label>
        </div>
        {error && <p className="pomodoro-error">{error}</p>}
        <div className="pomodoro-modal-actions">
          <button type="button" className="pomodoro-btn ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="pomodoro-btn primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroSettings;
