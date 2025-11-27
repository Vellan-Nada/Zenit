import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useGuest } from '../../context/GuestContext.jsx';
import TodoSection from '../../components/Todos/TodoSection.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import '../../styles/Todos.css';
import { goToSignup } from '../../utils/guestSignup.js';

const SECTION_CONFIG = [
  { type: 'task', label: 'To Do', limit: 10 },
  { type: 'yearly', label: 'Yearly Goals', limit: 5 },
  { type: 'monthly', label: 'Monthly Goals', limit: 5 },
];

const TodoPage = () => {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const { guestData, setGuestData } = useGuest();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [colorSavingId, setColorSavingId] = useState(null);

  const guestMode = !user;
  const isPremium = guestMode ? false : Boolean(profile?.is_premium) || ['plus', 'pro'].includes(profile?.plan);
  const isFree = !isPremium;

  const grouped = useMemo(() => {
    return SECTION_CONFIG.reduce((acc, section) => {
      acc[section.type] = todos.filter((todo) => todo.type === section.type);
      return acc;
    }, {});
  }, [todos]);

  const counts = useMemo(() => {
    return SECTION_CONFIG.reduce((acc, section) => {
      acc[section.type] = grouped[section.type]?.length || 0;
      return acc;
    }, {});
  }, [grouped]);

  useEffect(() => {
    if (authLoading) return;
    if (guestMode) {
      setTodos(guestData.todos || []);
      setLoading(false);
      return;
    }
    if (!user) return;

    const fetchTodos = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (fetchError) throw fetchError;
        setTodos(data || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load your to-do list.');
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [authLoading, user]);

  const handleAdd = async (type, title) => {
    if (guestMode) {
      const newTodo = {
        id: crypto.randomUUID(),
        user_id: null,
        type,
        title,
        is_completed: false,
        background_color: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTodos((prev) => [...prev, newTodo]);
      setGuestData((prev) => ({ ...prev, todos: [...(prev.todos || []), newTodo] }));
      return;
    }

    const payload = {
      user_id: user.id,
      type,
      title,
    };
    const { data, error: insertError } = await supabase.from('todos').insert(payload).select().single();
    if (insertError) throw insertError;
    setTodos((prev) => [...prev, data]);
  };

  const handleToggleComplete = async (todo) => {
    if (guestMode) {
      const updated = { ...todo, is_completed: !todo.is_completed, updated_at: new Date().toISOString() };
      setTodos((prev) => prev.map((row) => (row.id === todo.id ? updated : row)));
      setGuestData((prev) => ({
        ...prev,
        todos: (prev.todos || []).map((row) => (row.id === todo.id ? updated : row)),
      }));
      return;
    }
    const { data, error: updateError } = await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed, updated_at: new Date().toISOString() })
      .eq('id', todo.id)
      .select()
      .single();
    if (updateError) {
      console.error(updateError);
      return;
    }
    setTodos((prev) => prev.map((row) => (row.id === todo.id ? data : row)));
  };

  const handleDelete = async (todo) => {
    if (!window.confirm('Delete this item?')) return;
    if (guestMode) {
      setTodos((prev) => prev.filter((row) => row.id !== todo.id));
      setGuestData((prev) => ({
        ...prev,
        todos: (prev.todos || []).filter((row) => row.id !== todo.id),
      }));
      return;
    }
    const { error: deleteError } = await supabase.from('todos').delete().eq('id', todo.id);
    if (deleteError) {
      alert('Unable to delete item.');
      return;
    }
    setTodos((prev) => prev.filter((row) => row.id !== todo.id));
  };

  const handleUpdateTitle = async (todo, title) => {
    if (guestMode) {
      const updated = { ...todo, title, updated_at: new Date().toISOString() };
      setTodos((prev) => prev.map((row) => (row.id === todo.id ? updated : row)));
      setGuestData((prev) => ({
        ...prev,
        todos: (prev.todos || []).map((row) => (row.id === todo.id ? updated : row)),
      }));
      return;
    }
    const { data, error: updateError } = await supabase
      .from('todos')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', todo.id)
      .select()
      .single();
    if (updateError) throw updateError;
    setTodos((prev) => prev.map((row) => (row.id === todo.id ? data : row)));
  };

  const handleColorChange = async (todo, color) => {
    if (!isPremium) {
      return Promise.reject(new Error('Upgrade to change background color.'));
    }
    setColorSavingId(todo.id);
    try {
      const { data, error: updateError } = await supabase
        .from('todos')
        .update({ background_color: color, updated_at: new Date().toISOString() })
        .eq('id', todo.id)
        .select()
        .single();
      if (updateError) throw updateError;
      setTodos((prev) => prev.map((row) => (row.id === todo.id ? data : row)));
    } finally {
      setColorSavingId(null);
    }
  };

  if (authLoading || profileLoading) {
    return <LoadingSpinner label="Loading workspace…" />;
  }

  return (
    <section className="todo-page">
      <header className="todo-page-header">
        <div>
          <h1>To-Do & Goals</h1>
        </div>
      </header>
      {!user && (
        <div className="info-toast" style={{ marginBottom: '0.75rem' }}>
          You’re in guest mode. Tasks won’t be saved if you leave.{' '}
          <button
            type="button"
            onClick={() => goToSignup(guestData)}
          >
            Sign up
          </button>
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading ? (
        <LoadingSpinner label="Syncing your items…" />
      ) : (
        <div className="todo-panels">
          <div className="todo-panel">
            <TodoSection
              label="To Do"
              type="task"
              items={grouped.task || []}
              isPremium={isPremium}
              freeLimit={SECTION_CONFIG[0].limit}
              isFreeLimitReached={isFree && counts.task >= SECTION_CONFIG[0].limit}
              onAddItem={handleAdd}
              onToggleComplete={handleToggleComplete}
              onDeleteItem={handleDelete}
              onUpdateTitle={handleUpdateTitle}
              onChangeColor={handleColorChange}
              colorSavingId={colorSavingId}
            />
          </div>
          <div className="todo-panel goals">
            <TodoSection
              label="Yearly Goals"
              type="yearly"
              items={grouped.yearly || []}
              isPremium={isPremium}
              freeLimit={SECTION_CONFIG[1].limit}
              isFreeLimitReached={isFree && counts.yearly >= SECTION_CONFIG[1].limit}
              onAddItem={handleAdd}
              onToggleComplete={handleToggleComplete}
              onDeleteItem={handleDelete}
              onUpdateTitle={handleUpdateTitle}
              onChangeColor={handleColorChange}
              colorSavingId={colorSavingId}
            />
            <TodoSection
              label="Monthly Goals"
              type="monthly"
              items={grouped.monthly || []}
              isPremium={isPremium}
              freeLimit={SECTION_CONFIG[2].limit}
              isFreeLimitReached={isFree && counts.monthly >= SECTION_CONFIG[2].limit}
              onAddItem={handleAdd}
              onToggleComplete={handleToggleComplete}
              onDeleteItem={handleDelete}
              onUpdateTitle={handleUpdateTitle}
              onChangeColor={handleColorChange}
              colorSavingId={colorSavingId}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default TodoPage;
