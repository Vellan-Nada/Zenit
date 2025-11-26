import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useGuest } from '../../context/GuestContext.jsx';
import ColorPickerPopover from '../../components/Todos/ColorPickerPopover.jsx';
import UpgradeToPremium from '../../components/Notes/UpgradeToPremium.jsx';
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
  const { user, profile, authLoading, profileLoading } = useAuth();
  const { guestData, setGuestData } = useGuest();
  const [isPremium, setIsPremium] = useState(false);
  const guestMode = !user;
  const [habits, setHabits] = useState([]);
  const [history, setHistory] = useState([]);
  const [logMap, setLogMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIcons, setShowIcons] = useState(true);
  const [showStreak, setShowStreak] = useState(false);
  const [modalState, setModalState] = useState({ open: false, habit: null });
  const [limitReached, setLimitReached] = useState(false);
  const [dates, setDates] = useState([]);
  const [streakPromptVisible, setStreakPromptVisible] = useState(false);

  const recompute = useCallback(
    (habitRows, logs, premiumFlag) => {
      const activeHabits = (habitRows || []).filter((habit) => !habit.is_deleted);
      const deletedHabits = (habitRows || []).filter((habit) => habit.is_deleted);
      let earliestDate = todayIso();
      activeHabits.forEach((habit) => {
        if (habit.created_at) {
          const created = habit.created_at.slice(0, 10);
          if (created < earliestDate) earliestDate = created;
        }
      });
      const range = activeHabits.length ? buildDateRangeFrom(earliestDate) : [];
      const decorated = activeHabits.map((habit) => decorateHabit(habit, logs[habit.id] || {}, range));
      setDates(range);
      setLimitReached(!premiumFlag && decorated.length >= 7);
      setHabits(decorated);
      setHistory(deletedHabits);
      setLogMap(logs);
      setShowStreak(premiumFlag);
      setLoading(false);
    },
    []
  );

  const loadHabits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const planName = profile?.plan || 'free';
      const premiumFlag = Boolean(profile?.is_premium) || ['plus', 'pro'].includes(planName);
      setIsPremium(premiumFlag);
      const { data: habitRows, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (habitError) throw habitError;
      const habitIds = (habitRows || []).filter((h) => !h.is_deleted).map((h) => h.id);
      let logs = {};
      let earliestDate = todayIso();
      (habitRows || []).forEach((habit) => {
        if (habit.created_at) {
          const created = habit.created_at.slice(0, 10);
          if (created < earliestDate) earliestDate = created;
        }
      });
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
      recompute(habitRows || [], logs, premiumFlag);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load habits.');
      setLoading(false);
    }
  }, [user, profile, recompute]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (guestMode) {
      recompute(guestData.habits || [], guestData.habitLogs || {}, false);
      return;
    }
    if (user) {
      loadHabits();
    } else {
      setLoading(false);
    }
  }, [authLoading, profileLoading, guestMode, guestData, user, loadHabits, recompute]);

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

    if (guestMode) {
      const nextLogs = { ...logMap };
      if (!nextLogs[habit.id]) nextLogs[habit.id] = {};
      nextLogs[habit.id][date.iso] = {
        id: `${habit.id}-${date.iso}`,
        habit_id: habit.id,
        log_date: date.iso,
        status: nextStatus,
      };
      setGuestData((prev) => ({ ...prev, habitLogs: nextLogs, habits: habits.map((h) => ({ ...h })) }));
      recompute(habits.map((h) => ({ ...h })), nextLogs, false);
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
      if (guestMode) {
        if (payload.id) {
          const nextHabits = habits.map((h) => (h.id === payload.id ? { ...h, ...newHabit } : h));
          setGuestData((prev) => ({ ...prev, habits: nextHabits, habitLogs: logMap }));
          recompute(nextHabits, logMap, false);
        } else {
          const freshHabit = {
            id: crypto.randomUUID(),
            user_id: null,
            ...newHabit,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            best_streak: 0,
            is_deleted: false,
          };
          const nextHabits = [...habits, freshHabit];
          setGuestData((prev) => ({ ...prev, habits: nextHabits, habitLogs: logMap }));
          recompute(nextHabits, logMap, false);
        }
      } else if (payload.id) {
        await supabase.from('habits').update(newHabit).eq('id', payload.id);
      } else {
        await supabase.from('habits').insert({
          ...newHabit,
          user_id: user.id,
        });
      }
      setModalState({ open: false, habit: null });
      if (!guestMode) await loadHabits();
    } catch (err) {
      console.error(err);
      setError('Unable to save habit.');
    }
  };

  const handleDeleteHabit = async (habit) => {
    if (guestMode) {
      const nextHabits = habits.map((h) => (h.id === habit.id ? { ...h, is_deleted: true } : h));
      setGuestData((prev) => ({ ...prev, habits: nextHabits, habitLogs: logMap }));
      recompute(nextHabits, logMap, false);
      return;
    }
    await supabase.from('habits').update({ is_deleted: true }).eq('id', habit.id);
    await loadHabits();
  };

  const handleRestoreHabit = async (habit) => {
    if (guestMode) {
      const combined = [...habits, ...history];
      const nextHabits = combined.map((h) => (h.id === habit.id ? { ...h, is_deleted: false } : h));
      setGuestData((prev) => ({ ...prev, habits: nextHabits, habitLogs: logMap }));
      recompute(nextHabits, logMap, false);
      return;
    }
    await supabase.from('habits').update({ is_deleted: false }).eq('id', habit.id);
    await loadHabits();
  };

  const handleDestroyHabit = async (habit) => {
    const proceed = window.confirm(
      `Delete “${habit.name}” permanently? This will remove its history forever.`
    );
    if (!proceed) return;
    try {
      if (guestMode) {
        const nextHabits = habits.filter((h) => h.id !== habit.id);
        const nextLogs = { ...logMap };
        delete nextLogs[habit.id];
        setGuestData((prev) => ({ ...prev, habits: nextHabits, habitLogs: nextLogs }));
        recompute(nextHabits, nextLogs, false);
        return;
      }
      await supabase.from('habits').delete().eq('id', habit.id);
      await loadHabits();
    } catch (err) {
      console.error(err);
      setError('Unable to delete habit permanently.');
    }
  };

  if (authLoading || profileLoading) {
    return <div className="habit-empty">Loading habits…</div>;
  }

  if (error) {
    return <div className="habit-empty">{error}</div>;
  }

  return (
    <section className="habit-tracker">
      <div className="habit-header">
        <div>
          <h1>Habit Tracker</h1>
        </div>
        <button type="button" onClick={() => setModalState({ open: true, habit: null })} disabled={limitReached}>
          + Add Habit
        </button>
      </div>

      {!user && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. Habits won’t be saved if you leave.{' '}
          <button type="button" onClick={() => (window.location.href = '/signup')}>
            Sign up
          </button>
        </div>
      )}

      <div className="habit-subheader">
        <div className="habit-subheader-right">
          <div className="streak-lock">
            {!isPremium ? (
              <div className="streak-lock-wrapper">
                <button
                  type="button"
                  className="streak-lock-btn"
                  onClick={() => setStreakPromptVisible((prev) => !prev)}
                >
                  🔒
                </button>
                <span>Streak</span>
                {streakPromptVisible && (
                  <div className="streak-lock-pop">
                    <p style={{ marginTop: 0, marginBottom: '0.75rem', textAlign: 'left' }}>
                      Streaks are a premium feature.
                    </p>
                    <div className="streak-pop-actions">
                      <UpgradeToPremium cta="Upgrade" variant="full" />
                      <button
                        type="button"
                        className="secondaryButton"
                        onClick={() => setStreakPromptVisible(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <span>Streak</span>
                <label>
                  <input
                    type="checkbox"
                    checked={showStreak}
                    onChange={() => setShowStreak((prev) => !prev)}
                  />
                </label>
              </>
            )}
          </div>
          <label>
            <input type="checkbox" checked={showIcons} onChange={() => setShowIcons((prev) => !prev)} />
            Icons
          </label>
        </div>
      </div>

      <HabitTable
        habits={habits}
        dates={dates}
        showIcons={showIcons}
        showStreak={isPremium ? showStreak : false}
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
