import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import '../../styles/AI.css';

const SummaryCards = ({ summary }) => {
  const cards = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  return (
    <div className="ai-grid">
      {cards.map((card) => {
        const data = summary?.[card.key];
        return (
          <div key={card.key} className="ai-card">
            <h3>{card.label}</h3>
            {data ? (
              <ul className="ai-metrics">
                <li>Completed tasks: {data.completedTodos}</li>
                <li>Habits completed: {data.habitsCompleted}</li>
                <li>Pomodoros: {data.pomodorosCompleted}</li>
                <li>Journal entries: {data.journalEntries}</li>
                <li>Notes created: {data.notesCreated}</li>
              </ul>
            ) : (
              <p className="ai-muted">No data yet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const InsightsList = ({ items, title }) => (
  <div className="ai-section">
    <h3>{title}</h3>
    {(!items || items.length === 0) && <p className="ai-muted">No items yet.</p>}
    <div className="ai-list">
      {items?.map((it) => (
        <div key={it.id || it.title} className="ai-card">
          {it.title && <h4>{it.title}</h4>}
          <p>{it.description || it.text}</p>
        </div>
      ))}
    </div>
  </div>
);

const AIChatPanel = ({ conversation, onSend, sending, blocked }) => {
  const [input, setInput] = useState('');
  const handleSend = () => {
    if (!input.trim() || sending || blocked) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat-messages">
        {conversation.map((msg, idx) => (
          <div key={idx} className={`ai-chat-msg ${msg.role}`}>
            <div className="ai-chat-bubble">{msg.content}</div>
          </div>
        ))}
      </div>
      <div className="ai-chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={blocked ? 'Upgrade to unlock AI chat' : 'Ask about your productivity...'}
          disabled={sending || blocked}
        />
        <button type="button" onClick={handleSend} disabled={sending || blocked}>
          {sending ? 'Thinking…' : 'Send'}
        </button>
      </div>
      {blocked && <div className="ai-chat-overlay">Upgrade to unlock the AI assistant</div>}
    </div>
  );
};

const FreeView = () => {
  const navigate = useNavigate();
  return (
    <div className="ai-free">
      <div className="ai-card ai-free-card">
        <h2>AI Insights (Premium)</h2>
        <ul>
          <li>Gives daily, weekly, monthly, yearly summary.</li>
          <li>Summaries & insights for Habit Tracker, Journal, Notes, To-Do, Pomodoro.</li>
          <li>Personalized suggestions.</li>
          <li>Chat with AI about your data.</li>
        </ul>
        <div className="ai-grid">
          <div className="ai-card">
            <h4>Example insight</h4>
            <p>On days you finish ≥3 tasks, you usually maintain your habit streak.</p>
          </div>
          <div className="ai-card">
            <h4>Example suggestion</h4>
            <p>Try scheduling focus work in the morning when you complete most Pomodoros.</p>
          </div>
        </div>
        <div className="ai-chat ai-chat-disabled">
          <div className="ai-chat-overlay">Upgrade to unlock AI chat and personalized insights.</div>
          <div className="ai-chat-input">
            <textarea placeholder="Upgrade to unlock AI chat" disabled />
            <button type="button" disabled>Send</button>
          </div>
        </div>
        <button type="button" className="ai-btn" onClick={() => navigate('/upgrade')}>
          Upgrade
        </button>
      </div>
    </div>
  );
};

const AIDashboard = () => {
  const { user, profile, token, authLoading, profileLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [sending, setSending] = useState(false);

  const isPremium = Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user) return;
    if (!isPremium) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/ai/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Unable to load AI dashboard');
        const data = await res.json();
        setSummary(data.summary || {});
        setInsights(data.aiInsights || []);
        setSuggestions(data.aiSuggestions || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load AI dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, profileLoading, user, token, apiBase, isPremium]);

  const handleSend = async (msg) => {
    setSending(true);
    const next = [...conversation, { role: 'user', content: msg }];
    setConversation(next);
    try {
      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: msg, conversation: next }),
      });
      if (res.status === 403) {
        setConversation(next);
        setError('AI chat is a premium feature. Upgrade to continue.');
        setSending(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      setConversation([...next, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || profileLoading) return <LoadingSpinner label="Loading AI…" />;
  if (!user) return <div className="ai-empty">Please log in to view AI Insights.</div>;
  if (!isPremium) return <FreeView />;
  if (loading) return <LoadingSpinner label="Building your AI dashboard…" />;

  return (
    <section className="ai-page">
      <header className="ai-header">
        <div>
          <p className="ai-subtitle">AI assistant for your productivity data.</p>
          <h1>AI Insights</h1>
        </div>
      </header>
      {error && <p className="ai-error">{error}</p>}
      <div className="ai-layout">
        <div className="ai-main">
          <SummaryCards summary={summary} />
          <InsightsList items={insights} title="AI Insights" />
          <InsightsList items={suggestions} title="AI Suggestions" />
        </div>
        <div className="ai-side">
          <AIChatPanel conversation={conversation} onSend={handleSend} sending={sending} blocked={!isPremium} />
        </div>
      </div>
    </section>
  );
};

export default AIDashboard;
