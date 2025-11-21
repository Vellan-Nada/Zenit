import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ReportCards from '../../components/Pomodoro/ReportCards.jsx';
import '../../styles/Pomodoro.css';

const sum = (arr) => arr.reduce((acc, v) => acc + v, 0);
const dayKey = (dateStr) => new Date(dateStr).toISOString().slice(0, 10);

const computeStreaks = (datesSet) => {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  let current = 0;
  let cursor = new Date(today);
  while (datesSet.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedKeys = Array.from(datesSet).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  sortedKeys.forEach((d) => {
    if (!prev) {
      run = 1;
    } else {
      const prevDate = new Date(prev);
      prevDate.setDate(prevDate.getDate() + 1);
      const expected = prevDate.toISOString().slice(0, 10);
      if (expected === d) {
        run += 1;
      } else {
        run = 1;
      }
    }
    prev = d;
    if (run > best) best = run;
  });

  return { current, best };
};

const PomodoroReportPage = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isPremium = Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isPremium) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('mode', 'pomodoro')
          .eq('completed', true);
        if (fetchError) throw fetchError;
        setSessions(data || []);
      } catch (err) {
        console.error(err);
        setError('Unable to load report.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, isPremium, user]);

  const totals = useMemo(() => {
    return {
      focusSeconds: sum((sessions || []).map((s) => s.duration_seconds || 0)),
    };
  }, [sessions]);

  const averages = useMemo(() => {
    if (!sessions.length) return { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
    const byDay = new Map();
    sessions.forEach((s) => {
      const key = dayKey(s.ended_at);
      byDay.set(key, (byDay.get(key) || 0) + (s.duration_seconds || 0));
    });
    const days = byDay.size || 1;
    const weeks = Math.max(1, days / 7);
    const months = Math.max(1, days / 30);
    const years = Math.max(1, days / 365);
    const total = totals.focusSeconds;
    return {
      daily: total / days,
      weekly: total / weeks,
      monthly: total / months,
      yearly: total / years,
    };
  }, [sessions, totals]);

  const streaks = useMemo(() => {
    const dateSet = new Set((sessions || []).map((s) => dayKey(s.ended_at)));
    return computeStreaks(dateSet);
  }, [sessions]);

  const startUpgrade = () => {
    // Hook into your existing checkout flow (e.g., navigate to /upgrade or call billing API)
    window.location.href = '/upgrade';
  };

  if (authLoading || profileLoading) return <LoadingSpinner label="Loading report…" />;
  if (!user) return <div className="pomodoro-empty">Please sign in to view your report.</div>;

  if (!isPremium) {
    return (
      <section className="pomodoro-report-upgrade">
        <h2>Unlock Pomodoro Reports</h2>
        <p>Detailed focus stats are a premium feature.</p>
        <button type="button" className="pomodoro-btn primary" onClick={startUpgrade}>Upgrade to Premium</button>
      </section>
    );
  }

  return (
    <section className="pomodoro-report-page">
      <div className="pomodoro-topbar">
        <h1>Pomodoro Report</h1>
        <div className="pomodoro-top-actions">
          <button type="button" className="pomodoro-btn ghost" onClick={() => (window.location.href = '/pomodoro')}>Back</button>
        </div>
      </div>
      {loading ? (
        <LoadingSpinner label="Crunching your stats…" />
      ) : (
        <ReportCards totals={totals} averages={averages} streaks={streaks} />
      )}
      {error && <p className="pomodoro-error">{error}</p>}
    </section>
  );
};

export default PomodoroReportPage;
