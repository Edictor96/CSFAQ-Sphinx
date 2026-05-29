import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!form.password) errs.password = 'New password is required';
    else if (!pwRegex.test(form.password)) errs.password = 'Password does not meet requirements';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      setSuccess(true);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-card">
        <div className="success-panel">
          <svg className="success-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
            <path d="M8 12l2 2 4-4" />
          </svg>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Password reset!</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            Your password has been updated. Redirecting to login...
          </p>
          <Link to="/login" className="form-link" style={{ marginTop: '16px' }}>
            Sign in now
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="auth-card">
        <div className="success-panel">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Invalid link</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="form-link" style={{ marginTop: '16px' }}>
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h1>Set new password</h1>
        <p className="auth-subtitle">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reset-password">New Password</label>
          <div className="password-wrapper">
            <input
              id="reset-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-pw"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
          <PasswordStrengthMeter password={form.password} confirmPassword={form.confirmPassword} />
        </div>

        <div className="form-group">
          <label htmlFor="reset-confirm">Confirm Password</label>
          <div className="password-wrapper">
            <input
              id="reset-confirm"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-pw"
              onClick={() => setShowConfirm((prev) => !prev)}
              tabIndex={-1}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Resetting...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      <p className="auth-alt-link">
        <Link to="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
