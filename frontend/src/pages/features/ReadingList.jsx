import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useGuest } from '../../context/GuestContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import StatusColumn from '../../components/reading-list/StatusColumn.jsx';
import BookFormModal from '../../components/reading-list/BookFormModal.jsx';
import '../../styles/ReadingList.css';
import { goToSignup } from '../../utils/guestSignup.js';

const STATUS_LABELS = {
  want_to_read: 'Books want to read',
  reading: 'Books reading',
  finished: 'Books have been read',
};

const FREE_LIMIT_PER_STATUS = 7;

const ReadingList = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const { guestData, setGuestData } = useGuest();
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [defaultStatus, setDefaultStatus] = useState('want_to_read');
  const [activeItem, setActiveItem] = useState(null);
  const [limitAlerts, setLimitAlerts] = useState({
    want_to_read: false,
    reading: false,
    finished: false,
  });

  const guestMode = !user;
  const isPremium = guestMode ? false : Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  // Fetch list items when user is ready
  useEffect(() => {
    if (authLoading) return;
    if (guestMode) {
      setItems(guestData.readingList || []);
      setLoadingItems(false);
      return;
    }
    if (!user) return;
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

  useEffect(() => {
    // reset alerts when counts drop below limit
    setLimitAlerts((prev) => {
      const next = { ...prev };
      ['want_to_read', 'reading', 'finished'].forEach((status) => {
        const count = grouped[status]?.length || 0;
        if (count < FREE_LIMIT_PER_STATUS) next[status] = false;
      });
      return next;
    });
  }, [grouped]);

  const openCreate = (status) => {
    const count = grouped[status]?.length || 0;
    const isFreeLimitReached = !isPremium && count >= FREE_LIMIT_PER_STATUS;
    if (isFreeLimitReached) {
      setLimitAlerts((prev) => ({ ...prev, [status]: true }));
      return;
    }
    setLimitAlerts((prev) => ({ ...prev, [status]: false }));
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
    const status = values.status || defaultStatus;
    const countForStatus = grouped[status]?.length || 0;
    const isEditing = modalMode === 'edit' && Boolean(activeItem);
    const currentStatus = activeItem?.status;
    const statusUnchanged = isEditing && currentStatus === status;

    // enforce free limit: allow editing within the same status even at the limit
    if (!isPremium) {
      if (!isEditing && countForStatus >= FREE_LIMIT_PER_STATUS) {
        setLimitAlerts((prev) => ({ ...prev, [status]: true }));
        throw new Error(`Free plan limit reached (${FREE_LIMIT_PER_STATUS} items). Upgrade to add more.`);
      }
      if (isEditing && !statusUnchanged && countForStatus >= FREE_LIMIT_PER_STATUS) {
        setLimitAlerts((prev) => ({ ...prev, [status]: true }));
        throw new Error(`Free plan limit reached (${FREE_LIMIT_PER_STATUS} items). Upgrade to add more.`);
      }
    }

    if (guestMode) {
      if (modalMode === 'create') {
        const newItem = {
          ...values,
          status,
          id: crypto.randomUUID(),
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setItems((prev) => [...prev, newItem]);
        setGuestData((prev) => ({ ...prev, readingList: [...(prev.readingList || []), newItem] }));
      } else if (activeItem) {
        const updated = { ...activeItem, ...values, status, updated_at: new Date().toISOString() };
        setItems((prev) => prev.map((item) => (item.id === activeItem.id ? updated : item)));
        setGuestData((prev) => ({
          ...prev,
          readingList: (prev.readingList || []).map((item) => (item.id === activeItem.id ? updated : item)),
        }));
      }
    } else if (user) {
      if (modalMode === 'create') {
        const payload = { ...values, status, user_id: user.id };
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
          .update({ ...values, status })
          .eq('id', activeItem.id)
          .select()
          .single();
        if (updateError) throw updateError;
        setItems((prev) => prev.map((item) => (item.id === activeItem.id ? data : item)));
      }
    }
    setModalOpen(false);
    setActiveItem(null);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this book from your list?')) return;
    if (guestMode) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setGuestData((prev) => ({
        ...prev,
        readingList: (prev.readingList || []).filter((i) => i.id !== item.id),
      }));
      return;
    }
    const { error: deleteError } = await supabase.from('reading_list_items').delete().eq('id', item.id);
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
        readingList: (prev.readingList || []).map((i) => (i.id === item.id ? updated : i)),
      }));
      return;
    }
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

  const handleColor = async (item, color) => {
    if (!isPremium) return;
    if (guestMode) return;
    const { data, error: updateError } = await supabase
      .from('reading_list_items')
      .update({ background_color: color })
      .eq('id', item.id)
      .select()
      .single();
    if (updateError) {
      alert('Unable to update color.');
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

  return (
    <section className="reading-page">
      <header className="reading-header">
        <div>
          <h1>Reading List</h1>
        </div>
      </header>
      {!user && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. Your reading list won’t be saved if you leave.{' '}
          <button
            type="button"
            onClick={() => {
              goToSignup(guestData);
            }}
          >
            Sign up
          </button>
        </div>
      )}

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
            onAdd={openCreate}
            onChangeColor={handleColor}
            isPremium={isPremium}
            freeLimitReached={!isPremium && (grouped.want_to_read?.length || 0) >= FREE_LIMIT_PER_STATUS}
            freeLimit={FREE_LIMIT_PER_STATUS}
            showLimit={limitAlerts.want_to_read}
          />
          <StatusColumn
            title={STATUS_LABELS.reading}
            statusId="reading"
            items={grouped.reading}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMove={handleMove}
            onAdd={openCreate}
            onChangeColor={handleColor}
            isPremium={isPremium}
            freeLimitReached={!isPremium && (grouped.reading?.length || 0) >= FREE_LIMIT_PER_STATUS}
            freeLimit={FREE_LIMIT_PER_STATUS}
            showLimit={limitAlerts.reading}
          />
          <StatusColumn
            title={STATUS_LABELS.finished}
            statusId="finished"
            items={grouped.finished}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMove={handleMove}
            onAdd={openCreate}
            onChangeColor={handleColor}
            isPremium={isPremium}
            freeLimitReached={!isPremium && (grouped.finished?.length || 0) >= FREE_LIMIT_PER_STATUS}
            freeLimit={FREE_LIMIT_PER_STATUS}
            showLimit={limitAlerts.finished}
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
