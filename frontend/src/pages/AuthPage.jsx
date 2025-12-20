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
          <svg
            aria-hidden="true"
            className={styles.googleIcon}
            viewBox="0 0 256 262"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M255.68 133.5c0-10.9-.9-18.9-2.9-27.1H130.9v49.3h71.9c-1.4 11.9-9 29.8-26 41.8l-.2 1.6 37.8 29.2 2.6.3c23.8-22 37.7-54.5 37.7-95.1"
              fill="#4285F4"
            />
            <path
              d="M130.9 261.1c34.3 0 63.1-11.3 84.1-30.8l-40.1-31c-10.7 7.4-25 12.6-44 12.6-33.6 0-62.1-22-72.3-52.4l-1.5.1-39.3 30.4-.5 1.4c20.5 40.8 62.5 69.7 113.7 69.7"
              fill="#34A853"
            />
            <path
              d="M58.6 159.5c-2.7-8.2-4.3-16.9-4.3-25.9 0-9 1.6-17.7 4.2-25.9l-.1-1.7-39.7-30.9-1.3.6C6.4 92.7 0 111.2 0 132.5s6.4 39.8 17.5 56.8l41.1-29.8"
              fill="#FBBC05"
            />
            <path
              d="M130.9 50.5c23.8 0 39.8 10.3 49 18.9l35.8-34C194 12.8 165.2 0 130.9 0 79.7 0 37.7 28.9 17.5 69.3l41 30.9c10.5-30.5 38.9-49.7 72.4-49.7"
              fill="#EA4335"
            />
          </svg>
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
          <Link
            to={mode === 'login' ? '/signup' : '/login'}
            className={styles.inlineLink}
          >
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
