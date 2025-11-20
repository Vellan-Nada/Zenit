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
import { createBillingPortalSession, createCheckoutSession } from '../api/billingApi.js';
import layoutStyles from '../styles/DashboardLayout.module.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, token, profile, signOut, authLoading, isPro, planTier } = useAuth();
  const [features, setFeatures] = useState([]);
  const [featureError, setFeatureError] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleManageSubscription = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const { url } = await createBillingPortalSession(token);
      window.location.href = url;
    } catch (err) {
      console.error('Billing portal failed', err);
      setToast(err.message || 'Unable to open billing portal');
    }
  };

  const handleFeedback = () => {
    setFeedbackOpen(true);
  };

  return (
    <>
      <div className={layoutStyles.appShell}>
        <Sidebar
          isMobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onUpgradeClick={handleUpgradeClick}
          onManageSubscription={handleManageSubscription}
        />
        <main className={layoutStyles.contentArea}>
          <div className={layoutStyles.panel}>
            <div className={layoutStyles.topBar}>
              <div className={layoutStyles.mobileToggle}>
                <button
                  type="button"
                  className={layoutStyles.menuButton}
                  onClick={() => setSidebarOpen((prev) => !prev)}
                >
                  ☰
                </button>

                <h2 style={{ margin: 0, fontSize: '1.7rem' }}>
                  Hey {(profile?.username || profile?.full_name || user?.email || 'there')} 👋
                </h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Everything you need for habits, notes, focus, and inspiration—organized in one calm space.
                </p>
              </div>
              <div className={layoutStyles.topActions}>
                <PlanBadge />
                <DonationButton onDonate={handleDonate} />
                <FeedbackButton onFeedback={handleFeedback} />
                {planTier !== 'pro' && (
                  <button
                    type="button"
                    className={layoutStyles.secondaryButton}
                    onClick={handleUpgradeClick}
                  >
                    {planTier === 'plus' ? 'Go Pro' : 'See plans'}
                  </button>
                )}
                {user ? (
                  <>
                    {planTier !== 'free' && (
                      <button type="button" className={layoutStyles.secondaryButton} onClick={handleManageSubscription}>
                        Manage subscription
                      </button>
                    )}
                    <button type="button" className={layoutStyles.secondaryButton} onClick={signOut}>
                      Log out
                    </button>
                  </>
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
                  <div className="info-toast" style={{ marginBottom: '0.75rem', color: '#b91c1c' }}>
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
