import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingSpinner from '../LoadingSpinner.jsx';
import MovieItemModal from './MovieItemModal.jsx';
import MovieItemCard from './MovieItemCard.jsx';
import '../../styles/MovieSeries.css';

const STATUS_LABELS = {
  to_watch: 'Movie / Series to watch',
  watching: 'Movie / Series Watching',
  watched: 'Movie / Series Watched',
};

const MovieSeriesList = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalStatus, setModalStatus] = useState('to_watch');
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const isPremium = Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('movie_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        setItems(data || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load your list.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [authLoading, profileLoading, user]);

  const grouped = useMemo(
    () => ({
      to_watch: items.filter((i) => i.status === 'to_watch'),
      watching: items.filter((i) => i.status === 'watching'),
      watched: items.filter((i) => i.status === 'watched'),
    }),
    [items]
  );

  const openAdd = (status) => {
    setModalMode('add');
    setModalStatus(status);
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setModalMode('edit');
    setModalStatus(item.status);
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (!user) return;
    const base = { ...payload, user_id: user.id };
    setSaving(true);
    try {
      if (modalMode === 'add') {
        const { data, error: insertError } = await supabase
          .from('movie_items')
          .insert(base)
          .select()
          .single();
        if (insertError) throw insertError;
        setItems((prev) => [data, ...prev]);
      } else if (editingItem) {
        const { data, error: updateError } = await supabase
          .from('movie_items')
          .update({
            title: base.title,
            actor_actress: base.actor_actress,
            director: base.director,
            notes: base.notes,
          })
          .eq('id', editingItem.id)
          .select()
          .single();
        if (updateError) throw updateError;
        setItems((prev) => prev.map((it) => (it.id === editingItem.id ? data : it)));
      }
      setModalOpen(false);
      setEditingItem(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to save item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this entry?')) return;
    const { error: deleteError } = await supabase.from('movie_items').delete().eq('id', item.id);
    if (deleteError) {
      alert('Unable to delete this entry.');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleMove = async (item, status) => {
    const { data, error: updateError } = await supabase
      .from('movie_items')
      .update({ status })
      .eq('id', item.id)
      .select()
      .single();
    if (updateError) {
      alert('Unable to move item.');
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
  };

  const handleColor = async (item, color) => {
    if (!isPremium) return;
    const { data, error: updateError } = await supabase
      .from('movie_items')
      .update({ card_color: color })
      .eq('id', item.id)
      .select()
      .single();
    if (updateError) {
      alert('Unable to update color.');
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
  };

  if (authLoading || profileLoading) return <LoadingSpinner label="Loading movie list…" />;
  if (!user) return <div className="movie-empty">Please log in to view your Movie / Series list.</div>;

  return (
    <section className="movie-page">
      <header className="movie-header">
        <h1>Movie / Series List</h1>
      </header>
      {error && <p className="movie-error">{error}</p>}
      {loading ? (
        <LoadingSpinner label="Fetching items…" />
      ) : (
        <div className="movie-columns">
          {['to_watch', 'watching', 'watched'].map((status) => (
            <div key={status} className="movie-column">
              <button
                type="button"
                className="movie-btn primary movie-column-header"
                onClick={() => openAdd(status)}
              >
                + {STATUS_LABELS[status]}
              </button>
              {grouped[status]?.length ? (
                <div className="movie-list">
                  {grouped[status].map((item) => (
                    <MovieItemCard
                      key={item.id}
                      item={item}
                      isPremium={isPremium}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onMove={handleMove}
                      onChangeColor={handleColor}
                    />
                  ))}
                </div>
              ) : (
                <p className="movie-empty">No entries yet.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <MovieItemModal
        isOpen={modalOpen}
        mode={modalMode}
        initialValues={editingItem}
        status={modalStatus}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />
    </section>
  );
};

export default MovieSeriesList;
