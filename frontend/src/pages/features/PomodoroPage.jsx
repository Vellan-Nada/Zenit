import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import PomodoroTimer from '../../components/Pomodoro/PomodoroTimer.jsx';
import PomodoroSettings from '../../components/Pomodoro/PomodoroSettings.jsx';
import '../../styles/Pomodoro.css';

const DEFAULT_SETTINGS = {
  pomodoro_minutes: 20,
  short_break_minutes: 5,
  long_break_minutes: 15,
  long_break_after_sessions: 2,
  play_sound: true,
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

const PomodoroPage = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [mode, setMode] = useState('pomodoro');
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.pomodoro_minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsSinceLong, setSessionsSinceLong] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const isPremium = Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);

  // Fetch or initialize settings
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
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
          setSecondsLeft(modeToSeconds('pomodoro', inserted));
        } else {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
          setSecondsLeft(modeToSeconds('pomodoro', { ...DEFAULT_SETTINGS, ...data }));
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load settings');
      }
    };
    loadSettings();
  }, [authLoading, user]);

  // Timer tick logic
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
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Handle timer reaching zero and auto-cycle
  const handleCompletion = async () => {
    setIsRunning(false);
    const now = new Date().toISOString();
    const duration = modeToSeconds(mode, settings);
    if (sessionStart) {
      await supabase.from('pomodoro_sessions').insert({
        user_id: user.id,
        mode,
        started_at: sessionStart,
        ended_at: now,
        duration_seconds: duration,
        completed: true,
      });
    }

    if (settings.play_sound && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(
          'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAA=='
        );
        audio.play().catch(() => {});
      } catch (err) {
        // ignore audio errors
      }
    }

    if (mode === 'pomodoro') {
      // auto start short break
      setMode('short_break');
      setSecondsLeft(modeToSeconds('short_break', settings));
      setIsRunning(true);
      setSessionStart(new Date().toISOString());
    } else if (mode === 'short_break') {
      const nextCount = sessionsSinceLong + 1;
      setSessionsSinceLong(nextCount);
      if (nextCount < settings.long_break_after_sessions) {
        // back to pomodoro, idle
        setMode('pomodoro');
        setSecondsLeft(modeToSeconds('pomodoro', settings));
        setIsRunning(false);
        setSessionStart(null);
      } else {
        // go to long break, auto start
        setMode('long_break');
        setSecondsLeft(modeToSeconds('long_break', settings));
        setIsRunning(true);
        setSessionStart(new Date().toISOString());
      }
    } else if (mode === 'long_break') {
      setSessionsSinceLong(0);
      setMode('pomodoro');
      setSecondsLeft(modeToSeconds('pomodoro', settings));
      setIsRunning(false);
      setSessionStart(null);
    }
  };

  const handleToggle = () => {
    if (!isRunning) {
      if (secondsLeft === 0) {
        setSecondsLeft(modeToSeconds(mode, settings));
      }
      setSessionStart(new Date().toISOString());
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  const handleModeSelect = (nextMode) => {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(modeToSeconds(nextMode, settings));
    setSessionStart(null);
  };

  const handleSaveSettings = async (nextSettings) => {
    setSettingsSaving(true);
    try {
      const payload = { ...DEFAULT_SETTINGS, ...nextSettings, user_id: user.id, updated_at: new Date().toISOString() };
      const { error: upsertError, data } = await supabase
        .from('pomodoro_settings')
        .upsert(payload)
        .select()
        .single();
      if (upsertError) throw upsertError;
      setSettings({ ...DEFAULT_SETTINGS, ...data });
      // If timer is idle, reset duration to match mode
      if (!isRunning) {
        setSecondsLeft(modeToSeconds(mode, { ...DEFAULT_SETTINGS, ...data }));
      }
      setSettingsOpen(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return <LoadingSpinner label="Loading Pomodoro…" />;
  }

  if (!user) {
    return <div className="pomodoro-empty">Please sign in to use Pomodoro.</div>;
  }

  return (
    <section className="pomodoro-page">
      <div className="pomodoro-topbar">
        <h1>Pomodoro</h1>
        <div className="pomodoro-top-actions">
          <button type="button" className="pomodoro-btn ghost" onClick={() => (window.location.href = '/pomodoro/report')}>
            Report
          </button>
          <button type="button" className="pomodoro-btn primary" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
        </div>
      </div>
      {error && <p className="pomodoro-error">{error}</p>}
      <PomodoroTimer mode={mode} secondsLeft={secondsLeft} isRunning={isRunning} onToggle={handleToggle} onSelectMode={handleModeSelect} />
      <PomodoroSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        saving={settingsSaving}
      />
    </section>
  );
};

export default PomodoroPage;
