import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useGuest } from '../../context/GuestContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import JournalHeader from '../../components/Journal/JournalHeader.jsx';
import MonthGrid from '../../components/Journal/MonthGrid.jsx';
import JournalEntryModal from '../../components/Journal/JournalEntryModal.jsx';
import JournalReport from '../../components/Journal/JournalReport.jsx';
import PremiumUpsell from '../../components/Journal/PremiumUpsell.jsx';
import '../../styles/Journal.css';
import { useNavigate } from 'react-router-dom';
import { goToSignup } from '../../utils/guestSignup.js';

const formatKey = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const JournalPage = () => {
  const navigate = useNavigate();
  const { user, token, profile, authLoading, profileLoading } = useAuth();
  const { guestData, setGuestData } = useGuest();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const guestMode = !user;
  const isPremium = guestMode ? false : Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  const entriesMap = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      map[e.entry_date] = e;
    });
    return map;
  }, [entries]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (guestMode) {
      const allEntries = guestData.journalEntries || [];
      const startDate = formatKey(year, month, 1);
      const endDate = formatKey(year, month, new Date(year, month + 1, 0).getDate());
      const filtered = allEntries.filter((e) => e.entry_date >= startDate && e.entry_date <= endDate);
      setEntries(filtered);
      setLoading(false);
      return;
    }
    if (!user) return;
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const start = formatKey(year, month, 1);
        const end = formatKey(year, month, new Date(year, month + 1, 0).getDate());
        const { data, error: fetchError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('entry_date', start)
          .lte('entry_date', end)
          .order('entry_date', { ascending: true });
        if (fetchError) throw fetchError;
        setEntries(data || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load entries.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [authLoading, profileLoading, guestMode, month, year, user, guestData.journalEntries]);

  const openDate = (dateKey) => {
    setModalDate(dateKey);
    setModalOpen(true);
  };

  const handleSaveEntry = async (form) => {
    if (!modalDate) return;
    const existing = entriesMap[modalDate];
    if (guestMode) {
      if (existing) {
        const updated = { ...existing, ...form, updated_at: new Date().toISOString() };
        setEntries((prev) => prev.map((e) => (e.id === existing.id ? updated : e)));
        setGuestData((prev) => ({
          ...prev,
          journalEntries: (prev.journalEntries || []).map((e) => (e.id === existing.id ? updated : e)),
        }));
      } else {
        const newEntry = {
          ...form,
          id: crypto.randomUUID(),
          user_id: null,
          entry_date: modalDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setEntries((prev) => [...prev, newEntry]);
        setGuestData((prev) => ({ ...prev, journalEntries: [...(prev.journalEntries || []), newEntry] }));
      }
    } else if (user) {
      if (existing) {
        const { data, error: updateError } = await supabase
          .from('journal_entries')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        if (updateError) throw updateError;
        setEntries((prev) => prev.map((e) => (e.id === existing.id ? data : e)));
      } else {
        const { data, error: insertError } = await supabase
          .from('journal_entries')
          .insert({ ...form, user_id: user.id, entry_date: modalDate })
          .select()
          .single();
        if (insertError) throw insertError;
        setEntries((prev) => [...prev, data]);
      }
    }
    setModalOpen(false);
    setModalDate(null);
  };

  const handleDeleteEntry = async () => {
    const existing = entriesMap[modalDate];
    if (!existing) return;
    if (guestMode) {
      setEntries((prev) => prev.filter((e) => e.id !== existing.id));
      setGuestData((prev) => ({
        ...prev,
        journalEntries: (prev.journalEntries || []).filter((e) => e.id !== existing.id),
      }));
      setModalOpen(false);
      setModalDate(null);
      return;
    }
    const { error: deleteError } = await supabase.from('journal_entries').delete().eq('id', existing.id);
    if (deleteError) throw deleteError;
    setEntries((prev) => prev.filter((e) => e.id !== existing.id));
    setModalOpen(false);
    setModalDate(null);
  };

  const handleReport = async () => {
    if (!isPremium || guestMode) {
      setReportOpen(true);
      return;
    }
    setReportLoading(true);
    setReportOpen(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id);
      if (fetchError) throw fetchError;
      setReportError(null);
      setEntries(data || entries); // sync if needed
    } catch (err) {
      console.error(err);
      setReportError(err.message || 'Unable to load report.');
    } finally {
      setReportLoading(false);
    }
  };

  const startUpgrade = async () => {
    navigate('/upgrade');
  };

  if (authLoading || profileLoading) return <LoadingSpinner label="Loading journal…" />;

  return (
    <section className="journal-page">
      <JournalHeader
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
        onReport={handleReport}
      />
      {!user && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. Journal entries won’t be saved if you leave.{' '}
          <button
            type="button"
            onClick={() => goToSignup(guestData)}
          >
            Sign up
          </button>
        </div>
      )}
      {error && <p className="journal-error">{error}</p>}
      {loading ? (
        <LoadingSpinner label="Fetching entries…" />
      ) : (
        <MonthGrid month={month} year={year} entriesMap={entriesMap} onSelectDate={openDate} />
      )}

      <JournalEntryModal
        isOpen={modalOpen}
        dateKey={modalDate}
        existingEntry={modalDate ? entriesMap[modalDate] : null}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        onClose={() => {
          setModalOpen(false);
          setModalDate(null);
        }}
      />

      {reportOpen && (
        <div className="journal-modal" role="dialog" aria-modal="true">
          <div className="journal-modal-content">
            <div className="journal-modal-header">
              <h2>Journal Report</h2>
              <button type="button" className="journal-close" onClick={() => setReportOpen(false)}>
                ✕
              </button>
            </div>
            {!isPremium ? (
              <PremiumUpsell onUpgrade={startUpgrade} />
            ) : reportLoading ? (
              <LoadingSpinner label="Crunching numbers…" />
            ) : reportError ? (
              <p className="journal-error">{reportError}</p>
            ) : (
              <JournalReport entries={entries} />
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default JournalPage;
