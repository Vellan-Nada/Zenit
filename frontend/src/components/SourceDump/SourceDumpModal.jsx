import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

const EMPTY = {
  title: '',
  links: '',
  text_content: '',
  screenshots: [], // store storage paths when bucket is private
};

const SourceDumpModal = ({ isOpen, initialData, isPremium, userId, onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pasteHint, setPasteHint] = useState('Paste images here');

  useEffect(() => {
    if (initialData) {
      setForm({ ...EMPTY, ...initialData });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    await onSaved(form);
  };

  const handleUpload = async (files) => {
    if (!isPremium || !files?.length) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const ext = file.name.split('.').pop();
          const path = `${userId}/${initialData?.id || 'new'}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('source-screenshots').upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          });
          if (uploadError) throw uploadError;
          return path; // store path, not public URL, in private bucket
        })
      );
      setForm((prev) => ({ ...prev, screenshots: [...(prev.screenshots || []), ...uploads] }));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (event) => {
    if (!isPremium) return;
    const items = event.clipboardData?.items || [];
    const files = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.type?.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) {
      handleUpload(files);
      setPasteHint('Images detected and uploading…');
    } else {
      setPasteHint('No images detected on clipboard.');
      setTimeout(() => setPasteHint('Paste images here'), 1500);
    }
  };

  const handleRemoveShot = (url) => {
    setForm((prev) => ({ ...prev, screenshots: (prev.screenshots || []).filter((s) => s !== url) }));
  };

  return (
    <div className="sd-modal" role="dialog" aria-modal="true">
      <div className="sd-modal-content">
        <div className="sd-modal-header">
          <h2>{initialData ? 'Edit source' : 'Add source'}</h2>
          <button type="button" className="sd-close" onClick={onClose}>✕</button>
        </div>
        <div className="sd-form">
          <label>
            <span>Title</span>
            <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
          </label>
          <label>
            <span>Links</span>
            <textarea
              rows={3}
              value={form.links}
              onChange={(e) => handleChange('links', e.target.value)}
              placeholder="Paste any links here (one per line)…"
            />
          </label>
          <label>
            <span>Text</span>
            <textarea
              rows={4}
              value={form.text_content}
              onChange={(e) => handleChange('text_content', e.target.value)}
              placeholder="Paste copied text or write notes…"
            />
          </label>

          <div className="sd-section">
            <span>Screenshots</span>
            {isPremium ? (
              <div className="sd-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <div
                  className="sd-paste"
                  contentEditable
                  suppressContentEditableWarning
                  onPaste={handlePaste}
                >
                  {pasteHint}
                </div>
                {uploading && <p className="sd-muted">Uploading…</p>}
                {form.screenshots?.length > 0 && (
                  <div className="sd-shots">
                    {form.screenshots.map((path) => (
                      <div key={path} className="sd-shot-item">
                        <span className="sd-muted">{path}</span>
                        <button type="button" onClick={() => handleRemoveShot(path)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="sd-locked-area" onClick={() => setError('Screenshots are premium only.')}>🔒 Screenshots are a premium feature.</div>
            )}
          </div>
        </div>
        {error && <p className="sd-error">{error}</p>}
        <div className="sd-modal-actions">
          <button type="button" className="sd-btn ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="sd-btn primary" onClick={handleSave} disabled={uploading}>
            {initialData ? 'Save changes' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceDumpModal;
