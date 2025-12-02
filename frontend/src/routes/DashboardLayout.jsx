import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import DonationButton from '../components/DonationButton.jsx';
import FeedbackButton from '../components/FeedbackButton.jsx';
import FeedbackModal from '../components/FeedbackModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useGuest } from '../context/GuestContext.jsx';
import { fetchFeatures } from '../api/featureApi.js';
import { createBillingPortalSession, createCheckoutSession } from '../api/billingApi.js';
import layoutStyles from '../styles/DashboardLayout.module.css';
import { supabase } from '../lib/supabaseClient.js';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, token, profile, signOut, authLoading, isPro, planTier } = useAuth();
  const { guestData, setGuestData } = useGuest();
  const [features, setFeatures] = useState([]);
  const [featureError, setFeatureError] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const migratedRef = useRef(false);

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

  // Migrate guest data into the signed-in account once after login, via backend upsert to avoid duplicates
  useEffect(() => {
    const migrate = async () => {
      if (!user || migratedRef.current) return;
      if (!guestData || Object.keys(guestData).length === 0) return;
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/migrate/guest-to-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, guestData }),
        });
        if (!res.ok) {
          console.error('Failed to migrate guest data', await res.text());
          return;
        }
        // refresh data after migration
        window.location.reload();
      } catch (err) {
        console.error('Failed to migrate guest data', err);
      } finally {
        sessionStorage.removeItem('everday_guest_data');
        setGuestData({});
        migratedRef.current = true;
      }
    };
    migrate();
  }, [user, guestData, setGuestData]);

  const handleDonate = async () => {
    if (!token) {
      setToast('Please log in to donate so we can send you a receipt.');
      return;
    }
    try {
      sessionStorage.setItem('last_checkout', 'donation');
      const { url } = await createCheckoutSession('donation', token);
      window.location.href = url;
    } catch (err) {
      console.error('Donation failed', err);
      setToast(err.message || 'Unable to start donation checkout');
    }
  };

  const handleQuickUpgrade = async () => {
    // Guest -> signup
    if (!user) {
      navigate('/signup');
      return;
    }
    // Free members -> start Plus checkout directly
    if (planTier === 'free') {
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const { url } = await createCheckoutSession('plus', token);
        sessionStorage.setItem('last_checkout', 'subscription');
        window.location.href = url;
        return;
      } catch (err) {
        console.error('Upgrade failed', err);
        setToast(err.message || 'Unable to start upgrade checkout');
      }
    }
    // Fallback to upgrade page
    navigate('/upgrade');
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
    if (!user) {
      navigate('/signup');
      setToast('Create a free account to share feedback and save your workspace.');
      return;
    }
    setFeedbackOpen(true);
  };

  // Warn guests about unsaved data on exit
  useEffect(() => {
    if (user) return;
    const hasGuestData =
      (guestData.notes && guestData.notes.length > 0) ||
      (guestData.todos && guestData.todos.length > 0) ||
      (guestData.habits && guestData.habits.length > 0) ||
      (guestData.habitLogs && Object.keys(guestData.habitLogs).length > 0) ||
      (guestData.readingList && guestData.readingList.length > 0) ||
      (guestData.movieItems && guestData.movieItems.length > 0) ||
      (guestData.journalEntries && guestData.journalEntries.length > 0) ||
      (guestData.sourceDumps && guestData.sourceDumps.length > 0);
    if (!hasGuestData) return;
    const handler = (e) => {
      if (window.__suppressLeaveWarning) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [user, guestData]);

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
          <div className={layoutStyles.topRail}>
            <div className={layoutStyles.mobileToggle}>
              <button
                type="button"
                className={layoutStyles.menuButton}
                onClick={() => setSidebarOpen((prev) => !prev)}
              >
                ☰
              </button>

              <h2 style={{ margin: 0, fontSize: '1.6rem' }}>
                Hey {(profile?.username || profile?.full_name || user?.user_metadata?.username || user?.user_metadata?.full_name || 'there')} 👋
              </h2>
          </div>
            <div className={layoutStyles.topActions}>
              {(!user || planTier === 'free') && (
              <div className={layoutStyles.tooltipWrapper}>
                <button
                  type="button"
                  className={layoutStyles.secondaryButton}
                  onClick={handleQuickUpgrade}
                >
                  Upgrade
                </button>
                <div className={layoutStyles.tooltip}>Upgrade to Plus to enjoy all perks.</div>
              </div>
              )}
              <DonationButton onDonate={handleDonate} />
            <FeedbackButton onFeedback={handleFeedback} />
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

          <div className={layoutStyles.panel}>
            {toast && (
              <div className="info-toast" style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                {toast}{' '}
                <button type="button" onClick={() => setToast(null)} style={{ marginLeft: '0.5rem' }}>
                  Dismiss
                </button>
              </div>
            )}
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
