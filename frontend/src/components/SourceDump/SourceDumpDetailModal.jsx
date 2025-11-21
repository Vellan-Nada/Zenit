import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

const SourceDumpDetailModal = ({ card, isPremium, onClose, onEdit, onDelete }) => {
  const [signedShots, setSignedShots] = useState([]);

  useEffect(() => {
    const resolveShots = async () => {
      if (!isPremium || !card?.screenshots?.length) {
        setSignedShots([]);
        return;
      }
      try {
        const urls = await Promise.all(
          card.screenshots.map(async (path) => {
            const { data, error } = await supabase.storage.from('source-screenshots').createSignedUrl(path, 3600);
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
    if (card) resolveShots();
  }, [card, isPremium]);

  if (!card) return null;

  const links = (card.links || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="sd-modal" role="dialog" aria-modal="true">
      <div className="sd-modal-content">
        <div className="sd-modal-header">
          <h2>{card.title}</h2>
          <button type="button" className="sd-close" onClick={onClose}>✕</button>
        </div>
        <div className="sd-section">
          <strong>Links</strong>
          {links.length === 0 ? <p className="sd-muted">No links</p> : (
            <div className="sd-links">
              {links.map((l) => (
                <a key={l} href={l} target="_blank" rel="noreferrer">{l}</a>
              ))}
            </div>
          )}
        </div>
        <div className="sd-section">
          <strong>Text</strong>
          <p className="sd-text-full">{card.text_content || '—'}</p>
        </div>
        {isPremium && signedShots.length > 0 && (
          <div className="sd-section">
            <strong>Screenshots</strong>
            <div className="sd-shots">
              {signedShots.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="screenshot" />
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="sd-modal-actions">
          <button type="button" className="sd-btn ghost" onClick={() => onEdit(card)}>Edit</button>
          <button
            type="button"
            className="sd-btn danger"
            onClick={() => {
              if (window.confirm('Delete this source? This action cannot be undone.')) onDelete(card);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceDumpDetailModal;
