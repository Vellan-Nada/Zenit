import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import PomodoroTimer from '../../components/Pomodoro/PomodoroTimer.jsx';
import PomodoroSettings from '../../components/Pomodoro/PomodoroSettings.jsx';
import ReportCards from '../../components/Pomodoro/ReportCards.jsx';
import '../../styles/Pomodoro.css';
import { goToSignup } from '../../utils/guestSignup.js';
import { TimerIcon } from '../../components/FeatureIcons.jsx';

const DEFAULT_SETTINGS = {
  pomodoro_minutes: 20,
  short_break_minutes: 5,
  long_break_minutes: 15,
  long_break_after_sessions: 2,
  play_sound: true,
};

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

const modeToSeconds = (mode, settings) => {
  switch (mode) {
    case 'short_break':
      return (settings.short_break_minutes || DEFAULT_SETTINGS.short_break_minutes) * 60;
    case 'long_break':
      return (settings.long_break_minutes || DEFAULT_SETTINGS.long_break_minutes) * 60;
    default:
      return (settings.pomodoro_minutes || DEFAULT_SETTINGS.pomodoro_minutes) * 60;
  }
};

const readSettingsFromStorage = () => {
  try {
    const raw = localStorage.getItem('everday_pomodoro_settings');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSettingsToStorage = (settings) => {
  try {
    localStorage.setItem('everday_pomodoro_settings', JSON.stringify(settings));
  } catch {
    // ignore
  }
};

// Per-mode timer state
const getStoredTimerState = () => {
  try {
    const raw = localStorage.getItem('everday_pomodoro_state');
    if (!raw) return { hasState: false, slots: {} };
    const parsed = JSON.parse(raw);
    const slots = parsed.slots || {};
    // normalize remaining for each slot
    Object.keys(slots).forEach((key) => {
      const slot = slots[key];
      if (slot.endTime) {
        slot.secondsLeft = Math.max(0, Math.floor((slot.endTime - Date.now()) / 1000));
      }
    });
    return { hasState: true, slots, activeMode: parsed.activeMode || 'pomodoro' };
  } catch (err) {
    return { hasState: false, slots: {} };
  }
};

const PomodoroPage = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const guestMode = !user;
  const stored = useRef(getStoredTimerState()).current;
  const [hydrated, setHydrated] = useState(false);
  const storedSettings = readSettingsFromStorage();
  const [settings, setSettings] = useState(storedSettings ? { ...DEFAULT_SETTINGS, ...storedSettings } : DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [mode, setMode] = useState(stored.activeMode || 'pomodoro');
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const slot = stored.slots[stored.activeMode || 'pomodoro'];
    if (slot && slot.secondsLeft !== undefined) return slot.secondsLeft;
    return DEFAULT_SETTINGS.pomodoro_minutes * 60;
  });
  const [isRunning, setIsRunning] = useState(() => {
    const slot = stored.slots[stored.activeMode || 'pomodoro'];
    return Boolean(slot?.isRunning);
  });
  const [sessionsSinceLong, setSessionsSinceLong] = useState(0);
  const [sessionStart, setSessionStart] = useState(() => stored.slots[stored.activeMode || 'pomodoro']?.sessionStart || null);
  const [endTime, setEndTime] = useState(() => stored.slots[stored.activeMode || 'pomodoro']?.endTime || null);
  const [error, setError] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSessions, setReportSessions] = useState([]);
  const timerRef = useRef(null);

  const isPremium = guestMode ? false : Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  // Always derive what should be shown right now; avoids flashing default durations.
  const displaySeconds = endTime
    ? Math.max(0, Math.floor((endTime - Date.now()) / 1000))
    : secondsLeft;

  // Fetch or initialize settings
  useEffect(() => {
    if (authLoading) return;
    if (guestMode) {
      const fromStorage = readSettingsFromStorage();
      setSettings(fromStorage ? { ...DEFAULT_SETTINGS, ...fromStorage } : DEFAULT_SETTINGS);
      setHydrated(true);
      return;
    }
    const loadSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('pomodoro_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        if (!data) {
          const { data: inserted, error: insertError } = await supabase
            .from('pomodoro_settings')
            .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
            .select()
            .single();
          if (insertError) throw insertError;
          setSettings(inserted);
          if (!stored.hasState || !stored.isRunning) {
            setSecondsLeft(modeToSeconds(mode, inserted));
          }
        } else {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
          if (!stored.hasState || !stored.isRunning) {
            setSecondsLeft(modeToSeconds(mode, { ...DEFAULT_SETTINGS, ...data }));
          }
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load settings');
      } finally {
        setHydrated(true);
      }
    };
    loadSettings();
  }, [authLoading, guestMode, user, mode, stored.isRunning]);

  // Restore from localStorage if a session was active (so timer keeps going across pages/tabs)
  useLayoutEffect(() => {
    const slot = stored.slots[stored.activeMode || 'pomodoro'];
    if (slot) {
      if (slot.endTime) {
        const remaining = Math.max(0, Math.floor((slot.endTime - Date.now()) / 1000));
        setSecondsLeft(remaining);
        setEndTime(slot.endTime);
        setIsRunning(Boolean(slot.isRunning));
        setSessionStart(slot.sessionStart || null);
      } else if (slot.secondsLeft !== undefined) {
        setSecondsLeft(slot.secondsLeft);
        setIsRunning(Boolean(slot.isRunning));
        setSessionStart(slot.sessionStart || null);
        setEndTime(null);
      }
    }
    setHydrated(true);
  }, [stored]);

  const persistSlot = (modeKey, data) => {
    const raw = localStorage.getItem('everday_pomodoro_state');
    let next = { slots: {}, activeMode: mode };
    try {
      if (raw) next = JSON.parse(raw) || {};
    } catch (err) {
      next = { slots: {}, activeMode: mode };
    }
    if (!next.slots) next.slots = {};
    next.slots[modeKey] = {
      ...next.slots[modeKey],
      ...data,
    };
    next.activeMode = mode;
    localStorage.setItem('everday_pomodoro_state', JSON.stringify(next));
  };

  const readSlot = (modeKey) => {
    try {
      const raw = localStorage.getItem('everday_pomodoro_state');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.slots ? parsed.slots[modeKey] : null;
    } catch (err) {
      return null;
    }
  };

  // Persist state so navigation/tab changes keep timer state
  useEffect(() => {
    persistSlot(mode, { secondsLeft, isRunning, sessionStart, endTime });
  }, [mode, secondsLeft, isRunning, sessionStart, endTime]);

  // Timer tick logic using absolute endTime so it survives throttling/background
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const remaining = endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : prev - 1;
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleCompletion();
          return 0;
        }
        return remaining;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, endTime]);

  // Handle timer reaching zero and auto-cycle
  const isCompletingRef = useRef(false);

  const handleCompletion = async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    setIsRunning(false);
    setEndTime(null);
    setSecondsLeft(0);

    const now = new Date().toISOString();
    const duration = modeToSeconds(mode, settings);
    if (sessionStart && !guestMode) {
      await supabase.from('pomodoro_sessions').insert({
        user_id: user.id,
        mode,
        started_at: sessionStart,
        ended_at: now,
        duration_seconds: duration,
        completed: true,
      });
    }

    // play alert for up to 5 seconds before moving to the next mode
    const playAlert = () => {
      if (!settings.play_sound || typeof Audio === 'undefined') return Promise.resolve();
      try {
        const audio = new Audio('/sounds/alert.mp3');
        audio.currentTime = 0;
        const playPromise = audio.play() || Promise.resolve();
        return playPromise
          .then(() => {
            return new Promise((resolve) => {
              setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
                resolve();
              }, 5000);
            });
          })
          .catch(() => Promise.resolve());
      } catch {
        return Promise.resolve();
      }
    };

    await playAlert();

    // Reset the completed mode back to its configured duration so returning to it isn't stuck at 0
    const resetDuration = modeToSeconds(mode, settings);
    persistSlot(mode, {
      secondsLeft: resetDuration,
      isRunning: false,
      sessionStart: null,
      endTime: null,
    });

    const transition = () => {
      if (mode === 'pomodoro') {
        // auto start short break
        const nextDuration = modeToSeconds('short_break', settings);
        setMode('short_break');
        setSecondsLeft(nextDuration);
        setIsRunning(true);
        const startIso = new Date().toISOString();
        setSessionStart(startIso);
        setEndTime(Date.now() + nextDuration * 1000);
      } else if (mode === 'short_break') {
        const nextCount = sessionsSinceLong + 1;
        setSessionsSinceLong(nextCount);
        const nextDuration = modeToSeconds(
          nextCount < settings.long_break_after_sessions ? 'pomodoro' : 'long_break',
          settings
        );
        if (nextCount < settings.long_break_after_sessions) {
          // back to pomodoro, idle
          setMode('pomodoro');
          setSecondsLeft(nextDuration);
          setIsRunning(false);
          setSessionStart(null);
          setEndTime(null);
        } else {
          // go to long break, auto start
          setMode('long_break');
          setSecondsLeft(nextDuration);
          setIsRunning(true);
          const startIso = new Date().toISOString();
          setSessionStart(startIso);
          setEndTime(Date.now() + nextDuration * 1000);
        }
      } else if (mode === 'long_break') {
        const nextDuration = modeToSeconds('pomodoro', settings);
        setSessionsSinceLong(0);
        setMode('pomodoro');
        setSecondsLeft(nextDuration);
        setIsRunning(false);
        setSessionStart(null);
        setEndTime(null);
      }
    };

    transition();
    isCompletingRef.current = false;
  };

  const handleToggle = () => {
    if (!isRunning) {
      if (secondsLeft === 0) {
        setSecondsLeft(modeToSeconds(mode, settings));
      }
      const nowIso = new Date().toISOString();
      setSessionStart(nowIso);
      setEndTime(Date.now() + secondsLeft * 1000);
      setIsRunning(true);
    } else {
      setIsRunning(false);
      setEndTime(null);
    }
  };

  const handleModeSelect = (nextMode) => {
    if (nextMode === mode) return; // no-op if selecting the same mode
    // Save current mode state
    persistSlot(mode, {
      secondsLeft: displaySeconds,
      isRunning: false,
      sessionStart,
      endTime: null,
    });

    const slot = readSlot(nextMode);
    const fresh = modeToSeconds(nextMode, settings);
    let nextSeconds = fresh;
    let nextRunning = false;
    let nextEndTime = null;
    let nextStart = null;
    if (slot) {
      nextSeconds = slot.secondsLeft !== undefined ? slot.secondsLeft : fresh;
      nextRunning = Boolean(slot.isRunning);
      nextEndTime = slot.endTime || null;
      nextStart = slot.sessionStart || null;
    }
    setMode(nextMode);
    setSecondsLeft(nextSeconds);
    setIsRunning(nextRunning);
    setSessionStart(nextStart);
    setEndTime(nextEndTime);
  };

  const handleRestart = () => {
    const fresh = modeToSeconds(mode, settings);
    setSecondsLeft(fresh);
    const now = new Date().toISOString();
    setSessionStart(now);
    if (isRunning) {
      setEndTime(Date.now() + fresh * 1000);
    } else {
      setEndTime(null);
    }
    // keep current running state; if stopped, remain stopped
    persistSlot(mode, {
      secondsLeft: fresh,
      isRunning,
      sessionStart: now,
      endTime: isRunning ? Date.now() + fresh * 1000 : null,
    });
  };

  const handleSaveSettings = async (nextSettings) => {
    setSettingsSaving(true);
    try {
      if (guestMode) {
        const merged = { ...DEFAULT_SETTINGS, ...nextSettings };
        setSettings(merged);
        writeSettingsToStorage(merged);
        if (!isRunning) setSecondsLeft(modeToSeconds(mode, merged));
        setSettingsOpen(false);
      } else {
        const payload = { ...DEFAULT_SETTINGS, ...nextSettings, user_id: user.id, updated_at: new Date().toISOString() };
        const { error: upsertError, data } = await supabase
          .from('pomodoro_settings')
          .upsert(payload)
          .select()
          .single();
        if (upsertError) throw upsertError;
        const merged = { ...DEFAULT_SETTINGS, ...data };
        setSettings(merged);
        writeSettingsToStorage(merged);
        // If timer is idle, reset duration to match mode
        if (!isRunning) {
          setSecondsLeft(modeToSeconds(mode, merged));
        }
        setSettingsOpen(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Fetch report data when modal opens (only for premium)
  useEffect(() => {
    const fetchReport = async () => {
      if (!showReport || !isPremium) return;
      setReportLoading(true);
      if (guestMode) {
        setReportSessions([]);
        setReportError(null);
        setReportLoading(false);
        return;
      }
      try {
        const { data, error: fetchError } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('mode', 'pomodoro')
          .eq('completed', true);
        if (fetchError) throw fetchError;
        setReportSessions(data || []);
        setReportError(null);
      } catch (err) {
        console.error(err);
        setReportError('Unable to load report');
      } finally {
        setReportLoading(false);
      }
    };
    fetchReport();
  }, [showReport, isPremium, guestMode, user]);

  if (authLoading || profileLoading || !hydrated) {
    return <LoadingSpinner label="Loading Pomodoro…" />;
  }

  return (
    <section className="pomodoro-page">
      <div className="pomodoro-topbar">
        <h1 className="pageTitleWithIcon">
          <TimerIcon className="pageTitleIcon" />
          Pomodoro
        </h1>
        <div className="pomodoro-top-actions">
          <button type="button" className="pomodoro-btn ghost" onClick={() => setShowReport(true)}>
            Report
          </button>
          <button type="button" className="pomodoro-btn primary" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
        </div>
      </div>
      {guestMode && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. Pomodoro sessions won’t be saved if you leave.{' '}
          <button type="button" onClick={() => goToSignup(null)}>
            Sign up
          </button>
        </div>
      )}
      {error && <p className="pomodoro-error">{error}</p>}
      <PomodoroTimer
        mode={mode}
        secondsLeft={displaySeconds}
        isRunning={isRunning}
        onToggle={handleToggle}
        onRestart={handleRestart}
        onSelectMode={handleModeSelect}
      />
      <PomodoroSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        saving={settingsSaving}
      />
      {showReport && (
        <PomodoroReportModal
          onClose={() => setShowReport(false)}
          isPremium={isPremium}
          loading={reportLoading}
          error={reportError}
          sessions={reportSessions}
        />
      )}
    </section>
  );
};

const PomodoroReportModal = ({ onClose, isPremium, loading, error, sessions }) => {
  const totals = {
    focusSeconds: sum((sessions || []).map((s) => s.duration_seconds || 0)),
  };
  const averages = (() => {
    if (!sessions?.length) return { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
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
  })();
  const streaks = (() => {
    const dateSet = new Set((sessions || []).map((s) => dayKey(s.ended_at)));
    return computeStreaks(dateSet);
  })();

  const startUpgrade = () => {
    window.location.href = '/upgrade';
  };

  return (
    <div className="pomodoro-modal" role="dialog" aria-modal="true">
      <div className="pomodoro-modal-content">
        <div className="pomodoro-modal-header">
          <h2>Report</h2>
          <button type="button" onClick={onClose} className="pomodoro-close">✕</button>
        </div>
        {!isPremium ? (
          <div className="pomodoro-report-upgrade">
            <p>Get to know your total focused time, average session length, days active, and streaks with Plus.</p>
            <button type="button" className="pomodoro-btn primary" onClick={startUpgrade}>
              Upgrade to Plus
            </button>
          </div>
        ) : loading ? (
          <LoadingSpinner label="Loading report…" />
        ) : (
          <>
            {error && <p className="pomodoro-error">{error}</p>}
            <ReportCards totals={totals} averages={averages} streaks={streaks} />
          </>
        )}
      </div>
    </div>
  );
};

export default PomodoroPage;
