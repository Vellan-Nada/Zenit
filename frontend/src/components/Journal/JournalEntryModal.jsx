import { useEffect, useState } from 'react';

const EMPTY = {
  thoughts: '',
  good_things: '',
  bad_things: '',
  lessons: '',
  dreams: '',
  mood: '',
};

const moodOptions = [
  { label: 'Great', value: 'Great', emoji: '😄' },
  { label: 'Good', value: 'Good', emoji: '🙂' },
  { label: 'Neutral', value: 'Neutral', emoji: '😐' },
  { label: 'Bad', value: 'Bad', emoji: '😕' },
  { label: 'Awful', value: 'Awful', emoji: '😣' },
];

const formatDateLabel = (dateKey) => {
  if (!dateKey) return '';
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  const dayNum = date.getUTCDate();
  const monthShort = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const suffix =
    dayNum % 10 === 1 && dayNum !== 11
      ? 'st'
      : dayNum % 10 === 2 && dayNum !== 12
      ? 'nd'
      : dayNum % 10 === 3 && dayNum !== 13
      ? 'rd'
      : 'th';
  return `${dayNum}${suffix} of ${monthShort} ${year}`;
};

const JournalEntryModal = ({ isOpen, dateKey, existingEntry, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (existingEntry) {
      setForm({ ...EMPTY, ...existingEntry });
      setIsEditing(false);
    } else {
      setForm(EMPTY);
      setIsEditing(true); // new entry: allow editing immediately
    }
    setError(null);
  }, [existingEntry, dateKey, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const hasContent = Object.values(form).some((v) => (v || '').trim());
    if (!hasContent) {
      setError('Add at least one field before saving.');
      return;
    }
    setError(null);
    onSave(form);
    setIsEditing(false);
  };

  return (
    <div className="journal-modal" role="dialog" aria-modal="true">
      <div className="journal-modal-content">
        <div className="journal-modal-header">
          <div>
            <h2>Add Journal Entry</h2>
          </div>
          <button type="button" className="journal-close" onClick={onClose}>✕</button>
        </div>

        <div className="journal-form">
          <div className="journal-section">
            <div className="journal-section-title">
              <span role="img" aria-label="thoughts" className="journal-section-icon">🧠</span>
              <span>Thoughts</span>
            </div>
            <textarea
              className="journal-textarea"
              placeholder="What's on your mind today?"
              rows={3}
              value={form.thoughts}
              onChange={(e) => handleChange('thoughts', e.target.value)}
              readOnly={!isEditing}
            />
          </div>

          <div className="journal-row">
            <div className="journal-section">
              <div className="journal-section-title">
                <span role="img" aria-label="good things" className="journal-section-icon">✨</span>
                <span>Good things today</span>
              </div>
              <textarea
                className="journal-textarea"
                placeholder="Highlights, wins, small joys..."
                rows={2}
                value={form.good_things}
                onChange={(e) => handleChange('good_things', e.target.value)}
                readOnly={!isEditing}
              />
            </div>
            <div className="journal-section">
              <div className="journal-section-title">
                <span role="img" aria-label="bad things" className="journal-section-icon">🌥️</span>
                <span>Bad things today</span>
              </div>
              <textarea
                className="journal-textarea"
                placeholder="Challenges, setbacks, worries..."
                rows={2}
                value={form.bad_things}
                onChange={(e) => handleChange('bad_things', e.target.value)}
                readOnly={!isEditing}
              />
            </div>
          </div>

          <div className="journal-section">
            <div className="journal-section-title">
              <span role="img" aria-label="lessons" className="journal-section-icon">📖</span>
              <span>Lessons learnt</span>
            </div>
            <textarea
              className="journal-textarea"
              placeholder="What did today teach you?"
              rows={2}
              value={form.lessons}
              onChange={(e) => handleChange('lessons', e.target.value)}
              readOnly={!isEditing}
            />
          </div>

          <div className="journal-section">
            <div className="journal-section-title">
              <span role="img" aria-label="dreams" className="journal-section-icon">🌙</span>
              <span>Dreams</span>
            </div>
            <textarea
              className="journal-textarea"
              placeholder="Dreams you had last night..."
              rows={2}
              value={form.dreams}
              onChange={(e) => handleChange('dreams', e.target.value)}
              readOnly={!isEditing}
            />
          </div>

          <div className="journal-section">
            <div className="journal-section-title">
              <span role="img" aria-label="mood" className="journal-section-icon">😊</span>
              <span>Mood</span>
            </div>
            <div className="journal-mood" role="group" aria-label="Select mood">
              {moodOptions.map((m) => {
                const active = form.mood === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    className={`mood-option ${active ? 'active' : ''}`}
                    onClick={() => isEditing && handleChange('mood', m.value)}
                    disabled={!isEditing}
                  >
                    <span className="mood-emoji" aria-hidden="true">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {error && <p className="journal-error">{error}</p>}
        <div className="journal-modal-actions">
          {existingEntry && !isEditing && (
            <>
              <button type="button" className="journal-btn ghost" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button
                type="button"
                className="journal-btn danger"
                onClick={() => {
                  if (window.confirm('Delete this entry?')) onDelete();
                }}
              >
                Delete
              </button>
            </>
          )}
          {(!existingEntry || isEditing) && (
            <>
              <button type="button" className="journal-btn ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="journal-btn primary" onClick={handleSubmit}>
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalEntryModal;
