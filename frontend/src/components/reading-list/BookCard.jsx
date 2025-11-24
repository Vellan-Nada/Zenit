import { useState } from 'react';

const STATUS_OPTIONS = [
  { id: 'want_to_read', label: 'Move to: Books want to read' },
  { id: 'reading', label: 'Move to: Books reading' },
  { id: 'finished', label: 'Move to: Books have been read' },
];

const COLOR_PRESETS = ['#fff7ed', '#eef2ff', '#ecfeff', '#f1f5f9', '#fef9c3', '#e0f2fe'];

const BookCard = ({ item, isPremium, onEdit, onDelete, onMove, onChangeColor }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [lockedMessage, setLockedMessage] = useState(false);

  const bg = isPremium && item.background_color ? item.background_color : '#fff';

  const handleColorClick = () => {
    if (!isPremium) {
      setLockedMessage(true);
      setTimeout(() => setLockedMessage(false), 1800);
      return;
    }
    setColorOpen((prev) => !prev);
  };

  return (
    <article className="reading-card" style={{ background: bg }}>
      <div className="reading-card-body">
        <h3>{item.title || 'Untitled'}</h3>
        {item.author && <p className="reading-author">by {item.author}</p>}
        {item.notes && <p className="reading-notes">{item.notes}</p>}
      </div>
      <div className="reading-card-actions">
        <div className="reading-card-buttons">
          <button type="button" className="reading-btn ghost" onClick={() => onEdit(item)}>
            Edit
          </button>
          <button type="button" className="reading-btn danger" onClick={() => onDelete(item)}>
            Delete
          </button>
          <button type="button" className="reading-color" aria-label="Change color" onClick={handleColorClick}>
            ●
          </button>
          {colorOpen && isPremium && (
            <div className="reading-color-menu">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ background: c }}
                  onClick={() => {
                  onChangeColor?.(item, c);
                  setColorOpen(false);
                }}
                aria-label={`Set color ${c}`}
              />
            ))}
              <button
                type="button"
                style={{ background: '#fff', border: '1px solid var(--border)' }}
                onClick={() => {
                  onChangeColor?.(item, null);
                  setColorOpen(false);
                }}
                aria-label="Reset color"
              />
            </div>
          )}
          {lockedMessage && <div className="reading-locked small">Premium feature</div>}
        </div>
        <div className="reading-move">
          <button type="button" className="reading-btn ghost" onClick={() => setMenuOpen((p) => !p)} aria-label="Move item">
            ⇄ Move
          </button>
          {menuOpen && (
            <div className="reading-move-menu">
              {STATUS_OPTIONS.filter((opt) => opt.id !== item.status).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onMove(item, opt.id);
                    setMenuOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default BookCard;
