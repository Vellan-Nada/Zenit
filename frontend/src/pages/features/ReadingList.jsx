import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import StatusColumn from '../../components/reading-list/StatusColumn.jsx';
import BookFormModal from '../../components/reading-list/BookFormModal.jsx';
import '../../styles/ReadingList.css';

const STATUS_LABELS = {
  want_to_read: 'Books want to read',
  reading: 'Books reading',
  finished: 'Books have been read',
};

const ReadingList = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [defaultStatus, setDefaultStatus] = useState('want_to_read');
  const [activeItem, setActiveItem] = useState(null);

  const isPremium = Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  // Fetch list items when user is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      setLoadingItems(false);
      return;
    }
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('reading_list_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (fetchError) throw fetchError;
        setItems(data || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load your reading list.');
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [authLoading, user]);

  const grouped = useMemo(() => ({
    want_to_read: items.filter((i) => i.status === 'want_to_read'),
    reading: items.filter((i) => i.status === 'reading'),
    finished: items.filter((i) => i.status === 'finished'),
  }), [items]);

  const openCreate = (status) => {
    setModalMode('create');
    setDefaultStatus(status);
    setActiveItem(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setModalMode('edit');
    setActiveItem(item);
    setDefaultStatus(item.status);
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    if (!user) return;
    if (modalMode === 'create') {
      const payload = { ...values, user_id: user.id };
      const { data, error: insertError } = await supabase
        .from('reading_list_items')
        .insert(payload)
        .select()
        .single();
      if (insertError) throw insertError;
      setItems((prev) => [...prev, data]);
    } else if (activeItem) {
      const { data, error: updateError } = await supabase
        .from('reading_list_items')
        .update(values)
        .eq('id', activeItem.id)
        .select()
        .single();
      if (updateError) throw updateError;
      setItems((prev) => prev.map((item) => (item.id === activeItem.id ? data : item)));
    }
    setModalOpen(false);
    setActiveItem(null);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this book from your list?')) return;
    const { error: deleteError } = await supabase.from('reading_list_items').delete().eq('id', item.id);
    if (deleteError) {
      alert('Unable to delete this entry.');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleMove = async (item, status) => {
    const { data, error: updateError } = await supabase
      .from('reading_list_items')
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

  const handleSaveWrapper = async (formValues) => {
    try {
      await handleSave(formValues);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to save item.');
    }
  };

  if (authLoading || profileLoading) return <LoadingSpinner label="Loading reading list…" />;
  if (!user) return <div className="reading-empty">Please log in to view your Reading List.</div>;

  return (
    <section className="reading-page">
      <header className="reading-header">
        <div>
          <p className="reading-subtitle">Track books across your journey.</p>
          <h1>Reading List</h1>
        </div>
        <div className="reading-actions">
          <button type="button" className="reading-btn primary" onClick={() => openCreate('want_to_read')}>
            + {STATUS_LABELS.want_to_read}
          </button>
          <button type="button" className="reading-btn primary" onClick={() => openCreate('reading')}>
            + {STATUS_LABELS.reading}
          </button>
          <button type="button" className="reading-btn primary" onClick={() => openCreate('finished')}>
            + {STATUS_LABELS.finished}
          </button>
        </div>
      </header>

      {error && <p className="reading-error">{error}</p>}

      {loadingItems ? (
        <LoadingSpinner label="Fetching your books…" />
      ) : (
        <div className="reading-columns">
          <StatusColumn
            title={STATUS_LABELS.want_to_read}
            statusId="want_to_read"
            items={grouped.want_to_read}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMove={handleMove}
            isPremium={isPremium}
          />
          <StatusColumn
            title={STATUS_LABELS.reading}
            statusId="reading"
            items={grouped.reading}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMove={handleMove}
            isPremium={isPremium}
          />
          <StatusColumn
            title={STATUS_LABELS.finished}
            statusId="finished"
            items={grouped.finished}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMove={handleMove}
            isPremium={isPremium}
          />
        </div>
      )}

      <BookFormModal
        isOpen={modalOpen}
        mode={modalMode}
        initialValues={activeItem}
        defaultStatus={defaultStatus}
        isPremium={isPremium}
        onClose={() => {
          setModalOpen(false);
          setActiveItem(null);
        }}
        onSave={handleSaveWrapper}
      />
    </section>
  );
};

export default ReadingList;
