import { useState } from 'react';
import PremiumColorUpsell from '../PremiumColorUpsell.jsx';

const PALETTE = [
  '#FFFFFF',
  '#FDF4FF',
  '#FEF3C7',
  '#E0F2FE',
  '#D1FAE5',
  '#FFE4E6',
  '#DCFCE7',
  '#F1F5F9',
  '#a19b9bff',
  '#E9D5FF',
  '#E0E7FF',
  '#F5F3FF',
];

const NoteCard = ({
  note,
  isPremium,
  isEditing,
  draft,
  onStartEdit,
  onEditField,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onChangeColor,
  colorSaving,
}) => {
  const [showPalette, setShowPalette] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err.message || 'Unable to delete note.');
    }
  };

  const handlePaletteToggle = () => {
    if (!isPremium) {
      setShowUpsell((prev) => !prev);
      setShowPalette(false);
      return;
    }
    setShowUpsell(false);
    setShowPalette((prev) => !prev);
  };

  const handleColorPick = async (color) => {
    setError(null);
    try {
      await onChangeColor(color);
      setShowPalette(false);
    } catch (err) {
      setError(err.message || 'Unable to update color');
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    const hasContent = draft.title.trim() || draft.content.trim();
    if (!hasContent) {
      setError('Title or content is required.');
      return;
    }
    setError(null);
    try {
      await onSaveEdit();
    } catch (err) {
      setError(err.message || 'Unable to save changes.');
    }
  };

  const handleCancel = () => {
    setError(null);
    onCancelEdit();
  };

  const hasContent = isEditing
    ? Boolean(draft?.title.trim() || draft?.content.trim())
    : Boolean((note.title || '').trim() || (note.content || '').trim());

  return (
    <article className="note-card" style={{ background: note.color || 'var(--card-bg)' }}>
      <div className="note-card-body">
        {isEditing ? (
          <>
            <input
              type="text"
              value={draft.title}
              placeholder="Title..."
              onChange={(event) => onEditField('title', event.target.value)}
            />
            <textarea
              rows={4}
              value={draft.content}
              placeholder="Content..."
              onChange={(event) => onEditField('content', event.target.value)}
            />
          </>
        ) : (
          <>
            <h3>{note.title || 'Untitled'}</h3>
            <p>{note.content || 'No content yet.'}</p>
          </>
        )}
      </div>
      <div className="note-card-footer">
        <div className="note-color-picker">
          <button
            type="button"
            aria-label="Change card color"
            className={`color-dot ${isPremium ? '' : 'locked'}`}
            style={{ background: note.color || '#e2e8f0' }}
            onClick={handlePaletteToggle}
          >
            {!isPremium && '🔒'}
          </button>
          {showPalette && (
            <div className="color-popover">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="color-swatch"
                  style={{ background: color }}
                  onClick={() => handleColorPick(color)}
                  disabled={colorSaving}
                />
              ))}
            </div>
          )}
          {showUpsell && (
            <div className="color-popover color-upsell-popover">
              <PremiumColorUpsell onClose={() => setShowUpsell(false)} />
            </div>
          )}
        </div>
        <div className="note-card-actions">
          {isEditing ? (
            <>
              <button type="button" className="notes-btn secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="notes-btn primary"
                onClick={handleSave}
                disabled={!hasContent}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button type="button" className="notes-btn secondary" onClick={onStartEdit}>
                Edit
              </button>
              <button type="button" className="notes-btn danger" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className="note-card-error">{error}</p>}
    </article>
  );
};

export default NoteCard;
