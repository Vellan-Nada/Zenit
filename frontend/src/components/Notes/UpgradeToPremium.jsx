import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../../api/billingApi.js';
import { useAuth } from '../../hooks/useAuth.js';

const UpgradeToPremium = ({ cta = 'Upgrade to Premium', variant = 'full' }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const startUpgrade = async () => {
    if (!token) {
      navigate('/signup');
      return;
    }
    try {
      setLoading(true);
      const { url } = await createCheckoutSession('subscription', token, 'plus');
      sessionStorage.setItem('last_checkout', 'subscription');
      window.location.href = url;
    } catch (error) {
      setLoading(false);
      alert(error.message || 'Unable to launch checkout. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={startUpgrade}
      disabled={loading}
      className={`notes-upgrade-btn notes-upgrade-btn--${variant}`}
    >
      {loading ? 'Redirecting…' : cta}
    </button>
  );
};

export default UpgradeToPremium;
