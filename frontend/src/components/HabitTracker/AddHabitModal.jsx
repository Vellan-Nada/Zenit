import { useEffect, useState } from 'react';
import IconPicker from './IconPicker.jsx';

const defaultState = { name: '', icon_key: '' };

const AddHabitModal = ({ open, onClose, onSubmit, initialHabit, isPremium, limitReached }) => {
  const [form, setForm] = useState(defaultState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialHabit) {
      setForm({ name: initialHabit.name || '', icon_key: initialHabit.icon_key || '' });
    } else {
      setForm(defaultState);
    }
  }, [initialHabit, open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSubmit({ ...form, id: initialHabit?.id });
    setSaving(false);
  };

  return (
    <div className="habit-modal-backdrop" role="dialog" aria-modal="true">
      <form className="habit-modal" onSubmit={handleSubmit}>
        <div className="habit-modal-header">
          <h2>{initialHabit ? 'Edit Habit' : 'Add Habit'}</h2>
          <button type="button" className="habit-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {limitReached && !initialHabit && (
          <p className="habit-modal-limit">
            Free plan limit reached (10 habits). Upgrade to add more.
          </p>
        )}
        <label className="habit-field">
          <span>Name</span>
          <input
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Morning stretch"
            disabled={limitReached && !initialHabit}
            className="habit-input"
          />
        </label>
        <div className="habit-icon-section">
          <p>Icon</p>
          <IconPicker value={form.icon_key} onChange={(icon) => setForm((prev) => ({ ...prev, icon_key: icon }))} isPremium={isPremium} />
        </div>
        <div className="habit-modal-actions">
          <button type="button" className="secondaryButton" onClick={onClose} aria-label="Cancel">
            Cancel
          </button>
          <button
            type="submit"
            disabled={limitReached && !initialHabit}
            className="habit-primary-btn"
            aria-label={initialHabit ? 'Save changes' : 'Add habit'}
          >
            {saving ? 'Saving…' : initialHabit ? 'Save changes' : 'Create habit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddHabitModal;
