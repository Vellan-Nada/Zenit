import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import styles from '../styles/AuthPage.module.css';

const AuthPage = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithProvider } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [status, setStatus] = useState({ loading: false, error: null, success: null });
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      if (mode === 'login') {
        await signIn(form);
        navigate('/');
      } else {
        await signUp(form);
        setStatus({
          loading: false,
          error: null,
          success: 'Account created! Check your inbox to confirm your email.',
        });
      }
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: null });
    }
  };

  const handleGoogleSignIn = async () => {
    setStatus((prev) => ({ ...prev, error: null, success: null }));
    setOauthLoading(true);
    try {
      await signInWithProvider('google');
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: null });
      setOauthLoading(false);
    }
  };

  const headline = mode === 'login' ? 'Welcome back to EverDay' : 'Create your EverDay account';

  return (
    <section className={styles.authWrapper}>
      <div className={styles.card}>
        <div>
          <h1>{headline}</h1>
          <p className={styles.mutedText}>Access your universal productivity space.</p>
        </div>
        <button
          type="button"
          className={styles.socialButton}
          onClick={handleGoogleSignIn}
          disabled={oauthLoading}
        >
          <span
            aria-hidden="true"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0,0,0,0.1)',
              fontWeight: 700,
              color: '#ea4335',
            }}
          >
            G
          </span>
          {oauthLoading ? 'Connecting to Google…' : 'Continue with Google'}
        </button>

        <div className={styles.divider}>
          <span>or continue with email</span>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                required
                minLength={3}
                value={form.username}
                onChange={handleChange}
                placeholder="Your display name"
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@email.com"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>
          <button className={styles.submitButton} type="submit" disabled={status.loading}>
            {status.loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>
        {status.error && <p className={styles.errorText}>{status.error}</p>}
        {status.success && <p style={{ color: 'var(--success)' }}>{status.success}</p>}
        <p className={styles.mutedText}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link to={mode === 'login' ? '/signup' : '/login'}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </Link>
        </p>
        <button type="button" className={styles.submitButton} onClick={() => navigate('/')}>
          Continue without account
        </button>
      </div>
    </section>
  );
};

export default AuthPage;
