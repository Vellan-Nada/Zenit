import express from 'express';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { openai, DEFAULT_MODEL } from '../lib/openai.js';

const router = express.Router();

const TABLES = {
  todos: 'todos',
  habits: 'habits',
  habitLogs: 'habit_logs',
  journal: 'journal_entries',
  notes: 'notes',
  pomodoro: 'pomodoro_sessions',
  profiles: 'profiles',
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(date.setDate(diff));
};
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfYear = (d) => new Date(d.getFullYear(), 0, 1);

const toISO = (d) => d.toISOString();

async function assertPremium(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLES.profiles)
    .select('is_premium')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (!data?.is_premium) {
    const err = new Error('Premium required');
    err.statusCode = 403;
    throw err;
  }
}

const countRange = async (table, column, userId, from, to) => {
  const { count } = await supabaseAdmin
    .from(table)
    .select(column, { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', from)
    .lte('created_at', to);
  return count || 0;
};

const getSummaryStats = async (userId) => {
  const now = new Date();
  const ranges = {
    today: { from: startOfDay(now), to: now },
    week: { from: startOfWeek(now), to: now },
    month: { from: startOfMonth(now), to: now },
    year: { from: startOfYear(now), to: now },
  };

  const result = {};

  for (const key of Object.keys(ranges)) {
    const { from, to } = ranges[key];
    const fromISO = toISO(from);
    const toISO = to.toISOString();
    const [
      completedTodos,
      habitsCompleted,
      pomodorosCompleted,
      journalEntries,
      notesCreated,
    ] = await Promise.all([
      countRange(TABLES.todos, 'id', userId, fromISO, toISO),
      countRange(TABLES.habitLogs, 'id', userId, fromISO, toISO),
      countRange(TABLES.pomodoro, 'id', userId, fromISO, toISO),
      countRange(TABLES.journal, 'id', userId, fromISO, toISO),
      countRange(TABLES.notes, 'id', userId, fromISO, toISO),
    ]);

    result[key] = {
      completedTodos,
      habitsCompleted,
      pomodorosCompleted,
      journalEntries,
      notesCreated,
    };
  }

  return result;
};

const getRecentText = async (userId) => {
  const { data: journals } = await supabaseAdmin
    .from(TABLES.journal)
    .select('entry_date, thoughts, good_things, bad_things, lessons, dreams')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(20);

  const { data: notes } = await supabaseAdmin
    .from(TABLES.notes)
    .select('title, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const trim = (str) => (str || '').toString().slice(0, 400);

  const recentJournals = (journals || []).map((j) =>
    [j.entry_date, trim(j.thoughts), trim(j.good_things), trim(j.bad_things), trim(j.lessons), trim(j.dreams)]
      .filter(Boolean)
      .join(' | ')
  );

  const recentNotes = (notes || []).map((n) => `${n.title || ''} ${trim(n.content)}`.trim());

  return { recentJournals, recentNotes };
};

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    await assertPremium(req.user.id);
    const summary = await getSummaryStats(req.user.id);
    const { recentJournals, recentNotes } = await getRecentText(req.user.id);

    const aiInput = {
      summary,
      recentJournals,
      recentNotes,
    };

    let aiInsights = [];
    let aiSuggestions = [];

    try {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'You are an AI productivity coach that analyzes a user\'s tasks, habits, pomodoros, journals, and notes.',
              'Return JSON only with keys aiInsights (array of {id,title,description}) and aiSuggestions (array of {id,text}).',
            ].join('\n'),
          },
          {
            role: 'user',
            content: JSON.stringify(aiInput),
          },
        ],
      });
      const parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
      aiInsights = parsed.aiInsights || [];
      aiSuggestions = parsed.aiSuggestions || [];
    } catch (aiErr) {
      console.error('AI summary error', aiErr);
      aiInsights = [];
      aiSuggestions = [];
    }

    return res.json({ summary, aiInsights, aiSuggestions });
  } catch (error) {
    console.error('AI dashboard error', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Failed to load AI dashboard' });
  }
});

router.post('/chat', requireAuth, async (req, res) => {
  try {
    await assertPremium(req.user.id);
    const { message, conversation = [] } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const summary = await getSummaryStats(req.user.id);
    const { recentJournals, recentNotes } = await getRecentText(req.user.id);

    const systemMessage = {
      role: 'system',
      content: [
        'You are an AI assistant for a productivity app with features: To-Do, Habit Tracker, Pomodoro, Journal, Notes.',
        'Use provided stats and recent entries to answer concisely and helpfully.',
      ].join('\n'),
    };

    const contextMessage = {
      role: 'system',
      content: JSON.stringify({ summary, recentJournals, recentNotes }),
    };

    const history = (conversation || []).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const userMessage = { role: 'user', content: message };

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [systemMessage, contextMessage, ...history, userMessage],
    });

    const reply = completion.choices?.[0]?.message?.content || 'Sorry, I could not generate a reply right now.';
    return res.json({ reply });
  } catch (error) {
    console.error('AI chat error', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Failed to generate AI reply' });
  }
});

export default router;
