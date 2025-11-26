import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useGuest } from '../../context/GuestContext.jsx';
import AddNoteForm from '../../components/Notes/AddNoteForm.jsx';
import NotesGrid from '../../components/Notes/NotesGrid.jsx';
import UpgradeToPremium from '../../components/Notes/UpgradeToPremium.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import '../../styles/Notes.css';

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

  const handleAddNote = async () => {
    if (limitReached) return;
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

  if (authLoading || profileLoading) {
    return <LoadingSpinner label="Loading workspace…" />;
  }

  return (
    <section className="notes-page">
      <header className="notes-header">
        <div>
          <h1>Notes</h1>
        </div>
      </header>

      {!user && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. Notes won’t be saved if you leave. <button type="button" onClick={() => (window.location.href = '/signup')}>Sign up</button>
        </div>
      )}

      <AddNoteForm
        title={form.title}
        content={form.content}
        onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={handleAddNote}
        onCancel={resetForm}
        disabled={limitReached}
        limitReached={limitReached}
        isPremium={isPremium}
        error={addError}
        loading={adding}
      />

      {limitReached && (
        <div className="notes-upgrade-callout">
          <span>You’ve hit the 40-note limit on the free plan. Upgrade for unlimited notes and colors.</span>
          <UpgradeToPremium />
        </div>
      )}

      {globalError && <p style={{ color: 'var(--danger)' }}>{globalError}</p>}

      {loading ? (
        <LoadingSpinner label="Fetching notes…" />
      ) : (
        <NotesGrid
          notes={notes}
          isPremium={isPremium}
          editingNoteId={editingId}
          editDraft={editDraft}
          onStartEdit={startEdit}
          onEditField={handleEditField}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDeleteNote={deleteNote}
          onChangeColor={changeColor}
          colorSavingId={colorSavingId}
        />
      )}
    </section>
  );
};

export default NotesPage;
