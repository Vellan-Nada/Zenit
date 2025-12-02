import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const STATUS_COPY = {
  success: {
    title: 'Payment confirmed 🎉',
    description: 'Your EverDay Plus plan is now active. You can return to the dashboard.',
    action: 'Return to dashboard',
  },
  cancel: {
    title: 'Checkout canceled',
    description: 'No charge was made. You can always restart checkout whenever you are ready.',
    action: 'Try again',
  },
  donation: {
    title: 'Donation received 🙏',
    description: 'Thank you for supporting EverDay!',
    action: 'Return to Dashboard',
  },
};

const UpgradeStatusPage = ({ status }) => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const copy = STATUS_COPY[status] || STATUS_COPY.success;

  useEffect(() => {
    const last = sessionStorage.getItem('last_checkout');
    if (!last) {
      navigate('/upgrade', { replace: true });
      return;
    }
    sessionStorage.removeItem('last_checkout');
    if (status === 'success') {
      refreshProfile();
    }
  }, [status, refreshProfile]);

  const goBack = () => {
    if (status === 'success' || status === 'donation') {
      navigate('/', { replace: true });
    } else {
      navigate('/upgrade', { replace: true });
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div
        style={{
          margin: '0 auto',
          maxWidth: '460px',
          background: '#fff',
          borderRadius: '1.25rem',
          padding: '2rem',
          boxShadow: '0 30px 80px rgba(15, 23, 42, 0.15)',
        }}
      >
        <h1 style={{ marginBottom: '0.5rem' }}>{copy.title}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{copy.description}</p>
        <button
          type="button"
          onClick={goBack}
          style={{
            marginTop: '1.5rem',
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: '#fff',
            borderRadius: '0.9rem',
            padding: '0.85rem 1.5rem',
            fontWeight: 600,
          }}
        >
          {copy.action}
        </button>
      </div>
    </div>
  );
};

export default UpgradeStatusPage;
