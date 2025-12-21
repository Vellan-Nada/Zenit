import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/AuthPage.module.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { requestPasswordReset, updatePassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null, success: null });
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const checkRecovery = async () => {
      const hasRecoveryType =
        window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');
      if (!hasRecoveryType) return;
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setRecoveryMode(true);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
    });

    checkRecovery();
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  const handleRequestReset = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      await requestPasswordReset(email.trim());
      setStatus({
        loading: false,
        error: null,
        success: 'Check your email for a reset link.',
      });
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Unable to send reset email.', success: null });
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    if (password.trim().length < 6) {
      setStatus({ loading: false, error: 'Password must be at least 6 characters.', success: null });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ loading: false, error: 'Passwords do not match.', success: null });
      return;
    }
    setStatus({ loading: true, error: null, success: null });
    try {
      await updatePassword(password);
      setStatus({ loading: false, error: null, success: 'Password updated. Redirecting to login…' });
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Unable to update password.', success: null });
    }
  };

  return (
    <section className={styles.authWrapper}>
      <div className={styles.card}>
        <div>
          <h1>{recoveryMode ? 'Set a new password' : 'Reset your password'}</h1>
          <p className={styles.mutedText}>
            {recoveryMode
              ? 'Enter a new password for your account.'
              : 'We’ll email you a secure link to reset your password.'}
          </p>
        </div>

        <form onSubmit={recoveryMode ? handleUpdatePassword : handleRequestReset}>
          {recoveryMode ? (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
              />
            </div>
          )}

          <button className={styles.submitButton} type="submit" disabled={status.loading}>
            {status.loading ? 'Please wait…' : recoveryMode ? 'Update password' : 'Send reset link'}
          </button>
        </form>

        {status.error && <p className={styles.errorText}>{status.error}</p>}
        {status.success && <p style={{ color: 'var(--success)' }}>{status.success}</p>}

        <p className={styles.mutedText}>
          <Link to="/login" className={styles.inlineLink}>
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
