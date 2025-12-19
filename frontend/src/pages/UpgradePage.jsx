import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { createBillingPortalSession, createCheckoutSession } from '../api/billingApi.js';
import PlanBadge from '../components/PlanBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const tierRank = { free: 0, plus: 1 };

const PLAN_CARDS = [
  {
    tier: 'free',
    title: 'Free',
    price: '$0',
    accent: '#f8fafc',
    features: [
      'Core tools: Habits, Notes, To-Dos, Pomodoro, Source Dump, Journal, Reading & Movies/Series lists',
      'Limits: 7 habits • 15 notes • 10 to-dos + 5 yearly & monthly goals • 7 reading + 7 watch items per column • 7 Source Dump items (no screenshots)',
      'Not included: Pomodoro reports • Journaling reports • Card color customization',
    ],
  },
  {
    tier: 'plus',
    title: 'Plus',
    price: '$5/month',
    accent: '#0f172a',
    highlight: true,
    features: [
      'Unlimited habits, notes, to-dos, reading list, movies/series, and source dumps',
      'Save screenshots in Source Dump',
      'Pomodoro usage reports (trends, totals, streaks)',
      'Journaling reports (patterns, consistency, summaries)',
      'Card color customization across features',
    ],
  },
];

const UpgradePage = () => {
  const navigate = useNavigate();
  const { user, token, planTier, planRank, planExpiresAt, profileLoading } = useAuth();
  const [status, setStatus] = useState({ checkout: null, portal: null, error: null });

  const ensureSignedIn = () => {
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const startCheckout = async (tier) => {
    if (!ensureSignedIn()) return;
    if (planTier === tier) return;
    try {
      setStatus((prev) => ({ ...prev, checkout: tier, error: null }));
      const { url } = await createCheckoutSession('subscription', token, tier);
      sessionStorage.setItem('last_checkout', 'subscription');
      window.location.href = url;
    } catch (err) {
      setStatus((prev) => ({ ...prev, checkout: null, error: err.message || 'Unable to start checkout' }));
    }
  };

  const startDonation = async () => {
    if (!ensureSignedIn()) return;
    try {
      setStatus((prev) => ({ ...prev, checkout: 'donation', error: null }));
      const { url } = await createCheckoutSession('donation', token);
      sessionStorage.setItem('last_checkout', 'donation');
      window.location.href = url;
    } catch (err) {
      setStatus((prev) => ({ ...prev, checkout: null, error: err.message || 'Unable to start donation' }));
    }
  };

  const openBillingPortal = async () => {
    if (!ensureSignedIn()) return;
    try {
      setStatus((prev) => ({ ...prev, portal: 'loading', error: null }));
      const { url } = await createBillingPortalSession(token);
      window.location.href = url;
    } catch (err) {
      setStatus((prev) => ({ ...prev, portal: null, error: err.message || 'Unable to open portal' }));
    }
  };

  const formattedExpiry =
    planExpiresAt && new Date(planExpiresAt).getTime() > Date.now()
      ? new Date(planExpiresAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header style={{ marginBottom: '0.75rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Choose the focus you need</h1>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {PLAN_CARDS.map((plan) => {
          const isCurrent = planTier === plan.tier;
          const alreadyIncluded = planRank > tierRank[plan.tier];
          const disabled = isCurrent || alreadyIncluded || status.checkout === plan.tier || plan.tier === 'free';
          return (
            <div
              key={plan.tier}
              style={{
                borderRadius: '1rem',
                padding: '2.2rem',
                background: plan.highlight ? plan.accent : '#fff',
                color: plan.highlight ? '#fff' : '#0f172a',
                border: plan.highlight ? '1px solid #0d162a' : '1px solid var(--border)',
                boxShadow: plan.highlight ? '0 35px 80px rgba(0,0,0,0.25)' : '0 10px 24px rgba(15,23,42,0.08)',
                position: 'relative',
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '0.35rem' }}>{plan.title}</h2>
              <p style={{ color: plan.highlight ? 'rgba(255,255,255,0.82)' : 'var(--text-muted)', margin: '0 0 0.9rem' }}>
                {plan.subtitle}
              </p>
              <p style={{ fontSize: '2.4rem', fontWeight: 700, margin: '0.5rem 0 1.25rem' }}>{plan.price}</p>
              <ul
                style={{
                  listStyle: 'none',
                  paddingLeft: 0,
                  color: plan.highlight ? 'rgba(255,255,255,0.9)' : '#38383aff',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {plan.features.map((perk) => (
                  <li
                    key={perk}
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        marginTop: '0.15rem',
                        width: '1.1rem',
                        height: '1.1rem',
                        borderRadius: '50%',
                        border: `1px solid ${plan.highlight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.2)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: plan.highlight ? '#fff' : '#0f172a',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              {plan.tier !== 'free' && (
                <button
                  type="button"
                  onClick={() => startCheckout(plan.tier)}
                  disabled={disabled}
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    borderRadius: '0.9rem',
                    border: plan.highlight ? '1px solid #fff' : 'none',
                    padding: '0.85rem 1rem',
                    background: plan.highlight ? '#fff' : '#0f172a',
                    color: plan.highlight ? '#0f172a' : '#fff',
                    fontWeight: 700,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  {isCurrent
                    ? 'Current plan'
                    : alreadyIncluded
                    ? 'Included in your plan'
                    : status.checkout === plan.tier
                    ? 'Redirecting…'
                    : 'Upgrade to Plus'}
                </button>
              )}
              {isCurrent && formattedExpiry && (
                <p
                  style={{
                    marginTop: '0.5rem',
                    color: plan.highlight ? 'rgba(255,255,255,0.92)' : 'var(--text-muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  Active until {formattedExpiry}.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <PlanBadge />
          {user ? <span style={{ color: 'var(--text-muted)' }}>{user.email}</span> : <span>Guest session</span>}
        </div>
        {profileLoading ? (
          <LoadingSpinner label="Checking plan…" />
        ) : (
          <>
            <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
              Cancel anytime. Canceling keeps your paid features until the period ends.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type='button'
                onClick={openBillingPortal}
                disabled={planTier === 'free' || status.portal === 'loading'}
                style={{
                  borderRadius: '0.85rem',
                  border: '1px solid var(--border)',
                  padding: '0.75rem 1.2rem',
                  background: '#fff',
                  cursor: planTier === 'free' ? 'not-allowed' : 'pointer',
                  opacity: planTier === 'free' ? 0.6 : 1,
                }}
              >
                {status.portal === 'loading' ? 'Opening portal…' : 'Manage subscription'}
              </button>
              <button
                type="button"
                onClick={startDonation}
                disabled={status.checkout === 'donation'}
                style={{
                  borderRadius: '0.85rem',
                  border: 'none',
                  padding: '0.75rem 1.2rem',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#b91c1c',
                  opacity: status.checkout === 'donation' ? 0.7 : 1,
                  cursor: status.checkout === 'donation' ? 'not-allowed' : 'pointer',
                }}
              >
                {status.checkout === 'donation' ? 'Redirecting…' : 'Donate $5 ❤️'}
              </button>
            </div>
            {!user && (
              <p style={{ color: 'var(--danger)', marginTop: '0.75rem' }}>
                Sign in to upgrade.
              </p>
            )}
            {status.error && <p style={{ color: 'var(--danger)', marginTop: '0.75rem' }}>{status.error}</p>}
          </>
        )}
      </div>
    </section>
  );
};

export default UpgradePage;
