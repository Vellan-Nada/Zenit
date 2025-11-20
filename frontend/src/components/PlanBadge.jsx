import { useAuth } from '../hooks/useAuth.js';

const PLAN_STYLES = {
  free: {
    border: '#e5e7eb',
    background: 'transparent',
    color: 'var(--text-muted)',
    label: 'Free plan',
  },
  plus: {
    border: '#fcd34d',
    background: '#fff7ed',
    color: '#b45309',
    label: 'Plus plan',
  },
  pro: {
    border: '#86efac',
    background: '#ecfdf3',
    color: '#15803d',
    label: 'Pro plan',
  },
};

const PlanBadge = () => {
  const { planTier, planExpiresAt } = useAuth();
  const style = PLAN_STYLES[planTier] || PLAN_STYLES.free;

  const formattedExpiry =
    planExpiresAt && new Date(planExpiresAt).getTime() > Date.now()
      ? new Date(planExpiresAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : null;

  return (
    <div
      style={{
        borderRadius: '999px',
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.color,
        fontWeight: 600,
        padding: '0.35rem 0.85rem',
        fontSize: '0.85rem',
      }}
    >
      {style.label}
      {formattedExpiry && ` • until ${formattedExpiry}`}
    </div>
  );
};

export default PlanBadge;
