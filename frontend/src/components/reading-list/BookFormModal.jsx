import { useEffect, useState } from 'react';

const DEFAULT_FORM = {
  title: '',
  author: '',
  notes: '',
  status: 'want_to_read',
  background_color: '',
};

const BookFormModal = ({ isOpen, mode, initialValues, defaultStatus, isPremium, onClose, onSave }) => {
  const [form, setForm] = useState({ ...DEFAULT_FORM, status: defaultStatus });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialValues) {
      setForm({ ...DEFAULT_FORM, ...initialValues });
    } else {
      setForm({ ...DEFAULT_FORM, status: defaultStatus });
    }
    setError(null);
  }, [initialValues, defaultStatus]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const hasContent = (form.title || '').trim() || (form.author || '').trim() || (form.notes || '').trim();
    if (!hasContent) {
      setError('Please add at least a title, author, or note.');
      return;
    }
    setError(null);
    onSave({
      title: form.title || null,
      author: form.author || null,
      notes: form.notes || null,
      status: form.status,
      background_color: isPremium ? form.background_color || null : null,
    });
  };

  return (
    <div className="reading-modal" role="dialog" aria-modal="true">
      <div className="reading-modal-content">
        <div className="reading-modal-header">
          <h2>{mode === 'create' ? 'Add book' : 'Edit book'}</h2>
          <button type="button" className="reading-close" onClick={onClose}>✕</button>
        </div>
        <div className="reading-form-grid">
          <label>
            <span>Title</span>
            <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
          </label>
          <label>
            <span>Author</span>
            <input type="text" value={form.author} onChange={(e) => handleChange('author', e.target.value)} />
          </label>
          <label className="reading-full">
            <span>Notes</span>
            <textarea rows={4} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} />
          </label>
          <label>
            <span>Status</span>
            <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              <option value="want_to_read">Books want to read</option>
              <option value="reading">Books reading</option>
              <option value="finished">Books have been read</option>
            </select>
          </label>
          {isPremium ? (
            <label>
              <span>Background color</span>
              <input
                type="color"
                value={form.background_color || '#ffffff'}
                onChange={(e) => handleChange('background_color', e.target.value)}
              />
            </label>
          ) : (
            <div className="reading-locked">
              <p>Background color customization is a premium feature.</p>
              <button type="button" className="reading-btn ghost" onClick={() => alert('Upgrade coming soon.')}>Upgrade</button>
            </div>
          )}
        </div>
        {error && <p className="reading-error">{error}</p>}
        <div className="reading-modal-actions">
          <button type="button" className="reading-btn ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="reading-btn primary" onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default BookFormModal;
