import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import SourceDumpModal from '../../components/SourceDump/SourceDumpModal.jsx';
import SourceCard from '../../components/SourceDump/SourceCard.jsx';
import SourceDumpDetailModal from '../../components/SourceDump/SourceDumpDetailModal.jsx';
import '../../styles/SourceDump.css';

const SourceDumpPage = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const isPremium = Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  useEffect(() => {
    if (authLoading || profileLoading || !user) return;
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
  if (!user) return <div className="sd-empty">Please log in to use Source Dump.</div>;

  return (
    <section className="sd-page">
      <div className="sd-header">
        <div>
          <p className="sd-subtitle">Use Source Dump to store links, notes, and screenshots related to your work.</p>
          <h1>Source dump</h1>
        </div>
        <div className="sd-info" title="Use Source Dump to store links, notes, and screenshots related to your work.">i</div>
      </div>
      <div className="sd-actions">
        <button type="button" className="sd-btn primary" onClick={() => { setActiveItem(null); setModalOpen(true); }}>
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
        userId={user.id}
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
