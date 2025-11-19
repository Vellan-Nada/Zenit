import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import DonationButton from '../components/DonationButton.jsx';
import FeedbackButton from '../components/FeedbackButton.jsx';
import FeedbackModal from '../components/FeedbackModal.jsx';
import AnnouncementBanner from '../components/AnnouncementBanner.jsx';
import PlanBadge from '../components/PlanBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { fetchFeatures } from '../api/featureApi.js';
import { createCheckoutSession } from '../api/billingApi.js';
import layoutStyles from '../styles/DashboardLayout.module.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, token, signOut, authLoading, isPro } = useAuth();
  const [features, setFeatures] = useState([]);
  const [featureError, setFeatureError] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const { features: data } = await fetchFeatures();
        setFeatures(data);
      } catch (err) {
        console.error('Failed to load features', err);
        setFeatureError('Unable to load feature catalog');
      }
    };
    loadFeatures();
  }, []);

  const handleDonate = async () => {
    if (!token) {
      setToast('Please log in to donate so we can send you a receipt.');
      return;
    }
    try {
      const { url } = await createCheckoutSession('donation', token);
      window.location.href = url;
    } catch (err) {
      console.error('Donation failed', err);
      setToast(err.message || 'Unable to start donation checkout');
    }
  };

  const handleUpgradeClick = () => {
    navigate('/upgrade');
  };

  const handleFeedback = () => {
    setFeedbackOpen(true);
  };

  return (
    <>
      <div className={layoutStyles.appShell}>
        <Sidebar onUpgradeClick={handleUpgradeClick} />
        <main className={layoutStyles.contentArea}>
          <div className={layoutStyles.panel}>
            <div className={layoutStyles.topBar}>
              <div>
                <h2 style={{ margin: 0 }}>Hey {user?.email || 'there'} 👋</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Stay consistent with habits, tasks, and mindful focus in one tab.
                </p>
              </div>
              <div className={layoutStyles.topActions}>
                <PlanBadge />
                <DonationButton onDonate={handleDonate} />
                <FeedbackButton onFeedback={handleFeedback} />
                <button
                  type="button"
                  className={layoutStyles.secondaryButton}
                  onClick={handleUpgradeClick}
                  disabled={isPro}
                  style={isPro ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  {isPro ? 'Pro active' : 'Upgrade'}
                </button>
                {user ? (
                  <button type="button" className={layoutStyles.secondaryButton} onClick={signOut}>
                    Log out
                  </button>
                ) : (
                  <button type="button" className={layoutStyles.secondaryButton} onClick={() => navigate('/login')}>
                    Log in
                  </button>
                )}
              </div>
            </div>
            {toast && (
              <div className="info-toast" style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                {toast}{' '}
                <button type="button" onClick={() => setToast(null)} style={{ marginLeft: '0.5rem' }}>
                  Dismiss
                </button>
              </div>
            )}
            <AnnouncementBanner signedIn={Boolean(user)} />
            {authLoading ? (
              <LoadingSpinner label="Checking session…" />
            ) : (
              <div className={layoutStyles.panelBody}>
                {featureError && (
                  <div
                    className="info-toast"
                    style={{ marginBottom: '0.75rem', background: 'rgba(239,68,68,0.08)', color: '#b91c1c' }}
                  >
                    Unable to load feature catalog. You can still explore the dashboard, but some previews might be missing.
                  </div>
                )}
                <Outlet context={{ features, featureError }} />
              </div>
            )}
          </div>
        </main>
      </div>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
};

export default DashboardLayout;
