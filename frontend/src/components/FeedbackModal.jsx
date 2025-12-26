import { useEffect, useState } from 'react';
import modalStyles from '../styles/Modal.module.css';
import { submitFeedback } from '../api/feedbackApi.js';
import { useAuth } from '../hooks/useAuth.js';

const FeedbackModal = ({ open, onClose }) => {
  const { token } = useAuth();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    if (!open) {
      setMessage('');
      setStatus({ loading: false, error: null, success: null });
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      setStatus({ loading: false, error: 'Feedback cannot be empty', success: null });
      return;
    }
    try {
      setStatus({ loading: true, error: null, success: null });
      await submitFeedback(message.trim(), token);
      setStatus({ loading: false, error: null, success: 'Thank you for your feedback!' });
      setMessage('');
      setTimeout(() => {
        onClose();
        setStatus({ loading: false, error: null, success: null });
      }, 1000);
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Unable to submit feedback', success: null });
    }
  };

  return (
    <div className={modalStyles.backdrop} role="dialog" aria-modal="true">
      <div className={modalStyles.modal}>
        <h2>Share your thoughts</h2>
        <form onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="feedback-textarea">
            Feedback
          </label>
          <textarea
            id="feedback-textarea"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Your experience, feature wish, or problems encountered..."
          />
          {status.error && <p style={{ color: 'var(--danger)' }}>{status.error}</p>}
          {status.success && <p style={{ color: 'var(--success)' }}>{status.success}</p>}
          <div className={modalStyles.actions}>
            <button type="button" className={modalStyles.ghostButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={modalStyles.primaryButton} disabled={status.loading}>
              {status.loading ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
