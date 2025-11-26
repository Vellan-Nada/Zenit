import { useEffect, useState } from 'react';

const EMPTY_FORM = {
  title: '',
  actor_actress: '',
  director: '',
  notes: '',
};

const MovieItemModal = ({ isOpen, mode, initialValues, status, onClose, onSave }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialValues) {
      setForm({ ...EMPTY_FORM, ...initialValues });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const hasContent =
      (form.title || '').trim() ||
      (form.actor_actress || '').trim() ||
      (form.director || '').trim() ||
      (form.notes || '').trim();
    if (!hasContent) {
      setError('Please add at least a title, actor/actress, director, or note.');
      return;
    }
    setError(null);
    onSave({
      title: form.title || null,
      actor_actress: form.actor_actress || null,
      director: form.director || null,
      notes: form.notes || null,
      status,
    });
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="movie-modal" role="dialog" aria-modal="true">
      <div className="movie-modal-content">
        <div className="movie-modal-header">
          <h2>{mode === 'add' ? 'Add Movie / Series' : 'Edit Movie / Series'}</h2>
          <button type="button" className="movie-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="movie-form-grid">
          <label>
            <span>Title</span>
            <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
          </label>
          <label>
            <span>Actor / Actress</span>
            <input
              type="text"
              value={form.actor_actress}
              onChange={(e) => handleChange('actor_actress', e.target.value)}
            />
          </label>
          <label>
            <span>Director</span>
            <input type="text" value={form.director} onChange={(e) => handleChange('director', e.target.value)} />
          </label>
          <label className="movie-full">
            <span>Notes</span>
            <textarea rows={4} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} />
          </label>
        </div>
        {error && <p className="movie-error">{error}</p>}
        <div className="movie-modal-actions">
          <button type="button" className="movie-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="movie-btn primary" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieItemModal;
