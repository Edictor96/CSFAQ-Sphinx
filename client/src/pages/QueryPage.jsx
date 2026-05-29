import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function QueryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const prefillQuestion = location.state?.question || '';

  const [form, setForm] = useState({
    question: prefillQuestion,
    category: 'general',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    'general', 'account', 'courses', 'payments', 'technical', 'certifications', 'other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim()) {
      toast.error('Please enter your question');
      return;
    }
    setLoading(true);
    try {
      await api.post('/queries', form);
      setSubmitted(true);
      toast.success('Query submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit query');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="query-page">
        <div className="query-success">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
            <path d="M8 12l2 2 4-4" />
          </svg>
          <h2>Query Submitted</h2>
          <p>We'll review your question and get back to you soon.</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard', { replace: true })} style={{ maxWidth: '280px', marginTop: '8px' }}>
            Back to FAQs
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    toast.success('Logged out');
  };

  return (
    <div className="query-page">
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            FAQ Platform
          </div>
          <div className="dash-header-right">
            <button className="dash-back-btn" onClick={() => navigate('/dashboard')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <div className="dash-user-info">
              <div className="dash-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
              <span className="dash-user-name">{user?.name}</span>
            </div>
            <button className="dash-logout-btn" onClick={handleLogout} title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main">
        <div className="query-form-container">
          <h1>Submit a Query</h1>
          <p>Didn't find what you were looking for? Let us know.</p>

          <form onSubmit={handleSubmit} className="query-form">
            <div className="form-group">
              <label htmlFor="q-question">Question</label>
              <input
                id="q-question"
                type="text"
                placeholder="What would you like to know?"
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="q-category">Category</label>
              <select
                id="q-category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="form-select"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="q-desc">Description (optional)</label>
              <textarea
                id="q-desc"
                placeholder="Provide any additional details..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Query'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
