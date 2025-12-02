import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useGuest } from '../../context/GuestContext.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import MovieItemModal from './MovieItemModal.jsx';
import MovieItemCard from './MovieItemCard.jsx';
import '../../styles/MovieSeries.css';
import { goToSignup } from '../../utils/guestSignup.js';
import UpgradeToPremium from '../Notes/UpgradeToPremium.jsx';

const STATUS_LABELS = {
  to_watch: 'Movie / Series to watch',
  watching: 'Movie / Series Watching',
  watched: 'Movie / Series Watched',
};

const FREE_LIMIT_PER_STATUS = 7;

const MovieSeriesList = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const { guestData, setGuestData } = useGuest();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalStatus, setModalStatus] = useState('to_watch');
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [limitAlerts, setLimitAlerts] = useState({
    to_watch: false,
    watching: false,
    watched: false,
  });

  const guestMode = !user;
  const isPremium = guestMode ? false : Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (guestMode) {
      setItems(guestData.movieItems || []);
      setLoading(false);
      return;
    }
    if (!user) return;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('movie_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
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
    const count = grouped[status]?.length || 0;
    const isFreeLimitReached = !isPremium && count >= FREE_LIMIT_PER_STATUS;
    if (isFreeLimitReached) {
      setLimitAlerts((prev) => ({ ...prev, [status]: true }));
      return;
    }
    setLimitAlerts((prev) => ({ ...prev, [status]: false }));
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
    const countForStatus = grouped[payload.status]?.length || 0;
    const isEditing = modalMode === 'edit' && Boolean(editingItem);
    const statusUnchanged = isEditing && editingItem?.status === payload.status;
    const isFreeLimitReached = !isPremium && countForStatus >= FREE_LIMIT_PER_STATUS;
    if (!isPremium) {
      if (!isEditing && isFreeLimitReached) {
        setError(`Free plan limit reached (${FREE_LIMIT_PER_STATUS} items). Upgrade to add more.`);
        throw new Error(`Free plan limit reached (${FREE_LIMIT_PER_STATUS} items). Upgrade to add more.`);
      }
      if (isEditing && !statusUnchanged && isFreeLimitReached) {
        setError(`Free plan limit reached (${FREE_LIMIT_PER_STATUS} items). Upgrade to add more.`);
        throw new Error(`Free plan limit reached (${FREE_LIMIT_PER_STATUS} items). Upgrade to add more.`);
      }
    }

    if (guestMode) {
      const base = { ...payload, id: crypto.randomUUID(), user_id: null };
      setSaving(true);
      try {
        if (modalMode === 'add') {
          const newItem = {
            ...base,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setItems((prev) => [...prev, newItem]);
          setGuestData((prev) => ({ ...prev, movieItems: [...(prev.movieItems || []), newItem] }));
        } else if (editingItem) {
          const updated = { ...editingItem, ...payload, updated_at: new Date().toISOString() };
          setItems((prev) => prev.map((it) => (it.id === editingItem.id ? updated : it)));
          setGuestData((prev) => ({
            ...prev,
            movieItems: (prev.movieItems || []).map((it) => (it.id === editingItem.id ? updated : it)),
          }));
        }
        setModalOpen(false);
        setEditingItem(null);
        setError(null);
      } finally {
        setSaving(false);
      }
      return;
    }

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
        setItems((prev) => [...prev, data]);
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
    if (guestMode) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setGuestData((prev) => ({
        ...prev,
        movieItems: (prev.movieItems || []).filter((i) => i.id !== item.id),
      }));
      return;
    }
    const { error: deleteError } = await supabase.from('movie_items').delete().eq('id', item.id);
    if (deleteError) {
      alert('Unable to delete this entry.');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleMove = async (item, status) => {
    if (item.status === status) return;
    const targetCount = grouped[status]?.length || 0;
    if (!isPremium && targetCount >= FREE_LIMIT_PER_STATUS) {
      setLimitAlerts((prev) => ({ ...prev, [status]: true }));
      setError(`Free plan limit reached (${FREE_LIMIT_PER_STATUS} items). Upgrade to add more.`);
      return;
    }

    if (guestMode) {
      const updated = { ...item, status, updated_at: new Date().toISOString() };
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      setGuestData((prev) => ({
        ...prev,
        movieItems: (prev.movieItems || []).map((i) => (i.id === item.id ? updated : i)),
      }));
      return;
    }
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
    if (guestMode) return;
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

  useEffect(() => {
    setLimitAlerts((prev) => {
      const next = { ...prev };
      ['to_watch', 'watching', 'watched'].forEach((status) => {
        const count = grouped[status]?.length || 0;
        if (count < FREE_LIMIT_PER_STATUS) next[status] = false;
      });
      return next;
    });
  }, [grouped]);

  if (authLoading || profileLoading) return <LoadingSpinner label="Loading movie list…" />;

  return (
    <section className="movie-page">
      <header className="movie-header">
        <h1>Movie / Series List</h1>
      </header>
      {!user && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. This list won’t be saved if you leave.{' '}
          <button type="button" onClick={() => goToSignup(guestData)}>
            Sign up
          </button>
        </div>
      )}
      {error && <p className="movie-error">{error}</p>}
      {loading ? (
        <LoadingSpinner label="Fetching items…" />
      ) : (
        <div className="movie-columns">
          {['to_watch', 'watching', 'watched'].map((status) => {
            const count = grouped[status]?.length || 0;
            const freeLimitReached = !isPremium && count >= FREE_LIMIT_PER_STATUS;
            return (
              <div key={status} className="movie-column">
                <button
                  type="button"
                  className="movie-btn primary movie-column-header"
                  onClick={() => openAdd(status)}
                >
                  + {STATUS_LABELS[status]}
                </button>
                {freeLimitReached && limitAlerts[status] && (
                  <div className="movie-alert">
                    <p>Free plan limit reached ({FREE_LIMIT_PER_STATUS} items). Upgrade to add more.</p>
                    {!isPremium && <UpgradeToPremium variant="compact" />}
                  </div>
                )}
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
            );
          })}
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
