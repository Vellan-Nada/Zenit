import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import HabitTable from '../../components/HabitTracker/HabitTable.jsx';
import AddHabitModal from '../../components/HabitTracker/AddHabitModal.jsx';
import StreakSummaryCard from '../../components/HabitTracker/StreakSummaryCard.jsx';
import HistoryList from '../../components/HabitTracker/HistoryList.jsx';
import '../../styles/HabitTracker.css';

const buildDateRangeFrom = (startDate) => {
  if (!startDate) return [];
  const start = new Date(startDate);
  const today = new Date();
  const range = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    range.push({ iso, label });
  }
  return range;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const decorateHabit = (habit, habitLogs, range) => {
  const today = todayIso();
  const statusByDate = {};
  let lastCompleted = null;
  const createdDate = habit.created_at?.slice(0, 10);
  range.forEach((date) => {
    if (createdDate && date.iso < createdDate) {
      statusByDate[date.iso] = 'na';
      return;
    }
    const log = habitLogs[date.iso];
    if (log?.status === 'completed') {
      statusByDate[date.iso] = 'completed';
      lastCompleted = date.label;
    } else if (log?.status === 'failed') {
      statusByDate[date.iso] = 'failed';
    } else if (date.iso < today) {
      statusByDate[date.iso] = 'failed';
    } else {
      statusByDate[date.iso] = 'none';
    }
  });

  const streakInfo = computeStreakData(habitLogs, range, createdDate);
  const best = Math.max(habit.best_streak || 0, streakInfo.current);
  return {
    ...habit,
    statusByDate,
    currentStreak: streakInfo.current,
    best_streak: best,
    lastCompleted,
  };
};

