import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useGuest } from '../../context/GuestContext.jsx';
import AddNoteForm from '../../components/Notes/AddNoteForm.jsx';
import NotesGrid from '../../components/Notes/NotesGrid.jsx';
import UpgradeToPremium from '../../components/Notes/UpgradeToPremium.jsx';
import PremiumColorUpsell from '../../components/PremiumColorUpsell.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import '../../styles/Notes.css';
import { goToSignup } from '../../utils/guestSignup.js';
import { NoteIcon } from '../../components/FeatureIcons.jsx';

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

const FREE_NOTE_LIMIT = 15;

const NotesPage = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const { guestData, setGuestData } = useGuest();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '' });
  const [addError, setAddError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', content: '' });
  const [colorSavingId, setColorSavingId] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [modalError, setModalError] = useState(null);

  const guestMode = !user;
  const isPremium = guestMode ? false : Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);
  const noteCount = notes.length;
  const limitReached = !isPremium && noteCount >= FREE_NOTE_LIMIT;

  useEffect(() => {
    if (authLoading) return;
    if (guestMode) {
      setNotes(guestData.notes || []);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (isMounted) {
          setNotes(data || []);
          setGlobalError(null);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setGlobalError('Unable to load notes.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotes();
    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  const resetForm = () => {
    setForm({ title: '', content: '' });
    setAddError(null);
  };

  const openDetail = (note) => {
    setSelectedNote(note);
    setPaletteOpen(false);
    setUpsellOpen(false);
    setModalError(null);
  };

  const handleAddNote = async () => {
    if (limitReached) {
      setShowLimitAlert(true);
      return;
    }
    setShowLimitAlert(false);
    const payload = {
      title: form.title.trim() || null,
      content: form.content.trim() || null,
    };
    if (!payload.title && !payload.content) {
      setAddError('Title or content is required.');
      return;
    }
    setAdding(true);
    try {
      if (guestMode) {
        const newNote = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
        setNotes((prev) => [newNote, ...prev]);
        setGuestData((prev) => ({ ...prev, notes: [newNote, ...(prev.notes || [])] }));
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert({ ...payload, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        setNotes((prev) => [data, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      setAddError(err.message || 'Unable to add note.');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditDraft({
      title: note.title || '',
      content: note.content || '',
    });
  };

  const handleEditField = (field, value) => {
    setEditDraft((prev) => ({ ...prev, [field]: value }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ title: '', content: '' });
  };

  const saveEdit = async (noteId) => {
    if (!editDraft.title.trim() && !editDraft.content.trim()) {
      throw new Error('Title or content is required.');
    }
    const updates = {
      title: editDraft.title.trim() || null,
      content: editDraft.content.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (guestMode) {
      setNotes((prev) =>
        prev.map((note) => (note.id === noteId ? { ...note, ...updates } : note))
      );
      setGuestData((prev) => ({
        ...prev,
        notes: (prev.notes || []).map((note) => (note.id === noteId ? { ...note, ...updates } : note)),
      }));
    } else {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', noteId)
        .select()
        .single();
      if (error) throw error;
      setNotes((prev) => prev.map((note) => (note.id === noteId ? data : note)));
    }
    cancelEdit();
  };

  const deleteNote = async (noteId) => {
    if (guestMode) {
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      setGuestData((prev) => ({
        ...prev,
        notes: (prev.notes || []).filter((note) => note.id !== noteId),
      }));
      return;
    }
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) throw error;
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const closeDetail = () => {
    setSelectedNote(null);
    setPaletteOpen(false);
    setUpsellOpen(false);
    setModalError(null);
  };

  const changeColor = async (noteId, color) => {
    if (!isPremium) return;
    setColorSavingId(noteId);
    try {
      if (guestMode) {
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? { ...note, color, updated_at: new Date().toISOString() } : note))
        );
        setGuestData((prev) => ({
          ...prev,
          notes: (prev.notes || []).map((note) =>
            note.id === noteId ? { ...note, color, updated_at: new Date().toISOString() } : note
          ),
        }));
      } else {
        const { data, error } = await supabase
          .from('notes')
          .update({ color, updated_at: new Date().toISOString() })
          .eq('id', noteId)
          .select()
          .single();
        if (error) throw error;
        setNotes((prev) => prev.map((note) => (note.id === noteId ? data : note)));
      }
    } catch (err) {
      throw err;
    } finally {
      setColorSavingId(null);
    }
  };

  const handlePaletteToggle = () => {
    if (!selectedNote) return;
    if (!isPremium) {
      setUpsellOpen((prev) => !prev);
      setPaletteOpen(false);
      return;
    }
    setUpsellOpen(false);
    setPaletteOpen((prev) => !prev);
  };

  const handleColorPickModal = async (color) => {
    if (!selectedNote || !isPremium) return;
    setModalError(null);
    try {
      await changeColor(selectedNote.id, color);
      setSelectedNote((prev) => (prev ? { ...prev, color } : prev));
      setPaletteOpen(false);
    } catch (err) {
      setModalError(err.message || 'Unable to update color');
    }
  };

  const beginEditInModal = () => {
    if (!selectedNote) return;
    setEditingId(selectedNote.id);
    setEditDraft({
      title: selectedNote.title || '',
      content: selectedNote.content || '',
    });
    setModalError(null);
  };

  const handleModalSave = async () => {
    if (!selectedNote) return;
    const updates = {
      title: editDraft.title?.trim() || null,
      content: editDraft.content?.trim() || null,
    };
    try {
      await saveEdit(selectedNote.id);
      setSelectedNote((prev) => (prev ? { ...prev, ...updates } : prev));
      setModalError(null);
    } catch (err) {
      setModalError(err.message || 'Unable to save changes.');
    }
  };

  const handleModalDelete = async () => {
    if (!selectedNote) return;
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await deleteNote(selectedNote.id);
      closeDetail();
    } catch (err) {
      setModalError(err.message || 'Unable to delete note.');
    }
  };

  if (authLoading || profileLoading) {
    return <LoadingSpinner label="Loading workspace…" />;
  }

  return (
    <section className="notes-page">
      <header className="notes-header">
        <div>
          <h1 className="pageTitleWithIcon">
            <NoteIcon className="pageTitleIcon" />
            Notes
          </h1>
        </div>
      </header>

      {!user && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. Notes won’t be saved if you leave.{' '}
          <button
            type="button"
            onClick={() => goToSignup(guestData)}
          >
            Sign up
          </button>
        </div>
      )}

      <AddNoteForm
        title={form.title}
        content={form.content}
        onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={handleAddNote}
        onCancel={resetForm}
        disabled={adding}
        limitReached={showLimitAlert && limitReached}
        isPremium={isPremium}
        error={addError}
        loading={adding}
      />

      {limitReached && showLimitAlert && (
        <div className="notes-upgrade-callout">
          <span>Free plan limit reached (15 items). Upgrade to add more.</span>
          <UpgradeToPremium variant="compact" cta="Upgrade to Premium" />
        </div>
      )}

      {globalError && <p style={{ color: 'var(--danger)' }}>{globalError}</p>}

      {loading ? (
        <LoadingSpinner label="Fetching notes…" />
      ) : (
        <NotesGrid
          notes={notes}
          onOpenDetail={openDetail}
        />
      )}

      {selectedNote && (
        <div className="note-modal-backdrop" onClick={closeDetail}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              {editingId === selectedNote.id ? (
                <input
                  type="text"
                  value={editDraft.title}
                  placeholder="Title..."
                  onChange={(event) => handleEditField('title', event.target.value)}
                />
              ) : (
                <h3>{selectedNote.title || 'Untitled'}</h3>
              )}
              <button type="button" className="note-modal-close" onClick={closeDetail} aria-label="Close detail">
                ✕
              </button>
            </div>
            <div className="note-modal-body">
              {editingId === selectedNote.id ? (
                <textarea
                  rows={8}
                  value={editDraft.content}
                  placeholder="Content..."
                  onChange={(event) => handleEditField('content', event.target.value)}
                  className="note-modal-textarea"
                />
              ) : (
                <p>{selectedNote.content || 'No content yet.'}</p>
              )}
            </div>
            <div className="note-modal-actions">
              <div className="note-modal-color">
                <button
                  type="button"
                  aria-label="Change card color"
                  className={`color-dot ${isPremium ? '' : 'locked'}`}
                  style={{ background: selectedNote.color || '#e2e8f0' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePaletteToggle();
                  }}
                >
                  {!isPremium && '🔒'}
                </button>
                {paletteOpen && isPremium && (
                  <div className="color-popover note-modal-popover" onClick={(e) => e.stopPropagation()}>
                    {PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="color-swatch"
                        style={{ background: color }}
                        onClick={() => handleColorPickModal(color)}
                        disabled={colorSavingId === selectedNote.id}
                      />
                    ))}
                  </div>
                )}
                {upsellOpen && !isPremium && (
                  <div className="color-popover color-upsell-popover note-modal-popover" onClick={(e) => e.stopPropagation()}>
                    <PremiumColorUpsell onClose={() => setUpsellOpen(false)} />
                  </div>
                )}
              </div>

              {editingId === selectedNote.id ? (
                <>
                  <button
                    type="button"
                    className="notes-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                      setModalError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="notes-btn primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalSave();
                    }}
                    disabled={!editDraft.title.trim() && !editDraft.content.trim()}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="notes-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      beginEditInModal();
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="notes-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalDelete();
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
            {modalError && <p className="note-card-error">{modalError}</p>}
          </div>
        </div>
      )}
    </section>
  );
};

export default NotesPage;
