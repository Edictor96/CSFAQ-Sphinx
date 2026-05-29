import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setSent(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
      toast.success('Password reset link sent!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Try again later.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-card">
        <div className="success-panel">
          <svg className="success-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
            <path d="M8 12l2 2 4-4" />
          </svg>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Check your email</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
            If an account with <strong>{email}</strong> exists, we've sent a password reset link.
          </p>
          {resetUrl && (
            <div style={{ marginTop: '8px', padding: '12px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all', fontSize: '13px' }}>
              <strong>Dev mode:</strong> Reset link:<br />
              <a href={resetUrl} style={{ color: 'var(--accent)' }}>{resetUrl}</a>
            </div>
          )}
          <Link to="/login" className="form-link" style={{ marginTop: '16px', fontSize: '14px' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h1>Forgot password?</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            className={error ? 'input-error' : ''}
            autoComplete="email"
          />
          {error && <span className="field-error">{error}</span>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Sending...
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

      <p className="auth-alt-link">
        Remember your password? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
