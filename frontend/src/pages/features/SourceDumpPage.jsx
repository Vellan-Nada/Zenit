import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useGuest } from '../../context/GuestContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import SourceDumpModal from '../../components/SourceDump/SourceDumpModal.jsx';
import SourceCard from '../../components/SourceDump/SourceCard.jsx';
import SourceDumpDetailModal from '../../components/SourceDump/SourceDumpDetailModal.jsx';
import '../../styles/SourceDump.css';

const SourceDumpPage = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const { guestData, setGuestData } = useGuest();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const guestMode = !user;
  const isPremium = guestMode ? false : Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);
  const FREE_LIMIT = 7;
  const limitReached = !isPremium && items.length >= FREE_LIMIT;

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (guestMode) {
      setItems(guestData.sourceDumps || []);
      setLoading(false);
      return;
    }
    if (!user) return;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('source_dumps')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        setItems(data || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load source dumps.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [authLoading, profileLoading, user]);

  const handleSave = async (payload) => {
    const isFreeLimitReached = limitReached && !activeItem;
    if (isFreeLimitReached) {
      throw new Error(`Free plan limit reached (${FREE_LIMIT} items). Upgrade to add more.`);
    }

    if (guestMode) {
      if (activeItem) {
        const updated = {
          ...activeItem,
          ...payload,
          updated_at: new Date().toISOString(),
        };
        setItems((prev) => prev.map((i) => (i.id === activeItem.id ? updated : i)));
        setGuestData((prev) => ({
          ...prev,
          sourceDumps: (prev.sourceDumps || []).map((i) => (i.id === activeItem.id ? updated : i)),
        }));
        setDetailItem(null);
      } else {
        const newItem = {
          ...payload,
          id: crypto.randomUUID(),
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setItems((prev) => [newItem, ...prev]);
        setGuestData((prev) => ({ ...prev, sourceDumps: [newItem, ...(prev.sourceDumps || [])] }));
      }
      setModalOpen(false);
      setActiveItem(null);
      return;
    }

    if (!user) return;
    if (activeItem) {
      const { data, error: updateError } = await supabase
        .from('source_dumps')
        .update({
          title: payload.title,
          links: payload.links || null,
          text_content: payload.text_content || null,
          screenshots: payload.screenshots || [],
        })
        .eq('id', activeItem.id)
        .select()
        .single();
      if (updateError) throw updateError;
      setItems((prev) => prev.map((i) => (i.id === activeItem.id ? data : i)));
      setDetailItem(null);
    } else {
      const { data, error: insertError } = await supabase
        .from('source_dumps')
        .insert({
          user_id: user.id,
          title: payload.title,
          links: payload.links || null,
          text_content: payload.text_content || null,
          screenshots: payload.screenshots || [],
        })
        .select()
        .single();
      if (insertError) throw insertError;
      setItems((prev) => [data, ...prev]);
    }
    setModalOpen(false);
    setActiveItem(null);
  };

  const handleDelete = async (card) => {
    if (guestMode) {
      setItems((prev) => prev.filter((i) => i.id !== card.id));
      setGuestData((prev) => ({
        ...prev,
        sourceDumps: (prev.sourceDumps || []).filter((i) => i.id !== card.id),
      }));
      setDetailItem(null);
      return;
    }
    const { error: deleteError } = await supabase.from('source_dumps').delete().eq('id', card.id);
    if (deleteError) {
      alert('Unable to delete.');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== card.id));
    setDetailItem(null);
  };

  const handleChangeColor = async (card, color) => {
    if (!isPremium) return;
    if (guestMode) return;
    const { data, error: updateError } = await supabase
      .from('source_dumps')
      .update({ background_color: color })
      .eq('id', card.id)
      .select()
      .single();
    if (updateError) {
      alert('Unable to update color');
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === card.id ? data : i)));
  };

  if (authLoading || profileLoading || loading) return <LoadingSpinner label="Loading source dump…" />;

  return (
    <section className="sd-page">
      <div className="sd-header">
        <div>
          <h1>Source dump</h1>
        </div>
      </div>
      {!user && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. Source Dumps won’t be saved if you leave.{' '}
          <button type="button" onClick={() => (window.location.href = '/signup')}>
            Sign up
          </button>
        </div>
      )}
      <div className="sd-actions">
        <button
          type="button"
          className="sd-btn primary"
          onClick={() => {
            if (limitReached) {
              setError(`Free plan limit reached (${FREE_LIMIT} items). Upgrade to add more.`);
              return;
            }
            setError(null);
            setActiveItem(null);
            setModalOpen(true);
          }}
        >
          + Add source
        </button>
      </div>
      {error && <p className="sd-error">{error}</p>}
      {items.length === 0 ? (
        <div className="sd-empty">No sources yet. Click “+” to dump your first links, notes, or screenshots.</div>
      ) : (
        <div className="sd-grid">
          {items.map((card) => (
            <SourceCard
              key={card.id}
              card={card}
              isPremium={isPremium}
              onClick={(c) => setDetailItem(c)}
              onDelete={handleDelete}
              onChangeColor={handleChangeColor}
            />
          ))}
        </div>
      )}

      <SourceDumpModal
        isOpen={modalOpen}
        initialData={activeItem}
        isPremium={isPremium}
        userId={user?.id}
        onClose={() => {
          setModalOpen(false);
          setActiveItem(null);
        }}
        onSaved={handleSave}
      />

      <SourceDumpDetailModal
        card={detailItem}
        isPremium={isPremium}
        onClose={() => setDetailItem(null)}
        onEdit={(c) => {
          setActiveItem(c);
          setModalOpen(true);
          setDetailItem(null);
        }}
        onDelete={handleDelete}
      />
    </section>
  );
};

export default SourceDumpPage;