const HabitTrackerPage = () => {
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [habits, setHabits] = useState([]);
  const [history, setHistory] = useState([]);
  const [logMap, setLogMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIcons, setShowIcons] = useState(true);
  const [showStreak, setShowStreak] = useState(true);
  const [modalState, setModalState] = useState({ open: false, habit: null });
  const [limitReached, setLimitReached] = useState(false);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) {
        setError('Please log in to start tracking habits.');
        setLoading(false);
        return;
      }
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const loadHabits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('is_premium, plan')
        .eq('id', user.id)
        .single();
      const planName = profileRow?.plan || 'free';
      const premiumFlag = Boolean(profileRow?.is_premium) || ['plus', 'pro'].includes(planName);
      setIsPremium(premiumFlag);
      const { data: habitRows, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (habitError) throw habitError;
      const activeHabits = (habitRows || []).filter((habit) => !habit.is_deleted);
      const deletedHabits = (habitRows || []).filter((habit) => habit.is_deleted);
      const habitIds = activeHabits.map((habit) => habit.id);
      let logs = {};
      let earliestDate = todayIso();
      if (activeHabits.length) {
        activeHabits.forEach((habit) => {
          if (habit.created_at) {
            const created = habit.created_at.slice(0, 10);
            if (created < earliestDate) earliestDate = created;
          }
        });
      }
      if (habitIds.length) {
        const { data: logRows } = await supabase
          .from('habit_logs')
          .select('*')
          .in('habit_id', habitIds)
          .gte('log_date', earliestDate);
        if (logRows) {
          logRows.forEach((log) => {
            if (!logs[log.habit_id]) logs[log.habit_id] = {};
            logs[log.habit_id][log.log_date] = log;
          });
        }
      }
      const updates = [];
      const range = activeHabits.length ? buildDateRangeFrom(earliestDate) : [];
      const decorated = activeHabits.map((habit) => {
        const decoratedHabit = decorateHabit(habit, logs[habit.id] || {}, range);
        if (decoratedHabit.best_streak > (habit.best_streak || 0)) {
          updates.push(
            supabase.from('habits').update({ best_streak: decoratedHabit.best_streak }).eq('id', habit.id)
          );
        }
        return decoratedHabit;
      });
      if (updates.length) {
        Promise.all(updates).catch((err) => console.error('Best streak update failed', err));
      }
      setDates(range);
      setLimitReached(!premiumFlag && decorated.length >= 10);
      setHabits(decorated);
      setHistory(deletedHabits);
      setLogMap(logs);
      setShowStreak(premiumFlag);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load habits.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user, loadHabits]);

  const handleToggleStatus = async (habit, date, desiredStatus = null) => {
    const createdDate = habit.created_at?.slice(0, 10);
    if (createdDate && date.iso < createdDate) {
      return;
    }
    const logsForHabit = logMap[habit.id] || {};
    const existing = logsForHabit[date.iso];
    const isCompleted = existing?.status === 'completed';
    const nextStatus = desiredStatus || (isCompleted ? 'failed' : 'completed');
    if (desiredStatus && existing?.status === desiredStatus) {
      return;
    }

    try {
      if (existing) {
        await supabase.from('habit_logs').update({ status: nextStatus }).eq('id', existing.id);
      } else {
        await supabase.from('habit_logs').insert({
          habit_id: habit.id,
          log_date: date.iso,
          status: nextStatus,
        });
      }
      await loadHabits();
    } catch (err) {
      console.error(err);
      setError('Unable to update log.');
    }
  };

  const handleSaveHabit = async (payload) => {
    const newHabit = {
      name: payload.name.trim(),
      icon_key: payload.icon_key || null,
    };
    try {
      if (payload.id) {
        await supabase.from('habits').update(newHabit).eq('id', payload.id);
      } else {
        await supabase.from('habits').insert({
          ...newHabit,
          user_id: user.id,
        });
      }
      setModalState({ open: false, habit: null });
      await loadHabits();
    } catch (err) {
      console.error(err);
      setError('Unable to save habit.');
    }
  };

  const handleDeleteHabit = async (habit) => {
    await supabase.from('habits').update({ is_deleted: true }).eq('id', habit.id);
    await loadHabits();
  };

  const handleRestoreHabit = async (habit) => {
    await supabase.from('habits').update({ is_deleted: false }).eq('id', habit.id);
    await loadHabits();
  };

  const handleDestroyHabit = async (habit) => {
    const proceed = window.confirm(
      `Delete “${habit.name}” permanently? This will remove its history forever.`
    );
    if (!proceed) return;
    try {
      await supabase.from('habits').delete().eq('id', habit.id);
      await loadHabits();
    } catch (err) {
      console.error(err);
      setError('Unable to delete habit permanently.');
    }
  };

  if (loading) {
    return <div className="habit-empty">Loading habits…</div>;
  }

  if (error) {
    return <div className="habit-empty">{error}</div>;
  }

  if (!user) {
    return <div className="habit-empty">Please sign in to manage your habits.</div>;
  }

  return (
    <section className="habit-tracker">
      <div className="habit-header">
        <div>
          <h1>Habit Tracker</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track your streaks and daily progress.</p>
        </div>
        <button type="button" onClick={() => setModalState({ open: true, habit: null })} disabled={limitReached}>
          + Add Habit
        </button>
      </div>

      <div className="habit-subheader">
        {isPremium && (
          <label>
            <input type="checkbox" checked={showStreak} onChange={() => setShowStreak((prev) => !prev)} />
            Streak
          </label>
        )}
        <label>
          <input type="checkbox" checked={showIcons} onChange={() => setShowIcons((prev) => !prev)} />
          Icons
        </label>
        <span className="habit-info">i</span>
      </div>

      <HabitTable
        habits={habits}
        dates={dates}
        showIcons={showIcons}
        showStreak={showStreak}
        isPremium={isPremium}
        onToggleStatus={handleToggleStatus}
        onEditHabit={(habit) => setModalState({ open: true, habit })}
        onDeleteHabit={handleDeleteHabit}
      />

      {isPremium && <StreakSummaryCard habits={habits} />}

      <HistoryList items={history} onRestore={handleRestoreHabit} onDelete={handleDestroyHabit} />

      <AddHabitModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, habit: null })}
        onSubmit={handleSaveHabit}
        initialHabit={modalState.habit}
        isPremium={isPremium}
        limitReached={limitReached}
      />
    </section>
  );
};

const computeStreakData = (habitLogs, dates, createdDateStr) => {
  const today = todayIso();
  let current = 0;
  for (let i = dates.length - 1; i >= 0; i -= 1) {
    const dateStr = dates[i].iso;
    if (createdDateStr && dateStr < createdDateStr) {
      break;
    }
    const log = habitLogs[dateStr];
    if (dateStr === today && !log) break;
    if (log?.status === 'completed') {
      current += 1;
    } else if (log?.status === 'failed' || (!log && dateStr < today)) {
      break;
    }
  }
  return { current };
};

export default HabitTrackerPage;
