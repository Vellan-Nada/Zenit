import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import PremiumColorUpsell from '../PremiumColorUpsell.jsx';
import { SourceIcon, NoteIcon, CameraIcon } from '../FeatureIcons.jsx';

const COLOR_PRESETS = ['#f8fafc', '#e0f2fe', '#fef9c3', '#dcfce7', '#ffe4e6'];

const SourceCard = ({ card, isPremium, onChangeColor, onClick }) => {
  const [colorMenu, setColorMenu] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [signedShots, setSignedShots] = useState([]);

  const links = (card.links || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bg = isPremium && card.background_color ? card.background_color : '#fff';

  useEffect(() => {
    const resolveShots = async () => {
      if (!isPremium || !card.screenshots?.length) {
        setSignedShots([]);
        return;
      }
      try {
        const urls = await Promise.all(
          card.screenshots.map(async (path) => {
            const { data, error } = await supabase.storage
              .from('source-screenshots')
              .createSignedUrl(path, 3600);
            if (error) throw error;
            return data.signedUrl;
          })
        );
        setSignedShots(urls);
      } catch (err) {
        console.error('Signed URL error', err);
        setSignedShots([]);
      }
    };
    resolveShots();
  }, [card.screenshots, isPremium]);

  const handleColorToggle = () => {
    if (!isPremium) {
      setShowUpsell((prev) => !prev);
      setColorMenu(false);
      return;
    }
    setShowUpsell(false);
    setColorMenu((prev) => !prev);
  };

  const handleColorPick = (color) => {
    onChangeColor(card, color);
    setColorMenu(false);
  };

  return (
    <article
      className="sd-card"
      style={{ background: bg }}
      onClick={() => onClick?.(card)}
      role="button"
      tabIndex={0}
    >
      <div className="sd-card-header">
        <h3 title={card.title}>{card.title}</h3>
      </div>
      <div className="sd-card-body">
        {links.length > 0 && (
          <div className="sd-section">
            <strong className="sd-label">
              <SourceIcon className="sd-label-icon" size={18} />
              Links
            </strong>
            <div className="sd-links">
              {links.slice(0, 2).map((l) => (
                <a key={l} href={l} target="_blank" rel="noreferrer">
                  {l}
                </a>
              ))}
              {links.length > 2 && <span className="sd-muted">+{links.length - 2} more…</span>}
            </div>
          </div>
        )}
        {card.text_content && (
          <div className="sd-section">
            <strong className="sd-label">
              <NoteIcon className="sd-label-icon" size={18} />
              Text
            </strong>
            <p className="sd-text">{card.text_content}</p>
          </div>
        )}
        {isPremium && signedShots.length > 0 && (
          <div className="sd-section">
            <strong className="sd-label">
              <CameraIcon className="sd-label-icon" size={18} />
              Screenshots
            </strong>
            <div className="sd-shots">
              {signedShots.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="screenshot" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="sd-card-actions">
        <div className="sd-color-wrap">
          <button
            type="button"
            className={`sd-color-dot ${!isPremium ? 'locked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleColorToggle();
            }}
            aria-label="Change background color"
            style={{ background: card.background_color || '#e2e8f0' }}
          >
            {!isPremium && '🔒'}
          </button>
          {colorMenu && isPremium && (
            <div className="sd-color-popover" onClick={(e) => e.stopPropagation()}>
              <div className="sd-color-grid">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{ background: c }}
                    onClick={() => handleColorPick(c)}
                  />
                ))}
                <button
                  type="button"
                  className="sd-color-default"
                  onClick={() => handleColorPick(null)}
                  aria-label="Reset color"
                />
              </div>
              <button type="button" className="sd-btn ghost" onClick={() => setColorMenu(false)}>
                Cancel
              </button>
            </div>
          )}
          {showUpsell && (
            <div className="sd-color-popover" onClick={(e) => e.stopPropagation()}>
              <PremiumColorUpsell onClose={() => setShowUpsell(false)} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default SourceCard;
