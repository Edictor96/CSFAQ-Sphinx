import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import faqService from '../services/faqService';
import api from '../api/axios';

const AdminArea = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const statsData = await adminService.getStats();
      setStats(statsData);
      const { default: questionService } = await import('../services/questionService');
      const qs = await questionService.getQuestions();
      setQuestions(qs);
      const usersData = await adminService.getUsers();
      setUsers(usersData.users || []);
      const queriesData = await api.get('/queries/all');
      setQueries(queriesData.data.queries || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const { default: questionService } = await import('../services/questionService');
      await questionService.deleteQuestion(id);
      fetchData();
    } catch { alert('Failed to delete question'); }
  };

  const handlePromoteToFaq = async (q) => {
    const answerText = prompt('Enter the official answer for this FAQ:');
    if (!answerText) return;
    try {
      await faqService.createFaq({ question: q.title, answer: answerText, category: 'general' });
      alert('Successfully promoted to FAQ!');
    } catch { alert('Failed to promote to FAQ'); }
  };

  const handlePromoteUser = async (id) => {
    if (!window.confirm('Promote this user to admin?')) return;
    try {
      await adminService.promoteUser(id);
      fetchData();
    } catch { alert('Failed to promote user'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await adminService.deleteUser(id);
      fetchData();
    } catch { alert('Failed to delete user'); }
  };

  const handleResolveQuery = async (id, response) => {
    try {
      await api.patch(`/queries/${id}/respond`, { response, status: 'resolved' });
      fetchData();
    } catch { alert('Failed to resolve query'); }
  };

  const handlePromoteQueryToFaq = async (q) => {
    const answerText = prompt('Enter the official answer for this FAQ:');
    if (!answerText) return;
    try {
      await faqService.createFaq({ question: q.question, answer: answerText, category: 'general' });
      await api.patch(`/queries/${q._id}/respond`, { status: 'resolved', response: answerText });
      alert('Promoted to FAQ and marked resolved!');
      fetchData();
    } catch { alert('Failed to promote query to FAQ'); }
  };

  const handleDeleteQuery = async (id) => {
    if (!window.confirm('Delete this query?')) return;
    try {
      await api.delete(`/queries/${id}`);
      fetchData();
    } catch { alert('Failed to delete query'); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading admin area...</div>;
  if (error) return <div className="alert-error">{error}</div>;

  const tabs = ['overview', 'questions', 'users', 'unresolved queries'];
  const openQueries = queries.filter(q => q.status === 'open');

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Admin Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage users, questions, and content</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Users', value: stats.totalUsers, tab: 'users', color: '#6366f1' },
            { label: 'Total Questions', value: stats.totalQuestions, tab: 'questions', color: '#f59e0b' },
            { label: 'Total Answers', value: stats.totalAnswers, tab: null, color: '#10b981' },
            { label: 'Total FAQs', value: stats.totalFaqs, tab: null, color: '#3b82f6' },
            { label: 'Unresolved', value: openQueries.length, tab: 'unresolved queries', color: '#ef4444' },
          ].map(({ label, value, tab, color }) => (
            <div key={label} onClick={() => tab && setActiveTab(tab)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '20px 24px',
                cursor: tab ? 'pointer' : 'default',
                transition: 'all 0.2s',
                borderLeft: `4px solid ${color}`
              }}
              onMouseOver={e => { if (tab) e.currentTarget.style.borderColor = color; }}
              onMouseOut={e => { if (tab) e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
              {tab && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Click to view →</div>}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', border: 'none', background: 'transparent',
            fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            textTransform: 'capitalize', transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}>
            {tab}
            {tab === 'unresolved queries' && openQueries.length > 0 && (
              <span style={{
                marginLeft: 6, background: '#ef4444', color: '#fff',
                borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700
              }}>{openQueries.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <h4 style={{ marginBottom: 12, fontSize: 15 }}>Recent Questions</h4>
            {questions.slice(0, 3).map(q => (
              <div key={q._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{q.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Status: {q.status}</div>
              </div>
            ))}
            <button onClick={() => setActiveTab('questions')} style={{ marginTop: 12, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <h4 style={{ marginBottom: 12, fontSize: 15 }}>Recent Unresolved Queries</h4>
            {openQueries.slice(0, 3).map(q => (
              <div key={q._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{q.question}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                  {q.user?.name || 'Unknown'} · {new Date(q.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {openQueries.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No unresolved queries 🎉</p>}
            <button onClick={() => setActiveTab('unresolved queries')} style={{ marginTop: 12, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {questions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No questions yet.</p>}
          {questions.map(q => (
            <div key={q._id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{q.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: q.status === 'answered' ? 'rgba(16,185,129,0.1)' : 'rgba(217,119,6,0.1)',
                    color: q.status === 'answered' ? 'var(--success)' : 'var(--warning)'
                  }}>{q.status?.toUpperCase()}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handlePromoteToFaq(q)} style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)',
                  background: 'rgba(16,185,129,0.08)', color: 'var(--success)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                }}>⬆ Promote to FAQ</button>
                <button onClick={() => handleDeleteQuestion(q._id)} style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)',
                  background: 'rgba(220,38,38,0.08)', color: 'var(--error)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                }}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No users found.</p>}
          {users.map(u => (
            <div key={u._id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-light)',
                  color: 'var(--accent)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0
                }}>{u.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: u.role === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                  color: u.role === 'admin' ? 'var(--accent)' : 'var(--success)'
                }}>{u.role}</span>
                {u.role !== 'admin' && (
                  <button onClick={() => handlePromoteUser(u._id)} style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)',
                    background: 'rgba(99,102,241,0.08)', color: 'var(--accent)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                  }}>⬆ Promote</button>
                )}
                <button onClick={() => handleDeleteUser(u._id)} style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)',
                  background: 'rgba(220,38,38,0.08)', color: 'var(--error)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                }}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unresolved Queries Tab */}
      {activeTab === 'unresolved queries' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {queries.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No unresolved queries 🎉</p>}
          {queries.map(q => (
            <div key={q._id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex',
              flexDirection: 'column', gap: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{q.question}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: q.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: q.status === 'resolved' ? 'var(--success)' : '#ef4444'
                    }}>{q.status?.toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {q.user?.name || 'Unknown'} · {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handlePromoteQueryToFaq(q)} style={{
                    padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)',
                    background: 'rgba(16,185,129,0.08)', color: 'var(--success)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                  }}>⬆ Promote to FAQ</button>
                  {q.status !== 'resolved' && (
                    <button onClick={() => {
                      const response = prompt('Enter your response to this query:');
                      if (response) handleResolveQuery(q._id, response);
                    }} style={{
                      padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)',
                      background: 'rgba(99,102,241,0.08)', color: 'var(--accent)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                    }}>✓ Respond & Resolve</button>
                  )}
                  <button onClick={() => handleDeleteQuery(q._id)} style={{
                    padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)',
                    background: 'rgba(220,38,38,0.08)', color: 'var(--error)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                  }}>🗑 Delete</button>
                </div>
              </div>
              {q.adminResponse && (
                <div style={{
                  background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)',
                  borderLeft: '3px solid var(--accent)'
                }}>
                  <strong>Admin response:</strong> {q.adminResponse}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminArea;