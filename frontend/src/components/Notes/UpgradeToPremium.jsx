import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UpgradeToPremium = ({ cta = 'Upgrade to Premium', variant = 'full', className = '' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startUpgrade = async () => {
    setLoading(true);
    navigate('/upgrade');
  };

  return (
    <button
      type="button"
      onClick={startUpgrade}
      disabled={loading}
      className={['notes-upgrade-btn', `notes-upgrade-btn--${variant}`, className].filter(Boolean).join(' ')}
    >
      {loading ? 'Redirecting…' : cta}
    </button>
  );
};

export default UpgradeToPremium;
