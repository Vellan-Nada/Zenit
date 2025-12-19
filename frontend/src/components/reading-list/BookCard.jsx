import { useState } from 'react';
import PremiumColorUpsell from '../PremiumColorUpsell.jsx';

const STATUS_OPTIONS = [
  { id: 'want_to_read', label: 'Move to: Books want to read' },
  { id: 'reading', label: 'Move to: Books reading' },
  { id: 'finished', label: 'Move to: Books have been read' },
];

const COLOR_PRESETS = [
  '#FFFFFF',
  '#FDF4FF',
  '#FEF3C7',
  '#E0F2FE',
  '#D1FAE5',
  '#FFE4E6',
  '#DCFCE7',
  '#F1F5F9',
  '#A19B9BFF',
  '#E9D5FF',
  '#E0E7FF',
  '#F5F3FF',
];

const BookCard = ({ item, isPremium, onEdit, onDelete, onMove, onChangeColor }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  const bg = isPremium && item.background_color ? item.background_color : '#fff';

  const handleColorClick = () => {
    if (!isPremium) {
      setShowUpsell((prev) => !prev);
      setColorOpen(false);
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
          <button
            type="button"
            className={`reading-color ${isPremium ? '' : 'locked'}`}
            aria-label="Change color"
            onClick={handleColorClick}
            style={{ background: isPremium ? item.background_color || '#fff' : '#e2e8f0' }}
          >
            {!isPremium && '🔒'}
          </button>
          <button type="button" className="reading-btn ghost" onClick={() => onEdit(item)}>
            Edit
          </button>
          <button type="button" className="reading-btn danger" onClick={() => onDelete(item)}>
            Delete
          </button>
          {colorOpen && isPremium && (
            <div className="reading-color-popover" onClick={(e) => e.stopPropagation()}>
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
              </div>
            </div>
          )}
          {showUpsell && (
            <div className="reading-color-popover color-upsell-popover" onClick={(e) => e.stopPropagation()}>
              <PremiumColorUpsell onClose={() => setShowUpsell(false)} />
            </div>
          )}
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
