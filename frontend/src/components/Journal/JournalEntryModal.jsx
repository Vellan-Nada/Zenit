import { useEffect, useState } from 'react';

const EMPTY = {
  thoughts: '',
  good_things: '',
  bad_things: '',
  lessons: '',
  dreams: '',
  mood: '',
};

const moodOptions = ['Very happy', 'Happy', 'Neutral', 'Sad', 'Stressed'];

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
          <h2>Entry for {dateKey}</h2>
          <button type="button" className="journal-close" onClick={onClose}>✕</button>
        </div>
        <div className="journal-form">
          <label>
            <span>Thoughts</span>
            <textarea
              rows={3}
              value={form.thoughts}
              onChange={(e) => handleChange('thoughts', e.target.value)}
              readOnly={!isEditing}
            />
          </label>
          <label>
            <span>All the good things happened today</span>
            <textarea
              rows={2}
              value={form.good_things}
              onChange={(e) => handleChange('good_things', e.target.value)}
              readOnly={!isEditing}
            />
          </label>
          <label>
            <span>All the bad things happened today</span>
            <textarea
              rows={2}
              value={form.bad_things}
              onChange={(e) => handleChange('bad_things', e.target.value)}
              readOnly={!isEditing}
            />
          </label>
          <label>
            <span>Lessons learnt</span>
            <textarea
              rows={2}
              value={form.lessons}
              onChange={(e) => handleChange('lessons', e.target.value)}
              readOnly={!isEditing}
            />
          </label>
          <label>
            <span>Dreams</span>
            <textarea
              rows={2}
              value={form.dreams}
              onChange={(e) => handleChange('dreams', e.target.value)}
              readOnly={!isEditing}
            />
          </label>
          <label>
            <span>Mood</span>
            <select value={form.mood} onChange={(e) => handleChange('mood', e.target.value)} disabled={!isEditing}>
              <option value="">Select mood</option>
              {moodOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
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
